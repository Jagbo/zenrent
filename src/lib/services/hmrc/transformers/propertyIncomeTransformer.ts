/**
 * Property Income Transformation Logic
 * 
 * This module transforms ZenRent financial data into HMRC-compliant property income format.
 * It handles the calculation of rental income and expenses based on transaction data
 * and applies appropriate categorization and validation rules.
 */

import { 
  FinancialData, 
  FinancialTransaction,
  PropertyDetails,
  PropertyIncomePayload,
  TransformationOptions, 
  TransformationResult, 
  ValidationResult
} from './types';
import { formatDate, groupByCategory, sumField } from './utils';
import {
  CurrencyCode,
  RoundingMethod,
  roundCurrency,
  addCurrency,
  subtractCurrency,
  multiplyCurrency,
  sumCurrency,
  formatForHmrcSubmission
} from '../utils/currencyUtils';

/**
 * Property Income Categories for classifying transactions
 */
export enum PropertyIncomeCategory {
  // Income categories
  RENT_INCOME = 'rent_income',
  PREMIUMS_OF_LEASE_GRANT = 'premiums_of_lease_grant',
  REVERSE_PREMIUMS = 'reverse_premiums',
  OTHER_INCOME = 'other_income',
  
  // Expense categories
  PREMISES_RUNNING_COSTS = 'premises_running_costs',
  REPAIRS_AND_MAINTENANCE = 'repairs_and_maintenance',
  FINANCIAL_COSTS = 'financial_costs',
  PROFESSIONAL_FEES = 'professional_fees',
  COST_OF_SERVICES = 'cost_of_services',
  OTHER_EXPENSES = 'other_expenses',
  
  // Allowance categories
  ANNUAL_INVESTMENT_ALLOWANCE = 'annual_investment_allowance',
  BUSINESS_PREMISES_RENOVATION = 'business_premises_renovation',
  OTHER_CAPITAL_ALLOWANCE = 'other_capital_allowance',
  WEAR_AND_TEAR_ALLOWANCE = 'wear_and_tear_allowance',
  PROPERTY_ALLOWANCE = 'property_allowance'
}

/**
 * Property Transaction with categorization
 */
interface PropertyTransaction extends FinancialTransaction {
  propertyIncomeCategory?: PropertyIncomeCategory;
  isIncome: boolean;
  isExpense: boolean;
  isAllowance: boolean;
}

/**
 * Property Income Transformer Class
 * Handles transformation of financial data to property income format
 */
export class PropertyIncomeTransformer {
  /**
   * Helper method to get the currency code from options
   * This ensures consistent handling of currency code throughout the transformer
   */
  private getCurrencyCode(): CurrencyCode {
    // Handle both string and CurrencyCode enum types
    if (typeof this.options.currencyCode === 'string') {
      // Convert string to enum if possible
      const currencyCode = this.options.currencyCode as unknown as CurrencyCode;
      return currencyCode || CurrencyCode.GBP;
    }
    return this.options.currencyCode || CurrencyCode.GBP;
  }

  private convertCurrencyCode(currencyCode: string | CurrencyCode): CurrencyCode {
    if (typeof currencyCode === 'string') {
      return currencyCode as unknown as CurrencyCode || CurrencyCode.GBP;
    }
    return currencyCode || CurrencyCode.GBP;
  }

  private options: TransformationOptions;

  constructor(options: TransformationOptions = {}) {
    this.options = {
      roundingPrecision: 2,
      validateOutput: true,
      includeNonMandatoryFields: true,
      currencyCode: CurrencyCode.GBP,
      debug: false,
      ...options
    };
  }

