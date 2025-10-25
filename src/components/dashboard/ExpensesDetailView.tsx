import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, AlertTriangle, Target, ShoppingBag } from "lucide-react";

interface ExpensesDetailViewProps {
  totalExpenses: number;
  budget: number;
  expensesChange: number;
  monthlyTrend: { month: string; value: number }[];
  topCategories: { name: string; amount: number; percentage: number }[];
}

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export function ExpensesDetailView({
  totalExpenses,
  budget,
  expensesChange,
  monthlyTrend,
  topCategories
}: ExpensesDetailViewProps) {
  const budgetPercentage = budget > 0 ? (totalExpenses / budget) * 100 : 0;
  const budgetExceeded = totalExpenses > budget;

  return (
    <>
      {/* Trend Chart */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Trend Spese Mensili</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Budget Progress */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Budget Mensile</h3>
          <span className={`text-2xl font-bold font-mono ${budgetExceeded ? 'text-red-600' : 'text-green-600'}`}>
            €{totalExpenses.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <Progress 
          value={Math.min(budgetPercentage, 100)} 
          className={`h-3 mb-2 ${budgetExceeded ? 'bg-red-500/20' : ''}`} 
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {budgetExceeded ? 'Superato' : 'Rimanente'}: €{Math.abs(budget - totalExpenses).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </span>
          <span className={`font-medium ${budgetExceeded ? 'text-red-600' : 'text-green-600'}`}>
            {budgetPercentage.toFixed(1)}%
          </span>
        </div>
      </Card>

      {/* Top Categories */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Top Categorie di Spesa</h3>
        <div className="space-y-3">
          {topCategories.map((category, index) => (
            <div key={category.name} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate">{category.name}</p>
                  <p className="text-sm font-mono font-bold">
                    €{category.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Progress value={category.percentage} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

export function getExpensesInsights(props: ExpensesDetailViewProps) {
  const { totalExpenses, budget, expensesChange } = props;
  const budgetExceeded = totalExpenses > budget;
  const budgetPercentage = budget > 0 ? (totalExpenses / budget) * 100 : 0;

  return [
    {
      type: budgetExceeded ? 'error' as const : 'success' as const,
      text: budgetExceeded
        ? `⚠️ Hai superato il budget del ${(budgetPercentage - 100).toFixed(1)}%. Controlla le tue spese!`
        : `✅ Sei sotto il budget del ${(100 - budgetPercentage).toFixed(1)}%. Ottimo lavoro!`,
      icon: budgetExceeded ? AlertTriangle : Target
    },
    {
      type: expensesChange > 0 ? 'warning' as const : 'success' as const,
      text: expensesChange > 0
        ? `📈 Le tue spese sono aumentate del ${expensesChange.toFixed(1)}% rispetto al mese scorso.`
        : `📉 Le tue spese sono diminuite del ${Math.abs(expensesChange).toFixed(1)}% rispetto al mese scorso. Continua così!`,
      icon: TrendingUp
    }
  ];
}

