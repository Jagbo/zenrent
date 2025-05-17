/**
 * Validation Service Tests
 * 
 * This file contains tests for the HMRC validation service.
 */

import { HmrcValidationService } from '../validationService';
import { 
  VatReturnPayload, 
  PropertyIncomePayload,
  SelfAssessmentPayload,
  FinancialData
} from '../../transformers/types';

describe('HmrcValidationService', () => {
  let validationService: HmrcValidationService;
  
  beforeEach(() => {
    validationService = new HmrcValidationService();
  });
  
  // Sample financial data for testing
  const createSampleFinancialData = (): FinancialData => ({
    userId: 'test-user-id',
    startDate: '2025-04-06',
    endDate: '2026-04-05',
    transactions: [
      {
        id: 'transaction-1',
        userId: 'test-user-id',
        amount: 1000,
        description: 'Test transaction',
        category: 'sales',
        date: '2025-05-01',
        vatAmount: 200,
        vatRate: 20
      }
    ],
    properties: [
      {
        id: 'property-1',
        userId: 'test-user-id',
        address: '123 Test Street',
        postcode: 'TE1 1ST',
        propertyType: 'residential',
        isCommercial: false,
        isFurnished: true,
        isMainResidence: false
      }
    ],
    vatRegistered: true,
    vatNumber: '123456789',
    vatScheme: 'standard',
    accountingBasis: 'accrual'
  });
  
  // Test VAT validation
  describe('validateVatReturn', () => {
    // Valid VAT return
    const validVatReturn: VatReturnPayload = {
      periodKey: 'A001',
      vatDueSales: 1000,
      vatDueAcquisitions: 200,
      totalVatDue: 1200,
      vatReclaimedCurrPeriod: 300,
      netVatDue: 900,
      totalValueSalesExVAT: 5000,
      totalValuePurchasesExVAT: 1500,
      totalValueGoodsSuppliedExVAT: 0,
      totalAcquisitionsExVAT: 1000,
      finalised: true
    };
    
    // Invalid VAT return
    const invalidVatReturn: VatReturnPayload = {
      periodKey: 'A001',
      vatDueSales: 1000,
      vatDueAcquisitions: 200,
      totalVatDue: 1500, // Should be 1200
      vatReclaimedCurrPeriod: 300,
      netVatDue: 1200, // Should be 900
      totalValueSalesExVAT: 5000,
      totalValuePurchasesExVAT: 1500,
      totalValueGoodsSuppliedExVAT: 0,
      totalAcquisitionsExVAT: 1000,
      finalised: false // Should be true
    };
    
    test('should validate a valid VAT return', () => {
      const result = validationService.validateVatReturn(validVatReturn);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should invalidate an invalid VAT return', () => {
      const result = validationService.validateVatReturn(invalidVatReturn);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check for specific errors
      expect(result.errors.some(e => e.field === 'totalVatDue')).toBe(true);
      expect(result.errors.some(e => e.field === 'netVatDue')).toBe(true);
      expect(result.errors.some(e => e.field === 'finalised')).toBe(true);
    });
    
    test('should provide cross-validation with financial data', () => {
      const financialData = createSampleFinancialData();
      financialData.vatScheme = 'flat rate';
      financialData.vatFlatRate = 15;
      
      const result = validationService.validateVatReturn(validVatReturn, financialData);
      
      // Should pass validation but have warnings for flat rate scheme
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some(w => w.code === 'FLAT_RATE_CALCULATION_CHECK')).toBe(true);
    });
  });
  
  // Test Property Income validation
  describe('validatePropertyIncome', () => {
    // Valid property income payload
    const validPropertyIncome: PropertyIncomePayload = {
      fromDate: '2025-04-06',
      toDate: '2026-04-05',
      ukProperties: {
        totalIncome: 12000,
        totalExpenses: 5000,
        netProfit: 7000,
        netLoss: 0,
        properties: [
          {
            propertyId: 'property-1',
            income: {
              rentIncome: 12000,
              premiumsOfLeaseGrant: 0,
              reversePremiums: 0,
              otherPropertyIncome: 0
            },
            expenses: {
              premisesRunningCosts: 2000,
              repairsAndMaintenance: 1500,
              financialCosts: 500,
              professionalFees: 500,
              costOfServices: 300,
              other: 200
            },
            allowances: {
              annualInvestmentAllowance: 0,
              businessPremisesRenovationAllowance: 0,
              otherCapitalAllowance: 0,
              wearAndTearAllowance: 0,
              propertyAllowance: 0
            }
          }
        ]
      },
      // These properties are part of the test data but not in the type
      // We'll use type assertion to avoid lint errors
    } as PropertyIncomePayload & {
      annualInvestmentAllowance: number;
      businessPremisesRenovationAllowance: number;
      otherCapitalAllowance: number;
      wearAndTearAllowance: number;
      propertyAllowance: number;
    };
    
    // Invalid property income payload
    const invalidPropertyIncome: PropertyIncomePayload = {
      fromDate: '2025-04-06',
      toDate: '2026-04-05',
      ukProperties: {
        totalIncome: 12000,
        totalExpenses: 5000,
        netProfit: 5000, // Should be 7000
        netLoss: 0,
        properties: [
          {
            propertyId: 'property-1',
            income: {
              rentIncome: 12000,
              premiumsOfLeaseGrant: 0,
              reversePremiums: 0,
              otherPropertyIncome: 0
            },
            expenses: {
              premisesRunningCosts: 2000,
              repairsAndMaintenance: 1500,
              financialCosts: 500,
              professionalFees: 500,
              costOfServices: 300,
              other: 200
            },
            allowances: {
              annualInvestmentAllowance: -100, // Should not be negative
              businessPremisesRenovationAllowance: 0,
              otherCapitalAllowance: 0,
              wearAndTearAllowance: 0,
              propertyAllowance: 0
            }
          }
        ]
      },
      // These properties are part of the test data but not in the type
      // We'll use type assertion to avoid lint errors
    } as PropertyIncomePayload & {
      annualInvestmentAllowance: number;
      businessPremisesRenovationAllowance: number;
      otherCapitalAllowance: number;
      wearAndTearAllowance: number;
      propertyAllowance: number;
    };
    
    test('should validate a valid property income payload', () => {
      const result = validationService.validatePropertyIncome(validPropertyIncome);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should invalidate an invalid property income payload', () => {
      const result = validationService.validatePropertyIncome(invalidPropertyIncome);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check for specific errors
      expect(result.errors.some(e => e.field === 'ukProperties.netProfit')).toBe(true);
      expect(result.errors.some(e => e.field.includes('annualInvestmentAllowance'))).toBe(true);
    });
    
    test('should provide warnings for property income considerations', () => {
      const financialData = createSampleFinancialData();
      financialData.properties![0].isMainResidence = true;
      
      const result = validationService.validatePropertyIncome(validPropertyIncome, financialData);
      
      // Should pass validation but have warnings for rent a room relief
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some(w => w.code === 'RENT_A_ROOM_RELIEF_REMINDER')).toBe(true);
    });
  });
  
  // Test Self Assessment validation
  describe('validateSelfAssessment', () => {
    // Valid self assessment payload
    const validSelfAssessment: SelfAssessmentPayload = {
      taxYear: '2025-26',
      income: {
        employment: [
          {
            employerName: 'Test Employer',
            employerReference: '123/AB456',
            payrollId: '12345',
            startDate: '2025-04-06',
            cessationDate: '2026-04-05',
            taxablePayToDate: 30000,
            totalTaxToDate: 6000,
            paymentMethod: 'PAYE'
          }
        ],
        selfEmployment: [
          {
            businessId: 'business-1',
            businessName: 'Test Business',
            businessDescription: 'Test Description',
            commencementDate: '2025-04-06',
            accountingPeriodStartDate: '2025-04-06',
            accountingPeriodEndDate: '2026-04-05',
            income: 20000,
            expenses: {
              materials: 5000,
              office: 2000,
              travel: 1000,
              other: 2000
            },
            additions: {},
            deductions: {}
          }
        ],
        dividends: {
          ukDividends: 5000,
          otherUkDividends: 0
        },
        savings: {
          ukInterest: 1000,
          foreignInterest: 0
        }
      },
      deductions: {
        giftAid: {
          giftAidPayments: 500,
          giftAidTreatedAsPaidInPreviousTaxYear: 0,
          giftAidTreatedAsPaidInCurrentTaxYear: 0
        },
        pensionContributions: {
          pensionSchemeOverseasTransfers: 0,
          pensionContributionsAmount: 2000
        }
      }
    };
    
    // Invalid self assessment payload
    const invalidSelfAssessment: SelfAssessmentPayload = {
      taxYear: '2025/26', // Invalid format
      income: {
        employment: [
          {
            employerName: '', // Missing employer name
            employerReference: '123/AB456',
            payrollId: '12345',
            startDate: '2025-04-06',
            cessationDate: '2026-04-05',
            taxablePayToDate: 30000,
            totalTaxToDate: 6000,
            paymentMethod: 'PAYE'
          }
        ],
        selfEmployment: [
          {
            businessId: 'business-1',
            businessName: 'Test Business',
            businessDescription: 'Test Description',
            commencementDate: '2025-04-06',
            accountingPeriodStartDate: '2025-04-06',
            accountingPeriodEndDate: '2026-04-05',
            income: -1000, // Negative income
            expenses: {
              materials: 5000,
              office: 2000,
              travel: 1000,
              other: 2000
            },
            additions: {},
            deductions: {}
          }
        ],
        dividends: {
          ukDividends: 5000,
          otherUkDividends: 0
        }
      }
    };
    
    test('should validate a valid self assessment payload', () => {
      const result = validationService.validateSelfAssessment(validSelfAssessment);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should invalidate an invalid self assessment payload', () => {
      const result = validationService.validateSelfAssessment(invalidSelfAssessment);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Check for specific errors
      expect(result.errors.some(e => e.field === 'taxYear')).toBe(true);
      expect(result.errors.some(e => e.field.includes('employerName'))).toBe(true);
      expect(result.errors.some(e => e.field.includes('income'))).toBe(true);
    });
    
    test('should provide warnings for high income considerations', () => {
      // Create a high income self assessment
      const highIncomeSelfAssessment = { ...validSelfAssessment };
      if (highIncomeSelfAssessment.income.employment) {
        highIncomeSelfAssessment.income.employment[0].taxablePayToDate = 120000;
      }
      
      const result = validationService.validateSelfAssessment(highIncomeSelfAssessment);
      
      // Should pass validation but have warnings for high income
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some(w => w.code === 'HIGH_INCOME_CHILD_BENEFIT_REMINDER')).toBe(true);
    });
  });
});