  /**
   * Transform financial data to property income format
   */
  public transform(financialData: FinancialData): TransformationResult<PropertyIncomePayload> {
    try {
      // Categorize transactions
      const transactions = this.categorizeTransactions(financialData);
      
      // Group transactions by property
      const propertiesTransactions = this.groupTransactionsByProperty(transactions, financialData.properties || []);
      
      // Calculate property income values
      const propertyIncome: PropertyIncomePayload = {
        fromDate: financialData.startDate,
        toDate: financialData.endDate,
        ukProperties: {
          totalIncome: 0, // Will be calculated below
          totalExpenses: 0, // Will be calculated below
          netProfit: 0, // Will be calculated below
          netLoss: 0, // Will be calculated below
          properties: []
        }
      };
      
      // Process each property
      for (const propertyId in propertiesTransactions) {
        const propertyTransactions = propertiesTransactions[propertyId];
        const propertyDetails = financialData.properties?.find(p => p.id === propertyId);
        
        if (!propertyDetails) {
          continue; // Skip if property details not found
        }
        
        // Calculate income for this property
        const incomeTransactions = propertyTransactions.filter(t => t.isIncome);
        const rentIncome = this.calculateIncomeByCategory(incomeTransactions, PropertyIncomeCategory.RENT_INCOME);
        const premiumsOfLeaseGrant = this.calculateIncomeByCategory(incomeTransactions, PropertyIncomeCategory.PREMIUMS_OF_LEASE_GRANT);
        const reversePremiums = this.calculateIncomeByCategory(incomeTransactions, PropertyIncomeCategory.REVERSE_PREMIUMS);
        const otherPropertyIncome = this.calculateIncomeByCategory(incomeTransactions, PropertyIncomeCategory.OTHER_INCOME);
        
        // Calculate expenses for this property
        const expenseTransactions = propertyTransactions.filter(t => t.isExpense);
        const premisesRunningCosts = this.calculateExpenseByCategory(expenseTransactions, PropertyIncomeCategory.PREMISES_RUNNING_COSTS);
        const repairsAndMaintenance = this.calculateExpenseByCategory(expenseTransactions, PropertyIncomeCategory.REPAIRS_AND_MAINTENANCE);
        const financialCosts = this.calculateExpenseByCategory(expenseTransactions, PropertyIncomeCategory.FINANCIAL_COSTS);
        const professionalFees = this.calculateExpenseByCategory(expenseTransactions, PropertyIncomeCategory.PROFESSIONAL_FEES);
        const costOfServices = this.calculateExpenseByCategory(expenseTransactions, PropertyIncomeCategory.COST_OF_SERVICES);
        const otherExpenses = this.calculateExpenseByCategory(expenseTransactions, PropertyIncomeCategory.OTHER_EXPENSES);
        
        // Calculate allowances for this property
        const allowanceTransactions = propertyTransactions.filter(t => t.isAllowance);
        const annualInvestmentAllowance = this.calculateAllowanceByCategory(allowanceTransactions, PropertyIncomeCategory.ANNUAL_INVESTMENT_ALLOWANCE);
        const businessPremisesRenovationAllowance = this.calculateAllowanceByCategory(allowanceTransactions, PropertyIncomeCategory.BUSINESS_PREMISES_RENOVATION);
        const otherCapitalAllowance = this.calculateAllowanceByCategory(allowanceTransactions, PropertyIncomeCategory.OTHER_CAPITAL_ALLOWANCE);
        const wearAndTearAllowance = this.calculateAllowanceByCategory(allowanceTransactions, PropertyIncomeCategory.WEAR_AND_TEAR_ALLOWANCE);
        const propertyAllowance = this.calculateAllowanceByCategory(allowanceTransactions, PropertyIncomeCategory.PROPERTY_ALLOWANCE);
        
        // Calculate total income for this property
        const totalPropertyIncome = sumCurrency(
          [rentIncome, premiumsOfLeaseGrant, reversePremiums, otherPropertyIncome],
          this.getCurrencyCode(),
          RoundingMethod.ROUND
        );
        
        // Calculate total expenses for this property
        const totalPropertyExpenses = sumCurrency(
          [premisesRunningCosts, repairsAndMaintenance, financialCosts, professionalFees, costOfServices, otherExpenses],
          this.getCurrencyCode(),
          RoundingMethod.ROUND
        );
        
        // Calculate total allowances for this property
        const totalAllowances = sumCurrency(
          [annualInvestmentAllowance, businessPremisesRenovationAllowance, otherCapitalAllowance, wearAndTearAllowance, propertyAllowance],
          this.getCurrencyCode(),
          RoundingMethod.ROUND
        );
        
        // Calculate net profit or loss for this property
        const netAmount = subtractCurrency(
          totalPropertyIncome,
          addCurrency(totalPropertyExpenses, totalAllowances, this.getCurrencyCode(), RoundingMethod.ROUND),
          this.getCurrencyCode(),
          RoundingMethod.ROUND
        );
        
        // Add property to the payload
        propertyIncome.ukProperties.properties.push({
          propertyId,
          income: {
            rentIncome,
            premiumsOfLeaseGrant,
            reversePremiums,
            otherPropertyIncome
          },
          expenses: {
            premisesRunningCosts,
            repairsAndMaintenance,
            financialCosts,
            professionalFees,
            costOfServices,
            other: otherExpenses
          },
          allowances: {
            annualInvestmentAllowance,
            businessPremisesRenovationAllowance,
            otherCapitalAllowance,
            wearAndTearAllowance,
            propertyAllowance
          }
        });
        
        // Add to overall totals
        propertyIncome.ukProperties.totalIncome = addCurrency(
          propertyIncome.ukProperties.totalIncome,
          totalPropertyIncome,
          this.getCurrencyCode(),
          RoundingMethod.ROUND
        );
        propertyIncome.ukProperties.totalExpenses = addCurrency(
          propertyIncome.ukProperties.totalExpenses,
          addCurrency(totalPropertyExpenses, totalAllowances, this.getCurrencyCode(), RoundingMethod.ROUND),
          this.getCurrencyCode(),
          RoundingMethod.ROUND
        );
      }
      
      // Calculate overall net profit or loss
      const overallNetAmount = subtractCurrency(
        propertyIncome.ukProperties.totalIncome,
        propertyIncome.ukProperties.totalExpenses,
        this.getCurrencyCode(),
        RoundingMethod.ROUND
      );
      
      // Calculate net profit or loss
      if (overallNetAmount > 0) {
        propertyIncome.ukProperties.netProfit = formatForHmrcSubmission(
          overallNetAmount,
          this.getCurrencyCode()
        );
        propertyIncome.ukProperties.netLoss = 0;
      } else {
        propertyIncome.ukProperties.netProfit = 0;
        propertyIncome.ukProperties.netLoss = formatForHmrcSubmission(
          Math.abs(overallNetAmount),
          this.getCurrencyCode()
        );
      }
      
      // Round all values
      propertyIncome.ukProperties.totalIncome = roundCurrency(
        propertyIncome.ukProperties.totalIncome, 
        this.getCurrencyCode()
      );
      propertyIncome.ukProperties.totalExpenses = roundCurrency(
        propertyIncome.ukProperties.totalExpenses, 
        this.getCurrencyCode()
      );
      
      // Validate the result if required
      let validationResult: ValidationResult = { valid: true, errors: [] };
      if (this.options.validateOutput) {
        validationResult = this.validatePropertyIncome(propertyIncome);
      }
      
      return {
        data: propertyIncome,
        valid: validationResult.valid,
        errors: validationResult.errors,
        metadata: {
          transactionCount: transactions.length,
          periodStart: financialData.startDate,
          periodEnd: financialData.endDate,
          propertyCount: propertyIncome.ukProperties.properties.length
        }
      };
    } catch (error) {
      return {
        data: {} as PropertyIncomePayload,
        valid: false,
        errors: [{
          field: 'general',
          message: `Error transforming property income data: ${error instanceof Error ? error.message : String(error)}`,
          code: 'TRANSFORMATION_ERROR'
        }]
      };
    }
  }

