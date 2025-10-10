import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  Loader2,
  Save,
  X as XIcon
} from "lucide-react";
import { ParseResult } from "@/lib/csvParser";
import { Expense } from "@/lib/storage";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TransactionPreviewProps {
  parseResult: ParseResult;
  onConfirm: (transactions: Omit<Expense, "id">[]) => void;
  onCancel: () => void;
}

interface CategorizedTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  confidence?: number;
  isDuplicate?: boolean;
}

export const TransactionPreview = ({ parseResult, onConfirm, onCancel }: TransactionPreviewProps) => {
  const [transactions, setTransactions] = useState<CategorizedTransaction[]>([]);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [categorizationProgress, setCategorizationProgress] = useState(0);

  useEffect(() => {
    // Initialize transactions without categories
    const initial = parseResult.transactions.map(t => ({
      ...t,
      category: t.category || 'Other',
      isDuplicate: parseResult.duplicates.some(d => 
        d.date === t.date && d.description === t.description && d.amount === t.amount
      ),
    }));
    setTransactions(initial);
    
    // Auto-categorize if not already categorized
    if (initial.every(t => !t.category || t.category === 'Other')) {
      categorizeTransactions(initial);
    }
  }, [parseResult]);

  const categorizeTransactions = async (trans: CategorizedTransaction[]) => {
    setIsCategorizing(true);
    setCategorizationProgress(20);

    try {
      const toastId = toast.loading('AI is categorizing transactions...', {
        description: 'Analyzing descriptions and patterns'
      });

      setCategorizationProgress(40);

      const { data, error } = await supabase.functions.invoke('categorize-transactions', {
        body: { 
          transactions: trans.map(t => ({
            description: t.description,
            amount: t.amount,
            date: t.date,
          }))
        }
      });

      setCategorizationProgress(80);

      if (error) {
        console.error('Categorization error:', error);
        throw error;
      }

      const categorized = data.transactions || [];
      
      setTransactions(prev => prev.map((t, i) => ({
        ...t,
        category: categorized[i]?.category || 'Other',
        confidence: categorized[i]?.confidence || 50,
      })));

      setCategorizationProgress(100);
      toast.dismiss(toastId);
      toast.success('AI categorization complete!', {
        description: `${categorized.length} transactions categorized`,
        icon: <Sparkles className="h-4 w-4" />
      });

    } catch (error) {
      console.error('Categorization failed:', error);
      toast.error('Categorization failed', {
        description: 'Transactions set to "Other". You can edit them manually.'
      });
    } finally {
      setIsCategorizing(false);
      setCategorizationProgress(0);
    }
  };

  const updateTransaction = (index: number, field: keyof CategorizedTransaction, value: any) => {
    setTransactions(prev => prev.map((t, i) => 
      i === index ? { ...t, [field]: value } : t
    ));
  };

  const handleConfirm = () => {
    const validTransactions = transactions
      .filter(t => !t.isDuplicate)
      .map(t => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        category: t.category as Expense["category"],
        type: "Expense" as const,
        recurring: false,
      }));

    onConfirm(validTransactions);
  };

  const stats = {
    total: transactions.length,
    duplicates: transactions.filter(t => t.isDuplicate).length,
    valid: transactions.filter(t => !t.isDuplicate).length,
    byCategory: transactions.reduce((acc, t) => {
      if (!t.isDuplicate) {
        acc[t.category] = (acc[t.category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>),
    totalAmount: transactions
      .filter(t => !t.isDuplicate)
      .reduce((sum, t) => sum + t.amount, 0),
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
            {stats.valid} to import
          </Badge>
        </div>

        {isCategorizing && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm font-medium">AI Categorizing...</span>
            </div>
            <Progress value={categorizationProgress} className="h-2" />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.valid}</span>
            </div>
            <p className="text-xs text-muted-foreground">Valid Transactions</p>
          </div>

          {stats.duplicates > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-2xl font-bold">{stats.duplicates}</span>
              </div>
              <p className="text-xs text-muted-foreground">Duplicates Detected</p>
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
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow key={index} className={transaction.isDuplicate ? 'opacity-50' : ''}>
                  <TableCell>
                    <Input
                      type="date"
                      value={transaction.date}
                      onChange={(e) => updateTransaction(index, 'date', e.target.value)}
                      className="h-8 text-xs"
                      disabled={transaction.isDuplicate}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={transaction.description}
                      onChange={(e) => updateTransaction(index, 'description', e.target.value)}
                      className="h-8 text-xs"
                      disabled={transaction.isDuplicate}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      value={transaction.amount}
                      onChange={(e) => updateTransaction(index, 'amount', parseFloat(e.target.value))}
                      className="h-8 text-xs"
                      disabled={transaction.isDuplicate}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={transaction.category}
                      onValueChange={(value) => updateTransaction(index, 'category', value)}
                      disabled={transaction.isDuplicate}
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
                  <TableCell>
                    {transaction.isDuplicate ? (
                      <Badge variant="destructive" className="text-xs">
                        Duplicate
                      </Badge>
                    ) : transaction.confidence && transaction.confidence > 70 ? (
                      <Badge variant="default" className="text-xs">
                        {transaction.confidence}% confident
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Valid
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isCategorizing}>
          <XIcon className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={isCategorizing || stats.valid === 0}>
          <Save className="h-4 w-4 mr-2" />
          Import {stats.valid} Transactions
        </Button>
      </div>
    </div>
  );
};
