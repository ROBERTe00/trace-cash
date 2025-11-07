// Common Interaction Hooks - Unified hooks for common UI patterns
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { eventBus, Events } from '@/core/event-system';

/**
 * Modal hook - Manages modal open/close state with proper focus management
 */
export function useModal<T = any>() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const open = useCallback((modalData?: T) => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    setData(modalData || null);
    setIsOpen(true);
    eventBus.emit(Events.MODAL_OPEN, { data: modalData });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    eventBus.emit(Events.MODAL_CLOSE, {});
    
    // Restore focus
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  const toggle = useCallback((modalData?: T) => {
    if (isOpen) {
      close();
    } else {
      open(modalData);
    }
  }, [isOpen, open, close]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Focus first focusable element in modal
      const focusable = modalRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleESC = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('keydown', handleESC);
    return () => window.removeEventListener('keydown', handleESC);
  }, [isOpen, close]);

  return {
    isOpen,
    open,
    close,
    toggle,
    data,
    modalRef
  };
}

/**
 * Form hook - Handles form state, validation, and submission
 */
export interface FormConfig<T> {
  initialValues: T;
  validation?: Partial<Record<keyof T, (value: any) => string | null>>;
  onSubmit?: (values: T) => Promise<void> | void;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

export function useForm<T extends Record<string, any>>(config: FormConfig<T>) {
  const {
    initialValues,
    validation = {},
    onSubmit,
    autoSave = false,
    autoSaveInterval = 30000
  } = config;

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Validate single field
  const validateField = useCallback((field: keyof T, value: any): string | null => {
    const validator = validation[field];
    if (validator) {
      return validator(value);
    }
    return null;
  }, [validation]);

  // Validate all fields
  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validation).forEach((field) => {
      const error = validateField(field as keyof T, values[field]);
      if (error) {
        newErrors[field as keyof T] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validation, validateField]);

  // Update field value
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    setIsDirty(true);

    // Real-time validation
    const error = validateField(field, value);
    setErrors(prev => {
      if (error) {
        return { ...prev, [field]: error };
      } else {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
    });

    // Emit form change event
    eventBus.emit('form:field:changed', { field, value });
  }, [validateField]);

  // Set field touched
  const setFieldTouched = useCallback((field: keyof T, touchedValue: boolean = true) => {
    setTouched(prev => ({ ...prev, [field]: touchedValue }));
  }, []);

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
    setIsSubmitting(false);
    eventBus.emit(Events.FORM_RESET, {});
  }, [initialValues]);

  // Submit form
  const submit = useCallback(async () => {
    if (!validate()) {
      eventBus.emit(Events.FORM_VALIDATION_ERROR, { errors });
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(values);
        eventBus.emit(Events.FORM_SUBMIT, { values });
        // Reset form only on success
        reset();
      }
    } catch (error) {
      console.error('[useForm] Submit error:', error);
      // Don't reset form on error, let user fix it
      // Re-throw so caller can handle it
      throw error;
    } finally {
      // Always reset submitting state
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit, reset, errors]);

  // Auto-save
  useEffect(() => {
    if (!autoSave || !isDirty) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (validate()) {
        // Auto-save logic (could save to localStorage or trigger callback)
        eventBus.emit('form:autosave', { values });
      }
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [values, isDirty, autoSave, autoSaveInterval, validate]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    setFieldValue,
    setFieldTouched,
    setValues,
    validate,
    reset,
    submit
  };
}

/**
 * Filter hook - Manages filtering state and applies filters
 */
export interface FilterConfig<T> {
  items: T[];
  onFiltered?: (filtered: T[]) => void;
  persistToURL?: boolean;
}

export interface FilterState {
  categories?: string[];
  dateRange?: { start: Date; end: Date };
  amountRange?: { min: number; max: number };
  type?: string[];
  tags?: string[];
  search?: string;
}

export function useFilter<T extends Record<string, any>>(config: FilterConfig<T>) {
  const { items, onFiltered, persistToURL = false } = config;
  
  const [filters, setFilters] = useState<FilterState>(() => {
    if (persistToURL && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const saved = params.get('filters');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return {};
        }
      }
    }
    return {};
  });

  // Apply filters - use deep comparison for filters to prevent unnecessary recalculations
  const filtersRef = useRef<string>('');
  const filtersString = JSON.stringify(filters);
  
  // Apply filters
  const filtered = useMemo(() => {
    // Only recalculate if filters actually changed
    if (filtersString === filtersRef.current && filtersRef.current !== '') {
      // Return cached result - but we need to track items changes separately
      // For now, always recalculate but optimize the filter logic
    }
    filtersRef.current = filtersString;
    
    let result = [...items];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(item => {
        return Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchLower)
        );
      });
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      result = result.filter(item =>
        filters.categories!.includes(item.category)
      );
    }

    // Type filter
    if (filters.type && filters.type.length > 0) {
      result = result.filter(item =>
        filters.type!.includes(item.type)
      );
    }

    // Date range filter
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      result = result.filter(item => {
        const itemDate = new Date(item.date || item.created_at);
        return itemDate >= start && itemDate <= end;
      });
    }

    // Amount range filter
    if (filters.amountRange) {
      const { min, max } = filters.amountRange;
      result = result.filter(item => {
        const amount = Math.abs(item.amount || 0);
        return amount >= min && amount <= max;
      });
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(item => {
        const itemTags = item.tags || [];
        return filters.tags!.some(tag => itemTags.includes(tag));
      });
    }

    return result;
  }, [items, filtersString]);

  // Update filters
  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    eventBus.emit(Events.FILTER_CHANGED, { [key]: value });
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({});
    eventBus.emit(Events.FILTER_RESET, {});
  }, []);

  // Apply multiple filters
  const setFiltersAll = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    eventBus.emit(Events.FILTER_CHANGED, newFilters);
  }, []);

  // Persist to URL
  const prevFiltersRef = useRef<string>('');
  useEffect(() => {
    if (persistToURL && typeof window !== 'undefined') {
      const filtersString = JSON.stringify(filters);
      
      // Only update URL if filters actually changed
      if (filtersString !== prevFiltersRef.current) {
        prevFiltersRef.current = filtersString;
        const params = new URLSearchParams(window.location.search);
        
        if (Object.keys(filters).length > 0) {
          params.set('filters', filtersString);
        } else {
          params.delete('filters');
        }
        window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
      }
    }
  }, [filters, persistToURL]);

  // Notify parent of filtered results - use ref to prevent unnecessary calls
  const filteredRef = useRef<any[]>([]);
  const filteredString = JSON.stringify(filtered);
  
  useEffect(() => {
    // Only call onFiltered if filtered actually changed
    if (filteredString !== JSON.stringify(filteredRef.current)) {
      filteredRef.current = filtered;
      if (onFiltered) {
        onFiltered(filtered);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredString]); // Use stringified version to prevent object reference issues

  return {
    filters,
    filtered,
    updateFilter,
    resetFilters,
    setFiltersAll,
    count: filtered.length,
    total: items.length
  };
}