  /**
   * Categorize transactions for property income calculations
   */
  private categorizeTransactions(financialData: FinancialData): PropertyTransaction[] {
    return financialData.transactions.map(transaction => {
      // Determine if transaction is income, expense, or allowance
      const isIncome = ['income', 'revenue', 'rent', 'premium'].some(
        term => transaction.category.toLowerCase().includes(term)
      );
      
      const isExpense = ['expense', 'cost', 'fee', 'repair', 'maintenance', 'service'].some(
        term => transaction.category.toLowerCase().includes(term)
      );
      
      const isAllowance = ['allowance', 'capital', 'investment', 'wear', 'tear'].some(
        term => transaction.category.toLowerCase().includes(term)
      );
      
      // Determine property income category based on transaction data
      let propertyIncomeCategory: PropertyIncomeCategory | undefined;
      
      // Map transaction categories to property income categories
      if (isIncome) {
        if (transaction.category.toLowerCase().includes('rent')) {
          propertyIncomeCategory = PropertyIncomeCategory.RENT_INCOME;
        } else if (transaction.category.toLowerCase().includes('premium') && 
                  transaction.category.toLowerCase().includes('lease')) {
          propertyIncomeCategory = PropertyIncomeCategory.PREMIUMS_OF_LEASE_GRANT;
        } else if (transaction.category.toLowerCase().includes('reverse') && 
                  transaction.category.toLowerCase().includes('premium')) {
          propertyIncomeCategory = PropertyIncomeCategory.REVERSE_PREMIUMS;
        } else {
          propertyIncomeCategory = PropertyIncomeCategory.OTHER_INCOME;
        }
      } else if (isExpense) {
        if (transaction.category.toLowerCase().includes('running') || 
            transaction.category.toLowerCase().includes('utility') ||
            transaction.category.toLowerCase().includes('insurance')) {
          propertyIncomeCategory = PropertyIncomeCategory.PREMISES_RUNNING_COSTS;
        } else if (transaction.category.toLowerCase().includes('repair') || 
                  transaction.category.toLowerCase().includes('maintenance')) {
          propertyIncomeCategory = PropertyIncomeCategory.REPAIRS_AND_MAINTENANCE;
        } else if (transaction.category.toLowerCase().includes('financial') || 
                  transaction.category.toLowerCase().includes('interest') ||
                  transaction.category.toLowerCase().includes('mortgage')) {
          propertyIncomeCategory = PropertyIncomeCategory.FINANCIAL_COSTS;
        } else if (transaction.category.toLowerCase().includes('professional') || 
                  transaction.category.toLowerCase().includes('legal') ||
                  transaction.category.toLowerCase().includes('accountant')) {
          propertyIncomeCategory = PropertyIncomeCategory.PROFESSIONAL_FEES;
        } else if (transaction.category.toLowerCase().includes('service')) {
          propertyIncomeCategory = PropertyIncomeCategory.COST_OF_SERVICES;
        } else {
          propertyIncomeCategory = PropertyIncomeCategory.OTHER_EXPENSES;
        }
      } else if (isAllowance) {
        if (transaction.category.toLowerCase().includes('annual') && 
            transaction.category.toLowerCase().includes('investment')) {
          propertyIncomeCategory = PropertyIncomeCategory.ANNUAL_INVESTMENT_ALLOWANCE;
        } else if (transaction.category.toLowerCase().includes('business') && 
                  transaction.category.toLowerCase().includes('renovation')) {
          propertyIncomeCategory = PropertyIncomeCategory.BUSINESS_PREMISES_RENOVATION;
        } else if (transaction.category.toLowerCase().includes('wear') && 
                  transaction.category.toLowerCase().includes('tear')) {
          propertyIncomeCategory = PropertyIncomeCategory.WEAR_AND_TEAR_ALLOWANCE;
        } else if (transaction.category.toLowerCase().includes('property') && 
                  transaction.category.toLowerCase().includes('allowance')) {
          propertyIncomeCategory = PropertyIncomeCategory.PROPERTY_ALLOWANCE;
        } else {
          propertyIncomeCategory = PropertyIncomeCategory.OTHER_CAPITAL_ALLOWANCE;
        }
      }
      
      // Use metadata if available
      if (transaction.metadata?.propertyIncomeCategory) {
        propertyIncomeCategory = transaction.metadata.propertyIncomeCategory as PropertyIncomeCategory;
      }
      
      return {
        ...transaction,
        isIncome,
        isExpense,
        isAllowance,
        propertyIncomeCategory
      };
    });
  }

