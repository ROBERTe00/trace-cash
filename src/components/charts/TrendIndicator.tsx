import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrendIndicatorProps {
  value: number
  className?: string
  showIcon?: boolean
}

export function TrendIndicator({ value, className, showIcon = true }: TrendIndicatorProps) {
  const isPositive = value > 0
  const isNegative = value < 0
  const isNeutral = value === 0

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium",
        isPositive && "text-green-600 dark:text-green-400",
        isNegative && "text-red-600 dark:text-red-400",
        isNeutral && "text-muted-foreground",
        className
      )}
    >
      {showIcon && (
        <>
          {isPositive && <ArrowUp className="h-4 w-4" />}
          {isNegative && <ArrowDown className="h-4 w-4" />}
          {isNeutral && <Minus className="h-4 w-4" />}
        </>
      )}
      <span>{Math.abs(value)}%</span>
    </div>
  )
}

