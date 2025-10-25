import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Coffee, Home, Car, Heart, Smartphone } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Category {
  name: string;
  amount: number;
  percentage: number;
}

interface TopCategoriesWidgetProps {
  categories: Category[];
}

const categoryIcons: Record<string, any> = {
  "Shopping": ShoppingCart,
  "Food & Dining": Coffee,
  "Housing": Home,
  "Transportation": Car,
  "Healthcare": Heart,
  "Entertainment": Smartphone,
};

const categoryColors = [
  "bg-primary",
  "bg-success",
  "bg-orange-500",
  "bg-pink-500",
  "bg-purple-500",
  "bg-primary",
];

export const TopCategoriesWidget = ({ categories }: TopCategoriesWidgetProps) => {
  const topCategories = categories.slice(0, 6);

  return (
    <Card className="premium-card border-0">
      <CardHeader>
        <CardTitle className="text-card-title">Top Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topCategories.map((category, idx) => {
          const Icon = categoryIcons[category.name] || ShoppingCart;
          const colorClass = categoryColors[idx % categoryColors.length];

          return (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${colorClass} bg-opacity-20 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
                  </div>
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold">
                    ${category.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-success neon-text-green">
                    {category.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              <Progress 
                value={category.percentage} 
                className="h-2 bg-muted"
                indicatorClassName={colorClass}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
