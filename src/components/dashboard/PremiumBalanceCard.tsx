import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, FileUp, Receipt } from "lucide-react";
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
  const [activeModal, setActiveModal] = useState<"add_expense" | "add_income" | "import_file" | "bank_statement" | null>(null);

  const actionButtons = [
    { 
      icon: Receipt, 
      label: "Aggiungi Spesa", 
      action: "add_expense" as const,
      gradient: "from-red-500 to-orange-600"
    },
    { 
      icon: TrendingUp, 
      label: "Aggiungi Entrata", 
      action: "add_income" as const,
      gradient: "from-green-500 to-emerald-600"
    },
    { 
      icon: FileUp, 
      label: "Importa File", 
      action: "import_file" as const,
      gradient: "from-primary to-primary-dark"
    },
    { 
      icon: Receipt, 
      label: "Estratto Conto", 
      action: "bank_statement" as const,
      gradient: "from-blue-500 to-cyan-600"
    },
  ];

  return (
    <>
      <Card className="revolut-card hover:shadow-2xl transition-all duration-300">
        <div className="space-y-6">
          {/* Balance Section */}
          <div className="space-y-2">
            <p className="text-sm font-medium opacity-90">Available balance</p>
            <h2 className="text-5xl font-bold font-mono">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-sm opacity-75">
              Total: <span className="font-mono">${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-4">
            {actionButtons.map((btn) => (
              <button
                key={btn.action}
                onClick={() => setActiveModal(btn.action)}
                className="group bg-black/20 hover:bg-black/30 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(139,0,255,0.3)] cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <btn.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium">{btn.label}</span>
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
