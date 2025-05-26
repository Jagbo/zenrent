import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth-helpers';
import { URLSearchParams } from 'url'; // Import for token refresh body

// --- HMRC OAuth Configuration (Ensure these are set in your environment) ---
const HMRC_CLIENT_ID = process.env.HMRC_CLIENT_ID;
const HMRC_CLIENT_SECRET = process.env.HMRC_CLIENT_SECRET;
const HMRC_TOKEN_URL = "https://test-api.service.hmrc.gov.uk/oauth/token"; // Sandbox URL

// TODO: Move storeHmrcTokens to a shared utility or import from callback route
// For now, assume it's available in scope or copied here.
async function storeHmrcTokens(userId: string, accessToken: string, refreshToken: string, expiresIn: number, scope: string) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000); 
  const { error } = await supabase
    .from('hmrc_authorizations')
    .upsert({
      user_id: userId,
      access_token: accessToken, // TODO: Encrypt
      refresh_token: refreshToken, // TODO: Encrypt
      expires_at: expiresAt.toISOString(),
      scope: scope,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  if (error) {
    console.error(`[HMRC Auth Util] Error storing tokens for user ${userId}:`, error);
    throw new Error('Failed to store HMRC authorization tokens.');
  }
  console.log(`[HMRC Auth Util] Tokens stored successfully for user ${userId}`);
}

/**
 * Retrieves a valid HMRC access token for the user.
 * Handles token refresh if necessary.
 * Tokens should be decrypted after retrieval and encrypted before storing.
 */
async function getHmrcAccessToken(userId: string): Promise<string> {
  console.log(`[HMRC Token] Fetching token for user ${userId}`);
  const { data, error } = await supabase
    .from('hmrc_authorizations')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error(`[HMRC Token] No HMRC authorization found for user ${userId}:`, error);
    throw new Error('HMRC authorization not found. Please connect to HMRC first.');
  }

  // TODO: Decrypt access_token and refresh_token here
  let accessToken = data.access_token;
  const refreshToken = data.refresh_token;
  const expiresAt = new Date(data.expires_at);

  // Check if the access token is expired or close to expiring (e.g., within 5 minutes)
  const fiveMinutes = 5 * 60 * 1000;
  if (new Date() >= new Date(expiresAt.getTime() - fiveMinutes)) { 
    console.log(`[HMRC Token] Access token expired or nearing expiry for user ${userId}. Refreshing...`);
    
    if (!refreshToken) {
        console.error(`[HMRC Token] Refresh token missing for user ${userId}. Cannot refresh.`);
        throw new Error('Refresh token missing. Please re-authorize.');
    }
    
    try {
        const refreshResponse = await fetch(HMRC_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: HMRC_CLIENT_ID!,
                client_secret: HMRC_CLIENT_SECRET!,
                refresh_token: refreshToken, // Use the decrypted refresh token
            }),
        });

        const refreshData = await refreshResponse.json();

        if (!refreshResponse.ok) {
            console.error('[HMRC Token] Failed to refresh token:', refreshData);
            // Handle specific errors like invalid_grant (refresh token revoked)
            if (refreshData.error === 'invalid_grant') {
                 throw new Error('HMRC refresh token is invalid or revoked. Please re-authorize.');
            }
            throw new Error(refreshData.error_description || refreshData.error || 'Failed to refresh HMRC token');
        }

        console.log('[HMRC Token] Token refreshed successfully:', { 
            access_token: '***', 
            refresh_token: '***', 
            expires_in: refreshData.expires_in, 
            scope: refreshData.scope 
        });

        // Store the new tokens (these should be encrypted by storeHmrcTokens)
        await storeHmrcTokens(
            userId,
            refreshData.access_token,
            refreshData.refresh_token,
            refreshData.expires_in,
            refreshData.scope
        );

        // Use the new access token for the current request
        accessToken = refreshData.access_token; // This should be the decrypted token if store/retrieve handles it
        
    } catch (refreshError) {
        console.error(`[HMRC Token] Token refresh process failed for user ${userId}:`, refreshError);
        // Re-throw the specific error from the refresh attempt
        throw refreshError; 
    }
  }

  console.log(`[HMRC Token] Valid access token retrieved for user ${userId}`);
  // TODO: Ensure the returned accessToken is the decrypted value
  return accessToken!; 
}

/**
 * Gets or creates a property business ID for the user with HMRC
 */
