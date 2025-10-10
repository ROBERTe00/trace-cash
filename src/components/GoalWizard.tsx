import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Target, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { FinancialGoal } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface GoalWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (goal: Omit<FinancialGoal, "id">) => void;
}

const GOAL_TEMPLATES = [
  { name: "Acquisto Casa", amount: 50000, category: "Purchase" as const, description: "Anticipo per la casa dei tuoi sogni" },
  { name: "Pensione Anticipata", amount: 100000, category: "Retirement" as const, description: "Fondo per il tuo futuro" },
  { name: "Fondo Emergenza", amount: 10000, category: "Emergency" as const, description: "Sicurezza finanziaria per imprevisti" },
  { name: "Viaggio Mondiale", amount: 15000, category: "Travel" as const, description: "Esplora il mondo" },
  { name: "Formazione Professionale", amount: 5000, category: "Other" as const, description: "Investi nel tuo sviluppo" },
];

export function GoalWizard({ open, onOpenChange, onComplete }: GoalWizardProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    monthlyContribution: "",
    deadline: "",
    category: "Savings" as FinancialGoal["category"],
    priority: "Medium" as FinancialGoal["priority"],
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleTemplateSelect = (template: typeof GOAL_TEMPLATES[0]) => {
    setFormData({
      ...formData,
      name: template.name,
      targetAmount: template.amount.toString(),
      category: template.category,
    });
    setStep(2);
  };

  const handleNext = () => {
    if (step === 1 && !formData.name) {
      toast({ title: "Nome Richiesto", description: "Inserisci un nome per il tuo obiettivo", variant: "destructive" });
      return;
    }
    if (step === 2 && (!formData.targetAmount || !formData.monthlyContribution)) {
      toast({ title: "Importi Richiesti", description: "Inserisci importo target e contributo mensile", variant: "destructive" });
      return;
    }
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    if (!formData.deadline) {
      toast({ title: "Scadenza Richiesta", description: "Seleziona una data di scadenza", variant: "destructive" });
      return;
    }

    const monthlyContribution = parseFloat(formData.monthlyContribution);
    const targetAmount = parseFloat(formData.targetAmount);
    const currentAmount = 0; // Starting fresh

    onComplete({
      name: formData.name,
      targetAmount,
      currentAmount,
      deadline: formData.deadline,
      category: formData.category,
      priority: formData.priority,
    });

    // Reset and close
    setFormData({
      name: "",
      targetAmount: "",
      monthlyContribution: "",
      deadline: "",
      category: "Savings",
      priority: "Medium",
    });
    setStep(1);
    onOpenChange(false);

    toast({
      title: "Obiettivo Creato! 🎯",
      description: `${formData.name} è stato aggiunto al tuo piano finanziario.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Target className="h-6 w-6 text-primary" />
            Crea Nuovo Obiettivo
          </DialogTitle>
          <DialogDescription>
            Segui i passaggi per definire il tuo obiettivo finanziario
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-medium">Passaggio {step} di {totalSteps}</span>
            <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1: Goal Type */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="mb-4">
              <h3 className="font-semibold mb-3">Scegli un Template o Crea Personalizzato</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {GOAL_TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => handleTemplateSelect(template)}
                    className="p-4 rounded-lg border-2 border-muted hover:border-primary transition-all text-left group"
                  >
                    <div className="font-semibold mb-1 group-hover:text-primary transition-colors">
                      {template.name}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">{template.description}</div>
                    <div className="text-sm font-bold text-primary">€{template.amount.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label htmlFor="custom-name">O Crea Obiettivo Personalizzato</Label>
              <Input
                id="custom-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="es. Acquisto Auto, Ristrutturazione Casa..."
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as FinancialGoal["category"] })}
              >
                <SelectTrigger id="category" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Savings">Risparmio</SelectItem>
                  <SelectItem value="Investment">Investimento</SelectItem>
                  <SelectItem value="Purchase">Acquisto</SelectItem>
                  <SelectItem value="Emergency">Emergenza</SelectItem>
                  <SelectItem value="Retirement">Pensione</SelectItem>
                  <SelectItem value="Travel">Viaggio</SelectItem>
                  <SelectItem value="Other">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Amounts */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-primary/5">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="font-semibold">Definisci gli Importi</span>
            </div>

            <div>
              <Label htmlFor="target-amount">Importo Target (€)</Label>
              <Input
                id="target-amount"
                type="number"
                step="100"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                placeholder="50000"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Quanto vuoi raggiungere in totale?
              </p>
            </div>

            <div>
              <Label htmlFor="monthly-contribution">Contributo Mensile (€)</Label>
              <Input
                id="monthly-contribution"
                type="number"
                step="10"
                value={formData.monthlyContribution}
                onChange={(e) => setFormData({ ...formData, monthlyContribution: e.target.value })}
                placeholder="500"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Quanto puoi risparmiare ogni mese?
              </p>
            </div>

            {formData.targetAmount && formData.monthlyContribution && (
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <div className="text-sm font-medium mb-2">📊 Stima Preliminare</div>
                <div className="text-xs text-muted-foreground">
                  Con €{formData.monthlyContribution}/mese, raggiungerai €{formData.targetAmount} in circa{" "}
                  <span className="font-bold text-foreground">
                    {Math.ceil(parseFloat(formData.targetAmount) / parseFloat(formData.monthlyContribution))} mesi
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Timeline & Priority */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-primary/5">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-semibold">Scadenza e Priorità</span>
            </div>

            <div>
              <Label htmlFor="deadline">Data Scadenza</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Quando vuoi raggiungere questo obiettivo?
              </p>
            </div>

            <div>
              <Label htmlFor="priority">Priorità</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as FinancialGoal["priority"] })}
              >
                <SelectTrigger id="priority" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">Alta - Priorità massima</SelectItem>
                  <SelectItem value="Medium">Media - Importante ma flessibile</SelectItem>
                  <SelectItem value="Low">Bassa - Nice to have</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.deadline && formData.monthlyContribution && formData.targetAmount && (
              <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Riepilogo Obiettivo</span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Nome:</span>
                    <span className="font-semibold text-foreground">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target:</span>
                    <span className="font-semibold text-foreground">€{parseFloat(formData.targetAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mensile:</span>
                    <span className="font-semibold text-foreground">€{parseFloat(formData.monthlyContribution).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scadenza:</span>
                    <span className="font-semibold text-foreground">
                      {new Date(formData.deadline).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Indietro
          </Button>
          <Button onClick={handleNext} className="gap-2">
            {step === totalSteps ? "Completa" : "Avanti"}
            {step < totalSteps && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
