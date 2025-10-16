import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useApp } from "@/contexts/AppContext";

interface CashflowData {
  day: string;
  income: number;
  expense: number;
}

interface CashflowCardProps {
  data: CashflowData[];
}

const CashflowCard = ({ data }: CashflowCardProps) => {
  const [view, setView] = useState<'income' | 'expense'>('income');
  const { formatCurrency } = useApp();

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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold truncate">Cashflow Overview</CardTitle>
            <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as 'income' | 'expense')}>
              <ToggleGroupItem value="income" className="text-xs">Income</ToggleGroupItem>
              <ToggleGroupItem value="expense" className="text-xs">Expense</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="day" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value: number) => [formatCurrency(value), view === 'income' ? 'Income' : 'Expense']}
              />
              <Area
                type="monotone"
                dataKey={view}
                stroke={view === 'income' ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                fillOpacity={1}
                fill={view === 'income' ? 'url(#colorIncome)' : 'url(#colorExpense)'}
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CashflowCard;
