import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { HmrcApiClient } from '@/lib/services/hmrc/hmrcApiClient';
import { calculatePersonalTax, calculateCompanyTax } from '@/services/tax-calculator';

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
    const calculationId = searchParams.get('calculationId');
    const submissionType = searchParams.get('type') || 'personal'; // 'personal' or 'company'

    // Validate required parameters
    if (!taxYear) {
      return NextResponse.json(
        { error: 'Missing required parameter: taxYear' },
        { status: 400 }
      );
    }

    // Validate tax year format (YYYY-YY)
    if (!/^\d{4}-\d{2}$/.test(taxYear)) {
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

    try {
      let calculations = [];

      if (calculationId) {
        // Get specific calculation from HMRC
        const calculationResponse = await hmrcClient.executeRequest(
          user.id,
          'GET',
          `/individuals/calculations/${calculationId}`
        );

        if (calculationResponse) {
          calculations = [calculationResponse];
        }
      } else {
        // Get all calculations for the tax year
        const calculationsResponse = await hmrcClient.executeRequest(
          user.id,
          'GET',
          `/individuals/calculations?taxYear=${taxYear}`
        );

        calculations = (calculationsResponse as any)?.calculations || [];
      }

      // Enhance calculations with local data and metadata
      const enhancedCalculations = await Promise.all(
        calculations.map(async (calc: any) => {
          // Get local submission data if available
          const { data: localSubmission } = await supabase
            .from('tax_submissions')
            .select('*')
            .eq('user_id', user.id)
            .eq('tax_year', taxYear)
            .eq('hmrc_reference', calc.calculationId)
            .maybeSingle();

          // Calculate local comparison if we have the data
          let localCalculation = null;
          if (localSubmission?.calculation_data) {
            try {
              if (submissionType === 'personal') {
                localCalculation = calculatePersonalTax(
                  localSubmission.calculation_data.totalIncome || 0,
                  localSubmission.calculation_data.totalExpenses || 0,
                  localSubmission.calculation_data.adjustments || {}
                );
              } else {
                localCalculation = calculateCompanyTax(
                  localSubmission.calculation_data.profit || 0,
                  localSubmission.calculation_data.adjustments || {}
                );
              }
            } catch (error) {
              console.warn('Error calculating local comparison:', error);
            }
          }

          return {
            ...calc,
            submissionType,
            localSubmission: localSubmission ? {
              id: localSubmission.id,
              status: localSubmission.status,
              submittedAt: localSubmission.submitted_at,
              calculationData: localSubmission.calculation_data
            } : null,
            localCalculation,
            hasDiscrepancy: localCalculation && calc.totalTaxDue ? 
              Math.abs(localCalculation.totalTaxDue - calc.totalTaxDue) > 1 : false,
            lastUpdated: calc.lastUpdated || new Date().toISOString(),
            isLatest: true // HMRC calculations are always latest
          };
        })
      );

      // Sort by calculation date (most recent first)
      enhancedCalculations.sort((a: any, b: any) => {
        const dateA = new Date(a.calculationTimestamp || a.lastUpdated);
        const dateB = new Date(b.calculationTimestamp || b.lastUpdated);
        return dateB.getTime() - dateA.getTime();
      });

      // Get summary statistics
      const summary = {
        total: enhancedCalculations.length,
        withDiscrepancies: enhancedCalculations.filter((c: any) => c.hasDiscrepancy).length,
        totalTaxDue: enhancedCalculations.reduce((sum: number, calc: any) => 
          sum + (calc.totalTaxDue || 0), 0),
        averageProcessingTime: enhancedCalculations.length > 0 ? 
          enhancedCalculations.reduce((sum: number, calc: any) => {
            if (calc.submittedDate && calc.calculationTimestamp) {
              const submitted = new Date(calc.submittedDate);
              const calculated = new Date(calc.calculationTimestamp);
              return sum + (calculated.getTime() - submitted.getTime());
            }
            return sum;
          }, 0) / enhancedCalculations.length : 0
      };

      return NextResponse.json({
        success: true,
        calculations: enhancedCalculations,
        summary,
        taxYear,
        submissionType,
        calculationId: calculationId || null
      });

    } catch (error) {
      console.error('Error fetching calculations from HMRC:', error);
      
      // Fallback to local calculations
      const { data: localSubmissions } = await supabase
        .from('tax_submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('tax_year', taxYear)
        .order('created_at', { ascending: false });

      if (localSubmissions && localSubmissions.length > 0) {
        const fallbackCalculations = localSubmissions.map((submission: any) => {
          let calculation = null;
          
          if (submission.calculation_data) {
            try {
              if (submissionType === 'personal') {
                calculation = calculatePersonalTax(
                  submission.calculation_data.totalIncome || 0,
                  submission.calculation_data.totalExpenses || 0,
                  submission.calculation_data.adjustments || {}
                );
              } else {
                calculation = calculateCompanyTax(
                  submission.calculation_data.profit || 0,
                  submission.calculation_data.adjustments || {}
                );
              }
            } catch (calcError) {
              console.warn('Error in fallback calculation:', calcError);
            }
          }

          return {
            calculationId: submission.hmrc_reference || `local-${submission.id}`,
            taxYear: submission.tax_year,
            submissionType: submission.submission_type,
            status: submission.status,
            calculationTimestamp: submission.updated_at,
            submittedDate: submission.submitted_at,
                         totalTaxDue: calculation?.totalTaxDue || 0,
             incomeTax: (calculation as any)?.incomeTax || 0,
             nationalInsurance: (calculation as any)?.nationalInsurance || 0,
             corporationTax: (calculation as any)?.corporationTax || 0,
            localCalculation: calculation,
            isFromCache: true,
            hasDiscrepancy: false,
            lastUpdated: submission.updated_at,
            isLatest: true
          };
        });

        return NextResponse.json({
          success: true,
          calculations: fallbackCalculations,
          summary: {
            total: fallbackCalculations.length,
            withDiscrepancies: 0,
            totalTaxDue: fallbackCalculations.reduce((sum: number, calc: any) => 
              sum + (calc.totalTaxDue || 0), 0),
            averageProcessingTime: 0
          },
          taxYear,
          submissionType,
          fromCache: true,
          warning: 'Data retrieved from local cache due to HMRC service unavailability'
        });
      }

      return NextResponse.json(
        { 
          error: 'Failed to retrieve tax calculations',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in get-calculations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { taxYear, submissionType, calculationData } = body;

    // Validate required fields
    if (!taxYear || !submissionType || !calculationData) {
      return NextResponse.json(
        { error: 'Missing required fields: taxYear, submissionType, calculationData' },
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

    try {
      // Create calculation with HMRC
      const calculationResponse = await hmrcClient.executeRequest(
        user.id,
        'POST',
        `/individuals/calculations`,
        {
          body: {
            taxYear,
            submissionType,
            ...calculationData
          }
        }
      );

      if (!calculationResponse) {
        throw new Error('Failed to create calculation with HMRC');
      }

      // Store calculation locally for reference
      const { data: localCalculation, error: dbError } = await supabase
        .from('tax_submissions')
        .insert({
          user_id: user.id,
          tax_year: taxYear,
          submission_type: submissionType,
          status: 'calculated',
          calculation_data: calculationData,
                     hmrc_reference: (calculationResponse as any).calculationId,
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (dbError) {
        console.warn('Failed to store calculation locally:', dbError);
      }

      return NextResponse.json({
        success: true,
                 calculationId: (calculationResponse as any).calculationId,
        calculation: calculationResponse,
        localId: localCalculation?.id,
        message: 'Tax calculation created successfully'
      });

    } catch (error) {
      console.error('Error creating calculation with HMRC:', error);
      
      // Fallback to local calculation only
      let localCalculation = null;
      
      try {
        if (submissionType === 'personal') {
          localCalculation = calculatePersonalTax(
            calculationData.totalIncome || 0,
            calculationData.totalExpenses || 0,
            calculationData.adjustments || {}
          );
        } else {
          localCalculation = calculateCompanyTax(
            calculationData.profit || 0,
            calculationData.adjustments || {}
          );
        }

        // Store local calculation
        const { data: localRecord, error: dbError } = await supabase
          .from('tax_submissions')
          .insert({
            user_id: user.id,
            tax_year: taxYear,
            submission_type: submissionType,
            status: 'calculated_locally',
            calculation_data: {
              ...calculationData,
              localCalculation
            },
            submitted_at: new Date().toISOString()
          })
          .select()
          .single();

        if (dbError) {
          throw dbError;
        }

        return NextResponse.json({
          success: true,
          calculationId: `local-${localRecord.id}`,
          calculation: localCalculation,
          localId: localRecord.id,
          fromCache: true,
          warning: 'Calculation performed locally due to HMRC service unavailability'
        });

      } catch (localError) {
        console.error('Error in local calculation fallback:', localError);
        return NextResponse.json(
          { 
            error: 'Failed to create tax calculation',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error('Error in get-calculations POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 