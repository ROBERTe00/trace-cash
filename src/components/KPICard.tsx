import { LucideIcon, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  tooltip?: string;
}

export const KPICard = ({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  tooltip,
}: KPICardProps) => {
  return (
    <Card className="glass-card p-6 hover-lift animate-fade-in border-2 border-primary/10 hover:border-primary/30 group">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
              {title}
            </p>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <p className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text transition-all duration-300 group-hover:scale-105">
            {value}
          </p>
          {change && (
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full animate-pulse ${
                  changeType === "positive"
                    ? "bg-green-500"
                    : changeType === "negative"
                    ? "bg-red-500"
                    : "bg-blue-500"
                }`}
              />
              <p
                className={`text-sm font-medium ${
                  changeType === "positive"
                    ? "text-green-500"
                    : changeType === "negative"
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              >
                {change}
              </p>
            </div>
          )}
        </div>
        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
          <Icon className="h-6 w-6 text-primary group-hover:animate-pulse" />
        </div>
      </div>
    </Card>
  );
};
