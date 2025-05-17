/**
 * Property Income Validation Rules
 * 
 * This file contains validation rules for property income submissions to ensure compliance with HMRC requirements.
 */

import { 
  FinancialData, 
  ValidationResult, 
  ValidationRule, 
  PropertyIncomePayload 
} from '../transformers/types';

/**
 * Property income validation rules
 */
export const propertyIncomeValidationRules: ValidationRule<PropertyIncomePayload>[] = [
  // Rule: Date Range Format
  {
    id: 'prop-001',
    name: 'Date Range Format',
    description: 'Validates that the date range is in the correct format',
    severity: 'error',
    validate: (data: PropertyIncomePayload): ValidationResult => {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      const fromDateValid = datePattern.test(data.fromDate);
      const toDateValid = datePattern.test(data.toDate);
      
      const errors = [];
      
      if (!fromDateValid) {
        errors.push({
          field: 'fromDate',
          message: `From date (${data.fromDate}) must be in the format YYYY-MM-DD`,
          code: 'INVALID_FROM_DATE_FORMAT'
        });
      }
      
      if (!toDateValid) {
        errors.push({
          field: 'toDate',
          message: `To date (${data.toDate}) must be in the format YYYY-MM-DD`,
          code: 'INVALID_TO_DATE_FORMAT'
        });
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
  },
  
  // Rule: Date Range Validity
  {
    id: 'prop-002',
    name: 'Date Range Validity',
    description: 'Validates that the date range is valid (from date is before to date)',
    severity: 'error',
    validate: (data: PropertyIncomePayload): ValidationResult => {
      const fromDate = new Date(data.fromDate);
      const toDate = new Date(data.toDate);
      
      const valid = !isNaN(fromDate.getTime()) && 
                   !isNaN(toDate.getTime()) && 
                   fromDate <= toDate;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'dateRange',
          message: `Date range is invalid: from date (${data.fromDate}) must be before or equal to to date (${data.toDate})`,
          code: 'INVALID_DATE_RANGE'
        }]
      };
    }
  },
  
  // Rule: UK Properties Required
  {
    id: 'prop-003',
    name: 'UK Properties Required',
    description: 'Validates that UK properties data is provided',
    field: 'ukProperties',
    severity: 'error',
    validate: (data: PropertyIncomePayload): ValidationResult => {
      const valid = !!data.ukProperties && 
                   typeof data.ukProperties === 'object';
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'ukProperties',
          message: 'UK properties data is required',
          code: 'MISSING_UK_PROPERTIES'
        }]
      };
    }
  },
  
  // Rule: Total Income Calculation
  {
    id: 'prop-004',
    name: 'Total Income Calculation',
    description: 'Validates that total income is calculated correctly',
    field: 'ukProperties.totalIncome',
    severity: 'error',
    validate: (data: PropertyIncomePayload): ValidationResult => {
      if (!data.ukProperties || !data.ukProperties.properties) {
        return {
          valid: false,
          errors: [{
            field: 'ukProperties',
            message: 'UK properties data is missing or invalid',
            code: 'INVALID_UK_PROPERTIES'
          }]
        };
      }
      
      // Calculate expected total income from all properties
      const expectedTotalIncome = data.ukProperties.properties.reduce((sum, property) => {
        const propertyIncome = property.income || {};
        return sum + 
               (propertyIncome.rentIncome || 0) + 
               (propertyIncome.premiumsOfLeaseGrant || 0) + 
               (propertyIncome.reversePremiums || 0) + 
               (propertyIncome.otherPropertyIncome || 0);
      }, 0);
      
      // Round to 2 decimal places for comparison
      const expectedTotal = Number(expectedTotalIncome.toFixed(2));
      const actualTotal = Number(data.ukProperties.totalIncome.toFixed(2));
      
      const valid = expectedTotal === actualTotal;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'ukProperties.totalIncome',
          message: `Total income (${actualTotal}) should equal the sum of all property incomes (${expectedTotal})`,
          code: 'INVALID_TOTAL_INCOME'
        }]
      };
    }
  },
  
  // Rule: Total Expenses Calculation
  {
    id: 'prop-005',
    name: 'Total Expenses Calculation',
    description: 'Validates that total expenses is calculated correctly',
    field: 'ukProperties.totalExpenses',
    severity: 'error',
    validate: (data: PropertyIncomePayload): ValidationResult => {
      if (!data.ukProperties || !data.ukProperties.properties) {
        return {
          valid: false,
          errors: [{
            field: 'ukProperties',
            message: 'UK properties data is missing or invalid',
            code: 'INVALID_UK_PROPERTIES'
          }]
        };
      }
      
      // Calculate expected total expenses from all properties
      const expectedTotalExpenses = data.ukProperties.properties.reduce((sum, property) => {
        const propertyExpenses = property.expenses || {};
        return sum + 
               (propertyExpenses.premisesRunningCosts || 0) + 
               (propertyExpenses.repairsAndMaintenance || 0) + 
               (propertyExpenses.financialCosts || 0) + 
               (propertyExpenses.professionalFees || 0) + 
               (propertyExpenses.costOfServices || 0) + 
               (propertyExpenses.other || 0);
      }, 0);
      
      // Round to 2 decimal places for comparison
      const expectedTotal = Number(expectedTotalExpenses.toFixed(2));
      const actualTotal = Number(data.ukProperties.totalExpenses.toFixed(2));
      
      const valid = expectedTotal === actualTotal;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'ukProperties.totalExpenses',
          message: `Total expenses (${actualTotal}) should equal the sum of all property expenses (${expectedTotal})`,
          code: 'INVALID_TOTAL_EXPENSES'
        }]
      };
    }
  },
  
  // Rule: Net Profit Calculation
  {
    id: 'prop-006',
    name: 'Net Profit Calculation',
    description: 'Validates that net profit is calculated correctly',
    field: 'ukProperties.netProfit',
    severity: 'error',
    validate: (data: PropertyIncomePayload): ValidationResult => {
      if (!data.ukProperties) {
        return {
          valid: false,
          errors: [{
            field: 'ukProperties',
            message: 'UK properties data is missing',
            code: 'MISSING_UK_PROPERTIES'
          }]
        };
      }
      
      const totalIncome = data.ukProperties.totalIncome || 0;
      const totalExpenses = data.ukProperties.totalExpenses || 0;
      
      // Net profit should be positive if income > expenses, otherwise 0
      const expectedNetProfit = totalIncome > totalExpenses ? 
                               Number((totalIncome - totalExpenses).toFixed(2)) : 0;
      const actualNetProfit = Number(data.ukProperties.netProfit.toFixed(2));
      
      const valid = expectedNetProfit === actualNetProfit;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'ukProperties.netProfit',
          message: `Net profit (${actualNetProfit}) should equal total income (${totalIncome}) minus total expenses (${totalExpenses}) if positive, otherwise 0`,
          code: 'INVALID_NET_PROFIT'
        }]
      };
    }
  },
  
  // Rule: Net Loss Calculation
  {
    id: 'prop-007',
    name: 'Net Loss Calculation',
    description: 'Validates that net loss is calculated correctly',
    field: 'ukProperties.netLoss',
    severity: 'error',
    validate: (data: PropertyIncomePayload): ValidationResult => {
      if (!data.ukProperties) {
        return {
          valid: false,
          errors: [{
            field: 'ukProperties',
            message: 'UK properties data is missing',
            code: 'MISSING_UK_PROPERTIES'
          }]
        };
      }
      
      const totalIncome = data.ukProperties.totalIncome || 0;
      const totalExpenses = data.ukProperties.totalExpenses || 0;
      
      // Net loss should be positive if expenses > income, otherwise 0
      const expectedNetLoss = totalExpenses > totalIncome ? 
                             Number((totalExpenses - totalIncome).toFixed(2)) : 0;
      const actualNetLoss = Number(data.ukProperties.netLoss.toFixed(2));
      
      const valid = expectedNetLoss === actualNetLoss;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'ukProperties.netLoss',
          message: `Net loss (${actualNetLoss}) should equal total expenses (${totalExpenses}) minus total income (${totalIncome}) if positive, otherwise 0`,
          code: 'INVALID_NET_LOSS'
        }]
      };
    }
  },
  
  // Rule: Property IDs Required
  {
    id: 'prop-008',
    name: 'Property IDs Required',
    description: 'Validates that each property has an ID',
    severity: 'error',
    validate: (data: PropertyIncomePayload): ValidationResult => {
      if (!data.ukProperties || !data.ukProperties.properties) {
        return {
          valid: false,
          errors: [{
            field: 'ukProperties.properties',
            message: 'Properties array is missing or invalid',
            code: 'MISSING_PROPERTIES'
          }]
        };
      }
      
      const missingIds = data.ukProperties.properties.filter(p => !p.propertyId);
      const valid = missingIds.length === 0;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'ukProperties.properties',
          message: `${missingIds.length} properties are missing property IDs`,
          code: 'MISSING_PROPERTY_IDS'
        }]
      };
    }
  },
  
  // Rule: Property Income Required
  {
    id: 'prop-009',
    name: 'Property Income Required',
    description: 'Validates that each property has income data',
    severity: 'error',
    validate: (data: PropertyIncomePayload): ValidationResult => {
      if (!data.ukProperties || !data.ukProperties.properties) {
        return {
          valid: false,
          errors: [{
            field: 'ukProperties.properties',
            message: 'Properties array is missing or invalid',
            code: 'MISSING_PROPERTIES'
          }]
        };
      }
      
      const missingIncome = data.ukProperties.properties.filter(p => !p.income);
      const valid = missingIncome.length === 0;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'ukProperties.properties',
          message: `${missingIncome.length} properties are missing income data`,
          code: 'MISSING_PROPERTY_INCOME'
        }]
      };
    }
  },
  
  // Rule: Property Expenses Required
  {
    id: 'prop-010',
    name: 'Property Expenses Required',
    description: 'Validates that each property has expenses data',
    severity: 'error',
    validate: (data: PropertyIncomePayload): ValidationResult => {
      if (!data.ukProperties || !data.ukProperties.properties) {
        return {
          valid: false,
          errors: [{
            field: 'ukProperties.properties',
            message: 'Properties array is missing or invalid',
            code: 'MISSING_PROPERTIES'
          }]
        };
      }
      
      const missingExpenses = data.ukProperties.properties.filter(p => !p.expenses);
      const valid = missingExpenses.length === 0;
      
      return {
        valid,
        errors: valid ? [] : [{
          field: 'ukProperties.properties',
          message: `${missingExpenses.length} properties are missing expenses data`,
          code: 'MISSING_PROPERTY_EXPENSES'
        }]
      };
    }
  },
  
  // Rule: Allowances Validation
  {
    id: 'prop-011',
    name: 'Allowances Validation',
    description: 'Validates that allowances are non-negative',
    severity: 'error',
    validate: (data: PropertyIncomePayload): ValidationResult => {
      if (!data.ukProperties || !data.ukProperties.properties) {
        return {
          valid: false,
          errors: [{
            field: 'ukProperties.properties',
            message: 'Properties array is missing or invalid',
            code: 'MISSING_PROPERTIES'
          }]
        };
      }
      
      const errors = [];
      
      // Check each property's allowances
      data.ukProperties.properties.forEach((property, index) => {
        if (!property.allowances) return;
        
        const allowances = property.allowances;
        
        if (allowances.annualInvestmentAllowance < 0) {
          errors.push({
            field: `ukProperties.properties[${index}].allowances.annualInvestmentAllowance`,
            message: 'Annual investment allowance cannot be negative',
            code: 'NEGATIVE_ANNUAL_INVESTMENT_ALLOWANCE'
          });
        }
        
        if (allowances.businessPremisesRenovationAllowance < 0) {
          errors.push({
            field: `ukProperties.properties[${index}].allowances.businessPremisesRenovationAllowance`,
            message: 'Business premises renovation allowance cannot be negative',
            code: 'NEGATIVE_BUSINESS_PREMISES_RENOVATION_ALLOWANCE'
          });
        }
        
        if (allowances.otherCapitalAllowance < 0) {
          errors.push({
            field: `ukProperties.properties[${index}].allowances.otherCapitalAllowance`,
            message: 'Other capital allowance cannot be negative',
            code: 'NEGATIVE_OTHER_CAPITAL_ALLOWANCE'
          });
        }
        
        if (allowances.wearAndTearAllowance < 0) {
          errors.push({
            field: `ukProperties.properties[${index}].allowances.wearAndTearAllowance`,
            message: 'Wear and tear allowance cannot be negative',
            code: 'NEGATIVE_WEAR_AND_TEAR_ALLOWANCE'
          });
        }
        
        if (allowances.propertyAllowance < 0) {
          errors.push({
            field: `ukProperties.properties[${index}].allowances.propertyAllowance`,
            message: 'Property allowance cannot be negative',
            code: 'NEGATIVE_PROPERTY_ALLOWANCE'
          });
        }
      });
      
      // Check top-level allowances
      if (data.annualInvestmentAllowance < 0) {
        errors.push({
          field: 'annualInvestmentAllowance',
          message: 'Annual investment allowance cannot be negative',
          code: 'NEGATIVE_ANNUAL_INVESTMENT_ALLOWANCE'
        });
      }
      
      if (data.businessPremisesRenovationAllowance < 0) {
        errors.push({
          field: 'businessPremisesRenovationAllowance',
          message: 'Business premises renovation allowance cannot be negative',
          code: 'NEGATIVE_BUSINESS_PREMISES_RENOVATION_ALLOWANCE'
        });
      }
      
      if (data.otherCapitalAllowance < 0) {
        errors.push({
          field: 'otherCapitalAllowance',
          message: 'Other capital allowance cannot be negative',
          code: 'NEGATIVE_OTHER_CAPITAL_ALLOWANCE'
        });
      }
      
      if (data.wearAndTearAllowance < 0) {
        errors.push({
          field: 'wearAndTearAllowance',
          message: 'Wear and tear allowance cannot be negative',
          code: 'NEGATIVE_WEAR_AND_TEAR_ALLOWANCE'
        });
      }
      
      if (data.propertyAllowance < 0) {
        errors.push({
          field: 'propertyAllowance',
          message: 'Property allowance cannot be negative',
          code: 'NEGATIVE_PROPERTY_ALLOWANCE'
        });
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
  },
  
  // Rule: Furnished Holiday Lettings
  {
    id: 'prop-012',
    name: 'Furnished Holiday Lettings',
    description: 'Validates furnished holiday lettings criteria',
    severity: 'warning',
    validate: (data: PropertyIncomePayload, financialData?: FinancialData): ValidationResult => {
      // Skip this validation if no financial data is provided
      if (!financialData || !financialData.properties) {
        return { valid: true, errors: [] };
      }
      
      const warnings = [];
      
      // Check if any properties are furnished holiday lettings
      const fhlProperties = financialData.properties.filter(p => 
        p.isFurnished && p.metadata?.holidayLetting === true
      );
      
      if (fhlProperties.length === 0) {
        return { valid: true, errors: [] };
      }
      
      // For furnished holiday lettings, check if they meet the criteria
      // This is a simplified check - actual implementation would be more complex
      warnings.push({
        field: 'general',
        message: 'Ensure furnished holiday lettings meet all HMRC criteria: available for letting for at least 210 days, actually let for at least 105 days, and not used for long-term occupation (more than 31 days) for more than 155 days',
        code: 'FHL_CRITERIA_REMINDER'
      });
      
      return {
        valid: true, // This is a warning, so we don't fail validation
        errors: [],
        warnings
      };
    }
  },
  
  // Rule: Rent a Room Relief
  {
    id: 'prop-013',
    name: 'Rent a Room Relief',
    description: 'Validates rent a room relief criteria',
    severity: 'warning',
    validate: (data: PropertyIncomePayload, financialData?: FinancialData): ValidationResult => {
      // Skip this validation if no financial data is provided
      if (!financialData || !financialData.properties) {
        return { valid: true, errors: [] };
      }
      
      const warnings = [];
      
      // Check if any properties are main residences
      const mainResidences = financialData.properties.filter(p => 
        p.isMainResidence === true
      );
      
      if (mainResidences.length === 0) {
        return { valid: true, errors: [] };
      }
      
      // For main residences, check if rent a room relief might apply
      // This is a simplified check - actual implementation would be more complex
      warnings.push({
        field: 'general',
        message: 'If you are letting a room in your main residence, you may be eligible for Rent a Room Relief up to £7,500 per year. Ensure this is correctly applied if applicable.',
        code: 'RENT_A_ROOM_RELIEF_REMINDER'
      });
      
      return {
        valid: true, // This is a warning, so we don't fail validation
        errors: [],
        warnings
      };
    }
  },
  
  // Rule: Property Income Allowance
  {
    id: 'prop-014',
    name: 'Property Income Allowance',
    description: 'Validates property income allowance criteria',
    severity: 'warning',
    validate: (data: PropertyIncomePayload): ValidationResult => {
      if (!data.ukProperties) {
        return { valid: true, errors: [] };
      }
      
      const totalIncome = data.ukProperties.totalIncome || 0;
      
      // If total income is less than £1,000, property income allowance might apply
      if (totalIncome <= 1000) {
        return {
          valid: true,
          errors: [],
          warnings: [{
            field: 'propertyAllowance',
            message: 'Your property income is £1,000 or less. You may be eligible for the £1,000 property income allowance, which means you don\'t need to report this income to HMRC.',
            code: 'PROPERTY_INCOME_ALLOWANCE_ELIGIBLE'
          }]
        };
      }
      
      // If total income is more than £1,000, property income allowance might still apply
      return {
        valid: true,
        errors: [],
        warnings: [{
          field: 'propertyAllowance',
          message: 'Your property income is more than £1,000. You may be eligible to claim the £1,000 property income allowance as a deduction instead of actual expenses if this is more beneficial.',
          code: 'PROPERTY_INCOME_ALLOWANCE_OPTION'
        }]
      };
    }
  },
  
  // Rule: Finance Cost Restriction
  {
    id: 'prop-015',
    name: 'Finance Cost Restriction',
    description: 'Validates finance cost restriction for residential property',
    severity: 'warning',
    validate: (data: PropertyIncomePayload, financialData?: FinancialData): ValidationResult => {
      // Skip this validation if no financial data is provided
      if (!financialData || !financialData.properties) {
        return { valid: true, errors: [] };
      }
      
      // Check if any properties are residential
      const residentialProperties = financialData.properties.filter(p => 
        p.propertyType === 'residential' && !p.isMainResidence
      );
      
      if (residentialProperties.length === 0) {
        return { valid: true, errors: [] };
      }
      
      // For residential properties, check if finance cost restriction might apply
      // This is a simplified check - actual implementation would be more complex
      return {
        valid: true,
        errors: [],
        warnings: [{
          field: 'general',
          message: 'For residential properties, mortgage interest and other finance costs are restricted to basic rate tax relief only. Ensure these costs are correctly reported as a basic rate tax reduction rather than a deductible expense.',
          code: 'FINANCE_COST_RESTRICTION_REMINDER'
        }]
      };
    }
  }
];
