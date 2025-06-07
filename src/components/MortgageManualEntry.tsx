"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { XMarkIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { mortgageDocumentService, MortgageDocumentData } from '@/services/mortgageDocumentService';

interface MortgageManualEntryProps {
  propertyId: string;
  onSave?: (data: MortgageDocumentData) => void;
  onCancel?: () => void;
  initialData?: Partial<MortgageDocumentData>;
  className?: string;
}

const PRODUCT_TYPES = [
  'Fixed Rate',
  'Variable Rate',
  'Tracker',
  'Offset',
  'Interest Only',
  'Repayment',
  'Buy to Let',
  'Commercial',
  'Other'
];

export default function MortgageManualEntry({
  propertyId,
  onSave,
  onCancel,
  initialData = {},
  className = ''
}: MortgageManualEntryProps) {
  const [formData, setFormData] = useState<MortgageDocumentData>({
    lender: initialData.lender || '',
    amount: initialData.amount || 0,
    interestRate: initialData.interestRate || 0,
    termYears: initialData.termYears || 0,
    monthlyPayment: initialData.monthlyPayment || 0,
    startDate: initialData.startDate || '',
    maturityDate: initialData.maturityDate || '',
    propertyAddress: initialData.propertyAddress || '',
    borrowerName: initialData.borrowerName || '',
    accountNumber: initialData.accountNumber || '',
    productType: initialData.productType || '',
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoCalculatePayment, setAutoCalculatePayment] = useState(true);
  const [autoCalculateMaturity, setAutoCalculateMaturity] = useState(true);

  // Calculate monthly payment using standard mortgage formula
  const calculateMonthlyPayment = useCallback((principal: number, rate: number, years: number): number => {
    if (principal <= 0 || rate <= 0 || years <= 0) return 0;
    
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = years * 12;
    
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    return Math.round(monthlyPayment * 100) / 100; // Round to 2 decimal places
  }, []);

  // Calculate maturity date from start date and term
  const calculateMaturityDate = useCallback((startDate: string, termYears: number): string => {
    if (!startDate || termYears <= 0) return '';
    
    try {
      const start = new Date(startDate);
      const maturity = new Date(start);
      maturity.setFullYear(start.getFullYear() + termYears);
      return maturity.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch (error) {
      return '';
    }
  }, []);

  // Auto-calculate monthly payment when relevant fields change
  useEffect(() => {
    if (autoCalculatePayment && formData.amount > 0 && formData.interestRate > 0 && formData.termYears > 0) {
      const calculatedPayment = calculateMonthlyPayment(formData.amount, formData.interestRate, formData.termYears);
      if (calculatedPayment !== formData.monthlyPayment) {
        setFormData(prev => ({ ...prev, monthlyPayment: calculatedPayment }));
      }
    }
  }, [formData.amount, formData.interestRate, formData.termYears, autoCalculatePayment, calculateMonthlyPayment]);

  // Auto-calculate maturity date when start date or term changes
  useEffect(() => {
    if (autoCalculateMaturity && formData.startDate && formData.termYears > 0) {
      const calculatedMaturity = calculateMaturityDate(formData.startDate, formData.termYears);
      if (calculatedMaturity && calculatedMaturity !== formData.maturityDate) {
        setFormData(prev => ({ ...prev, maturityDate: calculatedMaturity }));
      }
    }
  }, [formData.startDate, formData.termYears, autoCalculateMaturity, calculateMaturityDate]);

  const handleInputChange = useCallback((field: keyof MortgageDocumentData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  }, [errors.length]);

  const validateForm = useCallback((): boolean => {
    const validationErrors = mortgageDocumentService.validateMortgageData(formData);
    setErrors(validationErrors);
    return validationErrors.length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await mortgageDocumentService.saveMortgageData(propertyId, formData);
      onSave?.(formData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save mortgage data';
      setErrors([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [formData, propertyId, onSave, validateForm]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Enter Mortgage Details</h3>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primary Mortgage Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="lender" className="block text-sm font-medium text-gray-700 mb-2">
                Lender *
              </label>
              <input
                type="text"
                id="lender"
                value={formData.lender}
                onChange={(e) => handleInputChange('lender', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="e.g., Halifax, Barclays, Nationwide"
                required
              />
            </div>

            <div>
              <label htmlFor="productType" className="block text-sm font-medium text-gray-700 mb-2">
                Product Type
              </label>
              <select
                id="productType"
                value={formData.productType}
                onChange={(e) => handleInputChange('productType', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select product type</option>
                {PRODUCT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Mortgage Amount (£) *
              </label>
              <input
                type="number"
                id="amount"
                value={formData.amount || ''}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="250000"
                min="0"
                step="1000"
                required
              />
            </div>

            <div>
              <label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate (%) *
              </label>
              <input
                type="number"
                id="interestRate"
                value={formData.interestRate || ''}
                onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="3.5"
                min="0"
                max="100"
                step="0.01"
                required
              />
            </div>

            <div>
              <label htmlFor="termYears" className="block text-sm font-medium text-gray-700 mb-2">
                Term (Years) *
              </label>
              <input
                type="number"
                id="termYears"
                value={formData.termYears || ''}
                onChange={(e) => handleInputChange('termYears', parseInt(e.target.value) || 0)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="25"
                min="1"
                max="50"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="monthlyPayment" className="block text-sm font-medium text-gray-700">
                  Monthly Payment (£) *
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoCalculatePayment"
                    checked={autoCalculatePayment}
                    onChange={(e) => setAutoCalculatePayment(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoCalculatePayment" className="ml-2 text-sm text-gray-600">
                    Auto-calculate
                  </label>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  id="monthlyPayment"
                  value={formData.monthlyPayment || ''}
                  onChange={(e) => handleInputChange('monthlyPayment', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="1250"
                  min="0"
                  step="0.01"
                  disabled={autoCalculatePayment}
                  required
                />
                {autoCalculatePayment && formData.monthlyPayment > 0 && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <CalculatorIcon className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
              {autoCalculatePayment && formData.monthlyPayment > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Calculated: {formatCurrency(formData.monthlyPayment)}
                </p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="maturityDate" className="block text-sm font-medium text-gray-700">
                  Maturity Date
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoCalculateMaturity"
                    checked={autoCalculateMaturity}
                    onChange={(e) => setAutoCalculateMaturity(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoCalculateMaturity" className="ml-2 text-sm text-gray-600">
                    Auto-calculate
                  </label>
                </div>
              </div>
              <input
                type="date"
                id="maturityDate"
                value={formData.maturityDate}
                onChange={(e) => handleInputChange('maturityDate', e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                disabled={autoCalculateMaturity}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="propertyAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Property Address
              </label>
              <textarea
                id="propertyAddress"
                value={formData.propertyAddress}
                onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Enter the full property address"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="borrowerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Borrower Name
                </label>
                <input
                  type="text"
                  id="borrowerName"
                  value={formData.borrowerName}
                  onChange={(e) => handleInputChange('borrowerName', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Primary borrower name"
                />
              </div>

              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Account/Reference Number
                </label>
                <input
                  type="text"
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Mortgage account number"
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Please correct the following errors:
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save Mortgage Details'}
            </button>
          </div>
        </form>
      </div>

      {/* Calculation Info */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h5 className="text-sm font-medium text-blue-900 mb-2">Auto-calculation features:</h5>
        <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
          <li><strong>Monthly Payment:</strong> Calculated using principal, interest rate, and term</li>
          <li><strong>Maturity Date:</strong> Calculated by adding term years to start date</li>
          <li>You can disable auto-calculation and enter values manually</li>
          <li>All calculations use standard mortgage formulas</li>
        </ul>
      </div>
    </div>
  );
} 