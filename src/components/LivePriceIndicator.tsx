import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useManualPriceRefresh } from "@/hooks/useLivePricePolling";
import { cn } from "@/lib/utils";

interface LivePriceIndicatorProps {
  currentPrice: number;
  previousPrice?: number;
  symbol?: string;
  lastUpdated?: string;
  className?: string;
}

export const LivePriceIndicator = ({
  currentPrice,
  previousPrice,
  symbol,
  lastUpdated,
  className,
}: LivePriceIndicatorProps) => {
  const { refreshPrices } = useManualPriceRefresh();

  const priceChange = previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">
            €{currentPrice.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {previousPrice && (
            <Badge
              variant="secondary"
              className={cn(
                "text-xs gap-1",
                isPositive ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"
              )}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? "+" : ""}{priceChange.toFixed(2)}%
            </Badge>
          )}
        </div>
        {lastUpdated && (
          <span className="text-xs text-muted-foreground">
            Aggiornato: {new Date(lastUpdated).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => refreshPrices()}
        className="h-8 w-8"
        title="Aggiorna prezzo"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
};
