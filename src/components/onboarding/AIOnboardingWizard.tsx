import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Sparkles, TrendingUp, PiggyBank, Target, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WelcomeStep } from "./steps/WelcomeStep";
import { EssentialsStep } from "./steps/EssentialsStep";
import { ExpensesStep } from "./steps/ExpensesStep";
import { InvestmentsStep } from "./steps/InvestmentsStep";
import { SummaryStep } from "./steps/SummaryStep";
import { useApp } from "@/contexts/AppContext";

interface OnboardingData {
  savingsGoal: number;
  monthlyIncome: number;
  liquidity: number;
  assets: number;
  debts: number;
  expenses?: any[];
  investments?: any[];
}

interface AIOnboardingWizardProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function AIOnboardingWizard({ isOpen, onComplete }: AIOnboardingWizardProps) {
  const { t } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [data, setData] = useState<OnboardingData>({
    savingsGoal: 0,
    monthlyIncome: 0,
    liquidity: 0,
    assets: 0,
    debts: 0,
  });

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const stepIcons = [
    { icon: Sparkles, label: "Welcome" },
    { icon: TrendingUp, label: "Essentials" },
    { icon: PiggyBank, label: "Expenses" },
    { icon: Target, label: "Investments" },
    { icon: CheckCircle2, label: "Summary" },
  ];

  const canProceed = () => {
    switch (step) {
      case 1: return data.savingsGoal > 0 && data.monthlyIncome > 0;
      case 2: return data.liquidity >= 0 && data.assets >= 0 && data.debts >= 0 && data.monthlyIncome > 0;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("user_profiles")
        .update({
          onboarding_completed: true,
          monthly_income: data.monthlyIncome,
          cash_available: data.liquidity,
          assets: [{ type: "total", value: data.assets }],
          debts: [{ type: "total", value: data.debts }],
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "🎉 Onboarding Complete!",
        description: "Your financial dashboard is ready.",
      });

      onComplete();
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog 
          open={isOpen} 
          onOpenChange={(open) => {
            if (!open) {
              toast({
                title: "⚠️ Complete Setup Required",
                description: "Please finish the onboarding to use Trace-Cash",
                variant: "destructive"
              });
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
            <Card className="border-0 shadow-none">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  {stepIcons.map((item, idx) => {
                    const StepIcon = item.icon;
                    const stepNumber = idx + 1;
                    const isActive = stepNumber === step;
                    const isCompleted = stepNumber < step;
                    
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <motion.div
                          animate={{
                            scale: isActive ? 1.2 : 1,
                            backgroundColor: isActive 
                              ? "hsl(var(--primary))" 
                              : isCompleted 
                              ? "hsl(var(--success))"
                              : "hsl(var(--muted))",
                          }}
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                        >
                          <StepIcon className={`w-5 h-5 ${isActive || isCompleted ? 'text-white' : 'text-muted-foreground'}`} />
                        </motion.div>
                        <span className={`text-xs ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <Progress value={progress} className="h-2" />

                <div className="text-center">
                  <CardTitle className="text-2xl">
                    {step === 1 && t("onboarding.welcome")}
                    {step === 2 && t("onboarding.essentials")}
                    {step === 3 && t("onboarding.expenses")}
                    {step === 4 && t("onboarding.investments")}
                    {step === 5 && t("onboarding.summary")}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    {step === 1 && t("onboarding.ai_powered")}
                    {step === 2 && t("onboarding.core_data")}
                    {step === 3 && t("onboarding.import_expenses")}
                    {step === 4 && t("onboarding.track_portfolio")}
                    {step === 5 && t("onboarding.review_start")}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {step === 1 && <WelcomeStep data={data} setData={setData} />}
                    {step === 2 && <EssentialsStep data={data} setData={setData} />}
                    {step === 3 && <ExpensesStep data={data} setData={setData} />}
                    {step === 4 && <InvestmentsStep data={data} setData={setData} />}
                    {step === 5 && <SummaryStep data={data} />}
                  </motion.div>
                </AnimatePresence>

                <div className="flex flex-col gap-3 pt-8 mt-8 border-t">
                  <div className="flex gap-3">
                    {step > 1 && (
                      <Button variant="outline" onClick={handleBack} disabled={loading}>
                        Back
                      </Button>
                    )}
                    <Button 
                      onClick={handleNext} 
                      disabled={loading || !canProceed()} 
                      className="flex-1"
                    >
                      {loading ? (
                        t("onboarding.complete")
                      ) : step === totalSteps ? (
                        t("onboarding.complete_button")
                      ) : (
                        <>
                          Next
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                  {!canProceed() && step <= 2 && (
                    <p className="text-xs text-destructive text-center">
                      Please fill in all required fields to continue
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground text-center">
                    Step {step} of {totalSteps}
                  </p>
                </div>
              </CardContent>
            </Card>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
