/**
 * Enhanced Transaction Table
 * PDF-style columns: Date | Description | Outflow | Inflow | Balance | Category
 * Sortable headers, proper text alignments, inline actions
 */

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Edit, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Expense } from "@/lib/storage";
import { useApp } from "@/contexts/AppContext";

interface EnhancedTransactionTableProps {
  transactions: Expense[];
  onDelete: (id: string) => void;
  onEdit?: (transaction: Expense) => void;
}

type SortColumn = 'date' | 'description' | 'amount' | 'category';
type SortOrder = 'asc' | 'desc';

export const EnhancedTransactionTable = ({
  transactions,
  onDelete,
  onEdit,
}: EnhancedTransactionTableProps) => {
  const { formatCurrency } = useApp();
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Calculate running balance
  const transactionsWithBalance = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningBalance = 0;
    return sorted.map((t) => {
      const change = t.type === 'Income' ? t.amount : -t.amount;
      runningBalance += change;
      return { ...t, balance: runningBalance };
    });
  }, [transactions]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    const result = [...transactionsWithBalance];
    
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transactionsWithBalance, sortColumn, sortOrder]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  return (
    <Card className="p-6 glass-card border-2">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Transazioni</h3>
          <span className="text-sm text-muted-foreground">
            {transactions.length} {transactions.length === 1 ? 'transazione' : 'transazioni'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 min-w-[100px]"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Data
                    <SortIcon column="date" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 min-w-[200px]"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center">
                    Descrizione
                    <SortIcon column="description" />
                  </div>
                </TableHead>
                <TableHead className="text-right min-w-[120px]">
                  Denaro in Uscita
                </TableHead>
                <TableHead className="text-right min-w-[120px]">
                  Denaro in Entrata
                </TableHead>
                <TableHead className="text-right min-w-[100px]">
                  Saldo
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50 min-w-[140px]"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center">
                    Categoria
                    <SortIcon column="category" />
                  </div>
                </TableHead>
                <TableHead className="w-[100px]">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nessuna transazione trovata
                  </TableCell>
                </TableRow>
              ) : (
                sortedTransactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id} 
                    className="hover:bg-muted/50 transition-colors"
                  >
                    {/* Date */}
                    <TableCell className="text-left">
                      <span className="text-sm">
                        {new Date(transaction.date).toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </TableCell>

                    {/* Description */}
                    <TableCell className="text-left">
                      <span className="font-medium">{transaction.description}</span>
                    </TableCell>

                    {/* Outflow (Uscite) */}
                    <TableCell className="text-right tabular-nums">
                      {transaction.type === "Expense" ? (
                        <span className="text-red-600 font-semibold">
                          {formatCurrency(transaction.amount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Inflow (Entrate) */}
                    <TableCell className="text-right tabular-nums">
                      {transaction.type === "Income" ? (
                        <span className="text-green-600 font-semibold">
                          {formatCurrency(transaction.amount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Balance */}
                    <TableCell className="text-right tabular-nums">
                      <span className={`font-semibold ${transaction.balance >= 0 ? 'text-primary' : 'text-red-600'}`}>
                        {formatCurrency(transaction.balance)}
                      </span>
                    </TableCell>

                    {/* Category */}
                    <TableCell className="text-left">
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {transaction.category}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex gap-2 justify-end">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(transaction)}
                            title="Modifica"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Eliminare questa transazione?')) {
                              onDelete(transaction.id);
                            }
                          }}
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
};

