// Performance monitoring hook for Core Web Vitals
import { useEffect } from 'react';

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
  ttfb?: number; // Time to First Byte
}

export const usePerformanceMonitor = (onMetrics?: (metrics: PerformanceMetrics) => void) => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const metrics: PerformanceMetrics = {};

    // Track FCP (First Contentful Paint)
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            metrics.fcp = Math.round(entry.startTime);
            if (import.meta.env.DEV) {
              console.debug('[Performance] FCP:', metrics.fcp, 'ms');
            }
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('[Performance] FCP observer not supported');
    }

    // Track LCP (Largest Contentful Paint)
    try {
      let lcpValue = 0;
      let lcpLogged = false;
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcpValue = Math.round(lastEntry.startTime);
        metrics.lcp = lcpValue;
        // Log solo una volta quando raggiunto LCP finale
        if (!lcpLogged && import.meta.env.DEV) {
          console.debug('[Performance] LCP:', lcpValue, 'ms');
          lcpLogged = true;
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('[Performance] LCP observer not supported');
    }

    // Track CLS (Cumulative Layout Shift)
    try {
      let clsValue = 0;
      let lastLogTime = 0;
      const logInterval = 2000; // Log ogni 2 secondi massimo
      
      // Initialize CLS to 0
      metrics.cls = 0;
      
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            metrics.cls = Math.round(clsValue * 1000) / 1000;
          }
        }
        // Throttle logging - solo ogni 2 secondi
        const now = Date.now();
        if (now - lastLogTime > logInterval) {
          if (import.meta.env.DEV) {
            console.debug('[Performance] CLS:', metrics.cls ?? 0);
          }
          lastLogTime = now;
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('[Performance] CLS observer not supported');
      metrics.cls = 0; // Set default value if observer not supported
    }

    // Track FID (First Input Delay) - deprecated but still useful
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            const fid = Math.round((entry as any).processingStart - entry.startTime);
            metrics.fid = fid;
            if (import.meta.env.DEV) {
              console.debug('[Performance] FID:', fid, 'ms');
            }
          }
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('[Performance] FID observer not supported');
    }

    // Track TTFB (Time to First Byte)
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.ttfb = Math.round(navigation.responseStart - navigation.requestStart);
        if (import.meta.env.DEV) {
          console.debug('[Performance] TTFB:', metrics.ttfb, 'ms');
        }
      }
    } catch (e) {
      console.warn('[Performance] TTFB tracking not supported');
    }

    // Send metrics after page load
    const sendMetrics = () => {
      if (onMetrics) {
        onMetrics(metrics);
      }
      
      // In production, inviare a analytics service
      if (process.env.NODE_ENV === 'production' && Object.keys(metrics).length > 0) {
        // Esempio: invio a analytics
        // analytics.track('performance_metrics', metrics);
      }
    };

    // Send metrics after 5 seconds or on page unload
    const timeout = setTimeout(sendMetrics, 5000);
    window.addEventListener('beforeunload', sendMetrics);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('beforeunload', sendMetrics);
    };
  }, [onMetrics]);
};
