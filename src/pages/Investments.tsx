import { useState, useEffect } from "react";
import { InvestmentForm } from "@/components/InvestmentForm";
import { InvestmentTable } from "@/components/InvestmentTable";
import { PortfolioAnalysis } from "@/components/PortfolioAnalysis";
import { BrokerIntegration } from "@/components/BrokerIntegration";
import { PortfolioMetricsPanel } from "@/components/PortfolioMetricsPanel";
import { InvestmentScenarioSimulator } from "@/components/InvestmentScenarioSimulator";
import { InvestmentHero } from "@/components/InvestmentHero";
import { Investment } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, PieChart, BarChart3, Calculator, Upload as UploadIcon } from "lucide-react";
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
    <div className="space-y-6 animate-fade-in min-h-screen w-full max-w-7xl mx-auto pb-safe">
      {/* Hero Section with New Design */}
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger 
            value="portfolio" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5 gap-2"
          >
            <PieChart className="icon-button" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger 
            value="performance" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5 gap-2"
          >
            <BarChart3 className="icon-button" />
            Performance
          </TabsTrigger>
          <TabsTrigger 
            value="import" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5 gap-2"
          >
            <UploadIcon className="icon-button" />
            Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-6">
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

        <TabsContent value="performance" className="space-y-6">
          {/* Desktop: 2 columns, Mobile: 1 column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN: Metrics */}
            <div className="space-y-6">
              <PortfolioMetricsPanel investments={investments} />
            </div>
            
            {/* RIGHT COLUMN: Simulator */}
            <Card className="glass-card">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="icon-card text-primary" />
                  <h3 className="text-card-title">Scenario Simulator</h3>
                </div>
                <InvestmentScenarioSimulator />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
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
