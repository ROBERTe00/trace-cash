import { useState } from "react";
import { Expense } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Trash2, CreditCard, ShoppingBag, Home, Car, Utensils, Coffee, Gift, Plane, Heart, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  "Housing": "bg-blue-500",
  "Transportation": "bg-orange-500",
  "Food": "bg-green-500",
  "Dining": "bg-yellow-500",
  "Entertainment": "bg-pink-500",
  "Travel": "bg-cyan-500",
  "Healthcare": "bg-red-500",
  "Income": "bg-emerald-500",
  "Other": "bg-gray-500",
};

export const GroupedTransactionList = ({ transactions, onDelete }: GroupedTransactionListProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["today"]));

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
        let key = date;

        if (isToday(dateObj)) {
          label = "Oggi";
          key = "today";
        } else if (isYesterday(dateObj)) {
          label = "Ieri";
          key = "yesterday";
        } else {
          label = format(dateObj, "d MMMM", { locale: it });
          key = date;
        }

        return {
          date: key,
          label,
          transactions: trans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        };
      });
  };

  const groupedData = groupTransactionsByDate();

  const toggleGroup = (date: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const getIcon = (category: string) => {
    const Icon = categoryIcons[category] || categoryIcons["Other"];
    return Icon;
  };

  const getColor = (category: string) => {
    return categoryColors[category] || categoryColors["Other"];
  };

  if (transactions.length === 0) {
    return (
      <div className="modern-card text-center py-12">
        <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nessuna transazione ancora</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedData.map((group) => {
        const isExpanded = expandedGroups.has(group.date);
        const totalAmount = group.transactions.reduce((sum, t) => sum + (t.type === "Income" ? t.amount : -t.amount), 0);

        return (
          <motion.div
            key={group.date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="modern-card"
          >
            <button
              onClick={() => toggleGroup(group.date)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className="font-semibold text-base">{group.label}</p>
                  <p className="text-xs text-muted-foreground">{group.transactions.length} transazioni</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-base ${totalAmount >= 0 ? "text-success" : "text-foreground"}`}>
                  {totalAmount >= 0 ? "+" : ""}€{Math.abs(totalAmount).toFixed(2)}
                </p>
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t pt-2 space-y-2">
                    {group.transactions.map((transaction) => {
                      const Icon = getIcon(transaction.category);
                      const colorClass = getColor(transaction.category);
                      const isIncome = transaction.type === "Income";

                      return (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">{transaction.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <p className={`font-bold text-base ${isIncome ? "text-success" : "text-foreground"}`}>
                              {isIncome ? "+" : "-"}€{transaction.amount.toFixed(2)}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(transaction.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};
