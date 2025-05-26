import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { supabase } from '@/lib/supabase'; 
import { getAuthUser } from '@/lib/auth-helpers';

// Define a simple Transaction type matching previous usage
type Transaction = {
  id: string;
  name: string | null;
  date: string;
  amount: number;
  category: string | null;
  // Add other potential fields if needed by PDF
};

// Define a type for the user data needed for the PDF
type UserTaxData = {
  fullName: string | null;
  utr: string | null;
  taxYear: string;
  properties: { address: string; postcode: string }[]; // Assuming a simplified structure for now
  transactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
};

// Fetches user profile, tax profile, and transactions for the given tax year
async function getUserTaxData(userId: string, taxYear: string): Promise<UserTaxData> {
  console.log(`[PDF Data] Fetching data for user ${userId}, tax year ${taxYear}`);

  // 1. Fetch User Profile (name, UTR)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, utr_number') // Adjust field names if different
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error("[PDF Data] Error fetching profile:", profileError);
    throw new Error('Failed to fetch user profile data.');
  }

  // 2. Fetch Tax Profile (selected properties for the year)
  const { data: taxProfile, error: taxError } = await supabase
    .from('tax_profiles')
    .select('selected_property_ids')
    .eq('user_id', userId)
    .eq('tax_year', taxYear)
    .single();

  // Handle case where tax profile might not exist for the year yet
  const selectedPropertyIds = taxProfile?.selected_property_ids || [];
  if (taxError && taxError.code !== 'PGRST116') { // Ignore 'PGRST116' (no rows found)
     console.error("[PDF Data] Error fetching tax profile:", taxError);
     // Decide if this is a fatal error or if we can proceed without selected properties
     // throw new Error('Failed to fetch tax profile data.');
     console.warn("[PDF Data] Could not fetch tax profile, proceeding without property filter.");
  }

  // 3. Fetch Property Details (address, postcode for selected properties)
  let propertiesData: { address: string; postcode: string }[] = [];
  if (selectedPropertyIds.length > 0) {
    const { data: fetchedProperties, error: propertiesError } = await supabase
      .from('properties') // Assuming 'properties' table exists
      .select('address_line_1, postcode') // Adjust field names
      .in('id', selectedPropertyIds);
      
    if (propertiesError) {
       console.error("[PDF Data] Error fetching property details:", propertiesError);
       // Decide how to handle - maybe proceed with empty property list
    } else {
      propertiesData = (fetchedProperties || []).map(p => ({ address: p.address_line_1 || 'Unknown Address', postcode: p.postcode || '' }));
    }
  }

  // 4. Calculate date range for the tax year (Apr 6 - Apr 5)
  const [startYearStr, endYearStr] = taxYear.split('/');
  const startDate = `${startYearStr}-04-06`;
  const endDate = `${parseInt(endYearStr)}-04-05`; // Use endYearStr directly if it represents the calendar year
  
  // 5. Fetch Transactions for the period and selected properties
  let transactions: Transaction[] = [];
  if (selectedPropertyIds.length > 0) {
      const { data: fetchedTransactions, error: dbError } = await supabase
        .from("bank_transactions")
        .select("id, name, date, amount, category") // Select only needed fields
        .in("property_id", selectedPropertyIds)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (dbError) {
        console.error("[PDF Data] Error fetching transactions:", dbError);
        throw new Error(`Error fetching transactions: ${dbError.message}`);
      }
      transactions = (fetchedTransactions || []) as Transaction[];
      console.log(`[PDF Data] Fetched ${transactions.length} transactions.`);
  } else {
      console.warn(`[PDF Data] No properties selected for tax year ${taxYear}, no transactions fetched.`);
  }

  // 6. Calculate Totals (based on fetched transactions)
  const totalIncome = transactions
    .filter(t => t.category === 'rental_income') // Simple income calculation
    .reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);
    
  const totalExpenses = transactions
    .filter(t => t.category !== 'rental_income' && t.category !== 'exclude') // Exclude income and excluded items
    .reduce((sum, t) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0);

  return {
    fullName: profile?.full_name || null,
    utr: profile?.utr_number || null,
    taxYear: taxYear,
    properties: propertiesData,
    transactions: transactions,
    totalIncome: totalIncome,
    totalExpenses: totalExpenses, 
  };
}

