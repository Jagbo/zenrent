/**
 * Property Income Transformer Tests
 * 
 * This file contains tests for the property income transformation logic.
 */

import { PropertyIncomeTransformer, PropertyIncomeCategory } from '../propertyIncomeTransformer';
import { FinancialData, PropertyDetails } from '../types';

describe('PropertyIncomeTransformer', () => {
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
    },
    {
      id: 'property-2',
      userId: 'test-user-id',
      address: '456 High Street',
      postcode: 'E1 6BT',
      propertyType: 'commercial',
      isCommercial: true,
      isFurnished: false,
      isMainResidence: false,
      purchaseDate: '2019-06-10',
      purchasePrice: 400000,
      currentValue: 450000,
      rentalStartDate: '2019-08-01'
    }
  ];

  // Sample financial data for testing
  const createSampleFinancialData = (): FinancialData => ({
    userId: 'test-user-id',
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    transactions: [
      // Rental income for property 1
      {
        id: 'income-1',
        userId: 'test-user-id',
        amount: 3000,
        description: 'Quarterly rent',
        category: 'rental_income',
        date: '2025-01-15',
        propertyId: 'property-1'
      },
      // Rental income for property 2
      {
        id: 'income-2',
        userId: 'test-user-id',
        amount: 5000,
        description: 'Quarterly rent',
        category: 'rental_income',
        date: '2025-01-15',
        propertyId: 'property-2'
      },
      // Repairs expense for property 1
      {
        id: 'expense-1',
        userId: 'test-user-id',
        amount: 500,
        description: 'Plumbing repairs',
        category: 'repairs_and_maintenance',
        date: '2025-02-10',
        propertyId: 'property-1'
      },
      // Running costs for property 2
      {
        id: 'expense-2',
        userId: 'test-user-id',
        amount: 800,
        description: 'Insurance',
        category: 'premises_running_costs',
        date: '2025-02-15',
        propertyId: 'property-2'
      },
      // Professional fees for property 1
      {
        id: 'expense-3',
        userId: 'test-user-id',
        amount: 300,
        description: 'Accountant fees',
        category: 'professional_fees',
        date: '2025-03-01',
        propertyId: 'property-1'
      },
      // Wear and tear allowance for property 1
      {
        id: 'allowance-1',
        userId: 'test-user-id',
        amount: 200,
        description: 'Furniture replacement',
        category: 'wear_and_tear_allowance',
        date: '2025-03-10',
        propertyId: 'property-1',
        metadata: {
          propertyIncomeCategory: PropertyIncomeCategory.WEAR_AND_TEAR_ALLOWANCE
        }
      }
    ],
    properties: sampleProperties,
    accountingBasis: 'accrual'
  });

  // Test basic transformation
  test('transforms financial data to property income format', () => {
    const transformer = new PropertyIncomeTransformer();
    const financialData = createSampleFinancialData();
    
    const result = transformer.transform(financialData);
    
    // Check that transformation was successful
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    
    // Check property income values
    expect(result.data.fromDate).toBe('2025-01-01');
    expect(result.data.toDate).toBe('2025-03-31');
    
    // Check UK properties
    expect(result.data.ukProperties).toBeDefined();
    expect(result.data.ukProperties.properties).toHaveLength(2);
    
    // Check totals
    expect(result.data.ukProperties.totalIncome).toBe(8000); // 3000 + 5000
    expect(result.data.ukProperties.totalExpenses).toBe(1800); // 500 + 800 + 300 + 200
    expect(result.data.ukProperties.netProfit).toBe(6200); // 8000 - 1800
    expect(result.data.ukProperties.netLoss).toBe(0);
    
    // Check property 1 details
    const property1 = result.data.ukProperties.properties.find(p => p.propertyId === 'property-1');
    expect(property1).toBeDefined();
    expect(property1?.income.rentIncome).toBe(3000);
    expect(property1?.expenses.repairsAndMaintenance).toBe(500);
    expect(property1?.expenses.professionalFees).toBe(300);
    expect(property1?.allowances.wearAndTearAllowance).toBe(200);
    
    // Check property 2 details
    const property2 = result.data.ukProperties.properties.find(p => p.propertyId === 'property-2');
    expect(property2).toBeDefined();
    expect(property2?.income.rentIncome).toBe(5000);
    expect(property2?.expenses.premisesRunningCosts).toBe(800);
  });

  // Test with a net loss scenario
  test('handles net loss correctly', () => {
    const transformer = new PropertyIncomeTransformer();
    const financialData = createSampleFinancialData();
    
    // Modify expenses to create a net loss
    financialData.transactions.push({
      id: 'large-expense',
      userId: 'test-user-id',
      amount: 10000,
      description: 'Major renovation',
      category: 'repairs_and_maintenance',
      date: '2025-03-15',
      propertyId: 'property-1'
    });
    
    const result = transformer.transform(financialData);
    
    // Check that transformation was successful
    expect(result.valid).toBe(true);
    
    // Check totals with net loss
    expect(result.data.ukProperties.totalIncome).toBe(8000); // 3000 + 5000
    expect(result.data.ukProperties.totalExpenses).toBe(11800); // 500 + 800 + 300 + 200 + 10000
    expect(result.data.ukProperties.netProfit).toBe(0);
    expect(result.data.ukProperties.netLoss).toBe(3800); // 11800 - 8000
  });

  // Test with additional income categories
  test('handles different income categories correctly', () => {
    const transformer = new PropertyIncomeTransformer();
    const financialData = createSampleFinancialData();
    
    // Add different income types
    financialData.transactions.push(
      {
        id: 'premium-income',
        userId: 'test-user-id',
        amount: 2000,
        description: 'Lease premium',
        category: 'income',
        date: '2025-02-01',
        propertyId: 'property-1',
        metadata: {
          propertyIncomeCategory: PropertyIncomeCategory.PREMIUMS_OF_LEASE_GRANT
        }
      },
      {
        id: 'reverse-premium',
        userId: 'test-user-id',
        amount: 1000,
        description: 'Reverse premium',
        category: 'income',
        date: '2025-02-15',
        propertyId: 'property-2',
        metadata: {
          propertyIncomeCategory: PropertyIncomeCategory.REVERSE_PREMIUMS
        }
      }
    );
    
    const result = transformer.transform(financialData);
    
    // Check property 1 income categories
    const property1 = result.data.ukProperties.properties.find(p => p.propertyId === 'property-1');
    expect(property1?.income.premiumsOfLeaseGrant).toBe(2000);
    
    // Check property 2 income categories
    const property2 = result.data.ukProperties.properties.find(p => p.propertyId === 'property-2');
    expect(property2?.income.reversePremiums).toBe(1000);
    
    // Check updated totals
    expect(result.data.ukProperties.totalIncome).toBe(11000); // 3000 + 5000 + 2000 + 1000
  });

  // Test validation errors
  test('detects validation errors', () => {
    const transformer = new PropertyIncomeTransformer();
    const financialData = createSampleFinancialData();
    
    // Create an inconsistency by modifying the date range
    financialData.startDate = '2025-04-01';
    financialData.endDate = '2025-01-01'; // End date before start date
    
    const result = transformer.transform(financialData);
    
    // Check that validation failed
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    
    // Check for specific error
    expect(result.errors.some(e => e.code === 'INVALID_DATE_RANGE')).toBe(true);
  });

  // Test with no properties
  test('handles missing properties gracefully', () => {
    const transformer = new PropertyIncomeTransformer();
    const financialData = createSampleFinancialData();
    
    // Remove properties
    financialData.properties = [];
    
    const result = transformer.transform(financialData);
    
    // Check that validation failed
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.code === 'MISSING_PROPERTIES')).toBe(true);
  });

  // Test error handling
  test('handles errors gracefully', () => {
    const transformer = new PropertyIncomeTransformer();
    
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
