import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { HmrcApiClient } from '@/lib/services/hmrc/hmrcApiClient';

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
    const obligationType = searchParams.get('type') || 'all'; // 'personal', 'company', or 'all'
    const status = searchParams.get('status'); // 'open', 'fulfilled', or undefined for all

    // Validate tax year format (YYYY-YY)
    if (taxYear && !/^\d{4}-\d{2}$/.test(taxYear)) {
      return NextResponse.json(
        { error: 'Invalid tax year format. Expected format: YYYY-YY (e.g., 2023-24)' },
        { status: 400 }
      );
    }

    const hmrcClient = new HmrcApiClient();

    try {
      // Get tax obligations from HMRC
      const obligationsResponse = await hmrcClient.getTaxObligations(user.id);

      if (!obligationsResponse.success) {
        return NextResponse.json(
          { 
            error: obligationsResponse.error,
            errorCode: obligationsResponse.errorCode,
            retryable: obligationsResponse.retryable
          },
          { status: 400 }
        );
      }

      let obligations = obligationsResponse.data?.obligations || [];

      // Filter by tax year if specified
      if (taxYear) {
        obligations = obligations.filter((obligation: any) => 
          obligation.taxYear === taxYear
        );
      }

      // Filter by obligation type if specified
      if (obligationType !== 'all') {
        obligations = obligations.filter((obligation: any) => {
          if (obligationType === 'personal') {
            return obligation.obligationType === 'SA' || obligation.obligationType === 'ITSA';
          } else if (obligationType === 'company') {
            return obligation.obligationType === 'CT' || obligation.obligationType === 'Corporation Tax';
          }
          return true;
        });
      }

      // Filter by status if specified
      if (status) {
        obligations = obligations.filter((obligation: any) => 
          obligation.status?.toLowerCase() === status.toLowerCase()
        );
      }

      // Enhance obligations with additional metadata
      const enhancedObligations = obligations.map((obligation: any) => ({
        ...obligation,
        isOverdue: obligation.dueDate && new Date(obligation.dueDate) < new Date(),
        daysUntilDue: obligation.dueDate ? 
          Math.ceil((new Date(obligation.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
          null,
        canSubmit: obligation.status?.toLowerCase() === 'open',
        submissionType: getSubmissionType(obligation.obligationType)
      }));

      // Sort by due date (overdue first, then by proximity)
      enhancedObligations.sort((a: any, b: any) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      });

      // Get summary statistics
      const summary = {
        total: enhancedObligations.length,
        open: enhancedObligations.filter((o: any) => o.status?.toLowerCase() === 'open').length,
        fulfilled: enhancedObligations.filter((o: any) => o.status?.toLowerCase() === 'fulfilled').length,
        overdue: enhancedObligations.filter((o: any) => o.isOverdue).length,
        dueThisMonth: enhancedObligations.filter((o: any) => {
          if (!o.dueDate) return false;
          const dueDate = new Date(o.dueDate);
          const now = new Date();
          return dueDate.getMonth() === now.getMonth() && 
                 dueDate.getFullYear() === now.getFullYear() &&
                 dueDate >= now;
        }).length
      };

      return NextResponse.json({
        success: true,
        obligations: enhancedObligations,
        summary,
        filters: {
          taxYear,
          obligationType,
          status
        },
        fromCache: obligationsResponse.fromFallback || false
      });

    } catch (error) {
      console.error('Error fetching obligations from HMRC:', error);
      
      // Try to get cached obligations from database
      const { data: cachedObligations } = await supabase
        .from('tax_submissions')
        .select('tax_year, submission_type, status, created_at, hmrc_reference')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cachedObligations && cachedObligations.length > 0) {
        // Convert submissions to obligation format
        const fallbackObligations = cachedObligations.map((submission: any) => ({
          obligationId: submission.hmrc_reference || `local-${submission.id}`,
          taxYear: submission.tax_year,
          obligationType: submission.submission_type === 'personal' ? 'SA' : 'CT',
          status: submission.status === 'submitted' ? 'fulfilled' : 'open',
          dueDate: calculateDueDate(submission.tax_year, submission.submission_type),
          submissionType: submission.submission_type,
          isFromCache: true
        }));

        return NextResponse.json({
          success: true,
          obligations: fallbackObligations,
          summary: {
            total: fallbackObligations.length,
            open: fallbackObligations.filter((o: any) => o.status === 'open').length,
            fulfilled: fallbackObligations.filter((o: any) => o.status === 'fulfilled').length,
            overdue: 0,
            dueThisMonth: 0
          },
          fromCache: true,
          warning: 'Data retrieved from local cache due to HMRC service unavailability'
        });
      }

      return NextResponse.json(
        { 
          error: 'Failed to retrieve tax obligations',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in get-obligations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to determine submission type from obligation type
function getSubmissionType(obligationType: string): 'personal' | 'company' {
  const personalTypes = ['SA', 'ITSA', 'Self Assessment'];
  const companyTypes = ['CT', 'Corporation Tax'];
  
  if (personalTypes.some(type => obligationType.includes(type))) {
    return 'personal';
  } else if (companyTypes.some(type => obligationType.includes(type))) {
    return 'company';
  }
  
  // Default to personal for unknown types
  return 'personal';
}

// Helper function to calculate due dates for different submission types
function calculateDueDate(taxYear: string, submissionType: string): string {
  const [startYear] = taxYear.split('-');
  const year = parseInt(startYear);
  
  if (submissionType === 'personal') {
    // Self Assessment due date: 31st January following the tax year
    return `${year + 1}-01-31`;
  } else {
    // Corporation Tax due date: 12 months after accounting period end
    // For simplicity, assume accounting period ends on 31st March
    return `${year + 1}-03-31`;
  }
} 