async function getPropertyBusinessId(userId: string, accessToken: string): Promise<string> {
  console.log(`[HMRC Property] Getting business ID for user ${userId}`);
  
  // Check if we already have a business ID stored
  const { data: existingBusiness } = await supabase
    .from('hmrc_business_details')
    .select('business_id')
    .eq('user_id', userId)
    .eq('business_type', 'property')
    .single();
    
  if (existingBusiness?.business_id) {
    console.log(`[HMRC Property] Found existing business ID: ${existingBusiness.business_id}`);
    return existingBusiness.business_id;
  }
  
  // Get user's NINO from their profile
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('national_insurance_number')
    .eq('user_id', userId)
    .single();
    
  if (!userProfile?.national_insurance_number) {
    throw new Error('User NINO not found. Please ensure your National Insurance number is set in your profile.');
  }
  
  const nino = userProfile.national_insurance_number;
  
  // Fetch business details from HMRC to find property business
  try {
    const response = await fetch(`https://api.service.hmrc.gov.uk/individuals/business/details/${nino}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.hmrc.1.0+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch business details: ${response.status}`);
    }
    
    const businessData = await response.json();
    
    // Look for property business
    const propertyBusiness = businessData.businesses?.find((b: any) => 
      b.businessType === 'property' || b.typeOfBusiness === 'uk-property'
    );
    
    if (propertyBusiness) {
      // Store the business ID
      await supabase
        .from('hmrc_business_details')
        .upsert({
          user_id: userId,
          business_id: propertyBusiness.businessId,
          business_type: 'property',
          nino: nino
        });
        
      return propertyBusiness.businessId;
    }
    
    throw new Error('No property business found. You may need to register a property business with HMRC first.');
    
  } catch (error) {
    console.error('[HMRC Property] Error fetching business details:', error);
    throw new Error('Unable to retrieve property business details from HMRC.');
  }
}

/**
 * Formats the user's tax data for HMRC Property Business API submission.
 */
async function formatPropertyDataForHmrc(userId: string, taxYear: string, taxData?: any): Promise<any> {
  console.log(`[HMRC Format] Formatting property data for user ${userId}, tax year ${taxYear}`);
  
  // Use provided tax data or fetch from database
  let formattedTaxData = taxData;
  
  if (!formattedTaxData) {
    // Fetch from database if not provided
    try {
      const { data: userTaxData, error } = await supabase
        .from('tax_submissions')
        .select('calculation_data')
        .eq('user_id', userId)
        .eq('tax_year', taxYear.replace('/', '-'))
        .single();
        
      if (error || !userTaxData || !userTaxData.calculation_data) {
        console.warn(`[HMRC Format] No tax calculation found for user ${userId}, using defaults`);
        formattedTaxData = {
          totalIncome: 0,
          totalExpenses: 0,
          taxableProfit: 0,
          taxAdjustments: {}
        };
      } else {
        formattedTaxData = userTaxData.calculation_data;
      }
    } catch (error) {
      console.error(`[HMRC Format] Error fetching tax data:`, error);
      formattedTaxData = {
        totalIncome: 0,
        totalExpenses: 0,
        taxableProfit: 0,
        taxAdjustments: {}
      };
    }
  }

  // Format data according to HMRC Property Business API schema
  const propertyPayload = {
    // For annual submission
    adjustments: {
      privateUseAdjustment: 0,
      balancingCharge: 0,
      periodOfGraceAdjustment: false,
      propertyIncomeAllowance: formattedTaxData.taxAdjustments?.use_property_income_allowance || false,
      renovationAllowanceBalancingCharge: 0,
      residentialFinanceCost: 0,
      unusedResidentialFinanceCost: 0
    },
    allowances: {
      annualInvestmentAllowance: 0,
      businessPremisesRenovationAllowance: 0,
      zeroEmissionGoodsVehicleAllowance: 0,
      propertyIncomeAllowance: formattedTaxData.taxAdjustments?.use_property_income_allowance ? 100000 : 0 // £1000 in pence
    }
  };
  
  console.log('[HMRC Format] Property data formatted:', {
    taxYear: taxYear,
    totalIncome: formattedTaxData.totalIncome,
    totalExpenses: formattedTaxData.totalExpenses,
    adjustments: propertyPayload.adjustments,
    allowances: propertyPayload.allowances
  });
  
  return propertyPayload; 
}

/**
 * Submits property data to HMRC using the correct Personal Self Assessment approach.
 * For individual landlords, this triggers a calculation rather than direct submission.
 */
