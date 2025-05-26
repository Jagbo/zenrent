/**
 * Error Notification Service
 * Manages error notifications and recovery workflows for the application
 */

import { HMRCErrorHandler, HMRCErrorDetails, ErrorRecoveryWorkflow } from './hmrc/hmrcErrorHandler';

export interface ErrorNotification {
  id: string;
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
  category: string;
  timestamp: string;
  actions: NotificationAction[];
  dismissible: boolean;
  autoHide: boolean;
  duration?: number;
  context?: Record<string, any>;
  resolved: boolean;
  retryCount: number;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  parameters?: Record<string, any>;
  primary?: boolean;
  loading?: boolean;
}

export interface ErrorRecoveryProgress {
  notificationId: string;
  currentStep: number;
  totalSteps: number;
  stepDescription: string;
  estimatedTimeRemaining?: string;
  canCancel: boolean;
}

export type NotificationEventType = 
  | 'notification_added'
  | 'notification_updated'
  | 'notification_dismissed'
  | 'notification_resolved'
  | 'recovery_started'
  | 'recovery_progress'
  | 'recovery_completed'
  | 'recovery_failed';

export interface NotificationEvent {
  type: NotificationEventType;
  notification: ErrorNotification;
  progress?: ErrorRecoveryProgress;
}

export type NotificationListener = (event: NotificationEvent) => void;

export class ErrorNotificationService {
  private static instance: ErrorNotificationService;
  private notifications: Map<string, ErrorNotification> = new Map();
  private listeners: Set<NotificationListener> = new Set();
  private hmrcErrorHandler: HMRCErrorHandler;
  private recoveryInProgress: Map<string, ErrorRecoveryProgress> = new Map();

  private constructor() {
    this.hmrcErrorHandler = HMRCErrorHandler.getInstance();
  }

  public static getInstance(): ErrorNotificationService {
    if (!ErrorNotificationService.instance) {
      ErrorNotificationService.instance = new ErrorNotificationService();
    }
    return ErrorNotificationService.instance;
  }