// Calculates total for a specific expense category
function calculateExpenseTotal(transactions: Transaction[], categoryValue: string): number {
    return transactions
        .filter(t => t.category === categoryValue)
        .reduce((sum, t) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0);
}

// Helper function to fill form fields
async function fillFormFields(pdfDoc: PDFDocument, userData: UserTaxData) { 
  const form = pdfDoc.getForm();
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  try {
    // NOTE: The following field names are placeholders and need to be replaced
    // with actual field names from the PDF templates when they become available
    
    // --- Fill Common Fields (Apply to both SA100 and SA105 where applicable) ---
    // TODO: Replace placeholder field names with actual PDF form field names
    const utrField = form.getTextField('utr_number');
    if (utrField) utrField.setText(userData.utr || '');
    
    const nameField = form.getTextField('full_name');
    if (nameField) nameField.setText(userData.fullName || '');
    
    const taxYearField = form.getTextField('tax_year');
    if (taxYearField) taxYearField.setText(userData.taxYear || '');
    
    // --- Fill SA105 Specific Fields (Property Income) --- 
    // Note: This assumes a single property for simplicity in the example.
    // You may need to adjust logic for multiple properties, potentially adding pages.
    
    const property = userData.properties?.[0]; // Get first property
    if (property) {
        const addressField = form.getTextField('property_address');
        if (addressField) addressField.setText(property.address || '');
        
        const postcodeField = form.getTextField('property_postcode');
        if (postcodeField) postcodeField.setText(property.postcode || '');
    }
    
    // Box 20: Total rents and other income from property
    const totalIncomeField = form.getTextField('total_income');
    if (totalIncomeField) totalIncomeField.setText(userData.totalIncome?.toFixed(2) || '0.00');

    // --- Expense Boxes (Calculate totals from transactions) ---
    const expenses = {
        repairsMaintenance: calculateExpenseTotal(userData.transactions, 'repairs_maintenance'),
        insurance: calculateExpenseTotal(userData.transactions, 'insurance'),
        agentFees: calculateExpenseTotal(userData.transactions, 'agent_fees'),
        utilities: calculateExpenseTotal(userData.transactions, 'utilities'),
        councilTax: calculateExpenseTotal(userData.transactions, 'council_tax'),
        travel: calculateExpenseTotal(userData.transactions, 'travel'),
        officeAdmin: calculateExpenseTotal(userData.transactions, 'office_admin'),
        legalProfessional: calculateExpenseTotal(userData.transactions, 'legal_professional'),
        mortgageInterest: calculateExpenseTotal(userData.transactions, 'mortgage_interest'),
        other: calculateExpenseTotal(userData.transactions, 'other_expense'),
    };

    // Map calculated expenses to form fields (TODO: Replace with actual field names)
    const repairsField = form.getTextField('repairs_maintenance');
    if (repairsField) repairsField.setText(expenses.repairsMaintenance.toFixed(2));
    
    const insuranceField = form.getTextField('insurance_costs');
    if (insuranceField) insuranceField.setText(expenses.insurance.toFixed(2));
    
    const agentFeesField = form.getTextField('agent_fees');
    if (agentFeesField) agentFeesField.setText(expenses.agentFees.toFixed(2));
    
    const utilitiesField = form.getTextField('utilities');
    if (utilitiesField) utilitiesField.setText(expenses.utilities.toFixed(2));
    
    const councilTaxField = form.getTextField('council_tax');
    if (councilTaxField) councilTaxField.setText(expenses.councilTax.toFixed(2));
    
    const legalProfField = form.getTextField('legal_professional');
    if (legalProfField) legalProfField.setText(expenses.legalProfessional.toFixed(2));
    
    const financeChargesField = form.getTextField('finance_charges');
    if (financeChargesField) financeChargesField.setText(expenses.mortgageInterest.toFixed(2));
    
    const otherExpensesField = form.getTextField('other_expenses');
    if (otherExpensesField) otherExpensesField.setText(expenses.other.toFixed(2));

    // Box 31: Total Expenses
    const totalExpensesField = form.getTextField('total_expenses');
    if (totalExpensesField) totalExpensesField.setText(userData.totalExpenses?.toFixed(2) || '0.00');
    
    // Box 32: Net Profit (or Loss)
    const netProfit = userData.totalIncome - userData.totalExpenses;
    const netProfitField = form.getTextField('net_profit');
    const netLossField = form.getTextField('net_loss');
    
    if (netProfit >= 0) {
      if (netProfitField) netProfitField.setText(netProfit.toFixed(2));
      if (netLossField) netLossField.setText(''); // Clear loss field
    } else {
      if (netLossField) netLossField.setText(Math.abs(netProfit).toFixed(2));
      if (netProfitField) netProfitField.setText(''); // Clear profit field
    }

    // --- Fill SA100 Specific Fields (Example) ---
    // TODO: Add SA100 field mappings when template is available

  } catch (error) {
    console.error("Error filling PDF form fields:", error);
    firstPage.drawText('Error filling form fields. Check logs for details.', {
      x: 50, y: height - 50, size: 10, font: helveticaFont, color: rgb(1, 0, 0)
    });
  }
}

