/**
 * Backup Submission Storage Service
 * Manages offline submission storage and synchronization
 */

import { ErrorNotificationService } from './errorNotificationService';
import { GracefulDegradationService } from './gracefulDegradationService';

export interface BackupSubmission {
  id: string;
  userId: string;
  submissionType: 'personal' | 'company';
  taxYear: string;
  data: any;
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  createdAt: string;
  updatedAt: string;
  lastSyncAttempt?: string;
  syncAttempts: number;
  errorMessage?: string;
  checksum: string;
  priority: 'high' | 'medium' | 'low';
  metadata: {
    formVersion: string;
    userAgent: string;
    timestamp: string;
    source: 'auto' | 'manual' | 'recovery';
  };
}

export interface SyncResult {
  success: boolean;
  submissionId: string;
  hmrcReference?: string;
  error?: string;
  conflictData?: any;
}

export interface BackupStats {
  total: number;
  pending: number;
  synced: number;
  failed: number;
  conflicts: number;
  lastSync: string | null;
  nextSync: string | null;
}

export class BackupSubmissionService {
  private static instance: BackupSubmissionService;
  private notificationService: ErrorNotificationService;
  private degradationService: GracefulDegradationService;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'backup_submissions';
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_SYNC_ATTEMPTS = 5;

  private constructor() {
    this.notificationService = ErrorNotificationService.getInstance();
    this.degradationService = GracefulDegradationService.getInstance();
    this.initializeSync();
  }

  public static getInstance(): BackupSubmissionService {
    if (!BackupSubmissionService.instance) {
      BackupSubmissionService.instance = new BackupSubmissionService();
    }
    return BackupSubmissionService.instance;
  }

