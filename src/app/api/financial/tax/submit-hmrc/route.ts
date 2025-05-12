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
 * Formats the user's tax data into the structure required by the HMRC API.
 * TODO: Replace placeholder with actual data fetching and HMRC schema mapping.
 */
async function formatTaxDataForHmrc(userId: string, taxYear: string): Promise<any> {
  console.log(`[HMRC Format] Formatting data for user ${userId}, tax year ${taxYear}`);
  
  // 1. Fetch necessary data
  //    - User Profile (UTR, Name, etc.)
  //    - Property Details (for SA105)
  //    - Finalized categorized transactions for the tax year
  //    - Any adjustments, allowances, other income from later steps in your tax flow
  // Example (fetching similar data as PDF generation):
  // const userData = await getUserTaxData(userId, taxYear); // (Need to adapt getUserTaxData or create a new fetcher)

  // 2. Map fetched data to HMRC JSON structure
  //    This structure depends heavily on the specific HMRC submission endpoint being used.
  //    Consult the HMRC API reference documentation for the exact schema.
  
  // Example Placeholder Structure (MUST BE REPLACED)
  const hmrcPayload = {
    nino: "", // Or UTR depending on API requirements
    taxYear: taxYear.replace('/', '-'), // Format like 2023-24
    calculationId: "", // May be required if a calculation was retrieved first
    finalDeclaration: true, // Assuming this is for the final submission
    // --- SA100 / Main Return Fields (Example) ---
    personalInformation: {
      // ... name, address, dob, etc. ...
    },
    // --- SA105 / UK Property Fields (Example) ---
    ukProperty: [
      {
        propertyId: "PROP123", // Your internal ID might not be needed by HMRC
        address: { /* ... */ },
        income: {
          totalRentsReceived: 0, // Calculate from userData.transactions
          // ... other income fields ...
        },
        expenses: {
          repairsAndMaintenance: 0, // Calculate from userData.transactions
          insurance: 0,
          legalProfessionalFees: 0,
          financeCosts: 0, // e.g., mortgage interest
          otherAllowableExpenses: 0,
          // Map your categories to these HMRC fields
        },
        adjustments: {
          // ... private use adjustments, etc. ...
        }
      }
      // Add more properties if applicable
    ],
    // ... other sections for different income sources (Self-Employment, Dividends, etc.) ...
  };
  
  console.log('[HMRC Format] Data formatted (placeholder):', hmrcPayload);
  // TODO: Replace placeholder with actual data mapping based on HMRC schema
  // Ensure all monetary values are in the correct format (e.g., pounds and pence, no symbols)
  return hmrcPayload; 
}

/**
 * Submits the formatted tax data to the appropriate HMRC API endpoint.
 * Populates Fraud Prevention Headers using data from the frontend.
 */
async function submitToHmrc(payload: any, accessToken: string, fraudData: any, userId: string): Promise<any> {
  console.log('[HMRC Submit] Submitting data to HMRC...');
  const HMRC_SUBMISSION_ENDPOINT = 'https://test-api.service.hmrc.gov.uk/individuals/submissions/self-assessment'; // *** Replace with actual endpoint ***
  
  // --- Populate Fraud Prevention Headers --- 
  const fraudPreventionHeaders = {
      'Gov-Client-Connection-Method': 'WEB_APP_VIA_SERVER',
      'Gov-Client-Device-ID': fraudData?.deviceId || 'unknown', // Use provided data or default
      'Gov-Client-User-IDs': `userId=${userId}`, // Use the authenticated backend user ID
      'Gov-Client-Timezone': fraudData?.timezone || 'unknown',
      'Gov-Client-Local-IPs': fraudData?.localIps || 'unknown', 
      // Only include timestamp if IP was provided (and timestamp logic implemented)
      // 'Gov-Client-Local-IPs-Timestamp': fraudData?.localIpsTimestamp || new Date().toISOString(), 
      'Gov-Client-User-Agent': fraudData?.userAgent || 'unknown',
      'Gov-Client-Screens': `width=${fraudData?.screenDetails?.split('x')[0] || 'unknown'}&height=${fraudData?.screenDetails?.split('x')[1] || 'unknown'}&scaling-factor=1&colour-depth=${fraudData?.screenDetails?.split('x')[2] || 'unknown'}`,
      'Gov-Client-Window-Size': `width=${fraudData?.windowSize?.split('x')[0] || 'unknown'}&height=${fraudData?.windowSize?.split('x')[1] || 'unknown'}`,
      'Gov-Vendor-Version': 'ZenRent=1.0.0', // Your app version - consider making dynamic
      'Gov-Vendor-Product-Name': 'ZenRent',
      // Add other headers if data is available
  };

  console.log('[HMRC Submit] Using Headers:', { 
      Authorization: 'Bearer ***', // Keep token masked
      ...fraudPreventionHeaders 
  });

  const response = await fetch(HMRC_SUBMISSION_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.hmrc.1.0+json',
      ...fraudPreventionHeaders, // Spread the populated headers
    },
    body: JSON.stringify(payload),
  });

  // Handle potential 202 Accepted or 200 OK responses
  if (response.status === 202 || response.status === 200) {
      const responseData = await response.json().catch(() => ({}));
      console.log('[HMRC Submit] Submission successful/accepted. HMRC Response:', responseData);
      return {
          submissionId: responseData.id || responseData.submissionId || null, 
          hmrcReference: responseData.processingId || responseData.confirmationReference || null,
          status: response.status === 202 ? 'processing' : 'submitted',
      };
  } else {
      let errorData;
      try {
          errorData = await response.json();
      } catch (e) {
          errorData = { code: 'UNKNOWN_ERROR', message: `HMRC API returned status ${response.status}` };
      }
      console.error('[HMRC Submit] HMRC API submission failed:', { status: response.status, body: errorData });
      const errorMessage = errorData.message || (errorData.errors && errorData.errors[0]?.message) || errorData.code || `HMRC API error: ${response.status}`;
      throw new Error(errorMessage);
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
  const { error } = await supabase
    .from('tax_submissions')
    .upsert({
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
    }, { onConflict: 'user_id, tax_year, submission_type' });

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
  
  // If session auth failed but userId was provided in request body (for ngrok usage)
  if (!user && body.userId) {
    console.log(`[API /financial/tax/submit-hmrc] Using userId from request body: ${body.userId}`);
    user = { id: body.userId };
    
    // Optional: Verify the userId exists in your database
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', body.userId)
        .single();
        
      if (error || !data) {
        console.error(`[API /financial/tax/submit-hmrc] Invalid userId provided: ${body.userId}`);
        return NextResponse.json({ error: 'Invalid user ID' }, { status: 401 });
      }
    } catch (verifyError) {
      console.error('[API /financial/tax/submit-hmrc] Error verifying user:', verifyError);
    }
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
    payload = await formatTaxDataForHmrc(user.id, taxYear);

    // 3. Submit to HMRC (Pass fraud data and user ID)
    const submissionResult = await submitToHmrc(payload, accessToken, fraudHeadersData, user.id);

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