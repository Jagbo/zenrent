/**
 * Comprehensive unit tests for tax calculator service
 * Tests both personal and company tax calculations with various scenarios
 */

import {
  calculatePersonalTax,
  calculateCompanyTax,
  validateCalculationInputs,
  getCurrentTaxYear,
  getTaxYearOptions,
  formatForHMRCSubmission,
  PropertyIncome,
  PropertyExpenses,
  TaxAdjustments,
  PersonalTaxCalculation,
  CompanyTaxCalculation,
  CompanyTaxAdjustments
} from '../tax-calculator';

describe('Tax Calculator Service', () => {
  describe('Personal Tax Calculations', () => {
    const basicIncome: PropertyIncome = {
      rentIncome: 20000,
      premiumsOfLeaseGrant: 0,
      otherPropertyIncome: 0
    };

    const basicExpenses: PropertyExpenses = {
      premisesRunningCosts: 2000,
      repairsAndMaintenance: 1000,
      financialCosts: 500,
      professionalFees: 300,
      costOfServices: 200,
      other: 0
    };

    const basicAdjustments: TaxAdjustments = {
      useMileageAllowance: false,
      mileageTotal: 0,
      usePropertyIncomeAllowance: false,
      priorYearLosses: 0,
      capitalAllowances: 0,
      wearAndTearAllowance: 0
    };

    describe('Basic Income Tax', () => {
      it('should calculate correct tax for basic property income', () => {
        const result = calculatePersonalTax(basicIncome, basicExpenses, basicAdjustments);

        expect(result.totalIncome).toBe(20000);
        expect(result.allowableExpenses).toBe(4000);
        expect(result.taxableProfit).toBe(16000);
        expect(result.incomeTax).toBeGreaterThan(0);
        expect(result.nationalInsurance).toBeGreaterThan(0);
        expect(result.totalTaxDue).toBe(result.incomeTax + result.nationalInsurance);
      });

      it('should calculate correct tax for higher income property', () => {
        const highIncome: PropertyIncome = {
          rentIncome: 60000,
          premiumsOfLeaseGrant: 0,
          otherPropertyIncome: 0
        };

        const result = calculatePersonalTax(highIncome, basicExpenses, basicAdjustments);

        expect(result.totalIncome).toBe(60000);
        expect(result.taxableProfit).toBe(56000);
        expect(result.breakdown.higherRateTax).toBeGreaterThan(0);
        expect(result.totalTaxDue).toBeGreaterThan(10000);
      });

      it('should calculate correct tax for very high income property', () => {
        const veryHighIncome: PropertyIncome = {
          rentIncome: 200000,
          premiumsOfLeaseGrant: 0,
          otherPropertyIncome: 0
        };

        const result = calculatePersonalTax(veryHighIncome, basicExpenses, basicAdjustments);

        expect(result.totalIncome).toBe(200000);
        expect(result.taxableProfit).toBe(196000);
        expect(result.breakdown.additionalRateTax).toBeGreaterThan(0);
        expect(result.totalTaxDue).toBeGreaterThan(50000);
      });
    });

    describe('Property Income Allowance', () => {
      it('should apply property income allowance when beneficial', () => {
        const lowIncome: PropertyIncome = {
          rentIncome: 800,
          premiumsOfLeaseGrant: 0,
          otherPropertyIncome: 0
        };

        const adjustmentsWithAllowance: TaxAdjustments = {
          ...basicAdjustments,
          usePropertyIncomeAllowance: true
        };

        const result = calculatePersonalTax(lowIncome, basicExpenses, adjustmentsWithAllowance);

        // Should have zero taxable profit due to property income allowance
        expect(result.taxableProfit).toBe(0);
        expect(result.incomeTax).toBe(0);
        expect(result.nationalInsurance).toBe(0);
      });

      it('should use property allowance when more beneficial than expenses', () => {
        const mediumIncome: PropertyIncome = {
          rentIncome: 5000,
          premiumsOfLeaseGrant: 0,
          otherPropertyIncome: 0
        };

        const highExpenses: PropertyExpenses = {
          premisesRunningCosts: 3000,
          repairsAndMaintenance: 2000,
          financialCosts: 1000,
          professionalFees: 500,
          costOfServices: 500,
          other: 0
        };

        const adjustmentsWithAllowance: TaxAdjustments = {
          ...basicAdjustments,
          usePropertyIncomeAllowance: true
        };

        const result = calculatePersonalTax(mediumIncome, highExpenses, adjustmentsWithAllowance);

        // Property allowance (£1000) should be used instead of actual expenses (£7000)
        expect(result.taxableProfit).toBe(4000); // 5000 - 1000
      });
    });

    describe('Mileage Allowance', () => {
      it('should calculate mileage allowance correctly for under 10k miles', () => {
        const adjustmentsWithMileage: TaxAdjustments = {
          ...basicAdjustments,
          useMileageAllowance: true,
          mileageTotal: 8000
        };

        const result = calculatePersonalTax(basicIncome, basicExpenses, adjustmentsWithMileage);

        // Expected mileage allowance: 8000 * 0.45 = 3600
        expect(result.adjustments).toBe(3600);
        expect(result.taxableProfit).toBe(12400); // 20000 - 4000 - 3600
      });

      it('should calculate mileage allowance correctly for over 10k miles', () => {
        const adjustmentsWithMileage: TaxAdjustments = {
          ...basicAdjustments,
          useMileageAllowance: true,
          mileageTotal: 15000 // 10k at 45p, 5k at 25p
        };

        const result = calculatePersonalTax(basicIncome, basicExpenses, adjustmentsWithMileage);

        // Expected mileage allowance: (10000 * 0.45) + (5000 * 0.25) = 4500 + 1250 = 5750
        expect(result.adjustments).toBe(5750);
        expect(result.taxableProfit).toBe(10250); // 20000 - 4000 - 5750
      });
    });

    describe('Capital Allowances', () => {
      it('should apply capital allowances correctly', () => {
        const adjustmentsWithCapital: TaxAdjustments = {
          ...basicAdjustments,
          capitalAllowances: 3000
        };

        const result = calculatePersonalTax(basicIncome, basicExpenses, adjustmentsWithCapital);

        expect(result.adjustments).toBe(3000);
        expect(result.taxableProfit).toBe(13000); // 20000 - 4000 - 3000
      });
    });

    describe('Prior Year Losses', () => {
      it('should apply prior year losses correctly', () => {
        const adjustmentsWithLosses: TaxAdjustments = {
          ...basicAdjustments,
          priorYearLosses: 5000
        };

        const result = calculatePersonalTax(basicIncome, basicExpenses, adjustmentsWithLosses);

        // Taxable profit should be reduced by prior year losses
        expect(result.taxableProfit).toBe(11000); // 20000 - 4000 - 5000
      });

      it('should not create negative taxable profit from losses', () => {
        const adjustmentsWithLargeLosses: TaxAdjustments = {
          ...basicAdjustments,
          priorYearLosses: 20000
        };

        const result = calculatePersonalTax(basicIncome, basicExpenses, adjustmentsWithLargeLosses);

        // Taxable profit should not go below zero
        expect(result.taxableProfit).toBe(0);
      });
    });

    describe('Edge Cases', () => {
      it('should handle zero income correctly', () => {
        const zeroIncome: PropertyIncome = {
          rentIncome: 0,
          premiumsOfLeaseGrant: 0,
          otherPropertyIncome: 0
        };

        const result = calculatePersonalTax(zeroIncome, basicExpenses, basicAdjustments);

        expect(result.totalIncome).toBe(0);
        expect(result.taxableProfit).toBe(0);
        expect(result.incomeTax).toBe(0);
        expect(result.nationalInsurance).toBe(0);
        expect(result.totalTaxDue).toBe(0);
      });

      it('should handle expenses exceeding income', () => {
        const lowIncome: PropertyIncome = {
          rentIncome: 2000,
          premiumsOfLeaseGrant: 0,
          otherPropertyIncome: 0
        };

        const result = calculatePersonalTax(lowIncome, basicExpenses, basicAdjustments);

        expect(result.totalIncome).toBe(2000);
        expect(result.allowableExpenses).toBe(4000);
        expect(result.taxableProfit).toBe(0); // Should not be negative
        expect(result.incomeTax).toBe(0);
        expect(result.nationalInsurance).toBe(0);
      });
    });
  });

  describe('Company Tax Calculations', () => {
    const basicCompanyAdjustments: CompanyTaxAdjustments = {
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
    };

    describe('Basic Corporation Tax', () => {
      it('should calculate corporation tax for small company', () => {
        const result = calculateCompanyTax(200000, 50000, basicCompanyAdjustments);

        expect(result.totalProfit).toBe(200000);
        expect(result.allowableExpenses).toBe(50000);
        expect(result.taxableProfit).toBe(150000);
        expect(result.breakdown.effectiveRate).toBe(0.19); // Small companies rate
        expect(result.corporationTax).toBe(150000 * 0.19);
      });

      it('should calculate corporation tax for large company', () => {
        const largeCompanyAdjustments: CompanyTaxAdjustments = {
          ...basicCompanyAdjustments,
          rdExpenditure: {
            ...basicCompanyAdjustments.rdExpenditure,
            isSmallCompany: false
          }
        };

        const result = calculateCompanyTax(2000000, 200000, largeCompanyAdjustments);

        expect(result.totalProfit).toBe(2000000);
        expect(result.taxableProfit).toBe(1800000);
        expect(result.breakdown.effectiveRate).toBe(0.25); // Main rate
        expect(result.corporationTax).toBe(1800000 * 0.25);
      });

      it('should calculate marginal relief correctly', () => {
        const result = calculateCompanyTax(800000, 100000, basicCompanyAdjustments);

        expect(result.totalProfit).toBe(800000);
        expect(result.taxableProfit).toBe(700000);
        expect(result.marginalRelief).toBeGreaterThan(0);
        expect(result.breakdown.effectiveRate).toBeLessThan(0.25);
        expect(result.breakdown.effectiveRate).toBeGreaterThan(0.19);
      });
    });

    describe('Capital Allowances', () => {
      it('should apply Annual Investment Allowance correctly', () => {
        const adjustmentsWithAIA: CompanyTaxAdjustments = {
          ...basicCompanyAdjustments,
          capitalAllowances: {
            ...basicCompanyAdjustments.capitalAllowances,
            aiaQualifyingExpenditure: 50000,
            aiaClaimedThisYear: 50000
          }
        };

        const result = calculateCompanyTax(300000, 100000, adjustmentsWithAIA);

        expect(result.breakdown.capitalAllowancesTotal).toBe(50000);
        expect(result.taxableProfit).toBe(150000); // 300000 - 100000 - 50000
      });

      it('should apply main rate pool allowances correctly', () => {
        const adjustmentsWithMainPool: CompanyTaxAdjustments = {
          ...basicCompanyAdjustments,
          capitalAllowances: {
            ...basicCompanyAdjustments.capitalAllowances,
            mainPoolBroughtForward: 100000,
            mainPoolAdditions: 20000,
            mainPoolDisposals: 10000
          }
        };

        const result = calculateCompanyTax(300000, 100000, adjustmentsWithMainPool);

        // Main pool balance: 100000 + 20000 - 10000 = 110000
        // Allowance: 110000 * 0.18 = 19800
        expect(result.breakdown.capitalAllowancesTotal).toBe(19800);
        expect(result.taxableProfit).toBe(180200); // 300000 - 100000 - 19800
      });
    });

    describe('R&D Tax Relief', () => {
      it('should calculate R&D relief for small company', () => {
        const adjustmentsWithRD: CompanyTaxAdjustments = {
          ...basicCompanyAdjustments,
          rdExpenditure: {
            currentYearExpenditure: 50000,
            isSmallCompany: true,
            isLossMaking: false,
            qualifiesForTaxCredit: false
          }
        };

        const result = calculateCompanyTax(300000, 100000, adjustmentsWithRD);

        // Small company R&D relief: 50000 * (2.30 - 1) = 65000
        expect(result.breakdown.rdReliefTotal).toBe(65000);
        expect(result.taxableProfit).toBe(135000); // 300000 - 100000 - 65000
      });

      it('should calculate R&D relief for large company', () => {
        const adjustmentsWithRD: CompanyTaxAdjustments = {
          ...basicCompanyAdjustments,
          rdExpenditure: {
            currentYearExpenditure: 100000,
            isSmallCompany: false,
            isLossMaking: false,
            qualifiesForTaxCredit: false
          }
        };

        const result = calculateCompanyTax(1000000, 200000, adjustmentsWithRD);

        // Large company R&D relief: 100000 * (1.30 - 1) = 30000
        expect(result.breakdown.rdReliefTotal).toBe(30000);
        expect(result.taxableProfit).toBe(670000); // 1000000 - 200000 - 30000
      });
    });

    describe('Group Relief', () => {
      it('should apply group relief correctly', () => {
        const adjustmentsWithGroupRelief: CompanyTaxAdjustments = {
          ...basicCompanyAdjustments,
          groupRelief: {
            surrenderingCompanyLosses: 50000,
            claimingCompanyProfit: 200000,
            groupReliefClaimed: 50000,
            isGroupCompany: true
          }
        };

        const result = calculateCompanyTax(300000, 100000, adjustmentsWithGroupRelief);

        expect(result.breakdown.groupReliefUsed).toBe(50000);
        expect(result.taxableProfit).toBe(150000); // 300000 - 100000 - 50000
      });
    });

    describe('Losses Carried Forward', () => {
      it('should apply carried forward losses correctly', () => {
        const adjustmentsWithLosses: CompanyTaxAdjustments = {
          ...basicCompanyAdjustments,
          lossesCarriedForward: {
            tradingLosses: 30000,
            nonTradingLosses: 0,
            managementExpenses: 0,
            excessCapitalAllowances: 0,
            usedAgainstCurrentYear: 30000
          }
        };

        const result = calculateCompanyTax(300000, 100000, adjustmentsWithLosses);

        expect(result.breakdown.lossesUsed).toBe(30000);
        expect(result.taxableProfit).toBe(170000); // 300000 - 100000 - 30000
      });
    });

    describe('Patent Box Relief', () => {
      it('should calculate patent box relief correctly', () => {
        const adjustmentsWithPatentBox: CompanyTaxAdjustments = {
          ...basicCompanyAdjustments,
          patentBoxProfits: 100000
        };

        const result = calculateCompanyTax(500000, 100000, adjustmentsWithPatentBox);

        // Patent box relief: 100000 * (0.25 - 0.10) = 15000
        expect(result.breakdown.patentBoxRelief).toBe(15000);
        expect(result.totalTaxDue).toBe(result.corporationTax - 15000);
      });
    });

    describe('Edge Cases', () => {
      it('should handle zero profit correctly', () => {
        const result = calculateCompanyTax(100000, 100000, basicCompanyAdjustments);

        expect(result.totalProfit).toBe(100000);
        expect(result.allowableExpenses).toBe(100000);
        expect(result.taxableProfit).toBe(0);
        expect(result.corporationTax).toBe(0);
        expect(result.totalTaxDue).toBe(0);
      });

      it('should handle legacy number parameter', () => {
        const result = calculateCompanyTax(200000, 50000, 10000);

        expect(result.totalProfit).toBe(200000);
        expect(result.allowableExpenses).toBe(50000);
        expect(result.breakdown.lossesUsed).toBe(10000);
        expect(result.taxableProfit).toBe(140000); // 200000 - 50000 - 10000
      });
    });
  });

  describe('Input Validation', () => {
    it('should validate correct inputs', () => {
      const income: PropertyIncome = {
        rentIncome: 20000,
        premiumsOfLeaseGrant: 0,
        otherPropertyIncome: 0
      };

      const expenses: PropertyExpenses = {
        premisesRunningCosts: 2000,
        repairsAndMaintenance: 1000,
        financialCosts: 500,
        professionalFees: 300,
        costOfServices: 200,
        other: 0
      };

      const result = validateCalculationInputs(income, expenses);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative values', () => {
      const income: PropertyIncome = {
        rentIncome: -1000,
        premiumsOfLeaseGrant: 0,
        otherPropertyIncome: 0
      };

      const expenses: PropertyExpenses = {
        premisesRunningCosts: -500,
        repairsAndMaintenance: 1000,
        financialCosts: 500,
        professionalFees: 300,
        costOfServices: 200,
        other: 0
      };

      const result = validateCalculationInputs(income, expenses);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Rent income cannot be negative');
      expect(result.errors).toContain('premises running costs cannot be negative');
    });

    it('should warn about unrealistic values', () => {
      const income: PropertyIncome = {
        rentIncome: 15000000, // Very high income
        premiumsOfLeaseGrant: 0,
        otherPropertyIncome: 0
      };

      const expenses: PropertyExpenses = {
        premisesRunningCosts: 2000,
        repairsAndMaintenance: 1000,
        financialCosts: 500,
        professionalFees: 300,
        costOfServices: 200,
        other: 0
      };

      const result = validateCalculationInputs(income, expenses);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Income seems unusually high - please verify');
    });
  });

  describe('Tax Year Functions', () => {
    it('should get current tax year correctly', () => {
      const currentTaxYear = getCurrentTaxYear();

      expect(currentTaxYear).toMatch(/^\d{4}-\d{2}$/);

      // Should be either current year or previous year depending on date
      const now = new Date();
      const currentYear = now.getFullYear();
      const expectedYears = [
        `${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
        `${currentYear - 1}-${currentYear.toString().slice(-2)}`
      ];

      expect(expectedYears).toContain(currentTaxYear);
    });

    it('should get tax year options correctly', () => {
      const options = getTaxYearOptions();

      expect(options).toHaveLength(6);
      expect(options[0].value).toMatch(/^\d{4}-\d{2}$/);
      expect(options[0].label).toMatch(/^\d{4}\/\d{2}$/);

      // Should be in descending order (most recent first)
      for (let i = 1; i < options.length; i++) {
        const currentYear = parseInt(options[i - 1].value.split('-')[0]);
        const nextYear = parseInt(options[i].value.split('-')[0]);
        expect(currentYear).toBeGreaterThan(nextYear);
      }
    });
  });

  describe('HMRC Formatting', () => {
    it('should format calculation for HMRC submission', () => {
      const calculation = calculatePersonalTax(
        { rentIncome: 20000, premiumsOfLeaseGrant: 0, otherPropertyIncome: 0 },
        { premisesRunningCosts: 2000, repairsAndMaintenance: 1000, financialCosts: 500, professionalFees: 300, costOfServices: 200, other: 0 },
        { useMileageAllowance: false, mileageTotal: 0, usePropertyIncomeAllowance: false, priorYearLosses: 0, capitalAllowances: 0, wearAndTearAllowance: 0 }
      );

      const formatted = formatForHMRCSubmission(calculation, '2024-25');

      expect(formatted.taxYear).toBe('2024-25');
      expect(formatted.ukProperty.income.rentIncome).toBe(2000000); // £20,000 in pence
      expect(formatted.ukProperty.expenses.premisesRunningCosts).toBe(400000); // £4,000 in pence
      expect(formatted.calculation.taxableProfit).toBe(1600000); // £16,000 in pence
      expect(formatted.calculation.totalTaxDue).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should calculate tax efficiently for large numbers', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        calculatePersonalTax(
          { rentIncome: 20000 + i, premiumsOfLeaseGrant: 0, otherPropertyIncome: 0 },
          { premisesRunningCosts: 2000, repairsAndMaintenance: 1000, financialCosts: 500, professionalFees: 300, costOfServices: 200, other: 0 },
          { useMileageAllowance: false, mileageTotal: 0, usePropertyIncomeAllowance: false, priorYearLosses: 0, capitalAllowances: 0, wearAndTearAllowance: 0 }
        );
      }

      const end = performance.now();
      const duration = end - start;

      // Should complete 1000 calculations in under 500ms
      expect(duration).toBeLessThan(500);
    });
  });
}); 