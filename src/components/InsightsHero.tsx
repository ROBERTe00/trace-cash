import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface InsightsHeroProps {
  score: number;
  trend: "improving" | "stable" | "declining";
  summary: string;
}

export function InsightsHero({ score, trend, summary }: InsightsHeroProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="icon-card text-green-500" />;
      case "declining":
        return <TrendingDown className="icon-card text-red-500" />;
      default:
        return <Minus className="icon-card text-blue-500" />;
    }
  };

  const getTrendBadge = () => {
    switch (trend) {
      case "improving":
        return <Badge className="bg-green-500/10 text-green-500">Improving</Badge>;
      case "declining":
        return <Badge className="bg-red-500/10 text-red-500">Declining</Badge>;
      default:
        return <Badge className="bg-blue-500/10 text-blue-500">Stable</Badge>;
    }
  };

  return (
    <Card className="glass-card overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      <CardContent className="p-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Score Display */}
          <div className="flex items-center justify-center lg:justify-start">
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
                  className={getScoreColor(score)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trend & Summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {getTrendIcon()}
              {getTrendBadge()}
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Your Financial Health</h3>
              <p className="text-muted-foreground leading-relaxed">{summary}</p>
            </div>
            <div className="pt-2">
              <Progress value={score} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
