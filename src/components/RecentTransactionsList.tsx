import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Home, 
  Car, 
  Utensils, 
  MoreHorizontal,
  ArrowRight,
  DollarSign
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { useApp } from "@/contexts/AppContext";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'Income' | 'Expense';
}

interface RecentTransactionsListProps {
  transactions: Transaction[];
  maxItems?: number;
  onViewAll?: () => void;
}

const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, any> = {
    'Shopping': ShoppingCart,
    'Housing': Home,
    'Transportation': Car,
    'Food': Utensils,
    'Groceries': ShoppingCart,
    'Rent': Home,
    'Utilities': Home,
  };
  return iconMap[category] || MoreHorizontal;
};

const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    'Shopping': 'text-purple-600 bg-purple-500/10',
    'Housing': 'text-blue-600 bg-blue-500/10',
    'Transportation': 'text-orange-600 bg-orange-500/10',
    'Food': 'text-green-600 bg-green-500/10',
    'Groceries': 'text-emerald-600 bg-emerald-500/10',
    'Rent': 'text-indigo-600 bg-indigo-500/10',
    'Utilities': 'text-cyan-600 bg-cyan-500/10',
  };
  return colorMap[category] || 'text-gray-600 bg-gray-500/10';
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
};

export const RecentTransactionsList = ({ 
  transactions, 
  maxItems = 7,
  onViewAll 
}: RecentTransactionsListProps) => {
  const { formatCurrency } = useApp();
  const displayTransactions = transactions.slice(0, maxItems);

  if (transactions.length === 0) {
    return (
      <Card className="border-none shadow-lg rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add your first expense to start tracking
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
        {onViewAll && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onViewAll}
            className="text-primary hover:text-primary/80"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-1">
        {displayTransactions.map((transaction) => {
          const Icon = getCategoryIcon(transaction.category);
          const colorClass = getCategoryColor(transaction.category);
          const isIncome = transaction.type === 'Income';

          return (
            <div
              key={transaction.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors group"
            >
              <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {transaction.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {transaction.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(transaction.date)}
                  </span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-semibold ${
                  isIncome ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
