import { cn } from "@/lib/utils";

interface StatNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  color?: "primary" | "success" | "destructive" | "default";
  size?: "sm" | "md" | "lg" | "xl";
  glow?: boolean;
  className?: string;
}

export const StatNumber = ({
  value,
  prefix = "$",
  suffix,
  color = "default",
  size = "md",
  glow = false,
  className,
}: StatNumberProps) => {
  const colorClasses = {
    primary: "text-primary",
    success: "text-success neon-text-green",
    destructive: "text-destructive",
    default: "text-foreground",
  };

  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-5xl",
    xl: "text-6xl md:text-7xl",
  };

  const glowClass = glow ? (color === "success" ? "neon-text-green" : "neon-text-purple") : "";

  return (
    <div className={cn("font-mono font-bold", colorClasses[color], sizeClasses[size], glowClass, className)}>
      {prefix}
      {value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
      {suffix}
    </div>
  );
};
