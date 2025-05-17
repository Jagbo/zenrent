/**
 * Tax Submission Data Models
 * 
 * This file contains TypeScript interfaces and types for the tax submission data models.
 * These models correspond to the database schema and are used throughout the application.
 */

/**
 * MTD Subscription Status
 */
export enum MtdSubscriptionStatus {
  NOT_SUBSCRIBED = 'not_subscribed',
  PENDING = 'pending',
  SUBSCRIBED = 'subscribed'
}

/**
 * VAT Registration Details
 */
export interface VatRegistrationDetails {
  vatNumber: string;
  registrationDate: string; // ISO date string
  deregistrationDate?: string; // ISO date string
  lastReturnDate?: string; // ISO date string
  nextReturnDueDate?: string; // ISO date string
  returnFrequency?: 'monthly' | 'quarterly' | 'annual';
  vatScheme?: string;
}

/**
 * User Profile MTD Extensions
 * These are the fields added to the user profile for MTD integration
 */
export interface UserProfileMtdExtensions {
  hmrcUserId?: string;
  mtdSubscriptionStatus: MtdSubscriptionStatus;
  vatRegistrationDetails?: VatRegistrationDetails;
  utr?: string; // Unique Taxpayer Reference
  mtdStatus?: string;
  taxStatus?: string;
  taxReferenceNumber?: string;
  isUkTaxResident?: boolean;
  isNonResidentScheme?: boolean;
  accountingPeriod?: string;
}

/**
 * Submission Period Type
 */
export enum SubmissionPeriodType {
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual'
}

/**
 * Submission Status
 */
export enum SubmissionStatus {
  PENDING = 'pending',
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  ERROR = 'error',
  DRAFT = 'draft'
}

/**
 * Crystallisation Status
 */
export enum CrystallisationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

/**
 * Submission Period
 */
export interface SubmissionPeriod {
  id: string;
  userId: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  submissionType: SubmissionPeriodType;
  status: SubmissionStatus;
  dueDate: string; // ISO date string
  taxYear: string; // e.g., "2023-2024"
  periodKey?: string; // HMRC period identifier
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Tax Submission
 */
export interface TaxSubmission {
  id: string;
  userId: string;
  periodId?: string; // Reference to SubmissionPeriod
  taxYear: string; // e.g., "2023/2024"
  submissionType: string; // e.g., 'SA100', 'SA105'
  submissionId?: string; // ID returned by HMRC after successful submission
  status: SubmissionStatus;
  hmrcReference?: string; // Confirmation reference from HMRC
  submittedAt?: string; // ISO date string
  payload?: any; // Submitted data structure
  errorDetails?: any; // Error messages from HMRC
  calculationId?: string; // HMRC calculation ID
  calculationTimestamp?: string; // ISO date string
  calculationData?: any; // Calculation data from HMRC
  crystallisationStatus?: CrystallisationStatus;
  crystallisationTimestamp?: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * HMRC Submission Log
 */
export interface HmrcSubmissionLog {
  id: string;
  submissionId?: string; // Reference to TaxSubmission
  userId: string;
  timestamp: string; // ISO date string
  action: string; // e.g., 'submission_attempt', 'hmrc_response', 'status_update'
  details?: any; // Request/response details, error messages
  success: boolean;
}

/**
 * Tax Data Summary
 * Used for displaying summary information about a user's tax situation
 */
export interface TaxDataSummary {
  userId: string;
  currentTaxYear: string;
  mtdSubscriptionStatus: MtdSubscriptionStatus;
  upcomingSubmissions: SubmissionPeriod[];
  recentSubmissions: TaxSubmission[];
  overdueSubmissions: SubmissionPeriod[];
  vatRegistered: boolean;
  vatDetails?: VatRegistrationDetails;
}
