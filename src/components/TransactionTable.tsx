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
import { Trash2 } from "lucide-react";
import { Expense } from "@/lib/storage";

interface TransactionTableProps {
  transactions: Expense[];
  onDelete: (id: string) => void;
}

export const TransactionTable = ({
  transactions,
  onDelete,
}: TransactionTableProps) => {
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card className="modern-card">
      <h3 className="text-lg font-semibold mb-4">Transazioni Recenti</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Data & Descrizione</TableHead>
              <TableHead className="min-w-[120px]">Categoria</TableHead>
              <TableHead className="text-right min-w-[120px]">Importo</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  Nessuna transazione ancora
                </TableCell>
              </TableRow>
            ) : (
              sortedTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                      {transaction.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-bold text-base ${
                        transaction.type === "Income"
                          ? "text-success"
                          : "text-foreground"
                      }`}
                    >
                      {transaction.type === "Income" ? "+" : "-"}€
                      {transaction.amount.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};