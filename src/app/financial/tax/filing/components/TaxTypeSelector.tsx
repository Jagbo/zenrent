"use client";

import React from 'react';

export type TaxType = 'property-income' | 'vat' | 'self-assessment';

// Note: Property income is a component of Self Assessment for landlords

interface TaxTypeSelectorProps {
  selectedType: TaxType;
  onChange: (type: TaxType) => void;
}

export function TaxTypeSelector({ selectedType, onChange }: TaxTypeSelectorProps) {
  return (
    <div className="mb-6">
      <div className="sm:hidden">
        <label htmlFor="tax-type-selector" className="sr-only">
          Select a tax type
        </label>
        <select
          id="tax-type-selector"
          name="tax-type"
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          value={selectedType}
          onChange={(e) => onChange(e.target.value as TaxType)}
        >
          <option value="self-assessment">Self Assessment</option>
          <option value="property-income">Property Income (SA105)</option>
          <option value="vat">VAT</option>
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => onChange('self-assessment')}
              className={`${
                selectedType === 'self-assessment'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Self Assessment
            </button>
            <button
              onClick={() => onChange('vat')}
              className={`${
                selectedType === 'vat'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              VAT
            </button>
            <button
              onClick={() => onChange('property-income')}
              className={`${
                selectedType === 'property-income'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Property Income (SA105)
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
