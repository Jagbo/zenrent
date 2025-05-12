import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
// Ensure OPENAI_API_KEY is set in your environment variables
const openai = new OpenAI(); 

const assistantId = 'asst_jpYzMhOHm5PHzfOCU4pi6uzK'; // Your Assistant ID

// Define the Transaction type based on frontend usage
type Transaction = {
  id: string;
  name: string | null;
  date: string;
  amount: number;
  category: string | null;
  bank_account_id?: string;
  bank_name?: string;
  account_number_end?: string;
  is_manually_added?: boolean;
};

// Predefined categories (for reference in prompt)
const categories = [
  { value: "rental_income", label: "Rental Income", type: "income" },
  { value: "repairs_maintenance", label: "Repairs & Maintenance", type: "expense" },
  { value: "insurance", label: "Insurance", type: "expense" },
  { value: "mortgage_interest", label: "Mortgage Interest", type: "expense" },
  { value: "agent_fees", label: "Agent Fees", type: "expense" },
  { value: "utilities", label: "Utilities", type: "expense" },
  { value: "council_tax", label: "Council Tax", type: "expense" },
  { value: "travel", label: "Travel", type: "expense" },
  { value: "office_admin", label: "Office/Admin", type: "expense" },
  { value: "legal_professional", label: "Legal & Professional", type: "expense" },
  { value: "other_expense", label: "Other Expense", type: "expense" },
  { value: "exclude", label: "Exclude", type: "exclude" }, // For transactions not relevant to tax
];

// Create a set of valid category values for quick lookup
const validCategoryValues = new Set(categories.map(c => c.value));

// Helper function to delay execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check API token validity
const checkApiValidity = async () => {
  try {
    // Simple check if the API key works by making a lightweight API call
    // Use a different endpoint that doesn't require the limit parameter
    await openai.models.retrieve("gpt-3.5-turbo");
    return true;
  } catch (error) {
    console.error('[API /openai/categorize-transactions] OpenAI API key validation failed:', error);
    return false;
  }
};

// Simple fallback categorization function that doesn't use OpenAI
function fallbackCategorize(transaction: Transaction): string {
  const nameStr = (transaction.name || '').toLowerCase();
  const amount = transaction.amount;
  
  // Simple pattern matching for common transactions
  
  // Check for rental income
  if (
    amount > 0 && 
    (nameStr.includes('rent') || 
     nameStr.includes('payment received') || 
     nameStr.includes('transfer from') || 
     nameStr.includes('deposit'))
  ) {
    return 'rental_income';
  }
  
  // Check for insurance
  if (
    nameStr.includes('insurance') || 
    nameStr.includes('protect') ||
    nameStr.includes('aviva') ||
    nameStr.includes('axa') ||
    nameStr.includes('policy')
  ) {
    return 'insurance';
  }
  
  // Check for utilities
  if (
    nameStr.includes('energy') ||
    nameStr.includes('electric') ||
    nameStr.includes('gas') ||
    nameStr.includes('water') ||
    nameStr.includes('utility') ||
    nameStr.includes('british gas') ||
    nameStr.includes('eon') ||
    nameStr.includes('thames water') ||
    nameStr.includes('anglian water') ||
    nameStr.includes('scottish power')
  ) {
    return 'utilities';
  }
  
  // Check for mortgage/interest
  if (
    nameStr.includes('mortgage') ||
    nameStr.includes('interest') ||
    nameStr.includes('loan payment') ||
    nameStr.includes('repayment') ||
    nameStr.includes('halifax mortgage') ||
    nameStr.includes('natwest mortgage') ||
    nameStr.includes('hsbc mortgage')
  ) {
    return 'mortgage_interest';
  }
  
  // Check for agent fees
  if (
    nameStr.includes('agent') ||
    nameStr.includes('letting') ||
    nameStr.includes('management fee') ||
    nameStr.includes('agency')
  ) {
    return 'agent_fees';
  }
  
  // Check for council tax
  if (
    nameStr.includes('council tax') ||
    nameStr.includes('council') ||
    nameStr.includes('local authority')
  ) {
    return 'council_tax';
  }

  // Check for repairs and maintenance
  if (
    nameStr.includes('repair') ||
    nameStr.includes('maint') ||
    nameStr.includes('plumb') ||
    nameStr.includes('electric') ||
    nameStr.includes('handyman') ||
    nameStr.includes('builder') ||
    nameStr.includes('home depot') ||
    nameStr.includes('b&q') ||
    nameStr.includes('wickes') ||
    nameStr.includes('screwfix') ||
    nameStr.includes('tools')
  ) {
    return 'repairs_maintenance';
  }
  
  // Check for travel
  if (
    nameStr.includes('travel') ||
    nameStr.includes('taxi') ||
    nameStr.includes('uber') ||
    nameStr.includes('train') ||
    nameStr.includes('rail') ||
    nameStr.includes('transport') ||
    nameStr.includes('petrol') ||
    nameStr.includes('gas station') ||
    nameStr.includes('parking')
  ) {
    return 'travel';
  }
  
  // Check for office/admin
  if (
    nameStr.includes('office') ||
    nameStr.includes('admin') ||
    nameStr.includes('stationery') ||
    nameStr.includes('phone') ||
    nameStr.includes('mobile') ||
    nameStr.includes('software') ||
    nameStr.includes('subscription') ||
    nameStr.includes('printer') ||
    nameStr.includes('computer') ||
    nameStr.includes('laptop')
  ) {
    return 'office_admin';
  }

  // Check for legal/professional
  if (
    nameStr.includes('legal') ||
    nameStr.includes('solicitor') ||
    nameStr.includes('accountant') ||
    nameStr.includes('lawyer') ||
    nameStr.includes('conveyancing') ||
    nameStr.includes('tax adviser') ||
    nameStr.includes('surveyor')
  ) {
    return 'legal_professional';
  }
  
  // For any other property-related expenses
  if (
    nameStr.includes('property') ||
    nameStr.includes('house') ||
    nameStr.includes('flat') ||
    nameStr.includes('apartment') ||
    nameStr.includes('tenant')
  ) {
    return 'other_expense';
  }
  
  // Default to exclude for other transactions
  return 'exclude';
}