  /**
   * Initialize automatic sync
   */
  private initializeSync(): void {
    // Start sync interval
    this.syncInterval = setInterval(() => {
      this.syncPendingSubmissions();
    }, this.SYNC_INTERVAL);

    // Sync on page visibility change
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.syncPendingSubmissions();
        }
      });
    }

    // Sync when online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.syncPendingSubmissions();
      });
    }
  }

  /**
   * Generate checksum for data integrity
   */
  private generateChecksum(data: any): string {
    const serialized = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      const char = serialized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Get all backup submissions from storage
   */
  private getBackupSubmissions(): BackupSubmission[] {
    try {
      if (typeof localStorage === 'undefined') {
        return [];
      }
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load backup submissions:', error);
      return [];
    }
  }

  /**
   * Save backup submissions to storage
   */
  private saveBackupSubmissions(submissions: BackupSubmission[]): void {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(submissions));
    } catch (error) {
      console.error('Failed to save backup submissions:', error);
      this.notificationService.showError('BACKUP_SAVE_FAILED', {
        errorData: { message: (error as Error).message }
      });
    }
  }

  /**
   * Create a backup submission
   */
  public createBackup(
    userId: string,
    submissionType: 'personal' | 'company',
    taxYear: string,
    data: any,
    priority: 'high' | 'medium' | 'low' = 'medium',
    source: 'auto' | 'manual' | 'recovery' = 'auto'
  ): string {
    const submissions = this.getBackupSubmissions();
    
    const backup: BackupSubmission = {
      id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      submissionType,
      taxYear,
      data,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncAttempts: 0,
      checksum: this.generateChecksum(data),
      priority,
      metadata: {
        formVersion: '1.0.0', // This could be dynamic
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        timestamp: new Date().toISOString(),
        source
      }
    };

    submissions.push(backup);
    this.saveBackupSubmissions(submissions);

    this.notificationService.showInfo(
      'Submission Backed Up',
      'Your submission has been saved locally and will be submitted when connection is restored.',
      true,
      3000
    );

    // Try immediate sync if online
    if (typeof navigator !== 'undefined' && navigator.onLine && this.degradationService.isServiceAvailable('hmrc-api')) {
      this.syncSubmission(backup.id);
    }

    return backup.id;
  }

  /**
   * Update backup submission
   */
  public updateBackup(
    backupId: string,
    data: any,
    priority?: 'high' | 'medium' | 'low'
  ): boolean {
    const submissions = this.getBackupSubmissions();
    const index = submissions.findIndex(s => s.id === backupId);
    
    if (index === -1) return false;

    const submission = submissions[index];
    submission.data = data;
    submission.updatedAt = new Date().toISOString();
    submission.checksum = this.generateChecksum(data);
    
    if (priority) {
      submission.priority = priority;
    }

    // Reset sync status if data changed
    if (submission.status === 'synced') {
      submission.status = 'pending';
      submission.syncAttempts = 0;
    }

    this.saveBackupSubmissions(submissions);
    return true;
  }

  /**
   * Get backup submission by ID
   */
  public getBackup(backupId: string): BackupSubmission | null {
    const submissions = this.getBackupSubmissions();
    return submissions.find(s => s.id === backupId) || null;
  }

  /**
   * Get all backup submissions for a user
   */
  public getUserBackups(userId: string): BackupSubmission[] {
    const submissions = this.getBackupSubmissions();
    return submissions.filter(s => s.userId === userId);
  }

  /**
   * Get pending submissions
   */
  public getPendingSubmissions(userId?: string): BackupSubmission[] {
    const submissions = this.getBackupSubmissions();
    let pending = submissions.filter(s => s.status === 'pending' || s.status === 'failed');
    
    if (userId) {
      pending = pending.filter(s => s.userId === userId);
    }

    // Sort by priority and creation date
    return pending.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  /**
   * Sync a specific submission
   */
  public async syncSubmission(backupId: string): Promise<SyncResult> {
    const submissions = this.getBackupSubmissions();
    const index = submissions.findIndex(s => s.id === backupId);
    
    if (index === -1) {
      return {
        success: false,
        submissionId: backupId,
        error: 'Backup submission not found'
      };
    }

    const submission = submissions[index];
    
    // Check if already synced
    if (submission.status === 'synced') {
      return {
        success: true,
        submissionId: backupId
      };
    }

    // Check if max attempts reached
    if (submission.syncAttempts >= this.MAX_SYNC_ATTEMPTS) {
      submission.status = 'failed';
      submission.errorMessage = 'Maximum sync attempts reached';
      this.saveBackupSubmissions(submissions);
      
      return {
        success: false,
        submissionId: backupId,
        error: 'Maximum sync attempts reached'
      };
    }

    // Update sync status
    submission.status = 'syncing';
    submission.syncAttempts++;
    submission.lastSyncAttempt = new Date().toISOString();
    this.saveBackupSubmissions(submissions);

    try {
      // Verify data integrity
      const currentChecksum = this.generateChecksum(submission.data);
      if (currentChecksum !== submission.checksum) {
        throw new Error('Data integrity check failed');
      }

      // Submit to HMRC API
      const response = await fetch('/api/hmrc/submit-return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionType: submission.submissionType,
          taxYear: submission.taxYear,
          draftData: submission.data,
          backupId: submission.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();

      // Update submission status
      submission.status = 'synced';
      submission.updatedAt = new Date().toISOString();
      submission.errorMessage = undefined;
      this.saveBackupSubmissions(submissions);

      this.notificationService.showSuccess(
        'Submission Synced',
        `Your ${submission.submissionType} tax return for ${submission.taxYear} has been successfully submitted.`
      );

      return {
        success: true,
        submissionId: backupId,
        hmrcReference: result.hmrcReference
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if it's a conflict error
      if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
        submission.status = 'conflict';
        submission.errorMessage = errorMessage;
        
        this.notificationService.showWarning(
          'Submission Conflict',
          `A submission for ${submission.taxYear} already exists. Please review and resolve the conflict.`,
          [
            {
              id: 'resolve_conflict',
              label: 'Resolve Conflict',
              action: 'resolve_conflict',
              parameters: { backupId }
            }
          ]
        );

        return {
          success: false,
          submissionId: backupId,
          error: errorMessage,
          conflictData: submission.data
        };
      }

      // Update error status
      submission.status = 'failed';
      submission.errorMessage = errorMessage;
      submission.updatedAt = new Date().toISOString();
      this.saveBackupSubmissions(submissions);

      return {
        success: false,
        submissionId: backupId,
        error: errorMessage
      };
    }
  }

  /**
   * Sync all pending submissions
   */
  public async syncPendingSubmissions(): Promise<void> {
    // Check if HMRC service is available
    if (!this.degradationService.isServiceAvailable('hmrc-api')) {
      return;
    }

    const pending = this.getPendingSubmissions();
    
    if (pending.length === 0) {
      return;
    }

    console.log(`Syncing ${pending.length} pending submissions`);

    // Process submissions in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < pending.length; i += batchSize) {
      const batch = pending.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(submission => this.syncSubmission(submission.id))
      );

      // Wait between batches
      if (i + batchSize < pending.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * Delete backup submission
   */
  public deleteBackup(backupId: string): boolean {
    const submissions = this.getBackupSubmissions();
    const index = submissions.findIndex(s => s.id === backupId);
    
    if (index === -1) return false;

    submissions.splice(index, 1);
    this.saveBackupSubmissions(submissions);
    return true;
  }

  /**
   * Clear all synced submissions
   */
  public clearSyncedSubmissions(userId?: string): number {
    const submissions = this.getBackupSubmissions();
    let toRemove = submissions.filter(s => s.status === 'synced');
    
    if (userId) {
      toRemove = toRemove.filter(s => s.userId === userId);
    }

    const remaining = submissions.filter(s => 
      s.status !== 'synced' || (userId && s.userId !== userId)
    );

    this.saveBackupSubmissions(remaining);
    return toRemove.length;
  }

  /**
   * Export backup submissions
   */
  public exportBackups(userId?: string): string {
    let submissions = this.getBackupSubmissions();
    
    if (userId) {
      submissions = submissions.filter(s => s.userId === userId);
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      userId,
      submissions
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import backup submissions
   */
  public importBackups(jsonData: string): number {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.submissions || !Array.isArray(importData.submissions)) {
        throw new Error('Invalid import data format');
      }

      const existingSubmissions = this.getBackupSubmissions();
      const existingIds = new Set(existingSubmissions.map(s => s.id));
      
      // Filter out duplicates
      const newSubmissions = importData.submissions.filter(
        (s: BackupSubmission) => !existingIds.has(s.id)
      );

      if (newSubmissions.length === 0) {
        this.notificationService.showInfo(
          'No New Data',
          'All submissions in the import file already exist.'
        );
        return 0;
      }

      // Add new submissions
      const allSubmissions = [...existingSubmissions, ...newSubmissions];
      this.saveBackupSubmissions(allSubmissions);

      this.notificationService.showSuccess(
        'Import Successful',
        `Imported ${newSubmissions.length} backup submissions.`
      );

      return newSubmissions.length;

    } catch (error) {
      console.error('Failed to import backups:', error);
      this.notificationService.showError('BACKUP_IMPORT_FAILED', {
        errorData: { message: (error as Error).message }
      });
      return 0;
    }
  }

  /**
   * Get backup statistics
   */
  public getStats(userId?: string): BackupStats {
    let submissions = this.getBackupSubmissions();
    
    if (userId) {
      submissions = submissions.filter(s => s.userId === userId);
    }

    const stats = {
      total: submissions.length,
      pending: submissions.filter(s => s.status === 'pending').length,
      synced: submissions.filter(s => s.status === 'synced').length,
      failed: submissions.filter(s => s.status === 'failed').length,
      conflicts: submissions.filter(s => s.status === 'conflict').length,
      lastSync: null as string | null,
      nextSync: null as string | null
    };

    // Find last sync time
    const syncedSubmissions = submissions.filter(s => s.status === 'synced');
    if (syncedSubmissions.length > 0) {
      stats.lastSync = syncedSubmissions
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
        .updatedAt;
    }

    // Calculate next sync time
    if (stats.pending > 0 || stats.failed > 0) {
      const nextSyncTime = new Date(Date.now() + this.SYNC_INTERVAL);
      stats.nextSync = nextSyncTime.toISOString();
    }

    return stats;
  }

  /**
   * Force immediate sync
   */
  public async forceSyncAll(): Promise<void> {
    await this.syncPendingSubmissions();
  }

  /**
   * Resolve conflict for a submission
   */
  public resolveConflict(
    backupId: string,
    resolution: 'keep_local' | 'keep_remote' | 'merge'
  ): boolean {
    const submissions = this.getBackupSubmissions();
    const index = submissions.findIndex(s => s.id === backupId);
    
    if (index === -1) return false;

    const submission = submissions[index];
    
    if (submission.status !== 'conflict') return false;

    switch (resolution) {
      case 'keep_local':
        submission.status = 'pending';
        submission.syncAttempts = 0;
        submission.errorMessage = undefined;
        break;
      case 'keep_remote':
        submission.status = 'synced';
        submission.errorMessage = undefined;
        break;
      case 'merge':
        // This would require custom merge logic
        submission.status = 'pending';
        submission.syncAttempts = 0;
        submission.errorMessage = undefined;
        break;
    }

    submission.updatedAt = new Date().toISOString();
    this.saveBackupSubmissions(submissions);

    this.notificationService.showSuccess(
      'Conflict Resolved',
      'The submission conflict has been resolved.'
    );

    return true;
  }

  /**
   * Cleanup service
   */
  public cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
} 