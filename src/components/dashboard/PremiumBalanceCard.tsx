import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Plus } from "lucide-react";
import { StatNumber } from "@/components/ui/stat-number";
import { QuickActionModals } from "./QuickActionModals";
import { useState } from "react";

interface PremiumBalanceCardProps {
  totalBalance?: number;
  availableBalance?: number;
}

export const PremiumBalanceCard = ({ 
  totalBalance = 0, 
  availableBalance = 0 
}: PremiumBalanceCardProps) => {
  const [activeModal, setActiveModal] = useState<"send" | "request" | "exchange" | "topup" | null>(null);

  const actionButtons = [
    { 
      icon: ArrowUpRight, 
      label: "Send", 
      action: "send" as const,
      gradient: "from-primary to-primary-dark"
    },
    { 
      icon: ArrowDownLeft, 
      label: "Request", 
      action: "request" as const,
      gradient: "from-success to-emerald-600"
    },
    { 
      icon: RefreshCw, 
      label: "Exchange", 
      action: "exchange" as const,
      gradient: "from-blue-500 to-cyan-600"
    },
    { 
      icon: Plus, 
      label: "Top Up", 
      action: "topup" as const,
      gradient: "from-orange-500 to-red-600"
    },
  ];

  return (
    <>
      <Card className="premium-card-glow bg-gradient-to-br from-primary via-primary-dark to-black text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(white,transparent_70%)]" />
        
        <div className="relative z-10 space-y-6">
          {/* Balance Section */}
          <div className="space-y-2">
            <p className="text-sm text-white/60 uppercase tracking-wide">Total Balance</p>
            <StatNumber 
              value={totalBalance} 
              color="default" 
              size="xl" 
              className="text-white"
            />
            <p className="text-sm text-white/60">
              Available: <span className="text-white/90 font-mono">${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-3">
            {actionButtons.map((btn) => (
              <button
                key={btn.action}
                onClick={() => setActiveModal(btn.action)}
                className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-neon-purple"
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${btn.gradient} flex items-center justify-center group-hover:shadow-glow-purple transition-shadow duration-300`}>
                  <btn.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-white/90">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <QuickActionModals 
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
};