export async function GET(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const taxYear = searchParams.get('taxYear');
    const formType = searchParams.get('formType') || 'SA105';

    if (!taxYear) {
      return NextResponse.json({ error: 'Tax year is required' }, { status: 400 });
    }

    console.log(`[API /generate-pdf] Generating ${formType} for user ${user.id}, tax year ${taxYear}`);

    // Fetch combined user, property, and transaction data
    const userData = await getUserTaxData(user.id, taxYear);

    if (!userData.utr) {
        console.warn(`[API /generate-pdf] User ${user.id} has no UTR number set in profile.`);
        // Decide if this is an error or can proceed without UTR for PDF generation
        // return NextResponse.json({ error: 'UTR number missing from user profile.' }, { status: 400 });
    }

    // Define template path
    let templateFilename = '';
    if (formType === 'SA105') {
      templateFilename = 'SA105_template.pdf'; 
    } else if (formType === 'SA100') {
      templateFilename = 'SA100_template.pdf'; 
    } else {
      return NextResponse.json({ error: 'Unsupported form type' }, { status: 400 });
    }
    const templatePath = path.join(process.cwd(), 'public', 'pdf-templates', templateFilename);

    // Load template
    let templateBytes;
    try {
      templateBytes = await fs.readFile(templatePath);
    } catch (readError) {
      console.error(`[API /generate-pdf] Error reading template ${templatePath}:`, readError);
      return NextResponse.json({ error: `PDF template (${templateFilename}) not found.` }, { status: 500 });
    }
    
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Fill the form using fetched data
    await fillFormFields(pdfDoc, userData);

    // Serialize PDF
    const pdfBytes = await pdfDoc.save();

    // Set headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    const safeTaxYear = taxYear.replace('/', '-');
    headers.set('Content-Disposition', `attachment; filename="${formType}_${userData.utr || 'NoUTR'}_${safeTaxYear}.pdf"`);

    console.log(`[API /generate-pdf] Successfully generated ${formType} PDF.`);
    return new NextResponse(pdfBytes, { status: 200, headers });

  } catch (error) {
    console.error('[API /generate-pdf] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error generating PDF';
    return NextResponse.json({ error: `Failed to generate PDF: ${errorMessage}` }, { status: 500 });
  }
} 