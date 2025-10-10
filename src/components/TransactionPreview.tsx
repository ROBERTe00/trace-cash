import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  TrendingUp, 
  Save,
  X as XIcon,
  AlertTriangle
} from "lucide-react";
import { Expense } from "@/lib/storage";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  category?: string;
}

interface ParseResult {
  transactions: ParsedTransaction[];
  errors: string[];
  stats: {
    total: number;
    valid: number;
    invalid: number;
  };
}

interface TransactionPreviewProps {
  parseResult: ParseResult;
  onConfirm: (transactions: Omit<Expense, "id">[]) => void;
  onCancel: () => void;
}

export const TransactionPreview = ({ parseResult, onConfirm, onCancel }: TransactionPreviewProps) => {
  const [transactions, setTransactions] = useState(parseResult.transactions);

  const updateTransaction = (index: number, field: keyof ParsedTransaction, value: any) => {
    setTransactions(prev => prev.map((t, i) => 
      i === index ? { ...t, [field]: value } : t
    ));
  };

  const handleConfirm = () => {
    const validTransactions = transactions.map(t => ({
      date: t.date,
      description: t.description,
      amount: t.amount,
      category: (t.category || 'Other') as Expense["category"],
      type: "Expense" as const,
      recurring: false,
    }));

    onConfirm(validTransactions);
  };

  const stats = {
    total: transactions.length,
    byCategory: transactions.reduce((acc, t) => {
      const cat = t.category || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
  };

  return (
    <div className="space-y-4">
      {/* Statistics Panel */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Transaction Preview
          </h3>
          <Badge variant="outline" className="text-sm">
            {stats.total} to import
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-xs text-muted-foreground">Valid Transactions</p>
          </div>

          {parseResult.stats.invalid > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-2xl font-bold">{parseResult.stats.invalid}</span>
              </div>
              <p className="text-xs text-muted-foreground">Parsing Errors</p>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">€{stats.totalAmount.toFixed(0)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total Amount</p>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap gap-1">
              {Object.entries(stats.byCategory).slice(0, 3).map(([cat, count]) => (
                <Badge key={cat} variant="secondary" className="text-xs">
                  {cat} ({count})
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Top Categories</p>
          </div>
        </div>

        {parseResult.errors.length > 0 && (
          <Alert className="mt-4" variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-1">Parsing Errors ({parseResult.errors.length})</p>
              <ScrollArea className="h-20">
                <ul className="text-xs space-y-0.5">
                  {parseResult.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                  {parseResult.errors.length > 5 && (
                    <li className="text-muted-foreground">...and {parseResult.errors.length - 5} more</li>
                  )}
                </ul>
              </ScrollArea>
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Transaction Table */}
      <Card className="glass-card p-6">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[120px]">Amount</TableHead>
                <TableHead className="w-[150px]">Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      type="date"
                      value={transaction.date}
                      onChange={(e) => updateTransaction(index, 'date', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={transaction.description}
                      onChange={(e) => updateTransaction(index, 'description', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={transaction.amount}
                      onChange={(e) => updateTransaction(index, 'amount', parseFloat(e.target.value))}
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={transaction.category || 'Other'}
                      onValueChange={(value) => updateTransaction(index, 'category', value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Food">Food</SelectItem>
                        <SelectItem value="Transport">Transport</SelectItem>
                        <SelectItem value="Entertainment">Entertainment</SelectItem>
                        <SelectItem value="Rent">Rent</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          <XIcon className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={stats.total === 0}>
          <Save className="h-4 w-4 mr-2" />
          Import {stats.total} Transactions
        </Button>
      </div>
    </div>
  );
};
