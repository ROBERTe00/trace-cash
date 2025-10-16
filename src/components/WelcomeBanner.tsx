import { useState } from "react";
import { X, Sparkles, TrendingUp, Target, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export const WelcomeBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  if (!isVisible) return null;

  return (
    <Card className="relative overflow-hidden mb-6 p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2"
        onClick={() => setIsVisible(false)}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">
            Benvenuto in Trace-Cash! 🎉
          </h3>
          <p className="text-muted-foreground mb-4">
            Inizia a tracciare le tue finanze in modo intelligente. Ecco alcune funzionalità per iniziare:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4"
              onClick={() => navigate("/transactions")}
            >
              <TrendingUp className="h-5 w-5 mr-2 flex-shrink-0" />
              <div className="text-left">
                <div className="font-semibold">Aggiungi Transazioni</div>
                <div className="text-xs text-muted-foreground">
                  Traccia spese e entrate
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4"
              onClick={() => navigate("/goals")}
            >
              <Target className="h-5 w-5 mr-2 flex-shrink-0" />
              <div className="text-left">
                <div className="font-semibold">Crea Obiettivi</div>
                <div className="text-xs text-muted-foreground">
                  Definisci traguardi finanziari
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4"
              onClick={() => navigate("/investments")}
            >
              <PieChart className="h-5 w-5 mr-2 flex-shrink-0" />
              <div className="text-left">
                <div className="font-semibold">Portfolio Investimenti</div>
                <div className="text-xs text-muted-foreground">
                  Monitora i tuoi asset
                </div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};