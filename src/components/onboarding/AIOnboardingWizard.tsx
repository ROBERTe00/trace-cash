import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, ArrowLeft, Sparkles, TrendingUp, PiggyBank, Target, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { WelcomeStep } from "./steps/WelcomeStep";
import { EssentialsStep } from "./steps/EssentialsStep";
import { ExpensesStep } from "./steps/ExpensesStep";
import { InvestmentsStep } from "./steps/InvestmentsStep";
import { SummaryStep } from "./steps/SummaryStep";

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
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [data, setData] = useState<OnboardingData>({
    savingsGoal: 5000,
    monthlyIncome: 30000,
    liquidity: 10000,
    assets: 50000,
    debts: 20000,
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

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Update user profile
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <Card className="shadow-2xl border-primary/20">
              <CardHeader className="space-y-4">
                {/* Progress Dots */}
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

                {/* Progress Bar */}
                <Progress value={progress} className="h-2" />

                <div className="text-center">
                  <CardTitle className="text-2xl">
                    {step === 1 && "Welcome to Trace-Cash"}
                    {step === 2 && "Let's Set Your Essentials"}
                    {step === 3 && "Track Your Expenses"}
                    {step === 4 && "Manage Your Investments"}
                    {step === 5 && "Your Financial Overview"}
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    {step === 1 && "AI-powered financial tracking starts here"}
                    {step === 2 && "Set up your core financial data"}
                    {step === 3 && "Import or add expenses manually"}
                    {step === 4 && "Track your portfolio performance"}
                    {step === 5 && "Review and start using the app"}
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

                {/* Navigation */}
                <div className="flex justify-between items-center pt-8 mt-8 border-t">
                  <div>
                    {step > 1 ? (
                      <Button variant="outline" onClick={handleBack} disabled={loading}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                    ) : (
                      <Button variant="ghost" onClick={handleSkip} disabled={loading}>
                        Skip All
                      </Button>
                    )}
                  </div>

                  <span className="text-sm text-muted-foreground">
                    Step {step} of {totalSteps}
                  </span>

                  <Button onClick={handleNext} disabled={loading}>
                    {loading ? (
                      "Processing..."
                    ) : step === totalSteps ? (
                      <>Start Using App</>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
