"use client";

import React from 'react';

interface VatFormProps {
  formData: any;
  onChange: (data: any) => void;
  errors: any;
  obligationData: any;
}

export function VatForm({
  formData,
  onChange,
  errors,
  obligationData
}: VatFormProps) {
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">VAT Return Details</h3>
        <p className="text-xs text-gray-500 mb-4">
          Enter your VAT details for the period {new Date(obligationData.startDate).toLocaleDateString()} - {new Date(obligationData.endDate).toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="vatSales" className="block text-sm font-medium text-gray-700">
            VAT on Sales (Box 1)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">£</span>
            </div>
            <input
              type="number"
              name="vatSales"
              id="vatSales"
              value={formData.vatSales || ''}
              onChange={handleChange}
              className={`block w-full pl-7 pr-12 py-2 sm:text-sm rounded-md ${
                errors.vatSales ? 'border-red-300 text-red-900 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
              placeholder="0.00"
              aria-describedby="vatSales-error"
            />
          </div>
          {errors.vatSales && (
            <p className="mt-2 text-sm text-red-600" id="vatSales-error">
              {errors.vatSales}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="vatPurchases" className="block text-sm font-medium text-gray-700">
            VAT on Purchases (Box 4)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">£</span>
            </div>
            <input
              type="number"
              name="vatPurchases"
              id="vatPurchases"
              value={formData.vatPurchases || ''}
              onChange={handleChange}
              className={`block w-full pl-7 pr-12 py-2 sm:text-sm rounded-md ${
                errors.vatPurchases ? 'border-red-300 text-red-900 focus:outline-none focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
              placeholder="0.00"
              aria-describedby="vatPurchases-error"
            />
          </div>
          {errors.vatPurchases && (
            <p className="mt-2 text-sm text-red-600" id="vatPurchases-error">
              {errors.vatPurchases}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="totalSales" className="block text-sm font-medium text-gray-700">
            Total Value of Sales (Box 6)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">£</span>
            </div>
            <input
              type="number"
              name="totalSales"
              id="totalSales"
              value={formData.totalSales || ''}
              onChange={handleChange}
              className="block w-full pl-7 pr-12 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="totalPurchases" className="block text-sm font-medium text-gray-700">
            Total Value of Purchases (Box 7)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">£</span>
            </div>
            <input
              type="number"
              name="totalPurchases"
              id="totalPurchases"
              value={formData.totalPurchases || ''}
              onChange={handleChange}
              className="block w-full pl-7 pr-12 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="euSales" className="block text-sm font-medium text-gray-700">
            Total Value of EU Sales (Box 8)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">£</span>
            </div>
            <input
              type="number"
              name="euSales"
              id="euSales"
              value={formData.euSales || ''}
              onChange={handleChange}
              className="block w-full pl-7 pr-12 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label htmlFor="euPurchases" className="block text-sm font-medium text-gray-700">
            Total Value of EU Purchases (Box 9)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">£</span>
            </div>
            <input
              type="number"
              name="euPurchases"
              id="euPurchases"
              value={formData.euPurchases || ''}
              onChange={handleChange}
              className="block w-full pl-7 pr-12 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">VAT Summary</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">VAT on Sales:</p>
            <p className="text-sm font-medium">£{formData.vatSales || '0.00'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">VAT on Purchases:</p>
            <p className="text-sm font-medium">£{formData.vatPurchases || '0.00'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">VAT Due:</p>
            <p className="text-sm font-medium">
              £{((parseFloat(formData.vatSales || 0) - parseFloat(formData.vatPurchases || 0)) || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
