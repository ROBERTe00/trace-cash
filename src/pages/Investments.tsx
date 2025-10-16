import { useState, useEffect } from "react";
import { InvestmentForm } from "@/components/InvestmentForm";
import { InvestmentTable } from "@/components/InvestmentTable";
import { PortfolioAnalysis } from "@/components/PortfolioAnalysis";
import { BrokerIntegration } from "@/components/BrokerIntegration";
import { PortfolioMetricsPanel } from "@/components/PortfolioMetricsPanel";
import { InvestmentScenarioSimulator } from "@/components/InvestmentScenarioSimulator";
import { Investment } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, FileSpreadsheet, Plus, PieChart, BarChart3, Calculator, Upload as UploadIcon, TrendingUp } from "lucide-react";
import { exportInvestmentReport, exportInvestmentCSV } from "@/lib/investmentExport";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useApp } from "@/contexts/AppContext";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function Investments() {
  const { t, formatCurrency } = useApp();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    loadInvestments();
    
    // Check if action=add query param exists
    if (searchParams.get("action") === "add") {
      setSheetOpen(true);
      // Remove the query param
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
      toast.error(t("loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvestment = async (investment: Omit<Investment, "id">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t("loginRequired"));
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
      toast.success(t("investmentAdded"));
    } catch (error) {
      console.error('Failed to add investment');
      toast.error(t("investmentFailed"));
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
      toast.success(t("investmentDeleted"));
    } catch (error) {
      console.error('Failed to delete investment');
      toast.error(t("investmentFailed"));
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
      toast.error(t("priceUpdateFailed"));
    }
  };

  const handleExportPDF = () => {
    exportInvestmentReport(investments);
    toast.success(t("exportSuccess"));
  };

  const handleExportCSV = () => {
    exportInvestmentCSV(investments);
    toast.success(t("exportSuccess"));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filter investments based on selected type
  const filteredInvestments = filterType === "all" 
    ? investments 
    : investments.filter(inv => inv.type === filterType);

  // Calculate portfolio stats
  const totalValue = investments.reduce((sum, inv) => sum + inv.quantity * inv.currentPrice, 0);
  const totalYield = investments.reduce((sum, inv) => {
    const initial = inv.quantity * inv.purchasePrice;
    const current = inv.quantity * inv.currentPrice;
    return sum + current - initial;
  }, 0);
  const yieldPercent = investments.length > 0
    ? (totalYield / investments.reduce((sum, inv) => sum + inv.quantity * inv.purchasePrice, 0)) * 100
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-8">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Left: Title + Subtitle */}
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                {t('investments.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('investments.subtitle')}
              </p>
            </div>
            
            {/* Right: Quick Stats Cards */}
            <div className="grid grid-cols-2 gap-4 md:w-auto">
              <Card className="p-4 bg-background/80 backdrop-blur">
                <p className="text-xs text-muted-foreground mb-1">
                  {t('investments.totalValue')}
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalValue)}
                </p>
              </Card>
              
              <Card className="p-4 bg-background/80 backdrop-blur">
                <p className="text-xs text-muted-foreground mb-1">
                  {t('investments.totalReturn')}
                </p>
                <p className={`text-2xl font-bold ${totalYield >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalYield >= 0 ? '+' : ''}{yieldPercent.toFixed(2)}%
                </p>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_70%)]" />
      </div>

      {/* Export Actions */}
      <div className="flex gap-2 justify-end">
        <Button onClick={handleExportCSV} variant="outline" size="sm">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {t('common.exportCSV')}
        </Button>
        <Button onClick={handleExportPDF} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {t('common.exportPDF')}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        {/* Pills-style tabs */}
        <TabsList className="inline-flex h-auto p-1 bg-muted/50 rounded-xl">
          <TabsTrigger 
            value="overview" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-6 py-2.5"
          >
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              {t('investments.overview')}
            </div>
          </TabsTrigger>
          
          <TabsTrigger 
            value="analytics" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-6 py-2.5"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('investments.analytics')}
            </div>
          </TabsTrigger>
          
          <TabsTrigger 
            value="simulator" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-6 py-2.5"
          >
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              {t('investments.simulator')}
            </div>
          </TabsTrigger>
          
          <TabsTrigger 
            value="import" 
            className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-6 py-2.5"
          >
            <div className="flex items-center gap-2">
              <UploadIcon className="h-4 w-4" />
              {t('investments.import')}
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6 min-h-[800px] transition-all duration-300">
          {/* Sheet drawer instead of Collapsible */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="default" size="lg" className="gap-2 w-full sm:w-auto">
                <Plus className="h-5 w-5" />
                {t('investments.quickAdd')}
              </Button>
            </SheetTrigger>
            
            <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t('investments.addNew')}</SheetTitle>
                <SheetDescription>
                  {t('investments.addNewDesc')}
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6">
                <InvestmentForm onAdd={handleAddInvestment} />
              </div>
            </SheetContent>
          </Sheet>

          {/* Filter Chips - Modern rounded-full style */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-sm font-medium text-muted-foreground shrink-0">
              {t('investments.filterBy')}
            </span>
            
            {['all', 'Stock', 'ETF', 'Crypto', 'Cash'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                  ${filterType === type 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'bg-muted hover:bg-muted/80'
                  }
                `}
              >
                {type === 'all' ? t('investments.all') : t(`investment.type${type}`)}
                <span className="ml-2 opacity-70">
                  ({type === 'all' ? investments.length : investments.filter(i => i.type === type).length})
                </span>
              </button>
            ))}
          </div>

          <PortfolioAnalysis investments={filteredInvestments} />
          <InvestmentTable investments={filteredInvestments} onDelete={handleDeleteInvestment} onUpdatePrice={handleUpdateInvestmentPrice} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6 min-h-[800px] transition-all duration-300">
          <PortfolioMetricsPanel investments={investments} />
        </TabsContent>

        <TabsContent value="simulator" className="space-y-6 mt-6 min-h-[800px] transition-all duration-300">
          <InvestmentScenarioSimulator />
        </TabsContent>

        <TabsContent value="import" className="space-y-6 mt-6 min-h-[800px] transition-all duration-300">
          <BrokerIntegration />
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
            <h3 className="font-semibold mb-2">🚀 {t('investments.comingSoon')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('investments.moreBrokers')}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
