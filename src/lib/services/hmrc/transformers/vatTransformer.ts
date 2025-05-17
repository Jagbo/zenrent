/**
 * VAT Transformation Logic
 * 
 * This module transforms ZenRent financial data into HMRC-compliant VAT return format.
 * It handles the calculation of VAT amounts based on transaction data and applies
 * appropriate rounding and validation rules.
 */

import { 
  FinancialData, 
  FinancialTransaction,
  TransformationOptions, 
  TransformationResult, 
  ValidationResult, 
  VatReturnPayload 
} from './types';
import {
  CurrencyCode,
  RoundingMethod,
  roundCurrency,
  formatCurrency,
  addCurrency,
  subtractCurrency,
  multiplyCurrency,
  calculateVatFromGross,
  calculateVatFromNet,
  formatForHmrcSubmission,
  getVatRateForCategory
} from '../utils/currencyUtils';

/**
 * VAT Categories for classifying transactions
 */
export enum VatCategory {
  STANDARD_RATE = 'standard_rate',
  REDUCED_RATE = 'reduced_rate',
  ZERO_RATE = 'zero_rate',
  EXEMPT = 'exempt',
  OUTSIDE_SCOPE = 'outside_scope',
  EC_ACQUISITIONS = 'ec_acquisitions',
  EC_SUPPLIES = 'ec_supplies',
  REVERSE_CHARGE = 'reverse_charge'
}

/**
 * VAT Transaction with categorization
 */
interface VatTransaction extends FinancialTransaction {
  vatCategory?: VatCategory;
  isIncome: boolean;
  isExpense: boolean;
}

/**
 * VAT Transformer Class
 * Handles transformation of financial data to VAT return format
 */
export class VatTransformer {
  private options: TransformationOptions;

  constructor(options: TransformationOptions = {}) {
    this.options = {
      roundingPrecision: 2,
      validateOutput: true,
      includeNonMandatoryFields: true,
      currencyCode: 'GBP',
      debug: false,
      ...options
    };
  }

  /**
   * Transform financial data to VAT return format
   */
  public transform(financialData: FinancialData): TransformationResult<VatReturnPayload> {
    try {
      // Categorize transactions
      const transactions = this.categorizeTransactions(financialData);
      
      // Calculate VAT return values
      const vatReturn: VatReturnPayload = {
        periodKey: this.calculatePeriodKey(financialData.startDate, financialData.endDate),
        vatDueSales: this.calculateVatDueSales(transactions),
        vatDueAcquisitions: this.calculateVatDueAcquisitions(transactions),
        totalVatDue: 0, // Will be calculated below
        vatReclaimedCurrPeriod: this.calculateVatReclaimedCurrPeriod(transactions),
        netVatDue: 0, // Will be calculated below
        totalValueSalesExVAT: this.calculateTotalValueSalesExVAT(transactions),
        totalValuePurchasesExVAT: this.calculateTotalValuePurchasesExVAT(transactions),
        totalValueGoodsSuppliedExVAT: this.calculateTotalValueGoodsSuppliedExVAT(transactions),
        totalAcquisitionsExVAT: this.calculateTotalAcquisitionsExVAT(transactions),
        finalised: true
      };
      
      // Calculate derived fields
      vatReturn.totalVatDue = addCurrency(
        vatReturn.vatDueSales,
        vatReturn.vatDueAcquisitions,
        this.options.currencyCode as CurrencyCode || CurrencyCode.GBP,
        RoundingMethod.ROUND
      );
      
      vatReturn.netVatDue = Math.max(
        0,
        subtractCurrency(
          vatReturn.totalVatDue,
          vatReturn.vatReclaimedCurrPeriod,
          this.options.currencyCode as CurrencyCode || CurrencyCode.GBP,
          RoundingMethod.ROUND
        )
      );
      
      // Validate the result if required
      let validationResult: ValidationResult = { valid: true, errors: [] };
      if (this.options.validateOutput) {
        validationResult = this.validateVatReturn(vatReturn);
      }
      
      return {
        data: vatReturn,
        valid: validationResult.valid,
        errors: validationResult.errors,
        metadata: {
          transactionCount: transactions.length,
          periodStart: financialData.startDate,
          periodEnd: financialData.endDate,
          vatScheme: financialData.vatScheme || 'standard',
          flatRatePercentage: financialData.vatFlatRate
        }
      };
    } catch (error) {
      return {
        data: {} as VatReturnPayload,
        valid: false,
        errors: [{
          field: 'general',
          message: `Error transforming VAT data: ${error instanceof Error ? error.message : String(error)}`,
          code: 'TRANSFORMATION_ERROR'
        }]
      };
    }
  }

