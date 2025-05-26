/**
 * Graceful Degradation Service
 * Provides fallback functionality when external services are unavailable
 */

import { ErrorNotificationService } from './errorNotificationService';

export interface ServiceStatus {
  name: string;
  available: boolean;
  lastChecked: string;
  responseTime?: number;
  errorCount: number;
  fallbackActive: boolean;
  healthCheckUrl?: string;
}

export interface FallbackStrategy {
  serviceName: string;
  strategy: 'cache' | 'local' | 'simplified' | 'offline' | 'queue';
  description: string;
  limitations: string[];
  dataSource?: string;
  retryInterval?: number;
}

export interface DegradationConfig {
  maxRetries: number;
  retryInterval: number;
  healthCheckInterval: number;
  fallbackTimeout: number;
  services: {
    [serviceName: string]: {
      healthCheckUrl?: string;
      fallbackStrategy: FallbackStrategy;
      criticalService: boolean;
    };
  };
}

export class GracefulDegradationService {
  private static instance: GracefulDegradationService;
  private serviceStatuses: Map<string, ServiceStatus> = new Map();
  private fallbackStrategies: Map<string, FallbackStrategy> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();
  private notificationService: ErrorNotificationService;
  private config: DegradationConfig;

  private constructor() {
    this.notificationService = ErrorNotificationService.getInstance();
    this.config = this.getDefaultConfig();
    this.initializeServices();
  }

  public static getInstance(): GracefulDegradationService {
    if (!GracefulDegradationService.instance) {
      GracefulDegradationService.instance = new GracefulDegradationService();
    }
    return GracefulDegradationService.instance;
  }

  private getDefaultConfig(): DegradationConfig {
    return {
      maxRetries: 3,
      retryInterval: 5000, // 5 seconds
      healthCheckInterval: 30000, // 30 seconds
      fallbackTimeout: 10000, // 10 seconds
      services: {
        'hmrc-api': {
          healthCheckUrl: '/api/hmrc/status',
          criticalService: true,
          fallbackStrategy: {
            serviceName: 'hmrc-api',
            strategy: 'cache',
            description: 'Use cached data and queue submissions for later',
            limitations: [
              'Real-time data may not be available',
              'Submissions will be queued until service is restored',
              'Some features may be limited'
            ],
            dataSource: 'local_cache',
            retryInterval: 60000 // 1 minute
          }
        },
        'supabase': {
          healthCheckUrl: '/api/health/database',
          criticalService: true,
          fallbackStrategy: {
            serviceName: 'supabase',
            strategy: 'local',
            description: 'Use local storage for temporary data persistence',
            limitations: [
              'Data will be stored locally until database is available',
              'Multi-user features may not work',
              'Data sync required when service is restored'
            ],
            dataSource: 'localStorage',
            retryInterval: 30000 // 30 seconds
          }
        },
        'auth-service': {
          healthCheckUrl: '/api/auth/status',
          criticalService: true,
          fallbackStrategy: {
            serviceName: 'auth-service',
            strategy: 'simplified',
            description: 'Use simplified authentication with local session',
            limitations: [
              'Limited authentication features',
              'Session may not persist across devices',
              'Some security features may be disabled'
            ],
            dataSource: 'sessionStorage',
            retryInterval: 15000 // 15 seconds
          }
        },
        'tax-calculator': {
          criticalService: false,
          fallbackStrategy: {
            serviceName: 'tax-calculator',
            strategy: 'local',
            description: 'Use client-side tax calculation',
            limitations: [
              'May not include latest tax rules',
              'Complex calculations may be simplified',
              'Results should be verified when service is restored'
            ],
            dataSource: 'client_calculation'
          }
        },
        'notification-service': {
          criticalService: false,
          fallbackStrategy: {
            serviceName: 'notification-service',
            strategy: 'simplified',
            description: 'Use basic browser notifications',
            limitations: [
              'Limited notification features',
              'No push notifications',
              'Notifications may not persist'
            ],
            dataSource: 'browser_notifications'
          }
        }
      }
    };
  }

  private initializeServices(): void {
    Object.entries(this.config.services).forEach(([serviceName, serviceConfig]) => {
      // Initialize service status
      this.serviceStatuses.set(serviceName, {
        name: serviceName,
        available: true, // Assume available initially
        lastChecked: new Date().toISOString(),
        errorCount: 0,
        fallbackActive: false,
        healthCheckUrl: serviceConfig.healthCheckUrl
      });

      // Store fallback strategy
      this.fallbackStrategies.set(serviceName, serviceConfig.fallbackStrategy);

      // Start health checks if URL is provided
      if (serviceConfig.healthCheckUrl) {
        this.startHealthCheck(serviceName, serviceConfig.healthCheckUrl);
      }
    });
  }

  /**
   * Start health check for a service
   */
  private startHealthCheck(serviceName: string, healthCheckUrl: string): void {
    const interval = setInterval(async () => {
      await this.checkServiceHealth(serviceName, healthCheckUrl);
    }, this.config.healthCheckInterval);

    this.healthCheckIntervals.set(serviceName, interval);

    // Initial health check
    this.checkServiceHealth(serviceName, healthCheckUrl);
  }

