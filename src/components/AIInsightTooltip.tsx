import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIInsightTooltipProps {
  content: string;
  title?: string;
}

export function AIInsightTooltip({ content, title }: AIInsightTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-primary/10 transition-colors">
            <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-primary" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3">
          {title && <p className="font-semibold mb-1">{title}</p>}
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
