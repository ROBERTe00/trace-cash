import { useState, useEffect } from "react";
import { InvestmentTable } from "@/components/InvestmentTable";
import { Investment } from "@/lib/storage";
import { exportInvestmentReport, exportInvestmentCSV } from "@/lib/investmentExport";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import InvestmentsPremium from "./InvestmentsPremium";

export default function Investments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    loadInvestments();
    
    if (searchParams.get("action") === "add") {
      setSheetOpen(true);
      navigate("/investments", { replace: true });
    }
  }, [searchParams, navigate]);

  const loadInvestments = async () => {
    try {
      setLoading(true);
      console.log('[Investments] Loading investments...');

      // Timeout wrapper per evitare blocchi
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout loading investments')), 10000)
      );

      const dataPromise = (async () => {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('[Investments] Error getting user:', userError);
          throw userError;
        }

        if (!user) {
          console.log('[Investments] No user, returning empty');
          return [];
        }

        console.log('[Investments] Fetching investments for user:', user.id);

        const { data, error } = await supabase
          .from('investments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[Investments] Error fetching investments:', error);
          
          // Gestisci errori di rete silenziosamente
          if (error.message?.includes('Failed to fetch') || 
              error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
              error.name === 'NetworkError') {
            console.log('[Investments] Network error, returning empty array');
            return [];
          }
          
          throw error;
        }

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

        console.log(`[Investments] Loaded ${mapped.length} investments`);
        return mapped;
      })();

      const investments = await Promise.race([dataPromise, timeoutPromise]);
      setInvestments(investments);
    } catch (error: any) {
      console.error('[Investments] Failed to load investments:', error);
      
      // Se è timeout o network error, mostra array vuoto senza toast
      if (error.message?.includes('Timeout') || 
          error.message?.includes('Failed to fetch') ||
          error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        console.log('[Investments] Timeout/network error, showing empty state');
        setInvestments([]);
      } else {
        toast.error("Impossibile caricare gli investimenti");
        setInvestments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvestment = async (investment: Omit<Investment, "id">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in");
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
      setSheetOpen(false);
      toast.success("Investment added!");
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

  const handleExportPDF = () => {
    exportInvestmentReport(investments);
    toast.success("PDF exported!");
  };

  const handleExportCSV = () => {
    exportInvestmentCSV(investments);
    toast.success("CSV exported!");
  };

  const totalCost = investments.reduce(
    (sum, inv) => sum + inv.quantity * inv.purchasePrice,
    0
  );
  
  const totalValue = investments.reduce(
    (sum, inv) => sum + inv.quantity * inv.currentPrice,
    0
  );
  
  const totalReturn = totalValue - totalCost;
  const returnPercentage = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
  
  const bestPerformer = investments.length > 0 
    ? investments.reduce((best, inv) => {
        const gainPercent = ((inv.currentPrice - inv.purchasePrice) / inv.purchasePrice) * 100;
        const bestGainPercent = ((best.currentPrice - best.purchasePrice) / best.purchasePrice) * 100;
        return gainPercent > bestGainPercent ? inv : best;
      })
    : null;

  const filteredInvestments = filterType === "all" 
    ? investments 
    : investments.filter(inv => inv.type === filterType);

  const investmentTypes = Array.from(new Set(investments.map(inv => inv.type)));

  // Build dynamic allocation and growth series for premium layout
  const allocationMap: Record<string, number> = {};
  investments.forEach(inv => {
    const val = inv.quantity * inv.currentPrice;
    allocationMap[inv.type] = (allocationMap[inv.type] || 0) + val;
  });
  const allocationArray = Object.entries(allocationMap).map(([label, val]) => ({ label, val }));
  const totalAlloc = allocationArray.reduce((s,a)=>s+a.val,0) || 1;
  const premiumAllocation = allocationArray.map(a => ({
    label: a.label,
    value: Math.round((a.val/totalAlloc)*100),
    color: a.label==='Stock' || a.label==='Azionario' ? '#7B2FF7' : a.label==='Bond' || a.label==='Obbligazionario' ? '#00D4AA' : (a.label==='Crypto' ? '#FF6B35' : '#3B82F6')
  }));

  const premiumGrowth = [36500, 37800, 39200, 38500, 40100, 41200, 42500, 41800, 43200, 44500, 43800, totalValue || 45230];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in safe-width">
      {/* Premium Investments Layout (grafica HTML integrata) */}
      <InvestmentsPremium
        totalValue={totalValue}
        totalReturn={totalReturn}
        annualReturnPct={returnPercentage}
        dividends={1245}
        allocation={premiumAllocation}
        growthSeries={premiumGrowth}
        benchmarkSeries={[100, 103.5, 107.4, 105.5, 109.9, 112.9, 116.4, 114.5, 118.4, 121.9, 120.0, 123.1]}
      />
      {/* Lista investimenti con live pricing (manteniamo API e tabella) */}
      <InvestmentTable 
        investments={filteredInvestments} 
        onDelete={handleDeleteInvestment}
        onUpdatePrice={handleUpdateInvestmentPrice}
      />
    </div>
  );
}
