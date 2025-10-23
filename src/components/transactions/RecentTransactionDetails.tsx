import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingBag, Coffee, Car, Calendar, Tag, FileText } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
}

interface RecentTransactionDetailsProps {
  transactions: Transaction[];
}

const categoryIcons: Record<string, any> = {
  Shopping: ShoppingBag,
  "Food & Dining": Coffee,
  Transport: Car,
};

export const RecentTransactionDetails = ({ transactions }: RecentTransactionDetailsProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const recentThree = transactions.slice(0, 3);

  return (
    <>
      <Card className="p-6 bg-card border-primary/20">
        <h3 className="text-xl font-semibold mb-4">Recent Details</h3>
        <div className="space-y-3">
          {recentThree.map((transaction) => {
            const Icon = categoryIcons[transaction.category] || ShoppingBag;
            return (
              <div
                key={transaction.id}
                onClick={() => setSelectedTransaction(transaction)}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-primary/10 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">{transaction.category}</p>
                  </div>
                </div>
                <p className="font-bold font-mono text-lg">${transaction.amount}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="sm:max-w-md bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-2xl">Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  {(() => {
                    const Icon = categoryIcons[selectedTransaction.category] || ShoppingBag;
                    return <Icon className="w-7 h-7 text-primary" />;
                  })()}
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold">{selectedTransaction.description}</p>
                  <p className="text-sm text-muted-foreground">{selectedTransaction.category}</p>
                </div>
                <p className="text-2xl font-bold font-mono text-primary">${selectedTransaction.amount}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{format(new Date(selectedTransaction.date), "PPP")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{selectedTransaction.category}</p>
                  </div>
                </div>

                {selectedTransaction.notes && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Notes</p>
                      <p className="font-medium">{selectedTransaction.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
