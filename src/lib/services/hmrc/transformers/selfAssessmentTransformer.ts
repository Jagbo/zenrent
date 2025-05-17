/**
 * Self Assessment Transformation Framework
 * 
 * This module transforms ZenRent financial data into HMRC-compliant self assessment format.
 * It provides a framework for transforming different types of income and expenses
 * for self assessment tax returns.
 */

import { 
  FinancialData, 
  PropertyIncomePayload,
  SelfAssessmentPayload,
  TransformationOptions, 
  TransformationResult, 
  ValidationResult
} from './types';
import { PropertyIncomeTransformer } from './propertyIncomeTransformer';
import { roundCurrency, calculateTaxYear } from './utils';

/**
 * Self Assessment Income Types
 */
export enum SelfAssessmentIncomeType {
  EMPLOYMENT = 'employment',
  SELF_EMPLOYMENT = 'self_employment',
  UK_PROPERTY = 'uk_property',
  FOREIGN_PROPERTY = 'foreign_property',
  DIVIDENDS = 'dividends',
  SAVINGS = 'savings',
  PENSIONS = 'pensions',
  CAPITAL_GAINS = 'capital_gains',
  OTHER = 'other'
}

/**
 * Self Assessment Deduction Types
 */
export enum SelfAssessmentDeductionType {
  GIFT_AID = 'gift_aid',
  PENSION_CONTRIBUTIONS = 'pension_contributions',
  STUDENT_LOAN = 'student_loan',
  BLIND_PERSONS_ALLOWANCE = 'blind_persons_allowance',
  OTHER = 'other'
}

/**
 * Self Assessment Transformer Class
 * Handles transformation of financial data to self assessment format
 */
export class SelfAssessmentTransformer {
  private options: TransformationOptions;
  private propertyIncomeTransformer: PropertyIncomeTransformer;

  constructor(options: TransformationOptions = {}) {
    this.options = {
      roundingPrecision: 2,
      validateOutput: true,
      includeNonMandatoryFields: true,
      currencyCode: 'GBP',
      debug: false,
      ...options
    };

    // Initialize dependent transformers
    this.propertyIncomeTransformer = new PropertyIncomeTransformer(this.options);
  }

  /**
   * Transform financial data to self assessment format
   */
  public transform(financialData: FinancialData): TransformationResult<SelfAssessmentPayload> {
    try {
      // Determine tax year
      const startDate = new Date(financialData.startDate);
      const taxYear = calculateTaxYear(startDate);
      const [startYearStr, endYearStr] = taxYear.split('-');
      const formattedTaxYear = `${startYearStr}-${endYearStr.substring(2)}`;

      // Initialize self assessment payload
      const selfAssessment: SelfAssessmentPayload = {
        taxYear: formattedTaxYear,
        income: {}
      };

      // Transform property income using the property income transformer
      const propertyIncomeResult = this.propertyIncomeTransformer.transform(financialData);
      if (propertyIncomeResult.valid) {
        selfAssessment.income.ukProperty = propertyIncomeResult.data;
      }

      // Transform other income types
      this.transformEmploymentIncome(financialData, selfAssessment);
      this.transformSelfEmploymentIncome(financialData, selfAssessment);
      this.transformDividendsIncome(financialData, selfAssessment);
      this.transformSavingsIncome(financialData, selfAssessment);

      // Transform deductions
      this.transformDeductions(financialData, selfAssessment);

      // Validate the result if required
      let validationResult: ValidationResult = { valid: true, errors: [] };
      if (this.options.validateOutput) {
        validationResult = this.validateSelfAssessment(selfAssessment);
      }

      // Combine validation errors from property income
      if (!propertyIncomeResult.valid && propertyIncomeResult.errors.length > 0) {
        propertyIncomeResult.errors.forEach(error => {
          validationResult.errors.push({
            field: `income.ukProperty.${error.field}`,
            message: error.message,
            code: error.code
          });
        });
        validationResult.valid = false;
      }

      return {
        data: selfAssessment,
        valid: validationResult.valid,
        errors: validationResult.errors,
        metadata: {
          taxYear: formattedTaxYear,
          periodStart: financialData.startDate,
          periodEnd: financialData.endDate,
          incomeTypes: Object.keys(selfAssessment.income)
        }
      };
    } catch (error) {
      return {
        data: {} as SelfAssessmentPayload,
        valid: false,
        errors: [{
          field: 'general',
          message: `Error transforming self assessment data: ${error instanceof Error ? error.message : String(error)}`,
          code: 'TRANSFORMATION_ERROR'
        }]
      };
    }
  }

