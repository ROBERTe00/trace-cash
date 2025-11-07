// Hook for lazy loading charts with Intersection Observer
import { useState, useEffect, useRef, useCallback } from 'react';
import { registerChartJS } from '@/lib/chartRegistry';

interface UseLazyChartOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

export const useLazyChart = (options: UseLazyChartOptions = {}) => {
  const { 
    threshold = 0.1, 
    rootMargin = '50px',
    enabled = true 
  } = options;
  
  const [isVisible, setIsVisible] = useState(!enabled); // Start visible if disabled
  const [isLoaded, setIsLoaded] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !chartRef.current) {
      setIsVisible(true);
      return;
    }

    // Register Chart.js immediately if not already registered
    registerChartJS();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Disconnect after first intersection to avoid unnecessary checks
            observer.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(chartRef.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, enabled]);

  // Mark as loaded when visible
  useEffect(() => {
    if (isVisible && !isLoaded) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isLoaded]);

  return { 
    chartRef, 
    isLoaded: isVisible && isLoaded, 
    isVisible 
  };
};
