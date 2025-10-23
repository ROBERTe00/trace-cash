import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, ArrowDownLeft, Repeat, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickActionModals } from "./QuickActionModals";

export const RevolutBalanceCard = () => {
  const [activeModal, setActiveModal] = useState<'send' | 'request' | 'exchange' | 'topup' | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('dashboard-summary', {
        body: { date_range: '30d' }
      });
      if (error) throw error;
      return data;
    },
    staleTime: 300000,
  });

  if (isLoading) {
    return (
      <div className="revolut-card">
        <Skeleton className="h-8 w-48 mb-6 bg-white/20" />
        <Skeleton className="h-16 w-64 mb-8 bg-white/20" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-20 w-20 rounded-2xl bg-white/20" />
          ))}
        </div>
      </div>
    );
  }

  const balance = data?.summary?.balance_total || 0;

  const quickActions = [
    { icon: ArrowUpRight, label: "Send", color: "bg-black/20 hover:bg-black/30", action: 'send' as const },
    { icon: ArrowDownLeft, label: "Request", color: "bg-black/20 hover:bg-black/30", action: 'request' as const },
    { icon: Repeat, label: "Exchange", color: "bg-black/20 hover:bg-black/30", action: 'exchange' as const },
    { icon: Plus, label: "Top Up", color: "bg-black/20 hover:bg-black/30", action: 'topup' as const },
  ];

  return (
    <div className="revolut-card">
      <p className="text-sm font-medium opacity-90 mb-2">Available balance</p>
      <h2 className="text-5xl font-bold mb-8 font-mono">
        ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </h2>
      
      <div className="grid grid-cols-4 gap-4">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => setActiveModal(action.action)}
            className={`${action.color} rounded-2xl p-4 flex flex-col items-center gap-2 transition-all hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(139,0,255,0.3)] cursor-pointer`}
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <action.icon className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>
      
      <QuickActionModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
};
