"use client";

import React from 'react';

interface SelfAssessmentFormProps {
  formData: any;
  onChange: (data: any) => void;
  errors: any;
  obligationData: any;
}

export function SelfAssessmentForm({
  formData,
  onChange,
  errors,
  obligationData
}: SelfAssessmentFormProps) {
  // Ensure formData is an object
  const safeFormData = formData || {};
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Self Assessment Adjustments</h3>
        <p className="text-xs text-gray-500 mb-4">
          Enter any additional adjustments for the tax year {obligationData?.taxYear || '2025-26'}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="capitalAllowances" className="block text-sm font-medium text-gray-700">
            Capital Allowances
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">£</span>
            </div>
            <input
              type="number"
              name="capitalAllowances"
              id="capitalAllowances"
              value={safeFormData.capitalAllowances || ''}
              onChange={handleChange}
              className="block w-full pl-7 pr-12 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="privateUseAdjustment" className="block text-sm font-medium text-gray-700">
            Private Use Adjustment
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">£</span>
            </div>
            <input
              type="number"
              name="privateUseAdjustment"
              id="privateUseAdjustment"
              value={safeFormData.privateUseAdjustment || ''}
              onChange={handleChange}
              className="block w-full pl-7 pr-12 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="balancingCharges" className="block text-sm font-medium text-gray-700">
            Balancing Charges
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">£</span>
            </div>
            <input
              type="number"
              name="balancingCharges"
              id="balancingCharges"
              value={safeFormData.balancingCharges || ''}
              onChange={handleChange}
              className="block w-full pl-7 pr-12 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="rentARoom" className="block text-sm font-medium text-gray-700">
            Rent A Room Relief
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">£</span>
            </div>
            <input
              type="number"
              name="rentARoom"
              id="rentARoom"
              value={safeFormData.rentARoom || ''}
              onChange={handleChange}
              className="block w-full pl-7 pr-12 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="propertyAllowance" className="block text-sm font-medium text-gray-700">
            Property Allowance
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">£</span>
            </div>
            <input
              type="number"
              name="propertyAllowance"
              id="propertyAllowance"
              value={safeFormData.propertyAllowance || ''}
              onChange={handleChange}
              className="block w-full pl-7 pr-12 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Additional Notes
          </label>
          <div className="mt-1">
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={safeFormData.notes || ''}
              onChange={(e) => onChange({ notes: e.target.value })}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              placeholder="Any additional information you'd like to include"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Adjustments Summary</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Adjustments:</p>
            <p className="text-sm font-medium">
              £{(
                parseFloat(safeFormData.capitalAllowances || 0) +
                parseFloat(safeFormData.privateUseAdjustment || 0) +
                parseFloat(safeFormData.balancingCharges || 0) +
                parseFloat(safeFormData.rentARoom || 0) +
                parseFloat(safeFormData.propertyAllowance || 0)
              ).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
