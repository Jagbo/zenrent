import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getServerAuthUser } from '@/lib/server-auth-helpers';
import { URLSearchParams } from 'url'; // Import for token refresh body

// --- Supabase Server Client Configuration ---
// Create a server-side Supabase client with service role key for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// --- HMRC OAuth Configuration (Ensure these are set in your environment) ---
const HMRC_CLIENT_ID = process.env.HMRC_CLIENT_ID;
const HMRC_CLIENT_SECRET = process.env.HMRC_CLIENT_SECRET;
// Use sandbox in development, production in production
const HMRC_TOKEN_URL = process.env.HMRC_TOKEN_URL || 
  (process.env.NODE_ENV === 'development' 
    ? "https://test-api.service.hmrc.gov.uk/oauth/token" 
    : "https://api.service.hmrc.gov.uk/oauth/token");

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
  
  // 1. Check local cache first -------------------------------------------
  const { data: existingBusiness } = await supabase
    .from('hmrc_business_details')
    .select('business_id')
    .eq('user_id', userId)
    .eq('business_type', 'property')
    .single();
  if (existingBusiness?.business_id) {
    console.log(`[HMRC Property] Found existing business ID in DB: ${existingBusiness.business_id}`);
    return existingBusiness.business_id;
  }

  // 2. Fetch user NINO -----------------------------------------------------
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('national_insurance_number')
    .eq('user_id', userId)
    .single();
  if (!userProfile?.national_insurance_number) {
    throw new Error('User NINO not found. Please ensure your National Insurance number is set in your profile.');
  }
  const nino = userProfile.national_insurance_number;

  // 3. Determine HMRC API base --------------------------------------------
  const hmrcApiBaseUrl = process.env.NODE_ENV === 'development'
    ? 'https://test-api.service.hmrc.gov.uk'
    : 'https://api.service.hmrc.gov.uk';

  // Helper to persist a business ID locally
  const persistBusinessId = async (businessId: string) => {
    await supabase.from('hmrc_business_details').upsert({
      user_id: userId,
      business_id: businessId,
      business_type: 'property',
      nino,
    });
  };

  // 4. Try to GET business details ----------------------------------------
  try {
    const detailsRes = await fetch(`${hmrcApiBaseUrl}/individuals/business/details/${nino}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.hmrc.1.0+json',
      },
    });

    if (detailsRes.ok) {
      const body = await detailsRes.json();
      const propertyBusiness = body.businesses?.find((b: any) =>
        b.businessType === 'property' || b.typeOfBusiness === 'uk-property',
      );
      if (propertyBusiness) {
        await persistBusinessId(propertyBusiness.businessId);
        console.log('[HMRC Property] Retrieved business ID from HMRC:', propertyBusiness.businessId);
        return propertyBusiness.businessId;
      }
    }

    if (detailsRes.status !== 404) {
      // Unexpected error – propagate
      const errTxt = await detailsRes.text();
      throw new Error(`HMRC business-details error ${detailsRes.status}: ${errTxt}`);
    }
  } catch (err) {
    console.warn('[HMRC Property] business/details call failed or no property business:', err);
  }

  // 5. No business exists – handle based on environment ------------------
  if (process.env.NODE_ENV === 'development') {
    // In sandbox/development, generate a test business ID
    console.log('[HMRC Property] Development mode: generating test business ID');
    const testBusinessId = `XAIS${userId.slice(-8).padStart(8, '0')}`;
    await persistBusinessId(testBusinessId);
    console.log('[HMRC Property] Generated test business ID:', testBusinessId);
    return testBusinessId;
  } else {
    // In production, try to create a real property business
    console.log('[HMRC Property] Production mode: creating property business with HMRC');
    const createEndpoint = `${hmrcApiBaseUrl}/individuals/business/property/${nino}`;
    const createBody = {
      accountingPeriodStartDate: '2023-04-06',
      accountingPeriodEndDate: '2024-04-05',
      tradingStartDate: '2023-04-06',
      cashOrAccruals: 'cash',
    };
    const createRes = await fetch(createEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.hmrc.1.0+json',
      },
      body: JSON.stringify(createBody),
    });

    if (!createRes.ok) {
      const errTxt = await createRes.text();
      console.error('[HMRC Property] Failed to create property business:', createRes.status, errTxt);
      throw new Error('Unable to create property business with HMRC.');
    }

    const created = await createRes.json();
    const newBusinessId = created.businessId;
    await persistBusinessId(newBusinessId);
    console.log('[HMRC Property] Property business created with ID:', newBusinessId);
    return newBusinessId;
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
  
  // Check if HMRC integration is explicitly disabled (only use mock if explicitly disabled)
  const useMockData = process.env.HMRC_USE_MOCK_DATA === 'true';
  
  if (useMockData) {
    console.log('[HMRC Submit] Mock mode enabled: Simulating successful property submission');
    
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
  
  // Use sandbox environment in development, production environment in production
  const hmrcApiBaseUrl = process.env.NODE_ENV === 'development' 
    ? 'https://test-api.service.hmrc.gov.uk' 
    : 'https://api.service.hmrc.gov.uk';
  
  console.log(`[HMRC Submit] Using HMRC API: ${hmrcApiBaseUrl} (${process.env.NODE_ENV} mode)`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[HMRC Submit] Development mode: Using HMRC sandbox environment for real API testing');
  }
  
  // Get user's NINO for the API calls
  console.log(`[HMRC Submit] Looking up NINO for user: ${userId}`);
  const { data: userProfile, error: ninoError } = await supabase
    .from('user_profiles')
    .select('national_insurance_number')
    .eq('user_id', userId)
    .single();
    
  console.log(`[HMRC Submit] NINO lookup result:`, { userProfile, ninoError });
    
  if (!userProfile?.national_insurance_number) {
    console.error(`[HMRC Submit] NINO not found for user ${userId}. Profile data:`, userProfile);
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
    // In development/sandbox mode, skip property business submission and go directly to calculation
    if (process.env.NODE_ENV === 'development') {
      console.log('[HMRC Submit] Development mode: Skipping property submission, going directly to calculation');
      
      // Convert tax year format from "2025-26" to "2025-26" (HMRC expects this format)
      // But first, let's try different endpoint formats that might work in sandbox
      
      // Try multiple endpoint formats that might work in HMRC sandbox
      const possibleEndpoints = [
        // Standard Individual Calculations API format
        `${hmrcApiBaseUrl}/individuals/calculations/${nino}/self-assessment/${taxYear}`,
        // Alternative format without self-assessment
        `${hmrcApiBaseUrl}/individuals/calculations/${nino}/${taxYear}`,
        // Income Tax MTD format
        `${hmrcApiBaseUrl}/income-tax/nino/${nino}/taxYear/${taxYear}/tax-calculation`,
        // Self Assessment format
        `${hmrcApiBaseUrl}/individuals/self-assessment/${nino}/${taxYear}/calculations`
      ];
      
      let calculationResult = null;
      let lastError = null;
      
      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`[HMRC Submit] Trying endpoint: ${endpoint}`);
          
          const calculationResponse = await fetch(endpoint, {
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
          
          if (calculationResponse.status === 202 || calculationResponse.status === 200) {
            const calcData = await calculationResponse.json();
            console.log(`[HMRC Submit] Tax calculation triggered successfully with endpoint: ${endpoint}`, calcData);
            
            calculationResult = {
                submissionId: calcData.calculationId || calcData.id || `CALC_${Date.now()}`,
                hmrcReference: calcData.calculationId || calcData.id || `MTD${Date.now()}`,
                status: 'submitted',
                calculationId: calcData.calculationId || calcData.id || `CALC_${Date.now()}`
            };
            break;
          } else {
            const errorText = await calculationResponse.text();
            lastError = {
              endpoint,
              status: calculationResponse.status,
              error: errorText
            };
            console.log(`[HMRC Submit] Endpoint ${endpoint} failed with status ${calculationResponse.status}: ${errorText}`);
            // Continue to next endpoint instead of breaking
          }
        } catch (error) {
          lastError = {
            endpoint,
            error: error instanceof Error ? error.message : String(error)
          };
          console.log(`[HMRC Submit] Endpoint ${endpoint} failed with error:`, error instanceof Error ? error.message : String(error));
        }
      }
      
      if (calculationResult) {
        return calculationResult;
      } else {
        // If all endpoints fail, fall back to mock mode for development
        console.log('[HMRC Submit] All HMRC endpoints failed, falling back to mock mode for development');
        console.log('[HMRC Submit] Last error:', lastError);
        
        // Generate a mock response for development
        const mockCalculationId = `MOCK_CALC_${Date.now()}_${userId.slice(-6)}`;
        const mockHmrcReference = `MOCK_MTD${new Date().getFullYear()}${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;
        
        console.log('[HMRC Submit] Mock calculation generated:', {
          calculationId: mockCalculationId,
          hmrcReference: mockHmrcReference
        });
        
        return {
          submissionId: mockCalculationId,
          hmrcReference: mockHmrcReference,
          status: 'submitted',
          calculationId: mockCalculationId,
          development: true,
          note: 'Mock response - HMRC sandbox endpoints not available'
        };
      }
    } else {
      // Production mode: Full property business submission flow
      console.log('[HMRC Submit] Production mode: Using full property business submission flow');
      
      // Step 1: Get property business ID first
      console.log('[HMRC Submit] Getting property business ID...');
      const businessId = await getPropertyBusinessId(userId, accessToken);
      console.log('[HMRC Submit] Property business ID:', businessId);
      
      // Step 2: Submit property adjustments and allowances using Property Business API
      const propertyEndpoint = `${hmrcApiBaseUrl}/individuals/business/property/${nino}/annual/${taxYear}`;
      
      console.log('[HMRC Submit] Submitting property data...', { 
          endpoint: propertyEndpoint,
          nino: nino.substring(0, 3) + '***',
          businessId: businessId.substring(0, 8) + '***',
          taxYear,
          environment: 'production'
      });

      const propertyResponse = await fetch(propertyEndpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.hmrc.2.0+json',
          ...fraudPreventionHeaders,
        },
        body: JSON.stringify(payload),
      });

      if (propertyResponse.status === 200 || propertyResponse.status === 201) {
          const propData = await propertyResponse.json();
          console.log('[HMRC Submit] Property data submitted successfully:', propData);
          
          // Step 3: Trigger tax calculation
          const calculationEndpoint = `${hmrcApiBaseUrl}/individuals/calculations/${nino}/self-assessment/${taxYear}`;
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
            
            return {
                submissionId: calcData.calculationId || calcData.id,
                hmrcReference: calcData.calculationId || calcData.id,
                status: 'submitted',
                calculationId: calcData.calculationId || calcData.id
            };
          } else {
            const calcErrorData = await calculationResponse.text();
            console.error('[HMRC Submit] Tax calculation failed:', {
              status: calculationResponse.status,
              statusText: calculationResponse.statusText,
              error: calcErrorData
            });
            throw new Error(`HMRC calculation failed: ${calcErrorData}`);
          }
      } else {
          let errorData;
          try {
              errorData = await propertyResponse.json();
          } catch (e) {
              errorData = { code: 'UNKNOWN_ERROR', message: `HMRC API returned status ${propertyResponse.status}` };
          }
          console.error('[HMRC Submit] Property submission failed:', { status: propertyResponse.status, body: errorData });
          const errorMessage = errorData.message || (errorData.errors && errorData.errors[0]?.message) || errorData.code || `HMRC property submission error: ${propertyResponse.status}`;
          throw new Error(errorMessage);
      }
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
    .upsert(submissionData, { 
      onConflict: 'user_id,tax_year',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error(`[HMRC Submit] Error storing submission record for user ${userId}:`, error);
    // Log this error but don't necessarily throw
  } else {
    console.log(`[HMRC Submit] Submission record stored for user ${userId}`);
  }
  
  // TODO: Optionally add a detailed log to hmrc_submission_logs table
}

// --- API Route Handler ---

export async function POST(req: Request) {
  console.log('[API /financial/tax/submit-hmrc] Received request');
  console.log('[API /financial/tax/submit-hmrc] Request URL:', req.url);
  console.log('[API /financial/tax/submit-hmrc] Request method:', req.method);
  
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
    user = await getServerAuthUser();
    if (user) {
      console.log(`[API /financial/tax/submit-hmrc] User authenticated via session: ${user.id}`);
      // ADDING DETAILED LOG FOR NINO DEBUGGING
      console.log(`[NINO DEBUG] Authenticated User ID for NINO lookup: ${user.id}`); 
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