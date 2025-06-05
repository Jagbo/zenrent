import { toast } from "sonner";

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export class ApiRequestError extends Error {
  public code?: string;
  public status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
  }
}

// Retry configuration
export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

const defaultRetryConfig: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  shouldRetry: (error) => {
    // Retry on network errors or 5xx status codes
    if (!error.status) return true;
    return error.status >= 500 && error.status < 600;
  },
};

// Retry wrapper for API calls
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: RetryConfig
): Promise<T> {
  const { maxRetries, retryDelay, backoffMultiplier, shouldRetry } = {
    ...defaultRetryConfig,
    ...config,
  };

  let lastError: any;
  let delay = retryDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
}

// Standard error handler for API responses
export function handleApiError(error: any): ApiError {
  if (error.response) {
    // Server responded with error
    return {
      message: error.response.data?.message || "An error occurred",
      code: error.response.data?.code,
      status: error.response.status,
    };
  } else if (error.request) {
    // Request made but no response
    return {
      message: "Network error - please check your connection",
      code: "NETWORK_ERROR",
    };
  } else {
    // Something else happened
    return {
      message: error.message || "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    };
  }
}

// Toast notification helper
export function showErrorToast(error: ApiError | string) {
  const message = typeof error === "string" ? error : error.message;
  toast.error(message);
}

export function showSuccessToast(message: string) {
  toast.success(message);
}

// Loading state manager
export class LoadingStateManager {
  private loadingStates: Map<string, boolean> = new Map();
  private listeners: Map<string, Set<(loading: boolean) => void>> = new Map();

  setLoading(key: string, loading: boolean) {
    this.loadingStates.set(key, loading);
    this.notifyListeners(key, loading);
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  subscribe(key: string, callback: (loading: boolean) => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  private notifyListeners(key: string, loading: boolean) {
    this.listeners.get(key)?.forEach((callback) => callback(loading));
  }
}

export const loadingManager = new LoadingStateManager(); 