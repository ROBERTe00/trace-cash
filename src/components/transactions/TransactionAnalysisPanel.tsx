import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Sparkles,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShoppingBag,
  Car,
  Home,
  Utensils,
  Gift,
  MoreHorizontal,
  Info,
  Repeat,
  TrendingUp as TrendingUpIcon,
  HelpCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Expense } from "@/lib/storage";
import {
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  ComposedChart,
  Bar
} from "recharts";
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TransactionAnalysisPanelProps {
  expenses: Expense[];
}

export function TransactionAnalysisPanel({ expenses }: TransactionAnalysisPanelProps) {
  // Calcoli statistiche
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() === currentMonth && 
           date.getFullYear() === currentYear &&
           e.type === "Expense";
  });

  const previousMonthExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return date.getMonth() === prevMonth && 
           date.getFullYear() === prevYear &&
           e.type === "Expense";
  });

  const totalCurrent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPrevious = previousMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const avgDailySpending = totalCurrent / new Date(currentYear, currentMonth, 0).getDate();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysRemaining = daysInMonth - new Date().getDate();
  const trend = totalCurrent > totalPrevious ? 'up' : 'down';
  const trendPercentage = totalPrevious > 0 ? Math.abs(((totalCurrent - totalPrevious) / totalPrevious) * 100) : 0;
  const budgetUsed = Math.min(100, (totalCurrent / 2000) * 100); // Esempio budget di 2000

  // Top 3 categorie
  const categoryTotals = currentMonthExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: (amount / totalCurrent) * 100
    }));

  // Calcola spese ricorrenti (simulazione)
  const recurringExpenses = currentMonthExpenses.filter(e => 
    ['Netflix', 'Gym', 'Spotify', 'Insurance'].some(s => e.description.includes(s))
  ).reduce((sum, e) => sum + e.amount, 0);

  // Pattern weekend vs feriali
  const weekdayExpenses = currentMonthExpenses.filter(e => {
    const day = new Date(e.date).getDay();
    return day >= 1 && day <= 5;
  }).reduce((sum, e) => sum + e.amount, 0);

  const weekendExpenses = currentMonthExpenses.filter(e => {
    const day = new Date(e.date).getDay();
    return day === 0 || day === 6;
  }).reduce((sum, e) => sum + e.amount, 0);

  const weekdayCount = currentMonthExpenses.filter(e => {
    const day = new Date(e.date).getDay();
    return day >= 1 && day <= 5;
  }).length;

  const weekendCount = currentMonthExpenses.filter(e => {
    const day = new Date(e.date).getDay();
    return day === 0 || day === 6;
  }).length;

  const weekdayAvg = weekdayCount > 0 ? weekdayExpenses / weekdayCount : 0;
  const weekendAvg = weekendCount > 0 ? weekendExpenses / weekendCount : 0;

  // Dati per grafico trend (ultimi 6 mesi)
  const getMonthsData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthYear = `${date.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })}`;
      
      const monthExpenses = expenses.filter(e => {
        const eDate = new Date(e.date);
        return eDate.getMonth() === date.getMonth() && 
               eDate.getFullYear() === date.getFullYear() &&
               e.type === "Expense";
      });

      months.push({
        month: monthYear,
        expenses: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
        income: expenses.filter(e => {
          const eDate = new Date(e.date);
          return eDate.getMonth() === date.getMonth() && 
                 eDate.getFullYear() === date.getFullYear() &&
                 e.type === "Income";
        }).reduce((sum, e) => sum + e.amount, 0)
      });
    }
    return months;
  };

  const trendData = getMonthsData();
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Dati per grafico categorie
  const categoriesData = Object.entries(categoryTotals)
    .map(([name, amount]) => ({
      name,
      value: amount,
      percentage: (amount / totalCurrent) * 100
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const getCategoryIcon = (name: string) => {
    const icons: Record<string, any> = {
      'Shopping': ShoppingBag,
      'Housing': Home,
      'Transportation': Car,
      'Food': Utensils,
      'Entertainment': Gift,
    };
    return icons[name] || MoreHorizontal;
  };

  const projectedEndOfMonth = avgDailySpending * daysInMonth;

  return (
    <div className="space-y-6">
      {/* OVERVIEW METRICS - 4 Cards con spiegazioni */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Spesa Media */}
        <Card className="p-6 border-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Spesa Media Giornaliera</p>
            <TooltipProvider>
              <ShadcnTooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Spesa totale divisa per i giorni del mese</p>
                </TooltipContent>
              </ShadcnTooltip>
            </TooltipProvider>
          </div>
          <p className="text-2xl font-bold">€{avgDailySpending.toFixed(2)}</p>
          <div className="mt-3 p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Come si calcola:</strong> Dividiamo il totale spese 
              del mese per i giorni trascorsi. Ti aiuta a capire quanto spendi in media ogni giorno.
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Proiezione fine mese: €{projectedEndOfMonth.toFixed(2)}
          </p>
        </Card>

        {/* Card 2: Trend */}
        <Card className="p-6 border-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Trend Mese</p>
            <TooltipProvider>
              <ShadcnTooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Confronto con il mese precedente</p>
                </TooltipContent>
              </ShadcnTooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            {trend === 'up' ? (
              <>
                <TrendingUp className="h-5 w-5 text-red-500" />
                <p className="text-2xl font-bold text-red-600">+{trendPercentage.toFixed(0)}%</p>
              </>
            ) : (
              <>
                <TrendingDown className="h-5 w-5 text-green-500" />
                <p className="text-2xl font-bold text-green-600">-{trendPercentage.toFixed(0)}%</p>
              </>
            )}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Cosa significa:</strong> 
              {trend === 'up' ? ' Le tue spese sono aumentate rispetto al mese scorso. Valuta di ridurre i costi nelle categorie più alte.' : ' Ottima gestione! Stai spendendo meno rispetto al mese precedente.'}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            vs mese precedente
          </p>
        </Card>

        {/* Card 3: Totale */}
        <Card className="p-6 border-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Totale Mese</p>
            <TooltipProvider>
              <ShadcnTooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Somma di tutte le spese del mese corrente</p>
                </TooltipContent>
              </ShadcnTooltip>
            </TooltipProvider>
          </div>
          <p className="text-2xl font-bold">€{totalCurrent.toFixed(2)}</p>
          <div className="mt-3 p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Cosa include:</strong> Tutte le spese registrate 
              questo mese. Controlla i grafici sotto per vedere la distribuzione per categoria.
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {currentMonthExpenses.length} transazioni
          </p>
        </Card>

        {/* Card 4: Budget */}
        <Card className="p-6 border-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Budget Utilizzato</p>
            <TooltipProvider>
              <ShadcnTooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Percentuale del budget mensile utilizzato</p>
                </TooltipContent>
              </ShadcnTooltip>
            </TooltipProvider>
          </div>
          <p className="text-2xl font-bold">{budgetUsed.toFixed(0)}%</p>
          <div className="mt-2">
            <Progress value={budgetUsed} className="h-2" />
          </div>
          <div className="mt-3 p-3 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Come funziona:</strong> Il budget ti aiuta a 
              pianificare le spese. Se superi l'80%, riceverai un alert. Ricorda: un budget 
              realistico è fondamentale per il successo finanziario.
            </p>
          </div>
        </Card>
      </div>

      {/* Sezione Pattern & Insights Rapidi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pattern Weekend */}
        <Card className="p-5 border-0">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">Pattern Settimanale</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm">Weekend</span>
              </div>
              <p className="text-sm font-bold">€{(weekendAvg * weekendCount).toFixed(2)}</p>
            </div>
            <Progress value={(weekendExpenses / (weekendExpenses + weekdayExpenses)) * 100} className="h-2" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                <span className="text-sm">Giorni Feriali</span>
              </div>
              <p className="text-sm font-bold">€{weekdayExpenses.toFixed(2)}</p>
            </div>
            <Progress value={(weekdayExpenses / (weekendExpenses + weekdayExpenses)) * 100} className="h-2" />
          </div>
          
          {weekendAvg > weekdayAvg && (
            <div className="mt-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                💡 <strong>Insight:</strong> Spendi il {(weekendAvg/weekdayAvg*100).toFixed(0)}% in più 
                nei weekend. Valuta di pianificare attività gratuite per risparmiare.
              </p>
            </div>
          )}
        </Card>

        {/* Spese Ricorrenti */}
        <Card className="p-5 border-0">
          <div className="flex items-center gap-2 mb-3">
            <Repeat className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">Spese Ricorrenti Mensili</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Totale ricorrente/mese</span>
              <p className="text-lg font-bold">€{recurringExpenses > 0 ? recurringExpenses.toFixed(2) : '0.00'}</p>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Cosa sono:</strong> Costi fissi mensili come 
                abbonamenti, affitto, palestra. Questi sono i primi da pagare ogni mese 
                e influenzano direttamente il tuo budget disponibile.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">
            <TrendingUpIcon className="h-4 w-4 mr-2" />
            Trend
          </TabsTrigger>
          <TabsTrigger value="categories">
            <PieChart className="h-4 w-4 mr-2" />
            Categorie
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Sparkles className="h-4 w-4 mr-2" />
            Insights AI
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Trend Chart */}
        <TabsContent value="trends" className="space-y-4">
          <Card className="p-6 border-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Spese ultimi 6 mesi</h3>
              <TooltipProvider>
                <ShadcnTooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Come leggere
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <div className="text-xs space-y-2">
                      <p><strong className="text-red-600">Barre rosse</strong> = Uscite mensili</p>
                      <p><strong className="text-green-600">Linea verde</strong> = Entrate mensili</p>
                      <p className="text-muted-foreground">Confronta i pattern per identificare mesi 
                        con spese anomale e tendenze di crescita o riduzione.</p>
                    </div>
                  </TooltipContent>
                </ShadcnTooltip>
              </TooltipProvider>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px'
                  }}
                />
                <Legend />
                <Bar dataKey="expenses" fill="#ef4444" name="Uscite" radius={[8, 8, 0, 0]} />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Entrate" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>

          {/* Comparison Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 border-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-muted-foreground">Mese Precedente</p>
                  <p className="text-3xl font-bold">€{totalPrevious.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
              <Badge variant="outline" className="w-fit">
                {previousMonthExpenses.length} transazioni
              </Badge>
            </Card>

            <Card className="p-6 border-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-muted-foreground">Mese Corrente</p>
                  <p className="text-3xl font-bold">€{totalCurrent.toFixed(2)}</p>
                </div>
                <div className={`p-3 rounded-xl ${trend === 'up' ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                  {trend === 'up' ? (
                    <ArrowUpRight className="h-6 w-6 text-red-500" />
                  ) : (
                    <ArrowDownRight className="h-6 w-6 text-green-500" />
                  )}
                </div>
              </div>
              <Badge variant="outline" className="w-fit">
                {currentMonthExpenses.length} transazioni
              </Badge>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Categories */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Donut Chart */}
            <Card className="p-6 border-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Breakdown Categorie</h3>
                <TooltipProvider>
                  <ShadcnTooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p className="text-xs text-muted-foreground">
                        Questo grafico mostra come si distribuiscono le tue spese tra le diverse categorie.
                        Identifica le aree dove spendi di più per ottimizzare il budget.
                      </p>
                    </TooltipContent>
                  </ShadcnTooltip>
                </TooltipProvider>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={categoriesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `€${value.toFixed(2)}`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div className="mt-4 space-y-2">
                {categoriesData.map((category, index) => {
                  const Icon = getCategoryIcon(category.name);
                  return (
                    <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">€{category.value.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Top 3 Categories */}
            <Card className="p-6 border-0">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Top 3 Categorie</h3>
                <TooltipProvider>
                  <ShadcnTooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Le categorie dove spendi di più questo mese</p>
                    </TooltipContent>
                  </ShadcnTooltip>
                </TooltipProvider>
              </div>
              
              <div className="space-y-4">
                {topCategories.map((category, index) => {
                  const Icon = getCategoryIcon(category.name);
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{category.name}</p>
                            <p className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}% del totale</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold">€{category.amount.toFixed(0)}</p>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                      
                      {category.percentage > 30 && (
                        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <p className="text-xs text-orange-700 dark:text-orange-400">
                            ⚠️ Questa categoria supera il 30% del budget. Considera di ridurre le spese.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: AI Insights */}
        <TabsContent value="insights" className="space-y-4">
          <Card className="p-6 border-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Insight AI
              </h3>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Concetto Budget */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1">Come funziona il Budget</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Il budget ti aiuta a pianificare le spese. Quando una categoria supera il 30% 
                      del totale, potrebbe essere un segnale per rivedere le tue priorità. 
                      <strong className="text-foreground"> Esempio:</strong> Se spendi €1200/mese 
                      e €360+ sono in una sola categoria, considerala una "red flag" per il budget.
                    </p>
                  </div>
                </div>
              </div>

              {/* Alert Budget */}
              {topCategories[0] && topCategories[0].percentage > 30 && (
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-1 flex items-center gap-2">
                        {topCategories[0].name} supera il budget
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Stai spendendo il {topCategories[0].percentage.toFixed(0)}% del tuo budget in {topCategories[0].name}.
                        Considera di ridurre €{(topCategories[0].amount * 0.1).toFixed(2)} per bilanciare.
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Suggerimenti per ridurre
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {trend === 'down' && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-1">Ottimo lavoro! 🎉</p>
                      <p className="text-xs text-muted-foreground">
                        Hai risparmiato €{(totalPrevious - totalCurrent).toFixed(2)} rispetto al mese scorso.
                        Continua così! Questo significa che le tue abitudini di spesa stanno migliorando.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pratico AI Suggestion */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1 flex items-center gap-2">
                      💡 Suggerimento Pratico
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Basato sui tuoi dati: la tua spesa media giornaliera è di €{avgDailySpending.toFixed(2)}. 
                      Se risparmi solo €{Math.floor(avgDailySpending * 0.1)} ogni giorno per il resto del mese 
                      (nei prossimi {daysRemaining} giorni), avrai €{(avgDailySpending * 0.1 * daysRemaining).toFixed(2)} extra 
                      da investire o accantonare. Piccole azioni, grandi risultati! 🎯
                    </p>
                  </div>
                </div>
              </div>

              {/* Educational: Come interpretare i grafici */}
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-xs font-medium mb-3 flex items-center gap-2">
                  📊 Cosa guardano gli esperti quando analizzano i trend?
                </p>
                <ul className="text-xs text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Stabilità:</strong> Un trend costante è più sostenibile a lungo termine</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Crescita graduale:</strong> Crescita dell'1-3% è normale (inflazione)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Picchi improvvisi:</strong> Indica eventi straordinari da pianificare</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                    <span><strong className="text-foreground">Riduzioni:</strong> Monitora nei prossimi mesi per confermare il pattern</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