  /**
   * Categorize transactions for VAT calculations
   */
  private categorizeTransactions(financialData: FinancialData): VatTransaction[] {
    return financialData.transactions.map(transaction => {
      const isIncome = ['income', 'revenue', 'sale', 'rent'].some(
        term => transaction.category.toLowerCase().includes(term)
      );
      
      const isExpense = ['expense', 'cost', 'purchase', 'fee'].some(
        term => transaction.category.toLowerCase().includes(term)
      );
      
      // Determine VAT category based on transaction data
      let vatCategory: VatCategory | undefined;
      
      if (transaction.vatRate !== undefined) {
        if (transaction.vatRate === 20) {
          vatCategory = VatCategory.STANDARD_RATE;
        } else if (transaction.vatRate === 5) {
          vatCategory = VatCategory.REDUCED_RATE;
        } else if (transaction.vatRate === 0) {
          vatCategory = VatCategory.ZERO_RATE;
        }
      } else if (transaction.metadata?.vatCategory) {
        vatCategory = transaction.metadata.vatCategory as VatCategory;
      }
      
      return {
        ...transaction,
        isIncome,
        isExpense,
        vatCategory
      };
    });
  }

  /**
   * Calculate period key from start and end dates
   */
  private calculatePeriodKey(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Format: YYxx where YY is the year and xx is the period number
    // For example, 23C4 for 4th quarter of 2023
    const year = start.getFullYear().toString().slice(2);
    
    // Determine if monthly, quarterly, or annual
    const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + 
                      end.getMonth() - start.getMonth();
    
    let periodCode = '';
    if (monthDiff === 0) {
      // Monthly
      const month = start.getMonth() + 1; // 1-12
      periodCode = `M${month}`;
    } else if (monthDiff === 2) {
      // Quarterly
      const quarter = Math.floor(start.getMonth() / 3) + 1; // 1-4
      periodCode = `C${quarter}`;
    } else {
      // Annual or custom
      periodCode = 'A0';
    }
    
    return `${year}${periodCode}`;
  }

  /**
   * Calculate VAT due on sales and other outputs
   */
  private calculateVatDueSales(transactions: VatTransaction[]): number {
    const vatDueSales = transactions
      .filter(t => t.isIncome && t.vatAmount !== undefined && t.vatAmount > 0)
      .reduce((sum, t) => sum + (t.vatAmount || 0), 0);
    
    return formatForHmrcSubmission(
      vatDueSales,
      this.options.currencyCode as CurrencyCode || CurrencyCode.GBP
    );
  }

  /**
   * Calculate VAT due on EC acquisitions
   */
  private calculateVatDueAcquisitions(transactions: VatTransaction[]): number {
    const vatDueAcquisitions = transactions
      .filter(t => 
        t.vatCategory === VatCategory.EC_ACQUISITIONS && 
        t.vatAmount !== undefined
      )
      .reduce((sum, t) => sum + (t.vatAmount || 0), 0);
    
    return formatForHmrcSubmission(
      vatDueAcquisitions,
      this.options.currencyCode as CurrencyCode || CurrencyCode.GBP
    );
  }

  /**
   * Calculate VAT reclaimed on purchases
   */
  private calculateVatReclaimedCurrPeriod(transactions: VatTransaction[]): number {
    const vatReclaimed = transactions
      .filter(t => t.isExpense && t.vatAmount !== undefined && t.vatAmount > 0)
      .reduce((sum, t) => sum + (t.vatAmount || 0), 0);
    
    return formatForHmrcSubmission(
      vatReclaimed,
      this.options.currencyCode as CurrencyCode || CurrencyCode.GBP
    );
  }

  /**
   * Calculate total value of sales excluding VAT
   */
  private calculateTotalValueSalesExVAT(transactions: VatTransaction[]): number {
    const salesExVAT = transactions
      .filter(t => t.isIncome)
      .reduce((sum, t) => {
        // If vatAmount is defined, subtract it from the total amount
        const amountExVAT = t.vatAmount !== undefined 
          ? t.amount - t.vatAmount 
          : t.amount;
        return sum + amountExVAT;
      }, 0);
    
    return formatForHmrcSubmission(
      salesExVAT,
      this.options.currencyCode as CurrencyCode || CurrencyCode.GBP
    );
  }

