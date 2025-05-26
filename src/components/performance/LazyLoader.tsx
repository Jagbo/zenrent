/**
 * Lazy Loading Component System
 * Provides lazy loading capabilities for components, images, and data
 */

import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

// Generic lazy loading wrapper with error boundary
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  retryable?: boolean;
  onError?: (error: Error) => void;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback,
  errorFallback,
  retryable = true,
  onError
}) => {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  );

  const defaultErrorFallback = (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
      <p className="text-gray-700 mb-4">Failed to load component</p>
      {retryable && (
        <button
          onClick={() => {
            setHasError(false);
            setRetryCount(prev => prev + 1);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      )}
    </div>
  );

  if (hasError) {
    return <>{errorFallback || defaultErrorFallback}</>;
  }

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <ErrorBoundary
        onError={(error) => {
          setHasError(true);
          onError?.(error);
        }}
        retryCount={retryCount}
      >
        {children}
      </ErrorBoundary>
    </Suspense>
  );
};

// Error boundary for lazy loaded components
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void; retryCount: number },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
    this.props.onError?.(error);
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.retryCount !== this.props.retryCount) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return null; // Let parent handle error display
    }

    return this.props.children;
  }
}

// Intersection Observer based lazy loading for images and content
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder ? (
            <img src={placeholder} alt="" className="opacity-50" />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded" />
          )}
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
      )}

      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
        />
      )}
    </div>
  );
};

// Lazy loading for content sections
interface LazyContentProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  fallback?: React.ReactNode;
  className?: string;
}

export const LazyContent: React.FC<LazyContentProps> = ({
  children,
  threshold = 0.1,
  rootMargin = '50px',
  fallback,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultFallback = (
    <div className="h-32 bg-gray-100 animate-pulse rounded" />
  );

  return (
    <div ref={contentRef} className={className}>
      {isVisible ? children : (fallback || defaultFallback)}
    </div>
  );
};

// Lazy loading for data/API calls
interface LazyDataProps<T> {
  loader: () => Promise<T>;
  children: (data: T) => React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: (error: Error, retry: () => void) => React.ReactNode;
  dependencies?: any[];
}

export function LazyData<T>({
  loader,
  children,
  fallback,
  errorFallback,
  dependencies = []
}: LazyDataProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await loader();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, dependencies);

  const defaultFallback = (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      <span className="ml-2 text-gray-600">Loading data...</span>
    </div>
  );

  const defaultErrorFallback = (error: Error, retry: () => void) => (
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
      <p className="text-gray-700 mb-2">Failed to load data</p>
      <p className="text-sm text-gray-500 mb-4">{error.message}</p>
      <button
        onClick={retry}
        className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </button>
    </div>
  );

  if (loading) {
    return <>{fallback || defaultFallback}</>;
  }

  if (error) {
    return <>{errorFallback?.(error, loadData) || defaultErrorFallback(error, loadData)}</>;
  }

  if (data === null) {
    return <>{fallback || defaultFallback}</>;
  }

  return <>{children(data)}</>;
}

// Preload utilities
export const preloadComponent = (componentLoader: () => Promise<any>) => {
  // Start loading the component
  componentLoader().catch(console.error);
};

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Lazy route component factory
export const createLazyRoute = (
  componentLoader: () => Promise<{ default: React.ComponentType<any> }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(componentLoader);
  
  return (props: any) => (
    <LazyWrapper fallback={fallback}>
      <LazyComponent {...props} />
    </LazyWrapper>
  );
};

// Performance monitoring for lazy loading
export const useLazyLoadingMetrics = () => {
  const [metrics, setMetrics] = useState({
    componentsLoaded: 0,
    totalLoadTime: 0,
    averageLoadTime: 0,
    errors: 0
  });

  const recordLoad = (loadTime: number) => {
    setMetrics(prev => {
      const newComponentsLoaded = prev.componentsLoaded + 1;
      const newTotalLoadTime = prev.totalLoadTime + loadTime;
      return {
        componentsLoaded: newComponentsLoaded,
        totalLoadTime: newTotalLoadTime,
        averageLoadTime: newTotalLoadTime / newComponentsLoaded,
        errors: prev.errors
      };
    });
  };

  const recordError = () => {
    setMetrics(prev => ({
      ...prev,
      errors: prev.errors + 1
    }));
  };

  return { metrics, recordLoad, recordError };
}; 