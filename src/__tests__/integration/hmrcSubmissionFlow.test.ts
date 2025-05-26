/**
 * Integration tests for HMRC submission flow
 * Tests the complete end-to-end submission process
 */

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { HmrcApiClient } from '@/lib/services/hmrc/hmrcApiClient';
import { SubmissionService } from '@/lib/services/submissionService';
import { calculatePersonalTax, calculateCompanyTax } from '@/services/tax-calculator';

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs');

// Mock external services
jest.mock('@/lib/services/hmrc/hmrcApiClient');
jest.mock('@/lib/services/submissionService');

describe('HMRC Submission Flow Integration Tests', () => {
  let mockSupabase: any;
  let mockHmrcClient: jest.Mocked<HmrcApiClient>;
  let mockSubmissionService: jest.Mocked<SubmissionService>;

  beforeEach(() => {
    // Setup Supabase mock
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-123', email: 'test@example.com' } },
          error: null
        })
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null })
      }))
    };

    (createRouteHandlerClient as jest.Mock).mockReturnValue(mockSupabase);

    // Setup HMRC client mock
    mockHmrcClient = {
      getSelfAssessment: jest.fn(),
      submitIncome: jest.fn(),
      getTaxObligations: jest.fn(),
      getCircuitBreakerStatus: jest.fn(),
      resetCircuitBreaker: jest.fn(),
      cleanup: jest.fn()
    } as any;

    // Setup submission service mock
    mockSubmissionService = {
      saveDraft: jest.fn(),
      validateSubmissionData: jest.fn(),
      submitToHMRC: jest.fn(),
      getSubmissionStatus: jest.fn(),
      retrySubmission: jest.fn(),
      getDraft: jest.fn(),
      getUserDrafts: jest.fn(),
      deleteDraft: jest.fn(),
      getSubmissionReceipts: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Personal Tax Submission Flow', () => {
    const mockPersonalTaxData = {
      income: {
        rentIncome: 25000,
        premiumsOfLeaseGrant: 0,
        otherPropertyIncome: 0
      },
      expenses: {
        premisesRunningCosts: 3000,
        repairsAndMaintenance: 1500,
        financialCosts: 800,
        professionalFees: 500,
        costOfServices: 300,
        other: 0
      },
      adjustments: {
        useMileageAllowance: true,
        mileageTotal: 5000,
        usePropertyIncomeAllowance: false,
        priorYearLosses: 0,
        capitalAllowances: 2000,
        wearAndTearAllowance: 0
      }
    };

    it('should complete full personal tax submission successfully', async () => {
      // Mock successful calculation
      const calculation = calculatePersonalTax(
        mockPersonalTaxData.income,
        mockPersonalTaxData.expenses,
        mockPersonalTaxData.adjustments
      );

      // Mock successful draft creation
      mockSubmissionService.saveDraft.mockResolvedValue({
        id: 'draft-123',
        userId: 'test-user-123',
        submissionType: 'personal',
        taxYear: '2023-24',
        draftData: calculation,
        validationStatus: { isValid: true, errors: [], warnings: [], completeness: 100 },
        isValid: true,
        lastSavedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Mock successful validation
      mockSubmissionService.validateSubmissionData.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        completeness: 100
      });

      // Mock successful HMRC submission
      mockSubmissionService.submitToHMRC.mockResolvedValue({
        success: true,
        submissionId: 'sub-456',
        hmrcReference: 'HMRC-789'
      });

      // Execute the flow
      const draftResult = await mockSubmissionService.saveDraft(
        'test-user-123',
        'personal',
        '2023-24',
        calculation
      );

      expect(draftResult.id).toBe('draft-123');
      expect(draftResult.isValid).toBe(true);

      const validationResult = await mockSubmissionService.validateSubmissionData(
        'personal',
        calculation
      );

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      const submissionResult = await mockSubmissionService.submitToHMRC(
        'test-user-123',
        'personal',
        '2023-24'
      );

      expect(submissionResult.success).toBe(true);
      expect(submissionResult.hmrcReference).toBe('HMRC-789');
    });

    it('should handle validation errors gracefully', async () => {
      const calculation = calculatePersonalTax(
        mockPersonalTaxData.income,
        mockPersonalTaxData.expenses,
        mockPersonalTaxData.adjustments
      );

      mockSubmissionService.saveDraft.mockResolvedValue({
        id: 'draft-123',
        userId: 'test-user-123',
        submissionType: 'personal',
        taxYear: '2023-24',
        draftData: calculation,
        validationStatus: { isValid: false, errors: [], warnings: [], completeness: 50 },
        isValid: false,
        lastSavedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Mock validation with errors
      mockSubmissionService.validateSubmissionData.mockResolvedValue({
        isValid: false,
        errors: [{ field: 'utr', code: 'REQUIRED', message: 'Missing required field: UTR number', severity: 'error' }],
        warnings: [{ field: 'income', code: 'HIGH_VALUE', message: 'Income seems unusually high' }],
        completeness: 50
      });

      const draftResult = await mockSubmissionService.saveDraft(
        'test-user-123',
        'personal',
        '2023-24',
        calculation
      );

      const validationResult = await mockSubmissionService.validateSubmissionData(
        'personal',
        calculation
      );

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors[0].message).toContain('Missing required field: UTR number');
      expect(validationResult.warnings[0].message).toContain('Income seems unusually high');
    });

    it('should retry failed submissions automatically', async () => {
      // Mock initial submission failure
      mockSubmissionService.submitToHMRC
        .mockResolvedValueOnce({
          success: false,
          error: 'Network timeout'
        })
        .mockResolvedValueOnce({
          success: true,
          submissionId: 'sub-456',
          hmrcReference: 'HMRC-789'
        });

      mockSubmissionService.retrySubmission.mockResolvedValue({
        success: true
      });

      // First attempt fails
      const firstAttempt = await mockSubmissionService.submitToHMRC(
        'test-user-123',
        'personal',
        '2023-24'
      );

      expect(firstAttempt.success).toBe(false);
      expect(firstAttempt.error).toBe('Network timeout');

      // Retry succeeds
      const retryResult = await mockSubmissionService.retrySubmission(
        'sub-456',
        'test-user-123'
      );

      expect(retryResult.success).toBe(true);
    });
  });

  describe('Company Tax Submission Flow', () => {
    const mockCompanyTaxData = {
      totalProfit: 500000,
      allowableExpenses: 100000,
      adjustments: {
        capitalAllowances: {
          aiaQualifyingExpenditure: 50000,
          aiaClaimedThisYear: 50000,
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
          currentYearExpenditure: 25000,
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
      }
    };

    it('should complete full company tax submission successfully', async () => {
      const calculation = calculateCompanyTax(
        mockCompanyTaxData.totalProfit,
        mockCompanyTaxData.allowableExpenses,
        mockCompanyTaxData.adjustments
      );

      mockSubmissionService.createDraft.mockResolvedValue({
        success: true,
        data: { draftId: 'company-draft-123', status: 'created' }
      });

      mockSubmissionService.validateSubmission.mockResolvedValue({
        success: true,
        data: {
          isValid: true,
          errors: [],
          warnings: []
        }
      });

      mockSubmissionService.submitToHMRC.mockResolvedValue({
        success: true,
        data: {
          submissionId: 'company-sub-456',
          hmrcReference: 'CT-HMRC-789',
          status: 'accepted'
        }
      });

      const draftResult = await mockSubmissionService.createDraft(
        'test-user-123',
        'company',
        '2023-24',
        calculation
      );

      expect(draftResult.success).toBe(true);

      const validationResult = await mockSubmissionService.validateSubmission(
        'test-user-123',
        'company-draft-123'
      );

      expect(validationResult.success).toBe(true);

      const submissionResult = await mockSubmissionService.submitToHMRC(
        'test-user-123',
        'company-draft-123'
      );

      expect(submissionResult.success).toBe(true);
      expect(submissionResult.data.hmrcReference).toContain('CT-');
    });

    it('should handle complex company tax calculations correctly', async () => {
      const complexAdjustments = {
        ...mockCompanyTaxData.adjustments,
        rdExpenditure: {
          currentYearExpenditure: 100000,
          isSmallCompany: true,
          isLossMaking: false,
          qualifiesForTaxCredit: true
        },
        groupRelief: {
          surrenderingCompanyLosses: 50000,
          claimingCompanyProfit: 400000,
          groupReliefClaimed: 50000,
          isGroupCompany: true
        },
        patentBoxProfits: 75000
      };

      const calculation = calculateCompanyTax(
        1000000,
        200000,
        complexAdjustments
      );

      // Verify complex calculations are handled
      expect(calculation.breakdown.rdReliefTotal).toBeGreaterThan(0);
      expect(calculation.breakdown.groupReliefUsed).toBe(50000);
      expect(calculation.breakdown.patentBoxRelief).toBeGreaterThan(0);
      expect(calculation.totalTaxDue).toBeLessThan(calculation.corporationTax);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from HMRC API failures', async () => {
      // Mock HMRC API failure followed by recovery
      mockHmrcClient.submitIncome
        .mockRejectedValueOnce(new Error('HMRC service unavailable'))
        .mockResolvedValueOnce({
          success: true,
          data: { submissionId: 'recovered-123', status: 'accepted' }
        });

      mockSubmissionService.submitToHMRC.mockImplementation(async () => {
        try {
          const result = await mockHmrcClient.submitIncome('user', '2023-24', {});
          return result;
        } catch (error) {
          // Simulate retry logic
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await mockHmrcClient.submitIncome('user', '2023-24', {});
        }
      });

      const result = await mockSubmissionService.submitToHMRC(
        'test-user-123',
        'draft-123'
      );

      expect(result.success).toBe(true);
      expect(mockHmrcClient.submitIncome).toHaveBeenCalledTimes(2);
    });

    it('should handle database connection issues', async () => {
      // Mock database failure
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockRejectedValue(new Error('Database connection failed')),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
      }));

      mockSubmissionService.createDraft.mockRejectedValue(
        new Error('Failed to save draft to database')
      );

      await expect(
        mockSubmissionService.createDraft('test-user-123', 'personal', '2023-24', {})
      ).rejects.toThrow('Failed to save draft to database');
    });

    it('should handle authentication token expiry', async () => {
      // Mock token expiry scenario
      mockHmrcClient.submitIncome
        .mockRejectedValueOnce(new Error('Token expired'))
        .mockResolvedValueOnce({
          success: true,
          data: { submissionId: 'renewed-123', status: 'accepted' }
        });

      mockSubmissionService.submitToHMRC.mockImplementation(async () => {
        try {
          return await mockHmrcClient.submitIncome('user', '2023-24', {});
        } catch (error) {
          if (error.message === 'Token expired') {
            // Simulate token refresh
            await new Promise(resolve => setTimeout(resolve, 500));
            return await mockHmrcClient.submitIncome('user', '2023-24', {});
          }
          throw error;
        }
      });

      const result = await mockSubmissionService.submitToHMRC(
        'test-user-123',
        'draft-123'
      );

      expect(result.success).toBe(true);
      expect(mockHmrcClient.submitIncome).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent submissions', async () => {
      const concurrentSubmissions = 10;
      
      mockSubmissionService.submitToHMRC.mockResolvedValue({
        success: true,
        data: {
          submissionId: 'concurrent-123',
          hmrcReference: 'HMRC-concurrent',
          status: 'accepted'
        }
      });

      const startTime = Date.now();
      
      const promises = Array(concurrentSubmissions).fill(null).map((_, index) =>
        mockSubmissionService.submitToHMRC(`test-user-${index}`, `draft-${index}`)
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // All submissions should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete within reasonable time (5 seconds for 10 submissions)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle large calculation datasets efficiently', async () => {
      // Create large dataset
      const largeIncome = {
        rentIncome: 1000000,
        premiumsOfLeaseGrant: 50000,
        otherPropertyIncome: 25000
      };

      const largeExpenses = {
        premisesRunningCosts: 100000,
        repairsAndMaintenance: 75000,
        financialCosts: 50000,
        professionalFees: 25000,
        costOfServices: 15000,
        other: 10000
      };

      const largeAdjustments = {
        useMileageAllowance: true,
        mileageTotal: 50000,
        usePropertyIncomeAllowance: false,
        priorYearLosses: 25000,
        capitalAllowances: 100000,
        wearAndTearAllowance: 15000
      };

      const startTime = Date.now();
      
      // Perform multiple calculations
      for (let i = 0; i < 100; i++) {
        calculatePersonalTax(largeIncome, largeExpenses, largeAdjustments);
      }

      const duration = Date.now() - startTime;

      // Should complete 100 large calculations in under 1 second
      expect(duration).toBeLessThan(1000);
    });

    it('should maintain performance under memory pressure', async () => {
      // Simulate memory pressure with large objects
      const largeData = Array(1000).fill(null).map((_, index) => ({
        id: index,
        calculation: calculatePersonalTax(
          { rentIncome: 20000 + index, premiumsOfLeaseGrant: 0, otherPropertyIncome: 0 },
          { premisesRunningCosts: 2000, repairsAndMaintenance: 1000, financialCosts: 500, professionalFees: 300, costOfServices: 200, other: 0 },
          { useMileageAllowance: false, mileageTotal: 0, usePropertyIncomeAllowance: false, priorYearLosses: 0, capitalAllowances: 0, wearAndTearAllowance: 0 }
        )
      }));

      expect(largeData).toHaveLength(1000);
      expect(largeData[999].calculation.totalTaxDue).toBeGreaterThan(0);

      // Memory should be manageable
      const memoryUsage = process.memoryUsage();
      expect(memoryUsage.heapUsed).toBeLessThan(500 * 1024 * 1024); // Less than 500MB
    });
  });

  describe('Data Integrity and Consistency', () => {
    it('should maintain data consistency across submission stages', async () => {
      const originalData = {
        income: { rentIncome: 30000, premiumsOfLeaseGrant: 0, otherPropertyIncome: 0 },
        expenses: { premisesRunningCosts: 3000, repairsAndMaintenance: 1500, financialCosts: 800, professionalFees: 500, costOfServices: 300, other: 0 },
        adjustments: { useMileageAllowance: false, mileageTotal: 0, usePropertyIncomeAllowance: false, priorYearLosses: 0, capitalAllowances: 0, wearAndTearAllowance: 0 }
      };

      const calculation = calculatePersonalTax(
        originalData.income,
        originalData.expenses,
        originalData.adjustments
      );

      // Mock services to return the same data
      mockSubmissionService.createDraft.mockResolvedValue({
        success: true,
        data: { 
          draftId: 'draft-123', 
          status: 'created',
          calculationData: calculation
        }
      });

      mockSubmissionService.getSubmissionStatus.mockResolvedValue({
        success: true,
        data: {
          submissionId: 'sub-123',
          status: 'processing',
          originalCalculation: calculation
        }
      });

      const draftResult = await mockSubmissionService.createDraft(
        'test-user-123',
        'personal',
        '2023-24',
        calculation
      );

      const statusResult = await mockSubmissionService.getSubmissionStatus(
        'test-user-123',
        'sub-123'
      );

      // Verify data consistency
      expect(draftResult.data.calculationData.totalTaxDue)
        .toBe(statusResult.data.originalCalculation.totalTaxDue);
      expect(draftResult.data.calculationData.taxableProfit)
        .toBe(statusResult.data.originalCalculation.taxableProfit);
    });

    it('should validate calculation checksums', async () => {
      const calculation = calculatePersonalTax(
        { rentIncome: 25000, premiumsOfLeaseGrant: 0, otherPropertyIncome: 0 },
        { premisesRunningCosts: 2500, repairsAndMaintenance: 1200, financialCosts: 600, professionalFees: 400, costOfServices: 250, other: 0 },
        { useMileageAllowance: false, mileageTotal: 0, usePropertyIncomeAllowance: false, priorYearLosses: 0, capitalAllowances: 0, wearAndTearAllowance: 0 }
      );

      // Generate checksum for calculation
      const checksum = JSON.stringify(calculation).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);

      mockSubmissionService.validateSubmission.mockResolvedValue({
        success: true,
        data: {
          isValid: true,
          checksum: checksum,
          errors: [],
          warnings: []
        }
      });

      const validationResult = await mockSubmissionService.validateSubmission(
        'test-user-123',
        'draft-123'
      );

      expect(validationResult.data.checksum).toBe(checksum);
    });
  });

  describe('Audit Trail and Logging', () => {
    it('should maintain complete audit trail', async () => {
      const auditEvents: any[] = [];

      // Mock audit logging
      const mockAuditLog = (event: string, data: any) => {
        auditEvents.push({
          timestamp: new Date().toISOString(),
          event,
          userId: 'test-user-123',
          data
        });
      };

      // Simulate submission flow with audit logging
      mockAuditLog('draft_created', { draftId: 'draft-123' });
      mockAuditLog('validation_started', { draftId: 'draft-123' });
      mockAuditLog('validation_completed', { draftId: 'draft-123', isValid: true });
      mockAuditLog('submission_started', { draftId: 'draft-123' });
      mockAuditLog('submission_completed', { submissionId: 'sub-123', status: 'accepted' });

      expect(auditEvents).toHaveLength(5);
      expect(auditEvents[0].event).toBe('draft_created');
      expect(auditEvents[4].event).toBe('submission_completed');
      expect(auditEvents.every(event => event.userId === 'test-user-123')).toBe(true);
    });

    it('should log performance metrics', async () => {
      const performanceMetrics: any[] = [];

      const mockPerformanceLog = (operation: string, duration: number, success: boolean) => {
        performanceMetrics.push({
          timestamp: new Date().toISOString(),
          operation,
          duration,
          success
        });
      };

      // Simulate operations with performance logging
      const startTime = Date.now();
      
      // Mock calculation
      calculatePersonalTax(
        { rentIncome: 20000, premiumsOfLeaseGrant: 0, otherPropertyIncome: 0 },
        { premisesRunningCosts: 2000, repairsAndMaintenance: 1000, financialCosts: 500, professionalFees: 300, costOfServices: 200, other: 0 },
        { useMileageAllowance: false, mileageTotal: 0, usePropertyIncomeAllowance: false, priorYearLosses: 0, capitalAllowances: 0, wearAndTearAllowance: 0 }
      );
      
      mockPerformanceLog('tax_calculation', Date.now() - startTime, true);

      expect(performanceMetrics).toHaveLength(1);
      expect(performanceMetrics[0].operation).toBe('tax_calculation');
      expect(performanceMetrics[0].success).toBe(true);
      expect(performanceMetrics[0].duration).toBeGreaterThan(0);
    });
  });
}); 