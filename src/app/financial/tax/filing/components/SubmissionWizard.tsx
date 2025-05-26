"use client";

import React, { useState, useEffect } from 'react';
import { TaxType } from './TaxTypeSelector';
import { SubmissionTransition } from './SubmissionTransition';
// Import individual components directly to fix module resolution issues
import { PropertyIncomeForm } from './wizard-steps/PropertyIncomeForm';
import { VatForm } from './wizard-steps/VatForm';
import { SelfAssessmentForm } from './wizard-steps/SelfAssessmentForm';
import { ReviewStep } from './wizard-steps/ReviewStep';
import { SubmissionResult } from './wizard-steps/SubmissionResult';

interface SubmissionWizardProps {
  taxType: TaxType;
  obligationData: any;
  initialData?: any;
  onSaveDraft: (data: any) => void;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

// Define the wizard steps based on tax type
const getSteps = (taxType: TaxType) => {
  const commonSteps = [
    { id: 'review', name: 'Review' },
    { id: 'submit', name: 'Submit' },
    { id: 'result', name: 'Result' }
  ];
  
  if (taxType === 'vat') {
    return [
      { id: 'details', name: 'VAT Details' },
      ...commonSteps
    ];
  } else if (taxType === 'self-assessment') {
    return [
      { id: 'income', name: 'Income' },
      { id: 'expenses', name: 'Expenses' },
      { id: 'adjustments', name: 'Adjustments' },
      ...commonSteps
    ];
  } else {
    // Property income (SA105)
    return [
      { id: 'income', name: 'Property Income' },
      { id: 'expenses', name: 'Property Expenses' },
      ...commonSteps
    ];
  }
};

export function SubmissionWizard({
  taxType,
  obligationData,
  initialData,
  onSaveDraft,
  onSubmit,
  onCancel
}: SubmissionWizardProps) {
  // State
  const [showTransition, setShowTransition] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<any>(initialData || {});
  const [validationErrors, setValidationErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  // Get steps based on tax type
  const steps = getSteps(taxType);
  const currentStep = steps[currentStepIndex];
  
  // Handle form data changes
  const handleFormChange = (newData: any) => {
    setFormData((prevData: any) => ({
      ...prevData,
      ...newData
    }));
    
    // Clear validation errors for changed fields
    const updatedErrors = { ...validationErrors };
    Object.keys(newData).forEach(key => {
      if (updatedErrors[key]) {
        delete updatedErrors[key];
      }
    });
    setValidationErrors(updatedErrors);
  };
  
  // Validate the current step
  const validateStep = (): boolean => {
    const errors: any = {};
    let isValid = true;
    
    // Validation logic based on step and tax type
    if (taxType === 'vat' && currentStep.id === 'details') {
      if (!formData.vatSales || formData.vatSales === '') {
        errors.vatSales = 'VAT on sales is required';
        isValid = false;
      }
      if (!formData.vatPurchases || formData.vatPurchases === '') {
        errors.vatPurchases = 'VAT on purchases is required';
        isValid = false;
      }
    } else if ((taxType === 'property-income' || taxType === 'self-assessment') && currentStep.id === 'income') {
      if (!formData.propertyIncome || formData.propertyIncome === '') {
        errors.propertyIncome = 'Property income is required';
        isValid = false;
      }
    } else if ((taxType === 'property-income' || taxType === 'self-assessment') && currentStep.id === 'expenses') {
      if (!formData.propertyExpenses || formData.propertyExpenses === '') {
        errors.propertyExpenses = 'Property expenses are required';
        isValid = false;
      }
    } else if (taxType === 'self-assessment' && currentStep.id === 'adjustments') {
      // No required fields for adjustments
    }
    
    setValidationErrors(errors);
    return isValid;
  };
  
  // Handle next button click
  const handleNext = () => {
    if (validateStep()) {
      // Save draft before moving to next step
      onSaveDraft(formData);
      
      // Move to next step
      setCurrentStepIndex(prevIndex => prevIndex + 1);
    }
  };
  
  // Handle previous button click
  const handlePrevious = () => {
    setCurrentStepIndex(prevIndex => prevIndex - 1);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (validateStep()) {
      setIsSubmitting(true);
      
      try {
        // Call the onSubmit function and store the result
        // The function might return void or a result object
        let submissionResponse: any;
        try {
          submissionResponse = await onSubmit(formData);
        } catch (submitError: any) {
          throw submitError; // Re-throw to be caught by the outer catch
        }
        
        // Use the response if it exists, otherwise use a default success object
        const defaultSuccess = {
          success: true,
          message: 'Your submission was successful.',
          reference: 'MTD-' + Date.now().toString()
        };
        
        setSubmissionResult(submissionResponse !== undefined ? submissionResponse : defaultSuccess);
      } catch (error: any) {
        setSubmissionResult({
          success: false,
          message: error?.message || 'Your submission failed. Please try again.',
          error: error
        });
      } finally {
        setIsSubmitting(false);
        // Move to result step
        setCurrentStepIndex(steps.length - 1);
      }
    }
  };
  
  // Handle save draft with timestamp
  const handleSaveDraft = () => {
    onSaveDraft(formData);
    const now = new Date();
    setLastSaved(now.toLocaleTimeString());
    
    // Show saved message for 3 seconds
    setTimeout(() => {
      setLastSaved(null);
    }, 3000);
  };
  
  // Render the current step
  const renderStep = () => {
    switch (currentStep.id) {
      case 'details':
        return (
          <VatForm
            formData={formData}
            onChange={handleFormChange}
            errors={validationErrors}
            obligationData={obligationData}
          />
        );
      case 'income':
        return (
          <PropertyIncomeForm
            formData={formData}
            onChange={handleFormChange}
            errors={validationErrors}
            obligationData={obligationData}
            section="income"
          />
        );
      case 'expenses':
        return (
          <PropertyIncomeForm
            formData={formData}
            onChange={handleFormChange}
            errors={validationErrors}
            obligationData={obligationData}
            section="expenses"
          />
        );
      case 'adjustments':
        return (
          <SelfAssessmentForm
            formData={formData}
            onChange={handleFormChange}
            errors={validationErrors}
            obligationData={obligationData}
          />
        );
      case 'review':
        return (
          <ReviewStep
            formData={formData}
            taxType={taxType}
            obligationData={obligationData}
          />
        );
      case 'result':
        return (
          <SubmissionResult
            result={submissionResult}
            taxType={taxType}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };
  
  // If showing transition screen
  if (showTransition) {
    return (
      <SubmissionTransition
        taxType={taxType}
        obligationData={obligationData}
        onContinue={() => setShowTransition(false)}
        onCancel={onCancel}
      />
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="pb-5">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center">
            {steps.map((step, index) => (
              <li key={step.id} className={`relative ${index === steps.length - 1 ? '' : 'pr-8 sm:pr-20'}`}>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className={`h-0.5 w-full ${index < currentStepIndex ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                </div>
                <button
                  type="button"
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                    index < currentStepIndex
                      ? 'bg-indigo-600 hover:bg-indigo-800'
                      : index === currentStepIndex
                      ? 'bg-indigo-600'
                      : 'bg-white border-2 border-gray-300'
                  } ${index <= currentStepIndex ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  onClick={() => {
                    if (index < currentStepIndex) {
                      setCurrentStepIndex(index);
                    }
                  }}
                >
                  {index < currentStepIndex ? (
                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className={`text-sm font-semibold ${index === currentStepIndex ? 'text-white' : 'text-gray-500'}`}>
                      {index + 1}
                    </span>
                  )}
                  <span className="sr-only">{step.name}</span>
                </button>
                <div className="hidden sm:block absolute left-4 top-8 mt-0.5 ml-4">
                  <span className="text-xs font-medium text-gray-500">{step.name}</span>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      
      {/* Current step content */}
      <div className="bg-white p-6 rounded-md border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">{currentStep.name}</h2>
          
          {/* Status badge */}
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              MTD Compliant
            </span>
            
            {lastSaved && (
              <span className="text-xs text-gray-500 animate-pulse">
                Draft saved at {lastSaved}
              </span>
            )}
          </div>
        </div>
        
        {/* Step content */}
        {renderStep()}
        
        {/* Help text based on step */}
        {currentStep.id !== 'result' && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-900">Help with this step</h4>
                <p className="mt-1 text-xs text-gray-500">
                  {currentStep.id === 'details' && 'Enter your VAT figures from your digital records for this period.'}
                  {currentStep.id === 'income' && 'Enter all property income received during this period. This will form part of your Self Assessment tax return (SA105 section).'}
                  {currentStep.id === 'expenses' && 'Enter all allowable expenses related to your properties for your Self Assessment tax return.'}
                  {currentStep.id === 'adjustments' && 'Enter any adjustments, allowances or reliefs you wish to claim on your Self Assessment tax return.'}
                  {currentStep.id === 'review' && 'Review all information carefully before submitting your Self Assessment tax return to HMRC.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between pt-5">
        {currentStep.id === 'result' ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Return to Dashboard
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
            className={`rounded-md px-3.5 py-2.5 text-sm font-semibold shadow-sm ${
              currentStepIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
            }`}
          >
            {currentStepIndex === 0 ? 'Cancel' : 'Previous'}
          </button>
        )}
        
        <div className="flex space-x-3">
          {currentStep.id !== 'result' && (
            <button
              type="button"
              onClick={handleSaveDraft}
              className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Save Draft
            </button>
          )}
          
          {currentStep.id !== 'result' && (
            currentStep.id === 'review' ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit to HMRC'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Next
              </button>
            )
          )}
          
          {currentStep.id === 'result' && submissionResult?.success && (
            <button
              type="button"
              onClick={() => window.location.href = '/financial/tax/filing/submissions'}
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              View Submission History
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
