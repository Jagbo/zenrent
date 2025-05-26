/**
 * Contextual Guidance Component
 * Provides step-by-step guidance and tips throughout the tax submission process
 */

import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  CheckCircle, 
  AlertCircle,
  BookOpen,
  Calculator,
  FileText,
  HelpCircle,
  Target,
  Clock
} from 'lucide-react';

export interface GuidanceStep {
  id: string;
  title: string;
  content: string;
  type: 'tip' | 'warning' | 'info' | 'calculation' | 'example';
  icon?: React.ReactNode;
  actions?: {
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }[];
  estimatedTime?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  relatedFields?: string[];
}

export interface GuidanceTour {
  id: string;
  title: string;
  description: string;
  steps: GuidanceStep[];
  category: 'getting-started' | 'income' | 'expenses' | 'calculations' | 'submission';
  estimatedDuration?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface ContextualGuidanceProps {
  tour?: GuidanceTour;
  currentStep?: number;
  isVisible?: boolean;
  onClose?: () => void;
  onStepChange?: (stepIndex: number) => void;
  onComplete?: () => void;
  position?: 'sidebar' | 'overlay' | 'inline';
  className?: string;
}

export const ContextualGuidance: React.FC<ContextualGuidanceProps> = ({
  tour,
  currentStep = 0,
  isVisible = true,
  onClose,
  onStepChange,
  onComplete,
  position = 'sidebar',
  className = ''
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(currentStep);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    setActiveStepIndex(currentStep);
  }, [currentStep]);

  if (!tour || !isVisible) return null;

  const activeStep = tour.steps[activeStepIndex];
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = activeStepIndex === tour.steps.length - 1;
  const progress = ((activeStepIndex + 1) / tour.steps.length) * 100;

