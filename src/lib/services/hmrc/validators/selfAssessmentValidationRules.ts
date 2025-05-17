/**
 * Self Assessment Validation Rules
 * 
 * This file contains validation rules for self assessment submissions to ensure compliance with HMRC requirements.
 */

import { 
  FinancialData, 
  ValidationResult, 
  ValidationRule, 
  SelfAssessmentPayload 
} from '../transformers/types';

/**
 * Self assessment validation rules
 */
export const selfAssessmentValidationRules: ValidationRule<SelfAssessmentPayload>[] = [
  // Rule: Tax Year Format
  {
    id: 'sa-001',
    name: 'Tax Year Format',
    description: 'Validates that the tax year is in the correct format',
    field: 'taxYear',
    severity: 'error',
    validate: (data: SelfAssessmentPayload): ValidationResult => {
      const taxYearPattern = /^\d{4}-\d{2}$/;
      const valid = taxYearPattern.test(data.taxYear);
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'taxYear',
          message: `Tax year (${data.taxYear}) must be in the format YYYY-YY`,
          code: 'INVALID_TAX_YEAR_FORMAT'
        }]
      };
    }
  },
  
  // Rule: Income Required
  {
    id: 'sa-002',
    name: 'Income Required',
    description: 'Validates that at least one income type is provided',
    field: 'income',
    severity: 'error',
    validate: (data: SelfAssessmentPayload): ValidationResult => {
      const hasIncome = !!data.income && Object.keys(data.income).length > 0;
      
      return {
        valid: hasIncome,
        errors: hasIncome ? [] : [{
          field: 'income',
          message: 'At least one income type must be provided',
          code: 'MISSING_INCOME'
        }]
      };
    }
  },
  
  // Rule: Employment Income Validation
  {
    id: 'sa-003',
    name: 'Employment Income Validation',
    description: 'Validates employment income data',
    field: 'income.employment',
    severity: 'error',
    validate: (data: SelfAssessmentPayload): ValidationResult => {
      if (!data.income || !data.income.employment || data.income.employment.length === 0) {
        return { valid: true, errors: [] }; // No employment income to validate
      }
      
      const errors: Array<{ field: string; message: string; code: string }> = [];
      
      data.income.employment.forEach((employment, index) => {
        if (!employment.employerName) {
          errors.push({
            field: `income.employment[${index}].employerName`,
            message: 'Employer name is required',
            code: 'MISSING_EMPLOYER_NAME'
          });
        }
        
        if (employment.taxablePayToDate < 0) {
          errors.push({
            field: `income.employment[${index}].taxablePayToDate`,
            message: 'Taxable pay cannot be negative',
            code: 'NEGATIVE_TAXABLE_PAY'
          });
        }
        
        if (employment.totalTaxToDate < 0) {
          errors.push({
            field: `income.employment[${index}].totalTaxToDate`,
            message: 'Total tax cannot be negative',
            code: 'NEGATIVE_TOTAL_TAX'
          });
        }
      });
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
  },
  
  // Rule: Self Employment Income Validation
  {
    id: 'sa-004',
    name: 'Self Employment Income Validation',
    description: 'Validates self employment income data',
    field: 'income.selfEmployment',
    severity: 'error',
    validate: (data: SelfAssessmentPayload): ValidationResult => {
      if (!data.income || !data.income.selfEmployment || data.income.selfEmployment.length === 0) {
        return { valid: true, errors: [] }; // No self employment income to validate
      }
      
      const errors: Array<{ field: string; message: string; code: string }> = [];
      
      data.income.selfEmployment.forEach((business, index) => {
        if (!business.businessName) {
          errors.push({
            field: `income.selfEmployment[${index}].businessName`,
            message: 'Business name is required',
            code: 'MISSING_BUSINESS_NAME'
          });
        }
        
        if (!business.commencementDate) {
          errors.push({
            field: `income.selfEmployment[${index}].commencementDate`,
            message: 'Commencement date is required',
            code: 'MISSING_COMMENCEMENT_DATE'
          });
        }
        
        if (!business.accountingPeriodStartDate) {
          errors.push({
            field: `income.selfEmployment[${index}].accountingPeriodStartDate`,
            message: 'Accounting period start date is required',
            code: 'MISSING_ACCOUNTING_PERIOD_START_DATE'
          });
        }
        
        if (!business.accountingPeriodEndDate) {
          errors.push({
            field: `income.selfEmployment[${index}].accountingPeriodEndDate`,
            message: 'Accounting period end date is required',
            code: 'MISSING_ACCOUNTING_PERIOD_END_DATE'
          });
        }
        
        if (business.income < 0) {
          errors.push({
            field: `income.selfEmployment[${index}].income`,
            message: 'Income cannot be negative',
            code: 'NEGATIVE_INCOME'
          });
        }
      });
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
  },
  
  // Rule: UK Property Income Validation
  {
    id: 'sa-005',
    name: 'UK Property Income Validation',
    description: 'Validates UK property income data',
    field: 'income.ukProperty',
    severity: 'error',
    validate: (data: SelfAssessmentPayload): ValidationResult => {
      if (!data.income || !data.income.ukProperty) {
        return { valid: true, errors: [] }; // No UK property income to validate
      }
      
      // Validate dates
      const ukProperty = data.income.ukProperty;
      const errors: Array<{ field: string; message: string; code: string }> = [];
      
      if (!ukProperty.fromDate) {
        errors.push({
          field: 'income.ukProperty.fromDate',
          message: 'From date is required',
          code: 'MISSING_FROM_DATE'
        });
      }
      
      if (!ukProperty.toDate) {
        errors.push({
          field: 'income.ukProperty.toDate',
          message: 'To date is required',
          code: 'MISSING_TO_DATE'
        });
      }
      
      // Validate UK properties
      if (!ukProperty.ukProperties) {
        errors.push({
          field: 'income.ukProperty.ukProperties',
          message: 'UK properties data is required',
          code: 'MISSING_UK_PROPERTIES'
        });
      } else {
        // Check total income is non-negative
        if (ukProperty.ukProperties.totalIncome < 0) {
          errors.push({
            field: 'income.ukProperty.ukProperties.totalIncome',
            message: 'Total income cannot be negative',
            code: 'NEGATIVE_TOTAL_INCOME'
          });
        }
        
        // Check total expenses is non-negative
        if (ukProperty.ukProperties.totalExpenses < 0) {
          errors.push({
            field: 'income.ukProperty.ukProperties.totalExpenses',
            message: 'Total expenses cannot be negative',
            code: 'NEGATIVE_TOTAL_EXPENSES'
          });
        }
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
  },
  
  // Rule: Dividends Income Validation
  {
    id: 'sa-006',
    name: 'Dividends Income Validation',
    description: 'Validates dividends income data',
    field: 'income.dividends',
    severity: 'error',
    validate: (data: SelfAssessmentPayload): ValidationResult => {
      if (!data.income || !data.income.dividends) {
        return { valid: true, errors: [] }; // No dividends income to validate
      }
      
      const errors = [];
      
      if (data.income.dividends.ukDividends < 0) {
        errors.push({
          field: 'income.dividends.ukDividends',
          message: 'UK dividends cannot be negative',
          code: 'NEGATIVE_UK_DIVIDENDS'
        });
      }
      
      if (data.income.dividends.otherUkDividends < 0) {
        errors.push({
          field: 'income.dividends.otherUkDividends',
          message: 'Other UK dividends cannot be negative',
          code: 'NEGATIVE_OTHER_UK_DIVIDENDS'
        });
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
  },
  
  // Rule: Savings Income Validation
  {
    id: 'sa-007',
    name: 'Savings Income Validation',
    description: 'Validates savings income data',
    field: 'income.savings',
    severity: 'error',
    validate: (data: SelfAssessmentPayload): ValidationResult => {
      if (!data.income || !data.income.savings) {
        return { valid: true, errors: [] }; // No savings income to validate
      }
      
      const errors = [];
      
      if (data.income.savings.ukInterest < 0) {
        errors.push({
          field: 'income.savings.ukInterest',
          message: 'UK interest cannot be negative',
          code: 'NEGATIVE_UK_INTEREST'
        });
      }
      
      if (data.income.savings.foreignInterest < 0) {
        errors.push({
          field: 'income.savings.foreignInterest',
          message: 'Foreign interest cannot be negative',
          code: 'NEGATIVE_FOREIGN_INTEREST'
        });
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
  },
  
  // Rule: Gift Aid Validation
  {
    id: 'sa-008',
    name: 'Gift Aid Validation',
    description: 'Validates gift aid data',
    field: 'deductions.giftAid',
    severity: 'error',
    validate: (data: SelfAssessmentPayload): ValidationResult => {
      if (!data.deductions || !data.deductions.giftAid) {
        return { valid: true, errors: [] }; // No gift aid to validate
      }
      
      const errors: Array<{ field: string; message: string; code: string }> = [];
      
      if (data.deductions.giftAid.giftAidPayments < 0) {
        errors.push({
          field: 'deductions.giftAid.giftAidPayments',
          message: 'Gift aid payments cannot be negative',
          code: 'NEGATIVE_GIFT_AID_PAYMENTS'
        });
      }
      
      if (data.deductions.giftAid.giftAidTreatedAsPaidInPreviousTaxYear < 0) {
        errors.push({
          field: 'deductions.giftAid.giftAidTreatedAsPaidInPreviousTaxYear',
          message: 'Gift aid treated as paid in previous tax year cannot be negative',
          code: 'NEGATIVE_GIFT_AID_PREVIOUS_YEAR'
        });
      }
      
      if (data.deductions.giftAid.giftAidTreatedAsPaidInCurrentTaxYear < 0) {
        errors.push({
          field: 'deductions.giftAid.giftAidTreatedAsPaidInCurrentTaxYear',
          message: 'Gift aid treated as paid in current tax year cannot be negative',
          code: 'NEGATIVE_GIFT_AID_CURRENT_YEAR'
        });
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
  },
  
  // Rule: Pension Contributions Validation
  {
    id: 'sa-009',
    name: 'Pension Contributions Validation',
    description: 'Validates pension contributions data',
    field: 'deductions.pensionContributions',
    severity: 'error',
    validate: (data: SelfAssessmentPayload): ValidationResult => {
      if (!data.deductions || !data.deductions.pensionContributions) {
        return { valid: true, errors: [] }; // No pension contributions to validate
      }
      
      const errors = [];
      
      if (data.deductions.pensionContributions.pensionSchemeOverseasTransfers < 0) {
        errors.push({
          field: 'deductions.pensionContributions.pensionSchemeOverseasTransfers',
          message: 'Pension scheme overseas transfers cannot be negative',
          code: 'NEGATIVE_PENSION_SCHEME_OVERSEAS_TRANSFERS'
        });
      }
      
      if (data.deductions.pensionContributions.pensionContributionsAmount < 0) {
        errors.push({
          field: 'deductions.pensionContributions.pensionContributionsAmount',
          message: 'Pension contributions amount cannot be negative',
          code: 'NEGATIVE_PENSION_CONTRIBUTIONS_AMOUNT'
        });
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
  },
  
  // Rule: Tax Year Consistency
  {
    id: 'sa-010',
    name: 'Tax Year Consistency',
    description: 'Validates that the tax year is consistent with the data',
    severity: 'warning',
    validate: (data: SelfAssessmentPayload, financialData?: FinancialData): ValidationResult => {
      if (!financialData) {
        return { valid: true, errors: [] }; // No financial data to validate against
      }
      
      const warnings = [];
      
      // Extract the tax year from the data
      const taxYearParts = data.taxYear.split('-');
      if (taxYearParts.length !== 2) {
        return { valid: true, errors: [] }; // Invalid tax year format, will be caught by other rules
      }
      
      const startYear = parseInt(taxYearParts[0]);
      const endYear = parseInt(`20${taxYearParts[1]}`);
      
      // Check if financial data dates fall within the tax year
      const financialStartDate = new Date(financialData.startDate);
      const financialEndDate = new Date(financialData.endDate);
      
      const taxYearStartDate = new Date(`${startYear}-04-06`);
      const taxYearEndDate = new Date(`${endYear}-04-05`);
      
      if (financialStartDate < taxYearStartDate || financialEndDate > taxYearEndDate) {
        warnings.push({
          field: 'taxYear',
          message: `The financial data dates (${financialData.startDate} to ${financialData.endDate}) do not fall entirely within the specified tax year (${startYear}-04-06 to ${endYear}-04-05)`,
          code: 'TAX_YEAR_DATE_MISMATCH'
        });
      }
      
      return {
        valid: true, // This is a warning, so we don't fail validation
        errors: [],
        warnings
      };
    }
  },
  
  // Rule: Personal Allowance
  {
    id: 'sa-011',
    name: 'Personal Allowance',
    description: 'Validates personal allowance considerations',
    severity: 'warning',
    validate: (data: SelfAssessmentPayload): ValidationResult => {
      // This is a simplified check - actual implementation would be more complex
      return {
        valid: true, // This is a warning, so we don't fail validation
        errors: [],
        warnings: [{
          field: 'general',
          message: 'Ensure you have considered your personal allowance when calculating your tax liability. For high earners (over £100,000), the personal allowance is reduced by £1 for every £2 of income above this threshold.',
          code: 'PERSONAL_ALLOWANCE_REMINDER'
        }]
      };
    }
  },
  
  // Rule: High Income Child Benefit Charge
  {
    id: 'sa-012',
    name: 'High Income Child Benefit Charge',
    description: 'Validates high income child benefit charge considerations',
    severity: 'warning',
    validate: (data: SelfAssessmentPayload): ValidationResult => {
      // Calculate total income (simplified)
      let totalIncome = 0;
      
      if (data.income.employment) {
        totalIncome += data.income.employment.reduce((sum, emp) => sum + emp.taxablePayToDate, 0);
      }
      
      if (data.income.selfEmployment) {
        totalIncome += data.income.selfEmployment.reduce((sum, business) => sum + business.income, 0);
      }
      
      if (data.income.ukProperty && data.income.ukProperty.ukProperties) {
        totalIncome += data.income.ukProperty.ukProperties.totalIncome;
      }
      
      if (data.income.dividends) {
        totalIncome += data.income.dividends.ukDividends + data.income.dividends.otherUkDividends;
      }
      
      if (data.income.savings) {
        totalIncome += data.income.savings.ukInterest + data.income.savings.foreignInterest;
      }
      
      // If income is over £50,000, high income child benefit charge might apply
      if (totalIncome > 50000) {
        return {
          valid: true,
          errors: [],
          warnings: [{
            field: 'general',
            message: 'Your income is over £50,000. If you or your partner receive Child Benefit, you may be liable for the High Income Child Benefit Charge.',
            code: 'HIGH_INCOME_CHILD_BENEFIT_REMINDER'
          }]
        };
      }
      
      return { valid: true, errors: [] };
    }
  },
  
  // Rule: Marriage Allowance
  {
    id: 'sa-013',
    name: 'Marriage Allowance',
    description: 'Validates marriage allowance considerations',
    severity: 'warning',
    validate: (data: SelfAssessmentPayload): ValidationResult => {
      // This is a simplified check - actual implementation would be more complex
      return {
        valid: true, // This is a warning, so we don't fail validation
        errors: [],
        warnings: [{
          field: 'general',
          message: 'If you are married or in a civil partnership, you may be eligible for Marriage Allowance, which allows you to transfer £1,260 of your personal allowance to your spouse or civil partner if they earn more than you.',
          code: 'MARRIAGE_ALLOWANCE_REMINDER'
        }]
      };
    }
  },
  
  // Rule: Student Loan Repayments
  {
    id: 'sa-014',
    name: 'Student Loan Repayments',
    description: 'Validates student loan repayment considerations',
    severity: 'warning',
    validate: (data: SelfAssessmentPayload): ValidationResult => {
      // This is a simplified check - actual implementation would be more complex
      return {
        valid: true, // This is a warning, so we don't fail validation
        errors: [],
        warnings: [{
          field: 'general',
          message: 'If you have a student loan, you may need to make repayments through your Self Assessment. Check if you need to complete the student loan questions in your tax return.',
          code: 'STUDENT_LOAN_REMINDER'
        }]
      };
    }
  },
  
  // Rule: Capital Gains
  {
    id: 'sa-015',
    name: 'Capital Gains',
    description: 'Validates capital gains considerations',
    severity: 'warning',
    validate: (data: SelfAssessmentPayload): ValidationResult => {
      // This is a simplified check - actual implementation would be more complex
      return {
        valid: true, // This is a warning, so we don't fail validation
        errors: [],
        warnings: [{
          field: 'general',
          message: 'If you have disposed of assets (such as property or shares) during the tax year, you may need to report Capital Gains Tax. Ensure you have included all relevant disposals in your tax return.',
          code: 'CAPITAL_GAINS_REMINDER'
        }]
      };
    }
  }
];