export async function POST(req: Request) {
  console.log('[API /openai/categorize-transactions] Received request');
  
  // First, verify API key validity to prevent HTML responses
  const isApiValid = await checkApiValidity();
  if (!isApiValid) {
    console.error('[API /openai/categorize-transactions] Invalid OpenAI API key configuration');
    return NextResponse.json(
      { error: 'OpenAI API key configuration issue. Please check server logs.' }, 
      { status: 500 }
    );
  }
  
  try {
    const body = await req.json();
    const transactions: Transaction[] = body.transactions;

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions provided' }, { status: 400 });
    }
    
    console.log(`[API /openai/categorize-transactions] Processing ${transactions.length} transactions.`);

    // Handle batching for large transaction sets
    const BATCH_SIZE = 25; // Reduce batch size to 25 to lower chance of timeouts
    let finalTransactions: Transaction[] = [];
    
    if (transactions.length > 75) { // Also lower this threshold
      console.log(`[API /openai/categorize-transactions] Large transaction set detected (${transactions.length}). Processing in batches of ${BATCH_SIZE}.`);
      // Process in batches
      const batches: Transaction[][] = [];
      for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
        batches.push(transactions.slice(i, i + BATCH_SIZE));
      }
      
      // Process each batch with error handling per batch
      for (let i = 0; i < batches.length; i++) {
        console.log(`[API /openai/categorize-transactions] Processing batch ${i + 1}/${batches.length} (${batches[i].length} transactions).`);
        try {
          const batchResults = await processBatch(batches[i]);
          finalTransactions = [...finalTransactions, ...batchResults];
        } catch (batchError) {
          console.error(`[API /openai/categorize-transactions] Error processing batch ${i + 1}:`, batchError);
          // Apply fallback categorization to this batch
          const fallbackResults = batches[i].map(t => ({
            ...t,
            category: t.category || fallbackCategorize(t)
          }));
          finalTransactions = [...finalTransactions, ...fallbackResults];
        }
        
        // Add a small delay between batches to avoid rate limiting
        if (i < batches.length - 1) {
          await sleep(1000);
        }
      }
    } else {
      // Process all at once if less than threshold
      try {
        finalTransactions = await processBatch(transactions);
      } catch (processingError) {
        console.error('[API /openai/categorize-transactions] Error in main processing:', processingError);
        // Use fallback categorization for all transactions
        finalTransactions = transactions.map(t => ({
          ...t,
          category: t.category || fallbackCategorize(t)
        }));
      }
    }
    
    console.log('[API /openai/categorize-transactions] Successfully processed all transactions. Sending response.');
    return NextResponse.json(finalTransactions);

  } catch (error) {
    console.error('[API /openai/categorize-transactions] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Process a batch of transactions
async function processBatch(transactions: Transaction[]): Promise<Transaction[]> {
  try {
    // Prepare the content for the assistant
    const transactionDataString = JSON.stringify(transactions.map(t => ({
      id: t.id,
      name: t.name,
      date: t.date,
      amount: t.amount,
      current_category: t.category // Include current category if available
    })), null, 2); // Pretty print JSON

    const categoriesJson = JSON.stringify(categories, null, 2);
    const availableCategoriesString = JSON.stringify(categories.map(c => c.value), null, 2);

    const prompt = `
      Your task is to categorize UK property landlord financial transactions for tax purposes.
      Analyze the "name", "date", and "amount" for each transaction in the provided JSON array.
      
      STRICTLY FOLLOW THESE RULES:
      1. You MUST assign EXACTLY ONE category value to the "category" field for EACH transaction.
      2. You can ONLY use values from this list: ${availableCategoriesString}
      3. DO NOT invent new categories or variations of these categories.
      4. If unsure, use "exclude" rather than guessing an incorrect category.
      
      Category Definitions:
      - "rental_income": ONLY for income received from tenants as rent payments.
      - "repairs_maintenance": Costs related to property repairs, maintenance, and upkeep.
      - "insurance": Property or landlord insurance costs only.
      - "mortgage_interest": ONLY for the interest part of mortgage payments.
      - "agent_fees": Fees paid to letting or management agents.
      - "utilities": Bills like gas, electricity, water if paid by the landlord.
      - "council_tax": Council tax payments if paid by the landlord.
      - "travel": Travel costs related to property management.
      - "office_admin": Office supplies, software, phone bills related to property management.
      - "legal_professional": Solicitor, accountant, or surveyor fees.
      - "other_expense": Relevant property expenses that don't fit other categories.
      - "exclude": ALL transactions NOT related to property business (personal expenses, transfers, shopping, etc).
      
      Full list of categories with details:
      ${categoriesJson}
      
      CRITICAL REQUIREMENTS:
      1. Your response MUST be ONLY a JSON array of transactions, with no explanations or other text.
      2. The array must start with [ and end with ]
      3. Each transaction MUST have the original "id" and a valid "category" string from the approved list.
      4. DO NOT include markdown formatting like \`\`\`json.
      
      Transactions to categorize:
      \`\`\`json
      ${transactionDataString}
      \`\`\`
    `;

    // 1. Create a thread
    console.log('[API /openai/categorize-transactions] Creating OpenAI thread...');
    const thread = await openai.beta.threads.create();
    console.log(`[API /openai/categorize-transactions] Thread created: ${thread.id}`);

    // 2. Add message to the thread
    console.log('[API /openai/categorize-transactions] Adding message to thread...');
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: prompt,
    });

    // 3. Run the assistant
    console.log('[API /openai/categorize-transactions] Running assistant...');
    let run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });
    console.log(`[API /openai/categorize-transactions] Run created: ${run.id}, Status: ${run.status}`);

    // 4. Poll for completion
    const startTime = Date.now();
    const timeout = 300000; // 5 minutes timeout

    while (run.status === 'queued' || run.status === 'in_progress' || run.status === 'requires_action') {
      if (Date.now() - startTime > timeout) {
        console.error('[API /openai/categorize-transactions] Run timed out.');
        await openai.beta.threads.runs.cancel(thread.id, run.id); // Attempt to cancel
        throw new Error('OpenAI processing timed out');
      }
      
      await sleep(2000); // Wait 2 seconds before checking again
      run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log(`[API /openai/categorize-transactions] Run status: ${run.status}`);
      
      // Handle 'requires_action' if you implement function calling later
      if (run.status === 'requires_action') {
         console.warn('[API /openai/categorize-transactions] Run requires action, but no tools are defined. This should not happen for this use case.');
         // If you add tools later, you would handle the required action here.
         // For now, we'll treat this as an unexpected state and potentially cancel.
         await openai.beta.threads.runs.cancel(thread.id, run.id); 
         throw new Error('OpenAI run requires unexpected action.');
      }
    }

    if (run.status !== 'completed') {
      console.error(`[API /openai/categorize-transactions] Run failed with status: ${run.status}`, run.last_error);
      throw new Error(`OpenAI run failed: ${run.status} - ${run.last_error?.message || 'Unknown error'}`);
    }

    console.log('[API /openai/categorize-transactions] Run completed. Fetching messages...');
    
    // 5. Retrieve the messages
    const messages = await openai.beta.threads.messages.list(thread.id, { order: 'desc' });
    const assistantMessage = messages.data.find(m => m.role === 'assistant');

    if (!assistantMessage || !assistantMessage.content || assistantMessage.content.length === 0) {
       console.error('[API /openai/categorize-transactions] No assistant message found.');
      throw new Error('Assistant did not provide a response');
    }

    // Extract the text content, assuming the assistant returns JSON in a text block
    const responseContent = assistantMessage.content[0];
    if (responseContent.type !== 'text') {
       console.error('[API /openai/categorize-transactions] Assistant response is not text.');
      throw new Error('Assistant response was not in the expected text format');
    }

    let responseText = responseContent.text.value;
    console.log('[API /openai/categorize-transactions] Raw assistant response:', responseText);

    // Clean the response: remove potential markdown code blocks and trim whitespace
    responseText = responseText.replace(/```json\\n?|```/g, '').trim();
    
    // 6. Parse the response
    let categorizedTransactionsFromAI: any[]; // Use 'any' temporarily for parsing flexibility
    try {
      categorizedTransactionsFromAI = JSON.parse(responseText);
      console.log('[API /openai/categorize-transactions] Parsed categorized transactions.');
    } catch (parseError) {
      console.error('[API /openai/categorize-transactions] Failed to parse JSON response:', parseError);
      console.error('[API /openai/categorize-transactions] Response text attempted to parse:', responseText);
      throw new Error('Failed to parse categorization results from AI response');
    }

    // Basic validation: Check if it's an array and if IDs match roughly
    if (!Array.isArray(categorizedTransactionsFromAI)) {
       console.error('[API /openai/categorize-transactions] Parsed response is not a valid array.');
       throw new Error('AI response did not return a valid transaction array');
    }
    
    // *** Add Validation and Sanitization Step ***
    const validatedTransactions = transactions.map(originalTx => {
      // Find the corresponding transaction from the AI response
      const aiTx = categorizedTransactionsFromAI.find(catTx => catTx.id === originalTx.id);
      
      let finalCategory = originalTx.category; // Default to original category if available

      if (aiTx && aiTx.category) {
          // If the AI provided a category, check if it's valid
          if (validCategoryValues.has(aiTx.category)) {
              finalCategory = aiTx.category;
          } else {
              // If AI provided an INVALID category, log it and default to 'exclude'
              console.warn(`[API /openai/categorize-transactions] Invalid category '${aiTx.category}' received from AI for transaction ID ${originalTx.id}. Defaulting to 'exclude'.`);
              finalCategory = 'exclude';
          }
      } else {
          // If AI didn't provide a category OR didn't find the transaction, keep original or default to 'exclude'
          finalCategory = finalCategory ?? 'exclude'; // Use 'exclude' if original was null/undefined
      }

      return {
        ...originalTx,
        category: finalCategory, 
      };
    });
    
    // Check if length matches (redundant if IDs are checked, but good safeguard)
     if (validatedTransactions.length !== transactions.length) {
       console.error(`[API /openai/categorize-transactions] Length mismatch after validation. Original: ${transactions.length}, Validated: ${validatedTransactions.length}`);
       // Decide how to handle this - potentially throw an error or return original transactions
       // For now, let's return the validated list, but log the error prominently.
     }


    console.log('[API /openai/categorize-transactions] Successfully categorized and validated transactions in batch.');
    return validatedTransactions; // Return the validated and merged list
  } catch (error) {
    console.error('[API /openai/categorize-transactions] Error in OpenAI processing, using fallback categorization:', error);
    
    // Use fallback categorization instead
    return transactions.map(t => ({
      ...t,
      category: t.category || fallbackCategorize(t)
    }));
  }
} 