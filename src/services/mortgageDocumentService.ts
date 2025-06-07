import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export interface MortgageDocumentData {
  lender: string;
  amount: number;
  interestRate: number;
  termYears: number;
  monthlyPayment: number;
  startDate?: string;
  maturityDate?: string;
  propertyAddress?: string;
  borrowerName?: string;
  accountNumber?: string;
  productType?: string;
}

export interface DocumentUploadState {
  file: File | null;
  extractedData: MortgageDocumentData | null;
  isProcessing: boolean;
  isUploading: boolean;
  error: string | null;
  uploadProgress: number;
}

class MortgageDocumentService {
  private supabase = createClientComponentClient();
  private localStorageKey = 'zenrent_mortgage_document';

  // Store document temporarily in localStorage (as base64)
  storeDocumentLocally(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const base64Data = reader.result as string;
          const documentData = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64Data,
            timestamp: Date.now()
          };
          
          localStorage.setItem(this.localStorageKey, JSON.stringify(documentData));
          resolve(base64Data);
        } catch (error) {
          reject(new Error('Failed to store document locally'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // Get stored document from localStorage
  getStoredDocument(): { file: File; data: string } | null {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (!stored) return null;

      const documentData = JSON.parse(stored);
      
      // Convert base64 back to File
      const byteCharacters = atob(documentData.data.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const file = new File([byteArray], documentData.name, { type: documentData.type });

      return { file, data: documentData.data };
    } catch (error) {
      console.error('Failed to retrieve stored document:', error);
      return null;
    }
  }

  // Clear stored document from localStorage
  clearStoredDocument(): void {
    localStorage.removeItem(this.localStorageKey);
  }

  // Extract mortgage information using Vertex AI
  async extractMortgageInfo(file: File): Promise<MortgageDocumentData> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/mortgage/extract-info', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to extract mortgage information');
    }

    const { extractedData } = await response.json();
    return extractedData;
  }

  // Upload document to Supabase Storage
  async uploadToStorage(file: File, propertyId: string): Promise<string> {
    const fileExtension = file.name.split('.').pop();
    const fileName = `mortgages/${propertyId}/${Date.now()}.${fileExtension}`;

    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('property-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from('property-documents')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  // Save mortgage data to database
  async saveMortgageData(
    propertyId: string, 
    mortgageData: MortgageDocumentData, 
    documentUrl?: string
  ): Promise<void> {
    const { data, error } = await this.supabase
      .from('property_mortgages')
      .upsert({
        property_id: propertyId,
        lender: mortgageData.lender,
        amount: mortgageData.amount,
        interest_rate: mortgageData.interestRate,
        term_years: mortgageData.termYears,
        monthly_payment: mortgageData.monthlyPayment,
        start_date: mortgageData.startDate,
        document_url: documentUrl,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'property_id'
      });

    if (error) {
      throw new Error(`Failed to save mortgage data: ${error.message}`);
    }
  }

  // Complete upload process (extract info, upload to storage, save to DB)
  async processDocument(
    file: File, 
    propertyId: string,
    progressCallback?: (progress: number) => void
  ): Promise<MortgageDocumentData> {
    try {
      progressCallback?.(10);

      // Store locally first
      await this.storeDocumentLocally(file);
      progressCallback?.(20);

      // Extract information using AI
      const extractedData = await this.extractMortgageInfo(file);
      progressCallback?.(60);

      // Upload to storage
      const documentUrl = await this.uploadToStorage(file, propertyId);
      progressCallback?.(80);

      // Save to database
      await this.saveMortgageData(propertyId, extractedData, documentUrl);
      progressCallback?.(90);

      // Clear local storage
      this.clearStoredDocument();
      progressCallback?.(100);

      return extractedData;
    } catch (error) {
      // Don't clear local storage on error so user can retry
      throw error;
    }
  }

  // Validate extracted data
  validateMortgageData(data: Partial<MortgageDocumentData>): string[] {
    const errors: string[] = [];

    if (!data.lender || data.lender.trim().length === 0) {
      errors.push('Lender name is required');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Mortgage amount must be greater than 0');
    }

    if (!data.interestRate || data.interestRate <= 0 || data.interestRate > 100) {
      errors.push('Interest rate must be between 0 and 100');
    }

    if (!data.termYears || data.termYears <= 0 || data.termYears > 50) {
      errors.push('Term years must be between 1 and 50');
    }

    if (!data.monthlyPayment || data.monthlyPayment <= 0) {
      errors.push('Monthly payment must be greater than 0');
    }

    return errors;
  }
}

export const mortgageDocumentService = new MortgageDocumentService(); 