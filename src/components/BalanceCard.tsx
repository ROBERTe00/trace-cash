import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Wallet } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Badge } from "@/components/ui/badge";

interface Account {
  name: string;
  amount: number;
  type: string;
  icon: 'card' | 'wallet';
  color: string;
}

interface BalanceCardProps {
  totalBalance: number;
  accounts: Account[];
}

const BalanceCard = ({ totalBalance, accounts }: BalanceCardProps) => {
  const { formatCurrency } = useApp();

  const iconMap = {
    card: CreditCard,
    wallet: Wallet,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="h-full"
    >
      <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-muted-foreground">Total Balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <motion.div
            className="text-7xl font-extrabold tracking-tighter leading-none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 150, delay: 0.3 }}
          >
            {formatCurrency(totalBalance)}
          </motion.div>
          
          <div className="space-y-3">
            {accounts.map((account, index) => {
              const Icon = iconMap[account.icon];
              return (
                <motion.div
                  key={account.name}
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${account.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: account.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{account.name}</p>
                      <Badge variant="secondary" className="text-xs mt-0.5">
                        {account.type}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-base font-semibold">{formatCurrency(account.amount)}</span>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BalanceCard;
