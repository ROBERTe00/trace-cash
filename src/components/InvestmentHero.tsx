import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TrendingUp, TrendingDown, Plus, Upload, Download, ChevronDown, Trophy } from "lucide-react";
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
    <Card className="glass-card overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      <CardContent className="p-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Total Portfolio Value */}
          <div className="lg:col-span-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">Total Portfolio Value</p>
            <h2 className="text-hero-number gradient-text mb-4">
              {formatCurrency(totalValue)}
            </h2>
            <div className="flex items-center gap-4 mb-6">
              <div className={`flex items-center gap-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <TrendingUp className="icon-card" /> : <TrendingDown className="icon-card" />}
                <span className="text-large-number font-bold">
                  {isPositive ? '+' : ''}{formatCurrency(totalGain)}
                </span>
              </div>
              <Badge className={isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                {isPositive ? '+' : ''}{gainPercentage.toFixed(2)}%
              </Badge>
            </div>

            {bestPerformer && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20">
                <Trophy className="icon-button text-primary" />
                <span className="text-sm font-medium">
                  Best: {bestPerformer.name}
                </span>
                <span className="text-sm font-bold text-green-500">
                  +{bestPerformer.gainPercent.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-3">
            <Button onClick={onAddInvestment} size="lg" className="w-full gap-2">
              <Plus className="icon-button" />
              Add Investment
            </Button>
            <Button onClick={onImport} variant="outline" size="lg" className="w-full gap-2">
              <Upload className="icon-button" />
              Import
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg" className="w-full gap-2">
                  <Download className="icon-button" />
                  Export
                  <ChevronDown className="icon-button ml-auto" />
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
      </CardContent>
    </Card>
  );
}
