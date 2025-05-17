/**
 * VAT Transformer Tests
 * 
 * This file contains tests for the VAT transformation logic.
 */

import { VatTransformer, VatCategory } from '../vatTransformer';
import { FinancialData, FinancialTransaction } from '../types';

describe('VatTransformer', () => {
  // Sample financial data for testing
  const createSampleFinancialData = (): FinancialData => ({
    userId: 'test-user-id',
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    transactions: [
      // Income with VAT
      {
        id: 'income-1',
        userId: 'test-user-id',
        amount: 1200, // £1000 + £200 VAT
        description: 'Rental income',
        category: 'rental_income',
        date: '2025-01-15',
        vatAmount: 200,
        vatRate: 20
      },
      // Expense with VAT
      {
        id: 'expense-1',
        userId: 'test-user-id',
        amount: 600, // £500 + £100 VAT
        description: 'Property maintenance',
        category: 'expense',
        date: '2025-02-10',
        vatAmount: 100,
        vatRate: 20
      },
      // Zero-rated income
      {
        id: 'income-2',
        userId: 'test-user-id',
        amount: 500,
        description: 'Zero-rated service',
        category: 'income',
        date: '2025-03-01',
        vatAmount: 0,
        vatRate: 0
      }
    ],
    vatRegistered: true,
    vatNumber: 'GB123456789',
    accountingBasis: 'accrual'
  });

  // Test basic transformation
  test('transforms financial data to VAT return format', () => {
    const transformer = new VatTransformer();
    const financialData = createSampleFinancialData();
    
    const result = transformer.transform(financialData);
    
    // Check that transformation was successful
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    
    // Check VAT return values
    expect(result.data.periodKey).toBe('25C1'); // 2025 Q1
    expect(result.data.vatDueSales).toBe(200); // VAT on income
    expect(result.data.vatDueAcquisitions).toBe(0); // No EC acquisitions
    expect(result.data.totalVatDue).toBe(200); // Total VAT due
    expect(result.data.vatReclaimedCurrPeriod).toBe(100); // VAT on expenses
    expect(result.data.netVatDue).toBe(100); // Net VAT due
    expect(result.data.totalValueSalesExVAT).toBe(1500); // Total sales ex VAT
    expect(result.data.totalValuePurchasesExVAT).toBe(500); // Total purchases ex VAT
    expect(result.data.totalValueGoodsSuppliedExVAT).toBe(0); // No EC supplies
    expect(result.data.totalAcquisitionsExVAT).toBe(0); // No EC acquisitions
  });

  // Test with EC acquisitions and supplies
  test('handles EC acquisitions and supplies correctly', () => {
    const transformer = new VatTransformer();
    const financialData = createSampleFinancialData();
    
    // Add EC transactions
    financialData.transactions.push(
      {
        id: 'ec-acquisition-1',
        userId: 'test-user-id',
        amount: 1200, // £1000 + £200 VAT
        description: 'EC acquisition',
        category: 'expense',
        date: '2025-02-15',
        vatAmount: 200,
        vatRate: 20,
        metadata: { vatCategory: VatCategory.EC_ACQUISITIONS }
      },
      {
        id: 'ec-supply-1',
        userId: 'test-user-id',
        amount: 2400, // £2000 + £400 VAT
        description: 'EC supply',
        category: 'income',
        date: '2025-03-15',
        vatAmount: 400,
        vatRate: 20,
        metadata: { vatCategory: VatCategory.EC_SUPPLIES }
      }
    );
    
    const result = transformer.transform(financialData);
    
    // Check EC-specific fields
    expect(result.data.vatDueAcquisitions).toBe(200); // VAT on EC acquisitions
    expect(result.data.totalVatDue).toBe(400); // Total VAT due (200 + 200)
    expect(result.data.totalValueGoodsSuppliedExVAT).toBe(2000); // EC supplies ex VAT
    expect(result.data.totalAcquisitionsExVAT).toBe(1000); // EC acquisitions ex VAT
  });

  // Test validation errors
  test('detects validation errors', () => {
    const transformer = new VatTransformer();
    const financialData = createSampleFinancialData();
    
    // Modify a transaction to create an inconsistency
    financialData.transactions[0].vatAmount = -200; // Negative VAT amount
    
    const result = transformer.transform(financialData);
    
    // Check that validation failed
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    
    // Check for specific error
    expect(result.errors.some(e => e.code === 'NEGATIVE_VALUE')).toBe(true);
  });

  // Test period key calculation
  test('calculates period key correctly for different periods', () => {
    const transformer = new VatTransformer();
    
    // Quarterly (Q1)
    let financialData = createSampleFinancialData();
    financialData.startDate = '2025-01-01';
    financialData.endDate = '2025-03-31';
    let result = transformer.transform(financialData);
    expect(result.data.periodKey).toBe('25C1');
    
    // Quarterly (Q2)
    financialData = createSampleFinancialData();
    financialData.startDate = '2025-04-01';
    financialData.endDate = '2025-06-30';
    result = transformer.transform(financialData);
    expect(result.data.periodKey).toBe('25C2');
    
    // Monthly
    financialData = createSampleFinancialData();
    financialData.startDate = '2025-05-01';
    financialData.endDate = '2025-05-31';
    result = transformer.transform(financialData);
    expect(result.data.periodKey).toBe('25M5');
  });

  // Test rounding
  test('applies correct rounding', () => {
    const transformer = new VatTransformer({ roundingPrecision: 2 });
    const financialData = createSampleFinancialData();
    
    // Add transaction with fractional VAT
    financialData.transactions.push({
      id: 'fractional-1',
      userId: 'test-user-id',
      amount: 119.99, // £99.99 + £20.00 VAT
      description: 'Item with fractional amount',
      category: 'expense',
      date: '2025-02-20',
      vatAmount: 20.00,
      vatRate: 20
    });
    
    const result = transformer.transform(financialData);
    
    // Check rounding
    expect(result.data.vatReclaimedCurrPeriod).toBe(120); // 100 + 20 = 120
    expect(result.data.totalValuePurchasesExVAT).toBe(599.99); // 500 + 99.99 = 599.99
  });

  // Test error handling
  test('handles errors gracefully', () => {
    const transformer = new VatTransformer();
    
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
