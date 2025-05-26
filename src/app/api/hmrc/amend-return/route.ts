import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { HmrcApiClient } from '@/lib/services/hmrc/hmrcApiClient';
import { SubmissionService } from '@/lib/services/submissionService';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { 
      hmrcReference, 
      submissionId, 
      amendmentData, 
      amendmentReason,
      submissionType = 'personal'
    } = body;

    // Validate required fields
    if (!hmrcReference && !submissionId) {
      return NextResponse.json(
        { error: 'Missing required field: hmrcReference or submissionId' },
        { status: 400 }
      );
    }

    if (!amendmentData) {
      return NextResponse.json(
        { error: 'Missing required field: amendmentData' },
        { status: 400 }
      );
    }

    if (!amendmentReason) {
      return NextResponse.json(
        { error: 'Missing required field: amendmentReason' },
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
      // Get the original submission
      let originalSubmission = null;
      
      if (submissionId) {
        const { data, error } = await supabase
          .from('tax_submissions')
          .select('*')
          .eq('id', submissionId)
          .eq('user_id', user.id)
          .single();

        if (error || !data) {
          return NextResponse.json(
            { error: 'Original submission not found' },
            { status: 404 }
          );
        }
        originalSubmission = data;
      } else if (hmrcReference) {
        const { data, error } = await supabase
          .from('tax_submissions')
          .select('*')
          .eq('hmrc_reference', hmrcReference)
          .eq('user_id', user.id)
          .single();

        if (error || !data) {
          return NextResponse.json(
            { error: 'Original submission not found' },
            { status: 404 }
          );
        }
        originalSubmission = data;
      }

      // Check if amendment is allowed
      if (originalSubmission?.status !== 'submitted' && originalSubmission?.status !== 'accepted') {
        return NextResponse.json(
          { error: 'Amendment not allowed. Original submission must be submitted or accepted.' },
          { status: 400 }
        );
      }

      // Check amendment deadline
      const amendmentDeadline = calculateAmendmentDeadline(originalSubmission.tax_year);
      if (new Date() > new Date(amendmentDeadline)) {
        return NextResponse.json(
          { 
            error: 'Amendment deadline has passed',
            deadline: amendmentDeadline
          },
          { status: 400 }
        );
      }

      // Create amendment submission ID
      const amendmentSubmissionId = crypto.randomUUID();

      // Log amendment initiation
      await submissionService.logSubmissionStatus(
        amendmentSubmissionId, 
        user.id, 
        'validating', 
        'validation', 
        'Starting amendment validation',
        {
          originalSubmissionId: originalSubmission.id,
          originalHmrcReference: originalSubmission.hmrc_reference,
          amendmentReason
        }
      );

      // Validate amendment data
      const validationResult = await submissionService.validateSubmissionData(
        submissionType as 'personal' | 'company', 
        amendmentData
      );

      if (!validationResult.isValid) {
        await submissionService.logSubmissionStatus(
          amendmentSubmissionId,
          user.id,
          'failed',
          'validation',
          'Amendment validation failed',
          { errors: validationResult.errors }
        );

        return NextResponse.json(
          { 
            error: 'Amendment data validation failed',
            validationErrors: validationResult.errors
          },
          { status: 400 }
        );
      }

      // Update status to submitting
      await submissionService.logSubmissionStatus(
        amendmentSubmissionId,
        user.id,
        'submitting',
        'transmission',
        'Submitting amendment to HMRC'
      );

      // Format amendment data for HMRC
      const hmrcAmendmentData = await submissionService.formatForHMRC(
        submissionType as 'personal' | 'company',
        amendmentData,
        originalSubmission.tax_year
      );

      // Submit amendment to HMRC
      const amendmentResponse = await hmrcClient.executeRequest(
        user.id,
        'POST',
        `/individuals/self-assessment/${originalSubmission.hmrc_reference}/amend`,
        {
          body: {
            ...hmrcAmendmentData,
            amendmentReason,
            originalSubmissionReference: originalSubmission.hmrc_reference
          }
        }
      );

      if (!amendmentResponse) {
        await submissionService.logSubmissionStatus(
          amendmentSubmissionId,
          user.id,
          'failed',
          'transmission',
          'HMRC amendment submission failed'
        );

        return NextResponse.json(
          { error: 'Failed to submit amendment to HMRC' },
          { status: 500 }
        );
      }

      // Extract amendment reference
      const amendmentReference = (amendmentResponse as any).amendmentReference || 
                                (amendmentResponse as any).submissionId;

      // Update status to submitted
      await submissionService.logSubmissionStatus(
        amendmentSubmissionId,
        user.id,
        'submitted',
        'processing',
        'Amendment successfully submitted to HMRC',
        { amendmentReference },
        amendmentReference
      );

      // Create amendment submission record
      const { data: amendmentRecord, error: dbError } = await supabase
        .from('tax_submissions')
        .insert({
          id: amendmentSubmissionId,
          user_id: user.id,
          tax_year: originalSubmission.tax_year,
          submission_type: originalSubmission.submission_type,
          status: 'submitted',
          calculation_data: amendmentData,
          hmrc_reference: amendmentReference,
          original_submission_id: originalSubmission.id,
          amendment_reason: amendmentReason,
          is_amendment: true,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        console.warn('Failed to store amendment record:', dbError);
      }

      // Update original submission to mark as amended
      await supabase
        .from('tax_submissions')
        .update({
          is_amended: true,
          amended_by: amendmentSubmissionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', originalSubmission.id);

      // Store receipt if available
      if ((amendmentResponse as any).receipt) {
        await submissionService.storeReceipt(
          amendmentSubmissionId,
          user.id,
          amendmentReference,
          'amendment_acknowledgment',
          (amendmentResponse as any).receipt
        );
      }

      return NextResponse.json({
        success: true,
        amendmentSubmissionId,
        amendmentReference,
        originalSubmissionId: originalSubmission.id,
        originalHmrcReference: originalSubmission.hmrc_reference,
        message: 'Tax return amendment submitted successfully to HMRC'
      });

    } catch (error) {
      console.error('Error submitting amendment to HMRC:', error);
      
      // Try to create local amendment record for tracking
      try {
        const localAmendmentId = crypto.randomUUID();
        
        await supabase
          .from('tax_submissions')
          .insert({
            id: localAmendmentId,
            user_id: user.id,
            tax_year: originalSubmission?.tax_year || '2023-24',
            submission_type: submissionType,
            status: 'failed',
            calculation_data: amendmentData,
            original_submission_id: originalSubmission?.id,
            amendment_reason: amendmentReason,
            is_amendment: true,
            submitted_at: new Date().toISOString()
          });

        return NextResponse.json(
          { 
            error: 'Failed to submit amendment to HMRC',
            localAmendmentId,
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      } catch (localError) {
        console.error('Failed to create local amendment record:', localError);
        
        return NextResponse.json(
          { 
            error: 'Failed to submit amendment to HMRC',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error('Error in amend-return API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const originalSubmissionId = searchParams.get('originalSubmissionId');
    const hmrcReference = searchParams.get('hmrcReference');
    const taxYear = searchParams.get('taxYear');

    // Build query for amendments
    let query = supabase
      .from('tax_submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_amendment', true);

    if (originalSubmissionId) {
      query = query.eq('original_submission_id', originalSubmissionId);
    } else if (hmrcReference) {
      // Get original submission first, then find amendments
      const { data: originalSubmission } = await supabase
        .from('tax_submissions')
        .select('id')
        .eq('hmrc_reference', hmrcReference)
        .eq('user_id', user.id)
        .single();

      if (originalSubmission) {
        query = query.eq('original_submission_id', originalSubmission.id);
      }
    } else if (taxYear) {
      query = query.eq('tax_year', taxYear);
    }

    const { data: amendments, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Enhance amendments with status information
    const submissionService = SubmissionService.getInstance();
    const enhancedAmendments = await Promise.all(
      (amendments || []).map(async (amendment: any) => {
        const statusHistory = await submissionService.getSubmissionStatus(amendment.id, user.id);
        const receipts = await submissionService.getSubmissionReceipts(amendment.id, user.id);

        return {
          ...amendment,
          statusHistory,
          receipts,
          canAmendAgain: amendment.status === 'accepted' && 
                        new Date() <= new Date(calculateAmendmentDeadline(amendment.tax_year))
        };
      })
    );

    return NextResponse.json({
      success: true,
      amendments: enhancedAmendments,
      summary: {
        total: enhancedAmendments.length,
        submitted: enhancedAmendments.filter((a: any) => a.status === 'submitted').length,
        accepted: enhancedAmendments.filter((a: any) => a.status === 'accepted').length,
        rejected: enhancedAmendments.filter((a: any) => a.status === 'rejected').length,
        canAmendAgain: enhancedAmendments.filter((a: any) => a.canAmendAgain).length
      }
    });

  } catch (error) {
    console.error('Error getting amendments:', error);
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