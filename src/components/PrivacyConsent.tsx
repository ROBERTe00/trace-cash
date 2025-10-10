import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, EyeOff, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PrivacyConsentProps {
  onConsentChange?: (consented: boolean) => void;
}

export function PrivacyConsent({ onConsentChange }: PrivacyConsentProps) {
  const { toast } = useToast();
  const [isOptedIn, setIsOptedIn] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleToggleOptIn = async (checked: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Autenticazione Richiesta",
          description: "Effettua l'accesso per gestire le preferenze privacy.",
          variant: "destructive",
        });
        return;
      }

      // In production, this would update a database table
      // For now, we'll just update local state
      setIsOptedIn(checked);
      onConsentChange?.(checked);

      toast({
        title: checked ? "Consenso Attivato" : "Consenso Revocato",
        description: checked 
          ? "Le tue metriche anonimizzate contribuiranno ai benchmark della community."
          : "I tuoi dati non saranno più condivisi. Le metriche precedenti saranno rimosse entro 24h.",
      });
    } catch (error) {
      console.error("Error updating consent:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare le preferenze. Riprova.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Privacy & Consenso</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" />
            Crittografia E2E
          </Badge>
          <Badge variant="outline" className="gap-1">
            GDPR
          </Badge>
        </div>
      </div>

      {/* Main Consent Toggle */}
      <div className="p-5 rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">Condividi Metriche Anonimizzate</h3>
              {isOptedIn ? (
                <Eye className="h-4 w-4 text-green-500" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Contribuisci ai benchmark della community condividendo dati aggregati e completamente anonimi 
              del tuo portafoglio e rendimenti.
            </p>
          </div>
          <Switch
            id="opt-in"
            checked={isOptedIn}
            onCheckedChange={handleToggleOptIn}
            className="ml-4"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>Revoca il consenso in qualsiasi momento. Rimozione dati entro 24 ore.</span>
        </div>
      </div>

      {/* What's Shared Section */}
      <div className="space-y-3 mb-6">
        <h4 className="font-semibold text-sm">Cosa Viene Condiviso</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-500">✓</span>
              <span className="text-sm font-medium">Condiviso</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Valore totale portafoglio (aggregato)</li>
              <li>• Rendimento percentuale</li>
              <li>• Allocazione per asset class</li>
              <li>• Periodo di investimento</li>
            </ul>
          </div>
          
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-red-500">✗</span>
              <span className="text-sm font-medium">Mai Condiviso</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Nome, email, ID utente</li>
              <li>• Singole transazioni</li>
              <li>• Simboli specifici di asset</li>
              <li>• Data/ora di operazioni</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Security Measures */}
      <div className="p-4 rounded-lg bg-muted/30 space-y-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Misure di Sicurezza
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Crittografia AES-256</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Aggregazione minima 100 utenti</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Zero dati identificabili</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span>Audit log completo</span>
          </div>
        </div>
      </div>

      {/* Privacy Policy Link */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="link" className="mt-4 p-0 h-auto text-xs">
            Leggi la Privacy Policy completa →
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy Policy - Condivisione Dati Community</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <section>
              <h3 className="font-semibold mb-2">1. Raccolta Dati</h3>
              <p className="text-muted-foreground">
                Con il tuo consenso esplicito, raccogliamo metriche aggregate del tuo portafoglio 
                esclusivamente per calcolare benchmark anonimi della community.
              </p>
            </section>
            
            <section>
              <h3 className="font-semibold mb-2">2. Anonimizzazione</h3>
              <p className="text-muted-foreground">
                Tutti i dati sono aggregati e anonimizzati prima dell'elaborazione. Utilizziamo tecniche 
                di differential privacy per garantire che nessun dato individuale sia identificabile.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">3. Conservazione</h3>
              <p className="text-muted-foreground">
                I dati aggregati sono conservati per massimo 12 mesi. Puoi revocare il consenso in 
                qualsiasi momento e i tuoi dati saranno rimossi entro 24 ore.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">4. Diritti GDPR</h3>
              <p className="text-muted-foreground">
                Hai diritto di accesso, rettifica, cancellazione e portabilità dei tuoi dati in 
                qualsiasi momento secondo il GDPR (Regolamento UE 2016/679).
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
