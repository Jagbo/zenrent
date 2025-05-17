/**
 * Utility functions for HMRC data transformations
 * 
 * This file contains common utility functions used across different transformers.
 */

/**
 * Round a number to the specified number of decimal places
 * 
 * @param value The value to round
 * @param precision The number of decimal places to round to (default: 2)
 * @returns The rounded value
 */
export function roundCurrency(value: number, precision: number = 2): number {
  const multiplier = Math.pow(10, precision);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Format a date as YYYY-MM-DD
 * 
 * @param date The date to format
 * @returns The formatted date string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse a date string in YYYY-MM-DD format
 * 
 * @param dateString The date string to parse
 * @returns The parsed Date object
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Calculate the tax year for a given date
 * UK tax year runs from April 6 to April 5 of the following year
 * 
 * @param date The date to calculate the tax year for
 * @returns The tax year in the format "YYYY-YYYY"
 */
export function calculateTaxYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const day = date.getDate(); // 1-31
  
  // If date is before April 6, it's in the previous tax year
  if (month < 3 || (month === 3 && day < 6)) {
    return `${year - 1}-${year}`;
  }
  
  return `${year}-${year + 1}`;
}

/**
 * Check if a value is a valid number
 * 
 * @param value The value to check
 * @returns True if the value is a valid number, false otherwise
 */
export function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Safely add two numbers, handling undefined values
 * 
 * @param a First number
 * @param b Second number
 * @returns The sum of the two numbers, or the non-undefined value if one is undefined
 */
export function safeAdd(a?: number, b?: number): number {
  if (a === undefined) return b ?? 0;
  if (b === undefined) return a;
  return a + b;
}

/**
 * Group transactions by category
 * 
 * @param transactions The transactions to group
 * @param categoryField The field to group by
 * @returns An object with categories as keys and arrays of transactions as values
 */
export function groupByCategory<T>(
  transactions: T[], 
  categoryField: keyof T
): Record<string, T[]> {
  return transactions.reduce((groups, transaction) => {
    const category = String(transaction[categoryField]);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(transaction);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Calculate the sum of a field across an array of objects
 * 
 * @param items The array of objects
 * @param field The field to sum
 * @returns The sum of the field values
 */
export function sumField<T>(items: T[], field: keyof T): number {
  return items.reduce((sum, item) => {
    const value = item[field];
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
}

/**
 * Deep clone an object
 * 
 * @param obj The object to clone
 * @returns A deep clone of the object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Convert a number to pence/cents (multiply by 100 and round to integer)
 * 
 * @param value The value in pounds/dollars
 * @returns The value in pence/cents as an integer
 */
export function toPence(value: number): number {
  return Math.round(value * 100);
}

/**
 * Convert a number from pence/cents to pounds/dollars
 * 
 * @param value The value in pence/cents
 * @returns The value in pounds/dollars
 */
export function fromPence(value: number): number {
  return value / 100;
}