  /**
   * Add a listener for notification events
   */
  public addListener(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: NotificationEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Create and show an error notification
   */
  public showError(
    errorCode: string,
    context: Record<string, any> = {},
    userId?: string
  ): string {
    const notificationData = this.hmrcErrorHandler.createErrorNotification(errorCode, context);
    const errorDetails = this.hmrcErrorHandler.mapError(
      context.statusCode || 500,
      context.errorData || {},
      context.originalError
    );

    const notification: ErrorNotification = {
      id: this.generateNotificationId(),
      title: notificationData.title,
      message: notificationData.message,
      severity: notificationData.severity,
      category: errorDetails.category,
      timestamp: new Date().toISOString(),
      actions: notificationData.actions.map((action, index) => ({
        id: `${action.action}_${index}`,
        label: action.label,
        action: action.action,
        parameters: action.parameters,
        primary: index === 0
      })),
      dismissible: notificationData.dismissible,
      autoHide: notificationData.autoHide,
      duration: notificationData.duration,
      context,
      resolved: false,
      retryCount: 0
    };

    this.notifications.set(notification.id, notification);

    // Log error for analytics
    if (userId) {
      this.hmrcErrorHandler.logError(errorCode, userId, context);
    }

    // Auto-hide if configured
    if (notification.autoHide && notification.duration) {
      setTimeout(() => {
        this.dismissNotification(notification.id);
      }, notification.duration);
    }

    this.emit({
      type: 'notification_added',
      notification
    });

    // Start automatic recovery if available
    const workflow = this.hmrcErrorHandler.getRecoveryWorkflow(errorCode);
    if (workflow?.automaticRecovery) {
      this.startRecoveryWorkflow(notification.id, workflow, userId);
    }

    return notification.id;
  }

  /**
   * Show a success notification
   */
  public showSuccess(
    title: string,
    message: string,
    autoHide: boolean = true,
    duration: number = 5000
  ): string {
    const notification: ErrorNotification = {
      id: this.generateNotificationId(),
      title,
      message,
      severity: 'success',
      category: 'SUCCESS',
      timestamp: new Date().toISOString(),
      actions: [],
      dismissible: true,
      autoHide,
      duration: autoHide ? duration : undefined,
      resolved: true,
      retryCount: 0
    };

    this.notifications.set(notification.id, notification);

    if (autoHide && duration) {
      setTimeout(() => {
        this.dismissNotification(notification.id);
      }, duration);
    }

    this.emit({
      type: 'notification_added',
      notification
    });

    return notification.id;
  }

  /**
   * Show a warning notification
   */
  public showWarning(
    title: string,
    message: string,
    actions: NotificationAction[] = [],
    autoHide: boolean = false
  ): string {
    const notification: ErrorNotification = {
      id: this.generateNotificationId(),
      title,
      message,
      severity: 'warning',
      category: 'WARNING',
      timestamp: new Date().toISOString(),
      actions,
      dismissible: true,
      autoHide,
      resolved: false,
      retryCount: 0
    };

    this.notifications.set(notification.id, notification);

    this.emit({
      type: 'notification_added',
      notification
    });

    return notification.id;
  }

  /**
   * Show an info notification
   */
  public showInfo(
    title: string,
    message: string,
    autoHide: boolean = true,
    duration: number = 5000
  ): string {
    const notification: ErrorNotification = {
      id: this.generateNotificationId(),
      title,
      message,
      severity: 'info',
      category: 'INFO',
      timestamp: new Date().toISOString(),
      actions: [],
      dismissible: true,
      autoHide,
      duration: autoHide ? duration : undefined,
      resolved: false,
      retryCount: 0
    };

    this.notifications.set(notification.id, notification);

    if (autoHide && duration) {
      setTimeout(() => {
        this.dismissNotification(notification.id);
      }, duration);
    }

    this.emit({
      type: 'notification_added',
      notification
    });

    return notification.id;
  }

  /**
   * Dismiss a notification
   */
  public dismissNotification(notificationId: string): void {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    this.notifications.delete(notificationId);
    this.recoveryInProgress.delete(notificationId);

    this.emit({
      type: 'notification_dismissed',
      notification
    });
  }

  /**
   * Mark a notification as resolved
   */
  public resolveNotification(notificationId: string, resolutionMethod?: string): void {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    notification.resolved = true;

    // Mark error as resolved in analytics
    if (notification.context?.errorCode && notification.context?.userId) {
      this.hmrcErrorHandler.markErrorResolved(
        notification.context.errorCode,
        notification.context.userId,
        resolutionMethod || 'manual'
      );
    }

    this.emit({
      type: 'notification_resolved',
      notification
    });

    // Auto-dismiss resolved notifications after a delay
    setTimeout(() => {
      this.dismissNotification(notificationId);
    }, 3000);
  }

  /**
   * Handle notification action
   */
  public async handleAction(
    notificationId: string,
    actionId: string,
    parameters?: Record<string, any>
  ): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    const action = notification.actions.find(a => a.id === actionId);
    if (!action) return;

    // Set action as loading
    action.loading = true;
    this.updateNotification(notification);

    try {
      switch (action.action) {
        case 'retry':
          await this.handleRetryAction(notification);
          break;
        case 'auto_retry':
          await this.handleAutoRetryAction(notification);
          break;
        case 'refresh_token':
          await this.handleRefreshTokenAction(notification);
          break;
        case 'contact_support':
          this.handleContactSupportAction(notification);
          break;
        case 'open_documentation':
          this.handleOpenDocumentationAction(action.parameters?.url);
          break;
        case 'redirect':
          this.handleRedirectAction(action.parameters?.url);
          break;
        default:
          console.warn('Unknown action:', action.action);
      }
    } catch (error) {
      console.error('Error handling notification action:', error);
      notification.message = 'Failed to execute action. Please try again.';
      this.updateNotification(notification);
    } finally {
      action.loading = false;
      this.updateNotification(notification);
    }
  }

  /**
   * Start automatic recovery workflow
   */
  private async startRecoveryWorkflow(
    notificationId: string,
    workflow: ErrorRecoveryWorkflow,
    userId?: string
  ): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    const progress: ErrorRecoveryProgress = {
      notificationId,
      currentStep: 0,
      totalSteps: workflow.steps.length,
      stepDescription: workflow.steps[0]?.description || 'Starting recovery...',
      estimatedTimeRemaining: workflow.steps[0]?.estimatedTime,
      canCancel: !workflow.userActionRequired
    };

    this.recoveryInProgress.set(notificationId, progress);

    this.emit({
      type: 'recovery_started',
      notification,
      progress
    });

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        
        progress.currentStep = i;
        progress.stepDescription = step.description;
        progress.estimatedTimeRemaining = step.estimatedTime;