  /**
   * Check health of a specific service
   */
  private async checkServiceHealth(serviceName: string, healthCheckUrl: string): Promise<void> {
    const status = this.serviceStatuses.get(serviceName);
    if (!status) return;

    const startTime = Date.now();

    try {
      const response = await fetch(healthCheckUrl, {
        method: 'GET',
        timeout: this.config.fallbackTimeout
      } as RequestInit);

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;

      if (isHealthy) {
        // Service is healthy
        if (!status.available) {
          // Service was down, now recovered
          await this.handleServiceRecovery(serviceName);
        }

        status.available = true;
        status.responseTime = responseTime;
        status.errorCount = 0;
        status.fallbackActive = false;
      } else {
        // Service returned error
        await this.handleServiceError(serviceName, new Error(`HTTP ${response.status}`));
      }

      status.lastChecked = new Date().toISOString();

    } catch (error) {
      await this.handleServiceError(serviceName, error as Error);
    }
  }

  /**
   * Handle service error and potentially activate fallback
   */
  private async handleServiceError(serviceName: string, error: Error): Promise<void> {
    const status = this.serviceStatuses.get(serviceName);
    if (!status) return;

    status.errorCount++;
    status.lastChecked = new Date().toISOString();

    // If error count exceeds threshold, mark service as unavailable
    if (status.errorCount >= this.config.maxRetries && status.available) {
      status.available = false;
      await this.activateFallback(serviceName);
    }
  }

  /**
   * Handle service recovery
   */
  private async handleServiceRecovery(serviceName: string): Promise<void> {
    const status = this.serviceStatuses.get(serviceName);
    if (!status) return;

    console.log(`Service ${serviceName} has recovered`);

    // Deactivate fallback
    await this.deactivateFallback(serviceName);

    // Show recovery notification
    this.notificationService.showSuccess(
      'Service Restored',
      `${serviceName} is now available. Full functionality has been restored.`,
      true,
      5000
    );

    // Process any queued operations
    await this.processQueuedOperations(serviceName);
  }

  /**
   * Activate fallback for a service
   */
  private async activateFallback(serviceName: string): Promise<void> {
    const status = this.serviceStatuses.get(serviceName);
    const strategy = this.fallbackStrategies.get(serviceName);
    
    if (!status || !strategy) return;

    status.fallbackActive = true;

    console.log(`Activating fallback for ${serviceName}:`, strategy);

    // Show degradation notification
    this.notificationService.showWarning(
      'Service Temporarily Unavailable',
      `${serviceName} is currently unavailable. ${strategy.description}`,
      [
        {
          id: 'view_limitations',
          label: 'View Limitations',
          action: 'show_limitations',
          parameters: { serviceName, limitations: strategy.limitations }
        },
        {
          id: 'retry_service',
          label: 'Retry Now',
          action: 'retry_service',
          parameters: { serviceName }
        }
      ],
      false
    );

    // Initialize fallback based on strategy
    await this.initializeFallback(serviceName, strategy);
  }

  /**
   * Deactivate fallback for a service
   */
  private async deactivateFallback(serviceName: string): Promise<void> {
    const status = this.serviceStatuses.get(serviceName);
    if (!status) return;

    status.fallbackActive = false;

    // Clean up fallback resources
    await this.cleanupFallback(serviceName);
  }

  /**
   * Initialize fallback based on strategy
   */
  private async initializeFallback(serviceName: string, strategy: FallbackStrategy): Promise<void> {
    switch (strategy.strategy) {
      case 'cache':
        await this.initializeCacheFallback(serviceName);
        break;
      case 'local':
        await this.initializeLocalFallback(serviceName);
        break;
      case 'simplified':
        await this.initializeSimplifiedFallback(serviceName);
        break;
      case 'offline':
        await this.initializeOfflineFallback(serviceName);
        break;
      case 'queue':
        await this.initializeQueueFallback(serviceName);
        break;
    }
  }