  /**
   * Transform employment income
   */
  private transformEmploymentIncome(
    financialData: FinancialData,
    selfAssessment: SelfAssessmentPayload
  ): void {
    // Filter transactions related to employment income
    const employmentTransactions = financialData.transactions.filter(t => {
      return t.category.toLowerCase().includes('employment') || 
             t.category.toLowerCase().includes('salary') ||
             t.category.toLowerCase().includes('wage') ||
             (t.metadata?.incomeType === SelfAssessmentIncomeType.EMPLOYMENT);
    });

    if (employmentTransactions.length === 0) {
      return; // No employment income to transform
    }

    // Group transactions by employer (using metadata or description)
    const employerGroups: Record<string, { 
      transactions: typeof employmentTransactions,
      employerName: string,
      employerReference?: string
    }> = {};

    employmentTransactions.forEach(transaction => {
      let employerId = transaction.metadata?.employerId || 
                      transaction.metadata?.employerName || 
                      transaction.description;
      
      if (!employerId) {
        employerId = 'default-employer';
      }

      if (!employerGroups[employerId]) {
        employerGroups[employerId] = {
          transactions: [],
          employerName: transaction.metadata?.employerName || transaction.description || 'Unknown Employer',
          employerReference: transaction.metadata?.employerReference
        };
      }

      employerGroups[employerId].transactions.push(transaction);
    });

    // Initialize employment array if not exists
    if (!selfAssessment.income.employment) {
      selfAssessment.income.employment = [];
    }

    // Process each employer group
    Object.values(employerGroups).forEach(group => {
      const totalIncome = group.transactions.reduce((sum, t) => sum + t.amount, 0);
      const totalTax = group.transactions.reduce((sum, t) => {
        return sum + (t.metadata?.taxDeducted || 0);
      }, 0);

      // Get date ranges if available
      const dates = group.transactions.map(t => new Date(t.date));
      const startDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : undefined;
      const endDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : undefined;

      selfAssessment.income.employment?.push({
        employerName: group.employerName,
        employerReference: group.employerReference || '',
        startDate: startDate?.toISOString().split('T')[0],
        cessationDate: endDate?.toISOString().split('T')[0],
        taxablePayToDate: roundCurrency(totalIncome, this.options.roundingPrecision),
        totalTaxToDate: roundCurrency(totalTax, this.options.roundingPrecision),
        paymentMethod: 'PAYE'
      });
    });
  }

