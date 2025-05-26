/**
 * Validates UK National Insurance number format and check digits
 */
export function validateNINumber(ni: string): boolean {
  if (!ni) return false;
  
  // Remove spaces and convert to uppercase
  const cleaned = ni.replace(/\s/g, '').toUpperCase();
  
  // NI number format: 2 letters, 6 numbers, 1 letter (A, B, C, or D)
  const niRegex = /^[A-Z]{2}[0-9]{6}[A-D]$/;
  
  if (!niRegex.test(cleaned)) {
    return false;
  }
  
  // Invalid prefixes that are not issued
  const invalidPrefixes = ['BG', 'GB', 'NK', 'KN', 'TN', 'NT', 'ZZ'];
  const prefix = cleaned.substring(0, 2);
  
  return !invalidPrefixes.includes(prefix);
}

/**
 * Formats NI number with proper spacing
 */
export function formatNINumber(ni: string): string {
  const cleaned = ni.replace(/\s/g, '').toUpperCase();
  if (cleaned.length !== 9) return ni;
  
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
}

/**
 * Validates UK UTR (Unique Taxpayer Reference) with check digit validation
 */
export function validateUTR(utr: string): boolean {
  if (!utr) return false;
  
  const cleaned = utr.replace(/\s/g, '');
  
  // UTR must be exactly 10 digits
  if (!/^\d{10}$/.test(cleaned)) {
    return false;
  }
  
  // Implement check digit validation (Modulus 11)
  const weights = [6, 7, 8, 9, 10, 5, 4, 3, 2];
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * weights[i];
  }
  
  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : 11 - remainder;
  
  return checkDigit === parseInt(cleaned[9]);
}

/**
 * Formats UTR with proper spacing
 */
export function formatUTR(utr: string): string {
  const cleaned = utr.replace(/\s/g, '');
  if (cleaned.length !== 10) return utr;
  
  return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
}

/**
 * Validates UK company number format
 */
export function validateCompanyNumber(companyNumber: string): boolean {
  if (!companyNumber) return false;
  
  const cleaned = companyNumber.replace(/\s/g, '').toUpperCase();
  
  // Company number is 8 characters: 2 letters followed by 6 digits, or 8 digits
  const companyRegex = /^([A-Z]{2}[0-9]{6}|[0-9]{8})$/;
  
  return companyRegex.test(cleaned);
}

/**
 * Formats company number with proper spacing
 */
export function formatCompanyNumber(companyNumber: string): string {
  const cleaned = companyNumber.replace(/\s/g, '').toUpperCase();
  if (cleaned.length !== 8) return companyNumber;
  
  // If starts with letters, format as XX 123456
  if (/^[A-Z]{2}/.test(cleaned)) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
  }
  
  // If all digits, format as 1234 5678
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
}

/**
 * Validates UK VAT number format
 */
export function validateVATNumber(vatNumber: string): boolean {
  if (!vatNumber) return false;
  
  const cleaned = vatNumber.replace(/\s/g, '').toUpperCase();
  
  // UK VAT number: GB followed by 9 or 12 digits
  const vatRegex = /^GB([0-9]{9}|[0-9]{12})$/;
  
  return vatRegex.test(cleaned);
}

/**
 * Formats VAT number with proper spacing
 */
export function formatVATNumber(vatNumber: string): string {
  const cleaned = vatNumber.replace(/\s/g, '').toUpperCase();
  
  if (cleaned.startsWith('GB') && cleaned.length >= 11) {
    const digits = cleaned.slice(2);
    if (digits.length === 9) {
      return `GB ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    } else if (digits.length === 12) {
      return `GB ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
    }
  }
  
  return vatNumber;
}

/**
 * Validates tax year format (e.g., "2023-24")
 */
export function validateTaxYear(taxYear: string): boolean {
  if (!taxYear) return false;
  
  const taxYearRegex = /^20\d{2}-\d{2}$/;
  
  if (!taxYearRegex.test(taxYear)) {
    return false;
  }
  
  const [startYear, endYearSuffix] = taxYear.split('-');
  const startYearNum = parseInt(startYear);
  const endYearNum = parseInt(`20${endYearSuffix}`);
  
  // End year should be exactly one year after start year
  return endYearNum === startYearNum + 1;
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates UK postcode format
 */
export function validatePostcode(postcode: string): boolean {
  if (!postcode) return false;
  
  const cleaned = postcode.replace(/\s/g, '').toUpperCase();
  
  // UK postcode regex (covers all valid formats)
  const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/;
  
  return postcodeRegex.test(postcode.toUpperCase());
}

/**
 * Formats UK postcode with proper spacing
 */
export function formatPostcode(postcode: string): string {
  const cleaned = postcode.replace(/\s/g, '').toUpperCase();
  
  if (cleaned.length < 5 || cleaned.length > 7) {
    return postcode;
  }
  
  // Insert space before last 3 characters
  return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
}

/**
 * Validates monetary amount (positive number with up to 2 decimal places)
 */
export function validateMonetaryAmount(amount: string | number): boolean {
  if (amount === '' || amount === null || amount === undefined) return false;
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount) || numAmount < 0) return false;
  
  // Check for maximum 2 decimal places
  const decimalPlaces = (numAmount.toString().split('.')[1] || '').length;
  return decimalPlaces <= 2;
}

