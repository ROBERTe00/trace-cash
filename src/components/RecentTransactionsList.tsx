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
  DollarSign,
  ChevronDown,
  Edit,
  X
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { useApp } from "@/contexts/AppContext";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

type SortOption = 'recent' | 'oldest' | 'expensive';

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
    'Housing': 'text-primary bg-primary/10',
    'Transportation': 'text-orange-600 bg-orange-500/10',
    'Food': 'text-green-600 bg-green-500/10',
    'Groceries': 'text-green-600 bg-green-500/10',
    'Rent': 'text-primary bg-primary/10',
    'Utilities': 'text-primary bg-primary/10',
  };
  return colorMap[category] || 'text-muted-foreground bg-muted';
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
  onViewAll,
  onEdit,
  onDelete
}: RecentTransactionsListProps) => {
  const { formatCurrency } = useApp();
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Sort transactions based on selected option
  const sortedTransactions = [...transactions].sort((a, b) => {
    switch (sortOption) {
      case 'recent':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'oldest':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'expensive':
        return Math.abs(b.amount) - Math.abs(a.amount);
      default:
        return 0;
    }
  });

  const displayTransactions = sortedTransactions.slice(0, maxItems);

  if (transactions.length === 0) {
    return (
      <Card className="border-0 shadow-lg rounded-3xl">
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
    <Card className="border-0 shadow-none bg-transparent p-0">
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-0">
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
        <div className="flex items-center gap-2">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                {sortOption === 'recent' && 'Più recenti'}
                {sortOption === 'oldest' && 'Più vecchie'}
                {sortOption === 'expensive' && 'Più costose'}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortOption('recent')}>
                Più recenti
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption('oldest')}>
                Più vecchie
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption('expensive')}>
                Più costose
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
        </div>
      </CardHeader>
      <CardContent className="space-y-1 px-0">
        {displayTransactions.map((transaction) => {
          const Icon = getCategoryIcon(transaction.category);
          const colorClass = getCategoryColor(transaction.category);
          const isIncome = transaction.type === 'Income';

          return (
            <div
              key={transaction.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors group border-0 relative"
              onMouseEnter={() => setHoveredId(transaction.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className={`p-2 rounded-xl flex items-center justify-center ${colorClass}`}>
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

              <div className="text-right flex-shrink-0 flex items-center gap-2">
                <p className={`text-sm font-semibold ${
                  isIncome ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                </p>
                
                {/* Action buttons - visible on hover */}
                {hoveredId === transaction.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-primary/10"
                        onClick={() => onEdit(transaction)}
                      >
                        <Edit className="w-3.5 h-3.5 text-primary" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-red-500/10"
                        onClick={() => onDelete(transaction.id)}
                      >
                        <X className="w-3.5 h-3.5 text-red-600" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
