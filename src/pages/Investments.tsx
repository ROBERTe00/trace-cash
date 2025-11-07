import { useState, useEffect, useMemo } from "react";
import { InvestmentTable } from "@/components/InvestmentTable";
import { InvestmentForm } from "@/components/InvestmentForm";
import { Investment } from "@/lib/storage";
import { useInvestments as useInvestmentsHook, Investment as InvestmentHook } from "@/hooks/useInvestments";
import { exportInvestmentReport, exportInvestmentCSV } from "@/lib/investmentExport";
import { toReturns, stdev, sharpe, maxDrawdown, annualizeVol } from "@/lib/risk";
import { useBenchmark, type BenchmarkId } from "@/hooks/useBenchmark";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import InvestmentsPremium from "./InvestmentsPremium";

// Map from hook Investment to storage Investment
const mapHookToStorage = (inv: InvestmentHook): Investment => ({
  id: inv.id,
  type: (inv.type === 'ETF' || inv.type === 'Crypto' || inv.type === 'Stock' || inv.type === 'Cash') 
    ? inv.type as Investment["type"]
    : 'Stock' as Investment["type"],
  name: inv.name,
  quantity: Number(inv.quantity),
  purchasePrice: Number(inv.purchase_price),
  currentPrice: Number(inv.current_price),
  symbol: inv.symbol || undefined,
  liveTracking: inv.live_tracking || false,
  purchaseDate: inv.purchase_date || undefined,
});

// Map from storage Investment to hook Investment format
const mapStorageToHook = (inv: Omit<Investment, "id">): Omit<InvestmentHook, 'id' | 'user_id' | 'created_at' | 'updated_at'> => ({
  name: inv.name,
  type: inv.type,
  category: inv.type, // Use type as category
  quantity: inv.quantity,
  purchase_price: inv.purchasePrice,
  current_price: inv.currentPrice,
  symbol: inv.symbol,
  live_tracking: inv.liveTracking || false,
  purchase_date: inv.purchaseDate,
});

