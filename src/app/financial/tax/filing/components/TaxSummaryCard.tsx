"use client";

import React from 'react';
import { currencyFormatter } from '@/lib/formatters';

interface TaxSummaryCardProps {
  taxYear: string;
  taxType: string;
  totalIncome: number;
  totalExpenses: number;
  taxableProfit: number;
  isLoading?: boolean;
}

export function TaxSummaryCard({
  taxYear,
  taxType,
  totalIncome,
  totalExpenses,
  taxableProfit,
  isLoading = false
}: TaxSummaryCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-md p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Tax Return Summary</h3>
      </div>
      <div className="px-4 py-4 sm:p-6">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Tax Year</dt>
            <dd className="mt-1 text-sm text-gray-900">{taxYear}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Return Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{taxType}</dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-green-600 font-medium">Ready to Submit</dd>
          </div>
        </dl>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Key Figures</h4>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Property Income</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {currencyFormatter.format(totalIncome)}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Expenses</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {currencyFormatter.format(totalExpenses)}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Taxable Profit</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {currencyFormatter.format(taxableProfit)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