  /**
   * Transform self employment income
   */
  private transformSelfEmploymentIncome(
    financialData: FinancialData,
    selfAssessment: SelfAssessmentPayload
  ): void {
    // Filter transactions related to self employment
    const selfEmploymentTransactions = financialData.transactions.filter(t => {
      return t.category.toLowerCase().includes('self_employment') || 
             t.category.toLowerCase().includes('business') ||
             t.category.toLowerCase().includes('freelance') ||
             (t.metadata?.incomeType === SelfAssessmentIncomeType.SELF_EMPLOYMENT);
    });

    if (selfEmploymentTransactions.length === 0) {
      return; // No self employment income to transform
    }

    // Group transactions by business
    const businessGroups: Record<string, { 
      transactions: typeof selfEmploymentTransactions,
      businessName: string,
      businessDescription: string,
      commencementDate?: string
    }> = {};

    selfEmploymentTransactions.forEach(transaction => {
      let businessId = transaction.metadata?.businessId || 
                      transaction.metadata?.businessName || 
                      'default-business';

      if (!businessGroups[businessId]) {
        businessGroups[businessId] = {
          transactions: [],
          businessName: transaction.metadata?.businessName || 'Self-employed Business',
          businessDescription: transaction.metadata?.businessDescription || 'Self-employed Activity',
          commencementDate: transaction.metadata?.commencementDate
        };
      }

      businessGroups[businessId].transactions.push(transaction);
    });

    // Initialize self employment array if not exists
    if (!selfAssessment.income.selfEmployment) {
      selfAssessment.income.selfEmployment = [];
    }

    // Process each business group
    Object.entries(businessGroups).forEach(([businessId, group]) => {
      // Separate income and expenses
      const incomeTransactions = group.transactions.filter(t => 
        t.category.toLowerCase().includes('income') || 
        t.category.toLowerCase().includes('revenue') ||
        t.amount > 0
      );
      
      const expenseTransactions = group.transactions.filter(t => 
        t.category.toLowerCase().includes('expense') || 
        t.category.toLowerCase().includes('cost') ||
        t.amount < 0
      );

      // Calculate total income
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

      // Group expenses by category
      const expenses: Record<string, number> = {};
      expenseTransactions.forEach(t => {
        const category = t.metadata?.expenseCategory || 
                        t.category.toLowerCase().replace(/[^a-z0-9]/g, '_') || 
                        'other';
        
        if (!expenses[category]) {
          expenses[category] = 0;
        }
        
        expenses[category] += Math.abs(t.amount);
      });

      // Round expense values
      Object.keys(expenses).forEach(key => {
        expenses[key] = roundCurrency(expenses[key], this.options.roundingPrecision);
      });

      // Get date ranges
      const dates = group.transactions.map(t => new Date(t.date));
      const startDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : undefined;
      const endDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : undefined;

      // Get commencement date
      const commencementDate = group.commencementDate || 
                              (startDate ? startDate.toISOString().split('T')[0] : financialData.startDate);

      selfAssessment.income.selfEmployment?.push({
        businessId,
        businessName: group.businessName,
        businessDescription: group.businessDescription,
        commencementDate,
        accountingPeriodStartDate: financialData.startDate,
        accountingPeriodEndDate: financialData.endDate,
        income: roundCurrency(totalIncome, this.options.roundingPrecision),
        expenses,
        additions: {},
        deductions: {}
      });
    });
  }

  /**
   * Transform dividends income
   */
  private transformDividendsIncome(
    financialData: FinancialData,
    selfAssessment: SelfAssessmentPayload
  ): void {
    // Filter transactions related to dividends
    const dividendTransactions = financialData.transactions.filter(t => {
      return t.category.toLowerCase().includes('dividend') || 
             (t.metadata?.incomeType === SelfAssessmentIncomeType.DIVIDENDS);
    });

    if (dividendTransactions.length === 0) {
      return; // No dividend income to transform
    }

    // Separate UK and other dividends
    const ukDividends = dividendTransactions.filter(t => 
      t.metadata?.dividendType === 'uk' || 
      !t.metadata?.dividendType
    ).reduce((sum, t) => sum + t.amount, 0);

    const otherDividends = dividendTransactions.filter(t => 
      t.metadata?.dividendType === 'other'
    ).reduce((sum, t) => sum + t.amount, 0);

    // Add dividends to self assessment
    selfAssessment.income.dividends = {
      ukDividends: roundCurrency(ukDividends, this.options.roundingPrecision),
      otherUkDividends: roundCurrency(otherDividends, this.options.roundingPrecision)
    };
  }