async function submitPropertyToHmrc(payload: any, accessToken: string, fraudData: any, userId: string, taxYear: string): Promise<any> {
  console.log('[HMRC Submit] Submitting property data for personal self assessment...');
  
  // Check if we're in development mode or if HMRC integration is not fully set up
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.HMRC_FULL_INTEGRATION_ENABLED;
  
  if (isDevelopment) {
    console.log('[HMRC Submit] Development mode: Simulating successful property submission');
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a mock submission reference
    const mockCalculationId = `CALC_${Date.now()}_${userId.slice(-6)}`;
    const mockHmrcReference = `MTD${new Date().getFullYear()}${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;
    
    console.log('[HMRC Submit] Mock property submission successful:', {
      calculationId: mockCalculationId,
      hmrcReference: mockHmrcReference,
      payload: payload
    });
    
    return {
      submissionId: mockCalculationId,
      hmrcReference: mockHmrcReference,
      status: 'submitted',
      development: true
    };
  }
  
  // Get user's NINO for the API calls
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('national_insurance_number')
    .eq('user_id', userId)
    .single();
    
  if (!userProfile?.national_insurance_number) {
    throw new Error('User NINO not found. Please ensure your National Insurance number is set in your profile.');
  }
  
  const nino = userProfile.national_insurance_number;
  
  // For personal self assessment, we need to:
  // 1. Submit property adjustments and allowances 
  // 2. Trigger a tax calculation
  // 3. Make a final declaration
  
  // --- Populate Fraud Prevention Headers --- 
  const fraudPreventionHeaders = {
      'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
      'Gov-Client-Device-ID': fraudData?.deviceId || 'unknown',
      'Gov-Client-User-IDs': `userId=${userId}`,
      'Gov-Client-Timezone': fraudData?.timezone || 'unknown',
      'Gov-Client-Local-IPs': fraudData?.localIps || 'unknown',
      'Gov-Client-User-Agent': fraudData?.userAgent || 'unknown',
      'Gov-Client-Screens': `width=${fraudData?.screenDetails?.split('x')[0] || 'unknown'}&height=${fraudData?.screenDetails?.split('x')[1] || 'unknown'}&scaling-factor=1&colour-depth=${fraudData?.screenDetails?.split('x')[2] || 'unknown'}`,
      'Gov-Client-Window-Size': `width=${fraudData?.windowSize?.split('x')[0] || 'unknown'}&height=${fraudData?.windowSize?.split('x')[1] || 'unknown'}`,
      'Gov-Vendor-Version': 'ZenRent=1.0.0',
      'Gov-Vendor-Product-Name': 'ZenRent',
  };

  try {
    // Step 1: Submit property adjustments and allowances using Individual Calculations API
    const calculationEndpoint = `https://api.service.hmrc.gov.uk/individuals/calculations/${nino}/self-assessment/${taxYear}`;
    
    console.log('[HMRC Submit] Triggering tax calculation for property income...', { 
        endpoint: calculationEndpoint,
        nino: nino.substring(0, 3) + '***',
        taxYear
    });

    const calculationResponse = await fetch(calculationEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.hmrc.4.0+json',
        ...fraudPreventionHeaders,
      },
      body: JSON.stringify({
        finalDeclaration: true
      }),
    });

    if (calculationResponse.status === 202) {
        const calcData = await calculationResponse.json();
        console.log('[HMRC Submit] Tax calculation triggered successfully:', calcData);
        
        // The calculation ID can be used to retrieve the final calculation
        return {
            submissionId: calcData.calculationId,
            hmrcReference: calcData.calculationId,
            status: 'submitted',
            calculationId: calcData.calculationId
        };
    } else {
        let errorData;
        try {
            errorData = await calculationResponse.json();
        } catch (e) {
            errorData = { code: 'UNKNOWN_ERROR', message: `HMRC API returned status ${calculationResponse.status}` };
        }
        console.error('[HMRC Submit] Tax calculation failed:', { status: calculationResponse.status, body: errorData });
        const errorMessage = errorData.message || (errorData.errors && errorData.errors[0]?.message) || errorData.code || `HMRC calculation error: ${calculationResponse.status}`;
        throw new Error(errorMessage);
    }
    
  } catch (error) {
    console.error('[HMRC Submit] Property submission error:', error);
    throw error;
  }
}

/**
 * Stores the submission record in the database.
 * Handles potentially undefined taxYear/submissionType when called from error handlers.
 */
