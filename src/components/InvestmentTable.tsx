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
import { Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Investment } from "@/lib/storage";

interface InvestmentTableProps {
  investments: Investment[];
  onDelete: (id: string) => void;
}

export const InvestmentTable = ({
  investments,
  onDelete,
}: InvestmentTableProps) => {
  const calculateYield = (investment: Investment) => {
    const initial = investment.quantity * investment.purchasePrice;
    const current = investment.quantity * investment.currentPrice;
    return ((current - initial) / initial) * 100;
  };

  return (
    <Card className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Investment Portfolio</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Purchase Price</TableHead>
              <TableHead className="text-right">Current Price</TableHead>
              <TableHead className="text-right">Initial Value</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">Yield %</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground"
                >
                  No investments yet
                </TableCell>
              </TableRow>
            ) : (
              investments.map((investment) => {
                const initialValue = investment.quantity * investment.purchasePrice;
                const currentValue = investment.quantity * investment.currentPrice;
                const yieldPercent = calculateYield(investment);
                const isPositive = yieldPercent >= 0;

                return (
                  <TableRow key={investment.id}>
                    <TableCell>{investment.category}</TableCell>
                    <TableCell className="font-medium">
                      {investment.name}
                    </TableCell>
                    <TableCell className="text-right">
                      {investment.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      €{investment.purchasePrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      €{investment.currentPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      €{initialValue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      €{currentValue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className={`flex items-center justify-end gap-1 ${
                          isPositive ? "text-success" : "text-destructive"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {yieldPercent.toFixed(2)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(investment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};