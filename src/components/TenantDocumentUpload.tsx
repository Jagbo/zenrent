'use client';

import React, { useState, useRef } from 'react';
import { PlusIcon, DocumentIcon, TrashIcon } from '@heroicons/react/24/outline';
import { TenantDocument, DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, DocumentType } from '@/types/tenant-documents';

interface TenantDocumentUploadProps {
  tenantId: string;
  documents: TenantDocument[];
  onDocumentUploaded: (document: TenantDocument) => void;
  onDocumentDeleted: (documentId: string) => void;
  className?: string;
}

export default function TenantDocumentUpload({
  tenantId,
  documents,
  onDocumentUploaded,
  onDocumentDeleted,
  className = ''
}: TenantDocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>(DOCUMENT_TYPES.OTHER);
  const [description, setDescription] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenantId', tenantId);
      formData.append('documentType', selectedDocumentType);
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      const response = await fetch('/api/tenant-documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload document');
      }

      const { document } = await response.json();
      onDocumentUploaded(document);
      
      // Reset form
      setDescription('');
      setSelectedDocumentType(DOCUMENT_TYPES.OTHER);
      setShowUploadForm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/tenant-documents?documentId=${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete document');
      }

      onDocumentDeleted(documentId);
    } catch (error) {
      console.error('Error deleting document:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete document');
    }
  };

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/tenant-documents/download?documentId=${documentId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download document');
      }

      const { downloadUrl } = await response.json();
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert(error instanceof Error ? error.message : 'Failed to download document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(extension || '')) {
      return '📄';
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return '🖼️';
    } else if (['doc', 'docx'].includes(extension || '')) {
      return '📝';
    }
    return '📎';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-900">
          Tenant Documents
        </h4>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          Upload Document
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="space-y-4">
            <div>
              <label htmlFor="document-type" className="block text-sm font-medium text-gray-700">
                Document Type
              </label>
              <select
                id="document-type"
                value={selectedDocumentType}
                onChange={(e) => setSelectedDocumentType(e.target.value as DocumentType)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the document"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="file-upload" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {uploading ? 'Uploading...' : 'Choose File'}
              </label>
              <input
                ref={fileInputRef}
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                onChange={handleFileSelect}
                disabled={uploading}
                className="sr-only"
              />
            </div>

            {uploadError && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {uploadError}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  setUploadError(null);
                  setDescription('');
                }}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300">
          <div className="text-center">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents uploaded</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload tenant documents like lease agreements, applications, or ID documents
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getFileIcon(document.file_name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {document.file_name}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{DOCUMENT_TYPE_LABELS[document.document_type as DocumentType] || document.document_type}</span>
                    <span>•</span>
                    <span>{formatFileSize(document.file_size)}</span>
                    <span>•</span>
                    <span>{new Date(document.uploaded_at).toLocaleDateString()}</span>
                  </div>
                  {document.description && (
                    <p className="text-xs text-gray-600 mt-1">{document.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadDocument(document.id, document.file_name)}
                  className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                >
                  Download
                </button>
                <button
                  onClick={() => handleDeleteDocument(document.id)}
                  className="text-red-600 hover:text-red-900 p-1"
                  title="Delete document"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h5 className="text-sm font-medium text-blue-900">Recommended documents to upload:</h5>
        <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>Lease agreement or tenancy contract</li>
          <li>Tenant application form</li>
          <li>Photo ID (passport, driving license)</li>
          <li>Proof of income (payslips, bank statements)</li>
          <li>Employment reference letter</li>
          <li>Previous landlord reference</li>
        </ul>
      </div>
    </div>
  );
} 