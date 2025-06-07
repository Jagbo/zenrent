import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { GoogleAuth } from 'google-auth-library';

interface VertexAIResponse {
  predictions: Array<{
    content: string;
  }>;
}

interface MortgageDocumentData {
  lender: string;
  amount: number;
  interestRate: number;
  termYears: number;
  monthlyPayment: number;
  startDate?: string;
  maturityDate?: string;
  propertyAddress?: string;
  borrowerName?: string;
  accountNumber?: string;
  productType?: string;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PDF, JPEG, PNG, or TIFF files.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to base64 for API
    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');

    // Initialize Google Auth
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS 
        ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)
        : undefined
    });

    const accessToken = await auth.getAccessToken();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'your-project-id';
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    // Try Document AI first for OCR (optional, graceful fallback)
    let extractedText = '';
    try {
      const docAiResponse = await fetch(
        `https://${location}-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/YOUR_PROCESSOR_ID:process`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rawDocument: {
              content: base64Data,
              mimeType: file.type,
            },
          }),
        }
      );

      if (docAiResponse.ok) {
        const docAiResult = await docAiResponse.json();
        extractedText = docAiResult.document?.text || '';
      }
    } catch (error) {
      console.log('Document AI not available, using Vertex AI directly:', error);
    }

    // Use Vertex AI Gemini for intelligent extraction
    const vertexAiResponse = await fetch(
      `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-1.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Please analyze this mortgage document and extract the following information in JSON format:

{
  "lender": "Lender/Bank name",
  "amount": "Mortgage amount as number (no currency symbols)",
  "interestRate": "Interest rate as decimal (e.g., 3.5 for 3.5%)",
  "termYears": "Mortgage term in years as number",
  "monthlyPayment": "Monthly payment amount as number",
  "startDate": "Start date in YYYY-MM-DD format",
  "maturityDate": "Maturity date in YYYY-MM-DD format",
  "propertyAddress": "Property address",
  "borrowerName": "Borrower name",
  "accountNumber": "Account or mortgage reference number",
  "productType": "Type of mortgage product (e.g., Fixed Rate, Variable, etc.)"
}

Please extract this information from the mortgage document. If any field is not clearly visible, use null for that field. Here's the document:

${extractedText ? `Text content: ${extractedText}` : 'Document attached as image.'}
`
                },
                ...(extractedText ? [] : [
                  {
                    inlineData: {
                      mimeType: file.type,
                      data: base64Data,
                    },
                  },
                ])
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!vertexAiResponse.ok) {
      const errorText = await vertexAiResponse.text();
      console.error('Vertex AI API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to process document with AI service' },
        { status: 500 }
      );
    }

    const vertexAiResult = await vertexAiResponse.json();
    const generatedText = vertexAiResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json(
        { error: 'No text generated from AI service' },
        { status: 500 }
      );
    }

    // Parse JSON from the AI response
    let extractedData: MortgageDocumentData;
    try {
      // Clean the response - remove markdown code blocks if present
      const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
      extractedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedText);
      return NextResponse.json(
        { error: 'Failed to parse extracted data' },
        { status: 500 }
      );
    }

    // Validate and clean extracted data
    const validatedData: MortgageDocumentData = {
      lender: typeof extractedData.lender === 'string' ? extractedData.lender : '',
      amount: typeof extractedData.amount === 'number' ? extractedData.amount : 0,
      interestRate: typeof extractedData.interestRate === 'number' ? extractedData.interestRate : 0,
      termYears: typeof extractedData.termYears === 'number' ? extractedData.termYears : 0,
      monthlyPayment: typeof extractedData.monthlyPayment === 'number' ? extractedData.monthlyPayment : 0,
      startDate: extractedData.startDate || undefined,
      maturityDate: extractedData.maturityDate || undefined,
      propertyAddress: extractedData.propertyAddress || undefined,
      borrowerName: extractedData.borrowerName || undefined,
      accountNumber: extractedData.accountNumber || undefined,
      productType: extractedData.productType || undefined,
    };

    return NextResponse.json({
      success: true,
      extractedData: validatedData,
    });

  } catch (error) {
    console.error('Error processing mortgage document:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing document' },
      { status: 500 }
    );
  }
}

