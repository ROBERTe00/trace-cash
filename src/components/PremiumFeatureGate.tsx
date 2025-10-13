import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface PremiumFeatureGateProps {
  feature: string;
  children: ReactNode;
  isPremium: boolean;
}

export const PremiumFeatureGate = ({ feature, children, isPremium }: PremiumFeatureGateProps) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <>
      <Card className="relative overflow-hidden">
        {/* Blurred content */}
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background/90 flex items-center justify-center">
          <div className="text-center space-y-4 p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {feature} - Premium Feature
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade to unlock advanced features
              </p>
            </div>
            <Button
              onClick={() => setShowUpgradeModal(true)}
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </Card>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Upgrade to Premium
            </DialogTitle>
            <DialogDescription>
              Unlock all features for just $4.99/month
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Premium includes:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Automated broker sync (Alpaca + CSV imports)
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  AI-powered insights and predictions
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Unlimited transactions
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Dark mode
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Real-time price updates
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Advanced correlation analysis
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Push notifications
                </li>
              </ul>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={() => {
                // TODO: Integrate Stripe billing
                window.alert('Stripe integration coming soon! Contact support for early access.');
              }}
            >
              Subscribe Now - $4.99/month
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Cancel anytime. No long-term commitment.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};