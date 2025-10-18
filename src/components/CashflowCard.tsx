import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useApp } from "@/contexts/AppContext";
import { format, eachDayOfInterval, startOfMonth, subMonths, eachMonthOfInterval } from "date-fns";
import { Expense } from "@/hooks/useExpenses";

interface CashflowCardProps {
  expenses: Expense[];
  defaultTimeRange?: '7d' | '1m' | '3m' | '6m';
}

const CashflowCard = ({ expenses, defaultTimeRange = '7d' }: CashflowCardProps) => {
  const [timeRange, setTimeRange] = useState<'7d' | '1m' | '3m' | '6m'>(defaultTimeRange);
  const { formatCurrency } = useApp();

  const getCashflowData = (range: '7d' | '1m' | '3m' | '6m') => {
    const now = new Date();
    let intervals: Date[];
    let dateFormat: string;

    switch (range) {
      case '7d':
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6);
        intervals = eachDayOfInterval({ start: sevenDaysAgo, end: now });
        dateFormat = 'EEE';
        break;
      case '1m':
        intervals = eachDayOfInterval({ start: startOfMonth(now), end: now });
        dateFormat = 'MMM d';
        break;
      case '3m':
        intervals = eachMonthOfInterval({ start: subMonths(now, 2), end: now });
        dateFormat = 'MMM';
        break;
      case '6m':
        intervals = eachMonthOfInterval({ start: subMonths(now, 5), end: now });
        dateFormat = 'MMM';
        break;
    }

    return intervals.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const isMonthView = range === '3m' || range === '6m';

      let income = 0;
      let expense = 0;

      if (isMonthView) {
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        expenses.forEach(e => {
          const expDate = new Date(e.date);
          if (expDate >= monthStart && expDate <= monthEnd) {
            if (e.type === 'Income') income += e.amount;
            if (e.type === 'Expense') expense += e.amount;
          }
        });
      } else {
        expenses.forEach(e => {
          if (e.date === dateStr) {
            if (e.type === 'Income') income += e.amount;
            if (e.type === 'Expense') expense += e.amount;
          }
        });
      }

      return {
        day: format(date, dateFormat),
        income,
        expense,
        savings: income - expense
      };
    });
  };

  const data = getCashflowData(timeRange);

  const hasData = data.some(d => d.income > 0 || d.expense > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      whileHover={{ scale: 1.01, y: -4 }}
      className="h-full"
    >
      <Card className="h-full border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl bg-card overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold">Income vs Expenses</CardTitle>
            <div className="overflow-x-auto pb-1">
              <ToggleGroup 
                type="single" 
                value={timeRange} 
                onValueChange={(v) => v && setTimeRange(v as '7d' | '1m' | '3m' | '6m')}
                className="inline-flex"
              >
                <ToggleGroupItem value="7d" className="text-xs">7D</ToggleGroupItem>
                <ToggleGroupItem value="1m" className="text-xs">1M</ToggleGroupItem>
                <ToggleGroupItem value="3m" className="text-xs">3M</ToggleGroupItem>
                <ToggleGroupItem value="6m" className="text-xs">6M</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="h-[250px] flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">No data for this period</p>
                <p className="text-xs text-muted-foreground mt-1">Add transactions to see your cashflow</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="day" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number, name: string) => {
                    const label = name === 'income' ? 'Income' : name === 'expense' ? 'Expenses' : 'Net Savings';
                    return [formatCurrency(value), label];
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => {
                    if (value === 'income') return 'Income';
                    if (value === 'expense') return 'Expenses';
                    return value;
                  }}
                />
                <Bar 
                  dataKey="income" 
                  fill="hsl(var(--success))" 
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  dataKey="expense" 
                  fill="hsl(var(--destructive))" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CashflowCard;
