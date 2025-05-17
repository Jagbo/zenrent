/**
 * HMRC Utilities Index
 * 
 * This file exports all utility functions for HMRC data transformations.
 */

// Export currency utilities
export * from './currencyUtils';

// Re-export the existing utilities from the transformers directory
export {
  roundCurrency as legacyRoundCurrency,
  formatDate,
  parseDate,
  calculateTaxYear,
  isValidNumber,
  safeAdd,
  groupByCategory,
  sumField,
  deepClone,
  toPence,
  fromPence
} from '../transformers/utils';
