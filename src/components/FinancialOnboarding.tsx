import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Wallet, Home, CreditCard, DollarSign, Upload, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useApp } from "@/contexts/AppContext";

interface Asset {
  name: string;
  value: number;
}

interface Debt {
  name: string;
  amount: number;
}

interface IncomeSource {
  name: string;
  amount: number;
}

interface FinancialOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const FinancialOnboarding = ({ isOpen, onComplete }: FinancialOnboardingProps) => {
  const { t, formatCurrency } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  // Form state
  const [cashAvailable, setCashAvailable] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetValue, setNewAssetValue] = useState("");
  const [debts, setDebts] = useState<Debt[]>([]);
  const [newDebtName, setNewDebtName] = useState("");
  const [newDebtAmount, setNewDebtAmount] = useState("");
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [newIncomeName, setNewIncomeName] = useState("");
  const [newIncomeAmount, setNewIncomeAmount] = useState("");

  const handleAddAsset = () => {
    if (newAssetName && newAssetValue) {
      setAssets([...assets, { name: newAssetName, value: parseFloat(newAssetValue) }]);
      setNewAssetName("");
      setNewAssetValue("");
    }
  };

  const handleRemoveAsset = (index: number) => {
    setAssets(assets.filter((_, i) => i !== index));
  };

  const handleAddDebt = () => {
    if (newDebtName && newDebtAmount) {
      setDebts([...debts, { name: newDebtName, amount: parseFloat(newDebtAmount) }]);
      setNewDebtName("");
      setNewDebtAmount("");
    }
  };

  const handleRemoveDebt = (index: number) => {
    setDebts(debts.filter((_, i) => i !== index));
  };

  const handleAddIncome = () => {
    if (newIncomeName && newIncomeAmount) {
      setIncomeSources([...incomeSources, { name: newIncomeName, amount: parseFloat(newIncomeAmount) }]);
      setNewIncomeName("");
      setNewIncomeAmount("");
    }
  };

  const handleRemoveIncome = (index: number) => {
    setIncomeSources(incomeSources.filter((_, i) => i !== index));
  };

  const calculateNetWorth = () => {
    const cash = parseFloat(cashAvailable) || 0;
    const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
    const totalDebts = debts.reduce((sum, debt) => sum + debt.amount, 0);
    return cash + totalAssets - totalDebts;
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Errore: utente non autenticato");
        return;
      }

      const totalIncome = incomeSources.reduce((sum, source) => sum + source.amount, 0);

      const profileData = {
        user_id: user.id,
        cash_available: parseFloat(cashAvailable) || 0,
        monthly_income: totalIncome,
        income_sources: incomeSources as any,
        assets: assets as any,
        debts: debts as any,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(profileData, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
      });

      toast.success("Profilo completato con successo!");
      onComplete();
    } catch (error) {
      console.error("Errore salvataggio profilo:", error);
      toast.error("Errore nel salvataggio del profilo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text">
            Configura il tuo profilo finanziario
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {step} di {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step 1: Cash disponibile */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Wallet className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold">Quanto hai in liquidità?</h2>
                <p className="text-muted-foreground">
                  Inserisci il contante disponibile nei tuoi conti correnti e risparmi
                </p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="cash">Liquidità disponibile (€)</Label>
                <Input
                  id="cash"
                  type="number"
                  placeholder="0.00"
                  value={cashAvailable}
                  onChange={(e) => setCashAvailable(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSkip} variant="outline" className="flex-1">
                  Salta
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Avanti
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Asset */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Home className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold">Hai beni di valore?</h2>
                <p className="text-muted-foreground">
                  Casa, auto, investimenti o altri asset
                </p>
              </div>
              
              <div className="space-y-3">
                {assets.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {assets.map((asset, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(asset.value)}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveAsset(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="assetName">Nome</Label>
                    <Input
                      id="assetName"
                      placeholder="es. Casa"
                      value={newAssetName}
                      onChange={(e) => setNewAssetName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="assetValue">Valore (€)</Label>
                    <Input
                      id="assetValue"
                      type="number"
                      placeholder="0.00"
                      value={newAssetValue}
                      onChange={(e) => setNewAssetValue(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleAddAsset} variant="outline" className="w-full">
                  + Aggiungi Asset
                </Button>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  Indietro
                </Button>
                <Button onClick={handleSkip} variant="outline" className="flex-1">
                  Salta
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Avanti
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Debiti */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <CreditCard className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold">Hai debiti?</h2>
                <p className="text-muted-foreground">
                  Mutui, prestiti o altre forme di debito
                </p>
              </div>
              
              <div className="space-y-3">
                {debts.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {debts.map((debt, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                        <div>
                          <p className="font-medium">{debt.name}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(debt.amount)}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveDebt(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="debtName">Nome</Label>
                    <Input
                      id="debtName"
                      placeholder="es. Mutuo casa"
                      value={newDebtName}
                      onChange={(e) => setNewDebtName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="debtAmount">Importo (€)</Label>
                    <Input
                      id="debtAmount"
                      type="number"
                      placeholder="0.00"
                      value={newDebtAmount}
                      onChange={(e) => setNewDebtAmount(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleAddDebt} variant="outline" className="w-full">
                  + Aggiungi Debito
                </Button>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                  Indietro
                </Button>
                <Button onClick={handleSkip} variant="outline" className="flex-1">
                  Salta
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Avanti
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Reddito */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <DollarSign className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold">Quali sono le tue entrate?</h2>
                <p className="text-muted-foreground">
                  Stipendio, affitti o altre fonti di reddito mensile
                </p>
              </div>
              
              <div className="space-y-3">
                {incomeSources.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {incomeSources.map((income, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                        <div>
                          <p className="font-medium">{income.name}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(income.amount)}/mese</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveIncome(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="incomeName">Nome</Label>
                    <Input
                      id="incomeName"
                      placeholder="es. Stipendio"
                      value={newIncomeName}
                      onChange={(e) => setNewIncomeName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="incomeAmount">Importo mensile (€)</Label>
                    <Input
                      id="incomeAmount"
                      type="number"
                      placeholder="0.00"
                      value={newIncomeAmount}
                      onChange={(e) => setNewIncomeAmount(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleAddIncome} variant="outline" className="w-full">
                  + Aggiungi Entrata
                </Button>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(3)} variant="outline" className="flex-1">
                  Indietro
                </Button>
                <Button onClick={handleSkip} variant="outline" className="flex-1">
                  Salta
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Avanti
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Riepilogo e Upload */}
          {step === 5 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center animate-pulse">
                  <Check className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold">Riepilogo Profilo</h2>
                <p className="text-muted-foreground">
                  Ecco la tua situazione finanziaria
                </p>
              </div>

              {/* Net Worth Card */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Patrimonio Netto Stimato</p>
                <p className="text-4xl font-bold gradient-text">{formatCurrency(calculateNetWorth())}</p>
              </div>

              {/* Summary */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 bg-background rounded-lg">
                  <span className="text-muted-foreground">Liquidità</span>
                  <span className="font-medium">{formatCurrency(parseFloat(cashAvailable) || 0)}</span>
                </div>
                <div className="flex justify-between p-3 bg-background rounded-lg">
                  <span className="text-muted-foreground">Asset totali</span>
                  <span className="font-medium">{formatCurrency(assets.reduce((sum, a) => sum + a.value, 0))}</span>
                </div>
                <div className="flex justify-between p-3 bg-background rounded-lg">
                  <span className="text-muted-foreground">Debiti totali</span>
                  <span className="font-medium text-destructive">-{formatCurrency(debts.reduce((sum, d) => sum + d.amount, 0))}</span>
                </div>
                <div className="flex justify-between p-3 bg-background rounded-lg">
                  <span className="text-muted-foreground">Reddito mensile</span>
                  <span className="font-medium">{formatCurrency(incomeSources.reduce((sum, i) => sum + i.amount, 0))}</span>
                </div>
              </div>

              {/* Upload section */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <Upload className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Hai estratti conto?</p>
                    <p className="text-xs text-muted-foreground">Caricali nella sezione Upload per analisi automatica</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(4)} variant="outline" className="flex-1">
                  Indietro
                </Button>
                <Button 
                  onClick={handleComplete} 
                  className="flex-1" 
                  disabled={loading}
                >
                  {loading ? "Salvataggio..." : "Completa"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
