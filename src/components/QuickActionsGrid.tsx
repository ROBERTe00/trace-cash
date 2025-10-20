import { Card } from "@/components/ui/card";
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp,
  Wallet,
  CreditCard,
  Receipt,
  Target
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  color: string;
  action: () => void;
}

export const QuickActionsGrid = () => {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      id: 'add-expense',
      label: 'Aggiungi Spesa',
      icon: Plus,
      color: 'hsl(var(--primary))',
      action: () => navigate('/transactions?action=add-expense')
    },
    {
      id: 'add-income',
      label: 'Aggiungi Entrata',
      icon: ArrowDownLeft,
      color: 'hsl(var(--success))',
      action: () => navigate('/transactions?action=add-income')
    },
    {
      id: 'investments',
      label: 'Investimenti',
      icon: TrendingUp,
      color: 'hsl(var(--accent))',
      action: () => navigate('/investments')
    },
    {
      id: 'budgets',
      label: 'Budget',
      icon: Wallet,
      color: 'hsl(var(--warning))',
      action: () => navigate('/settings')
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={action.action}
            className="group flex flex-col items-center gap-2 p-4 rounded-2xl border-0 bg-card hover:bg-muted/50 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <div 
              className="h-12 w-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${action.color}15` }}
            >
              <Icon 
                className="h-5 w-5 transition-transform group-hover:scale-110"
                style={{ color: action.color }}
              />
            </div>
            <span className="text-xs font-medium text-center">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};