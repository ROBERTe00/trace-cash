import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { useApp } from "@/contexts/AppContext";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface OnboardingData {
  monthlyIncome: number;
  monthlySpendings: number;
  totalSavings: number;
}

interface ModernOnboardingProps {
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
}

export function ModernOnboarding({ onComplete, onSkip }: ModernOnboardingProps) {
  const { formatCurrency } = useApp();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    monthlyIncome: 20000,
    monthlySpendings: 10000,
    totalSavings: 100000,
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(data);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              {step}/{totalSteps}
            </span>
          </div>
          <Progress value={progress} className="mb-4" />
          <CardTitle>Core Finance</CardTitle>
          <CardDescription>
            The closer you set your values, the more tailored your financial insights will be
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Monthly Income</label>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{formatCurrency(data.monthlyIncome)}</span>
                </div>
                <Slider
                  value={[data.monthlyIncome]}
                  onValueChange={([value]) => setData({ ...data, monthlyIncome: value })}
                  min={0}
                  max={200000}
                  step={1000}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Monthly Spendings <span className="text-muted-foreground">(include EMI's)</span>
                </label>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{formatCurrency(data.monthlySpendings)}</span>
                </div>
                <Slider
                  value={[data.monthlySpendings]}
                  onValueChange={([value]) => setData({ ...data, monthlySpendings: value })}
                  min={0}
                  max={data.monthlyIncome}
                  step={1000}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Total Savings You Have</label>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{formatCurrency(data.totalSavings)}</span>
                </div>
                <Slider
                  value={[data.totalSavings]}
                  onValueChange={([value]) => setData({ ...data, totalSavings: value })}
                  min={0}
                  max={5000000}
                  step={10000}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            {step > 1 ? (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={onSkip}>
                Skip personalization
              </Button>
            )}
            <Button onClick={handleNext}>
              {step === totalSteps ? "Get Started" : "Next"}
              {step < totalSteps && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