  /**
   * Transform savings income
   */
  private transformSavingsIncome(
    financialData: FinancialData,
    selfAssessment: SelfAssessmentPayload
  ): void {
    // Filter transactions related to savings
    const savingsTransactions = financialData.transactions.filter(t => {
      return t.category.toLowerCase().includes('interest') || 
             t.category.toLowerCase().includes('saving') ||
             (t.metadata?.incomeType === SelfAssessmentIncomeType.SAVINGS);
    });

    if (savingsTransactions.length === 0) {
      return; // No savings income to transform
    }

    // Separate UK and foreign interest
    const ukInterest = savingsTransactions.filter(t => 
      t.metadata?.interestType === 'uk' || 
      !t.metadata?.interestType
    ).reduce((sum, t) => sum + t.amount, 0);

    const foreignInterest = savingsTransactions.filter(t => 
      t.metadata?.interestType === 'foreign'
    ).reduce((sum, t) => sum + t.amount, 0);

    // Add savings to self assessment
    selfAssessment.income.savings = {
      ukInterest: roundCurrency(ukInterest, this.options.roundingPrecision),
      foreignInterest: roundCurrency(foreignInterest, this.options.roundingPrecision)
    };
  }

  /**
   * Transform deductions
   */
  private transformDeductions(
    financialData: FinancialData,
    selfAssessment: SelfAssessmentPayload
  ): void {
    // Filter transactions related to deductions
    const deductionTransactions = financialData.transactions.filter(t => {
      return t.category.toLowerCase().includes('deduction') || 
             t.category.toLowerCase().includes('gift_aid') ||
             t.category.toLowerCase().includes('pension') ||
             (t.metadata?.transactionType === 'deduction');
    });

    if (deductionTransactions.length === 0) {
      return; // No deductions to transform
    }

    // Initialize deductions object if not exists
    if (!selfAssessment.deductions) {
      selfAssessment.deductions = {};
    }

    // Process gift aid payments
    const giftAidTransactions = deductionTransactions.filter(t => 
      t.category.toLowerCase().includes('gift_aid') ||
      t.metadata?.deductionType === SelfAssessmentDeductionType.GIFT_AID
    );

    if (giftAidTransactions.length > 0) {
      const giftAidPayments = giftAidTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const giftAidPreviousTaxYear = giftAidTransactions.filter(t => 
        t.metadata?.previousTaxYear === true
      ).reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const giftAidNextTaxYear = giftAidTransactions.filter(t => 
        t.metadata?.nextTaxYear === true
      ).reduce((sum, t) => sum + Math.abs(t.amount), 0);

      selfAssessment.deductions.giftAid = {
        giftAidPayments: roundCurrency(giftAidPayments - giftAidPreviousTaxYear - giftAidNextTaxYear, this.options.roundingPrecision),
        giftAidTreatedAsPaidInPreviousTaxYear: roundCurrency(giftAidPreviousTaxYear, this.options.roundingPrecision),
        giftAidTreatedAsPaidInCurrentTaxYear: roundCurrency(giftAidNextTaxYear, this.options.roundingPrecision)
      };
    }

    // Process pension contributions
    const pensionTransactions = deductionTransactions.filter(t => 
      t.category.toLowerCase().includes('pension') ||
      t.metadata?.deductionType === SelfAssessmentDeductionType.PENSION_CONTRIBUTIONS
    );

    if (pensionTransactions.length > 0) {
      const pensionContributions = pensionTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const overseasTransfers = pensionTransactions.filter(t => 
        t.metadata?.overseasTransfer === true
      ).reduce((sum, t) => sum + Math.abs(t.amount), 0);

      selfAssessment.deductions.pensionContributions = {
        pensionSchemeOverseasTransfers: roundCurrency(overseasTransfers, this.options.roundingPrecision),
        pensionContributionsAmount: roundCurrency(pensionContributions - overseasTransfers, this.options.roundingPrecision)
      };
    }
  }

