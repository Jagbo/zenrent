/**
 * HMRC Data Transformation Types
 * 
 * This file contains types and interfaces for the HMRC data transformation service.
 * It defines the input and output formats for transforming ZenRent financial data
 * into HMRC-compliant formats for MTD submissions, as well as error handling types.
 */

import { CurrencyCode } from '../utils/currencyUtils';

/**
 * Financial Data Types
 */
export enum FinancialDataType {
  RENTAL_INCOME = 'rental_income',
  EXPENSES = 'expenses',
  VAT = 'vat',
  SELF_ASSESSMENT = 'self_assessment'
}

/**
 * Financial Transaction
 */
export interface FinancialTransaction {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category: string;
  date: string; // ISO date string
  vatAmount?: number;
  vatRate?: number;
  propertyId?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

/**
 * Property Details
 */
export interface PropertyDetails {
  id: string;
  userId: string;
  address: string;
  postcode: string;
  propertyType: string;
  isCommercial: boolean;
  isFurnished: boolean;
  isMainResidence: boolean;
  purchaseDate?: string; // ISO date string
  purchasePrice?: number;
  currentValue?: number;
  rentalStartDate?: string; // ISO date string
  metadata?: Record<string, any>;
}

/**
 * Financial Data
 */
export interface FinancialData {
  userId: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  transactions: FinancialTransaction[];
  properties?: PropertyDetails[];
  vatRegistered?: boolean;
  vatNumber?: string;
  vatScheme?: string;
  vatFlatRate?: number;
  accountingBasis?: 'cash' | 'accrual';
  metadata?: Record<string, any>;
}

/**
 * VAT Return Payload
 * Based on HMRC VAT MTD API specification
 */
export interface VatReturnPayload {
  periodKey: string;
  vatDueSales: number;
  vatDueAcquisitions: number;
  totalVatDue: number;
  vatReclaimedCurrPeriod: number;
  netVatDue: number;
  totalValueSalesExVAT: number;
  totalValuePurchasesExVAT: number;
  totalValueGoodsSuppliedExVAT: number;
  totalAcquisitionsExVAT: number;
  finalised: boolean;
}

/**
 * Property Income Payload
 * Based on HMRC Property Income MTD API specification
 */
export interface PropertyIncomePayload {
  fromDate: string; // ISO date string
  toDate: string; // ISO date string
  ukProperties: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    netLoss: number;
    properties: Array<{
      propertyId: string;
      income: {
        rentIncome: number;
        premiumsOfLeaseGrant: number;
        reversePremiums: number;
        otherPropertyIncome: number;
      };
      expenses: {
        premisesRunningCosts: number;
        repairsAndMaintenance: number;
        financialCosts: number;
        professionalFees: number;
        costOfServices: number;
        other: number;
      };
      allowances: {
        annualInvestmentAllowance: number;
        businessPremisesRenovationAllowance: number;
        otherCapitalAllowance: number;
        wearAndTearAllowance: number;
        propertyAllowance: number;
      };
    }>;
  };
  foreignProperties?: {
    // Similar structure to ukProperties
  };
}

/**
 * Self Assessment Payload
 * This is a simplified version - actual structure depends on specific endpoints
 */
export interface SelfAssessmentPayload {
  taxYear: string; // e.g., "2023-24"
  income: {
    employment?: Array<{
      employerName: string;
      employerReference: string;
      payrollId?: string;
      startDate?: string;
      cessationDate?: string;
      taxablePayToDate: number;
      totalTaxToDate: number;
      paymentMethod?: string;
    }>;
    selfEmployment?: Array<{
      businessId: string;
      businessName: string;
      businessDescription: string;
      commencementDate: string;
      accountingPeriodStartDate: string;
      accountingPeriodEndDate: string;
      income: number;
      expenses: Record<string, number>;
      additions: Record<string, number>;
      deductions: Record<string, number>;
    }>;
    ukProperty?: PropertyIncomePayload;
    dividends?: {
      ukDividends: number;
      otherUkDividends: number;
    };
    savings?: {
      ukInterest: number;
      foreignInterest: number;
    };
  };
  deductions?: {
    giftAid?: {
      giftAidPayments: number;
      giftAidTreatedAsPaidInPreviousTaxYear: number;
      giftAidTreatedAsPaidInCurrentTaxYear: number;
    };
    pensionContributions?: {
      pensionSchemeOverseasTransfers: number;
      pensionContributionsAmount: number;
    };
  };
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Validation Rule
 */
export interface ValidationRule<T> {
  id: string;
  name: string;
  description: string;
  field?: string;
  severity: 'error' | 'warning';
  validate: (data: T, financialData?: FinancialData) => ValidationResult;
}

/**
 * Transformation Options
 */
export interface TransformationOptions {
  roundingPrecision?: number;
  validateOutput?: boolean;
  includeNonMandatoryFields?: boolean;
  currencyCode?: string | CurrencyCode; // Support both string and CurrencyCode enum
  debug?: boolean;
  logErrors?: boolean;
  userId?: string;
}

/**
 * Transformation Result
 */
export interface TransformationResult<T> {
  data: T;
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Transformation Error Types
 */
export enum TransformationErrorType {
  INVALID_DATA = 'invalid_data',
  MISSING_REQUIRED_FIELD = 'missing_required_field',
  CALCULATION_ERROR = 'calculation_error',
  DATE_FORMAT_ERROR = 'date_format_error',
  INVALID_PERIOD = 'invalid_period',
  NEGATIVE_VALUE = 'negative_value',
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
  VALIDATION_ERROR = 'validation_error',
  TRANSFORMATION_FAILED = 'transformation_failed',
  UNSUPPORTED_TYPE = 'unsupported_type',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * Transformation Error Categories
 */
export enum TransformationErrorCategory {
  DATA_ERROR = 'data_error',
  CALCULATION_ERROR = 'calculation_error',
  FORMAT_ERROR = 'format_error',
  THRESHOLD_ERROR = 'threshold_error',
  VALIDATION_ERROR = 'validation_error',
  SYSTEM_ERROR = 'system_error',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * Recovery Actions for Transformation Errors
 */
export enum RecoveryAction {
  CORRECT_DATA = 'correct_data',
  PROVIDE_MISSING_DATA = 'provide_missing_data',
  RECALCULATE = 'recalculate',
  MANUAL_ENTRY = 'manual_entry',
  CORRECT_FORMAT = 'correct_format',
  CORRECT_PERIOD = 'correct_period',
  REVIEW_THRESHOLDS = 'review_thresholds',
  RETRY = 'retry',
  CONTACT_SUPPORT = 'contact_support'
}

/**
 * Transformation Error
 */
export interface TransformationError {
  type: TransformationErrorType;
  message: string;
  userMessage: string;
  category: TransformationErrorCategory;
  recoveryActions: RecoveryAction[];
  timestamp: Date;
  details?: Record<string, any>;
  userId?: string;
  requestId: string;
}