        this.emit({
          type: 'recovery_progress',
          notification,
          progress
        });

        await this.executeRecoveryStep(step, notification, userId);
      }

      // Recovery completed successfully
      this.resolveNotification(notificationId, 'automatic_recovery');
      
      this.emit({
        type: 'recovery_completed',
        notification,
        progress
      });

    } catch (error) {
      console.error('Recovery workflow failed:', error);
      
      notification.message = `Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      notification.severity = 'error';
      this.updateNotification(notification);

      this.emit({
        type: 'recovery_failed',
        notification,
        progress
      });
    } finally {
      this.recoveryInProgress.delete(notificationId);
    }
  }

  /**
   * Execute a single recovery step
   */
  private async executeRecoveryStep(
    step: any,
    notification: ErrorNotification,
    userId?: string
  ): Promise<void> {
    switch (step.action) {
      case 'wait':
        await new Promise(resolve => setTimeout(resolve, step.parameters?.duration || 1000));
        break;
      case 'retry':
        // This would trigger the original operation retry
        // Implementation depends on the specific context
        break;
      case 'refresh_token':
        // This would trigger token refresh
        // Implementation depends on auth service
        break;
      case 'validate_data':
        // This would trigger data validation
        // Implementation depends on validation service
        break;
      default:
        console.warn('Unknown recovery step action:', step.action);
    }
  }

  /**
   * Handle retry action
   */
  private async handleRetryAction(notification: ErrorNotification): Promise<void> {
    notification.retryCount++;
    notification.message = `Retrying... (Attempt ${notification.retryCount})`;
    this.updateNotification(notification);

    // This would trigger the original operation retry
    // Implementation depends on the specific context
  }

  /**
   * Handle auto-retry action
   */
  private async handleAutoRetryAction(notification: ErrorNotification): Promise<void> {
    const errorCode = notification.context?.errorCode;
    if (!errorCode) return;

    const workflow = this.hmrcErrorHandler.getRecoveryWorkflow(errorCode);
    if (workflow) {
      await this.startRecoveryWorkflow(notification.id, workflow, notification.context?.userId);
    }
  }

  /**
   * Handle refresh token action
   */
  private async handleRefreshTokenAction(notification: ErrorNotification): Promise<void> {
    notification.message = 'Refreshing authentication...';
    this.updateNotification(notification);

    // This would trigger token refresh
    // Implementation depends on auth service
  }

  /**
   * Handle contact support action
   */
  private handleContactSupportAction(notification: ErrorNotification): void {
    // This would open support chat or redirect to support page
    window.open('/support', '_blank');
  }

  /**
   * Handle open documentation action
   */
  private handleOpenDocumentationAction(url?: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  /**
   * Handle redirect action
   */
  private handleRedirectAction(url?: string): void {
    if (url) {
      window.location.href = url;
    }
  }

  /**
   * Update an existing notification
   */
  private updateNotification(notification: ErrorNotification): void {
    this.notifications.set(notification.id, notification);
    
    this.emit({
      type: 'notification_updated',
      notification
    });
  }

  /**
   * Get all active notifications
   */
  public getNotifications(): ErrorNotification[] {
    return Array.from(this.notifications.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get notifications by severity
   */
  public getNotificationsBySeverity(severity: ErrorNotification['severity']): ErrorNotification[] {
    return this.getNotifications().filter(n => n.severity === severity);
  }

  /**
   * Get unresolved notifications
   */
  public getUnresolvedNotifications(): ErrorNotification[] {
    return this.getNotifications().filter(n => !n.resolved);
  }

  /**
   * Clear all notifications
   */
  public clearAll(): void {
    const notifications = Array.from(this.notifications.values());
    this.notifications.clear();
    this.recoveryInProgress.clear();

    notifications.forEach(notification => {
      this.emit({
        type: 'notification_dismissed',
        notification
      });
    });
  }

  /**
   * Clear resolved notifications
   */
  public clearResolved(): void {
    const resolvedNotifications = this.getNotifications().filter(n => n.resolved);
    
    resolvedNotifications.forEach(notification => {
      this.dismissNotification(notification.id);
    });
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics(timeRange: { start: Date; end: Date }) {
    return this.hmrcErrorHandler.getErrorStatistics(timeRange);
  }
} 