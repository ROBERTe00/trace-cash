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
      <CardContent className="p-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Total Portfolio Value */}
          <div className="lg:col-span-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">Total Portfolio Value</p>
            <h2 className="text-large-number gradient-text mb-3">
              {formatCurrency(totalValue)}
            </h2>
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex items-center gap-2 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? <TrendingUp className="icon-card" /> : <TrendingDown className="icon-card" />}
                <span className="text-medium-number font-bold">
                  {isPositive ? '+' : ''}{formatCurrency(totalGain)}
                </span>
              </div>
              <Badge className={isPositive ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                {isPositive ? '+' : ''}{gainPercentage.toFixed(2)}%
              </Badge>
            </div>

            {bestPerformer && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                <Trophy className="icon-small text-primary" />
                <span className="text-sm font-medium">
                  Best: {bestPerformer.name}
                </span>
                <span className="text-sm font-bold text-success">
                  +{bestPerformer.gainPercent.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={onAddInvestment} className="w-full gap-2">
              <Plus className="icon-button" />
              Add Investment
            </Button>
            <Button onClick={onImport} variant="outline" className="w-full gap-2">
              <Upload className="icon-button" />
              Import
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
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