  /**
   * Initialize cache-based fallback
   */
  private async initializeCacheFallback(serviceName: string): Promise<void> {
    // Load cached data from localStorage or IndexedDB
    const cacheKey = `fallback_cache_${serviceName}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      console.log(`Using cached data for ${serviceName}`);
    } else {
      console.warn(`No cached data available for ${serviceName}`);
    }
  }

  /**
   * Initialize local storage fallback
   */
  private async initializeLocalFallback(serviceName: string): Promise<void> {
    // Set up local storage for temporary data persistence
    const localKey = `fallback_local_${serviceName}`;
    
    if (!localStorage.getItem(localKey)) {
      localStorage.setItem(localKey, JSON.stringify({
        initialized: true,
        timestamp: new Date().toISOString(),
        data: {}
      }));
    }
  }

  /**
   * Initialize simplified fallback
   */
  private async initializeSimplifiedFallback(serviceName: string): Promise<void> {
    // Enable simplified mode for the service
    console.log(`Enabling simplified mode for ${serviceName}`);
  }

  /**
   * Initialize offline fallback
   */
  private async initializeOfflineFallback(serviceName: string): Promise<void> {
    // Enable offline mode
    console.log(`Enabling offline mode for ${serviceName}`);
  }

  /**
   * Initialize queue-based fallback
   */
  private async initializeQueueFallback(serviceName: string): Promise<void> {
    // Set up operation queue
    const queueKey = `fallback_queue_${serviceName}`;
    
    if (!localStorage.getItem(queueKey)) {
      localStorage.setItem(queueKey, JSON.stringify([]));
    }
  }

  /**
   * Clean up fallback resources
   */
  private async cleanupFallback(serviceName: string): Promise<void> {
    // Clean up any fallback-specific resources
    console.log(`Cleaning up fallback resources for ${serviceName}`);
  }

  /**
   * Process queued operations when service recovers
   */
  private async processQueuedOperations(serviceName: string): Promise<void> {
    const queueKey = `fallback_queue_${serviceName}`;
    const queueData = localStorage.getItem(queueKey);
    
    if (queueData) {
      try {
        const queue = JSON.parse(queueData);
        
        if (queue.length > 0) {
          console.log(`Processing ${queue.length} queued operations for ${serviceName}`);
          
          // Process each queued operation
          for (const operation of queue) {
            try {
              await this.executeQueuedOperation(serviceName, operation);
            } catch (error) {
              console.error('Error processing queued operation:', error);
            }
          }
          
          // Clear the queue
          localStorage.removeItem(queueKey);
        }
      } catch (error) {
        console.error('Error processing queue:', error);
      }
    }
  }

  /**
   * Execute a queued operation
   */
  private async executeQueuedOperation(serviceName: string, operation: any): Promise<void> {
    // Implementation depends on the specific operation type
    console.log(`Executing queued operation for ${serviceName}:`, operation);
  }

  /**
   * Check if a service is available
   */
  public isServiceAvailable(serviceName: string): boolean {
    const status = this.serviceStatuses.get(serviceName);
    return status?.available || false;
  }

  /**
   * Check if fallback is active for a service
   */
  public isFallbackActive(serviceName: string): boolean {
    const status = this.serviceStatuses.get(serviceName);
    return status?.fallbackActive || false;
  }

  /**
   * Get service status
   */
  public getServiceStatus(serviceName: string): ServiceStatus | null {
    return this.serviceStatuses.get(serviceName) || null;
  }

  /**
   * Get all service statuses
   */
  public getAllServiceStatuses(): ServiceStatus[] {
    return Array.from(this.serviceStatuses.values());
  }

  /**
   * Get fallback strategy for a service
   */
  public getFallbackStrategy(serviceName: string): FallbackStrategy | null {
    return this.fallbackStrategies.get(serviceName) || null;
  }

  /**
   * Manually trigger fallback for a service
   */
  public async triggerFallback(serviceName: string): Promise<void> {
    const status = this.serviceStatuses.get(serviceName);
    if (!status) return;

    status.available = false;
    await this.activateFallback(serviceName);
  }

  /**
   * Manually restore a service
   */
  public async restoreService(serviceName: string): Promise<void> {
    const status = this.serviceStatuses.get(serviceName);
    if (!status) return;

    status.available = true;
    status.errorCount = 0;
    await this.handleServiceRecovery(serviceName);
  }

  /**
   * Queue an operation for later execution
   */
  public queueOperation(serviceName: string, operation: any): void {
    const queueKey = `fallback_queue_${serviceName}`;
    const queueData = localStorage.getItem(queueKey);
    
    let queue = [];
    if (queueData) {
      try {
        queue = JSON.parse(queueData);
      } catch (error) {
        console.error('Error parsing queue data:', error);
      }
    }
    
    queue.push({
      ...operation,
      timestamp: new Date().toISOString()
    });
    
    localStorage.setItem(queueKey, JSON.stringify(queue));
  }

  /**
   * Get system health summary
   */
  public getSystemHealth(): {
    overall: 'healthy' | 'degraded' | 'critical';
    availableServices: number;
    totalServices: number;
    criticalServicesDown: number;
    fallbacksActive: number;
  } {
    const statuses = this.getAllServiceStatuses();
    const availableServices = statuses.filter(s => s.available).length;
    const fallbacksActive = statuses.filter(s => s.fallbackActive).length;
    
    const criticalServices = Object.entries(this.config.services)
      .filter(([_, config]) => config.criticalService)
      .map(([name]) => name);
    
    const criticalServicesDown = criticalServices.filter(
      name => !this.isServiceAvailable(name)
    ).length;

    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (criticalServicesDown > 0) {
      overall = 'critical';
    } else if (fallbacksActive > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      availableServices,
      totalServices: statuses.length,
      criticalServicesDown,
      fallbacksActive
    };
  }

  /**
   * Cleanup on service shutdown
   */
  public cleanup(): void {
    // Clear all health check intervals
    this.healthCheckIntervals.forEach(interval => {
      clearInterval(interval);
    });
    this.healthCheckIntervals.clear();
  }
} 