import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useApp } from "@/contexts/AppContext";
import { Info } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface CategorySpending {
  name: string;
  amount: number;
  budget: number;
  color: string;
}

interface SpendingsProgressCardProps {
  categories: CategorySpending[];
  totalSpent: number;
  totalBudget: number;
}

export const SpendingsProgressCard = ({ 
  categories, 
  totalSpent, 
  totalBudget 
}: SpendingsProgressCardProps) => {
  const { formatCurrency } = useApp();
  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Spese del Mese</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 hover:bg-muted rounded-full transition-colors">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Questa barra traccia le spese mensili per categoria rispetto al budget</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Totale Speso</span>
            <span className="font-medium">{formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}</span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(percentage, 100)}%`,
                background: percentage > 100 
                  ? 'hsl(var(--destructive))' 
                  : percentage > 80 
                  ? 'hsl(var(--warning))' 
                  : 'hsl(var(--success))'
              }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {percentage.toFixed(0)}% utilizzato
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-medium text-muted-foreground">Per Categoria</h4>
          {categories.slice(0, 4).map((category, index) => {
            const categoryPercent = category.budget > 0 
              ? (category.amount / category.budget) * 100 
              : 0;
            
            return (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {formatCurrency(category.amount)}
                  </span>
                </div>
                <Progress 
                  value={Math.min(categoryPercent, 100)} 
                  className="h-1.5"
                  style={{
                    // @ts-ignore
                    '--progress-background': category.color
                  }}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};