"use client";

import React from 'react';
import { TaxType } from '../TaxTypeSelector';

interface ReviewStepProps {
  formData: any;
  taxType: TaxType;
  obligationData: any;
}

export function ReviewStep({
  formData,
  taxType,
  obligationData
}: ReviewStepProps) {
  // Format currency
  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `£${(num || 0).toFixed(2)}`;
  };

  // Render VAT review
  const renderVatReview = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500">VAT on Sales (Box 1)</h4>
          <p className="text-base font-medium">{formatCurrency(formData.vatSales)}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">VAT on Purchases (Box 4)</h4>
          <p className="text-base font-medium">{formatCurrency(formData.vatPurchases)}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Total Value of Sales (Box 6)</h4>
          <p className="text-base font-medium">{formatCurrency(formData.totalSales)}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Total Value of Purchases (Box 7)</h4>
          <p className="text-base font-medium">{formatCurrency(formData.totalPurchases)}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Total Value of EU Sales (Box 8)</h4>
          <p className="text-base font-medium">{formatCurrency(formData.euSales)}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Total Value of EU Purchases (Box 9)</h4>
          <p className="text-base font-medium">{formatCurrency(formData.euPurchases)}</p>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">VAT Summary</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">VAT on Sales:</p>
            <p className="text-sm font-medium">{formatCurrency(formData.vatSales)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">VAT on Purchases:</p>
            <p className="text-sm font-medium">{formatCurrency(formData.vatPurchases)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">VAT Due:</p>
            <p className="text-sm font-medium">
              {formatCurrency(parseFloat(formData.vatSales || 0) - parseFloat(formData.vatPurchases || 0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Property Income review (SA105)
  const renderPropertyIncomeReview = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Property Income</h4>
          <p className="text-base font-medium">{formatCurrency(formData.propertyIncome)}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Other Income</h4>
          <p className="text-base font-medium">{formatCurrency(formData.otherIncome)}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Property Expenses</h4>
          <p className="text-base font-medium">{formatCurrency(formData.propertyExpenses)}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Maintenance Costs</h4>
          <p className="text-base font-medium">{formatCurrency(formData.maintenanceCosts)}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Insurance Costs</h4>
          <p className="text-base font-medium">{formatCurrency(formData.insuranceCosts)}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Management Fees</h4>
          <p className="text-base font-medium">{formatCurrency(formData.managementFees)}</p>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Income Summary</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Income:</p>
            <p className="text-sm font-medium">
              {formatCurrency(
                parseFloat(formData.propertyIncome || 0) + 
                parseFloat(formData.otherIncome || 0)
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Expenses:</p>
            <p className="text-sm font-medium">
              {formatCurrency(
                parseFloat(formData.propertyExpenses || 0) + 
                parseFloat(formData.maintenanceCosts || 0) + 
                parseFloat(formData.insuranceCosts || 0) + 
                parseFloat(formData.managementFees || 0)
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Net Profit:</p>
            <p className="text-sm font-medium">
              {formatCurrency(
                (parseFloat(formData.propertyIncome || 0) + parseFloat(formData.otherIncome || 0)) - 
                (parseFloat(formData.propertyExpenses || 0) + parseFloat(formData.maintenanceCosts || 0) + 
                parseFloat(formData.insuranceCosts || 0) + parseFloat(formData.managementFees || 0))
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Self Assessment review
  const renderSelfAssessmentReview = () => (
    <div className="space-y-4">
      {/* Include Property Income review (SA105) */}
      {renderPropertyIncomeReview()}

      {/* Additional Self Assessment fields */}
      <div className="mt-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">Adjustments</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Capital Allowances</h4>
            <p className="text-base font-medium">{formatCurrency(formData.capitalAllowances)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Private Use Adjustment</h4>
            <p className="text-base font-medium">{formatCurrency(formData.privateUseAdjustment)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Balancing Charges</h4>
            <p className="text-base font-medium">{formatCurrency(formData.balancingCharges)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Rent A Room Relief</h4>
            <p className="text-base font-medium">{formatCurrency(formData.rentARoom)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Property Allowance</h4>
            <p className="text-base font-medium">{formatCurrency(formData.propertyAllowance)}</p>
          </div>
        </div>

        {formData.notes && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-500">Additional Notes</h4>
            <p className="text-sm mt-1 text-gray-700">{formData.notes}</p>
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Final Summary</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Adjustments:</p>
            <p className="text-sm font-medium">
              {formatCurrency(
                parseFloat(formData.capitalAllowances || 0) +
                parseFloat(formData.privateUseAdjustment || 0) +
                parseFloat(formData.balancingCharges || 0) +
                parseFloat(formData.rentARoom || 0) +
                parseFloat(formData.propertyAllowance || 0)
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Review Your Submission</h3>
        <p className="text-xs text-gray-500 mb-4">
          Please review the information below before submitting to HMRC.
        </p>
      </div>

      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-base font-medium text-gray-900 mb-4">Submission Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Tax Type</h4>
            <p className="text-base font-medium capitalize">{taxType.replace('-', ' ')}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Period</h4>
            <p className="text-base font-medium">
              {new Date(obligationData.startDate).toLocaleDateString()} - {new Date(obligationData.endDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
            <p className="text-base font-medium">{new Date(obligationData.dueDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 pb-4">
        {taxType === 'vat' && renderVatReview()}
        {taxType === 'property-income' && renderPropertyIncomeReview()}
        {taxType === 'self-assessment' && renderSelfAssessmentReview()}
      </div>

      <div className="bg-yellow-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                By submitting this information to HMRC, you confirm that the details provided are correct and complete to the best of your knowledge.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
