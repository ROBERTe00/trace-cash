import * as React from "react";
import { cn } from "@/lib/utils";

interface RevolutCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'outlined';
}

const RevolutCard = React.forwardRef<HTMLDivElement, RevolutCardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: "modern-card border-0",
      gradient: "revolut-card",
      outlined: "rounded-3xl border border-border/50 bg-card shadow-lg"
    };

    return (
      <div 
        ref={ref} 
        className={cn(variantClasses[variant], className)} 
        {...props} 
      />
    );
  }
);
RevolutCard.displayName = "RevolutCard";

const RevolutCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
RevolutCardHeader.displayName = "RevolutCardHeader";

const RevolutCardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
RevolutCardTitle.displayName = "RevolutCardTitle";

const RevolutCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
RevolutCardDescription.displayName = "RevolutCardDescription";

const RevolutCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
RevolutCardContent.displayName = "RevolutCardContent";

const RevolutCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
RevolutCardFooter.displayName = "RevolutCardFooter";

export { 
  RevolutCard, 
  RevolutCardHeader, 
  RevolutCardFooter, 
  RevolutCardTitle, 
  RevolutCardDescription, 
  RevolutCardContent 
};