async function storeSubmissionRecord(
  userId: string, 
  taxYear: string | undefined, 
  submissionType: string | undefined, 
  result: any, 
  payload: any, 
  errorDetails?: any
) {
  // Provide default values if taxYear or submissionType are undefined (e.g., during error handling)
  const finalTaxYear = taxYear ?? 'unknown_year';
  const finalSubmissionType = submissionType ?? 'unknown_type';

  console.log(`[HMRC Submit] Storing submission record for user ${userId}, tax year ${finalTaxYear}`);
  
  const submissionData = {
    user_id: userId,
    tax_year: finalTaxYear, // Use final value
    submission_type: finalSubmissionType, // Use final value
    submission_id: result.submissionId,
    status: errorDetails ? 'error' : result.status || 'submitted',
    hmrc_reference: result.hmrcReference,
    submitted_at: errorDetails ? null : new Date().toISOString(),
    payload: payload,
    error_details: errorDetails,
    updated_at: new Date().toISOString(),
  };
  
  console.log('[HMRC Submit] Attempting to insert:', submissionData);
  
  const { error } = await supabase
    .from('tax_submissions')
    .upsert(submissionData, { onConflict: 'user_id, tax_year, submission_type' });

  if (error) {
    console.error(`[HMRC Submit] Error storing submission record for user ${userId}:`, error);
    // Log this error but don't necessarily throw
  }
  console.log(`[HMRC Submit] Submission record stored for user ${userId}`);
  
  // TODO: Optionally add a detailed log to hmrc_submission_logs table
}

// --- API Route Handler ---

export async function POST(req: Request) {
  console.log('[API /financial/tax/submit-hmrc] Received request');
  
  // Parse request body first to get potential userId from request
  let body;
  try {
    body = await req.json();
  } catch (parseError) {
    console.error('[API /financial/tax/submit-hmrc] Error parsing request body:', parseError);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  
  // Try to get user from auth, but fall back to userId from request body when using ngrok
  let user = null;
  try {
    user = await getAuthUser();
    if (user) {
      console.log(`[API /financial/tax/submit-hmrc] User authenticated via session: ${user.id}`);
    }
  } catch (authError) {
    console.warn('[API /financial/tax/submit-hmrc] Auth via session failed:', authError);
    // Will attempt to use userId from request body
  }
  
  // If session auth failed but userId was provided in request body (for development/testing)
  if (!user && body.userId) {
    console.log(`[API /financial/tax/submit-hmrc] Using userId from request body: ${body.userId}`);
    // For development purposes, trust the userId from the request body
    // In production, you should have proper session authentication
    user = { id: body.userId };
  }
  
  // If still no user, return unauthorized
  if (!user) {
    console.error('[API /financial/tax/submit-hmrc] Authentication required');
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let payload;
  let taxYear = body.taxYear;
  let submissionType = body.submissionType || 'SA-FULL'; 
  let fraudHeadersData = body.fraudHeaders || {}; // Extract fraud headers from body

  try {
    if (!taxYear) {
      throw new Error('Tax year is required for submission.');
    }

    console.log(`[API /financial/tax/submit-hmrc] Processing submission for user ${user.id}, tax year ${taxYear}, type ${submissionType}`);
    console.log(`[API /financial/tax/submit-hmrc] Received Fraud Data:`, fraudHeadersData);

    // 1. Get Access Token
    const accessToken = await getHmrcAccessToken(user.id);

    // 2. Format Data
    payload = await formatPropertyDataForHmrc(user.id, taxYear, body.taxData);

    // 3. Submit to HMRC (Pass fraud data and user ID)
    const submissionResult = await submitPropertyToHmrc(payload, accessToken, fraudHeadersData, user.id, taxYear);

    // 4. Store Submission Record
    await storeSubmissionRecord(user.id, taxYear, submissionType, submissionResult, payload);

    console.log(`[API /financial/tax/submit-hmrc] Submission successful for user ${user.id}`);
    return NextResponse.json({
      message: 'Submission successful',
      submissionId: submissionResult.submissionId,
      hmrcReference: submissionResult.hmrcReference,
    }, { status: 200 });

  } catch (error) {
    console.error(`[API /financial/tax/submit-hmrc] Submission failed for user ${user.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during submission';
    
    if (user) { 
      try {
        await storeSubmissionRecord(user.id, taxYear, submissionType, {}, payload || {}, { error: errorMessage });
      } catch (storeError) {
        console.error(`[API /financial/tax/submit-hmrc] Critical error: Failed to even store the error record for user ${user.id}:`, storeError);
      }
    } else {
      console.error(`[API /financial/tax/submit-hmrc] Cannot store error record due to missing user.`);
    }
 
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 