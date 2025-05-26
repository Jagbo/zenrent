/**
 * Bundle Optimization Utilities
 * Provides tools for reducing bundle size and improving loading performance
 */

// Dynamic import utilities
export const dynamicImports = {
  // Lazy load heavy libraries
  loadChartLibrary: () => import('recharts'),
  loadDateLibrary: () => import('date-fns'),
  loadPDFLibrary: () => import('jspdf'),
  loadExcelLibrary: () => import('xlsx'),
  loadCryptoLibrary: () => import('crypto-js'),
  
  // Tax-specific heavy components
  loadTaxCalculator: () => import('@/services/tax-calculator'),
  loadHMRCClient: () => import('@/lib/services/hmrc/hmrcApiClient'),
  loadTaxForms: () => import('@/components/tax/forms'),
  
  // UI libraries
  loadRichTextEditor: () => import('@monaco-editor/react'),
  loadDataTable: () => import('@tanstack/react-table'),
  loadFormLibrary: () => import('react-hook-form'),
};

// Code splitting utilities
export const createAsyncComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFn);
  
  return React.forwardRef((props: any, ref: any) => 
    React.createElement(React.Suspense, 
      { fallback: fallback ? React.createElement(fallback) : 'Loading...' },
      React.createElement(LazyComponent, { ...props, ref })
    )
  );
};

// Tree shaking helpers
export const treeShakingUtils = {
  // Import only specific functions from lodash
  debounce: () => import('lodash/debounce'),
  throttle: () => import('lodash/throttle'),
  cloneDeep: () => import('lodash/cloneDeep'),
  merge: () => import('lodash/merge'),
  
  // Import specific date-fns functions
  format: () => import('date-fns/format'),
  parseISO: () => import('date-fns/parseISO'),
  addDays: () => import('date-fns/addDays'),
  differenceInDays: () => import('date-fns/differenceInDays'),
  
  // Import specific chart components
  LineChart: () => import('recharts').then(mod => ({ default: mod.LineChart })),
  BarChart: () => import('recharts').then(mod => ({ default: mod.BarChart })),
  PieChart: () => import('recharts').then(mod => ({ default: mod.PieChart })),
};

// Resource hints for preloading
export const resourceHints = {
  preloadCriticalCSS: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
  },

  preloadCriticalJS: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = href;
    document.head.appendChild(link);
  },

  prefetchResource: (href: string, as?: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    if (as) link.as = as;
    link.href = href;
    document.head.appendChild(link);
  },

  preconnectDomain: (domain: string) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    document.head.appendChild(link);
  },

  dnsPrefetch: (domain: string) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  }
};

// Bundle analysis utilities
export const bundleAnalyzer = {
  measureComponentSize: (componentName: string, component: React.ComponentType) => {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    return {
      component,
      onMount: () => {
        const endTime = performance.now();
        const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
        
        console.log(`Component ${componentName} metrics:`, {
          loadTime: endTime - startTime,
          memoryUsage: endMemory - startMemory,
          timestamp: new Date().toISOString()
        });
      }
    };
  },

  trackBundleMetrics: () => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        transferSize: navigation.transferSize,
        encodedBodySize: navigation.encodedBodySize,
        decodedBodySize: navigation.decodedBodySize
      };
    }
    return null;
  }
};

// Critical CSS extraction
export const criticalCSS = {
  extractAboveFoldCSS: () => {
    const criticalSelectors = [
      'body', 'html',
      '.header', '.nav', '.sidebar',
      '.main-content', '.hero',
      '.loading', '.error',
      '.btn-primary', '.btn-secondary',
      '.form-input', '.form-label',
      '.tax-form', '.progress-indicator'
    ];

    const criticalRules: string[] = [];
    
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSStyleRule) {
            const selector = rule.selectorText;
            if (criticalSelectors.some(critical => selector.includes(critical))) {
              criticalRules.push(rule.cssText);
            }
          }
        }
      } catch (e) {
        // Cross-origin stylesheets may throw errors
        console.warn('Could not access stylesheet:', e);
      }
    }

    return criticalRules.join('\n');
  },

  inlineCriticalCSS: (css: string) => {
    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-critical', 'true');
    document.head.insertBefore(style, document.head.firstChild);
  }
};

