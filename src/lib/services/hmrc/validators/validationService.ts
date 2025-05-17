/**
 * HMRC Validation Service
 * 
 * This service provides comprehensive validation rules for all tax transformation types.
 * It ensures data completeness, accuracy, and compliance with HMRC requirements.
 */

import { 
  FinancialData, 
  VatReturnPayload, 
  PropertyIncomePayload,
  SelfAssessmentPayload,
  ValidationResult,
  ValidationRule
} from '../transformers/types';
import { vatValidationRules } from './vatValidationRules';
import { propertyIncomeValidationRules } from './propertyIncomeValidationRules';
import { selfAssessmentValidationRules } from './selfAssessmentValidationRules';

/**
 * Validation Service for HMRC tax submissions
 */
export class HmrcValidationService {
  private vatRules: ValidationRule<VatReturnPayload>[];
  private propertyIncomeRules: ValidationRule<PropertyIncomePayload>[];
  private selfAssessmentRules: ValidationRule<SelfAssessmentPayload>[];
  
  constructor() {
    this.vatRules = vatValidationRules;
    this.propertyIncomeRules = propertyIncomeValidationRules;
    this.selfAssessmentRules = selfAssessmentValidationRules;
  }

  /**
   * Validate VAT return payload
   * 
   * @param payload VAT return payload to validate
   * @param financialData Original financial data (optional, for cross-validation)
   * @returns Validation result
   */
  public validateVatReturn(
    payload: VatReturnPayload, 
    financialData?: FinancialData
  ): ValidationResult {
    return this.validate(payload, this.vatRules, financialData);
  }

  /**
   * Validate property income payload
   * 
   * @param payload Property income payload to validate
   * @param financialData Original financial data (optional, for cross-validation)
   * @returns Validation result
   */
  public validatePropertyIncome(
    payload: PropertyIncomePayload, 
    financialData?: FinancialData
  ): ValidationResult {
    return this.validate(payload, this.propertyIncomeRules, financialData);
  }

  /**
   * Validate self assessment payload
   * 
   * @param payload Self assessment payload to validate
   * @param financialData Original financial data (optional, for cross-validation)
   * @returns Validation result
   */
  public validateSelfAssessment(
    payload: SelfAssessmentPayload, 
    financialData?: FinancialData
  ): ValidationResult {
    return this.validate(payload, this.selfAssessmentRules, financialData);
  }

  /**
   * Generic validation method
   * 
   * @param payload Payload to validate
   * @param rules Validation rules to apply
   * @param financialData Original financial data (optional, for cross-validation)
   * @returns Validation result
   */
  private validate<T>(
    payload: T, 
    rules: ValidationRule<T>[], 
    financialData?: FinancialData
  ): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];

    // Apply each validation rule
    for (const rule of rules) {
      try {
        const result = rule.validate(payload, financialData);
        
        if (!result.valid) {
          // Add errors or warnings based on rule severity
          if (rule.severity === 'error') {
            errors.push(...result.errors);
          } else {
            warnings.push(...result.errors);
          }
        }
      } catch (error) {
        // Handle unexpected errors in validation rules
        errors.push({
          field: rule.field || 'general',
          message: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
          code: 'VALIDATION_ERROR'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
