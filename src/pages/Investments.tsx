import { useState, useEffect } from "react";
import { InvestmentForm } from "@/components/InvestmentForm";
import { InvestmentTable } from "@/components/InvestmentTable";
import { PortfolioChart } from "@/components/PortfolioChart";
import { PortfolioAnalysis } from "@/components/PortfolioAnalysis";
import { getInvestments, saveInvestments, Investment } from "@/lib/storage";
import { toast } from "sonner";

export default function Investments() {
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    setInvestments(getInvestments());
  }, []);

  const handleAddInvestment = (investment: Omit<Investment, "id">) => {
    const newInvestment = { ...investment, id: crypto.randomUUID() };
    const updated = [...investments, newInvestment];
    setInvestments(updated);
    saveInvestments(updated);
    toast.success("Investment added successfully!");
  };

  const handleDeleteInvestment = (id: string) => {
    const updated = investments.filter((i) => i.id !== id);
    setInvestments(updated);
    saveInvestments(updated);
    toast.success("Investment deleted");
  };

  const handleUpdateInvestmentPrice = (id: string, newPrice: number) => {
    const updated = investments.map((i) =>
      i.id === id ? { ...i, currentPrice: newPrice } : i
    );
    setInvestments(updated);
    saveInvestments(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Investments</h1>
          <p className="text-muted-foreground">Track your portfolio performance</p>
        </div>
      </div>

      <PortfolioAnalysis investments={investments} />

      <PortfolioChart investments={investments} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InvestmentForm onAdd={handleAddInvestment} />
        <div className="lg:col-span-1" />
      </div>

      <InvestmentTable
        investments={investments}
        onDelete={handleDeleteInvestment}
        onUpdatePrice={handleUpdateInvestmentPrice}
      />
    </div>
  );
}