async function extractMortgageInfoWithVertexAI(
  base64Data: string, 
  mimeType: string
): Promise<MortgageDocumentData> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  
  if (!projectId) {
    throw new Error('Google Cloud Project ID not configured');
  }

  // Create authentication
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const authClient = await auth.getClient();

  // Prepare the prompt for mortgage document extraction
  const prompt = `
You are an expert document parser specializing in mortgage and loan documents. Extract the following information from this mortgage document:

Required fields:
- Lender name/institution
- Loan/mortgage amount (numerical value only)
- Interest rate (percentage as decimal, e.g., 3.5 for 3.5%)
- Term in years (numerical value only)
- Monthly payment amount (numerical value only)

Optional fields:
- Start date (in YYYY-MM-DD format)
- Maturity/end date (in YYYY-MM-DD format)
- Property address
- Borrower name
- Account/loan number
- Product type (e.g., Fixed Rate, Variable Rate, etc.)

Return the information in this exact JSON format:
{
  "lender": "string",
  "amount": number,
  "interestRate": number,
  "termYears": number,
  "monthlyPayment": number,
  "startDate": "YYYY-MM-DD or null",
  "maturityDate": "YYYY-MM-DD or null",
  "propertyAddress": "string or null",
  "borrowerName": "string or null",
  "accountNumber": "string or null",
  "productType": "string or null"
}

Important:
- Extract numerical values without currency symbols or commas
- Interest rates should be decimal numbers (e.g., 3.5 for 3.5%)
- If information is not found, use null for optional fields
- Be precise and only extract information that is clearly visible in the document
`;

  const requestPayload = {
    instances: [
      {
        content: prompt
      }
    ],
    parameters: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      topP: 0.8,
      topK: 40
    }
  };

  try {
    // Use Document AI for OCR if needed, then send to Vertex AI for extraction
    let extractedText = '';
    
    if (mimeType === 'application/pdf' || mimeType.startsWith('image/')) {
      extractedText = await performOCRWithDocumentAI(base64Data, mimeType, authClient);
    }

    // Send to Vertex AI for intelligent extraction
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-pro:predict`;
    
    // Update the prompt to include the extracted text
    const finalPrompt = `${prompt}\n\nDocument text:\n${extractedText}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await authClient.getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...requestPayload,
        instances: [{ content: finalPrompt }]
      }),
    });

    if (!response.ok) {
      throw new Error(`Vertex AI API error: ${response.status} ${response.statusText}`);
    }

    const result: VertexAIResponse = await response.json();
    
    if (!result.predictions || result.predictions.length === 0) {
      throw new Error('No predictions returned from Vertex AI');
    }

    // Parse the JSON response from the AI
    const content = result.predictions[0].content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    const extractedData = JSON.parse(jsonMatch[0]);
    
    // Validate and clean the extracted data
    return validateAndCleanMortgageData(extractedData);

  } catch (error) {
    console.error('Vertex AI extraction error:', error);
    throw new Error('Failed to extract mortgage information with AI');
  }
}

async function performOCRWithDocumentAI(
  base64Data: string, 
  mimeType: string, 
  authClient: any
): Promise<string> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
  const processorId = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID;

  if (!processorId) {
    console.warn('Document AI processor not configured, skipping OCR');
    return '';
  }

  try {
    const endpoint = `https://${location}-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}:process`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await authClient.getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rawDocument: {
          content: base64Data,
          mimeType: mimeType,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`Document AI OCR failed: ${response.status}`);
      return '';
    }

    const result = await response.json();
    return result.document?.text || '';
    
  } catch (error) {
    console.warn('Document AI OCR error:', error);
    return '';
  }
}

function validateAndCleanMortgageData(data: any): MortgageDocumentData {
  // Set defaults and validate required fields
  const cleaned: MortgageDocumentData = {
    lender: (data.lender || '').toString().trim(),
    amount: parseFloat(data.amount) || 0,
    interestRate: parseFloat(data.interestRate) || 0,
    termYears: parseInt(data.termYears) || 0,
    monthlyPayment: parseFloat(data.monthlyPayment) || 0,
    startDate: data.startDate || undefined,
    maturityDate: data.maturityDate || undefined,
    propertyAddress: data.propertyAddress || undefined,
    borrowerName: data.borrowerName || undefined,
    accountNumber: data.accountNumber || undefined,
    productType: data.productType || undefined,
  };

  // Basic validation
  if (!cleaned.lender) {
    throw new Error('Could not extract lender information');
  }

  if (cleaned.amount <= 0) {
    throw new Error('Could not extract valid mortgage amount');
  }

  if (cleaned.interestRate <= 0 || cleaned.interestRate > 100) {
    throw new Error('Could not extract valid interest rate');
  }

  if (cleaned.termYears <= 0 || cleaned.termYears > 50) {
    throw new Error('Could not extract valid term years');
  }

  if (cleaned.monthlyPayment <= 0) {
    throw new Error('Could not extract valid monthly payment');
  }

  return cleaned;
} 