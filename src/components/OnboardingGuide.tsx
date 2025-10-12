import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Upload, CheckSquare, Settings, ArrowRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OnboardingGuideProps {
  onComplete: () => void;
}

const guideSteps = [
  {
    id: 1,
    icon: Upload,
    title: "Upload Your Bank Statement",
    description: "Navigate to the Upload page and drag & drop your PDF bank statement. Our AI will extract all transactions automatically.",
    tips: [
      "Supports multi-page PDF statements",
      "Detects your bank automatically",
      "Extracts ALL transactions (no limits)",
    ],
    action: { label: "Go to Upload", route: "/upload" },
  },
  {
    id: 2,
    icon: CheckSquare,
    title: "Review & Approve Transactions",
    description: "After upload, review the extracted transactions. Edit categories or amounts if needed, then confirm to add them to your expenses.",
    tips: [
      "Check low-confidence items (highlighted in yellow)",
      "Edit any incorrect categorizations",
      "Bulk approve all transactions at once",
    ],
    action: null,
  },
  {
    id: 3,
    icon: Settings,
    title: "Manage Your Profile",
    description: "Visit Settings to configure categories, set up notifications, view audit logs, and customize your experience.",
    tips: [
      "Add custom expense categories",
      "Set up data export options",
      "Configure language and currency",
    ],
    action: { label: "Go to Settings", route: "/settings" },
  },
];

export const OnboardingGuide = ({ onComplete }: OnboardingGuideProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const step = guideSteps[currentStep];
  const Icon = step.icon;

  const handleNext = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem("guide-completed", "true");
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAction = () => {
    if (step.action) {
      localStorage.setItem("guide-completed", "true");
      navigate(step.action.route);
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem("guide-completed", "true");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass-card border-2 border-primary/20 animate-fade-in relative">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Skip guide"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-8">
          {/* Progress indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {guideSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-8 bg-primary"
                    : index < currentStep
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Icon className="h-10 w-10 text-primary" />
            </div>
          </div>

          {/* Title & Description */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-3">{step.title}</h2>
            <p className="text-muted-foreground text-lg">{step.description}</p>
          </div>

          {/* Tips */}
          <div className="bg-primary/5 rounded-xl p-6 mb-8">
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-primary">
              Key Features:
            </h3>
            <ul className="space-y-2">
              {step.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            
            {step.action ? (
              <Button onClick={handleAction} className="flex-1">
                {step.action.label}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleNext} className="flex-1">
                {currentStep === guideSteps.length - 1 ? "Get Started" : "Next"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Skip link */}
          <div className="text-center mt-4">
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Skip tutorial
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
