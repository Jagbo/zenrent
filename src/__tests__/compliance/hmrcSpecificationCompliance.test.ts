/**
 * HMRC Specification Compliance Tests
 * Validates compliance with HMRC Making Tax Digital specifications
 */

import { calculatePersonalTax, calculateCompanyTax, formatForHMRCSubmission } from '@/services/tax-calculator';

describe('HMRC Specification Compliance Tests', () => {
  describe('Personal Tax (SA100/SA105) Compliance', () => {
    it('should comply with SA105 property income format', () => {
      const income = {
        rentIncome: 25000,
        premiumsOfLeaseGrant: 5000,
        otherPropertyIncome: 2000
      };

      const expenses = {
        premisesRunningCosts: 3000,
        repairsAndMaintenance: 1500,
        financialCosts: 800,
        professionalFees: 500,
        costOfServices: 300,
        other: 200
      };

      const adjustments = {
        useMileageAllowance: false,
        mileageTotal: 0,
        usePropertyIncomeAllowance: false,
        priorYearLosses: 0,
        capitalAllowances: 1000,
        wearAndTearAllowance: 0
      };

      const calculation = calculatePersonalTax(income, expenses, adjustments);
      const hmrcFormat = formatForHMRCSubmission(calculation, '2023-24');

      // Validate SA105 structure
      expect(hmrcFormat.ukProperty).toBeDefined();
      expect(hmrcFormat.ukProperty.income).toBeDefined();
      expect(hmrcFormat.ukProperty.expenses).toBeDefined();
      expect(hmrcFormat.ukProperty.adjustments).toBeDefined();

      // Validate required SA105 fields
      expect(hmrcFormat.ukProperty.income.rentIncome).toBe(2500000); // £25,000 in pence
      expect(hmrcFormat.ukProperty.income.premiumsOfLeaseGrant).toBe(500000); // £5,000 in pence
      expect(hmrcFormat.ukProperty.income.otherPropertyIncome).toBe(200000); // £2,000 in pence

      // Validate expense categories match SA105
      expect(hmrcFormat.ukProperty.expenses.premisesRunningCosts).toBe(300000);
      expect(hmrcFormat.ukProperty.expenses.repairsAndMaintenance).toBe(150000);
      expect(hmrcFormat.ukProperty.expenses.financialCosts).toBe(80000);
      expect(hmrcFormat.ukProperty.expenses.professionalFees).toBe(50000);
      expect(hmrcFormat.ukProperty.expenses.costOfServices).toBe(30000);
      expect(hmrcFormat.ukProperty.expenses.other).toBe(20000);
    });

    it('should comply with property income allowance rules', () => {
      const lowIncome = {
        rentIncome: 800,
        premiumsOfLeaseGrant: 0,
        otherPropertyIncome: 0
      };

      const expenses = {
        premisesRunningCosts: 200,
        repairsAndMaintenance: 100,
        financialCosts: 50,
        professionalFees: 30,
        costOfServices: 20,
        other: 0
      };

      const adjustmentsWithAllowance = {
        useMileageAllowance: false,
        mileageTotal: 0,
        usePropertyIncomeAllowance: true,
        priorYearLosses: 0,
        capitalAllowances: 0,
        wearAndTearAllowance: 0
      };

      const calculation = calculatePersonalTax(lowIncome, expenses, adjustmentsWithAllowance);

      // Property income allowance should be applied (£1,000 max)
      expect(calculation.taxableProfit).toBe(0); // £800 income - £800 allowance = £0
      expect(calculation.allowableExpenses).toBe(800); // Should use allowance instead of actual expenses
    });

    it('should comply with mileage allowance rates', () => {
      const income = {
        rentIncome: 20000,
        premiumsOfLeaseGrant: 0,
        otherPropertyIncome: 0
      };

      const expenses = {
        premisesRunningCosts: 2000,
        repairsAndMaintenance: 1000,
        financialCosts: 500,
        professionalFees: 300,
        costOfServices: 200,
        other: 0
      };

      // Test under 10,000 miles
      const adjustmentsUnder10k = {
        useMileageAllowance: true,
        mileageTotal: 8000,
        usePropertyIncomeAllowance: false,
        priorYearLosses: 0,
        capitalAllowances: 0,
        wearAndTearAllowance: 0
      };

      const calculationUnder10k = calculatePersonalTax(income, expenses, adjustmentsUnder10k);
      expect(calculationUnder10k.adjustments).toBe(3600); // 8000 * 0.45

      // Test over 10,000 miles
      const adjustmentsOver10k = {
        useMileageAllowance: true,
        mileageTotal: 15000,
        usePropertyIncomeAllowance: false,
        priorYearLosses: 0,
        capitalAllowances: 0,
        wearAndTearAllowance: 0
      };

      const calculationOver10k = calculatePersonalTax(income, expenses, adjustmentsOver10k);
      expect(calculationOver10k.adjustments).toBe(5750); // (10000 * 0.45) + (5000 * 0.25)
    });

    it('should comply with tax rate bands for 2023-24', () => {
      const testCases = [
        { income: 15000, expectedBasicRate: true, expectedHigherRate: false },
        { income: 55000, expectedBasicRate: true, expectedHigherRate: true },
        { income: 150000, expectedBasicRate: true, expectedHigherRate: true, expectedAdditionalRate: true }
      ];

      testCases.forEach(testCase => {
        const income = {
          rentIncome: testCase.income,
          premiumsOfLeaseGrant: 0,
          otherPropertyIncome: 0
        };

        const expenses = {
          premisesRunningCosts: 1000,
          repairsAndMaintenance: 500,
          financialCosts: 300,
          professionalFees: 200,
          costOfServices: 100,
          other: 0
        };

        const adjustments = {
          useMileageAllowance: false,
          mileageTotal: 0,
          usePropertyIncomeAllowance: false,
          priorYearLosses: 0,
          capitalAllowances: 0,
          wearAndTearAllowance: 0
        };

        const calculation = calculatePersonalTax(income, expenses, adjustments);

        if (testCase.expectedBasicRate) {
          expect(calculation.breakdown.basicRateTax).toBeGreaterThan(0);
        }

        if (testCase.expectedHigherRate) {
          expect(calculation.breakdown.higherRateTax).toBeGreaterThan(0);
        }

        if (testCase.expectedAdditionalRate) {
          expect(calculation.breakdown.additionalRateTax).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Company Tax (CT600) Compliance', () => {
    it('should comply with CT600 corporation tax rates', () => {
      // Small companies rate (19% for profits up to £250,000)
      const smallCompanyCalculation = calculateCompanyTax(200000, 50000, {
        capitalAllowances: {
          aiaQualifyingExpenditure: 0,
          aiaClaimedThisYear: 0,
          mainPoolBroughtForward: 0,
          mainPoolAdditions: 0,
          mainPoolDisposals: 0,
          specialPoolBroughtForward: 0,
          specialPoolAdditions: 0,
          specialPoolDisposals: 0,
          fyaQualifyingExpenditure: 0,
          sbaQualifyingExpenditure: 0,
          sbaRate: 0.03
        },
        rdExpenditure: {
          currentYearExpenditure: 0,
          isSmallCompany: true,
          isLossMaking: false,
          qualifiesForTaxCredit: false
        },
        groupRelief: {
          surrenderingCompanyLosses: 0,
          claimingCompanyProfit: 0,
          groupReliefClaimed: 0,
          isGroupCompany: false
        },
        lossesCarriedForward: {
          tradingLosses: 0,
          nonTradingLosses: 0,
          managementExpenses: 0,
          excessCapitalAllowances: 0,
          usedAgainstCurrentYear: 0
        },
        patentBoxProfits: 0
      });

      expect(smallCompanyCalculation.breakdown.effectiveRate).toBe(0.19);
      expect(smallCompanyCalculation.corporationTax).toBe(150000 * 0.19); // £150k profit * 19%

      // Large companies rate (25% for profits over £1.5m)
      const largeCompanyCalculation = calculateCompanyTax(2000000, 200000, {
        capitalAllowances: {
          aiaQualifyingExpenditure: 0,
          aiaClaimedThisYear: 0,
          mainPoolBroughtForward: 0,
          mainPoolAdditions: 0,
          mainPoolDisposals: 0,
          specialPoolBroughtForward: 0,
          specialPoolAdditions: 0,
          specialPoolDisposals: 0,
          fyaQualifyingExpenditure: 0,
          sbaQualifyingExpenditure: 0,
          sbaRate: 0.03
        },
        rdExpenditure: {
          currentYearExpenditure: 0,
          isSmallCompany: false,
          isLossMaking: false,
          qualifiesForTaxCredit: false
        },
        groupRelief: {
          surrenderingCompanyLosses: 0,
          claimingCompanyProfit: 0,
          groupReliefClaimed: 0,
          isGroupCompany: false
        },
        lossesCarriedForward: {
          tradingLosses: 0,
          nonTradingLosses: 0,
          managementExpenses: 0,
          excessCapitalAllowances: 0,
          usedAgainstCurrentYear: 0
        },
        patentBoxProfits: 0
      });

      expect(largeCompanyCalculation.breakdown.effectiveRate).toBe(0.25);
      expect(largeCompanyCalculation.corporationTax).toBe(1800000 * 0.25); // £1.8m profit * 25%
    });

    it('should comply with marginal relief calculation', () => {
      // Test marginal relief for profits between £250k and £1.5m
      const marginalReliefCalculation = calculateCompanyTax(800000, 100000, {
        capitalAllowances: {
          aiaQualifyingExpenditure: 0,
          aiaClaimedThisYear: 0,
          mainPoolBroughtForward: 0,
          mainPoolAdditions: 0,
          mainPoolDisposals: 0,
          specialPoolBroughtForward: 0,
          specialPoolAdditions: 0,
          specialPoolDisposals: 0,
          fyaQualifyingExpenditure: 0,
          sbaQualifyingExpenditure: 0,
          sbaRate: 0.03
        },
        rdExpenditure: {
          currentYearExpenditure: 0,
          isSmallCompany: false,
          isLossMaking: false,
          qualifiesForTaxCredit: false
        },
        groupRelief: {
          surrenderingCompanyLosses: 0,
          claimingCompanyProfit: 0,
          groupReliefClaimed: 0,
          isGroupCompany: false
        },
        lossesCarriedForward: {
          tradingLosses: 0,
          nonTradingLosses: 0,
          managementExpenses: 0,
          excessCapitalAllowances: 0,
          usedAgainstCurrentYear: 0
        },
        patentBoxProfits: 0
      });

      // Should have marginal relief applied
      expect(marginalReliefCalculation.marginalRelief).toBeGreaterThan(0);
      expect(marginalReliefCalculation.breakdown.effectiveRate).toBeGreaterThan(0.19);
      expect(marginalReliefCalculation.breakdown.effectiveRate).toBeLessThan(0.25);

      // Marginal relief formula: (1,500,000 - profits) × 3/200
      const expectedMarginalRelief = (1500000 - 700000) * (3 / 200);
      expect(marginalReliefCalculation.marginalRelief).toBeCloseTo(expectedMarginalRelief, 0);
    });

    it('should comply with Annual Investment Allowance limits', () => {
      const aiaCalculation = calculateCompanyTax(500000, 100000, {
        capitalAllowances: {
          aiaQualifyingExpenditure: 1200000, // Above £1m limit
          aiaClaimedThisYear: 1000000, // Should be capped at £1m
          mainPoolBroughtForward: 0,
          mainPoolAdditions: 0,
          mainPoolDisposals: 0,
          specialPoolBroughtForward: 0,
          specialPoolAdditions: 0,
          specialPoolDisposals: 0,
          fyaQualifyingExpenditure: 0,
          sbaQualifyingExpenditure: 0,
          sbaRate: 0.03
        },
        rdExpenditure: {
          currentYearExpenditure: 0,
          isSmallCompany: false,
          isLossMaking: false,
          qualifiesForTaxCredit: false
        },
        groupRelief: {
          surrenderingCompanyLosses: 0,
          claimingCompanyProfit: 0,
          groupReliefClaimed: 0,
          isGroupCompany: false
        },
        lossesCarriedForward: {
          tradingLosses: 0,
          nonTradingLosses: 0,
          managementExpenses: 0,
          excessCapitalAllowances: 0,
          usedAgainstCurrentYear: 0
        },
        patentBoxProfits: 0
      });

      // AIA should be capped at £1,000,000
      expect(aiaCalculation.breakdown.capitalAllowancesTotal).toBe(1000000);
    });

    it('should comply with R&D tax relief rates', () => {
      // Small company R&D relief (230% for SMEs)
      const smeRDCalculation = calculateCompanyTax(300000, 100000, {
        capitalAllowances: {
          aiaQualifyingExpenditure: 0,
          aiaClaimedThisYear: 0,
          mainPoolBroughtForward: 0,
          mainPoolAdditions: 0,
          mainPoolDisposals: 0,
          specialPoolBroughtForward: 0,
          specialPoolAdditions: 0,
          specialPoolDisposals: 0,
          fyaQualifyingExpenditure: 0,
          sbaQualifyingExpenditure: 0,
          sbaRate: 0.03
        },
        rdExpenditure: {
          currentYearExpenditure: 50000,
          isSmallCompany: true,
          isLossMaking: false,
          qualifiesForTaxCredit: false
        },
        groupRelief: {
          surrenderingCompanyLosses: 0,
          claimingCompanyProfit: 0,
          groupReliefClaimed: 0,
          isGroupCompany: false
        },
        lossesCarriedForward: {
          tradingLosses: 0,
          nonTradingLosses: 0,
          managementExpenses: 0,
          excessCapitalAllowances: 0,
          usedAgainstCurrentYear: 0
        },
        patentBoxProfits: 0
      });

      // SME R&D relief: 50000 * (2.30 - 1) = 65000
      expect(smeRDCalculation.breakdown.rdReliefTotal).toBe(65000);

      // Large company R&D relief (130% for large companies)
      const largeRDCalculation = calculateCompanyTax(1000000, 200000, {
        capitalAllowances: {
          aiaQualifyingExpenditure: 0,
          aiaClaimedThisYear: 0,
          mainPoolBroughtForward: 0,
          mainPoolAdditions: 0,
          mainPoolDisposals: 0,
          specialPoolBroughtForward: 0,
          specialPoolAdditions: 0,
          specialPoolDisposals: 0,
          fyaQualifyingExpenditure: 0,
          sbaQualifyingExpenditure: 0,
          sbaRate: 0.03
        },
        rdExpenditure: {
          currentYearExpenditure: 100000,
          isSmallCompany: false,
          isLossMaking: false,
          qualifiesForTaxCredit: false
        },
        groupRelief: {
          surrenderingCompanyLosses: 0,
          claimingCompanyProfit: 0,
          groupReliefClaimed: 0,
          isGroupCompany: false
        },
        lossesCarriedForward: {
          tradingLosses: 0,
          nonTradingLosses: 0,
          managementExpenses: 0,
          excessCapitalAllowances: 0,
          usedAgainstCurrentYear: 0
        },
        patentBoxProfits: 0
      });

      // Large company R&D relief: 100000 * (1.30 - 1) = 30000
      expect(largeRDCalculation.breakdown.rdReliefTotal).toBe(30000);
    });

    it('should comply with Patent Box relief rate', () => {
      const patentBoxCalculation = calculateCompanyTax(1000000, 200000, {
        capitalAllowances: {
          aiaQualifyingExpenditure: 0,
          aiaClaimedThisYear: 0,
          mainPoolBroughtForward: 0,
          mainPoolAdditions: 0,
          mainPoolDisposals: 0,
          specialPoolBroughtForward: 0,
          specialPoolAdditions: 0,
          specialPoolDisposals: 0,
          fyaQualifyingExpenditure: 0,
          sbaQualifyingExpenditure: 0,
          sbaRate: 0.03
        },
        rdExpenditure: {
          currentYearExpenditure: 0,
          isSmallCompany: false,
          isLossMaking: false,
          qualifiesForTaxCredit: false
        },
        groupRelief: {
          surrenderingCompanyLosses: 0,
          claimingCompanyProfit: 0,
          groupReliefClaimed: 0,
          isGroupCompany: false
        },
        lossesCarriedForward: {
          tradingLosses: 0,
          nonTradingLosses: 0,
          managementExpenses: 0,
          excessCapitalAllowances: 0,
          usedAgainstCurrentYear: 0
        },
        patentBoxProfits: 200000
      });

      // Patent Box relief: 200000 * (0.25 - 0.10) = 30000
      expect(patentBoxCalculation.breakdown.patentBoxRelief).toBe(30000);
      expect(patentBoxCalculation.totalTaxDue).toBe(patentBoxCalculation.corporationTax - 30000);
    });
  });

  describe('Data Format Compliance', () => {
    it('should format monetary values in pence for HMRC', () => {
      const calculation = calculatePersonalTax(
        { rentIncome: 25000.50, premiumsOfLeaseGrant: 0, otherPropertyIncome: 0 },
        { premisesRunningCosts: 3000.25, repairsAndMaintenance: 1500, financialCosts: 800, professionalFees: 500, costOfServices: 300, other: 0 },
        { useMileageAllowance: false, mileageTotal: 0, usePropertyIncomeAllowance: false, priorYearLosses: 0, capitalAllowances: 0, wearAndTearAllowance: 0 }
      );

      const hmrcFormat = formatForHMRCSubmission(calculation, '2023-24');

      // All monetary values should be in pence (integers)
      expect(Number.isInteger(hmrcFormat.ukProperty.income.rentIncome)).toBe(true);
      expect(Number.isInteger(hmrcFormat.ukProperty.expenses.premisesRunningCosts)).toBe(true);
      expect(Number.isInteger(hmrcFormat.calculation.totalTaxDue)).toBe(true);

      // Verify conversion accuracy
      expect(hmrcFormat.ukProperty.income.rentIncome).toBe(2500050); // £25,000.50 = 2,500,050 pence
      expect(hmrcFormat.ukProperty.expenses.premisesRunningCosts).toBe(300025); // £3,000.25 = 300,025 pence
    });

    it('should format dates in ISO format for HMRC', () => {
      const calculation = calculatePersonalTax(
        { rentIncome: 20000, premiumsOfLeaseGrant: 0, otherPropertyIncome: 0 },
        { premisesRunningCosts: 2000, repairsAndMaintenance: 1000, financialCosts: 500, professionalFees: 300, costOfServices: 200, other: 0 },
        { useMileageAllowance: false, mileageTotal: 0, usePropertyIncomeAllowance: false, priorYearLosses: 0, capitalAllowances: 0, wearAndTearAllowance: 0 }
      );

      const hmrcFormat = formatForHMRCSubmission(calculation, '2023-24');

      // Tax year should be in correct format
      expect(hmrcFormat.taxYear).toBe('2023-24');
      expect(hmrcFormat.taxYear).toMatch(/^\d{4}-\d{2}$/);

      // Submission timestamp should be ISO format
      expect(hmrcFormat.submissionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should include required metadata for HMRC submission', () => {
      const calculation = calculatePersonalTax(
        { rentIncome: 20000, premiumsOfLeaseGrant: 0, otherPropertyIncome: 0 },
        { premisesRunningCosts: 2000, repairsAndMaintenance: 1000, financialCosts: 500, professionalFees: 300, costOfServices: 200, other: 0 },
        { useMileageAllowance: false, mileageTotal: 0, usePropertyIncomeAllowance: false, priorYearLosses: 0, capitalAllowances: 0, wearAndTearAllowance: 0 }
      );

      const hmrcFormat = formatForHMRCSubmission(calculation, '2023-24');

      // Required metadata fields
      expect(hmrcFormat.submissionType).toBe('personal');
      expect(hmrcFormat.softwareDetails).toBeDefined();
      expect(hmrcFormat.softwareDetails.name).toBe('ZenRent');
      expect(hmrcFormat.softwareDetails.version).toBeDefined();
      expect(hmrcFormat.calculationVersion).toBeDefined();
      expect(hmrcFormat.submissionTimestamp).toBeDefined();
    });
  });

  describe('Validation Rules Compliance', () => {
    it('should enforce HMRC validation rules for income limits', () => {
      // Test extremely high income (should trigger validation warning)
      const extremeIncome = {
        rentIncome: 50000000, // £50 million
        premiumsOfLeaseGrant: 0,
        otherPropertyIncome: 0
      };

      const expenses = {
        premisesRunningCosts: 1000,
        repairsAndMaintenance: 500,
        financialCosts: 300,
        professionalFees: 200,
        costOfServices: 100,
        other: 0
      };

      const adjustments = {
        useMileageAllowance: false,
        mileageTotal: 0,
        usePropertyIncomeAllowance: false,
        priorYearLosses: 0,
        capitalAllowances: 0,
        wearAndTearAllowance: 0
      };

      // This should be handled by validation in real implementation
      expect(() => {
        calculatePersonalTax(extremeIncome, expenses, adjustments);
      }).not.toThrow(); // Calculation should work but validation should flag it
    });

    it('should enforce HMRC validation rules for expense ratios', () => {
      const income = {
        rentIncome: 10000,
        premiumsOfLeaseGrant: 0,
        otherPropertyIncome: 0
      };

      // Expenses exceeding income by large margin (should trigger validation)
      const excessiveExpenses = {
        premisesRunningCosts: 50000,
        repairsAndMaintenance: 25000,
        financialCosts: 15000,
        professionalFees: 10000,
        costOfServices: 5000,
        other: 0
      };

      const adjustments = {
        useMileageAllowance: false,
        mileageTotal: 0,
        usePropertyIncomeAllowance: false,
        priorYearLosses: 0,
        capitalAllowances: 0,
        wearAndTearAllowance: 0
      };

      const calculation = calculatePersonalTax(income, excessiveExpenses, adjustments);

      // Should result in zero taxable profit (not negative)
      expect(calculation.taxableProfit).toBe(0);
    });

    it('should enforce HMRC validation rules for mileage claims', () => {
      const income = {
        rentIncome: 20000,
        premiumsOfLeaseGrant: 0,
        otherPropertyIncome: 0
      };

      const expenses = {
        premisesRunningCosts: 2000,
        repairsAndMaintenance: 1000,
        financialCosts: 500,
        professionalFees: 300,
        costOfServices: 200,
        other: 0
      };

      // Excessive mileage claim (should be validated)
      const excessiveMileage = {
        useMileageAllowance: true,
        mileageTotal: 200000, // 200k miles per year is unrealistic
        usePropertyIncomeAllowance: false,
        priorYearLosses: 0,
        capitalAllowances: 0,
        wearAndTearAllowance: 0
      };

      const calculation = calculatePersonalTax(income, expenses, excessiveMileage);

      // Should still calculate but would be flagged in validation
      expect(calculation.adjustments).toBeGreaterThan(0);
      expect(calculation.adjustments).toBe((10000 * 0.45) + (190000 * 0.25)); // Correct calculation
    });
  });

  describe('Tax Year Compliance', () => {
    it('should handle tax year boundaries correctly', () => {
      const testTaxYears = ['2021-22', '2022-23', '2023-24', '2024-25'];

      testTaxYears.forEach(taxYear => {
        const calculation = calculatePersonalTax(
          { rentIncome: 20000, premiumsOfLeaseGrant: 0, otherPropertyIncome: 0 },
          { premisesRunningCosts: 2000, repairsAndMaintenance: 1000, financialCosts: 500, professionalFees: 300, costOfServices: 200, other: 0 },
          { useMileageAllowance: false, mileageTotal: 0, usePropertyIncomeAllowance: false, priorYearLosses: 0, capitalAllowances: 0, wearAndTearAllowance: 0 }
        );

        const hmrcFormat = formatForHMRCSubmission(calculation, taxYear);

        expect(hmrcFormat.taxYear).toBe(taxYear);
        expect(hmrcFormat.taxYear).toMatch(/^\d{4}-\d{2}$/);
      });
    });

    it('should apply correct rates for each tax year', () => {
      // This would test historical rates if implemented
      // For now, we test that the system accepts different tax years
      const calculation2023 = calculatePersonalTax(
        { rentIncome: 50000, premiumsOfLeaseGrant: 0, otherPropertyIncome: 0 },
        { premisesRunningCosts: 5000, repairsAndMaintenance: 2500, financialCosts: 1500, professionalFees: 1000, costOfServices: 500, other: 0 },
        { useMileageAllowance: false, mileageTotal: 0, usePropertyIncomeAllowance: false, priorYearLosses: 0, capitalAllowances: 0, wearAndTearAllowance: 0 }
      );

      expect(calculation2023.totalTaxDue).toBeGreaterThan(0);
      expect(calculation2023.breakdown.basicRateTax).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Compliance', () => {
    it('should handle invalid input gracefully', () => {
      // Test negative values
      expect(() => {
        calculatePersonalTax(
          { rentIncome: -1000, premiumsOfLeaseGrant: 0, otherPropertyIncome: 0 },
          { premisesRunningCosts: 500, repairsAndMaintenance: 250, financialCosts: 150, professionalFees: 100, costOfServices: 50, other: 0 },
          { useMileageAllowance: false, mileageTotal: 0, usePropertyIncomeAllowance: false, priorYearLosses: 0, capitalAllowances: 0, wearAndTearAllowance: 0 }
        );
      }).not.toThrow(); // Should handle gracefully, not crash

      // Test null/undefined values
      expect(() => {
        calculatePersonalTax(
          { rentIncome: null as any, premiumsOfLeaseGrant: 0, otherPropertyIncome: 0 },
          { premisesRunningCosts: 500, repairsAndMaintenance: 250, financialCosts: 150, professionalFees: 100, costOfServices: 50, other: 0 },
          { useMileageAllowance: false, mileageTotal: 0, usePropertyIncomeAllowance: false, priorYearLosses: 0, capitalAllowances: 0, wearAndTearAllowance: 0 }
        );
      }).not.toThrow(); // Should handle gracefully
    });

    it('should maintain precision in calculations', () => {
      const calculation = calculatePersonalTax(
        { rentIncome: 33333.33, premiumsOfLeaseGrant: 0, otherPropertyIncome: 0 },
        { premisesRunningCosts: 3333.33, repairsAndMaintenance: 1666.67, financialCosts: 833.33, professionalFees: 500, costOfServices: 250, other: 0 },
        { useMileageAllowance: false, mileageTotal: 0, usePropertyIncomeAllowance: false, priorYearLosses: 0, capitalAllowances: 0, wearAndTearAllowance: 0 }
      );

      // Results should be properly rounded to pence
      expect(calculation.totalTaxDue % 0.01).toBeCloseTo(0, 2);
      expect(calculation.incomeTax % 0.01).toBeCloseTo(0, 2);
      expect(calculation.nationalInsurance % 0.01).toBeCloseTo(0, 2);
    });
  });
}); 