import * as React from "react"
import { cn } from "@/lib/utils"
import { ArrowUpRight } from "lucide-react"

interface AnimatedFeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description: string
  href?: string
  highlightColor?: string
}

const AnimatedFeatureCard = React.forwardRef<HTMLDivElement, AnimatedFeatureCardProps>(
  ({ className, icon, title, description, href, highlightColor = "blue", ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false)

    return (
      <div
        ref={ref}
        className={cn(
          "group relative overflow-hidden rounded-lg border bg-card p-6 transition-all duration-300 hover:shadow-lg",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {/* Animated background gradient */}
        <div
          className={cn(
            "absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100",
            highlightColor === "blue" && "bg-gradient-to-br from-blue-500/10 to-purple-500/10",
            highlightColor === "green" && "bg-gradient-to-br from-green-500/10 to-emerald-500/10",
            highlightColor === "purple" && "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
            highlightColor === "orange" && "bg-gradient-to-br from-orange-500/10 to-red-500/10"
          )}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          {icon && (
            <div
              className={cn(
                "mb-4 inline-flex rounded-lg p-3 transition-transform duration-300 group-hover:scale-110",
                highlightColor === "blue" && "bg-primary/10 text-primary",
                highlightColor === "green" && "bg-green-500/10 text-green-600 dark:text-green-400",
                highlightColor === "purple" && "bg-purple-500/10 text-purple-600 dark:text-purple-400",
                highlightColor === "orange" && "bg-orange-500/10 text-orange-600 dark:text-orange-400"
              )}
            >
              {icon}
            </div>
          )}

          {/* Title */}
          <h3 className="mb-2 text-lg font-semibold transition-colors duration-300 group-hover:text-foreground">
            {title}
          </h3>

          {/* Description */}
          <p className="mb-4 text-sm text-muted-foreground">{description}</p>

          {/* Link indicator */}
          {href && (
            <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Learn more
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </div>
          )}
        </div>

        {/* Animated border */}
        <div
          className={cn(
            "absolute inset-0 rounded-lg border-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100",
            highlightColor === "blue" && "border-primary/50",
            highlightColor === "green" && "border-green-500/50",
            highlightColor === "purple" && "border-purple-500/50",
            highlightColor === "orange" && "border-orange-500/50"
          )}
        />
      </div>
    )
  }
)

AnimatedFeatureCard.displayName = "AnimatedFeatureCard"

export { AnimatedFeatureCard }

