import * as XLSX from 'xlsx';

// Function to generate and download property spreadsheet template
export function downloadPropertyTemplate() {
  // Create a basic Excel template for properties
  const worksheet = XLSX.utils.json_to_sheet([]);
  
  // Headers for properties
  XLSX.utils.sheet_add_aoa(worksheet, [[
    'Address*', 'Property Type*', 'Bedrooms', 'Bathrooms', 
    'Is HMO (true/false)', 'Acquisition Date (DD/MM/YYYY)', 
    'Purchase Price', 'Current Value', 
    'Mortgage Provider', 'Mortgage Account Number', 
    'Mortgage Amount', 'Mortgage Term (Years)', 
    'Interest Rate (%)', 'Monthly Payment'
  ]], { origin: 'A1' });
  
  // Add sample data for a standard property
  XLSX.utils.sheet_add_aoa(worksheet, [[
    '123 Main Street, London SW1A 1AA', 'house', '3', '2',
    'false', '01/06/2020',
    '350000', '400000',
    'Example Bank', 'M12345678',
    '280000', '25',
    '2.5', '1200'
  ]], { origin: 'A2' });
  
  // Add sample data for an HMO property
  XLSX.utils.sheet_add_aoa(worksheet, [[
    '456 High Street, Manchester M1 1AB', 'hmo', '5', '2',
    'true', '15/03/2019',
    '450000', '550000',
    'HMO Lender', 'H98765432',
    '360000', '20',
    '3.2', '1800'
  ]], { origin: 'A3' });
  
  // Create a workbook and add the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Properties');
  
  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, 'property-template.xlsx');
}

// Helper function to extract property data from uploaded spreadsheet
export async function parsePropertySpreadsheet(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}

// Function to validate property data
export function validatePropertyData(properties: any[]): { valid: boolean; error?: string } {
  if (properties.length === 0) {
    return { valid: false, error: 'No property data found in the spreadsheet' };
  }
  
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    
    if (!property.Address) {
      return { valid: false, error: `Property at row ${i + 2} is missing an address` };
    }
    
    if (!property['Property Type']) {
      return { valid: false, error: `Property at row ${i + 2} is missing a property type` };
    }
    
    // Convert "Is HMO" string to boolean if needed
    if (property['Is HMO (true/false)'] !== undefined) {
      const isHmoValue = property['Is HMO (true/false)'].toString().toLowerCase();
      if (isHmoValue !== 'true' && isHmoValue !== 'false') {
        return { valid: false, error: `Property at row ${i + 2} has invalid "Is HMO" value. Please use "true" or "false"` };
      }
    }
  }
  
  return { valid: true };
}

// Function to process the property data for API submission
export function preparePropertyDataForSubmission(rawData: any[]): any[] {
  return rawData.map(property => ({
    address: property.Address || '',
    propertyType: property['Property Type']?.toLowerCase() || '',
    bedrooms: property.Bedrooms?.toString() || '',
    bathrooms: property.Bathrooms?.toString() || '',
    isHmo: typeof property['Is HMO (true/false)'] === 'boolean' 
      ? property['Is HMO (true/false)'] 
      : String(property['Is HMO (true/false)'] || '').toLowerCase() === 'true',
    acquisitionDate: property['Acquisition Date (DD/MM/YYYY)'] || '',
    purchasePrice: property['Purchase Price']?.toString() || '',
    currentValue: property['Current Value']?.toString() || '',
    mortgageProvider: property['Mortgage Provider'] || '',
    mortgageAccountNumber: property['Mortgage Account Number'] || '',
    mortgageAmount: property['Mortgage Amount']?.toString() || '',
    mortgageTermYears: property['Mortgage Term (Years)']?.toString() || '',
    interestRate: property['Interest Rate (%)']?.toString() || '',
    monthlyPayment: property['Monthly Payment']?.toString() || ''
  }));
} 