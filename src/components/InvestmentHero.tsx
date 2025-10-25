import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/animated/AnimatedNumber";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  TrendUp as PhosphorTrendingUp, 
  TrendDown as PhosphorTrendingDown, 
  Plus as PhosphorPlus, 
  Upload as PhosphorUpload, 
  Download as PhosphorDownload, 
  CaretDown as PhosphorCaretDown, 
  Trophy as PhosphorTrophy 
} from "phosphor-react";
import { useApp } from "@/contexts/AppContext";

interface InvestmentHeroProps {
  totalValue: number;
  totalGain: number;
  gainPercentage: number;
  bestPerformer?: {
    name: string;
    gainPercent: number;
  };
  onAddInvestment: () => void;
  onImport: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
}

export function InvestmentHero({
  totalValue,
  totalGain,
  gainPercentage,
  bestPerformer,
  onAddInvestment,
  onImport,
  onExportPDF,
  onExportCSV,
}: InvestmentHeroProps) {
  const { formatCurrency } = useApp();
  const isPositive = totalGain >= 0;

  return (
    <GlassCard variant="hero" glow className="overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      <GlassCardContent className="p-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Total Portfolio Value */}
          <div className="lg:col-span-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">Total Portfolio Value</p>
            <h2 className="text-large-number gradient-text mb-3 font-display">
              <AnimatedNumber 
                value={totalValue} 
                prefix="€" 
                decimals={2}
                className="text-large-number"
              />
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex items-center gap-2 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? <PhosphorTrendingUp size={24} weight="bold" /> : <PhosphorTrendingDown size={24} weight="bold" />}
                <span className="text-medium-number font-bold font-mono">
                  {isPositive ? '+' : ''}{formatCurrency(totalGain)}
                </span>
              </div>
              <Badge className={isPositive ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                {isPositive ? '+' : ''}{gainPercentage.toFixed(2)}%
              </Badge>
            </div>

            {bestPerformer && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                <PhosphorTrophy size={16} weight="fill" className="text-primary" />
                <span className="text-sm font-medium">
                  Best: {bestPerformer.name}
                </span>
                <span className="text-sm font-bold text-success font-mono">
                  +{bestPerformer.gainPercent.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={onAddInvestment} variant="glow" className="w-full gap-2">
              <PhosphorPlus size={20} weight="bold" />
              Add Investment
            </Button>
            <Button onClick={onImport} variant="ghost-premium" className="w-full gap-2">
              <PhosphorUpload size={20} weight="bold" />
              Import
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <PhosphorDownload size={20} weight="bold" />
                  Export
                  <PhosphorCaretDown size={20} weight="bold" className="ml-auto" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onExportCSV}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportPDF}>
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
