import { useState } from "react";
import { Expense } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Trash2, CreditCard, ShoppingBag, Home, Car, Utensils, Coffee, Gift, Plane, Heart, DollarSign, X } from "lucide-react";
import { format, isToday, isYesterday, startOfDay } from "date-fns";
import { it } from "date-fns/locale";

interface GroupedTransactionListProps {
  transactions: Expense[];
  onDelete: (id: string) => void;
}

interface GroupedTransaction {
  date: string;
  label: string;
  transactions: Expense[];
}

const categoryIcons: Record<string, any> = {
  "Shopping": ShoppingBag,
  "Housing": Home,
  "Transportation": Car,
  "Food": Utensils,
  "Dining": Coffee,
  "Entertainment": Gift,
  "Travel": Plane,
  "Healthcare": Heart,
  "Income": DollarSign,
  "Other": CreditCard,
};

const categoryColors: Record<string, string> = {
  "Shopping": "bg-purple-500",
  "Housing": "bg-primary",
  "Transportation": "bg-orange-500",
  "Food": "bg-green-500",
  "Dining": "bg-yellow-500",
  "Entertainment": "bg-pink-500",
  "Travel": "bg-primary",
  "Healthcare": "bg-red-500",
  "Income": "bg-green-500",
  "Other": "bg-muted",
};

// Componente per rendere una singola transazione
const TransactionItem = ({ 
  transaction, 
  getIcon, 
  getColor, 
  isHovered, 
  onMouseEnter, 
  onMouseLeave, 
  onDelete 
}: any) => {
  const Icon = getIcon(transaction.category);
  const colorClass = getColor(transaction.category);
  const isIncome = transaction.type === "Income";

  return (
    <div
      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors group relative border-0"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`w-7 h-7 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{transaction.description}</p>
        <p className="text-xs text-muted-foreground truncate">{transaction.category}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`font-bold text-sm ${isIncome ? "text-green-600" : "text-foreground"}`}>
          {isIncome ? "+" : "-"}€{transaction.amount.toFixed(2)}
        </p>
      </div>
      {isHovered && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(transaction.id)}
          className="h-7 w-7 opacity-100 transition-opacity"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      )}
    </div>
  );
};

export const GroupedTransactionList = ({ transactions, onDelete }: GroupedTransactionListProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const groupTransactionsByDate = (): GroupedTransaction[] => {
    const groups: Record<string, Expense[]> = {};

    transactions.forEach((transaction) => {
      const date = startOfDay(new Date(transaction.date)).toISOString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });

    return Object.entries(groups)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .map(([date, trans]) => {
        const dateObj = new Date(date);
        let label = "";

        if (isToday(dateObj)) {
          label = "Oggi";
        } else if (isYesterday(dateObj)) {
          label = "Ieri";
        } else {
          label = format(dateObj, "d MMMM", { locale: it });
        }

        return {
          date,
          label,
          transactions: trans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        };
      });
  };

  const groupedData = groupTransactionsByDate();

  const getIcon = (category: string) => {
    const Icon = categoryIcons[category] || categoryIcons["Other"];
    return Icon;
  };

  const getColor = (category: string) => {
    return categoryColors[category] || categoryColors["Other"];
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nessuna transazione ancora</p>
      </div>
    );
  }

  // Mostra solo le prime 7 transazioni
  const allTransactions = groupedData.flatMap(g => g.transactions);
  const MAX_ITEMS = 7;
  const displayTransactions = allTransactions.slice(0, MAX_ITEMS);
  const hasMore = allTransactions.length > MAX_ITEMS;

  // Re-group displayed transactions
  const visibleGroups = displayTransactions.reduce((groups, trans) => {
    const date = startOfDay(new Date(trans.date)).toISOString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(trans);
    return groups;
  }, {} as Record<string, Expense[]>);

  return (
    <>
      <div className="space-y-6">
        {Object.entries(visibleGroups).map(([date, trans]) => {
          const dateObj = new Date(date);
          let label = "";
          
          if (isToday(dateObj)) {
            label = "Oggi";
          } else if (isYesterday(dateObj)) {
            label = "Ieri";
          } else {
            label = format(dateObj, "d MMMM", { locale: it });
          }

          return (
            <div key={date} className="space-y-3">
              <div className="px-2 py-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
              </div>

              <div className="space-y-1">
                {trans.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    getIcon={getIcon}
                    getColor={getColor}
                    isHovered={hoveredId === transaction.id}
                    onMouseEnter={() => setHoveredId(transaction.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Mostra tutte button */}
        {hasMore && (
          <div className="pt-2">
            <Button
              variant="ghost"
              onClick={() => setDrawerOpen(true)}
              className="w-full text-primary hover:bg-primary/10"
            >
              Mostra tutte le {allTransactions.length} transazioni
            </Button>
          </div>
        )}
      </div>

      {/* Drawer con tutte le transazioni */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl">Tutte le Transazioni</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDrawerOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {groupedData.map((group) => (
              <div key={group.date} className="space-y-3">
                <div className="px-2 py-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {group.label}
                  </p>
                </div>

                <div className="space-y-1">
                  {group.transactions.map((transaction) => (
                    <TransactionItem
                      key={transaction.id}
                      transaction={transaction}
                      getIcon={getIcon}
                      getColor={getColor}
                      isHovered={hoveredId === transaction.id}
                      onMouseEnter={() => setHoveredId(transaction.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
