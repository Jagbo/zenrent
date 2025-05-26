/**
 * Progress Indicator Component
 * Shows user progress through the tax submission flow
 */

import React from 'react';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';

export interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed' | 'error';
  required: boolean;
  estimatedTime?: string;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStepId: string;
  showEstimatedTime?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStepId,
  showEstimatedTime = true,
  orientation = 'horizontal',
  className = ''
}) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStepId);
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  const getStepIcon = (step: ProgressStep, index: number) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'current':
        return <Clock className="w-6 h-6 text-blue-600 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Circle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStepClasses = (step: ProgressStep, index: number) => {
    const baseClasses = 'flex items-center p-4 rounded-lg border transition-all duration-200';
    
    switch (step.status) {
      case 'completed':
        return `${baseClasses} bg-green-50 border-green-200 text-green-800`;
      case 'current':
        return `${baseClasses} bg-blue-50 border-blue-200 text-blue-800 ring-2 ring-blue-300`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-200 text-red-800`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-200 text-gray-600`;
    }
  };

  const getConnectorClasses = (index: number) => {
    const isCompleted = index < currentStepIndex;
    const baseClasses = orientation === 'horizontal' 
      ? 'flex-1 h-1 mx-2' 
      : 'w-1 h-8 mx-auto my-2';
    
    return `${baseClasses} ${isCompleted ? 'bg-green-400' : 'bg-gray-300'} rounded-full`;
  };

  if (orientation === 'vertical') {
    return (
      <div className={`space-y-2 ${className}`}>
        {/* Progress Summary */}
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Tax Submission Progress</h3>
            <span className="text-sm text-gray-600">
              {completedSteps} of {totalSteps} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {showEstimatedTime && (
            <p className="text-sm text-gray-600 mt-2">
              Estimated time remaining: {steps
                .slice(currentStepIndex)
                .reduce((total, step) => total + parseInt(step.estimatedTime || '5'), 0)} minutes
            </p>
          )}
        </div>

        {/* Steps */}
        {steps.map((step, index) => (
          <div key={step.id} className="relative">
            <div className={getStepClasses(step, index)}>
              <div className="flex items-start space-x-3">
                {getStepIcon(step, index)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium truncate">{step.title}</h4>
                    {step.required && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                  {showEstimatedTime && step.estimatedTime && step.status === 'current' && (
                    <p className="text-xs text-blue-600 mt-1">
                      Estimated time: {step.estimatedTime}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Connector */}
            {index < steps.length - 1 && (
              <div className={getConnectorClasses(index)} />
            )}
          </div>
        ))}
      </div>
    );
  }

  // Horizontal layout
  return (
    <div className={`${className}`}>
      {/* Progress Summary */}
      <div className="mb-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Tax Submission Progress</h3>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="text-sm text-gray-600">
          Step {currentStepIndex + 1} of {totalSteps}: {steps[currentStepIndex]?.title}
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center space-y-2">
              <div className={`p-2 rounded-full ${
                step.status === 'completed' ? 'bg-green-100' :
                step.status === 'current' ? 'bg-blue-100' :
                step.status === 'error' ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {getStepIcon(step, index)}
              </div>
              <div className="text-center max-w-24">
                <p className="text-xs font-medium text-gray-900 truncate">{step.title}</p>
                {step.status === 'current' && showEstimatedTime && step.estimatedTime && (
                  <p className="text-xs text-blue-600">{step.estimatedTime}</p>
                )}
              </div>
            </div>
            
            {/* Connector */}
            {index < steps.length - 1 && (
              <div className={getConnectorClasses(index)} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Hook for managing progress state
export const useProgressIndicator = (initialSteps: ProgressStep[]) => {
  const [steps, setSteps] = React.useState<ProgressStep[]>(initialSteps);
  const [currentStepId, setCurrentStepId] = React.useState<string>(
    initialSteps.find(step => step.status === 'current')?.id || initialSteps[0]?.id
  );

  const updateStepStatus = (stepId: string, status: ProgressStep['status']) => {
    setSteps(prevSteps => 
      prevSteps.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const goToStep = (stepId: string) => {
    setCurrentStepId(stepId);
    updateStepStatus(stepId, 'current');
  };

  const completeStep = (stepId: string) => {
    updateStepStatus(stepId, 'completed');
    
    // Move to next step
    const currentIndex = steps.findIndex(step => step.id === stepId);
    const nextStep = steps[currentIndex + 1];
    if (nextStep) {
      setCurrentStepId(nextStep.id);
      updateStepStatus(nextStep.id, 'current');
    }
  };

  const markStepError = (stepId: string) => {
    updateStepStatus(stepId, 'error');
  };

  const resetProgress = () => {
    setSteps(initialSteps);
    setCurrentStepId(initialSteps[0]?.id);
  };

  return {
    steps,
    currentStepId,
    updateStepStatus,
    goToStep,
    completeStep,
    markStepError,
    resetProgress
  };
}; 