/**
 * Formats monetary amount to 2 decimal places
 */
export function formatMonetaryAmount(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return '0.00';
  
  return numAmount.toFixed(2);
}

/**
 * Validates date format and ensures it's not in the future
 */
export function validatePastDate(date: string): boolean {
  if (!date) return false;
  
  const inputDate = new Date(date);
  const today = new Date();
  
  // Check if date is valid and not in the future
  return !isNaN(inputDate.getTime()) && inputDate <= today;
}

/**
 * Validates that a date is within a reasonable range for tax purposes
 */
export function validateTaxDate(date: string): boolean {
  if (!date) return false;
  
  const inputDate = new Date(date);
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 10; // 10 years ago
  const maxYear = currentYear + 1; // Next year
  
  if (isNaN(inputDate.getTime())) return false;
  
  const inputYear = inputDate.getFullYear();
  return inputYear >= minYear && inputYear <= maxYear;
}

/**
 * Comprehensive form validation for personal tax details
 */
export interface PersonalTaxValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validatePersonalTaxForm(data: {
  firstName?: string;
  lastName?: string;
  niNumber?: string;
  utr?: string;
  email?: string;
  address?: string;
  postcode?: string;
}): PersonalTaxValidation {
  const errors: Record<string, string> = {};
  
  if (!data.firstName?.trim()) {
    errors.firstName = 'First name is required';
  }
  
  if (!data.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  }
  
  if (!data.niNumber) {
    errors.niNumber = 'National Insurance number is required';
  } else if (!validateNINumber(data.niNumber)) {
    errors.niNumber = 'Invalid National Insurance number format';
  }
  
  if (!data.utr) {
    errors.utr = 'UTR is required';
  } else if (!validateUTR(data.utr)) {
    errors.utr = 'Invalid UTR format or check digit';
  }
  
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!data.address?.trim()) {
    errors.address = 'Address is required';
  }
  
  if (!data.postcode) {
    errors.postcode = 'Postcode is required';
  } else if (!validatePostcode(data.postcode)) {
    errors.postcode = 'Invalid postcode format';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Comprehensive form validation for company tax details
 */
export function validateCompanyTaxForm(data: {
  companyName?: string;
  companyNumber?: string;
  utr?: string;
  vatNumber?: string;
  accountingPeriodStart?: string;
  accountingPeriodEnd?: string;
}): PersonalTaxValidation {
  const errors: Record<string, string> = {};
  
  if (!data.companyName?.trim()) {
    errors.companyName = 'Company name is required';
  }
  
  if (!data.companyNumber) {
    errors.companyNumber = 'Company number is required';
  } else if (!validateCompanyNumber(data.companyNumber)) {
    errors.companyNumber = 'Invalid company number format';
  }
  
  if (!data.utr) {
    errors.utr = 'Corporation Tax UTR is required';
  } else if (!validateUTR(data.utr)) {
    errors.utr = 'Invalid UTR format or check digit';
  }
  
  if (data.vatNumber && !validateVATNumber(data.vatNumber)) {
    errors.vatNumber = 'Invalid VAT number format';
  }
  
  if (!data.accountingPeriodStart) {
    errors.accountingPeriodStart = 'Accounting period start date is required';
  } else if (!validateTaxDate(data.accountingPeriodStart)) {
    errors.accountingPeriodStart = 'Invalid accounting period start date';
  }
  
  if (!data.accountingPeriodEnd) {
    errors.accountingPeriodEnd = 'Accounting period end date is required';
  } else if (!validateTaxDate(data.accountingPeriodEnd)) {
    errors.accountingPeriodEnd = 'Invalid accounting period end date';
  }
  
  // Validate accounting period is logical
  if (data.accountingPeriodStart && data.accountingPeriodEnd) {
    const startDate = new Date(data.accountingPeriodStart);
    const endDate = new Date(data.accountingPeriodEnd);
    
    if (endDate <= startDate) {
      errors.accountingPeriodEnd = 'End date must be after start date';
    }
    
    // Check if period is reasonable (between 1 month and 18 months)
    const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());
    
    if (diffMonths < 1) {
      errors.accountingPeriodEnd = 'Accounting period must be at least 1 month';
    } else if (diffMonths > 18) {
      errors.accountingPeriodEnd = 'Accounting period cannot exceed 18 months';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
} 