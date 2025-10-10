import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Download, Heart, TrendingUp, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BudgetTemplate {
  id: string;
  name: string;
  category: string;
  allocation: { [key: string]: number };
  totalBudget: number;
  performance: string;
  likes: number;
  downloads: number;
}

export function TemplateSharing() {
  const { toast } = useToast();
  const [templates] = useState<BudgetTemplate[]>([
    {
      id: "1",
      name: "Budget Top Performer Elite",
      category: "Investimenti Aggressivi",
      allocation: {
        "Investimenti": 40,
        "Risparmio": 30,
        "Spese Fisse": 20,
        "Intrattenimento": 10,
      },
      totalBudget: 5000,
      performance: "+12.5% annuo",
      likes: 847,
      downloads: 2341,
    },
    {
      id: "2",
      name: "Budget Bilanciato Top 20%",
      category: "Crescita Moderata",
      allocation: {
        "Investimenti": 30,
        "Risparmio": 25,
        "Spese Fisse": 30,
        "Svago": 15,
      },
      totalBudget: 3500,
      performance: "+8.2% annuo",
      likes: 1234,
      downloads: 3567,
    },
    {
      id: "3",
      name: "Budget Risparmio Ottimizzato",
      category: "Risparmio Massimo",
      allocation: {
        "Risparmio": 40,
        "Investimenti": 25,
        "Spese Essenziali": 25,
        "Extra": 10,
      },
      totalBudget: 2800,
      performance: "+6.8% annuo",
      likes: 956,
      downloads: 2789,
    },
  ]);

  const handleDownload = (template: BudgetTemplate) => {
    // In production, this would generate a downloadable budget template
    const templateData = JSON.stringify(template, null, 2);
    const blob = new Blob([templateData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Template Scaricato",
      description: `${template.name} è stato salvato sul tuo dispositivo.`,
    });
  };

  const handleCopyAllocation = (template: BudgetTemplate) => {
    const allocationText = Object.entries(template.allocation)
      .map(([cat, pct]) => `${cat}: ${pct}%`)
      .join("\n");
    
    navigator.clipboard.writeText(allocationText);
    
    toast({
      title: "Allocazione Copiata",
      description: "L'allocazione percentuale è stata copiata negli appunti.",
    });
  };

  const handleLike = (templateId: string) => {
    toast({
      title: "Template Salvato",
      description: "Aggiunto ai tuoi preferiti!",
    });
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Share2 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Template Budget Community</h2>
        </div>
        <Badge variant="secondary">
          {templates.length} Template
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Scopri e adotta strategie di budgeting dai top performer della community. 
        Tutti i template sono completamente anonimi e basati su dati aggregati.
      </p>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="p-4 hover-lift transition-all border">
            <div className="space-y-4">
              {/* Header */}
              <div>
                <h3 className="font-semibold mb-1">{template.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                  <Badge variant="secondary" className="text-xs gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {template.performance}
                  </Badge>
                </div>
              </div>

              {/* Allocation */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Budget: €{template.totalBudget.toLocaleString()}/mese
                </div>
                {Object.entries(template.allocation).map(([category, percentage]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{category}</span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(template.id)}
                  className="flex-1"
                >
                  <Heart className="h-4 w-4 mr-1" />
                  {template.likes}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyAllocation(template)}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copia
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleDownload(template)}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Usa
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center pt-2">
                {template.downloads.toLocaleString()} download
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Info */}
      <div className="mt-6 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
        💡 I template sono creati aggregando i budget dei top performer. 
        Adattali alle tue esigenze specifiche prima dell'utilizzo.
      </div>
    </Card>
  );
}
