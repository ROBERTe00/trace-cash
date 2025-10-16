import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Lightbulb, CheckCircle2 } from "lucide-react";

export interface InsightAlert {
  id: string;
  type: "critical" | "opportunity" | "success";
  icon: any;
  title: string;
  description: string;
  priority: number;
}

interface AlertsPrioritizedProps {
  insights: InsightAlert[];
}

export function AlertsPrioritized({ insights }: AlertsPrioritizedProps) {
  // Sort by priority (higher priority first)
  const sortedInsights = [...insights].sort((a, b) => b.priority - a.priority);

  const criticalAlerts = sortedInsights.filter((i) => i.type === "critical");
  const opportunities = sortedInsights.filter((i) => i.type === "opportunity");
  const successItems = sortedInsights.filter((i) => i.type === "success");

  const getAlertVariant = (type: string) => {
    switch (type) {
      case "critical":
        return "destructive";
      case "opportunity":
        return "default";
      case "success":
        return "default";
      default:
        return "default";
    }
  };

  const getSectionColor = (type: string) => {
    switch (type) {
      case "critical":
        return "from-red-500/10 to-orange-500/10 border-red-500/20";
      case "opportunity":
        return "from-green-500/10 to-emerald-500/10 border-green-500/20";
      case "success":
        return "from-blue-500/10 to-cyan-500/10 border-blue-500/20";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="icon-card text-red-500" />
            <h3 className="text-lg font-semibold">Critical Alerts</h3>
            <Badge className="bg-red-500/10 text-red-500">{criticalAlerts.length}</Badge>
          </div>
          <div className="grid gap-4">
            {criticalAlerts.map((insight) => (
              <Card
                key={insight.id}
                className={`glass-card bg-gradient-to-r ${getSectionColor(insight.type)}`}
              >
                <CardContent className="p-6">
                  <Alert variant={getAlertVariant(insight.type)} className="border-0 bg-transparent">
                    <insight.icon className="icon-card" />
                    <AlertTitle className="text-base font-semibold">{insight.title}</AlertTitle>
                    <AlertDescription className="text-sm mt-2">
                      {insight.description}
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="icon-card text-green-500" />
            <h3 className="text-lg font-semibold">Opportunities</h3>
            <Badge className="bg-green-500/10 text-green-500">{opportunities.length}</Badge>
          </div>
          <div className="grid gap-4">
            {opportunities.map((insight) => (
              <Card
                key={insight.id}
                className={`glass-card bg-gradient-to-r ${getSectionColor(insight.type)}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-green-500/20 flex-shrink-0">
                      <insight.icon className="icon-card text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Success Items */}
      {successItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="icon-card text-blue-500" />
            <h3 className="text-lg font-semibold">Your Progress</h3>
            <Badge className="bg-blue-500/10 text-blue-500">{successItems.length}</Badge>
          </div>
          <div className="grid gap-4">
            {successItems.map((insight) => (
              <Card
                key={insight.id}
                className={`glass-card bg-gradient-to-r ${getSectionColor(insight.type)}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/20 flex-shrink-0">
                      <insight.icon className="icon-card text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {insights.length === 0 && (
        <Card className="glass-card p-12 text-center">
          <Lightbulb className="icon-hero text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No insights yet</h3>
          <p className="text-muted-foreground">
            Add more transactions and investments to receive personalized insights
          </p>
        </Card>
      )}
    </div>
  );
}
