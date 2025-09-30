// Performance optimization utilities for Vercel deployment

// Lazy loading utility
export const lazyWithRetry = (componentImport, retries = 3) => {
  return new Promise((resolve, reject) => {
    componentImport()
      .then(resolve)
      .catch((error) => {
        if (retries > 0) {
          console.warn(`Retrying component load. Retries left: ${retries - 1}`);
          setTimeout(() => {
            lazyWithRetry(componentImport, retries - 1).then(resolve, reject);
          }, 1000);
        } else {
          reject(error);
        }
      });
  });
};

// Image optimization
export const optimizeImage = (src, width = 800, quality = 75) => {
  if (process.env.NODE_ENV === 'production') {
    // Use Vercel's image optimization in production
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
  }
  return src;
};

// Bundle size monitoring
export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

// Memory management
export const cleanupResources = () => {
  // Clear any intervals or timeouts
  if (window.performanceCleanup) {
    window.performanceCleanup.forEach(cleanup => cleanup());
    window.performanceCleanup = [];
  }
};

// Service worker registration for caching
export const registerSW = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Preload critical resources
export const preloadCriticalResources = () => {
  const criticalResources = [
    '/static/css/main.css',
    '/static/js/main.js'
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = resource.endsWith('.css') ? 'style' : 'script';
    document.head.appendChild(link);
  });
};

// Error boundary reporting
export const reportError = (error, errorInfo) => {
  if (process.env.NODE_ENV === 'production') {
    // Report to error tracking service
    console.error('Application Error:', error, errorInfo);
    
    // You can integrate with services like Sentry here
    // Sentry.captureException(error, { extra: errorInfo });
  }
};
