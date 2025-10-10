import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Target, Lightbulb, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Insight {
  id: string;
  title: string;
  description: string;
  action: string;
  impact: "high" | "medium" | "low";
  category: "investment" | "savings" | "budget";
}

interface MotivationalInsightsProps {
  userPercentile?: number;
  userPortfolio?: number;
  userReturn?: number;
}

export function MotivationalInsights({ userPercentile, userPortfolio, userReturn }: MotivationalInsightsProps) {
  // AI-generated insights based on user data
  const insights: Insight[] = [
    {
      id: "1",
      title: "Entra nel Top 20%",
      description: userPercentile && userPercentile > 20
        ? `Sei attualmente nel ${userPercentile}° percentile. Per raggiungere il top 20%, investi €150 extra al mese.`
        : "Ottimo! Sei già nel top 20% degli investitori.",
      action: "Aumenta Investimento Mensile",
      impact: "high",
      category: "investment",
    },
    {
      id: "2",
      title: "Diversificazione Portfolio",
      description: "Gli utenti nel top 10% hanno mediamente 5-8 asset diversi. Considera di diversificare il tuo portafoglio.",
      action: "Esplora Nuovi Asset",
      impact: "medium",
      category: "investment",
    },
    {
      id: "3",
      title: "Risparmio Automatico",
      description: "Il 78% degli utenti top performer utilizza il risparmio automatico. Imposta un trasferimento mensile ricorrente.",
      action: "Configura Auto-Save",
      impact: "high",
      category: "savings",
    },
    {
      id: "4",
      title: "Ottimizza le Spese",
      description: "Riducendo le spese non essenziali del 10%, potresti investire €200 extra al mese.",
      action: "Analizza Budget",
      impact: "medium",
      category: "budget",
    },
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "text-red-600 bg-red-500/10 border-red-500/20";
      case "medium": return "text-orange-600 bg-orange-500/10 border-orange-500/20";
      case "low": return "text-blue-600 bg-blue-500/10 border-blue-500/20";
      default: return "text-gray-600 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case "high": return "Alto Impatto";
      case "medium": return "Medio Impatto";
      case "low": return "Basso Impatto";
      default: return "Impatto";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "investment": return TrendingUp;
      case "savings": return Target;
      case "budget": return Lightbulb;
      default: return Sparkles;
    }
  };

  // Calculate progress to next tier
  const nextTierProgress = userPercentile 
    ? userPercentile > 50 
      ? ((50 - userPercentile) / 50) * 100
      : userPercentile > 20
        ? ((20 - userPercentile) / 30) * 100
        : ((10 - userPercentile) / 10) * 100
    : 0;

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Insight Motivazionali AI</h2>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Powered by AI
        </Badge>
      </div>

      {/* Progress to Next Tier */}
      {userPercentile && userPercentile < 50 && (
        <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold">Progresso al Prossimo Livello</div>
              <div className="text-sm text-muted-foreground">
                {userPercentile > 20 ? "Top 20%" : userPercentile > 10 ? "Top 10%" : "Elite"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.abs(nextTierProgress).toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">completato</div>
            </div>
          </div>
          <Progress value={Math.max(0, nextTierProgress)} className="h-2" />
        </div>
      )}

      {/* AI Insights */}
      <div className="space-y-4">
        {insights.map((insight) => {
          const CategoryIcon = getCategoryIcon(insight.category);
          
          return (
            <div
              key={insight.id}
              className="p-4 rounded-lg border bg-card hover-lift transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <CategoryIcon className="h-5 w-5 text-primary" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{insight.title}</h3>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getImpactColor(insight.impact)}`}
                    >
                      {getImpactLabel(insight.impact)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {insight.description}
                  </p>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-2 mt-2 h-8"
                  >
                    {insight.action}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Disclaimer */}
      <div className="mt-6 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-3 w-3" />
          <span>
            Insight generati da AI basati sui tuoi dati e sui benchmark della community. 
            Non costituiscono consulenza finanziaria professionale.
          </span>
        </div>
      </div>
    </Card>
  );
}