export default function Investments() {
  console.log('[Investments] Component rendering...');
  
  const { 
    investments: hookInvestments = [], 
    isLoading = false, 
    createInvestment, 
    updateInvestment, 
    deleteInvestment,
    totalValue = 0,
    totalCost = 0,
    totalGain = 0,
    gainPercentage = 0
  } = useInvestmentsHook() || {};
  
  console.log('[Investments] Hook values:', { 
    investmentsCount: hookInvestments?.length || 0, 
    isLoading,
    hasCreateFn: !!createInvestment
  });
  
  const [filterType, setFilterType] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Benchmark/timeframe controls
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<BenchmarkId[]>(['SP500']);
  const [customBenchmarks, setCustomBenchmarks] = useState<string[]>([]);
  const [months, setMonths] = useState<number>(12);

  // Map hook investments to storage format for compatibility
  const investments = useMemo(() => {
    return (hookInvestments || []).map(mapHookToStorage);
  }, [hookInvestments]);

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setSheetOpen(true);
      navigate("/investments", { replace: true });
    }
  }, [searchParams, navigate]);

  const handleAddInvestment = async (investment: Omit<Investment, "id">) => {
    try {
      console.log('[Investments] Adding investment:', investment);
      const hookFormat = mapStorageToHook(investment);
      console.log('[Investments] Hook format:', hookFormat);
      console.log('[Investments] createInvestment function:', typeof createInvestment);
      const result = await createInvestment(hookFormat);
      console.log('[Investments] Investment created successfully:', result);
      // Reset filtro per mostrare sempre l'elemento appena creato
      setFilterType("all");
      setSheetOpen(false);
      // Toast viene emesso automaticamente da useInvestments.onSuccess
    } catch (error: any) {
      console.error('[Investments] Failed to add investment:', error);
      console.error('[Investments] Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      toast.error(`Errore nell'aggiunta dell'investimento: ${error?.message || 'Errore sconosciuto'}`);
      throw error; // Re-throw per permettere al form di gestire
    }
  };

  const handleDeleteInvestment = async (id: string) => {
    try {
      await deleteInvestment(id);
      toast.success("Investimento eliminato con successo!");
    } catch (error) {
      console.error('Failed to delete investment:', error);
      toast.error("Errore nell'eliminazione dell'investimento");
    }
  };

  const handleUpdateInvestmentPrice = async (id: string, newPrice: number) => {
    try {
      await updateInvestment({ id, current_price: newPrice });
      toast.success("Prezzo aggiornato con successo!");
    } catch (error) {
      console.error('Failed to update price:', error);
      toast.error("Errore nell'aggiornamento del prezzo");
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

  // Use values from hook with fallbacks
  const totalReturn = totalGain ?? 0;
  const returnPercentage = gainPercentage ?? 0;
  
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

  // Build realistic growth series (ultimi 12 mesi) interpolando dal prezzo di acquisto al prezzo attuale
  const premiumGrowth = useMemo(() => {
    const now = new Date();
    const points = Math.max(12, Math.min(months, 60));
    const timeline: Date[] = [];
    for (let i = points - 1; i >= 0; i--) {
      timeline.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    }
    const periodStart = timeline[0];

    const values = timeline.map((m) => {
      let pv = 0;
      investments.forEach((inv) => {
        const pd = inv.purchaseDate ? new Date(inv.purchaseDate) : null;
        const start = pd && pd < now ? pd : periodStart;
        if (m < start) return;
        const totalSpanMs = Math.max(1, now.getTime() - start.getTime());
        const elapsedMs = Math.min(Math.max(0, m.getTime() - start.getTime()), totalSpanMs);
        const t = totalSpanMs === 0 ? 1 : elapsedMs / totalSpanMs;
        const unit = inv.purchasePrice + (inv.currentPrice - inv.purchasePrice) * t;
        pv += unit * inv.quantity;
      });
      return Math.max(0, Math.round(pv));
    });
    return values;
  }, [investments, months]);

  const hasPortfolioData = useMemo(() => premiumGrowth.some(v => v > 0), [premiumGrowth]);

  // Benchmark realistico: normalizza a 100 e applica un tasso mensile medio (es. 0.7%)
  // Real benchmarks (supporta selezione multipla)
  const { series: benchSeries, loading: benchmarkLoading, error: benchmarkError } = useBenchmark({ ids: selectedBenchmarks, months, customSymbols: customBenchmarks });
  
  useEffect(() => {
    if (!benchmarkLoading) {
      try {
        console.log('[Benchmark]', benchSeries.map(s => ({ id: s.id, len: s.data.length, first: s.data[0] })));
      } catch {}
    }
  }, [benchmarkLoading, benchSeries, selectedBenchmarks]);
  
  // (debug logging rimosso)

  // Risk metrics from growth series
  const portfolioReturns = useMemo(() => toReturns(premiumGrowth), [premiumGrowth]);
  const volMonthly = useMemo(() => stdev(portfolioReturns), [portfolioReturns]);
  const volAnnual = useMemo(() => annualizeVol(volMonthly) * 100, [volMonthly]);
  const sharpeAnnual = useMemo(() => sharpe(portfolioReturns, 0.01), [portfolioReturns]);
  const mddPct = useMemo(() => maxDrawdown(premiumGrowth) * 100, [premiumGrowth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in safe-width">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">I Tuoi Investimenti</h1>
          <p className="text-gray-400">Gestisci il tuo portafoglio investimenti</p>
        </div>
        <Button onClick={() => setSheetOpen(true)} className="glass-card hover:bg-white/10">
          <Plus className="h-4 w-4 mr-2" />
          Aggiungi Investimento
        </Button>
      </div>

      {/* Premium Investments Layout (grafica HTML integrata) */}
      <InvestmentsPremium
        totalValue={totalValue ?? 0}
        totalReturn={totalReturn}
        annualReturnPct={returnPercentage}
        dividends={1245}
        allocation={premiumAllocation}
        growthSeries={premiumGrowth}
        benchmarkSeries={benchSeries}
        benchmarkLoading={benchmarkLoading}
        benchmarkError={benchmarkError}
        hasPortfolioData={hasPortfolioData}
        selectedBenchmarks={selectedBenchmarks}
        risk={{
          volatilityAnnualPct: Math.max(0, volAnnual),
          sharpeRatio: sharpeAnnual,
          maxDrawdownPct: mddPct,
        }}
        timeframeMonths={months}
        onTimeframeChange={setMonths}
        onBenchmarkChange={(ids) => setSelectedBenchmarks(ids as BenchmarkId[])}
        onAddClick={() => setSheetOpen(true)}
      />
      {/* Lista investimenti con live pricing (manteniamo API e tabella) */}
      <InvestmentTable 
        investments={filteredInvestments} 
        onDelete={handleDeleteInvestment}
        onUpdatePrice={handleUpdateInvestmentPrice}
      />

      {/* Investment Form Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Aggiungi Investimento</SheetTitle>
            <SheetDescription>
              Inserisci i dettagli del tuo investimento per tracciarlo nel portafoglio
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <InvestmentForm 
              onAdd={(investment) => {
                handleAddInvestment(investment);
              }} 
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
