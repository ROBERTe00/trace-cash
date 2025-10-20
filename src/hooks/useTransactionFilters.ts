/**
 * Custom hook for transaction filtering and sorting
 */

import { useMemo, useState } from "react";
import { Expense } from "@/lib/storage";

export interface FilterState {
  searchQuery: string;
  categories: string[];
  sortBy: 'date' | 'amount' | 'category';
  sortOrder: 'asc' | 'desc';
  dateRange: { start: string | null; end: string | null };
}

export function useTransactionFilters(transactions: Expense[]) {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    categories: [],
    sortBy: 'date',
    sortOrder: 'desc',
    dateRange: { start: null, end: null },
  });

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.description.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      result = result.filter((t) => filters.categories.includes(t.category));
    }

    // Date range filter
    if (filters.dateRange.start) {
      result = result.filter((t) => t.date >= filters.dateRange.start!);
    }
    if (filters.dateRange.end) {
      result = result.filter((t) => t.date <= filters.dateRange.end!);
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transactions, filters]);

  // Get unique categories
  const availableCategories = useMemo(() => {
    const categories = new Set(transactions.map((t) => t.category));
    return Array.from(categories).sort();
  }, [transactions]);

  return {
    filters,
    setFilters,
    filteredTransactions,
    availableCategories,
  };
}

