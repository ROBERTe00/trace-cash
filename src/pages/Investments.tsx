import { useState, useEffect } from "react";
import { InvestmentForm } from "@/components/InvestmentForm";
import { InvestmentTable } from "@/components/InvestmentTable";
import { PortfolioChart } from "@/components/PortfolioChart";
import { PortfolioAnalysis } from "@/components/PortfolioAnalysis";
import { BrokerIntegration } from "@/components/BrokerIntegration";
import { PortfolioMetricsPanel } from "@/components/PortfolioMetricsPanel";
import { InvestmentScenarioSimulator } from "@/components/InvestmentScenarioSimulator";
import { Investment } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Plus } from "lucide-react";
import { exportInvestmentReport, exportInvestmentCSV } from "@/lib/investmentExport";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

  const handleExportPDF = () => {
    exportInvestmentReport(investments);
    toast.success("Report exported successfully!");
  };

  const handleExportCSV = () => {
    exportInvestmentCSV(investments);
    toast.success("Data exported successfully!");
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold gradient-text">Investments</h1>
          <p className="text-muted-foreground">Advanced portfolio management and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="simulator">Simulator</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Collapsible defaultOpen={investments.length === 0}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between mb-4">
                <span className="flex items-center gap-2"><Plus className="h-4 w-4" />Quick Add</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mb-6">
              <InvestmentForm onAdd={handleAddInvestment} />
            </CollapsibleContent>
          </Collapsible>
          <PortfolioAnalysis investments={investments} />
          <PortfolioChart investments={investments} />
          <InvestmentTable investments={investments} onDelete={handleDeleteInvestment} onUpdatePrice={handleUpdateInvestmentPrice} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6 min-h-[400px]">
          <PortfolioMetricsPanel investments={investments} />
        </TabsContent>

        <TabsContent value="simulator" className="space-y-6 mt-6 min-h-[400px]">
          <InvestmentScenarioSimulator />
        </TabsContent>

        <TabsContent value="import" className="space-y-6 mt-6 min-h-[400px]">
          <BrokerIntegration />
          
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
            <h3 className="font-semibold mb-2">🚀 Coming Soon</h3>
            <p className="text-sm text-muted-foreground">
              More broker integrations including Interactive Brokers, Coinbase, and Binance
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
