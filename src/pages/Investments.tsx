import { useState, useEffect } from "react";
import { InvestmentForm } from "@/components/InvestmentForm";
import { InvestmentTable } from "@/components/InvestmentTable";
import { PortfolioChart } from "@/components/PortfolioChart";
import { PortfolioAnalysis } from "@/components/PortfolioAnalysis";
import { Investment } from "@/lib/storage";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Investments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Investment[] = (data || []).map(inv => ({
        id: inv.id,
        type: inv.type as Investment["type"],
        name: inv.name,
        quantity: Number(inv.quantity),
        purchasePrice: Number(inv.purchase_price),
        currentPrice: Number(inv.current_price),
        symbol: inv.symbol || undefined,
        liveTracking: inv.live_tracking || false,
        purchaseDate: inv.purchase_date || undefined,
      }));

      setInvestments(mapped);
    } catch (error) {
      console.error('Failed to load investments');
      toast.error("Failed to load investments");
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvestment = async (investment: Omit<Investment, "id">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to add investments");
        return;
      }

      const { data, error } = await supabase
        .from('investments')
        .insert({
          user_id: user.id,
          type: investment.type,
          name: investment.name,
          quantity: investment.quantity,
          purchase_price: investment.purchasePrice,
          current_price: investment.currentPrice,
          symbol: investment.symbol,
          live_tracking: investment.liveTracking,
          purchase_date: investment.purchaseDate,
        })
        .select()
        .single();

      if (error) throw error;

      const newInv: Investment = {
        id: data.id,
        type: data.type as Investment["type"],
        name: data.name,
        quantity: Number(data.quantity),
        purchasePrice: Number(data.purchase_price),
        currentPrice: Number(data.current_price),
        symbol: data.symbol || undefined,
        liveTracking: data.live_tracking || false,
        purchaseDate: data.purchase_date || undefined,
      };

      setInvestments([newInv, ...investments]);
      toast.success("Investment added successfully!");
    } catch (error) {
      console.error('Failed to add investment');
      toast.error("Failed to add investment");
    }
  };

  const handleDeleteInvestment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInvestments(investments.filter((i) => i.id !== id));
      toast.success("Investment deleted");
    } catch (error) {
      console.error('Failed to delete investment');
      toast.error("Failed to delete investment");
    }
  };

  const handleUpdateInvestmentPrice = async (id: string, newPrice: number) => {
    try {
      const { error } = await supabase
        .from('investments')
        .update({ current_price: newPrice })
        .eq('id', id);

      if (error) throw error;

      setInvestments(investments.map((i) =>
        i.id === id ? { ...i, currentPrice: newPrice } : i
      ));
    } catch (error) {
      console.error('Failed to update price');
      toast.error("Failed to update price");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
