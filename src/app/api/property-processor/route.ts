import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Property Assistant ID
const PROPERTY_ASSISTANT_ID = "asst_w0OLco3hGCoHgDQ2Sc0qae8g";

export async function POST(request: NextRequest) {
  try {
    const { spreadsheetData } = await request.json();
    
    if (!spreadsheetData) {
      return NextResponse.json({ error: 'Missing required spreadsheet data' }, { status: 400 });
    }

    // Create a thread
    const thread = await openai.beta.threads.create();

    // Add a message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `Please process the following property data from a spreadsheet upload: ${JSON.stringify(spreadsheetData)}

      Extract all properties with their details including:
      - address
      - propertyType (house, apartment, studio, hmo, commercial)
      - bedrooms
      - bathrooms
      - isHmo (whether it's an HMO property)
      - acquisitionDate
      - purchasePrice
      - currentValue
      - mortgageProvider
      - mortgageAccountNumber
      - mortgageAmount
      - mortgageTermYears
      - interestRate
      - monthlyPayment

      Format your response as a valid JSON object with an array of properties. Each property should include all available fields from the data.
      `
    });

    // Run the Assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: PROPERTY_ASSISTANT_ID,
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
                    
    let parsedData;
    if (jsonMatch) {
      try {
        parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (e) {
        throw new Error("Failed to parse JSON response from assistant");
      }
    } else {
      throw new Error("No valid JSON found in assistant response");
    }
    
    // Generate IDs for each property
    const propertiesWithIds = parsedData.properties.map((property: any, index: number) => ({
      id: `prop_${Date.now()}_${index}`,
      ...property
    }));
    
    // Return the structured data
    return NextResponse.json({ 
      success: true,
      properties: propertiesWithIds
    });
    
  } catch (error) {
    console.error('Error processing property data:', error);
    return NextResponse.json({ error: 'Failed to process property data' }, { status: 500 });
  }
} 