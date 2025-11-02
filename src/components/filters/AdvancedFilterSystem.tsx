// Advanced Filter System - Compositable filter system with URL persistence
import { useMemo } from 'react';
import { useFilter, type FilterState } from '@/hooks/useInteractions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Filter, X, Calendar as CalendarIcon, DollarSign, Tag, Search } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export interface FilterConfig<T> {
  items: T[];
  onFiltered?: (filtered: T[]) => void;
  filterableFields?: {
    categories?: string[];
    types?: string[];
    tags?: string[];
  };
  showCategories?: boolean;
  showDateRange?: boolean;
  showAmountRange?: boolean;
  showType?: boolean;
  showTags?: boolean;
  showSearch?: boolean;
  persistToURL?: boolean;
}

export function AdvancedFilterSystem<T extends Record<string, any>>({
  items,
  onFiltered,
  filterableFields = {},
  showCategories = true,
  showDateRange = true,
  showAmountRange = true,
  showType = true,
  showTags = false,
  showSearch = true,
  persistToURL = true
}: FilterConfig<T>) {
  const {
    filters,
    filtered,
    updateFilter,
    resetFilters,
    setFiltersAll,
    count,
    total
  } = useFilter<T>({ items, onFiltered, persistToURL });

  // Extract available options from items
  const availableCategories = useMemo(() => {
    return Array.from(new Set(items.map(item => item.category).filter(Boolean))).sort();
  }, [items]);

  const availableTypes = useMemo(() => {
    return Array.from(new Set(items.map(item => item.type).filter(Boolean))).sort();
  }, [items]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [items]);

  // Calculate amount range from items
  const amountRange = useMemo(() => {
    const amounts = items.map(item => Math.abs(item.amount || 0)).filter(a => a > 0);
    if (amounts.length === 0) return { min: 0, max: 1000 };
    return {
      min: Math.min(...amounts),
      max: Math.max(...amounts)
    };
  }, [items]);

  const handleCategoryToggle = (category: string) => {
    const current = filters.categories || [];
    const updated = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    updateFilter('categories', updated.length > 0 ? updated : undefined);
  };

  const handleTypeToggle = (type: string) => {
    const current = filters.type || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    updateFilter('type', updated.length > 0 ? updated : undefined);
  };

  const handleTagToggle = (tag: string) => {
    const current = filters.tags || [];
    const updated = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag];
    updateFilter('tags', updated.length > 0 ? updated : undefined);
  };

  const activeFiltersCount = [
    filters.categories?.length || 0,
    filters.type?.length || 0,
    filters.tags?.length || 0,
    filters.dateRange ? 1 : 0,
    filters.amountRange ? 1 : 0,
    filters.search ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca transazioni..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value || undefined)}
            className="pl-10"
          />
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Category Filter */}
        {showCategories && availableCategories.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Categorie
                {filters.categories && filters.categories.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.categories.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <Label>Categorie</Label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {availableCategories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${category}`}
                        checked={filters.categories?.includes(category) || false}
                        onCheckedChange={() => handleCategoryToggle(category)}
                      />
                      <Label
                        htmlFor={`cat-${category}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Type Filter */}
        {showType && availableTypes.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Tipo
                {filters.type && filters.type.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.type.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-2">
                <Label>Tipo</Label>
                {availableTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.type?.includes(type) || false}
                      onCheckedChange={() => handleTypeToggle(type)}
                    />
                    <Label
                      htmlFor={`type-${type}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Date Range Filter */}
        {showDateRange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                Data
                {filters.dateRange && (
                  <Badge variant="secondary" className="ml-1">1</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="range"
                selected={{
                  from: filters.dateRange?.start,
                  to: filters.dateRange?.end
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    updateFilter('dateRange', {
                      start: range.from,
                      end: range.to
                    });
                  } else {
                    updateFilter('dateRange', undefined);
                  }
                }}
                locale={it}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Amount Range Filter */}
        {showAmountRange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Importo
                {filters.amountRange && (
                  <Badge variant="secondary" className="ml-1">1</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <Label>Range Importo</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.amountRange?.min || ''}
                      onChange={(e) => {
                        const min = e.target.value ? parseFloat(e.target.value) : undefined;
                        updateFilter('amountRange', {
                          min: min || amountRange.min,
                          max: filters.amountRange?.max || amountRange.max
                        });
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.amountRange?.max || ''}
                      onChange={(e) => {
                        const max = e.target.value ? parseFloat(e.target.value) : undefined;
                        updateFilter('amountRange', {
                          min: filters.amountRange?.min || amountRange.min,
                          max: max || amountRange.max
                        });
                      }}
                    />
                  </div>
                  <Slider
                    value={[
                      filters.amountRange?.min || amountRange.min,
                      filters.amountRange?.max || amountRange.max
                    ]}
                    min={amountRange.min}
                    max={amountRange.max}
                    step={10}
                    onValueChange={([min, max]) => {
                      updateFilter('amountRange', { min, max });
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Tags Filter */}
        {showTags && availableTags.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Tag className="h-4 w-4" />
                Tag
                {filters.tags && filters.tags.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.tags.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <Label>Tag</Label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {availableTags.map(tag => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={filters.tags?.includes(tag) || false}
                        onCheckedChange={() => handleTagToggle(tag)}
                      />
                      <Label
                        htmlFor={`tag-${tag}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Reset Button */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span className="text-muted-foreground">
            {count} di {total} risultati
          </span>
          {filters.categories && filters.categories.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {filters.categories.map(cat => (
                <Badge key={cat} variant="secondary" className="gap-1">
                  {cat}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleCategoryToggle(cat)}
                  />
                </Badge>
              ))}
            </div>
          )}
          {filters.dateRange && (
            <Badge variant="secondary" className="gap-1">
              {format(filters.dateRange.start, 'dd/MM/yyyy', { locale: it })} -{' '}
              {format(filters.dateRange.end, 'dd/MM/yyyy', { locale: it })}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter('dateRange', undefined)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

