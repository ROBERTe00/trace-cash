import { Card } from "@/components/ui/card";
import { ShoppingBag, Coffee, Car, Home, Utensils, MoreHorizontal } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  icon: string;
}

const iconMap: Record<string, any> = {
  shopping: ShoppingBag,
  food: Utensils,
  transport: Car,
  home: Home,
  coffee: Coffee,
  other: MoreHorizontal,
};

interface TopCategoriesWidgetProps {
  categories: CategoryData[];
}

export const TopCategoriesWidget = ({ categories }: TopCategoriesWidgetProps) => {
  return (
    <Card className="p-6 bg-card border-primary/20">
      <h3 className="text-xl font-semibold mb-4">Top Spending Categories</h3>
      <div className="space-y-4">
        {categories.map((category, idx) => {
          const Icon = iconMap[category.icon] || MoreHorizontal;
          return (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold font-mono">${category.amount.toLocaleString()}</p>
                  <p className="text-sm text-primary font-mono">{category.percentage}%</p>
                </div>
              </div>
              <Progress value={category.percentage} className="h-2" />
            </div>
          );
        })}
      </div>
    </Card>
  );
};