// Service Worker utilities for caching
export const serviceWorkerUtils = {
  registerSW: async (swPath: string = '/sw.js') => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(swPath);
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  },

  updateSW: async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    }
  },

  cacheTaxAssets: async () => {
    if ('caches' in window) {
      const cache = await caches.open('tax-assets-v1');
      const assetsToCache = [
        '/api/tax/rates',
        '/api/tax/allowances',
        '/api/hmrc/obligations',
        '/images/hmrc-logo.png',
        '/fonts/inter-var.woff2'
      ];
      
      await cache.addAll(assetsToCache);
    }
  }
};

// Image optimization utilities
export const imageOptimizer = {
  createWebPImage: (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Failed to create WebP image'));
          }
        }, 'image/webp', 0.8);
      };
      
      img.onerror = reject;
      img.src = src;
    });
  },

  lazyLoadImages: () => {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  },

  generateResponsiveImageSrcSet: (baseSrc: string, sizes: number[]) => {
    return sizes
      .map(size => `${baseSrc}?w=${size} ${size}w`)
      .join(', ');
  }
};

// Font optimization
export const fontOptimizer = {
  preloadFonts: (fonts: Array<{ href: string; type?: string }>) => {
    fonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = font.type || 'font/woff2';
      link.href = font.href;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  },

  loadFontDisplay: (fontFamily: string, display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional' = 'swap') => {
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: '${fontFamily}';
        font-display: ${display};
      }
    `;
    document.head.appendChild(style);
  }
};

// Performance monitoring
export const performanceMonitor = {
  measureLCP: (): Promise<number> => {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
          observer.disconnect();
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 10000);
      } else {
        resolve(0);
      }
    });
  },

  measureFID: (): Promise<number> => {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstEntry = entries[0];
          resolve(firstEntry.processingStart - firstEntry.startTime);
          observer.disconnect();
        });
        
        observer.observe({ entryTypes: ['first-input'] });
        
        // Fallback timeout
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 10000);
      } else {
        resolve(0);
      }
    });
  },

  measureCLS: (): Promise<number> => {
    return new Promise((resolve) => {
      let clsValue = 0;
      
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
        
        // Resolve after page load
        window.addEventListener('beforeunload', () => {
          observer.disconnect();
          resolve(clsValue);
        });
        
        // Fallback timeout
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 30000);
      } else {
        resolve(0);
      }
    });
  },

  getWebVitals: async () => {
    const [lcp, fid, cls] = await Promise.all([
      performanceMonitor.measureLCP(),
      performanceMonitor.measureFID(),
      performanceMonitor.measureCLS()
    ]);

    return { lcp, fid, cls };
  }
};

// React performance utilities
export const reactOptimizer = {
  memoizeComponent: <P extends object>(
    Component: React.ComponentType<P>,
    areEqual?: (prevProps: P, nextProps: P) => boolean
  ) => {
    return React.memo(Component, areEqual);
  },

  createStableCallback: <T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList
  ): T => {
    return React.useCallback(callback, deps);
  },

  createStableValue: <T>(
    factory: () => T,
    deps: React.DependencyList
  ): T => {
    return React.useMemo(factory, deps);
  },

  useVirtualization: <T>(
    items: T[],
    itemHeight: number,
    containerHeight: number
  ) => {
    const [scrollTop, setScrollTop] = React.useState(0);
    
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    const visibleItems = items.slice(startIndex, endIndex);
    const totalHeight = items.length * itemHeight;
    const offsetY = startIndex * itemHeight;
    
    return {
      visibleItems,
      totalHeight,
      offsetY,
      onScroll: (e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
      }
    };
  }
};

// Import React for hooks and components
import React from 'react'; 