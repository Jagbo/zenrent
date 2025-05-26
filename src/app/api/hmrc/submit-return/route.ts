import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
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
    const { submissionType, taxYear, draftData } = body;

    // Validate required fields
    if (!submissionType || !taxYear) {
      return NextResponse.json(
        { error: 'Missing required fields: submissionType and taxYear' },
        { status: 400 }
      );
    }

    if (!['personal', 'company'].includes(submissionType)) {
      return NextResponse.json(
        { error: 'Invalid submission type. Must be "personal" or "company"' },
        { status: 400 }
      );
    }

    const submissionService = SubmissionService.getInstance();

    // If draftData is provided, save it first
    if (draftData) {
      await submissionService.saveDraft(user.id, submissionType, taxYear, draftData);
    }

    // Submit to HMRC
    const result = await submissionService.submitToHMRC(user.id, submissionType, taxYear);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error,
          submissionId: result.submissionId 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      submissionId: result.submissionId,
      hmrcReference: result.hmrcReference,
      message: 'Tax return submitted successfully to HMRC'
    });

  } catch (error) {
    console.error('Error in submit-return API:', error);
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
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submissionId parameter' },
        { status: 400 }
      );
    }

    const submissionService = SubmissionService.getInstance();

    // Get submission status
    const statuses = await submissionService.getSubmissionStatus(submissionId, user.id);
    
    if (statuses.length === 0) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    const latestStatus = statuses[statuses.length - 1];

    return NextResponse.json({
      submissionId,
      currentStatus: latestStatus.status,
      currentStage: latestStatus.stage,
      hmrcReference: latestStatus.hmrcReference,
      statusHistory: statuses,
      canRetry: latestStatus.status === 'failed'
    });

  } catch (error) {
    console.error('Error getting submission status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { submissionId, action } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submissionId' },
        { status: 400 }
      );
    }

    const submissionService = SubmissionService.getInstance();

    if (action === 'retry') {
      const result = await submissionService.retrySubmission(submissionId, user.id);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Submission retry initiated'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: retry' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in submit-return PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 