  const getStepIcon = (step: GuidanceStep) => {
    if (step.icon) return step.icon;
    
    switch (step.type) {
      case 'tip':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'calculation':
        return <Calculator className="w-5 h-5 text-blue-500" />;
      case 'example':
        return <FileText className="w-5 h-5 text-green-500" />;
      default:
        return <HelpCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStepTypeClasses = (type: GuidanceStep['type']) => {
    switch (type) {
      case 'tip':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'calculation':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'example':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'hard':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleNextStep = () => {
    if (!isLastStep) {
      const newIndex = activeStepIndex + 1;
      setActiveStepIndex(newIndex);
      setCompletedSteps(prev => new Set([...prev, activeStepIndex]));
      onStepChange?.(newIndex);
    } else {
      setCompletedSteps(prev => new Set([...prev, activeStepIndex]));
      onComplete?.();
    }
  };

  const handlePreviousStep = () => {
    if (!isFirstStep) {
      const newIndex = activeStepIndex - 1;
      setActiveStepIndex(newIndex);
      onStepChange?.(newIndex);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setActiveStepIndex(stepIndex);
    onStepChange?.(stepIndex);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'overlay':
        return 'fixed top-4 right-4 z-50 max-w-md';
      case 'inline':
        return 'w-full';
      case 'sidebar':
      default:
        return 'w-80 h-full';
    }
  };

  if (isMinimized && position !== 'inline') {
    return (
      <div className={`${getPositionClasses()} ${className}`}>
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-blue-600 text-white p-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-sm font-medium">Guide</span>
          <span className="text-xs bg-blue-500 px-2 py-1 rounded">
            {activeStepIndex + 1}/{tour.steps.length}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${getPositionClasses()} ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{tour.title}</h3>
              <p className="text-xs text-gray-600">{tour.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {position !== 'inline' && (
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Minimize guide"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close guide"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Step {activeStepIndex + 1} of {tour.steps.length}</span>
            {tour.estimatedDuration && (
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {tour.estimatedDuration}
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step navigation */}
      <div className="p-3 border-b border-gray-100 bg-gray-25">
        <div className="flex space-x-1 overflow-x-auto">
          {tour.steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleStepClick(index)}
              className={`flex-shrink-0 w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 ${
                index === activeStepIndex
                  ? 'bg-blue-600 text-white'
                  : completedSteps.has(index)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
              title={step.title}
            >
              {completedSteps.has(index) ? (
                <CheckCircle className="w-4 h-4 mx-auto" />
              ) : (
                index + 1
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Active step content */}
      <div className="p-4 flex-1 overflow-y-auto">
        <div className={`p-3 rounded-lg border ${getStepTypeClasses(activeStep.type)}`}>
          <div className="flex items-start space-x-3">
            {getStepIcon(activeStep)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">{activeStep.title}</h4>
                {activeStep.difficulty && (
                  <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(activeStep.difficulty)}`}>
                    {activeStep.difficulty}
                  </span>
                )}
              </div>
              
              <div className="text-sm leading-relaxed mb-3">
                {activeStep.content.split('\n').map((paragraph, index) => (
                  <p key={index} className={index > 0 ? 'mt-2' : ''}>
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Estimated time */}
              {activeStep.estimatedTime && (
                <div className="flex items-center text-xs text-current mb-3">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>Estimated time: {activeStep.estimatedTime}</span>
                </div>
              )}

              {/* Related fields */}
              {activeStep.relatedFields && activeStep.relatedFields.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium mb-1">Related fields:</p>
                  <div className="flex flex-wrap gap-1">
                    {activeStep.relatedFields.map((field, index) => (
                      <span
                        key={index}
                        className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded border border-current border-opacity-20"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Step actions */}
              {activeStep.actions && activeStep.actions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeStep.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className={`text-xs px-3 py-1.5 rounded transition-colors ${
                        action.variant === 'primary'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-white bg-opacity-50 hover:bg-opacity-75 border border-current border-opacity-20'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation controls */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePreviousStep}
            disabled={isFirstStep}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="text-xs text-gray-500">
            {completedSteps.size} of {tour.steps.length} completed
          </div>

          <button
            onClick={handleNextStep}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <span>{isLastStep ? 'Complete' : 'Next'}</span>
            {!isLastStep && <ArrowRight className="w-4 h-4" />}
            {isLastStep && <CheckCircle className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

// Predefined guidance tours for tax scenarios
export const TaxGuidanceTours: Record<string, GuidanceTour> = {
  gettingStarted: {
    id: 'getting-started',
    title: 'Getting Started with Tax Submission',
    description: 'Learn the basics of submitting your tax return',
    category: 'getting-started',
    estimatedDuration: '10 minutes',
    difficulty: 'beginner',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Tax Submission',
        content: 'This guide will walk you through the process of submitting your tax return to HMRC. We\'ll cover everything from entering your personal details to final submission.',
        type: 'info',
        estimatedTime: '1 minute',
        difficulty: 'easy'
      },
      {
        id: 'personal-details',
        title: 'Personal Details',
        content: 'Start by entering your personal information including your UTR number, National Insurance number, and contact details. This information must match your HMRC records exactly.',
        type: 'tip',
        estimatedTime: '3 minutes',
        difficulty: 'easy',
        relatedFields: ['UTR Number', 'National Insurance Number', 'Address']
      },
      {
        id: 'income-overview',
        title: 'Income Information',
        content: 'Next, you\'ll enter your income from various sources. For property landlords, this includes rental income, premiums, and other property-related income.',
        type: 'info',
        estimatedTime: '5 minutes',
        difficulty: 'medium',
        relatedFields: ['Rental Income', 'Property Premiums', 'Other Income']
      },
      {
        id: 'expenses-overview',
        title: 'Allowable Expenses',
        content: 'You can deduct legitimate business expenses from your rental income. Common expenses include repairs, maintenance, insurance, and professional fees.',
        type: 'tip',
        estimatedTime: '5 minutes',
        difficulty: 'medium',
        relatedFields: ['Repairs', 'Maintenance', 'Insurance', 'Professional Fees']
      },
      {
        id: 'review-submit',
        title: 'Review and Submit',
        content: 'Finally, review all your information carefully before submitting. Once submitted, you can only make changes by filing an amendment.',
        type: 'warning',
        estimatedTime: '2 minutes',
        difficulty: 'easy'
      }
    ]
  },

  propertyIncome: {
    id: 'property-income',
    title: 'Understanding Property Income',
    description: 'Learn what counts as property income and how to report it',
    category: 'income',
    estimatedDuration: '15 minutes',
    difficulty: 'intermediate',
    steps: [
      {
        id: 'rental-income-basics',
        title: 'Rental Income Basics',
        content: 'Rental income includes all money received from tenants for the use of your property. This includes rent, service charges, and any deposits you keep.',
        type: 'info',
        estimatedTime: '3 minutes',
        difficulty: 'easy'
      },
      {
        id: 'premiums-explained',
        title: 'Premiums of Lease Grant',
        content: 'If you receive a premium for granting a lease of 50 years or less, part of this may be taxable as income rather than capital.',
        type: 'calculation',
        estimatedTime: '5 minutes',
        difficulty: 'hard'
      },
      {
        id: 'other-income-types',
        title: 'Other Property Income',
        content: 'This includes income from furnished holiday lettings, rent-a-room scheme, and any other property-related income not covered elsewhere.',
        type: 'example',
        estimatedTime: '4 minutes',
        difficulty: 'medium'
      },
      {
        id: 'timing-of-income',
        title: 'When to Report Income',
        content: 'Report income in the tax year it was due, not necessarily when you received it. This is called the "accruals basis".',
        type: 'warning',
        estimatedTime: '3 minutes',
        difficulty: 'medium'
      }
    ]
  },

  allowableExpenses: {
    id: 'allowable-expenses',
    title: 'Claiming Allowable Expenses',
    description: 'Maximize your tax efficiency by understanding allowable expenses',
    category: 'expenses',
    estimatedDuration: '20 minutes',
    difficulty: 'intermediate',
    steps: [
      {
        id: 'expense-principles',
        title: 'Expense Principles',
        content: 'You can deduct expenses that are wholly and exclusively for your property business. The expense must be necessary for earning rental income.',
        type: 'info',
        estimatedTime: '3 minutes',
        difficulty: 'easy'
      },
      {
        id: 'repairs-vs-improvements',
        title: 'Repairs vs Improvements',
        content: 'Repairs maintain the property in its current condition and are deductible. Improvements enhance the property and are not deductible as expenses.',
        type: 'warning',
        estimatedTime: '5 minutes',
        difficulty: 'hard'
      },
      {
        id: 'property-allowance',
        title: 'Property Income Allowance',
        content: 'You can choose to use the £1,000 property income allowance instead of claiming actual expenses. Choose whichever gives you the lower tax bill.',
        type: 'calculation',
        estimatedTime: '4 minutes',
        difficulty: 'medium'
      },
      {
        id: 'capital-allowances',
        title: 'Capital Allowances',
        content: 'Claim capital allowances on furniture, equipment, and fixtures used in your property business. This includes items in furnished lettings.',
        type: 'tip',
        estimatedTime: '5 minutes',
        difficulty: 'medium'
      },
      {
        id: 'record-keeping',
        title: 'Record Keeping',
        content: 'Keep detailed records of all expenses with receipts and invoices. HMRC may ask to see these records for up to 6 years.',
        type: 'warning',
        estimatedTime: '3 minutes',
        difficulty: 'easy'
      }
    ]
  }
};

// Hook for managing guidance state
export const useGuidance = () => {
  const [activeTour, setActiveTour] = useState<GuidanceTour | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [completedTours, setCompletedTours] = useState<Set<string>>(new Set());

  const startTour = (tourId: string) => {
    const tour = TaxGuidanceTours[tourId];
    if (tour) {
      setActiveTour(tour);
      setCurrentStep(0);
      setIsVisible(true);
    }
  };

  const closeTour = () => {
    setIsVisible(false);
    setActiveTour(null);
    setCurrentStep(0);
  };

  const completeTour = () => {
    if (activeTour) {
      setCompletedTours(prev => new Set([...prev, activeTour.id]));
      closeTour();
    }
  };

  const nextStep = () => {
    if (activeTour && currentStep < activeTour.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (activeTour && stepIndex >= 0 && stepIndex < activeTour.steps.length) {
      setCurrentStep(stepIndex);
    }
  };

  return {
    activeTour,
    currentStep,
    isVisible,
    completedTours,
    startTour,
    closeTour,
    completeTour,
    nextStep,
    previousStep,
    goToStep
  };
}; 