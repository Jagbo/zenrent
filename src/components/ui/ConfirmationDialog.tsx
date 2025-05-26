/**
 * Confirmation Dialog Component
 * Provides secure confirmation for critical tax submission actions
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Lock, Eye, EyeOff, Clock } from 'lucide-react';

export interface ConfirmationAction {
  label: string;
  variant: 'primary' | 'danger' | 'secondary';
  action: () => void | Promise<void>;
  requiresConfirmation?: boolean;
  confirmationText?: string;
}

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  details?: string[];
  consequences?: string[];
  actions: ConfirmationAction[];
  requiresTypedConfirmation?: boolean;
  confirmationPhrase?: string;
  showTimer?: boolean;
  timerSeconds?: number;
  preventAccidentalSubmission?: boolean;
  className?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'warning',
  details = [],
  consequences = [],
  actions,
  requiresTypedConfirmation = false,
  confirmationPhrase = 'CONFIRM',
  showTimer = false,
  timerSeconds = 5,
  preventAccidentalSubmission = false,
  className = ''
}) => {
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [showConsequences, setShowConsequences] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timerSeconds);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionStates, setActionStates] = useState<Record<number, boolean>>({});

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setTypedConfirmation('');
      setShowConsequences(false);
      setTimeRemaining(timerSeconds);
      setIsProcessing(false);
      setActionStates({});
    }
  }, [isOpen, timerSeconds]);

  // Timer countdown
  useEffect(() => {
    if (isOpen && showTimer && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showTimer, timeRemaining]);

  // Prevent background scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-8 h-8 text-amber-500" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'info':
      default:
        return <AlertTriangle className="w-8 h-8 text-blue-500" />;
    }
  };

  const getHeaderClasses = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 border-b border-red-200';
      case 'warning':
        return 'bg-amber-50 border-b border-amber-200';
      case 'success':
        return 'bg-green-50 border-b border-green-200';
      case 'info':
      default:
        return 'bg-blue-50 border-b border-blue-200';
    }
  };

  const isConfirmationValid = () => {
    if (requiresTypedConfirmation) {
      return typedConfirmation.trim().toUpperCase() === confirmationPhrase.toUpperCase();
    }
    return true;
  };

  const isTimerComplete = () => {
    return !showTimer || timeRemaining <= 0;
  };

  const canProceed = () => {
    return isConfirmationValid() && isTimerComplete() && !isProcessing;
  };

  const handleActionClick = async (action: ConfirmationAction, index: number) => {
    if (!canProceed()) return;

    setActionStates(prev => ({ ...prev, [index]: true }));
    setIsProcessing(true);

    try {
      await action.action();
      onClose();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionStates(prev => ({ ...prev, [index]: false }));
      setIsProcessing(false);
    }
  };

  const getActionButtonClasses = (action: ConfirmationAction, index: number) => {
    const baseClasses = 'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const isLoading = actionStates[index];
    const isDisabled = !canProceed() || isLoading;

    switch (action.variant) {
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 ${isDisabled ? 'bg-red-400' : ''}`;
      case 'primary':
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 ${isDisabled ? 'bg-blue-400' : ''}`;
      case 'secondary':
      default:
        return `${baseClasses} bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 ${isDisabled ? 'bg-gray-100' : ''}`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={preventAccidentalSubmission ? undefined : onClose}
        />

        {/* Dialog */}
        <div className={`inline-block w-full max-w-lg p-0 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg ${className}`}>
          {/* Header */}
          <div className={`px-6 py-4 ${getHeaderClasses()}`}>
            <div className="flex items-center space-x-3">
              {getIcon()}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                {showTimer && timeRemaining > 0 && (
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <Clock className="w-4 h-4 mr-1" />
                    Please wait {timeRemaining} seconds before proceeding
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Main message */}
            <p className="text-sm text-gray-700 leading-relaxed">{message}</p>

            {/* Details */}
            {details.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Details:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-gray-400 mr-2 mt-0.5">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Consequences */}
            {consequences.length > 0 && (
              <div className="border border-amber-200 rounded-lg">
                <button
                  onClick={() => setShowConsequences(!showConsequences)}
                  className="w-full px-3 py-2 text-left text-sm font-medium text-amber-800 bg-amber-50 rounded-t-lg hover:bg-amber-100 transition-colors flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Important consequences
                  </span>
                  {showConsequences ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                
                {showConsequences && (
                  <div className="px-3 py-2 bg-amber-25">
                    <ul className="text-sm text-amber-800 space-y-1">
                      {consequences.map((consequence, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-amber-500 mr-2 mt-0.5">⚠</span>
                          <span>{consequence}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Typed confirmation */}
            {requiresTypedConfirmation && (
              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center mb-2">
                  <Lock className="w-4 h-4 text-gray-500 mr-2" />
                  <label className="text-sm font-medium text-gray-900">
                    Type "{confirmationPhrase}" to confirm:
                  </label>
                </div>
                <input
                  type="text"
                  value={typedConfirmation}
                  onChange={(e) => setTypedConfirmation(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={confirmationPhrase}
                  autoComplete="off"
                />
                {typedConfirmation && !isConfirmationValid() && (
                  <p className="text-xs text-red-600 mt-1">
                    Please type "{confirmationPhrase}" exactly as shown
                  </p>
                )}
              </div>
            )}

            {/* Timer progress */}
            {showTimer && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Security delay</span>
                  <span className="text-gray-900 font-medium">
                    {timeRemaining > 0 ? `${timeRemaining}s remaining` : 'Ready to proceed'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{
                      width: `${((timerSeconds - timeRemaining) / timerSeconds) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(action, index)}
                disabled={!canProceed() || actionStates[index]}
                className={getActionButtonClasses(action, index)}
              >
                {actionStates[index] && (
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Predefined confirmation dialogs for tax scenarios
export const TaxConfirmationDialogs = {
  submitTaxReturn: {
    title: 'Submit Tax Return to HMRC',
    message: 'You are about to submit your tax return to HMRC. This action cannot be undone.',
    type: 'warning' as const,
    details: [
      'Your tax return will be officially filed with HMRC',
      'You will receive a submission receipt',
      'Any tax due must be paid by the deadline',
      'Amendments may require additional forms'
    ],
    consequences: [
      'Once submitted, you cannot make changes without filing an amendment',
      'Incorrect information may result in penalties',
      'Late submission may incur additional charges'
    ],
    requiresTypedConfirmation: true,
    confirmationPhrase: 'SUBMIT',
    showTimer: true,
    timerSeconds: 10,
    preventAccidentalSubmission: true
  },

  deleteSubmission: {
    title: 'Delete Tax Submission',
    message: 'Are you sure you want to delete this tax submission? This action cannot be undone.',
    type: 'danger' as const,
    consequences: [
      'All entered data will be permanently lost',
      'You will need to start over from the beginning',
      'Any saved drafts will also be deleted'
    ],
    requiresTypedConfirmation: true,
    confirmationPhrase: 'DELETE',
    preventAccidentalSubmission: true
  },

  amendReturn: {
    title: 'Amend Submitted Return',
    message: 'You are about to amend a previously submitted tax return.',
    type: 'warning' as const,
    details: [
      'This will create an amendment to your original submission',
      'HMRC will be notified of the changes',
      'Additional tax may be due or refunded'
    ],
    consequences: [
      'Amendments may trigger an HMRC review',
      'Interest may be charged on additional tax due',
      'Multiple amendments may raise compliance flags'
    ],
    showTimer: true,
    timerSeconds: 5
  },

  clearAllData: {
    title: 'Clear All Tax Data',
    message: 'This will remove all your tax information from this session.',
    type: 'warning' as const,
    consequences: [
      'All income, expenses, and adjustments will be cleared',
      'You will need to re-enter all information',
      'Saved drafts will remain unaffected'
    ]
  },

  signOut: {
    title: 'Sign Out of HMRC',
    message: 'You will be signed out of your HMRC account.',
    type: 'info' as const,
    details: [
      'Your progress has been saved automatically',
      'You can continue where you left off after signing back in',
      'Your session will be securely terminated'
    ]
  }
};

// Hook for managing confirmation dialogs
export const useConfirmationDialog = () => {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    config: Partial<ConfirmationDialogProps>;
  }>({
    isOpen: false,
    config: {}
  });

  const showConfirmation = (config: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        isOpen: true,
        config: {
          ...config,
          actions: config.actions.map(action => ({
            ...action,
            action: async () => {
              try {
                await action.action();
                resolve(true);
              } catch (error) {
                resolve(false);
              }
            }
          }))
        }
      });
    });
  };

  const hideConfirmation = () => {
    setDialog({ isOpen: false, config: {} });
  };

  const ConfirmationDialogComponent = () => (
    <ConfirmationDialog
      {...(dialog.config as ConfirmationDialogProps)}
      isOpen={dialog.isOpen}
      onClose={hideConfirmation}
    />
  );

  return {
    showConfirmation,
    hideConfirmation,
    ConfirmationDialogComponent
  };
}; 