import { useState, useEffect, useCallback } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, DollarSign, TrendingUp, Upload, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getExpenses, getInvestments } from '@/lib/storage';

interface SearchResult {
  type: 'expense' | 'investment' | 'page';
  title: string;
  subtitle?: string;
  icon: any;
  action: () => void;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [expenses, setExpenses] = useState(getExpenses());
  const [investments, setInvestments] = useState(getInvestments());
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const pages: SearchResult[] = [
    {
      type: 'page',
      title: 'Dashboard',
      icon: TrendingUp,
      action: () => navigate('/'),
    },
    {
      type: 'page',
      title: 'Expenses',
      icon: DollarSign,
      action: () => navigate('/expenses'),
    },
    {
      type: 'page',
      title: 'Investments',
      icon: TrendingUp,
      action: () => navigate('/investments'),
    },
    {
      type: 'page',
      title: 'Upload',
      icon: Upload,
      action: () => navigate('/upload'),
    },
    {
      type: 'page',
      title: 'Settings',
      icon: Settings,
      action: () => navigate('/settings'),
    },
  ];

  const searchTransactions = useCallback((query: string) => {
    const searchQuery = query.toLowerCase();
    const expenseResults: SearchResult[] = expenses
      .filter(e => 
        e.description.toLowerCase().includes(searchQuery) ||
        e.category.toLowerCase().includes(searchQuery)
      )
      .slice(0, 5)
      .map(e => ({
        type: 'expense' as const,
        title: e.description,
        subtitle: `${e.category} • €${e.amount} • ${new Date(e.date).toLocaleDateString()}`,
        icon: DollarSign,
        action: () => {
          navigate('/expenses');
          setOpen(false);
        },
      }));

    const investmentResults: SearchResult[] = investments
      .filter(i => 
        i.name.toLowerCase().includes(searchQuery) ||
        i.type.toLowerCase().includes(searchQuery)
      )
      .slice(0, 5)
      .map(i => ({
        type: 'investment' as const,
        title: i.name,
        subtitle: `${i.type} • €${i.currentPrice * i.quantity}`,
        icon: TrendingUp,
        action: () => {
          navigate('/investments');
          setOpen(false);
        },
      }));

    const pageResults = pages.filter(p => 
      p.title.toLowerCase().includes(searchQuery)
    );

    setResults([...expenseResults, ...investmentResults, ...pageResults]);
  }, [expenses, investments, navigate]);

  return (
    <>
      {/* Mobile: Solo Icona */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-md hover:bg-accent transition-colors"
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Desktop: Search Bar Completa */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 w-full max-w-sm px-3 py-2 text-sm text-muted-foreground bg-background border rounded-md hover:bg-accent transition-colors relative"
      >
        <Search className="h-4 w-4" />
        <span>Search transactions...</span>
        <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search transactions, categories, pages..."
          onValueChange={searchTransactions}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {results.filter(r => r.type === 'expense').length > 0 && (
            <CommandGroup heading="Expenses">
              {results
                .filter(r => r.type === 'expense')
                .map((result, i) => (
                  <CommandItem key={i} onSelect={result.action}>
                    <result.icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          )}

          {results.filter(r => r.type === 'investment').length > 0 && (
            <CommandGroup heading="Investments">
              {results
                .filter(r => r.type === 'investment')
                .map((result, i) => (
                  <CommandItem key={i} onSelect={result.action}>
                    <result.icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          )}

          {results.filter(r => r.type === 'page').length > 0 && (
            <CommandGroup heading="Pages">
              {results
                .filter(r => r.type === 'page')
                .map((result, i) => (
                  <CommandItem key={i} onSelect={result.action}>
                    <result.icon className="mr-2 h-4 w-4" />
                    <span>{result.title}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
