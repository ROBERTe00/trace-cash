import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/AppContext";
import { Wallet, TrendingUp, TrendingDown, DollarSign, Edit } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  cash_available: number;
  monthly_income: number;
  income_sources: any[];
  assets: any[];
  debts: any[];
  onboarding_completed: boolean;
}

export const FinancialProfile = () => {
  const { formatCurrency } = useApp();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error("Errore caricamento profilo:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card p-6">
        <div className="h-32 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Card>
    );
  }

  if (!profile || !profile.onboarding_completed) {
    return null;
  }

  const totalAssets = (profile.assets || []).reduce((sum: number, asset: any) => sum + (asset.value || 0), 0);
  const totalDebts = (profile.debts || []).reduce((sum: number, debt: any) => sum + (debt.amount || 0), 0);
  const netWorth = (profile.cash_available || 0) + totalAssets - totalDebts;
  const isPositive = netWorth >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Net Worth */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Patrimonio Netto</p>
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        <p className={`text-2xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {formatCurrency(netWorth)}
        </p>
      </Card>

      {/* Cash Available */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Liquidità</p>
          <Wallet className="h-4 w-4 text-blue-500" />
        </div>
        <p className="text-2xl font-bold">
          {formatCurrency(profile.cash_available || 0)}
        </p>
      </Card>

      {/* Monthly Income */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Reddito Mensile</p>
          <DollarSign className="h-4 w-4 text-green-500" />
        </div>
        <p className="text-2xl font-bold">
          {formatCurrency(profile.monthly_income || 0)}
        </p>
      </Card>

      {/* Assets & Debts */}
      <Card className="glass-card p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Asset Totali</p>
            <p className="text-lg font-semibold text-blue-500">
              {formatCurrency(totalAssets)}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Debiti Totali</p>
            <p className="text-lg font-semibold text-red-500">
              {formatCurrency(totalDebts)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
