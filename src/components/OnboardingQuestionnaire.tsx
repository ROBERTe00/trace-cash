import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, PiggyBank, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

interface OnboardingQuestionnaireProps {
  onComplete: (answers: OnboardingAnswers) => void;
}

export interface OnboardingAnswers {
  mainGoal: string;
  investmentInterest: string;
  monthlyBudget: string;
}

const steps = [
  {
    id: 1,
    title: "What's your main financial goal?",
    icon: Target,
    options: [
      { value: "save", label: "Save money", description: "Build an emergency fund and save for the future" },
      { value: "invest", label: "Invest in ETFs & Stocks", description: "Grow wealth through investments" },
      { value: "track", label: "Track expenses", description: "Understand where my money goes" },
      { value: "all", label: "All of the above", description: "Complete financial management" },
    ],
    field: "mainGoal" as keyof OnboardingAnswers,
  },
  {
    id: 2,
    title: "Are you interested in investing?",
    icon: TrendingUp,
    options: [
      { value: "yes", label: "Yes, I want to invest", description: "I'm ready to start building a portfolio" },
      { value: "learning", label: "Learning about it", description: "I want to understand investing first" },
      { value: "no", label: "Not right now", description: "I'll focus on saving for now" },
    ],
    field: "investmentInterest" as keyof OnboardingAnswers,
  },
  {
    id: 3,
    title: "What's your monthly budget range?",
    icon: PiggyBank,
    options: [
      { value: "0-1000", label: "€0 - €1,000", description: "Starting my financial journey" },
      { value: "1000-3000", label: "€1,000 - €3,000", description: "Building financial stability" },
      { value: "3000-5000", label: "€3,000 - €5,000", description: "Growing my wealth" },
      { value: "5000+", label: "€5,000+", description: "Advanced financial planning" },
    ],
    field: "monthlyBudget" as keyof OnboardingAnswers,
  },
];

export const OnboardingQuestionnaire = ({ onComplete }: OnboardingQuestionnaireProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    mainGoal: "",
    investmentInterest: "",
    monthlyBudget: "",
  });

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;
  const isStepComplete = answers[currentStepData.field] !== "";

  const handleNext = () => {
    if (!isStepComplete) {
      toast.error("Please select an option to continue");
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save to localStorage
      localStorage.setItem("onboarding-completed", "true");
      localStorage.setItem("onboarding-answers", JSON.stringify(answers));
      
      toast.success("Onboarding complete! Let's get started!");
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSelect = (value: string) => {
    setAnswers({
      ...answers,
      [currentStepData.field]: value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass-card border-2 border-primary/20 animate-fade-in">
        {/* Progress */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Icon className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the option that best describes you
              </p>
            </div>
          </div>

          {/* Options */}
          <RadioGroup
            value={answers[currentStepData.field]}
            onValueChange={handleSelect}
            className="space-y-3"
          >
            {currentStepData.options.map((option) => (
              <div key={option.value} className="relative">
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={option.value}
                  className="flex items-start gap-4 p-5 rounded-xl border-2 border-muted cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-muted-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary flex items-center justify-center mt-0.5">
                    {answers[currentStepData.field] === option.value && (
                      <Check className="h-4 w-4 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold mb-1">{option.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {option.description}
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!isStepComplete}
            className="flex-1"
          >
            {currentStep === steps.length - 1 ? (
              <>
                Complete
                <Check className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};