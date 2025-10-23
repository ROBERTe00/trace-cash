import { Card } from "@/components/ui/card";
import { Lock, Construction } from "lucide-react";

export const CreditCardComingSoon = () => {
  return (
    <div className="relative">
      {/* Blurred Background */}
      <div className="filter blur-md pointer-events-none select-none">
        <Card className="p-8">
          <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl" />
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </Card>
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl">
        <div className="text-center space-y-4 p-8">
          <div className="flex justify-center gap-3">
            <Lock className="w-12 h-12 text-primary animate-pulse" />
            <Construction className="w-12 h-12 text-warning animate-bounce" />
          </div>
          <h3 className="text-2xl font-bold text-white">Coming Soon</h3>
          <p className="text-muted-foreground max-w-md">
            Credit card integration is currently under development. 
            Stay tuned for secure, automated transaction tracking!
          </p>
          <div className="inline-block px-6 py-2 bg-primary/20 border border-primary/40 rounded-full text-sm text-primary font-semibold">
            Feature Locked
          </div>
        </div>
      </div>
    </div>
  );
};