  /**
   * Group transactions by property
   */
  private groupTransactionsByProperty(
    transactions: PropertyTransaction[],
    properties: PropertyDetails[]
  ): Record<string, PropertyTransaction[]> {
    const result: Record<string, PropertyTransaction[]> = {};
    
    // Initialize with empty arrays for each property
    properties.forEach(property => {
      result[property.id] = [];
    });
    
    // Group transactions by property
    transactions.forEach(transaction => {
      if (transaction.propertyId) {
        if (!result[transaction.propertyId]) {
          result[transaction.propertyId] = [];
        }
        result[transaction.propertyId].push(transaction);
      } else {
        // For transactions without a propertyId, distribute equally among all properties
        // This is a simplification - in a real system, you might want a more sophisticated approach
        if (properties.length > 0) {
          const propertyId = properties[0].id;
          if (!result[propertyId]) {
            result[propertyId] = [];
          }
          result[propertyId].push(transaction);
        }
      }
    });
    
    return result;
  }

  /**
   * Calculate income for a specific category
   */
  private calculateIncomeByCategory(
    transactions: PropertyTransaction[],
    category: PropertyIncomeCategory
  ): number {
    const amount = transactions
      .filter(t => t.propertyIncomeCategory === category)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return roundCurrency(amount, this.getCurrencyCode());
  }

