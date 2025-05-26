/**
 * Auto-save hook for form data with recovery capabilities
 * Automatically saves form data to prevent data loss
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { ErrorNotificationService } from '@/lib/services/errorNotificationService';

export interface AutoSaveConfig {
  key: string;
  delay?: number;
  storage?: 'localStorage' | 'sessionStorage' | 'indexedDB';
  onSave?: (data: any) => Promise<void>;
  onRestore?: (data: any) => void;
  onError?: (error: Error) => void;
  compress?: boolean;
  encrypt?: boolean;
  maxVersions?: number;
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  error: Error | null;
  hasUnsavedChanges: boolean;
  recoveredData: any | null;
  saveCount: number;
}

export interface SavedVersion {
  id: string;
  timestamp: string;
  data: any;
  checksum: string;
  compressed: boolean;
  encrypted: boolean;
}

export function useAutoSave<T>(
  data: T,
  config: AutoSaveConfig
): AutoSaveState & {
  forceSave: () => Promise<void>;
  clearSaved: () => void;
  restoreVersion: (versionId: string) => void;
  getSavedVersions: () => SavedVersion[];
  exportData: () => string;
  importData: (jsonData: string) => void;
} {
  const {
    key,
    delay = 3000,
    storage = 'localStorage',
    onSave,
    onRestore,
    onError,
    compress = false,
    encrypt = false,
    maxVersions = 10
  } = config;

  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    error: null,
    hasUnsavedChanges: false,
    recoveredData: null,
    saveCount: 0
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<string>();
  const notificationService = ErrorNotificationService.getInstance();

  // Generate storage keys
  const dataKey = `autosave_${key}`;
  const versionsKey = `autosave_versions_${key}`;
  const metaKey = `autosave_meta_${key}`;

  /**
   * Get storage interface based on config
   */
  const getStorage = useCallback(() => {
    switch (storage) {
      case 'sessionStorage':
        return sessionStorage;
      case 'localStorage':
      default:
        return localStorage;
    }
  }, [storage]);

  /**
   * Generate checksum for data integrity
   */
  const generateChecksum = useCallback((data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }, []);

  /**
   * Compress data if enabled
   */
  const compressData = useCallback((data: string): string => {
    if (!compress) return data;
    
    // Simple compression using JSON.stringify with replacer
    // In production, you might want to use a proper compression library
    try {
      return btoa(data);
    } catch (error) {
      console.warn('Compression failed, using uncompressed data:', error);
      return data;
    }
  }, [compress]);

  /**
   * Decompress data if needed
   */
  const decompressData = useCallback((data: string, isCompressed: boolean): string => {
    if (!isCompressed) return data;
    
    try {
      return atob(data);
    } catch (error) {
      console.warn('Decompression failed:', error);
      return data;
    }
  }, []);

  /**
   * Encrypt data if enabled (basic implementation)
   */
  const encryptData = useCallback((data: string): string => {
    if (!encrypt) return data;
    
    // Basic encryption - in production, use proper encryption
    return btoa(data);
  }, [encrypt]);

  /**
   * Decrypt data if needed
   */
  const decryptData = useCallback((data: string, isEncrypted: boolean): string => {
    if (!isEncrypted) return data;
    
    try {
      return atob(data);
    } catch (error) {
      console.warn('Decryption failed:', error);
      return data;
    }
  }, []);

  /**
   * Save data to storage
   */
  const saveData = useCallback(async (dataToSave: T, force: boolean = false): Promise<void> => {
    const serializedData = JSON.stringify(dataToSave);
    
    // Check if data has changed
    if (!force && lastDataRef.current === serializedData) {
      return;
    }

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const storage = getStorage();
      
      // Process data
      let processedData = serializedData;
      if (compress) {
        processedData = compressData(processedData);
      }
      if (encrypt) {
        processedData = encryptData(processedData);
      }

      const checksum = generateChecksum(serializedData);
      const timestamp = new Date().toISOString();

      // Create version entry
      const version: SavedVersion = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        data: processedData,
        checksum,
        compressed: compress,
        encrypted: encrypt
      };

      // Save current data
      storage.setItem(dataKey, JSON.stringify(version));

      // Manage versions
      const existingVersionsData = storage.getItem(versionsKey);
      let versions: SavedVersion[] = [];
      
      if (existingVersionsData) {
        try {
          versions = JSON.parse(existingVersionsData);
        } catch (error) {
          console.warn('Failed to parse existing versions:', error);
        }
      }

      // Add new version
      versions.unshift(version);

      // Limit versions
      if (versions.length > maxVersions) {
        versions = versions.slice(0, maxVersions);
      }

      storage.setItem(versionsKey, JSON.stringify(versions));

      // Save metadata
      const metadata = {
        lastSaved: timestamp,
        saveCount: state.saveCount + 1,
        key,
        storage
      };
      storage.setItem(metaKey, JSON.stringify(metadata));

      // Call custom save handler
      if (onSave) {
        await onSave(dataToSave);
      }

      lastDataRef.current = serializedData;
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        saveCount: prev.saveCount + 1
      }));

    } catch (error) {
      const saveError = error as Error;
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: saveError
      }));

      if (onError) {
        onError(saveError);
      } else {
        notificationService.showError('AUTO_SAVE_FAILED', {
          errorData: { message: saveError.message },
          context: { key, storage }
        });
      }

      // Store in backup location
      try {
        const backupKey = `${dataKey}_backup_${Date.now()}`;
        localStorage.setItem(backupKey, serializedData);
        
        notificationService.showWarning(
          'Auto-save Failed',
          'Data has been saved to backup location. Please try saving manually.',
          [
            {
              id: 'retry_save',
              label: 'Retry Save',
              action: 'retry',
              primary: true
            }
          ]
        );
      } catch (backupError) {
        console.error('Backup save also failed:', backupError);
      }
    }
  }, [
    key, storage, compress, encrypt, maxVersions, onSave, onError,
    getStorage, compressData, encryptData, generateChecksum,
    notificationService, state.saveCount
  ]);

  /**
   * Load saved data
   */
  const loadData = useCallback((): T | null => {
    try {
      const storage = getStorage();
      const savedData = storage.getItem(dataKey);
      
      if (!savedData) return null;

      const version: SavedVersion = JSON.parse(savedData);
      
      // Process data
      let processedData = version.data;
      processedData = decryptData(processedData, version.encrypted);
      processedData = decompressData(processedData, version.compressed);

      // Verify checksum
      const expectedChecksum = generateChecksum(processedData);
      if (version.checksum !== expectedChecksum) {
        console.warn('Data integrity check failed');
        notificationService.showWarning(
          'Data Integrity Warning',
          'Saved data may be corrupted. Please verify your information.'
        );
      }

      const parsedData = JSON.parse(processedData);
      
      setState(prev => ({
        ...prev,
        recoveredData: parsedData,
        lastSaved: new Date(version.timestamp)
      }));

      return parsedData;
      
    } catch (error) {
      console.error('Failed to load saved data:', error);
      
      if (onError) {
        onError(error as Error);
      }
      
      return null;
    }
  }, [key, storage, getStorage, decryptData, decompressData, generateChecksum, notificationService, onError]);

  /**
   * Get all saved versions
   */
  const getSavedVersions = useCallback((): SavedVersion[] => {
    try {
      const storage = getStorage();
      const versionsData = storage.getItem(versionsKey);
      
      if (!versionsData) return [];
      
      return JSON.parse(versionsData);
    } catch (error) {
      console.error('Failed to get saved versions:', error);
      return [];
    }
  }, [getStorage, versionsKey]);

  /**
   * Restore specific version
   */
  const restoreVersion = useCallback((versionId: string): void => {
    try {
      const versions = getSavedVersions();
      const version = versions.find(v => v.id === versionId);
      
      if (!version) {
        throw new Error('Version not found');
      }

      // Process data
      let processedData = version.data;
      processedData = decryptData(processedData, version.encrypted);
      processedData = decompressData(processedData, version.compressed);

      const parsedData = JSON.parse(processedData);
      
      if (onRestore) {
        onRestore(parsedData);
      }

      setState(prev => ({
        ...prev,
        recoveredData: parsedData,
        lastSaved: new Date(version.timestamp)
      }));

      notificationService.showSuccess(
        'Version Restored',
        `Data from ${new Date(version.timestamp).toLocaleString()} has been restored.`
      );

    } catch (error) {
      console.error('Failed to restore version:', error);
      notificationService.showError('VERSION_RESTORE_FAILED', {
        errorData: { message: (error as Error).message },
        context: { versionId }
      });
    }
  }, [getSavedVersions, decryptData, decompressData, onRestore, notificationService]);

  /**
   * Force save immediately
   */
  const forceSave = useCallback(async (): Promise<void> => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await saveData(data, true);
  }, [data, saveData]);

  /**
   * Clear all saved data
   */
  const clearSaved = useCallback((): void => {
    try {
      const storage = getStorage();
      storage.removeItem(dataKey);
      storage.removeItem(versionsKey);
      storage.removeItem(metaKey);
      
      setState(prev => ({
        ...prev,
        lastSaved: null,
        recoveredData: null,
        saveCount: 0,
        hasUnsavedChanges: false
      }));

      notificationService.showInfo(
        'Data Cleared',
        'All saved data has been cleared.'
      );

    } catch (error) {
      console.error('Failed to clear saved data:', error);
    }
  }, [getStorage, dataKey, versionsKey, metaKey, notificationService]);

  /**
   * Export data as JSON
   */
  const exportData = useCallback((): string => {
    const versions = getSavedVersions();
    const metadata = {
      key,
      exportedAt: new Date().toISOString(),
      versions: versions.length,
      storage
    };

    return JSON.stringify({
      metadata,
      versions,
      currentData: data
    }, null, 2);
  }, [getSavedVersions, key, storage, data]);

  /**
   * Import data from JSON
   */
  const importData = useCallback((jsonData: string): void => {
    try {
      const importedData = JSON.parse(jsonData);
      
      if (!importedData.versions || !Array.isArray(importedData.versions)) {
        throw new Error('Invalid import data format');
      }

      const storage = getStorage();
      
      // Import versions
      storage.setItem(versionsKey, JSON.stringify(importedData.versions));
      
      // Import current data if available
      if (importedData.currentData) {
        const latestVersion = importedData.versions[0];
        if (latestVersion) {
          storage.setItem(dataKey, JSON.stringify(latestVersion));
        }
      }

      notificationService.showSuccess(
        'Data Imported',
        `Successfully imported ${importedData.versions.length} versions.`
      );

      // Trigger restore if callback is provided
      if (importedData.currentData && onRestore) {
        onRestore(importedData.currentData);
      }

    } catch (error) {
      console.error('Failed to import data:', error);
      notificationService.showError('DATA_IMPORT_FAILED', {
        errorData: { message: (error as Error).message }
      });
    }
  }, [getStorage, versionsKey, dataKey, notificationService, onRestore]);

  // Auto-save effect
  useEffect(() => {
    if (!data) return;

    const serializedData = JSON.stringify(data);
    
    // Check if data has changed
    if (lastDataRef.current !== serializedData) {
      setState(prev => ({ ...prev, hasUnsavedChanges: true }));
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        saveData(data);
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, saveData]);

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadData();
    if (savedData && onRestore) {
      onRestore(savedData);
    }
  }, [loadData, onRestore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    forceSave,
    clearSaved,
    restoreVersion,
    getSavedVersions,
    exportData,
    importData
  };
} 