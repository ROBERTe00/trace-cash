import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, TrendingUp, Wallet, FileText, 
  PieChart, Upload, ArrowRight, ArrowLeft, X 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface EnhancedOnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
}

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

export const EnhancedOnboarding = ({ isOpen, onComplete }: EnhancedOnboardingProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  // Step 1: Obiettivi
  const [savingsGoal, setSavingsGoal] = useState(500);
  const [aiInsight1, setAiInsight1] = useState("");

  // Step 2: Dati essenziali
  const [cashAvailable, setCashAvailable] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [newAssetName, setNewAssetName] = useState("");
  const [newAssetValue, setNewAssetValue] = useState("");
  const [newDebtName, setNewDebtName] = useState("");
  const [newDebtAmount, setNewDebtAmount] = useState("");
  const [newIncomeName, setNewIncomeName] = useState("");
  const [newIncomeAmount, setNewIncomeAmount] = useState("");
  const [aiInsight2, setAiInsight2] = useState("");

  // Step 3: Spese
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [aiInsight3, setAiInsight3] = useState("");

  // Step 4: Investimenti
  const [investmentFile, setInvestmentFile] = useState<File | null>(null);
  const [aiInsight4, setAiInsight4] = useState("");

  const calculateNetWorth = () => {
    const cash = parseFloat(cashAvailable) || 0;
    const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
    const totalDebts = debts.reduce((sum, debt) => sum + debt.amount, 0);
    return cash + totalAssets - totalDebts;
  };

  const calculateTotalIncome = () => {
    return incomeSources.reduce((sum, source) => sum + source.amount, 0);
  };

  // AI Insights
  useEffect(() => {
    if (step === 1 && savingsGoal > 0) {
      setAiInsight1(`💡 Ottimo! Per risparmiare €${savingsGoal}/mese, prova a ridurre del 15% le spese non essenziali.`);
    }
  }, [savingsGoal, step]);

  useEffect(() => {
    if (step === 2 && (cashAvailable || assets.length > 0 || incomeSources.length > 0)) {
      const netWorth = calculateNetWorth();
      const income = calculateTotalIncome();
      setAiInsight2(`📊 Patrimonio netto: €${netWorth.toLocaleString()}. ${income > 0 ? `Entrate mensili: €${income.toLocaleString()}` : 'Aggiungi le tue entrate per insight migliori'}`);
    }
  }, [cashAvailable, assets, debts, incomeSources, step]);

  const handleAddAsset = () => {
    if (newAssetName && newAssetValue) {
      setAssets([...assets, { name: newAssetName, value: parseFloat(newAssetValue) }]);
      setNewAssetName("");
      setNewAssetValue("");
      savePartialData();
    }
  };

  const handleRemoveAsset = (index: number) => {
    setAssets(assets.filter((_, i) => i !== index));
    savePartialData();
  };

  const handleAddDebt = () => {
    if (newDebtName && newDebtAmount) {
      setDebts([...debts, { name: newDebtName, amount: parseFloat(newDebtAmount) }]);
      setNewDebtName("");
      setNewDebtAmount("");
      savePartialData();
    }
  };

  const handleRemoveDebt = (index: number) => {
    setDebts(debts.filter((_, i) => i !== index));
    savePartialData();
  };

  const handleAddIncome = () => {
    if (newIncomeName && newIncomeAmount) {
      setIncomeSources([...incomeSources, { name: newIncomeName, amount: parseFloat(newIncomeAmount) }]);
      setNewIncomeName("");
      setNewIncomeAmount("");
      savePartialData();
    }
  };

  const handleRemoveIncome = (index: number) => {
    setIncomeSources(incomeSources.filter((_, i) => i !== index));
    savePartialData();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setAiInsight3(`📁 File "${file.name}" caricato. Analisi in corso...`);
      // Simulated AI insight
      setTimeout(() => {
        setAiInsight3(`✅ Rilevate 3 categorie principali: Alimentari (35%), Trasporti (25%), Shopping (20%)`);
      }, 1500);
    }
  };

  const handleInvestmentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInvestmentFile(file);
      setAiInsight4(`📁 Portfolio "${file.name}" caricato. Analisi in corso...`);
      // Simulated AI insight
      setTimeout(() => {
        setAiInsight4(`📈 Rendimento stimato anno in corso: +8.5%. Diversificazione: Buona`);
      }, 1500);
    }
  };

  const savePartialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          cash_available: parseFloat(cashAvailable) || 0,
          monthly_income: calculateTotalIncome(),
          income_sources: incomeSources as any,
          assets: assets as any,
          debts: debts as any,
        }, { onConflict: 'user_id' });
    } catch (error) {
      console.error("Error saving partial data:", error);
    }
  };

  const handleNext = async () => {
    await savePartialData();
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    await savePartialData();
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
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

      await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          cash_available: parseFloat(cashAvailable) || 0,
          monthly_income: calculateTotalIncome(),
          income_sources: incomeSources as any,
          assets: assets as any,
          debts: debts as any,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#2196F3', '#4CAF50', '#9E9E9E'],
      });

      toast.success("🎉 Onboarding completato!");
      onComplete();
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Errore nel salvataggio");
    } finally {
      setLoading(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4 }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-6 pb-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold gradient-text">Benvenuto in Trace Cash</h2>
            <span className="text-sm font-medium text-muted-foreground">
              {step}/{totalSteps}
            </span>
          </div>
          <Progress 
            value={progress} 
            className="h-2.5 transition-all duration-500"
            indicatorClassName="bg-gradient-to-r from-[#2196F3] to-[#4CAF50]"
          />
        </div>

        <div className="p-6 pt-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Benvenuto e Obiettivi */}
            {step === 1 && (
              <motion.div key="step1" {...fadeInUp} className="space-y-6">
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="h-28 w-28 rounded-full bg-gradient-to-br from-[#2196F3] to-[#4CAF50] flex items-center justify-center shadow-lg"
                  >
                    <Sparkles className="h-14 w-14 text-white" />
                  </motion.div>
                </div>

                <div className="text-center space-y-3">
                  <h3 className="text-3xl font-bold">Iniziamo!</h3>
                  <p className="text-muted-foreground text-lg">
                    Quanto vuoi risparmiare ogni mese?
                  </p>
                </div>

                <div className="space-y-4 bg-[#2196F3]/5 p-6 rounded-2xl border border-[#2196F3]/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Obiettivo di risparmio mensile</span>
                    <span className="text-3xl font-bold text-[#2196F3]">€{savingsGoal}</span>
                  </div>
                  <Slider
                    value={[savingsGoal]}
                    onValueChange={(value) => setSavingsGoal(value[0])}
                    min={0}
                    max={5000}
                    step={50}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>€0</span>
                    <span>€5,000</span>
                  </div>
                </div>

                {aiInsight1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-[#4CAF50]/10 to-[#2196F3]/10 p-4 rounded-xl border border-[#4CAF50]/30"
                  >
                    <p className="text-sm font-medium flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-[#4CAF50] flex-shrink-0 mt-0.5" />
                      {aiInsight1}
                    </p>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSkip} variant="outline" className="flex-1">
                    Salta
                  </Button>
                  <Button onClick={handleNext} className="flex-1 bg-[#2196F3] hover:bg-[#1976D2]">
                    Continua <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Dati Essenziali */}
            {step === 2 && (
              <motion.div key="step2" {...fadeInUp} className="space-y-6">
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="h-28 w-28 rounded-full bg-gradient-to-br from-[#4CAF50] to-[#2196F3] flex items-center justify-center shadow-lg"
                  >
                    <Wallet className="h-14 w-14 text-white" />
                  </motion.div>
                </div>

                <div className="text-center space-y-3">
                  <h3 className="text-3xl font-bold">Situazione Finanziaria</h3>
                  <p className="text-muted-foreground">
                    Inserisci liquidità, asset, debiti ed entrate
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Liquidità */}
                  <div className="space-y-2">
                    <Label htmlFor="cash">💰 Liquidità disponibile</Label>
                    <Input
                      id="cash"
                      type="number"
                      placeholder="0"
                      value={cashAvailable}
                      onChange={(e) => {
                        setCashAvailable(e.target.value);
                        savePartialData();
                      }}
                      className="text-lg"
                    />
                  </div>

                  {/* Asset */}
                  <div className="space-y-2">
                    <Label>🏠 Asset (Casa, Auto, Investimenti)</Label>
                    {assets.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {assets.map((asset, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-[#4CAF50]/5 rounded-lg border border-[#4CAF50]/20">
                            <div>
                              <p className="font-medium">{asset.name}</p>
                              <p className="text-sm text-muted-foreground">€{asset.value.toLocaleString()}</p>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => handleRemoveAsset(idx)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Nome"
                        value={newAssetName}
                        onChange={(e) => setNewAssetName(e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Valore €"
                        value={newAssetValue}
                        onChange={(e) => setNewAssetValue(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddAsset} variant="outline" size="sm" className="w-full">
                      + Aggiungi Asset
                    </Button>
                  </div>

                  {/* Debiti */}
                  <div className="space-y-2">
                    <Label>💳 Debiti (Mutui, Prestiti)</Label>
                    {debts.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {debts.map((debt, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                            <div>
                              <p className="font-medium">{debt.name}</p>
                              <p className="text-sm text-muted-foreground">€{debt.amount.toLocaleString()}</p>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => handleRemoveDebt(idx)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Nome"
                        value={newDebtName}
                        onChange={(e) => setNewDebtName(e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Importo €"
                        value={newDebtAmount}
                        onChange={(e) => setNewDebtAmount(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddDebt} variant="outline" size="sm" className="w-full">
                      + Aggiungi Debito
                    </Button>
                  </div>

                  {/* Entrate */}
                  <div className="space-y-2">
                    <Label>💵 Entrate Mensili</Label>
                    {incomeSources.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {incomeSources.map((income, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-[#2196F3]/5 rounded-lg border border-[#2196F3]/20">
                            <div>
                              <p className="font-medium">{income.name}</p>
                              <p className="text-sm text-muted-foreground">€{income.amount.toLocaleString()}/mese</p>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => handleRemoveIncome(idx)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Nome"
                        value={newIncomeName}
                        onChange={(e) => setNewIncomeName(e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="€/mese"
                        value={newIncomeAmount}
                        onChange={(e) => setNewIncomeAmount(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAddIncome} variant="outline" size="sm" className="w-full">
                      + Aggiungi Entrata
                    </Button>
                  </div>
                </div>

                {aiInsight2 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-[#4CAF50]/10 to-[#2196F3]/10 p-4 rounded-xl border border-[#4CAF50]/30"
                  >
                    <p className="text-sm font-medium flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-[#4CAF50] flex-shrink-0 mt-0.5" />
                      {aiInsight2}
                    </p>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleBack} variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleSkip} variant="outline" className="flex-1">
                    Salta
                  </Button>
                  <Button onClick={handleNext} className="flex-1 bg-[#2196F3] hover:bg-[#1976D2]">
                    Continua <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Spese */}
            {step === 3 && (
              <motion.div key="step3" {...fadeInUp} className="space-y-6">
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="h-28 w-28 rounded-full bg-gradient-to-br from-[#9E9E9E] to-[#2196F3] flex items-center justify-center shadow-lg"
                  >
                    <FileText className="h-14 w-14 text-white" />
                  </motion.div>
                </div>

                <div className="text-center space-y-3">
                  <h3 className="text-3xl font-bold">Le Tue Spese</h3>
                  <p className="text-muted-foreground">
                    Carica estratto conto PDF/CSV per analisi automatica
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-[#2196F3]/30 rounded-xl p-8 text-center bg-[#2196F3]/5 hover:bg-[#2196F3]/10 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.csv,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="expense-upload"
                    />
                    <label htmlFor="expense-upload" className="cursor-pointer space-y-3 block">
                      <Upload className="h-12 w-12 text-[#2196F3] mx-auto" />
                      <div>
                        <p className="font-medium">Carica estratto conto</p>
                        <p className="text-sm text-muted-foreground">PDF, CSV o Excel</p>
                      </div>
                      {uploadedFile && (
                        <p className="text-sm font-medium text-[#4CAF50]">
                          ✓ {uploadedFile.name}
                        </p>
                      )}
                    </label>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      oppure aggiungi manualmente le spese nella dashboard
                    </p>
                  </div>
                </div>

                {aiInsight3 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-[#4CAF50]/10 to-[#2196F3]/10 p-4 rounded-xl border border-[#4CAF50]/30"
                  >
                    <p className="text-sm font-medium flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-[#4CAF50] flex-shrink-0 mt-0.5" />
                      {aiInsight3}
                    </p>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleBack} variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleSkip} variant="outline" className="flex-1">
                    Salta
                  </Button>
                  <Button onClick={handleNext} className="flex-1 bg-[#2196F3] hover:bg-[#1976D2]">
                    Continua <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Investimenti */}
            {step === 4 && (
              <motion.div key="step4" {...fadeInUp} className="space-y-6">
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="h-28 w-28 rounded-full bg-gradient-to-br from-[#4CAF50] to-[#2196F3] flex items-center justify-center shadow-lg"
                  >
                    <TrendingUp className="h-14 w-14 text-white" />
                  </motion.div>
                </div>

                <div className="text-center space-y-3">
                  <h3 className="text-3xl font-bold">Investimenti</h3>
                  <p className="text-muted-foreground">
                    Importa il tuo portfolio o inseriscilo manualmente
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-[#4CAF50]/30 rounded-xl p-8 text-center bg-[#4CAF50]/5 hover:bg-[#4CAF50]/10 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx,.csv"
                      onChange={handleInvestmentFileUpload}
                      className="hidden"
                      id="investment-upload"
                    />
                    <label htmlFor="investment-upload" className="cursor-pointer space-y-3 block">
                      <Upload className="h-12 w-12 text-[#4CAF50] mx-auto" />
                      <div>
                        <p className="font-medium">Carica portfolio</p>
                        <p className="text-sm text-muted-foreground">Excel o CSV</p>
                      </div>
                      {investmentFile && (
                        <p className="text-sm font-medium text-[#4CAF50]">
                          ✓ {investmentFile.name}
                        </p>
                      )}
                    </label>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      oppure aggiungi investimenti nella sezione Portfolio
                    </p>
                  </div>
                </div>

                {aiInsight4 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-[#4CAF50]/10 to-[#2196F3]/10 p-4 rounded-xl border border-[#4CAF50]/30"
                  >
                    <p className="text-sm font-medium flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-[#4CAF50] flex-shrink-0 mt-0.5" />
                      {aiInsight4}
                    </p>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleBack} variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleSkip} variant="outline" className="flex-1">
                    Salta
                  </Button>
                  <Button onClick={handleNext} className="flex-1 bg-[#2196F3] hover:bg-[#1976D2]">
                    Continua <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Riepilogo */}
            {step === 5 && (
              <motion.div key="step5" {...fadeInUp} className="space-y-6">
                <div className="flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="h-28 w-28 rounded-full bg-gradient-to-br from-[#4CAF50] to-[#2196F3] flex items-center justify-center shadow-lg animate-pulse"
                  >
                    <PieChart className="h-14 w-14 text-white" />
                  </motion.div>
                </div>

                <div className="text-center space-y-3">
                  <h3 className="text-3xl font-bold">Tutto Pronto! 🎉</h3>
                  <p className="text-muted-foreground">
                    Ecco il tuo profilo finanziario
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Net Worth Card */}
                  <div className="bg-gradient-to-br from-[#2196F3]/20 to-[#4CAF50]/20 p-6 rounded-2xl border border-[#2196F3]/30">
                    <p className="text-sm text-muted-foreground mb-2">Patrimonio Netto</p>
                    <p className="text-5xl font-bold gradient-text">
                      €{calculateNetWorth().toLocaleString()}
                    </p>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#4CAF50]/10 p-4 rounded-xl border border-[#4CAF50]/30">
                      <p className="text-xs text-muted-foreground mb-1">Risparmio Target</p>
                      <p className="text-xl font-bold text-[#4CAF50]">€{savingsGoal}/mese</p>
                    </div>
                    <div className="bg-[#2196F3]/10 p-4 rounded-xl border border-[#2196F3]/30">
                      <p className="text-xs text-muted-foreground mb-1">Entrate Mensili</p>
                      <p className="text-xl font-bold text-[#2196F3]">€{calculateTotalIncome().toLocaleString()}</p>
                    </div>
                    <div className="bg-[#9E9E9E]/10 p-4 rounded-xl border border-[#9E9E9E]/30">
                      <p className="text-xs text-muted-foreground mb-1">Asset Totali</p>
                      <p className="text-xl font-bold text-[#9E9E9E]">{assets.length}</p>
                    </div>
                    <div className="bg-[#2196F3]/10 p-4 rounded-xl border border-[#2196F3]/30">
                      <p className="text-xs text-muted-foreground mb-1">Debiti</p>
                      <p className="text-xl font-bold text-[#2196F3]">{debts.length}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-[#4CAF50]/10 to-[#2196F3]/10 p-4 rounded-xl border border-[#4CAF50]/30">
                    <p className="text-sm font-medium flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-[#4CAF50] flex-shrink-0 mt-0.5" />
                      🚀 Dashboard pronta con grafici interattivi, insight AI e tracciamento obiettivi!
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleBack} variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleComplete} 
                    className="flex-1 bg-gradient-to-r from-[#2196F3] to-[#4CAF50] hover:from-[#1976D2] hover:to-[#388E3C] text-white font-semibold text-lg h-12"
                    disabled={loading}
                  >
                    {loading ? "Salvataggio..." : "Vai alla Dashboard 🎯"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};