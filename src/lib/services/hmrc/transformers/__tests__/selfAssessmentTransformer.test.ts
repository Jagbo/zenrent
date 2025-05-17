/**
 * Self Assessment Transformer Tests
 * 
 * This file contains tests for the self assessment transformation framework.
 */

import { SelfAssessmentTransformer, SelfAssessmentIncomeType, SelfAssessmentDeductionType } from '../selfAssessmentTransformer';
import { FinancialData, PropertyDetails } from '../types';

describe('SelfAssessmentTransformer', () => {
  // Sample property details for testing
  const sampleProperties: PropertyDetails[] = [
    {
      id: 'property-1',
      userId: 'test-user-id',
      address: '123 Main Street',
      postcode: 'SW1A 1AA',
      propertyType: 'residential',
      isCommercial: false,
      isFurnished: true,
      isMainResidence: false,
      purchaseDate: '2020-01-15',
      purchasePrice: 250000,
      currentValue: 300000,
      rentalStartDate: '2020-03-01'
    }
  ];

  // Sample financial data for testing
  const createSampleFinancialData = (): FinancialData => ({
    userId: 'test-user-id',
    startDate: '2025-04-06',
    endDate: '2026-04-05',
    transactions: [
      // Rental income
      {
        id: 'rent-1',
        userId: 'test-user-id',
        amount: 12000,
        description: 'Annual rent',
        category: 'rental_income',
        date: '2025-06-15',
        propertyId: 'property-1'
      },
      // Property expense
      {
        id: 'expense-1',
        userId: 'test-user-id',
        amount: 2000,
        description: 'Property maintenance',
        category: 'repairs_and_maintenance',
        date: '2025-07-10',
        propertyId: 'property-1'
      },
      // Employment income
      {
        id: 'salary-1',
        userId: 'test-user-id',
        amount: 36000,
        description: 'Annual salary',
        category: 'employment_income',
        date: '2025-05-15',
        metadata: {
          employerName: 'ACME Corporation',
          employerReference: '123/AB456',
          taxDeducted: 7200
        }
      },
      // Self-employment income
      {
        id: 'freelance-1',
        userId: 'test-user-id',
        amount: 15000,
        description: 'Freelance work',
        category: 'self_employment',
        date: '2025-08-20',
        metadata: {
          businessName: 'Web Development Services',
          businessDescription: 'Freelance web development',
          commencementDate: '2024-01-01',
          businessId: 'business-1'
        }
      },
      // Self-employment expense
      {
        id: 'freelance-expense-1',
        userId: 'test-user-id',
        amount: -3000,
        description: 'Office supplies',
        category: 'self_employment_expense',
        date: '2025-09-10',
        metadata: {
          businessId: 'business-1',
          expenseCategory: 'office_supplies'
        }
      },
      // Dividend income
      {
        id: 'dividend-1',
        userId: 'test-user-id',
        amount: 5000,
        description: 'Company dividends',
        category: 'dividend',
        date: '2025-10-15',
        metadata: {
          dividendType: 'uk',
          incomeType: SelfAssessmentIncomeType.DIVIDENDS
        }
      },
      // Savings income
      {
        id: 'interest-1',
        userId: 'test-user-id',
        amount: 1000,
        description: 'Bank interest',
        category: 'interest',
        date: '2025-11-20',
        metadata: {
          interestType: 'uk',
          incomeType: SelfAssessmentIncomeType.SAVINGS
        }
      },
      // Gift Aid payment
      {
        id: 'giftaid-1',
        userId: 'test-user-id',
        amount: -800,
        description: 'Charity donation',
        category: 'gift_aid',
        date: '2025-12-15',
        metadata: {
          deductionType: SelfAssessmentDeductionType.GIFT_AID
        }
      },
      // Pension contribution
      {
        id: 'pension-1',
        userId: 'test-user-id',
        amount: -2400,
        description: 'Pension contribution',
        category: 'pension',
        date: '2026-01-10',
        metadata: {
          deductionType: SelfAssessmentDeductionType.PENSION_CONTRIBUTIONS
        }
      }
    ],
    properties: sampleProperties
  });

  // Test basic transformation
  test('transforms financial data to self assessment format', () => {
    const transformer = new SelfAssessmentTransformer();
    const financialData = createSampleFinancialData();
    
    const result = transformer.transform(financialData);
    
    // Check that transformation was successful
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    
    // Check self assessment values
    expect(result.data.taxYear).toBe('2025-26');
    
    // Check income types are present
    expect(result.data.income.ukProperty).toBeDefined();
    expect(result.data.income.employment).toBeDefined();
    expect(result.data.income.selfEmployment).toBeDefined();
    expect(result.data.income.dividends).toBeDefined();
    expect(result.data.income.savings).toBeDefined();
    
    // Check deductions are present
    expect(result.data.deductions).toBeDefined();
    expect(result.data.deductions?.giftAid).toBeDefined();
    expect(result.data.deductions?.pensionContributions).toBeDefined();
    
    // Check employment details
    expect(result.data.income.employment).toHaveLength(1);
    const employment = result.data.income.employment?.[0];
    expect(employment?.employerName).toBe('ACME Corporation');
    expect(employment?.employerReference).toBe('123/AB456');
    expect(employment?.taxablePayToDate).toBe(36000);
    expect(employment?.totalTaxToDate).toBe(7200);
    
    // Check self employment details
    expect(result.data.income.selfEmployment).toHaveLength(1);
    const selfEmployment = result.data.income.selfEmployment?.[0];
    expect(selfEmployment?.businessName).toBe('Web Development Services');
    expect(selfEmployment?.businessDescription).toBe('Freelance web development');
    expect(selfEmployment?.income).toBe(15000);
    expect(selfEmployment?.expenses.office_supplies).toBe(3000);
    
    // Check dividend details
    expect(result.data.income.dividends?.ukDividends).toBe(5000);
    
    // Check savings details
    expect(result.data.income.savings?.ukInterest).toBe(1000);
    
    // Check gift aid details
    expect(result.data.deductions?.giftAid?.giftAidPayments).toBe(800);
    
    // Check pension details
    expect(result.data.deductions?.pensionContributions?.pensionContributionsAmount).toBe(2400);
  });

  // Test with missing property data
  test('handles missing property data gracefully', () => {
    const transformer = new SelfAssessmentTransformer();
    const financialData = createSampleFinancialData();
    
    // Remove properties
    financialData.properties = [];
    
    const result = transformer.transform(financialData);
    
    // Check that transformation was successful (even without property data)
    expect(result.valid).toBe(true);
    
    // Check that other income types are still present
    expect(result.data.income.employment).toBeDefined();
    expect(result.data.income.selfEmployment).toBeDefined();
    expect(result.data.income.dividends).toBeDefined();
    expect(result.data.income.savings).toBeDefined();
  });

  // Test with previous/next tax year gift aid
  test('handles gift aid for different tax years correctly', () => {
    const transformer = new SelfAssessmentTransformer();
    const financialData = createSampleFinancialData();
    
    // Add gift aid for previous and next tax years
    financialData.transactions.push(
      {
        id: 'giftaid-prev',
        userId: 'test-user-id',
        amount: -500,
        description: 'Charity donation (previous tax year)',
        category: 'gift_aid',
        date: '2025-04-10',
        metadata: {
          deductionType: SelfAssessmentDeductionType.GIFT_AID,
          previousTaxYear: true
        }
      },
      {
        id: 'giftaid-next',
        userId: 'test-user-id',
        amount: -300,
        description: 'Charity donation (next tax year)',
        category: 'gift_aid',
        date: '2026-04-01',
        metadata: {
          deductionType: SelfAssessmentDeductionType.GIFT_AID,
          nextTaxYear: true
        }
      }
    );
    
    const result = transformer.transform(financialData);
    
    // Check gift aid details
    expect(result.data.deductions?.giftAid?.giftAidPayments).toBe(800);
    expect(result.data.deductions?.giftAid?.giftAidTreatedAsPaidInPreviousTaxYear).toBe(500);
    expect(result.data.deductions?.giftAid?.giftAidTreatedAsPaidInCurrentTaxYear).toBe(300);
  });

  // Test validation errors
  test('detects validation errors', () => {
    const transformer = new SelfAssessmentTransformer();
    const financialData = createSampleFinancialData();
    
    // Remove all transactions to create validation errors
    financialData.transactions = [];
    
    const result = transformer.transform(financialData);
    
    // Check that validation failed
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    
    // Check for specific error
    expect(result.errors.some(e => e.code === 'MISSING_INCOME')).toBe(true);
  });

  // Test error handling
  test('handles errors gracefully', () => {
    const transformer = new SelfAssessmentTransformer();
    
    // Create invalid financial data (missing required fields)
    const invalidData = {
      userId: 'test-user-id',
      // Missing startDate and endDate
      transactions: []
    } as unknown as FinancialData;
    
    const result = transformer.transform(invalidData);
    
    // Check that transformation failed but didn't throw
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.data).toBeDefined();
  });
});
