import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tenant Assistant ID
const TENANT_ASSISTANT_ID = "asst_Rm4ndGEifO2vmK6jlFWkNq3l";

export async function POST(request: NextRequest) {
  try {
    const { 
      propertyData, // This should contain all necessary property information
      spreadsheetData // This contains the tenant spreadsheet data
    } = await request.json();
    
    if (!propertyData || !spreadsheetData) {
      return NextResponse.json({ 
        error: 'Missing required property data or spreadsheet data',
        requiredFormat: {
          propertyData: {
            id: "string - property identifier",
            address: "string - property address",
            propertyType: "string - type of property",
            bedrooms: "string - number of bedrooms",
            isHmo: "boolean - whether the property is an HMO"
          },
          spreadsheetData: "array - tenant data from spreadsheet"
        }
      }, { status: 400 });
    }

    // Extract property information
    const { id: propertyId, address: propertyAddress, propertyType, isHmo } = propertyData;

    // Ensure required property fields are present
    if (!propertyId || !propertyAddress || (isHmo === undefined)) {
      return NextResponse.json({ 
        error: 'Incomplete property data. Please provide id, address, and isHmo flag.',
        providedData: propertyData
      }, { status: 400 });
    }

    // Create a thread
    const thread = await openai.beta.threads.create();

    // Add a message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `Please process the following tenant data from a spreadsheet upload for property ID: ${propertyId}.

Property details:
- Address: ${propertyAddress}
- Type: ${propertyType || 'Not specified'}
- Is HMO: ${isHmo ? 'Yes' : 'No'}
${isHmo ? `- Bedrooms: ${propertyData.bedrooms || 'Not specified'}` : ''}

${isHmo 
  ? 'For this HMO property, each room has its own tenant with potentially separate tenancy details.' 
  : 'For this standard property, multiple tenants may share the same tenancy details.'}

Here is the tenant data: ${JSON.stringify(spreadsheetData)}

Format your response as a valid JSON object with the following structure:
${isHmo 
  ? `{
  "propertyId": "${propertyId}",
  "propertyAddress": "${propertyAddress}",
  "rooms": [
    {
      "roomNumber": "room identifier",
      "tenant": {
        "firstName": "tenant first name",
        "lastName": "tenant last name",
        "phoneNumber": "tenant phone",
        "email": "tenant email"
      },
      "tenancyDetails": {
        "agreementType": "ast/non-ast/company-let/student/other",
        "tenancyTerm": "fixed/periodic",
        "startDate": "DD/MM/YYYY",
        "endDate": "DD/MM/YYYY",
        "hasBreakClause": true/false,
        "breakClauseDetails": "details if any",
        "rentAmount": "amount",
        "rentFrequency": "weekly/monthly/quarterly/annually",
        "rentDueDay": "1-31",
        "paymentMethod": "bank-transfer/standing-order/direct-debit/cash/check",
        "depositAmount": "amount",
        "depositScheme": "scheme name",
        "depositRegistrationDate": "DD/MM/YYYY",
        "depositRegistrationRef": "reference"
      }
    }
  ]
}`
  : `{
  "propertyId": "${propertyId}",
  "propertyAddress": "${propertyAddress}",
  "tenancyDetails": {
    "agreementType": "ast/non-ast/company-let/student/other",
    "tenancyTerm": "fixed/periodic",
    "startDate": "DD/MM/YYYY",
    "endDate": "DD/MM/YYYY",
    "hasBreakClause": true/false,
    "breakClauseDetails": "details if any",
    "rentAmount": "amount",
    "rentFrequency": "weekly/monthly/quarterly/annually",
    "rentDueDay": "1-31",
    "paymentMethod": "bank-transfer/standing-order/direct-debit/cash/check",
    "depositAmount": "amount",
    "depositScheme": "scheme name",
    "depositRegistrationDate": "DD/MM/YYYY",
    "depositRegistrationRef": "reference"
  },
  "tenants": [
    {
      "firstName": "tenant first name",
      "lastName": "tenant last name",
      "phoneNumber": "tenant phone",
      "email": "tenant email"
    }
  ]
}`}
`
    });

    // Run the Assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: TENANT_ASSISTANT_ID,
    });

    // Poll for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
    // Wait for the run to complete (simple polling)
    while (runStatus.status !== "completed") {
      if (["failed", "cancelled", "expired"].includes(runStatus.status)) {
        throw new Error(`Assistant run failed with status: ${runStatus.status}`);
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Get the messages from the thread
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    // Find the last assistant message
    const lastAssistantMessage = messages.data
      .filter(message => message.role === "assistant")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    if (!lastAssistantMessage) {
      throw new Error("No response from assistant");
    }

    // Parse the response content for JSON
    let responseContent = "";
    if (lastAssistantMessage.content[0].type === "text") {
      responseContent = lastAssistantMessage.content[0].text.value;
    }

    // Extract JSON from the text response
    let jsonMatch = responseContent.match(/```json\n([\s\S]*?)\n```/) || 
                    responseContent.match(/```\n([\s\S]*?)\n```/) ||
                    responseContent.match(/{[\s\S]*}/);
                    
    let structuredData;
    if (jsonMatch) {
      try {
        structuredData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e) {
        throw new Error("Failed to parse JSON response from assistant");
      }
    } else {
      throw new Error("No valid JSON found in assistant response");
    }
    
    // Return the structured data with explicit property type
    return NextResponse.json({ 
      success: true,
      propertyData: {
        id: propertyId,
        address: propertyAddress,
        propertyType: propertyType || (isHmo ? 'hmo' : 'standard'),
        isHmo
      },
      structuredData: structuredData,
      propertyType: isHmo ? 'hmo' : 'standard'
    });
    
  } catch (error) {
    console.error('Error processing tenant data:', error);
    return NextResponse.json({ error: 'Failed to process tenant data' }, { status: 500 });
  }
} 