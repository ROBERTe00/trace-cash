import { useState, useEffect } from "react";
import { InvestmentForm } from "@/components/InvestmentForm";
import { InvestmentTable } from "@/components/InvestmentTable";
import { PortfolioAnalysis } from "@/components/PortfolioAnalysis";
import { BrokerIntegration } from "@/components/BrokerIntegration";
import { PortfolioMetricsPanel } from "@/components/PortfolioMetricsPanel";
import { InvestmentScenarioSimulator } from "@/components/InvestmentScenarioSimulator";
import { InvestmentHero } from "@/components/InvestmentHero";
import { PerformanceMetrics } from "@/components/investments/PerformanceMetrics";
import { Investment } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, PieChart, BarChart3, Calculator, Upload as UploadIcon, PlusCircle } from "lucide-react";
import { exportInvestmentReport, exportInvestmentCSV } from "@/lib/investmentExport";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function Investments() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("portfolio");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in safe-width">
      {/* Hero Section */}
      <InvestmentHero
        totalValue={totalValue}
        totalGain={totalReturn}
        gainPercentage={returnPercentage}
        bestPerformer={
          bestPerformer
            ? {
                name: bestPerformer.name,
                gainPercent: ((bestPerformer.currentPrice - bestPerformer.purchasePrice) / bestPerformer.purchasePrice) * 100,
              }
            : undefined
        }
        onAddInvestment={() => setSheetOpen(true)}
        onImport={() => setActiveTab("import")}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
      />

      {/* 3 Tabs: Portfolio, Performance, Import */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-xl min-w-min">
            <TabsTrigger 
              value="portfolio" 
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 sm:px-6 py-2.5 gap-2 whitespace-nowrap"
            >
              <PieChart className="icon-button" />
              <span className="hidden sm:inline">Portfolio</span>
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 sm:px-6 py-2.5 gap-2 whitespace-nowrap"
            >
              <BarChart3 className="icon-button" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger 
              value="import" 
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 sm:px-6 py-2.5 gap-2 whitespace-nowrap"
            >
              <UploadIcon className="icon-button" />
              <span className="hidden sm:inline">Import</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="portfolio" className="space-y-4 sm:space-y-6">
          {investmentTypes.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
              >
                All Types
              </Button>
              {investmentTypes.map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          )}

          <PortfolioAnalysis investments={filteredInvestments} />
          <InvestmentTable 
            investments={filteredInvestments} 
            onDelete={handleDeleteInvestment}
            onUpdatePrice={handleUpdateInvestmentPrice}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 sm:space-y-6">
          {investments.length === 0 ? (
            <Card className="glass-card p-6 sm:p-8 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">No Performance Data Yet</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Add your first investment to see detailed performance metrics, risk analysis, and future projections.
                </p>
                <Button onClick={() => setSheetOpen(true)} className="mt-4 w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Investment
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <PerformanceMetrics
                projectedValue={Math.round(totalValue * 1.15)}
                totalContributions={totalCost}
                totalGains={totalReturn}
                taxLiability={Math.round(totalReturn * 0.15)}
              />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <div className="space-y-4 sm:space-y-6 order-1">
                  <PortfolioMetricsPanel investments={investments} />
                </div>
                
                <div className="order-2">
                  <Card className="glass-card">
                    <div className="p-4 sm:p-6">
                      <InvestmentScenarioSimulator />
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="import" className="space-y-4 sm:space-y-6">
          <BrokerIntegration />
        </TabsContent>
      </Tabs>

      {/* Add Investment Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Investment</SheetTitle>
            <SheetDescription>
              Fill in the details of your new investment
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <InvestmentForm
              onAdd={(investment) => {
                handleAddInvestment(investment);
                setSheetOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
