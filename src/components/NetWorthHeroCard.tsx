import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface NetWorthHeroCardProps {
  netWorth: number;
  cashBalance: number;
  investmentsValue: number;
  monthlyChange?: number;
  onRefreshPrices?: () => void;
}

export const NetWorthHeroCard = ({
  netWorth,
  cashBalance,
  investmentsValue,
  monthlyChange = 0,
  onRefreshPrices,
}: NetWorthHeroCardProps) => {
  // Fetch AI insight for hero card
  const { data: insight, isLoading: insightLoading } = useQuery({
    queryKey: ["hero-insight", netWorth],
    queryFn: async () => {
      const LOVABLE_API_KEY = import.meta.env.VITE_LOVABLE_API_KEY;
      if (!LOVABLE_API_KEY) return null;

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: "Sei un consulente finanziario AI. Genera UN SOLO insight breve (max 15 parole) e motivazionale in italiano basato sul patrimonio netto dell'utente."
              },
              {
                role: "user",
                content: `Patrimonio netto: €${netWorth.toFixed(0)}, Cash: €${cashBalance.toFixed(0)}, Investimenti: €${investmentsValue.toFixed(0)}. Genera un insight breve e positivo.`
              }
            ],
            max_tokens: 50,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          console.error("AI insight error:", response.status);
          return null;
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || null;
      } catch (error) {
        console.error("Error fetching AI insight:", error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    enabled: netWorth > 0,
  });

  const isPositive = monthlyChange >= 0;

  return (
    <Card className="relative overflow-hidden border-0 shadow-2xl">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
      
      {/* Animated Orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

      <CardContent className="relative pt-8 pb-6 px-6 text-white">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">Patrimonio Netto</p>
            <h2 className="text-5xl md:text-6xl font-black tracking-tight">
              €{netWorth.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </h2>
          </div>
          
          {onRefreshPrices && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefreshPrices}
              className="text-white hover:bg-white/20"
              title="Aggiorna prezzi live"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="text-white/70 text-xs mb-1">Liquidità</p>
            <p className="text-xl font-bold">€{cashBalance.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="text-white/70 text-xs mb-1">Investimenti</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold">€{investmentsValue.toLocaleString("it-IT", { maximumFractionDigits: 0 })}</p>
              {monthlyChange !== 0 && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${isPositive ? "bg-green-500/20 text-green-100" : "bg-red-500/20 text-red-100"}`}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {isPositive ? "+" : ""}{monthlyChange.toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* AI Insight */}
        {insightLoading ? (
          <Skeleton className="h-12 w-full bg-white/20" />
        ) : insight ? (
          <div className="bg-white/15 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-400/20 rounded-lg flex-shrink-0">
                <Sparkles className="w-5 h-5 text-yellow-200" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white/90 leading-relaxed">
                  {insight}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <p className="text-sm text-white/70 text-center">
              💡 Continua a tracciare per insights personalizzati
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
