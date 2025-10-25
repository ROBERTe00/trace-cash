import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { cardHover } from "@/lib/animations";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "premium" | "hero";
  glow?: boolean;
  tilt?: boolean;
  children: React.ReactNode;
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", glow = false, tilt = false, children, ...props }, ref) => {
    const baseClasses = "rounded-3xl backdrop-blur-xl transition-all duration-300";
    
    const variantClasses = {
      default: "bg-card/80 border border-border/50 shadow-lg",
      premium: "bg-gradient-to-br from-card/90 via-card/80 to-card/70 border border-primary/20 shadow-xl",
      hero: "bg-gradient-to-br from-card/95 via-primary/5 to-card/90 border border-primary/30 shadow-2xl"
    };

    const glowClasses = glow 
      ? "hover:shadow-[0_8px_32px_rgba(123,47,247,0.4),0_0_40px_rgba(123,47,247,0.2)]" 
      : "";

    const motionProps = tilt 
      ? { 
          initial: "rest",
          whileHover: "hover",
          variants: cardHover,
          transition: { duration: 0.3 },
          ...props 
        }
      : props;

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          glowClasses,
          className
        )}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

const GlassCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
);
GlassCardHeader.displayName = "GlassCardHeader";

const GlassCardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 
      ref={ref} 
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight font-display",
        className
      )} 
      {...props} 
    />
  )
);
GlassCardTitle.displayName = "GlassCardTitle";

const GlassCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
GlassCardDescription.displayName = "GlassCardDescription";

const GlassCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
);
GlassCardContent.displayName = "GlassCardContent";

const GlassCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
);
GlassCardFooter.displayName = "GlassCardFooter";

export { 
  GlassCard, 
  GlassCardHeader, 
  GlassCardFooter, 
  GlassCardTitle, 
  GlassCardDescription, 
  GlassCardContent 
};