  /**
   * Validate self assessment against HMRC rules
   */
  private validateSelfAssessment(selfAssessment: SelfAssessmentPayload): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    // Check that tax year is valid
    if (!selfAssessment.taxYear) {
      errors.push({
        field: 'taxYear',
        message: 'taxYear is required',
        code: 'MISSING_FIELD'
      });
    } else {
      const taxYearPattern = /^\d{4}-\d{2}$/;
      if (!taxYearPattern.test(selfAssessment.taxYear)) {
        errors.push({
          field: 'taxYear',
          message: `taxYear (${selfAssessment.taxYear}) must be in the format YYYY-YY`,
          code: 'INVALID_TAX_YEAR_FORMAT'
        });
      }
    }

    // Check that at least one income type is included
    if (!selfAssessment.income || Object.keys(selfAssessment.income).length === 0) {
      errors.push({
        field: 'income',
        message: 'At least one income type must be included',
        code: 'MISSING_INCOME'
      });
    }

    // Validate employment income if present
    if (selfAssessment.income?.employment) {
      selfAssessment.income.employment.forEach((employment, index) => {
        if (!employment.employerName) {
          errors.push({
            field: `income.employment[${index}].employerName`,
            message: 'employerName is required',
            code: 'MISSING_FIELD'
          });
        }

        if (employment.taxablePayToDate < 0) {
          errors.push({
            field: `income.employment[${index}].taxablePayToDate`,
            message: 'taxablePayToDate cannot be negative',
            code: 'NEGATIVE_VALUE'
          });
        }

        if (employment.totalTaxToDate < 0) {
          errors.push({
            field: `income.employment[${index}].totalTaxToDate`,
            message: 'totalTaxToDate cannot be negative',
            code: 'NEGATIVE_VALUE'
          });
        }
      });
    }

    // Validate self employment income if present
    if (selfAssessment.income?.selfEmployment) {
      selfAssessment.income.selfEmployment.forEach((business, index) => {
        if (!business.businessName) {
          errors.push({
            field: `income.selfEmployment[${index}].businessName`,
            message: 'businessName is required',
            code: 'MISSING_FIELD'
          });
        }

        if (!business.commencementDate) {
          errors.push({
            field: `income.selfEmployment[${index}].commencementDate`,
            message: 'commencementDate is required',
            code: 'MISSING_FIELD'
          });
        }

        if (!business.accountingPeriodStartDate) {
          errors.push({
            field: `income.selfEmployment[${index}].accountingPeriodStartDate`,
            message: 'accountingPeriodStartDate is required',
            code: 'MISSING_FIELD'
          });
        }

        if (!business.accountingPeriodEndDate) {
          errors.push({
            field: `income.selfEmployment[${index}].accountingPeriodEndDate`,
            message: 'accountingPeriodEndDate is required',
            code: 'MISSING_FIELD'
          });
        }

        if (business.income < 0) {
          errors.push({
            field: `income.selfEmployment[${index}].income`,
            message: 'income cannot be negative',
            code: 'NEGATIVE_VALUE'
          });
        }
      });
    }

    // Validate dividends if present
    if (selfAssessment.income?.dividends) {
      if (selfAssessment.income.dividends.ukDividends < 0) {
        errors.push({
          field: 'income.dividends.ukDividends',
          message: 'ukDividends cannot be negative',
          code: 'NEGATIVE_VALUE'
        });
      }

      if (selfAssessment.income.dividends.otherUkDividends < 0) {
        errors.push({
          field: 'income.dividends.otherUkDividends',
          message: 'otherUkDividends cannot be negative',
          code: 'NEGATIVE_VALUE'
        });
      }
    }

    // Validate savings if present
    if (selfAssessment.income?.savings) {
      if (selfAssessment.income.savings.ukInterest < 0) {
        errors.push({
          field: 'income.savings.ukInterest',
          message: 'ukInterest cannot be negative',
          code: 'NEGATIVE_VALUE'
        });
      }

      if (selfAssessment.income.savings.foreignInterest < 0) {
        errors.push({
          field: 'income.savings.foreignInterest',
          message: 'foreignInterest cannot be negative',
          code: 'NEGATIVE_VALUE'
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
