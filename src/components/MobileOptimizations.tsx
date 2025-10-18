/**
 * Mobile Usability Enhancements
 * Touch-friendly interactions, responsive layouts, and mobile optimizations
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Hand,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileOptimizedCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  enableTouch?: boolean;
  enableZoom?: boolean;
  enableRotation?: boolean;
}

export const MobileOptimizedCard: React.FC<MobileOptimizedCardProps> = ({
  children,
  title,
  className,
  enableTouch = true,
  enableZoom = true,
  enableRotation = true
}) => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchCount, setTouchCount] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Determine device type
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
      
      // Determine orientation
      setOrientation(height > width ? 'portrait' : 'landscape');
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableTouch) return;
    setTouchCount(e.touches.length);
  };

  const handleTouchEnd = () => {
    setTouchCount(0);
  };

  const handleDoubleClick = () => {
    if (!enableZoom) return;
    setIsZoomed(!isZoomed);
  };

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
    }
  };

  const getTouchOptimizedClasses = () => {
    const baseClasses = "transition-all duration-300";
    
    if (deviceType === 'mobile') {
      return cn(
        baseClasses,
        "min-h-[44px] min-w-[44px]", // iOS touch target minimum
        "text-base", // Larger text for mobile
        "p-3", // More padding for touch
        isZoomed && "scale-110"
      );
    }
    
    if (deviceType === 'tablet') {
      return cn(
        baseClasses,
        "min-h-[40px] min-w-[40px]",
        "text-sm",
        "p-2",
        isZoomed && "scale-105"
      );
    }
    
    return cn(baseClasses, "min-h-[32px] min-w-[32px]", "text-sm", "p-1");
  };

  return (
    <Card 
      ref={cardRef}
      className={cn(
        "relative overflow-hidden",
        deviceType === 'mobile' && "rounded-2xl",
        deviceType === 'tablet' && "rounded-xl",
        deviceType === 'desktop' && "rounded-lg",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
    >
      {/* Card Header with Title */}
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      {/* Device Indicator */}
      <div className="absolute top-2 right-2 z-10">
        <Badge 
          variant="secondary" 
          className={cn(
            "text-xs flex items-center gap-1",
            deviceType === 'mobile' && "bg-blue-100 text-blue-800",
            deviceType === 'tablet' && "bg-green-100 text-green-800",
            deviceType === 'desktop' && "bg-gray-100 text-gray-800"
          )}
        >
          {getDeviceIcon()}
          {deviceType}
        </Badge>
      </div>

      {/* Touch Indicator */}
      {enableTouch && touchCount > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute inset-0 bg-primary/10 backdrop-blur-sm z-20 flex items-center justify-center"
        >
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Hand className="h-6 w-6" />
            <span>{touchCount} finger{touchCount > 1 ? 's' : ''}</span>
          </div>
        </motion.div>
      )}

      {/* Zoom Indicator */}
      {enableZoom && isZoomed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-2 left-2 z-10"
        >
          <Badge variant="outline" className="text-xs">
            <ZoomIn className="h-3 w-3 mr-1" />
            Zoomed
          </Badge>
        </motion.div>
      )}

      {/* Orientation Indicator */}
      {enableRotation && deviceType !== 'desktop' && (
        <div className="absolute bottom-2 right-2 z-10">
          <Badge variant="outline" className="text-xs">
            <RotateCcw className="h-3 w-3 mr-1" />
            {orientation}
          </Badge>
        </div>
      )}

      <CardContent className={cn(
        "p-4",
        deviceType === 'mobile' && "p-6",
        deviceType === 'tablet' && "p-5",
        isZoomed && "transform-gpu"
      )}>
        <div className={getTouchOptimizedClasses()}>
          {children}
        </div>
      </CardContent>

      {/* Mobile Controls */}
      {deviceType === 'mobile' && (
        <div className="absolute bottom-2 left-2 flex gap-1">
          {enableZoom && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsZoomed(!isZoomed)}
              className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
            >
              {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  mobileCols?: number;
  tabletCols?: number;
  desktopCols?: number;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  mobileCols = 1,
  tabletCols = 2,
  desktopCols = 4
}) => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  const getGridCols = () => {
    switch (deviceType) {
      case 'mobile': return mobileCols;
      case 'tablet': return tabletCols;
      case 'desktop': return desktopCols;
    }
  };

  return (
    <div 
      className={cn(
        "grid gap-4 transition-all duration-300",
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${getGridCols()}, minmax(0, 1fr))`
      }}
    >
      {children}
    </div>
  );
};

interface TouchFriendlyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

export const TouchFriendlyButton: React.FC<TouchFriendlyButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'default',
  className,
  disabled = false
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  const getTouchOptimizedSize = () => {
    if (deviceType === 'mobile') {
      return size === 'sm' ? 'lg' : size === 'lg' ? 'lg' : 'lg';
    }
    if (deviceType === 'tablet') {
      return size === 'sm' ? 'default' : size === 'lg' ? 'lg' : 'default';
    }
    return size;
  };

  const handleTouchStart = () => {
    if (deviceType === 'mobile' || deviceType === 'tablet') {
      setIsPressed(true);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  return (
    <Button
      variant={variant}
      size={getTouchOptimizedSize()}
      className={cn(
        "transition-all duration-200",
        deviceType === 'mobile' && "min-h-[44px] min-w-[44px] text-base font-medium",
        deviceType === 'tablet' && "min-h-[40px] min-w-[40px] text-sm",
        isPressed && "scale-95",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {children}
    </Button>
  );
};

interface MobileScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  enableMomentum?: boolean;
  enableBounce?: boolean;
}

export const MobileScrollContainer: React.FC<MobileScrollContainerProps> = ({
  children,
  className,
  enableMomentum = true,
  enableBounce = true
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    // Enable momentum scrolling on iOS
    if (enableMomentum) {
      scrollContainer.style.webkitOverflowScrolling = 'touch';
    }

    // Enable bounce effect
    if (enableBounce) {
      scrollContainer.style.overscrollBehavior = 'contain';
    }

    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    scrollContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      scrollContainer.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enableMomentum, enableBounce]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "overflow-auto",
        "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
        className
      )}
    >
      {children}
    </div>
  );
};

export default MobileOptimizedCard;
