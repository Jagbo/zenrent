"use client";

import React from 'react';

interface PropertyIncomeFormProps {
  formData: any;
  onChange: (data: any) => void;
  errors: any;
  obligationData: any;
  section: 'income' | 'expenses';
}

export function PropertyIncomeForm({
  formData,
  onChange,
  errors,
  obligationData,
  section
}: PropertyIncomeFormProps) {
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  return (
    <div className="space-y-6">
      {section === 'income' ? (
        <>
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Property Income Details (SA105)</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter your property income for the period {new Date(obligationData.startDate).toLocaleDateString()} - {new Date(obligationData.endDate).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="propertyIncome" className="block text-sm font-medium text-gray-700">
                Property Income
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">£</span>
                </div>
                <input
                  type="number"
                  name="propertyIncome"
                  id="propertyIncome"
                  value={formData.propertyIncome || ''}
                  onChange={handleChange}
                  className={`block w-full pl-7 pr-12 py-2 sm:text-sm rounded-md ${
                    errors.propertyIncome ? 'border-red-300 text-red-900 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="0.00"
                  aria-describedby="propertyIncome-error"
                />
              </div>
              {errors.propertyIncome && (
                <p className="mt-2 text-sm text-red-600" id="propertyIncome-error">
                  {errors.propertyIncome}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="otherIncome" className="block text-sm font-medium text-gray-700">
                Other Income (Optional)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">£</span>
                </div>
                <input
                  type="number"
                  name="otherIncome"
                  id="otherIncome"
                  value={formData.otherIncome || ''}
                  onChange={handleChange}
                  className="block w-full pl-7 pr-12 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Property Expenses Details (SA105)</h3>
            <p className="text-xs text-gray-500 mb-4">
              Enter your property expenses for the period {new Date(obligationData.startDate).toLocaleDateString()} - {new Date(obligationData.endDate).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="propertyExpenses" className="block text-sm font-medium text-gray-700">
                Property Expenses
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">£</span>
                </div>
                <input
                  type="number"
                  name="propertyExpenses"
                  id="propertyExpenses"
                  value={formData.propertyExpenses || ''}
                  onChange={handleChange}
                  className={`block w-full pl-7 pr-12 py-2 sm:text-sm rounded-md ${
                    errors.propertyExpenses ? 'border-red-300 text-red-900 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="0.00"
                  aria-describedby="propertyExpenses-error"
                />
              </div>
              {errors.propertyExpenses && (
                <p className="mt-2 text-sm text-red-600" id="propertyExpenses-error">
                  {errors.propertyExpenses}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="maintenanceCosts" className="block text-sm font-medium text-gray-700">
                Maintenance Costs (Optional)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">£</span>
                </div>
                <input
                  type="number"
                  name="maintenanceCosts"
                  id="maintenanceCosts"
                  value={formData.maintenanceCosts || ''}
                  onChange={handleChange}
                  className="block w-full pl-7 pr-12 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="insuranceCosts" className="block text-sm font-medium text-gray-700">
                Insurance Costs (Optional)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">£</span>
                </div>
                <input
                  type="number"
                  name="insuranceCosts"
                  id="insuranceCosts"
                  value={formData.insuranceCosts || ''}
                  onChange={handleChange}
                  className="block w-full pl-7 pr-12 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label htmlFor="managementFees" className="block text-sm font-medium text-gray-700">
                Management Fees (Optional)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">£</span>
                </div>
                <input
                  type="number"
                  name="managementFees"
                  id="managementFees"
                  value={formData.managementFees || ''}
                  onChange={handleChange}
                  className="block w-full pl-7 pr-12 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