  /**
   * Calculate expense for a specific category
   */
  private calculateExpenseByCategory(
    transactions: PropertyTransaction[],
    category: PropertyIncomeCategory
  ): number {
    const amount = transactions
      .filter(t => t.propertyIncomeCategory === category)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return roundCurrency(amount, this.getCurrencyCode());
  }

  /**
   * Calculate allowance for a specific category
   */
  private calculateAllowanceByCategory(
    transactions: PropertyTransaction[],
    category: PropertyIncomeCategory
  ): number {
    const amount = transactions
      .filter(t => t.propertyIncomeCategory === category)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return roundCurrency(amount, this.getCurrencyCode());
  }

  /**
   * Validate property income against HMRC rules
   */
  private validatePropertyIncome(propertyIncome: PropertyIncomePayload): ValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    
    // Check that fromDate and toDate are valid
    if (!propertyIncome.fromDate) {
      errors.push({
        field: 'fromDate',
        message: 'fromDate is required',
        code: 'MISSING_FIELD'
      });
    }
    
    if (!propertyIncome.toDate) {
      errors.push({
        field: 'toDate',
        message: 'toDate is required',
        code: 'MISSING_FIELD'
      });
    }
    
    // Check that fromDate is before toDate
    if (propertyIncome.fromDate && propertyIncome.toDate) {
      const fromDate = new Date(propertyIncome.fromDate);
      const toDate = new Date(propertyIncome.toDate);
      
      if (fromDate > toDate) {
        errors.push({
          field: 'dateRange',
          message: 'fromDate must be before toDate',
          code: 'INVALID_DATE_RANGE'
        });
      }
    }
    
    // Check that at least one property is included
    if (!propertyIncome.ukProperties || !propertyIncome.ukProperties.properties || propertyIncome.ukProperties.properties.length === 0) {
      errors.push({
        field: 'ukProperties.properties',
        message: 'At least one property must be included',
        code: 'MISSING_PROPERTIES'
      });
    }
    
