/**
 * Transaction Filters Component
 * Search, category filter, date range, and sorting
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, Calendar, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface TransactionFilterState {
  searchQuery: string;
  categories: string[];
  sortBy: 'date' | 'amount' | 'category';
  sortOrder: 'asc' | 'desc';
  dateRange: { start: string | null; end: string | null };
}

interface TransactionFiltersProps {
  filters: TransactionFilterState;
  onFiltersChange: (filters: TransactionFilterState) => void;
  availableCategories: string[];
}

export const TransactionFilters = ({
  filters,
  onFiltersChange,
  availableCategories,
}: TransactionFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof TransactionFilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleCategory = (category: string) => {
    const categories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    updateFilter('categories', categories);
  };

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      categories: [],
      sortBy: 'date',
      sortOrder: 'desc',
      dateRange: { start: null, end: null },
    });
  };

  const hasActiveFilters =
    filters.searchQuery ||
    filters.categories.length > 0 ||
    filters.dateRange.start ||
    filters.dateRange.end;

  return (
    <Card className="p-4 glass-card">
      <div className="space-y-3">
        {/* Main Row: Search + Sort */}
        <div className="flex gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca transazioni..."
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sort By */}
          <Select value={filters.sortBy} onValueChange={(value: any) => updateFilter('sortBy', value)}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="amount">Importo</SelectItem>
              <SelectItem value="category">Categoria</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="gap-2"
          >
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </Button>

          {/* Advanced Filters Toggle */}
          <Button
            variant={showAdvanced ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtri
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>

        {/* Advanced Filters (Collapsible) */}
        {showAdvanced && (
          <div className="space-y-3 pt-3 border-t">
            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Da</label>
                <Input
                  type="date"
                  value={filters.dateRange.start || ''}
                  onChange={(e) =>
                    updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">A</label>
                <Input
                  type="date"
                  value={filters.dateRange.end || ''}
                  onChange={(e) =>
                    updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Category Filters */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Categorie</label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <Badge
                    key={category}
                    variant={filters.categories.includes(category) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                    {filters.categories.includes(category) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Filtri attivi:</span>
            {filters.searchQuery && (
              <Badge variant="secondary" className="text-xs">
                Ricerca: "{filters.searchQuery}"
              </Badge>
            )}
            {filters.categories.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filters.categories.length} {filters.categories.length === 1 ? 'categoria' : 'categorie'}
              </Badge>
            )}
            {filters.dateRange.start && (
              <Badge variant="secondary" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Periodo personalizzato
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

