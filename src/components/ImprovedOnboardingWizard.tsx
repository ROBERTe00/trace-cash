import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileSpreadsheet, Tags, TrendingUp, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

interface ImprovedOnboardingWizardProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const ImprovedOnboardingWizard = ({ 
  isOpen, 
  onComplete 
}: ImprovedOnboardingWizardProps) => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
      });
      onComplete();
    }
  };

  const handleSkipToUpload = () => {
    onComplete();
    navigate('/upload');
  };

  const handleSkipToCategories = () => {
    onComplete();
    navigate('/settings');
  };

  const handleSkipToDashboard = () => {
    onComplete();
    navigate('/');
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <div className="space-y-6 py-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step 1: Import Data */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <FileSpreadsheet className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold gradient-text">
                  Import Your Transactions
                </h2>
                <p className="text-muted-foreground text-lg">
                  Start by importing your financial data from Excel, CSV, or PDF bank statements
                </p>
              </div>
              <div className="bg-primary/5 p-6 rounded-lg space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <ChevronRight className="h-4 w-4" />
                  Quick Tips:
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✅ Upload Excel/CSV files with your transaction history</li>
                  <li>✅ Use PDF upload for automatic bank statement parsing</li>
                  <li>✅ Or use voice input to add expenses hands-free</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleSkipToUpload} 
                  variant="outline" 
                  className="w-full"
                >
                  Import Now
                </Button>
                <Button onClick={handleNext} className="w-full">
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Customize Categories */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Tags className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold gradient-text">
                  Customize Your Categories
                </h2>
                <p className="text-muted-foreground text-lg">
                  Organize expenses your way with drag-and-drop categories
                </p>
              </div>
              <div className="bg-primary/5 p-6 rounded-lg space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <ChevronRight className="h-4 w-4" />
                  What you can do:
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✅ Add custom categories that match your lifestyle</li>
                  <li>✅ Reorder them with drag-and-drop</li>
                  <li>✅ Choose custom colors for easy identification</li>
                  <li>✅ AI will learn from your corrections over time</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setStep(1)} 
                  variant="outline" 
                  className="w-full"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSkipToCategories} 
                  variant="outline" 
                  className="w-full"
                >
                  Customize Now
                </Button>
                <Button onClick={handleNext} className="w-full">
                  Next Step
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: View Your Report */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center animate-pulse">
                  <TrendingUp className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold gradient-text">
                  You're All Set! 🎉
                </h2>
                <p className="text-muted-foreground text-lg">
                  Your dashboard is ready with sample data to explore
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                  <div className="text-2xl mb-1">📊</div>
                  <h4 className="font-semibold text-sm">Interactive Charts</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Zoom and filter your data
                  </p>
                </div>
                <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                  <div className="text-2xl mb-1">🤖</div>
                  <h4 className="font-semibold text-sm">AI Insights</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Smart financial advice
                  </p>
                </div>
                <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                  <div className="text-2xl mb-1">🎯</div>
                  <h4 className="font-semibold text-sm">Goal Tracking</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Monitor your progress
                  </p>
                </div>
                <div className="bg-pink-500/10 p-4 rounded-lg border border-pink-500/20">
                  <div className="text-2xl mb-1">🔔</div>
                  <h4 className="font-semibold text-sm">Smart Notifications</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Stay on track weekly
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setStep(2)} 
                  variant="outline" 
                  className="w-full"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSkipToDashboard} 
                  className="w-full" 
                  size="lg"
                >
                  View Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
