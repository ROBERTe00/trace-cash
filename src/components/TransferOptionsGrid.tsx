import { motion } from "framer-motion";
import { CreditCard, Wallet, Building2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TransferOption {
  icon: any;
  label: string;
  description: string;
  gradient: string;
}

const transferOptions: TransferOption[] = [
  {
    icon: CreditCard,
    label: "Card to card",
    description: "Trasferimento istantaneo",
    gradient: "gradient-purple",
  },
  {
    icon: Wallet,
    label: "To account",
    description: "Al tuo conto bancario",
    gradient: "gradient-green",
  },
  {
    icon: Building2,
    label: "Bank transfer",
    description: "Bonifico bancario",
    gradient: "gradient-blue",
  },
];

export const TransferOptionsGrid = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Opzioni di Trasferimento</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {transferOptions.map((option, index) => {
          const Icon = option.icon;
          return (
            <motion.div
              key={option.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group border-0 bg-card">
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-xl ${option.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-base mb-1">{option.label}</h4>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