    // Check that totalIncome and totalExpenses are consistent with property values
    if (propertyIncome.ukProperties && propertyIncome.ukProperties.properties) {
      const calculatedTotalIncome = propertyIncome.ukProperties.properties.reduce((sum, property) => {
        return sum + property.income.rentIncome + 
               property.income.premiumsOfLeaseGrant + 
               property.income.reversePremiums + 
               property.income.otherPropertyIncome;
      }, 0);
      
      const calculatedTotalExpenses = propertyIncome.ukProperties.properties.reduce((sum, property) => {
        return sum + property.expenses.premisesRunningCosts + 
               property.expenses.repairsAndMaintenance + 
               property.expenses.financialCosts + 
               property.expenses.professionalFees + 
               property.expenses.costOfServices + 
               property.expenses.other +
               property.allowances.annualInvestmentAllowance +
               property.allowances.businessPremisesRenovationAllowance +
               property.allowances.otherCapitalAllowance +
               property.allowances.wearAndTearAllowance +
               property.allowances.propertyAllowance;
      }, 0);
      
      const roundedCalculatedTotalIncome = formatForHmrcSubmission(
        calculatedTotalIncome,
        this.getCurrencyCode()
      );
      const roundedCalculatedTotalExpenses = formatForHmrcSubmission(
        calculatedTotalExpenses,
        this.getCurrencyCode()
      );
      
      if (propertyIncome.ukProperties.totalIncome !== roundedCalculatedTotalIncome) {
        errors.push({
          field: 'ukProperties.totalIncome',
          message: `totalIncome (${propertyIncome.ukProperties.totalIncome}) must equal the sum of all property incomes (${roundedCalculatedTotalIncome})`,
          code: 'INCONSISTENT_TOTAL_INCOME'
        });
      }
      
      if (propertyIncome.ukProperties.totalExpenses !== roundedCalculatedTotalExpenses) {
        errors.push({
          field: 'ukProperties.totalExpenses',
          message: `totalExpenses (${propertyIncome.ukProperties.totalExpenses}) must equal the sum of all property expenses and allowances (${roundedCalculatedTotalExpenses})`,
          code: 'INCONSISTENT_TOTAL_EXPENSES'
        });
      }
      
      // Check that netProfit and netLoss are consistent
      const netAmount = subtractCurrency(
        roundedCalculatedTotalIncome,
        roundedCalculatedTotalExpenses,
        this.getCurrencyCode(),
        RoundingMethod.ROUND
      );
      
      if (netAmount > 0) {
        if (propertyIncome.ukProperties.netProfit !== formatForHmrcSubmission(netAmount, this.getCurrencyCode()) || 
            propertyIncome.ukProperties.netLoss !== 0) {
          errors.push({
            field: 'ukProperties.netProfit',
            message: `When totalIncome (${roundedCalculatedTotalIncome}) > totalExpenses (${roundedCalculatedTotalExpenses}), netProfit must equal the difference (${formatForHmrcSubmission(netAmount, this.getCurrencyCode())}) and netLoss must be 0`,
            code: 'INCONSISTENT_NET_PROFIT'
          });
        }
      } else {
        if (propertyIncome.ukProperties.netLoss !== formatForHmrcSubmission(Math.abs(netAmount), this.getCurrencyCode()) || 
            propertyIncome.ukProperties.netProfit !== 0) {
          errors.push({
            field: 'ukProperties.netLoss',
            message: `When totalIncome (${roundedCalculatedTotalIncome}) < totalExpenses (${roundedCalculatedTotalExpenses}), netLoss must equal the absolute difference (${formatForHmrcSubmission(Math.abs(netAmount), this.getCurrencyCode())}) and netProfit must be 0`,
            code: 'INCONSISTENT_NET_LOSS'
          });
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