  /**
   * Calculate total value of purchases excluding VAT
   */
  private calculateTotalValuePurchasesExVAT(transactions: VatTransaction[]): number {
    const purchasesExVAT = transactions
      .filter(t => t.isExpense)
      .reduce((sum, t) => {
        // If vatAmount is defined, subtract it from the total amount
        const amountExVAT = t.vatAmount !== undefined 
          ? t.amount - t.vatAmount 
          : t.amount;
        return sum + amountExVAT;
      }, 0);
    
    return formatForHmrcSubmission(
      purchasesExVAT,
      this.options.currencyCode as CurrencyCode || CurrencyCode.GBP
    );
  }

  /**
   * Calculate total value of goods supplied to EC excluding VAT
   */
  private calculateTotalValueGoodsSuppliedExVAT(transactions: VatTransaction[]): number {
    const goodsSuppliedExVAT = transactions
      .filter(t => t.vatCategory === VatCategory.EC_SUPPLIES)
      .reduce((sum, t) => {
        const amountExVAT = t.vatAmount !== undefined 
          ? t.amount - t.vatAmount 
          : t.amount;
        return sum + amountExVAT;
      }, 0);
    
    return formatForHmrcSubmission(
      goodsSuppliedExVAT,
      this.options.currencyCode as CurrencyCode || CurrencyCode.GBP
    );
  }

  /**
   * Calculate total value of acquisitions from EC excluding VAT
   */
  private calculateTotalAcquisitionsExVAT(transactions: VatTransaction[]): number {
    const acquisitionsExVAT = transactions
      .filter(t => t.vatCategory === VatCategory.EC_ACQUISITIONS)
      .reduce((sum, t) => {
        const amountExVAT = t.vatAmount !== undefined 
          ? t.amount - t.vatAmount 
          : t.amount;
        return sum + amountExVAT;
      }, 0);
    
    return formatForHmrcSubmission(
      acquisitionsExVAT,
      this.options.currencyCode as CurrencyCode || CurrencyCode.GBP
    );
  }

  /**
   * Validate VAT return against HMRC rules
   */
  private validateVatReturn(vatReturn: VatReturnPayload): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    
    // Check for negative values where they shouldn't be
    const nonNegativeFields: Array<keyof VatReturnPayload> = [
      'vatDueSales',
      'vatDueAcquisitions',
      'totalVatDue',
      'vatReclaimedCurrPeriod',
      'netVatDue',
      'totalValueSalesExVAT',
      'totalValuePurchasesExVAT',
      'totalValueGoodsSuppliedExVAT',
      'totalAcquisitionsExVAT'
    ];
    
    nonNegativeFields.forEach(field => {
      const value = vatReturn[field];
      if (typeof value === 'number' && value < 0) {
        errors.push({
          field,
          message: `Field ${field} cannot be negative`,
          code: 'NEGATIVE_VALUE'
        });
      }
    });
    
    // Check that totalVatDue equals vatDueSales + vatDueAcquisitions
    const calculatedTotalVatDue = addCurrency(
      vatReturn.vatDueSales,
      vatReturn.vatDueAcquisitions,
      this.options.currencyCode as CurrencyCode || CurrencyCode.GBP,
      RoundingMethod.ROUND
    );
    
    if (vatReturn.totalVatDue !== calculatedTotalVatDue) {
      errors.push({
        field: 'totalVatDue',
        message: `totalVatDue (${vatReturn.totalVatDue}) must equal vatDueSales (${vatReturn.vatDueSales}) + vatDueAcquisitions (${vatReturn.vatDueAcquisitions}) = ${calculatedTotalVatDue}`,
        code: 'INCONSISTENT_TOTAL'
      });
    }
    
    // Check that netVatDue is correctly calculated
    const calculatedNetVatDue = Math.max(
      0,
      subtractCurrency(
        vatReturn.totalVatDue,
        vatReturn.vatReclaimedCurrPeriod,
        this.options.currencyCode as CurrencyCode || CurrencyCode.GBP,
        RoundingMethod.ROUND
      )
    );
    
    if (vatReturn.netVatDue !== calculatedNetVatDue) {
      errors.push({
        field: 'netVatDue',
        message: `netVatDue (${vatReturn.netVatDue}) must equal max(0, totalVatDue (${vatReturn.totalVatDue}) - vatReclaimedCurrPeriod (${vatReturn.vatReclaimedCurrPeriod})) = ${calculatedNetVatDue}`,
        code: 'INCONSISTENT_NET'
      });
    }
    
    // Check period key format
    const periodKeyPattern = /^\d{2}[A-Z]\d{1}$/;
    if (!periodKeyPattern.test(vatReturn.periodKey)) {
      errors.push({
        field: 'periodKey',
        message: `periodKey (${vatReturn.periodKey}) must be in the format YYxx where YY is the year and xx is the period code (e.g., 23C4)`,
        code: 'INVALID_PERIOD_KEY'
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
