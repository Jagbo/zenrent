/**
 * VAT Validation Rules
 * 
 * This file contains validation rules for VAT returns to ensure compliance with HMRC requirements.
 */

import { 
  FinancialData, 
  ValidationResult, 
  ValidationRule, 
  VatReturnPayload 
} from '../transformers/types';

/**
 * VAT validation rules
 */
export const vatValidationRules: ValidationRule<VatReturnPayload>[] = [
  // Rule: Period Key Format
  {
    id: 'vat-001',
    name: 'Period Key Format',
    description: 'Validates that the period key is in the correct format',
    field: 'periodKey',
    severity: 'error',
    validate: (data: VatReturnPayload): ValidationResult => {
      const periodKeyPattern = /^[0-9A-Z]{4}$/;
      const valid = periodKeyPattern.test(data.periodKey);
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'periodKey',
          message: `Period key (${data.periodKey}) must be in the format XXXX where X is alphanumeric`,
          code: 'INVALID_PERIOD_KEY_FORMAT'
        }]
      };
    }
  },
  
  // Rule: VAT Due Sales Calculation
  {
    id: 'vat-002',
    name: 'VAT Due Sales Calculation',
    description: 'Validates that VAT due on sales is calculated correctly',
    field: 'vatDueSales',
    severity: 'error',
    validate: (data: VatReturnPayload, financialData?: FinancialData): ValidationResult => {
      // If no financial data is provided, we can only check if the value is non-negative
      if (!financialData) {
        const valid = data.vatDueSales >= 0;
        return {
          valid,
          errors: valid ? [] : [{
            field: 'vatDueSales',
            message: 'VAT due on sales cannot be negative',
            code: 'NEGATIVE_VAT_DUE_SALES'
          }]
        };
      }

      // With financial data, we can cross-validate the calculation
      // This is a simplified example - actual implementation would calculate expected VAT
      const valid = data.vatDueSales >= 0;
      return {
        valid,
        errors: valid ? [] : [{
          field: 'vatDueSales',
          message: 'VAT due on sales cannot be negative',
          code: 'NEGATIVE_VAT_DUE_SALES'
        }]
      };
    }
  },
  
  // Rule: VAT Due Acquisitions Calculation
  {
    id: 'vat-003',
    name: 'VAT Due Acquisitions Calculation',
    description: 'Validates that VAT due on acquisitions is calculated correctly',
    field: 'vatDueAcquisitions',
    severity: 'error',
    validate: (data: VatReturnPayload): ValidationResult => {
      const valid = data.vatDueAcquisitions >= 0;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'vatDueAcquisitions',
          message: 'VAT due on acquisitions cannot be negative',
          code: 'NEGATIVE_VAT_DUE_ACQUISITIONS'
        }]
      };
    }
  },
  
  // Rule: Total VAT Due Calculation
  {
    id: 'vat-004',
    name: 'Total VAT Due Calculation',
    description: 'Validates that total VAT due is the sum of VAT due on sales and acquisitions',
    field: 'totalVatDue',
    severity: 'error',
    validate: (data: VatReturnPayload): ValidationResult => {
      const expectedTotal = Number((data.vatDueSales + data.vatDueAcquisitions).toFixed(2));
      const actualTotal = Number(data.totalVatDue.toFixed(2));
      const valid = expectedTotal === actualTotal;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'totalVatDue',
          message: `Total VAT due (${actualTotal}) should equal the sum of VAT due on sales (${data.vatDueSales}) and VAT due on acquisitions (${data.vatDueAcquisitions})`,
          code: 'INVALID_TOTAL_VAT_DUE'
        }]
      };
    }
  },
  
  // Rule: VAT Reclaimed Calculation
  {
    id: 'vat-005',
    name: 'VAT Reclaimed Calculation',
    description: 'Validates that VAT reclaimed is non-negative',
    field: 'vatReclaimedCurrPeriod',
    severity: 'error',
    validate: (data: VatReturnPayload): ValidationResult => {
      const valid = data.vatReclaimedCurrPeriod >= 0;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'vatReclaimedCurrPeriod',
          message: 'VAT reclaimed cannot be negative',
          code: 'NEGATIVE_VAT_RECLAIMED'
        }]
      };
    }
  },
  
  // Rule: Net VAT Due Calculation
  {
    id: 'vat-006',
    name: 'Net VAT Due Calculation',
    description: 'Validates that net VAT due is calculated correctly',
    field: 'netVatDue',
    severity: 'error',
    validate: (data: VatReturnPayload): ValidationResult => {
      const expectedNet = Number(Math.abs(data.totalVatDue - data.vatReclaimedCurrPeriod).toFixed(2));
      const actualNet = Number(data.netVatDue.toFixed(2));
      const valid = expectedNet === actualNet;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'netVatDue',
          message: `Net VAT due (${actualNet}) should equal the absolute difference between total VAT due (${data.totalVatDue}) and VAT reclaimed (${data.vatReclaimedCurrPeriod})`,
          code: 'INVALID_NET_VAT_DUE'
        }]
      };
    }
  },
  
  // Rule: Total Value Sales Calculation
  {
    id: 'vat-007',
    name: 'Total Value Sales Calculation',
    description: 'Validates that total value of sales is non-negative',
    field: 'totalValueSalesExVAT',
    severity: 'error',
    validate: (data: VatReturnPayload): ValidationResult => {
      const valid = data.totalValueSalesExVAT >= 0;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'totalValueSalesExVAT',
          message: 'Total value of sales cannot be negative',
          code: 'NEGATIVE_TOTAL_VALUE_SALES'
        }]
      };
    }
  },
  
  // Rule: Total Value Purchases Calculation
  {
    id: 'vat-008',
    name: 'Total Value Purchases Calculation',
    description: 'Validates that total value of purchases is non-negative',
    field: 'totalValuePurchasesExVAT',
    severity: 'error',
    validate: (data: VatReturnPayload): ValidationResult => {
      const valid = data.totalValuePurchasesExVAT >= 0;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'totalValuePurchasesExVAT',
          message: 'Total value of purchases cannot be negative',
          code: 'NEGATIVE_TOTAL_VALUE_PURCHASES'
        }]
      };
    }
  },
  
  // Rule: Total Value Goods Supplied Calculation
  {
    id: 'vat-009',
    name: 'Total Value Goods Supplied Calculation',
    description: 'Validates that total value of goods supplied is non-negative',
    field: 'totalValueGoodsSuppliedExVAT',
    severity: 'error',
    validate: (data: VatReturnPayload): ValidationResult => {
      const valid = data.totalValueGoodsSuppliedExVAT >= 0;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'totalValueGoodsSuppliedExVAT',
          message: 'Total value of goods supplied cannot be negative',
          code: 'NEGATIVE_TOTAL_VALUE_GOODS_SUPPLIED'
        }]
      };
    }
  },
  
  // Rule: Total Value Acquisitions Calculation
  {
    id: 'vat-010',
    name: 'Total Value Acquisitions Calculation',
    description: 'Validates that total value of acquisitions is non-negative',
    field: 'totalAcquisitionsExVAT',
    severity: 'error',
    validate: (data: VatReturnPayload): ValidationResult => {
      const valid = data.totalAcquisitionsExVAT >= 0;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'totalAcquisitionsExVAT',
          message: 'Total value of acquisitions cannot be negative',
          code: 'NEGATIVE_TOTAL_VALUE_ACQUISITIONS'
        }]
      };
    }
  },
  
  // Rule: Finalised Flag
  {
    id: 'vat-011',
    name: 'Finalised Flag',
    description: 'Validates that the finalised flag is set',
    field: 'finalised',
    severity: 'error',
    validate: (data: VatReturnPayload): ValidationResult => {
      // For HMRC submissions, the finalised flag must be true
      const valid = data.finalised === true;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'finalised',
          message: 'VAT return must be finalised before submission',
          code: 'VAT_RETURN_NOT_FINALISED'
        }]
      };
    }
  },
  
  // Rule: VAT Flat Rate Scheme Calculation
  {
    id: 'vat-012',
    name: 'VAT Flat Rate Scheme Calculation',
    description: 'Validates VAT calculations for flat rate scheme users',
    severity: 'warning',
    validate: (data: VatReturnPayload, financialData?: FinancialData): ValidationResult => {
      // Skip this validation if no financial data is provided or user is not on flat rate scheme
      if (!financialData || !financialData.vatScheme || financialData.vatScheme.toLowerCase() !== 'flat rate') {
        return { valid: true, errors: [] };
      }
      
      // For flat rate scheme, VAT due on sales should be calculated using the flat rate percentage
      // This is a simplified check - actual implementation would be more complex
      const flatRatePercentage = financialData.vatFlatRate || 0;
      
      // If flat rate percentage is 0, we can't perform this validation
      if (flatRatePercentage === 0) {
        return {
          valid: true,
          errors: [],
          warnings: [{
            field: 'vatDueSales',
            message: 'Flat rate percentage is 0, cannot validate flat rate scheme calculation',
            code: 'FLAT_RATE_PERCENTAGE_ZERO'
          }]
        };
      }
      
      // This is a simplified warning - actual implementation would calculate expected VAT
      return {
        valid: true,
        errors: [],
        warnings: [{
          field: 'vatDueSales',
          message: `Ensure VAT due on sales is calculated using the flat rate percentage of ${flatRatePercentage}%`,
          code: 'FLAT_RATE_CALCULATION_CHECK'
        }]
      };
    }
  },
  
  // Rule: Reverse Charge VAT
  {
    id: 'vat-013',
    name: 'Reverse Charge VAT',
    description: 'Validates reverse charge VAT calculations',
    severity: 'warning',
    validate: (data: VatReturnPayload, financialData?: FinancialData): ValidationResult => {
      // Skip this validation if no financial data is provided
      if (!financialData) {
        return { valid: true, errors: [] };
      }
      
      // Check if there are any reverse charge transactions
      const hasReverseChargeTransactions = financialData.transactions.some(t => 
        t.metadata?.reverseCharge === true
      );
      
      if (!hasReverseChargeTransactions) {
        return { valid: true, errors: [] };
      }
      
      // For reverse charge, VAT due on acquisitions should be non-zero
      const valid = data.vatDueAcquisitions > 0;
      
      return {
        valid: true, // This is a warning, so we don't fail validation
        errors: [],
        warnings: valid ? [] : [{
          field: 'vatDueAcquisitions',
          message: 'Reverse charge transactions detected, but VAT due on acquisitions is zero',
          code: 'REVERSE_CHARGE_VAT_CHECK'
        }]
      };
    }
  },
  
  // Rule: Digital Links Compliance
  {
    id: 'vat-014',
    name: 'Digital Links Compliance',
    description: 'Validates compliance with digital links requirements',
    severity: 'warning',
    validate: (data: VatReturnPayload, financialData?: FinancialData): ValidationResult => {
      // This is a simplified check - actual implementation would be more complex
      // We're just providing a reminder about digital links compliance
      
      return {
        valid: true, // This is a warning, so we don't fail validation
        errors: [],
        warnings: [{
          field: 'general',
          message: 'Ensure digital links are maintained throughout the VAT calculation process in compliance with MTD requirements',
          code: 'DIGITAL_LINKS_REMINDER'
        }]
      };
    }
  },
  
  // Rule: VAT Control Points
  {
    id: 'vat-015',
    name: 'VAT Control Points',
    description: 'Validates VAT control points for data integrity',
    severity: 'warning',
    validate: (data: VatReturnPayload): ValidationResult => {
      // This is a simplified check - actual implementation would be more complex
      // We're just providing a reminder about VAT control points
      
      return {
        valid: true, // This is a warning, so we don't fail validation
        errors: [],
        warnings: [{
          field: 'general',
          message: 'Ensure VAT control points are in place to maintain data integrity throughout the VAT return process',
          code: 'VAT_CONTROL_POINTS_REMINDER'
        }]
      };
    }
  }
];
