import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { HmrcApiClient } from '@/lib/services/hmrc/hmrcApiClient';
import { SubmissionService } from '@/lib/services/submissionService';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const taxYear = searchParams.get('taxYear');
    const submissionId = searchParams.get('submissionId');
    const hmrcReference = searchParams.get('hmrcReference');
    const submissionType = searchParams.get('type') || 'personal'; // 'personal' or 'company'
    const includeReceipts = searchParams.get('includeReceipts') === 'true';

    // Validate required parameters - need at least one identifier
    if (!taxYear && !submissionId && !hmrcReference) {
      return NextResponse.json(
        { error: 'Missing required parameter: taxYear, submissionId, or hmrcReference' },
        { status: 400 }
      );
    }

    // Validate tax year format if provided
    if (taxYear && !/^\d{4}-\d{2}$/.test(taxYear)) {
      return NextResponse.json(
        { error: 'Invalid tax year format. Expected format: YYYY-YY (e.g., 2023-24)' },
        { status: 400 }
      );
    }

    if (!['personal', 'company'].includes(submissionType)) {
      return NextResponse.json(
        { error: 'Invalid submission type. Must be "personal" or "company"' },
        { status: 400 }
      );
    }

    const hmrcClient = new HmrcApiClient();
    const submissionService = SubmissionService.getInstance();

    try {
      let returns = [];
      let localSubmissions = [];

      // Get local submissions first for reference
      let submissionQuery = supabase
        .from('tax_submissions')
        .select('*')
        .eq('user_id', user.id);

      if (submissionId) {
        submissionQuery = submissionQuery.eq('id', submissionId);
      } else if (hmrcReference) {
        submissionQuery = submissionQuery.eq('hmrc_reference', hmrcReference);
      } else if (taxYear) {
        submissionQuery = submissionQuery.eq('tax_year', taxYear);
      }

      const { data: localData } = await submissionQuery.order('created_at', { ascending: false });
      localSubmissions = localData || [];

      // Try to get returns from HMRC
      if (hmrcReference) {
        // Get specific return by HMRC reference
        const returnResponse = await hmrcClient.executeRequest(
          user.id,
          'GET',
          `/individuals/self-assessment/${hmrcReference}`
        );

        if (returnResponse) {
          returns = [returnResponse];
        }
      } else if (taxYear) {
        // Get all returns for the tax year
        const returnsResponse = await hmrcClient.executeRequest(
          user.id,
          'GET',
          `/individuals/self-assessment?taxYear=${taxYear}`
        );

        returns = (returnsResponse as any)?.returns || [];
      }

      // Enhance returns with local data and metadata
      const enhancedReturns = await Promise.all(
        returns.map(async (returnData: any) => {
          // Find matching local submission
          const localSubmission = localSubmissions.find((sub: any) => 
            sub.hmrc_reference === returnData.submissionReference ||
            sub.hmrc_reference === returnData.calculationId
          );

                     // Get submission status if available
           let statusHistory: any[] = [];
           let receipts: any[] = [];

          if (localSubmission) {
            statusHistory = await submissionService.getSubmissionStatus(localSubmission.id, user.id);
            
            if (includeReceipts) {
              receipts = await submissionService.getSubmissionReceipts(localSubmission.id, user.id);
            }
          }

          return {
            ...returnData,
            submissionType,
            localSubmission: localSubmission ? {
              id: localSubmission.id,
              status: localSubmission.status,
              submittedAt: localSubmission.submitted_at,
              calculationData: localSubmission.calculation_data,
              retryCount: localSubmission.retry_count || 0
            } : null,
            statusHistory,
            receipts: includeReceipts ? receipts : undefined,
            isFromHMRC: true,
            lastUpdated: returnData.lastUpdated || new Date().toISOString(),
            canAmend: returnData.status === 'accepted' && !returnData.isAmended,
            amendmentDeadline: returnData.status === 'accepted' ? 
              calculateAmendmentDeadline(returnData.taxYear) : null
          };
        })
      );

      // If no HMRC returns found, use local submissions as fallback
      if (enhancedReturns.length === 0 && localSubmissions.length > 0) {
        const fallbackReturns = await Promise.all(
          localSubmissions.map(async (submission: any) => {
            let statusHistory = [];
            let receipts = [];

            try {
              statusHistory = await submissionService.getSubmissionStatus(submission.id, user.id);
              
              if (includeReceipts) {
                receipts = await submissionService.getSubmissionReceipts(submission.id, user.id);
              }
            } catch (error) {
              console.warn('Error getting submission details:', error);
            }

            return {
              submissionReference: submission.hmrc_reference || `local-${submission.id}`,
              taxYear: submission.tax_year,
              submissionType: submission.submission_type,
              status: submission.status,
              submittedDate: submission.submitted_at,
              calculationData: submission.calculation_data,
              localSubmission: {
                id: submission.id,
                status: submission.status,
                submittedAt: submission.submitted_at,
                calculationData: submission.calculation_data,
                retryCount: submission.retry_count || 0
              },
              statusHistory,
              receipts: includeReceipts ? receipts : undefined,
              isFromHMRC: false,
              isFromCache: true,
              lastUpdated: submission.updated_at,
              canAmend: submission.status === 'submitted',
              amendmentDeadline: submission.status === 'submitted' ? 
                calculateAmendmentDeadline(submission.tax_year) : null
            };
          })
        );

        return NextResponse.json({
          success: true,
          returns: fallbackReturns,
          summary: {
            total: fallbackReturns.length,
            submitted: fallbackReturns.filter((r: any) => r.status === 'submitted').length,
            accepted: fallbackReturns.filter((r: any) => r.status === 'accepted').length,
            rejected: fallbackReturns.filter((r: any) => r.status === 'rejected').length,
            canAmend: fallbackReturns.filter((r: any) => r.canAmend).length
          },
          filters: {
            taxYear,
            submissionId,
            hmrcReference,
            submissionType,
            includeReceipts
          },
          fromCache: true,
          warning: 'Data retrieved from local cache due to HMRC service unavailability'
        });
      }

      // Sort returns by submission date (most recent first)
      enhancedReturns.sort((a: any, b: any) => {
        const dateA = new Date(a.submittedDate || a.lastUpdated);
        const dateB = new Date(b.submittedDate || b.lastUpdated);
        return dateB.getTime() - dateA.getTime();
      });

      // Get summary statistics
      const summary = {
        total: enhancedReturns.length,
        submitted: enhancedReturns.filter((r: any) => r.status === 'submitted').length,
        accepted: enhancedReturns.filter((r: any) => r.status === 'accepted').length,
        rejected: enhancedReturns.filter((r: any) => r.status === 'rejected').length,
        canAmend: enhancedReturns.filter((r: any) => r.canAmend).length
      };

      return NextResponse.json({
        success: true,
        returns: enhancedReturns,
        summary,
        filters: {
          taxYear,
          submissionId,
          hmrcReference,
          submissionType,
          includeReceipts
        },
        fromCache: false
      });

    } catch (error) {
      console.error('Error fetching returns from HMRC:', error);
      
             // Fallback to local submissions only
       const fallbackReturns = await Promise.all(
         (localSubmissions || []).map(async (submission: any) => {
          let statusHistory = [];
          let receipts = [];

          try {
            statusHistory = await submissionService.getSubmissionStatus(submission.id, user.id);
            
            if (includeReceipts) {
              receipts = await submissionService.getSubmissionReceipts(submission.id, user.id);
            }
          } catch (error) {
            console.warn('Error getting submission details:', error);
          }

          return {
            submissionReference: submission.hmrc_reference || `local-${submission.id}`,
            taxYear: submission.tax_year,
            submissionType: submission.submission_type,
            status: submission.status,
            submittedDate: submission.submitted_at,
            calculationData: submission.calculation_data,
            localSubmission: {
              id: submission.id,
              status: submission.status,
              submittedAt: submission.submitted_at,
              calculationData: submission.calculation_data,
              retryCount: submission.retry_count || 0
            },
            statusHistory,
            receipts: includeReceipts ? receipts : undefined,
            isFromHMRC: false,
            isFromCache: true,
            lastUpdated: submission.updated_at,
            canAmend: submission.status === 'submitted',
            amendmentDeadline: submission.status === 'submitted' ? 
              calculateAmendmentDeadline(submission.tax_year) : null
          };
        })
      );

      return NextResponse.json({
        success: true,
        returns: fallbackReturns,
        summary: {
          total: fallbackReturns.length,
          submitted: fallbackReturns.filter((r: any) => r.status === 'submitted').length,
          accepted: fallbackReturns.filter((r: any) => r.status === 'accepted').length,
          rejected: fallbackReturns.filter((r: any) => r.status === 'rejected').length,
          canAmend: fallbackReturns.filter((r: any) => r.canAmend).length
        },
        filters: {
          taxYear,
          submissionId,
          hmrcReference,
          submissionType,
          includeReceipts
        },
        fromCache: true,
        warning: 'Data retrieved from local cache due to HMRC service unavailability'
      });
    }

  } catch (error) {
    console.error('Error in view-return API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate amendment deadline
function calculateAmendmentDeadline(taxYear: string): string {
  const [startYear] = taxYear.split('-');
  const year = parseInt(startYear);
  
  // Amendment deadline is typically 12 months after the original filing deadline
  // For Self Assessment: 31st January + 12 months = 31st January following year
  return `${year + 2}-01-31`;
} 