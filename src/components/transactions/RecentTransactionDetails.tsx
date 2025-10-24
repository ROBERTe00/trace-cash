import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Calendar, Tag, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: "Income" | "Expense";
}

interface RecentTransactionDetailsProps {
  transactions: Transaction[];
}

export const RecentTransactionDetails = ({ transactions }: RecentTransactionDetailsProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const recentThree = transactions.slice(0, 3);

  return (
    <>
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="text-card-title">Recent Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentThree.map((transaction) => (
            <button
              key={transaction.id}
              onClick={() => setSelectedTransaction(transaction)}
              className="w-full p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 border border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-neon-purple text-left"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-xs text-muted-foreground">{transaction.category}</div>
                </div>
                <div className={`text-lg font-mono font-bold ${
                  transaction.type === "Income" ? "text-success neon-text-green" : "text-foreground"
                }`}>
                  {transaction.type === "Income" ? "+" : "-"}$
                  {transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="premium-card border-primary/30 max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Transaction Details</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedTransaction(null)}
                className="rounded-full hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6 pt-4">
              {/* Amount */}
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
                <div className="text-sm text-muted-foreground mb-2">Amount</div>
                <div className={`text-5xl font-mono font-bold ${
                  selectedTransaction.type === "Income" ? "text-success neon-text-green" : "text-foreground"
                }`}>
                  {selectedTransaction.type === "Income" ? "+" : "-"}$
                  {selectedTransaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
                  <Calendar className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="font-medium">
                      {format(new Date(selectedTransaction.date), "MMMM d, yyyy")}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
                  <Tag className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Category</div>
                    <div className="font-medium">{selectedTransaction.category}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
                  <FileText className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Description</div>
                    <div className="font-medium">{selectedTransaction.description}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
