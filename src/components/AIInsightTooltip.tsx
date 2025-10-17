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
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-primary/10 transition-colors touch-manipulation"
            aria-label="More information"
          >
            <HelpCircle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-4 text-sm">
          {title && <p className="font-semibold mb-2">{title}</p>}
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
