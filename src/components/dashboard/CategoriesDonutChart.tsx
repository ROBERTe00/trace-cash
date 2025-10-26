import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShoppingCart, 
  Home, 
  Car, 
  Utensils, 
  Film,
  Gift,
  Droplet,
  MoreHorizontal
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = [
  'hsl(262, 83%, 58%)', // purple (primary Revolut)
  'hsl(142, 76%, 36%)', // green
  'hsl(38, 92%, 50%)',  // orange
  'hsl(0, 84%, 60%)',   // red
];

// Map main categories to icons (solo macrocategorie)
const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, any> = {
    'Shopping': ShoppingCart,
    'Housing': Home,
    'Rent': Home,
    'Transportation': Car,
    'Food': Utensils,
    'Entertainment': Film,
    'Investment': Gift,
    'Utilities': Droplet,
    'Other': MoreHorizontal,
  };
  return iconMap[category] || MoreHorizontal;
};

export const CategoriesDonutChart = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('dashboard-categories', {
        body: {}
      });
      if (error) throw error;
      return data;
    },
    staleTime: 300000,
  });

  if (isLoading) {
    return (
      <Card className="modern-card p-6 border-0">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </Card>
    );
  }

  const categories = data?.categories || [];
  
  // Filtra solo categorie con % > 0
  const activeCategories = categories.filter((cat: any) => cat.percentage > 0);
  // Ordina per percentuale decrescente
  const sortedCategories = activeCategories.sort((a: any, b: any) => b.percentage - a.percentage);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-primary font-medium">€{payload[0].value.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">{payload[0].payload.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="modern-card p-6 border-0">
      <h3 className="text-lg font-semibold mb-6">Spending by Category</h3>
      
      {/* Donut Chart centrato */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={sortedCategories}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              fill="#8884d8"
              paddingAngle={2}
              dataKey="amount"
              stroke="none"
            >
              {sortedCategories.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda sotto il chart - Lista verticale */}
      <div className="space-y-2">
        {sortedCategories.map((category: any, index: number) => {
          const Icon = getCategoryIcon(category.name || category.value);
          const color = COLORS[index % COLORS.length];
          
          return (
            <div 
              key={index}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-all cursor-pointer group border border-border/30"
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                style={{ backgroundColor: color + '15' }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-semibold">{category.name || category.value}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs font-medium text-muted-foreground">{category.percentage.toFixed(1)}%</p>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs font-semibold">€{category.amount.toFixed(0)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
