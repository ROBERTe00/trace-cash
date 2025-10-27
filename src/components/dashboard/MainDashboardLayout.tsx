import React from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, Cog, Download, Plus, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FinancialHealthHero } from './FinancialHealthHero';
import { useApp } from '@/contexts/AppContext';

interface MainDashboardLayoutProps {
  user?: any;
  metrics?: any;
  onEditLayout?: () => void;
  onAddTransaction?: () => void;
  onExport?: () => void;
}

export function MainDashboardLayout({
  user,
  metrics,
  onEditLayout,
  onAddTransaction,
  onExport,
}: MainDashboardLayoutProps) {
  const { formatCurrency } = useApp();

  // Contextual greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    const greetings = {
      morning: "Buongiorno, Marco! Ecco la tua situazione finanziaria",
      afternoon: "Buon pomeriggio, Marco! Come procedono le finanze?",
      evening: "Buonasera, Marco! Riepilogo della giornata finanziaria"
    };
    
    if (hour < 12) return greetings.morning;
    if (hour < 18) return greetings.afternoon;
    return greetings.evening;
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <nav className="border-b border-border py-4">
        <div className="flex justify-between items-center px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-500 rounded-lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                MyMoney.ai
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#" className="text-sm font-medium relative">
                Dashboard
                <span className="absolute bottom-[-8px] left-0 right-0 h-0.5 bg-primary rounded-full" />
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Transazioni
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Investimenti
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Obiettivi
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Report
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Impostazioni
              </a>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-card/50 border border-border">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.email?.[0]?.toUpperCase() || 'M'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">Marco Rossi</div>
                <Badge variant="secondary" className="text-xs">Premium</Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <Button variant="ghost" size="icon">
              <Cog className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="px-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold mb-2">Dashboard Finanziaria</h1>
            <p className="text-sm text-muted-foreground" id="contextualGreeting">
              {getGreeting()}
            </p>
          </motion.div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onEditLayout}
              className="hidden md:flex"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Modifica Layout
            </Button>
            <Button
              variant="outline"
              onClick={onExport}
              className="hidden md:flex"
            >
              <Download className="w-4 h-4 mr-2" />
              Esporta
            </Button>
            <Button
              onClick={onAddTransaction}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuova Transazione
            </Button>
          </div>
        </div>

        {/* Financial Health Hero - Will be passed as children */}
        {metrics && (
          <FinancialHealthHero
            totalIncome={metrics.totalIncome || 0}
            savings={metrics.savings || 0}
            savingsRate={metrics.savingsRate || 0}
            healthScore={calculateHealthScore(metrics)}
            monthlyProgress={calculateMonthlyProgress()}
            incomeChange={metrics.incomeChange || 0}
          />
        )}
      </div>
    </div>
  );
}

function calculateHealthScore(metrics: any): number {
  const savingsRate = metrics?.savingsRate || 0;
  const expenseRatio = metrics?.totalExpenses / metrics?.totalIncome || 0;
  
  let score = 0;
  
  // Savings rate contribution (0-50 points)
  if (savingsRate >= 20) score += 50;
  else if (savingsRate >= 15) score += 40;
  else if (savingsRate >= 10) score += 30;
  else if (savingsRate >= 5) score += 20;
  else if (savingsRate > 0) score += 10;
  
  // Expense control contribution (0-50 points)
  if (expenseRatio <= 0.5) score += 50;
  else if (expenseRatio <= 0.7) score += 40;
  else if (expenseRatio <= 0.85) score += 30;
  else if (expenseRatio <= 0.95) score += 20;
  else score += 10;
  
  return Math.min(100, Math.max(0, score));
}

function calculateMonthlyProgress(): number {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  return (currentDay / daysInMonth) * 100;
}

