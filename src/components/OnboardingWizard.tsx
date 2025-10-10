import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, Target, Wallet } from "lucide-react";
import confetti from "canvas-confetti";

interface OnboardingWizardProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingWizard = ({ isOpen, onComplete }: OnboardingWizardProps) => {
  const [step, setStep] = useState(1);
  const [goalAmount, setGoalAmount] = useState("");

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      onComplete();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 1 && (
          <div className="space-y-6 py-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Rocket className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold gradient-text">Welcome to MyFinance!</h2>
              <p className="text-muted-foreground">
                Your intelligent financial companion. Let's get you started in 3 quick steps.
              </p>
            </div>
            <Button onClick={handleNext} className="w-full" size="lg">
              Let's Begin! 🚀
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 py-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Set Your First Goal</h2>
                <p className="text-muted-foreground">
                  What's your main financial target? (You can add more later)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal-amount">Target Amount (€)</Label>
                <Input
                  id="goal-amount"
                  type="number"
                  placeholder="10000"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setStep(1)} variant="outline" className="w-full">
                Back
              </Button>
              <Button onClick={handleNext} className="w-full">
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 py-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Wallet className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">You're All Set! 🎉</h2>
              <p className="text-muted-foreground">
                Your dashboard is loaded with sample data to help you explore all features.
              </p>
              <div className="bg-primary/5 p-4 rounded-lg space-y-2 text-sm">
                <p className="font-medium">Quick Tips:</p>
                <ul className="text-left space-y-1 text-muted-foreground">
                  <li>✅ Use voice input to add expenses hands-free</li>
                  <li>✅ Upload bank statements for automatic tracking</li>
                  <li>✅ Check Future Planner for AI projections</li>
                  <li>✅ Explore Progress Hub to earn badges</li>
                </ul>
              </div>
            </div>
            <Button onClick={handleNext} className="w-full" size="lg">
              Start Tracking! 💰
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
