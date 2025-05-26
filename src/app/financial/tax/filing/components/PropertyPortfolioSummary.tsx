"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { currencyFormatter } from '@/lib/formatters';

interface Property {
  id: string;
  address: string;
  income: number;
}

interface PropertyPortfolioSummaryProps {
  properties: Property[];
  isLoading?: boolean;
}

export function PropertyPortfolioSummary({
  properties,
  isLoading = false
}: PropertyPortfolioSummaryProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-md p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }
  
  const propertyCount = properties.length;
  const totalIncome = properties.reduce((sum, property) => sum + property.income, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-900">Property Portfolio Summary</h3>
      </div>
      <div className="px-4 py-4 sm:p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">
              {propertyCount} {propertyCount === 1 ? 'Property' : 'Properties'} included in this return
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              Total Income: {currencyFormatter.format(totalIncome)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            {isExpanded ? 'Hide Details' : 'View Details'}
          </button>
        </div>
        
        {isExpanded && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <ul className="divide-y divide-gray-200">
              {properties.map((property) => (
                <li key={property.id} className="py-3">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900">{property.address}</p>
                    <p className="text-sm text-gray-500">{currencyFormatter.format(property.income)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-right">
              <button
                type="button"
                onClick={() => router.push('/financial/tax/properties')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Edit Properties
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
