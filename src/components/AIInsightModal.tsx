import { useState } from "react";
import { Info, Sparkles, TrendingUp, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AIInsightModalProps {
  title: string;
  metric: string;
  value: string | number;
  explanation: string;
  calculation?: string;
  suggestions: string[];
  improvement?: string;
}

export function AIInsightModal({
  title,
  metric,
  value,
  explanation,
  calculation,
  suggestions,
  improvement,
}: AIInsightModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{metric}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="p-4 bg-primary/5">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Current Value</p>
              <p className="text-3xl font-bold">{value}</p>
            </div>
          </Card>

          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              What does this mean?
            </h4>
            <p className="text-sm text-muted-foreground">{explanation}</p>
          </div>

          {calculation && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                How is it calculated?
              </h4>
              <p className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded-lg">
                {calculation}
              </p>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              AI-Powered Suggestions
            </h4>
            <ul className="space-y-2">
              {suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {improvement && (
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
              <p className="text-sm">
                <span className="font-semibold">💡 Pro Tip: </span>
                {improvement}
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
