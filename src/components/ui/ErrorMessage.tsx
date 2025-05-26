/**
 * Enhanced Error Message Component
 * Provides clear, actionable error messages with recovery suggestions
 */

import React from 'react';
import { AlertTriangle, XCircle, AlertCircle, RefreshCw, ExternalLink, HelpCircle } from 'lucide-react';

export interface ErrorAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

export interface ErrorMessageProps {
  type?: 'error' | 'warning' | 'validation';
  title: string;
  message: string;
  details?: string;
  code?: string;
  suggestions?: string[];
  actions?: ErrorAction[];
  helpLink?: {
    text: string;
    url: string;
  };
  onDismiss?: () => void;
  className?: string;
  showIcon?: boolean;
  collapsible?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  type = 'error',
  title,
  message,
  details,
  code,
  suggestions = [],
  actions = [],
  helpLink,
  onDismiss,
  className = '',
  showIcon = true,
  collapsible = false
}) => {
  const [isExpanded, setIsExpanded] = React.useState(!collapsible);

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'validation':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getContainerClasses = () => {
    const baseClasses = 'rounded-lg border p-4 transition-all duration-200';
    
    switch (type) {
      case 'error':
        return `${baseClasses} bg-red-50 border-red-200 text-red-800`;
      case 'warning':
        return `${baseClasses} bg-amber-50 border-amber-200 text-amber-800`;
      case 'validation':
        return `${baseClasses} bg-orange-50 border-orange-200 text-orange-800`;
      default:
        return `${baseClasses} bg-red-50 border-red-200 text-red-800`;
    }
  };

  const getActionButtonClasses = (variant: ErrorAction['variant'] = 'primary') => {
    const baseClasses = 'px-3 py-1.5 text-sm font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
      case 'secondary':
        return `${baseClasses} bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500`;
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
      default:
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
    }
  };

  return (
    <div className={`${getContainerClasses()} ${className}`} role="alert">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {showIcon && getIcon()}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold">{title}</h3>
              {code && (
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-mono">
                  {code}
                </span>
              )}
            </div>
            
            {/* Main message */}
            <p className="text-sm mt-1 leading-relaxed">{message}</p>
            
            {/* Collapsible toggle */}
            {collapsible && (details || suggestions.length > 0) && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm underline hover:no-underline mt-2 focus:outline-none"
              >
                {isExpanded ? 'Show less' : 'Show more details'}
              </button>
            )}
          </div>
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
            aria-label="Dismiss error"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Details */}
          {details && (
            <div className="p-3 bg-white bg-opacity-50 rounded border border-current border-opacity-20">
              <h4 className="text-sm font-medium mb-2">Details:</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{details}</p>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <HelpCircle className="w-4 h-4 mr-1" />
                How to fix this:
              </h4>
              <ul className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <span className="text-current mr-2 mt-0.5">•</span>
                    <span className="leading-relaxed">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  disabled={action.loading}
                  className={`${getActionButtonClasses(action.variant)} ${
                    action.loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {action.loading && (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Help link */}
          {helpLink && (
            <div className="pt-2 border-t border-current border-opacity-20">
              <a
                href={helpLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline hover:no-underline flex items-center"
              >
                <span>{helpLink.text}</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Predefined error configurations for common tax scenarios
export const TaxErrorMessages = {
  invalidUTR: {
    type: 'validation' as const,
    title: 'Invalid UTR Number',
    message: 'The UTR number must be exactly 10 digits.',
    suggestions: [
      'Check your UTR on previous tax returns or HMRC correspondence',
      'Remove any spaces or special characters',
      'Contact HMRC if you cannot find your UTR'
    ],
    helpLink: {
      text: 'Find your UTR number',
      url: 'https://www.gov.uk/find-utr-number'
    }
  },

  hmrcConnectionError: {
    type: 'error' as const,
    title: 'HMRC Connection Failed',
    message: 'Unable to connect to HMRC services. This may be temporary.',
    details: 'The HMRC API is currently unavailable or experiencing high traffic.',
    suggestions: [
      'Wait a few minutes and try again',
      'Check HMRC service status',
      'Save your work as a draft and try submitting later'
    ],
    helpLink: {
      text: 'Check HMRC service status',
      url: 'https://www.gov.uk/government/organisations/hm-revenue-customs/about/access-and-opening'
    }
  },

  authenticationExpired: {
    type: 'warning' as const,
    title: 'Session Expired',
    message: 'Your HMRC authentication has expired. Please sign in again.',
    suggestions: [
      'Click "Sign in to HMRC" to re-authenticate',
      'Your progress has been saved automatically',
      'You can continue where you left off after signing in'
    ]
  },

  calculationError: {
    type: 'error' as const,
    title: 'Tax Calculation Error',
    message: 'There was an error calculating your tax liability.',
    suggestions: [
      'Check all income and expense amounts are valid numbers',
      'Ensure dates are in the correct format',
      'Try refreshing the page and recalculating'
    ]
  },

  validationFailed: {
    type: 'validation' as const,
    title: 'Form Validation Failed',
    message: 'Please correct the highlighted fields before continuing.',
    suggestions: [
      'Review all required fields marked with *',
      'Check that amounts are positive numbers',
      'Ensure dates are within the tax year'
    ]
  },

  submissionFailed: {
    type: 'error' as const,
    title: 'Submission Failed',
    message: 'Your tax return could not be submitted to HMRC.',
    details: 'The submission was rejected by HMRC. This could be due to validation errors or system issues.',
    suggestions: [
      'Review the error details below',
      'Correct any validation issues',
      'Try submitting again in a few minutes',
      'Contact support if the problem persists'
    ]
  },

  networkError: {
    type: 'warning' as const,
    title: 'Network Connection Issue',
    message: 'Check your internet connection and try again.',
    suggestions: [
      'Ensure you have a stable internet connection',
      'Try refreshing the page',
      'Your work is saved automatically'
    ]
  }
};

// Hook for managing error state
export const useErrorHandler = () => {
  const [errors, setErrors] = React.useState<Array<{
    id: string;
    error: ErrorMessageProps;
    timestamp: Date;
  }>>([]);

  const addError = (error: Omit<ErrorMessageProps, 'onDismiss'>) => {
    const id = Date.now().toString();
    setErrors(prev => [...prev, {
      id,
      error: {
        ...error,
        onDismiss: () => removeError(id)
      },
      timestamp: new Date()
    }]);
    return id;
  };

  const removeError = (id: string) => {
    setErrors(prev => prev.filter(e => e.id !== id));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const hasErrors = errors.length > 0;
  const errorCount = errors.length;

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    hasErrors,
    errorCount
  };
};

// Error boundary component for React error handling
export class TaxErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Tax form error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} />;
      }

      return (
        <ErrorMessage
          type="error"
          title="Something went wrong"
          message="An unexpected error occurred while processing your tax information."
          suggestions={[
            'Try refreshing the page',
            'Clear your browser cache',
            'Contact support if the problem persists'
          ]}
          actions={[
            {
              label: 'Refresh Page',
              action: () => window.location.reload(),
              variant: 'primary'
            }
          ]}
        />
      );
    }

    return this.props.children;
  }
} 