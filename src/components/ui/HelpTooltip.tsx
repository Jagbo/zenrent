/**
 * Help Tooltip Component
 * Provides contextual help and guidance throughout the tax submission flow
 */

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, ExternalLink, BookOpen, Calculator, AlertTriangle } from 'lucide-react';

export interface TooltipContent {
  title: string;
  description: string;
  examples?: string[];
  links?: {
    text: string;
    url: string;
    external?: boolean;
  }[];
  warnings?: string[];
  calculations?: {
    formula: string;
    example: string;
  };
  relatedFields?: string[];
}

interface HelpTooltipProps {
  content: TooltipContent;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  trigger?: 'hover' | 'click';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  position = 'auto',
  trigger = 'hover',
  size = 'md',
  className = '',
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'max-w-xs',
    md: 'max-w-sm',
    lg: 'max-w-md'
  };

  const calculatePosition = () => {
    if (position !== 'auto' || !triggerRef.current || !tooltipRef.current) {
      return position;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Check if tooltip fits in each direction
    const fitsTop = triggerRect.top - tooltipRect.height > 10;
    const fitsBottom = triggerRect.bottom + tooltipRect.height < viewport.height - 10;
    const fitsLeft = triggerRect.left - tooltipRect.width > 10;
    const fitsRight = triggerRect.right + tooltipRect.width < viewport.width - 10;

    // Prefer top, then bottom, then right, then left
    if (fitsTop) return 'top';
    if (fitsBottom) return 'bottom';
    if (fitsRight) return 'right';
    if (fitsLeft) return 'left';
    
    return 'bottom'; // Fallback
  };

  useEffect(() => {
    if (isVisible) {
      const newPosition = calculatePosition();
      setActualPosition(newPosition);
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  const getPositionClasses = () => {
    const baseClasses = 'absolute z-50 p-4 bg-white border border-gray-200 rounded-lg shadow-lg';
    
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      default:
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
    }
  };

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-3 h-3 bg-white border transform rotate-45';
    
    switch (actualPosition) {
      case 'top':
        return `${baseClasses} top-full left-1/2 -translate-x-1/2 -mt-1.5 border-t-0 border-l-0`;
      case 'bottom':
        return `${baseClasses} bottom-full left-1/2 -translate-x-1/2 -mb-1.5 border-b-0 border-r-0`;
      case 'left':
        return `${baseClasses} left-full top-1/2 -translate-y-1/2 -ml-1.5 border-l-0 border-b-0`;
      case 'right':
        return `${baseClasses} right-full top-1/2 -translate-y-1/2 -mr-1.5 border-r-0 border-t-0`;
      default:
        return `${baseClasses} bottom-full left-1/2 -translate-x-1/2 -mb-1.5 border-b-0 border-r-0`;
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-help"
      >
        {children || (
          <HelpCircle className="w-5 h-5 text-blue-500 hover:text-blue-600 transition-colors" />
        )}
      </div>

      {isVisible && (
        <>
          {/* Backdrop for click-to-close */}
          {trigger === 'click' && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsVisible(false)}
            />
          )}

          <div
            ref={tooltipRef}
            className={`${getPositionClasses()} ${sizeClasses[size]}`}
          >
            {/* Arrow */}
            <div className={getArrowClasses()} />

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 pr-2">
                {content.title}
              </h4>
              {trigger === 'click' && (
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              {content.description}
            </p>

            {/* Examples */}
            {content.examples && content.examples.length > 0 && (
              <div className="mb-3">
                <h5 className="text-xs font-medium text-gray-900 mb-2 flex items-center">
                  <BookOpen className="w-3 h-3 mr-1" />
                  Examples:
                </h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {content.examples.map((example, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-gray-400 mr-2">•</span>
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Calculations */}
            {content.calculations && (
              <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                <h5 className="text-xs font-medium text-blue-900 mb-2 flex items-center">
                  <Calculator className="w-3 h-3 mr-1" />
                  Calculation:
                </h5>
                <div className="text-xs text-blue-800">
                  <p className="font-mono mb-1">{content.calculations.formula}</p>
                  <p className="text-blue-600">Example: {content.calculations.example}</p>
                </div>
              </div>
            )}

            {/* Warnings */}
            {content.warnings && content.warnings.length > 0 && (
              <div className="mb-3 p-2 bg-amber-50 rounded border border-amber-200">
                <h5 className="text-xs font-medium text-amber-900 mb-2 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Important:
                </h5>
                <ul className="text-xs text-amber-800 space-y-1">
                  {content.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-amber-500 mr-2">⚠</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related Fields */}
            {content.relatedFields && content.relatedFields.length > 0 && (
              <div className="mb-3">
                <h5 className="text-xs font-medium text-gray-900 mb-2">
                  Related fields:
                </h5>
                <div className="flex flex-wrap gap-1">
                  {content.relatedFields.map((field, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {content.links && content.links.length > 0 && (
              <div className="border-t border-gray-200 pt-3">
                <h5 className="text-xs font-medium text-gray-900 mb-2">
                  Learn more:
                </h5>
                <div className="space-y-1">
                  {content.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target={link.external ? '_blank' : '_self'}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center transition-colors"
                    >
                      <span>{link.text}</span>
                      {link.external && (
                        <ExternalLink className="w-3 h-3 ml-1" />
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Predefined help content for common tax fields
export const TaxHelpContent = {
  utrNumber: {
    title: 'Unique Taxpayer Reference (UTR)',
    description: 'Your 10-digit UTR number uniquely identifies you to HMRC for tax purposes.',
    examples: [
      '1234567890',
      'Found on tax returns, notices, and correspondence from HMRC'
    ],
    warnings: [
      'Do not share your UTR with unauthorized parties',
      'Contact HMRC if you have lost your UTR'
    ],
    links: [
      {
        text: 'Find your UTR on GOV.UK',
        url: 'https://www.gov.uk/find-utr-number',
        external: true
      }
    ]
  },

  rentIncome: {
    title: 'Rental Income',
    description: 'The total amount of rent you received from your properties during the tax year.',
    examples: [
      'Monthly rent: £1,000 × 12 months = £12,000',
      'Include deposits kept for damages',
      'Include service charges paid by tenants'
    ],
    warnings: [
      'Include all rental income, even if not yet received',
      'Do not deduct expenses here - use the expenses section'
    ],
    relatedFields: ['Property expenses', 'Deposit deductions']
  },

  mileageAllowance: {
    title: 'Mileage Allowance',
    description: 'Claim tax relief for business miles driven for your property business.',
    calculations: {
      formula: 'First 10,000 miles: 45p per mile, Additional miles: 25p per mile',
      example: '12,000 miles = (10,000 × £0.45) + (2,000 × £0.25) = £5,000'
    },
    examples: [
      'Driving to properties for inspections',
      'Visiting suppliers for maintenance materials',
      'Meeting with tenants or contractors'
    ],
    warnings: [
      'Keep detailed records of business journeys',
      'Cannot claim for personal use of vehicle',
      'Alternative: claim actual costs instead'
    ],
    links: [
      {
        text: 'HMRC mileage rates',
        url: 'https://www.gov.uk/expenses-and-benefits-company-cars/rates-for-tax',
        external: true
      }
    ]
  },

  propertyIncomeAllowance: {
    title: 'Property Income Allowance',
    description: 'A £1,000 tax-free allowance that can be used instead of claiming actual expenses.',
    calculations: {
      formula: 'Min(Property Income, £1,000)',
      example: 'Income £800: Allowance = £800, Income £1,500: Allowance = £1,000'
    },
    warnings: [
      'Cannot use both allowance and actual expenses',
      'Choose the option that gives you the lower tax bill',
      'Allowance applies per person, not per property'
    ],
    relatedFields: ['Actual expenses', 'Rental income']
  },

  capitalAllowances: {
    title: 'Capital Allowances',
    description: 'Tax relief on equipment and fixtures used in your property business.',
    examples: [
      'Furniture in furnished lettings',
      'Kitchen appliances',
      'Carpets and curtains',
      'Office equipment for property management'
    ],
    warnings: [
      'Only for items used wholly for business',
      'Cannot claim on the property structure itself',
      'Keep receipts and records of purchases'
    ],
    links: [
      {
        text: 'Capital allowances guide',
        url: 'https://www.gov.uk/capital-allowances',
        external: true
      }
    ]
  }
};

// Hook for managing contextual help
export const useContextualHelp = () => {
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [helpHistory, setHelpHistory] = useState<string[]>([]);

  const showHelp = (helpId: string) => {
    setActiveHelp(helpId);
    setHelpHistory(prev => [...prev.filter(id => id !== helpId), helpId]);
  };

  const hideHelp = () => {
    setActiveHelp(null);
  };

  const getRecentHelp = (limit = 5) => {
    return helpHistory.slice(-limit).reverse();
  };

  return {
    activeHelp,
    helpHistory,
    showHelp,
    hideHelp,
    getRecentHelp
  };
}; 