/**
 * Tests for HMRC Currency Utilities
 */

import {
  CurrencyCode,
  RoundingMethod,
  roundWithMethod,
  roundCurrency,
  formatCurrency,
  fromMinorUnits,
  toMinorUnits,
  addCurrency,
  subtractCurrency,
  multiplyCurrency,
  divideCurrency,
  sumCurrency,
  calculateVatFromGross,
  calculateVatFromNet,
  convertCurrency,
  currencyEquals,
  clampCurrency,
  getVatRateForCategory,
  formatForHmrcSubmission
} from '../currencyUtils';

describe('HMRC Currency Utilities', () => {
  describe('roundWithMethod', () => {
    it('should round numbers using standard rounding', () => {
      expect(roundWithMethod(1.234, 2, RoundingMethod.ROUND)).toBe(1.23);
      expect(roundWithMethod(1.235, 2, RoundingMethod.ROUND)).toBe(1.24);
      expect(roundWithMethod(1.245, 2, RoundingMethod.ROUND)).toBe(1.25);
      expect(roundWithMethod(-1.235, 2, RoundingMethod.ROUND)).toBe(-1.24);
    });

    it('should round numbers using floor rounding', () => {
      expect(roundWithMethod(1.234, 2, RoundingMethod.FLOOR)).toBe(1.23);
      expect(roundWithMethod(1.239, 2, RoundingMethod.FLOOR)).toBe(1.23);
      expect(roundWithMethod(-1.234, 2, RoundingMethod.FLOOR)).toBe(-1.24);
    });

    it('should round numbers using ceiling rounding', () => {
      expect(roundWithMethod(1.231, 2, RoundingMethod.CEILING)).toBe(1.24);
      expect(roundWithMethod(1.239, 2, RoundingMethod.CEILING)).toBe(1.24);
      expect(roundWithMethod(-1.231, 2, RoundingMethod.CEILING)).toBe(-1.23);
    });

    it('should round numbers using banker\'s rounding', () => {
      expect(roundWithMethod(1.235, 2, RoundingMethod.BANKER)).toBe(1.24);
      expect(roundWithMethod(1.245, 2, RoundingMethod.BANKER)).toBe(1.24); // Round to even
      expect(roundWithMethod(1.255, 2, RoundingMethod.BANKER)).toBe(1.26);
      expect(roundWithMethod(1.265, 2, RoundingMethod.BANKER)).toBe(1.26); // Round to even
    });
  });

  describe('roundCurrency', () => {
    it('should round currency values to the correct number of decimal places', () => {
      expect(roundCurrency(1.234, CurrencyCode.GBP)).toBe(1.23);
      expect(roundCurrency(1.235, CurrencyCode.GBP)).toBe(1.24);
      expect(roundCurrency(1.234, CurrencyCode.EUR)).toBe(1.23);
      expect(roundCurrency(1.235, CurrencyCode.USD)).toBe(1.24);
    });

    it('should use the specified rounding method', () => {
      expect(roundCurrency(1.235, CurrencyCode.GBP, RoundingMethod.FLOOR)).toBe(1.23);
      expect(roundCurrency(1.235, CurrencyCode.GBP, RoundingMethod.CEILING)).toBe(1.24);
      expect(roundCurrency(1.245, CurrencyCode.GBP, RoundingMethod.BANKER)).toBe(1.24);
    });
  });

  describe('formatCurrency', () => {
    it('should format currency values with the correct symbol and format', () => {
      expect(formatCurrency(1234.56, CurrencyCode.GBP)).toBe('£1,234.56');
      expect(formatCurrency(1234.56, CurrencyCode.EUR)).toBe('€1,234.56');
      expect(formatCurrency(1234.56, CurrencyCode.USD)).toBe('$1,234.56');
    });

    it('should format currency values without the symbol when specified', () => {
      expect(formatCurrency(1234.56, CurrencyCode.GBP, false)).toBe('1,234.56');
      expect(formatCurrency(1234.56, CurrencyCode.EUR, false)).toBe('1,234.56');
      expect(formatCurrency(1234.56, CurrencyCode.USD, false)).toBe('1,234.56');
    });
  });

  describe('fromMinorUnits and toMinorUnits', () => {
    it('should convert between major and minor units correctly', () => {
      expect(fromMinorUnits(1234, CurrencyCode.GBP)).toBe(12.34);
      expect(toMinorUnits(12.34, CurrencyCode.GBP)).toBe(1234);
      
      expect(fromMinorUnits(1234, CurrencyCode.EUR)).toBe(12.34);
      expect(toMinorUnits(12.34, CurrencyCode.EUR)).toBe(1234);
      
      expect(fromMinorUnits(1234, CurrencyCode.USD)).toBe(12.34);
      expect(toMinorUnits(12.34, CurrencyCode.USD)).toBe(1234);
    });

    it('should handle rounding when converting to minor units', () => {
      expect(toMinorUnits(12.345, CurrencyCode.GBP)).toBe(1235);
      expect(toMinorUnits(12.344, CurrencyCode.GBP)).toBe(1234);
    });
  });

  describe('addCurrency', () => {
    it('should add currency values correctly', () => {
      expect(addCurrency(12.34, 56.78, CurrencyCode.GBP)).toBe(69.12);
      expect(addCurrency(12.34, 56.78, CurrencyCode.EUR)).toBe(69.12);
      expect(addCurrency(12.34, 56.78, CurrencyCode.USD)).toBe(69.12);
    });

    it('should handle edge cases in addition', () => {
      expect(addCurrency(0.1, 0.2, CurrencyCode.GBP)).toBe(0.3);
      expect(addCurrency(0.01, 0.02, CurrencyCode.GBP)).toBe(0.03);
      expect(addCurrency(0.001, 0.002, CurrencyCode.GBP)).toBe(0); // Rounds to 0 due to precision
    });
  });

  describe('subtractCurrency', () => {
    it('should subtract currency values correctly', () => {
      expect(subtractCurrency(56.78, 12.34, CurrencyCode.GBP)).toBe(44.44);
      expect(subtractCurrency(56.78, 12.34, CurrencyCode.EUR)).toBe(44.44);
      expect(subtractCurrency(56.78, 12.34, CurrencyCode.USD)).toBe(44.44);
    });

    it('should handle edge cases in subtraction', () => {
      expect(subtractCurrency(0.3, 0.1, CurrencyCode.GBP)).toBe(0.2);
      expect(subtractCurrency(0.03, 0.01, CurrencyCode.GBP)).toBe(0.02);
      expect(subtractCurrency(0.003, 0.001, CurrencyCode.GBP)).toBe(0); // Rounds to 0 due to precision
    });
  });

  describe('multiplyCurrency', () => {
    it('should multiply currency values correctly', () => {
      expect(multiplyCurrency(12.34, 2, CurrencyCode.GBP)).toBe(24.68);
      expect(multiplyCurrency(12.34, 0.5, CurrencyCode.EUR)).toBe(6.17);
      expect(multiplyCurrency(12.34, 1.5, CurrencyCode.USD)).toBe(18.51);
    });

    it('should handle edge cases in multiplication', () => {
      expect(multiplyCurrency(0.1, 0.1, CurrencyCode.GBP)).toBe(0.01);
      expect(multiplyCurrency(0.01, 0.1, CurrencyCode.GBP)).toBe(0);
      expect(multiplyCurrency(0, 100, CurrencyCode.GBP)).toBe(0);
    });
  });

  describe('divideCurrency', () => {
    it('should divide currency values correctly', () => {
      expect(divideCurrency(12.34, 2, CurrencyCode.GBP)).toBe(6.17);
      expect(divideCurrency(12.34, 4, CurrencyCode.EUR)).toBe(3.09);
      expect(divideCurrency(12.00, 3, CurrencyCode.USD)).toBe(4.00);
    });

    it('should throw an error when dividing by zero', () => {
      expect(() => divideCurrency(12.34, 0, CurrencyCode.GBP)).toThrow('Division by zero');
    });
  });

  describe('sumCurrency', () => {
    it('should sum an array of currency values correctly', () => {
      expect(sumCurrency([12.34, 56.78, 90.12], CurrencyCode.GBP)).toBe(159.24);
      expect(sumCurrency([12.34, 56.78, 90.12], CurrencyCode.EUR)).toBe(159.24);
      expect(sumCurrency([12.34, 56.78, 90.12], CurrencyCode.USD)).toBe(159.24);
    });

    it('should handle empty arrays', () => {
      expect(sumCurrency([], CurrencyCode.GBP)).toBe(0);
    });
  });

  describe('calculateVatFromGross', () => {
    it('should calculate VAT from gross amount correctly', () => {
      expect(calculateVatFromGross(120, 0.2, CurrencyCode.GBP)).toBeCloseTo(20, 2);
      expect(calculateVatFromGross(105, 0.05, CurrencyCode.EUR)).toBeCloseTo(5, 2);
      expect(calculateVatFromGross(100, 0, CurrencyCode.USD)).toBe(0);
    });

    it('should handle edge cases in VAT calculation', () => {
      expect(calculateVatFromGross(0, 0.2, CurrencyCode.GBP)).toBe(0);
      expect(calculateVatFromGross(1.23, 0.2, CurrencyCode.GBP)).toBeCloseTo(0.21, 2);
    });
  });

  describe('calculateVatFromNet', () => {
    it('should calculate VAT from net amount correctly', () => {
      expect(calculateVatFromNet(100, 0.2, CurrencyCode.GBP)).toBe(20);
      expect(calculateVatFromNet(100, 0.05, CurrencyCode.EUR)).toBe(5);
      expect(calculateVatFromNet(100, 0, CurrencyCode.USD)).toBe(0);
    });

    it('should handle edge cases in VAT calculation', () => {
      expect(calculateVatFromNet(0, 0.2, CurrencyCode.GBP)).toBe(0);
      expect(calculateVatFromNet(1.23, 0.2, CurrencyCode.GBP)).toBeCloseTo(0.25, 2);
    });
  });

  describe('convertCurrency', () => {
    it('should convert between currencies correctly', () => {
      expect(convertCurrency(100, CurrencyCode.GBP, CurrencyCode.EUR, 1.15)).toBe(115);
      expect(convertCurrency(100, CurrencyCode.EUR, CurrencyCode.USD, 1.08)).toBe(108);
      expect(convertCurrency(100, CurrencyCode.USD, CurrencyCode.GBP, 0.75)).toBe(75);
    });

    it('should return the same value when converting to the same currency', () => {
      expect(convertCurrency(100, CurrencyCode.GBP, CurrencyCode.GBP, 1.15)).toBe(100);
    });
  });

  describe('currencyEquals', () => {
    it('should compare currency values correctly', () => {
      expect(currencyEquals(100, 100, CurrencyCode.GBP)).toBe(true);
      expect(currencyEquals(100, 100.001, CurrencyCode.GBP)).toBe(true);
      expect(currencyEquals(100, 100.01, CurrencyCode.GBP)).toBe(false);
    });
  });

  describe('clampCurrency', () => {
    it('should clamp currency values to the specified range', () => {
      expect(clampCurrency(100, 0, 200, CurrencyCode.GBP)).toBe(100);
      expect(clampCurrency(-50, 0, 200, CurrencyCode.GBP)).toBe(0);
      expect(clampCurrency(300, 0, 200, CurrencyCode.GBP)).toBe(200);
    });
  });

  describe('getVatRateForCategory', () => {
    it('should return the correct VAT rate for each category', () => {
      expect(getVatRateForCategory('standard_rate')).toBe(0.2);
      expect(getVatRateForCategory('reduced_rate')).toBe(0.05);
      expect(getVatRateForCategory('zero_rate')).toBe(0);
      expect(getVatRateForCategory('exempt')).toBe(0);
      expect(getVatRateForCategory('outside_scope')).toBe(0);
      expect(getVatRateForCategory('unknown')).toBe(0);
    });
  });

  describe('formatForHmrcSubmission', () => {
    it('should format currency values for HMRC submission correctly', () => {
      expect(formatForHmrcSubmission(100.123, CurrencyCode.GBP)).toBeCloseTo(100.12, 2);
      expect(formatForHmrcSubmission(100.125, CurrencyCode.GBP)).toBeCloseTo(100.13, 2);
      expect(formatForHmrcSubmission(0.001, CurrencyCode.GBP)).toBe(0);
    });
  });
});
