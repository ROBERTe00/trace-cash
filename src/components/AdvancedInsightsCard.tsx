import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Insight {
  title: string;
  description: string;
  type: "success" | "tip" | "warning" | "info";
  actionable: string;
  priority?: number;
}

export const AdvancedInsightsCard = () => {
  const { data: insights, isLoading } = useQuery({
    queryKey: ["advanced-insights"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke("generate-insights");

        if (error) {
          console.error("Insights error:", error);
          return [];
        }

        return (data?.insights || []) as Insight[];
      } catch (error) {
        console.error("Error fetching insights:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 60, // Cache 1 hour
    retry: 2,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case "tip":
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "warning":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
      case "tip":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
            AI Insights Personalizzati
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            AI Insights Personalizzati
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Continua a tracciare spese e investimenti per ricevere insights personalizzati dall'AI.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
            AI Insights Personalizzati
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="w-3 h-3" />
            {insights.length} Insights
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, idx) => (
          <Alert
            key={idx}
            className={cn(
              "border-l-4 transition-all hover:shadow-md",
              getBadgeColor(insight.type)
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getIcon(insight.type)}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">{insight.title}</h4>
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getBadgeColor(insight.type))}>
                    {insight.type}
                  </Badge>
                </div>
                <AlertDescription className="text-sm text-muted-foreground">
                  {insight.description}
                </AlertDescription>
                {insight.actionable && (
                  <div className="mt-2 p-3 bg-accent/30 rounded-md">
                    <p className="text-xs font-medium">
                      💡 <strong>Azione consigliata:</strong> {insight.actionable}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};
