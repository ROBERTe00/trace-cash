import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, X, Maximize2, Minimize2 } from "lucide-react";

interface DashboardWidgetProps {
  id: string;
  title: string;
  children: ReactNode;
  onRemove?: (id: string) => void;
  onExpand?: (id: string) => void;
  isExpanded?: boolean;
  isDraggable?: boolean;
}

export const DashboardWidget = ({
  id,
  title,
  children,
  onRemove,
  onExpand,
  isExpanded = false,
  isDraggable = true,
}: DashboardWidgetProps) => {
  return (
    <Card className="glass-card overflow-hidden h-full flex flex-col">
      {/* Widget Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          {isDraggable && (
            <div className="cursor-move">
              <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </div>
          )}
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>

        <div className="flex items-center gap-1">
          {onExpand && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExpand(id)}
              className="h-7 w-7 p-0"
              aria-label={isExpanded ? "Minimize widget" : "Expand widget"}
            >
              {isExpanded ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
          )}

          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(id)}
              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
              aria-label="Remove widget"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>
    </Card>
  );
};
