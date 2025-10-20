/**
 * Enhanced Transaction List with Grouping
 * Groups transactions by date (Today, Yesterday, This Week, etc.)
 * Supports swipe actions on mobile and inline editing
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, ChevronRight } from "lucide-react";
import { Expense } from "@/lib/storage";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/contexts/AppContext";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";

interface EnhancedTransactionListProps {
  transactions: Expense[];
  onDelete: (id: string) => void;
  onEdit?: (transaction: Expense) => void;
}

// Category icons mapping
const categoryIcons: Record<string, string> = {
  'Food & Dining': '🍔',
  'Transportation': '🚗',
  'Shopping': '🛍️',
  'Entertainment': '🎵',
  'Healthcare': '⚕️',
  'Bills & Utilities': '📱',
  'Income': '💰',
  'Other': '📊',
};

// Category colors
const categoryColors: Record<string, string> = {
  'Food & Dining': 'bg-green-500/10 text-green-600 border-green-500/20',
  'Transportation': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'Shopping': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Entertainment': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Healthcare': 'bg-red-500/10 text-red-600 border-red-500/20',
  'Bills & Utilities': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  'Income': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'Other': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export const EnhancedTransactionList = ({
  transactions,
  onDelete,
  onEdit,
}: EnhancedTransactionListProps) => {
  const { formatCurrency } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group transactions by date category
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Expense[]> = {
      'Oggi': [],
      'Ieri': [],
      'Questa Settimana': [],
      'Questo Mese': [],
      'Più Vecchi': [],
    };

    transactions.forEach((t) => {
      const date = new Date(t.date);

      if (isToday(date)) {
        groups['Oggi'].push(t);
      } else if (isYesterday(date)) {
        groups['Ieri'].push(t);
      } else if (isThisWeek(date)) {
        groups['Questa Settimana'].push(t);
      } else if (isThisMonth(date)) {
        groups['Questo Mese'].push(t);
      } else {
        groups['Più Vecchi'].push(t);
      }
    });

    // Remove empty groups
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [transactions]);

  return (
    <Card className="p-6 glass-card border-2">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Transazioni Recenti</h3>
          <span className="text-sm text-muted-foreground">
            {transactions.length} {transactions.length === 1 ? 'transazione' : 'transazioni'}
          </span>
        </div>

        {/* Grouped Transactions */}
        <div className="space-y-6">
          <AnimatePresence>
            {groupedTransactions.map(([groupName, groupTransactions], groupIdx) => (
              <motion.div
                key={groupName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: groupIdx * 0.1 }}
                className="space-y-2"
              >
                {/* Group Header */}
                <h4 className="text-sm font-medium text-muted-foreground px-2">
                  {groupName}
                </h4>

                {/* Transactions in Group */}
                <div className="space-y-2">
                  {groupTransactions.map((transaction, idx) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                    >
                      <Card
                        className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                          expandedId === transaction.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setExpandedId(expandedId === transaction.id ? null : transaction.id)}
                      >
                        <div className="flex items-center justify-between">
                          {/* Left: Icon + Description */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="text-2xl flex-shrink-0">
                              {categoryIcons[transaction.category] || '📊'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{transaction.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${categoryColors[transaction.category] || ''}`}
                                >
                                  {transaction.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(transaction.date), 'dd MMM')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Amount */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-lg font-bold tabular-nums ${
                                transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {transaction.type === 'Income' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </span>
                            <ChevronRight
                              className={`h-4 w-4 text-muted-foreground transition-transform ${
                                expandedId === transaction.id ? 'rotate-90' : ''
                              }`}
                            />
                          </div>
                        </div>

                        {/* Expanded Actions */}
                        {expandedId === transaction.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t flex gap-2"
                          >
                            {onEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(transaction);
                                }}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Modifica
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Eliminare questa transazione?')) {
                                  onDelete(transaction.id);
                                }
                              }}
                              className="gap-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Elimina
                            </Button>
                          </motion.div>
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {transactions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">Nessuna transazione trovata</p>
            <p className="text-sm mt-2">Aggiungi una transazione o importa un estratto conto</p>
          </div>
        )}
      </div>
    </Card>
  );
};

// Export memoized version for performance
import { memo, useMemo } from "react";
export default memo(EnhancedTransactionList);

