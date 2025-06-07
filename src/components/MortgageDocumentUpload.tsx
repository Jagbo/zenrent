"use client";

import React, { useState, useRef, useCallback } from 'react';
import { DocumentIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { mortgageDocumentService, MortgageDocumentData, DocumentUploadState } from '@/services/mortgageDocumentService';

interface MortgageDocumentUploadProps {
  propertyId: string;
  onDataExtracted?: (data: MortgageDocumentData) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface ExtractedDataDisplayProps {
  data: MortgageDocumentData;
  onSave: (data: MortgageDocumentData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ExtractedDataDisplay: React.FC<ExtractedDataDisplayProps> = ({ 
  data, 
  onSave, 
  onCancel, 
  isLoading = false 
}) => {
  const [editedData, setEditedData] = useState<MortgageDocumentData>(data);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleFieldSave = (field: keyof MortgageDocumentData, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
    setEditingField(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${rate}%`;
  };

  const renderEditableField = (
    label: string,
    field: keyof MortgageDocumentData,
    value: any,
    type: 'text' | 'number' | 'date' = 'text',
    formatter?: (val: any) => string
  ) => {
    const isEditing = editingField === field;
    const displayValue = formatter ? formatter(value) : value;

    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type={type}
                defaultValue={value}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const newValue = type === 'number' 
                      ? parseFloat((e.target as HTMLInputElement).value) || 0
                      : (e.target as HTMLInputElement).value;
                    handleFieldSave(field, newValue);
                  } else if (e.key === 'Escape') {
                    setEditingField(null);
                  }
                }}
                onBlur={(e) => {
                  const newValue = type === 'number' 
                    ? parseFloat(e.target.value) || 0
                    : e.target.value;
                  handleFieldSave(field, newValue);
                }}
                autoFocus
              />
              <button
                onClick={() => setEditingField(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-900">
                {displayValue || 'Not specified'}
              </span>
              <button
                onClick={() => setEditingField(field)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Review Extracted Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderEditableField('Lender', 'lender', editedData.lender)}
          {renderEditableField('Mortgage Amount', 'amount', editedData.amount, 'number', formatCurrency)}
          {renderEditableField('Interest Rate', 'interestRate', editedData.interestRate, 'number', formatPercentage)}
          {renderEditableField('Term (Years)', 'termYears', editedData.termYears, 'number')}
          {renderEditableField('Monthly Payment', 'monthlyPayment', editedData.monthlyPayment, 'number', formatCurrency)}
          {renderEditableField('Start Date', 'startDate', editedData.startDate, 'date')}
          {renderEditableField('Maturity Date', 'maturityDate', editedData.maturityDate, 'date')}
          {renderEditableField('Property Address', 'propertyAddress', editedData.propertyAddress)}
          {renderEditableField('Borrower Name', 'borrowerName', editedData.borrowerName)}
          {renderEditableField('Account Number', 'accountNumber', editedData.accountNumber)}
          {renderEditableField('Product Type', 'productType', editedData.productType)}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedData)}
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Mortgage Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MortgageDocumentUpload({ 
  propertyId, 
  onDataExtracted, 
  onError, 
  className = '' 
}: MortgageDocumentUploadProps) {
  const [uploadState, setUploadState] = useState<DocumentUploadState>({
    file: null,
    extractedData: null,
    isProcessing: false,
    isUploading: false,
    error: null,
    uploadProgress: 0
  });

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showExtractedData, setShowExtractedData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetUploadState = useCallback(() => {
    setUploadState({
      file: null,
      extractedData: null,
      isProcessing: false,
      isUploading: false,
      error: null,
      uploadProgress: 0
    });
    setShowExtractedData(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFileProcess = useCallback(async (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
      setUploadState(prev => ({
        ...prev,
        error: 'Invalid file type. Please upload PDF, JPEG, PNG, or TIFF files.'
      }));
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadState(prev => ({
        ...prev,
        error: 'File too large. Maximum size is 10MB.'
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      file,
      error: null,
      isProcessing: true
    }));

    try {
      // Process the document with progress tracking
      const extractedData = await mortgageDocumentService.processDocument(
        file,
        propertyId,
        (progress) => {
          setUploadState(prev => ({ ...prev, uploadProgress: progress }));
        }
      );

      setUploadState(prev => ({
        ...prev,
        extractedData,
        isProcessing: false,
        uploadProgress: 100
      }));

      setShowExtractedData(true);
      onDataExtracted?.(extractedData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process document';
      setUploadState(prev => ({
        ...prev,
        error: errorMessage,
        isProcessing: false,
        uploadProgress: 0
      }));
      onError?.(errorMessage);
    }
  }, [propertyId, onDataExtracted, onError]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    handleFileProcess(file);
  }, [handleFileProcess]);

  const handleSaveExtractedData = useCallback(async (data: MortgageDocumentData) => {
    setUploadState(prev => ({ ...prev, isUploading: true }));

    try {
      await mortgageDocumentService.saveMortgageData(propertyId, data);
      onDataExtracted?.(data);
      resetUploadState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save mortgage data';
      setUploadState(prev => ({ ...prev, error: errorMessage }));
      onError?.(errorMessage);
    } finally {
      setUploadState(prev => ({ ...prev, isUploading: false }));
    }
  }, [propertyId, onDataExtracted, onError, resetUploadState]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Process the dropped file directly
      handleFileProcess(file);
    }
  }, [handleFileProcess]);

  if (showExtractedData && uploadState.extractedData) {
    return (
      <ExtractedDataDisplay
        data={uploadState.extractedData}
        onSave={handleSaveExtractedData}
        onCancel={resetUploadState}
        isLoading={uploadState.isUploading}
      />
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Mortgage Document</h3>
        
        {!uploadState.isProcessing ? (
          <div
            className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-semibold text-gray-900">
              Upload mortgage document
            </span>
            <span className="mt-2 block text-sm text-gray-500">
              Drag and drop or click to select PDF, JPEG, PNG, or TIFF files (max 10MB)
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.tiff"
              onChange={handleFileSelect}
              className="sr-only"
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <DocumentIcon className="mx-auto h-12 w-12 text-indigo-500 animate-pulse" />
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-900">Processing document...</div>
              <div className="text-sm text-gray-500 mt-1">
                Using AI to extract mortgage information
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.uploadProgress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {uploadState.uploadProgress}% complete
              </div>
            </div>
          </div>
        )}

        {uploadState.error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error processing document</h3>
                <div className="mt-2 text-sm text-red-700">
                  {uploadState.error}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Supported formats: PDF, JPEG, PNG, TIFF (max 10MB)
          </div>
          <button
            onClick={() => setShowManualEntry(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Enter Manually
          </button>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h5 className="text-sm font-medium text-blue-900">What information will be extracted?</h5>
        <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>Lender name and contact information</li>
          <li>Mortgage amount and interest rate</li>
          <li>Term length and monthly payment</li>
          <li>Start date and maturity date</li>
          <li>Property address and borrower details</li>
          <li>Account number and product type</li>
        </ul>
      </div>
    </div>
  );
} 