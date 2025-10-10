import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, TrendingUp, Target, PiggyBank } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIAdvicePanelProps {
  expenses: any[];
  investments: any[];
  goals: any[];
}

export const AIAdvicePanel = ({ expenses, investments, goals }: AIAdvicePanelProps) => {
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-financial-advice", {
        body: { expenses, investments, goals },
      });

      if (error) throw error;

      setAdvice(data.advice);
    } catch (error) {
      console.error("Error fetching advice:", error);
      toast.error("Failed to get AI advice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expenses.length > 0 || investments.length > 0) {
      fetchAdvice();
    }
  }, []);

  const adviceCards = [
    { icon: TrendingUp, title: "Budget Optimization", color: "text-green-500" },
    { icon: Target, title: "Investment Strategy", color: "text-blue-500" },
    { icon: PiggyBank, title: "Savings Goal", color: "text-purple-500" },
  ];

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            AI Financial Advice
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAdvice}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : advice ? (
          <div className="space-y-3">
            {advice.split("\n\n").slice(0, 3).map((text, index) => {
              const card = adviceCards[index] || adviceCards[0];
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10 hover-lift"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-background ${card.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{card.title}</h4>
                      <p className="text-sm text-muted-foreground">{text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Add some expenses or investments to get personalized advice!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
