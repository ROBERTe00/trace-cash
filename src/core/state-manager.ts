import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";

// Import queryClient - will be set from App.tsx
let queryClientInstance: QueryClient | null = null;

export function setQueryClient(client: QueryClient) {
  queryClientInstance = client;
}

export interface AppState {
  user: {
    profile: Record<string, any>;
    preferences: {
      currency: string;
      riskProfile: 'conservative' | 'moderate' | 'aggressive';
      theme: 'light' | 'dark' | 'system';
    };
  };
  transactions: any[];
  investments: any[];
  goals: any[];
  aiInsights: any[];
  cache: {
    lastSync: number;
    version: string;
  };
}

class StateManager {
  private static instance: StateManager;
  private state: AppState;
  private listeners: Map<string, Set<() => void>> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private supabaseChannel: any = null;

  private constructor() {
    try {
      this.state = this.loadInitialState();
      this.setupCrossTabSync();
      // Init Supabase sync asynchronously (non-blocking)
      this.initSupabaseSync().catch(err => {
        console.error('[StateManager] Error initializing Supabase sync:', err);
      });
      this.startAutoSync();
    } catch (error) {
      console.error('[StateManager] Constructor error:', error);
      // Fallback to default state if initialization fails
      this.state = this.getDefaultState();
    }
  }

  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  private loadInitialState(): AppState {
    const stored = localStorage.getItem('mymoney-state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge con defaults per sicurezza
        return {
          ...this.getDefaultState(),
          ...parsed,
          user: {
            ...this.getDefaultState().user,
            ...(parsed.user || {})
          }
        };
      } catch (e) {
        console.error('[StateManager] Error loading state from localStorage:', e);
      }
    }
    
    return this.getDefaultState();
  }

  private getDefaultState(): AppState {
    return {
      user: {
        profile: {},
        preferences: { 
          currency: 'EUR', 
          riskProfile: 'moderate', 
          theme: 'system' 
        }
      },
      transactions: [],
      investments: [],
      goals: [],
      aiInsights: [],
      cache: { 
        lastSync: Date.now(), 
        version: '1.0.0' 
      }
    };
  }

  // Sync cross-tab in tempo reale usando localStorage events
  private setupCrossTabSync() {
    if (typeof window === 'undefined') return;

    try {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key?.startsWith('mymoney-')) {
          const key = e.key.replace('mymoney-', '') as keyof AppState;
          if (e.newValue) {
            try {
              const data = JSON.parse(e.newValue);
              // Aggiorna solo se non siamo noi stessi che abbiamo fatto il cambio
              if (e.storageArea === localStorage) {
                this.setState(key, data, false); // false = no localStorage write (già fatto)
              }
            } catch (err) {
              console.error('[StateManager] Error parsing cross-tab sync:', err);
            }
          }
        }
      });
    } catch (error) {
      console.error('[StateManager] Error setting up cross-tab sync:', error);
    }
  }

  // Inizializza sync con Supabase
  private async initSupabaseSync(): Promise<void> {
    try {
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        // Supabase not configured, skip initialization silently
        return;
      }

      // Setup auth listener  
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          try {
            if (event === 'SIGNED_IN' && session) {
              await this.syncFromSupabase();
              this.setupSupabaseRealtime();
            } else if (event === 'SIGNED_OUT') {
              this.reset();
              if (this.supabaseChannel) {
                supabase.removeChannel(this.supabaseChannel);
                this.supabaseChannel = null;
              }
            }
          } catch (error: any) {
            // Silently handle network errors in auth state change handler
            if (!error?.message?.includes('Failed to fetch') && 
                !error?.message?.includes('ERR_NAME_NOT_RESOLVED') &&
                error?.name !== 'NetworkError') {
              console.error('[StateManager] Error in auth state change handler:', error);
            }
          }
        }
      );

      if (listenerError) {
        console.error('[StateManager] Error setting up auth listener:', listenerError);
        return;
      }

      // Sync iniziale se già loggato
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        // Handle network/DNS errors silently
        if (userError) {
          if (userError.message?.includes('Failed to fetch') || 
              userError.message?.includes('ERR_NAME_NOT_RESOLVED') ||
              userError.name === 'NetworkError') {
            // Network error, fail silently
            return;
          }
          // Other auth errors - log once
          console.log('[StateManager] Auth error on init:', userError.message);
          return;
        }

        if (user) {
          await this.syncFromSupabase();
          this.setupSupabaseRealtime();
        }
      } catch (error: any) {
        // Handle network errors silently
        if (error?.message?.includes('Failed to fetch') || 
            error?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
            error?.name === 'NetworkError') {
          return; // Fail silently
        }
        console.error('[StateManager] Error getting user on init:', error);
      }

      // Store subscription for cleanup if needed
      // Note: Subscription cleanup handled by Supabase automatically
    } catch (error: any) {
      // Only log non-network errors
      if (!error?.message?.includes('Failed to fetch') && 
          !error?.message?.includes('ERR_NAME_NOT_RESOLVED') &&
          error?.name !== 'NetworkError') {
        console.error('[StateManager] Error in initSupabaseSync:', error);
      }
    }
  }

  // Setup Supabase real-time subscriptions
  private setupSupabaseRealtime() {
    if (this.supabaseChannel) {
      supabase.removeChannel(this.supabaseChannel);
    }

    this.supabaseChannel = supabase
      .channel('state-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => {
          console.log('🔄 [StateManager] Expense changed, syncing...');
          this.syncFromSupabase();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'investments' },
        () => {
          console.log('🔄 [StateManager] Investment changed, syncing...');
          this.syncFromSupabase();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'financial_goals' },
        () => {
          console.log('🔄 [StateManager] Goal changed, syncing...');
          this.syncFromSupabase();
        }
      )
      .subscribe();

    console.log('✅ [StateManager] Supabase real-time subscriptions active');
  }

  // Sincronizza da Supabase
  async syncFromSupabase() {
    try {
      // Check network availability
      if (!navigator.onLine) {
        return; // Offline, skip silently
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Handle network errors silently
      if (userError) {
        if (userError.message?.includes('Failed to fetch') || 
            userError.message?.includes('ERR_NAME_NOT_RESOLVED') ||
            userError.name === 'NetworkError') {
          // Network error, fail silently
          return;
        }
        // Other auth errors
        if (!userError.message?.includes('session_not_found')) {
          // Only log non-session errors (session_not_found is expected when logged out)
          console.log('[StateManager] Auth error, skipping sync:', userError.message);
        }
        return;
      }

      if (!user) {
        // No user, skip silently
        return;
      }

      console.log('[StateManager] Syncing from Supabase...');
      
      // Carica tutti i dati in parallelo con gestione errori individuale
      const [expensesResult, investmentsResult, goalsResult] = await Promise.allSettled([
        supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('investments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('financial_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      // Gestisci expenses
      if (expensesResult.status === 'fulfilled' && expensesResult.value.data && !expensesResult.value.error) {
        this.setState('transactions', expensesResult.value.data, true);
      } else if (expensesResult.status === 'rejected') {
        const error = expensesResult.reason;
        // Only log non-network errors
        if (!error?.message?.includes('Failed to fetch') && 
            !error?.message?.includes('ERR_NAME_NOT_RESOLVED') &&
            error?.name !== 'NetworkError') {
          console.error('[StateManager] Error loading expenses:', error);
        }
      } else if (expensesResult.status === 'fulfilled' && expensesResult.value.error) {
        // Supabase returned an error response
        const error = expensesResult.value.error;
        if (!error.message?.includes('Failed to fetch') && 
            !error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
          console.error('[StateManager] Error loading expenses:', error);
        }
      }

      // Gestisci investments
      if (investmentsResult.status === 'fulfilled' && investmentsResult.value.data && !investmentsResult.value.error) {
        this.setState('investments', investmentsResult.value.data, true);
      } else if (investmentsResult.status === 'rejected') {
        const error = investmentsResult.reason;
        if (!error?.message?.includes('Failed to fetch') && 
            !error?.message?.includes('ERR_NAME_NOT_RESOLVED') &&
            error?.name !== 'NetworkError') {
          console.error('[StateManager] Error loading investments:', error);
        }
      } else if (investmentsResult.status === 'fulfilled' && investmentsResult.value.error) {
        const error = investmentsResult.value.error;
        if (!error.message?.includes('Failed to fetch') && 
            !error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
          console.error('[StateManager] Error loading investments:', error);
        }
      }

      // Gestisci goals
      if (goalsResult.status === 'fulfilled' && goalsResult.value.data && !goalsResult.value.error) {
        this.setState('goals', goalsResult.value.data, true);
      } else if (goalsResult.status === 'rejected') {
        const error = goalsResult.reason;
        if (!error?.message?.includes('Failed to fetch') && 
            !error?.message?.includes('ERR_NAME_NOT_RESOLVED') &&
            error?.name !== 'NetworkError') {
          console.error('[StateManager] Error loading goals:', error);
        }
      } else if (goalsResult.status === 'fulfilled' && goalsResult.value.error) {
        const error = goalsResult.value.error;
        if (!error.message?.includes('Failed to fetch') && 
            !error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
          console.error('[StateManager] Error loading goals:', error);
        }
      }

      // User preferences are stored in user_profiles table
      let preferences = this.state.user.preferences;

      // Aggiorna preferences
      this.setState('user', {
        ...this.state.user,
        preferences
      }, true);
      
      // Invalida React Query cache per triggerare re-render (se disponibile)
      try {
        if (queryClientInstance) {
          queryClientInstance.invalidateQueries({ queryKey: ['expenses'] });
          queryClientInstance.invalidateQueries({ queryKey: ['investments'] });
          queryClientInstance.invalidateQueries({ queryKey: ['financial-goals'] });
        }
      } catch (error) {
        // QueryClient potrebbe non essere ancora disponibile, ignora
        // console.log('[StateManager] QueryClient not available yet, skipping invalidation');
      }

      this.setState('cache', { 
        ...this.state.cache, 
        lastSync: Date.now() 
      }, true);

      console.log('[StateManager] ✅ Sync completed successfully');
    } catch (error: any) {
      // Only log non-network errors
      if (!error?.message?.includes('Failed to fetch') && 
          !error?.message?.includes('ERR_NAME_NOT_RESOLVED') &&
          error?.name !== 'NetworkError') {
        console.error('[StateManager] ❌ Sync error:', error);
      }
      // Non bloccare l'app per errori di sync
    }
  }

  // Sync verso Supabase (per preferences e altre modifiche)
  async syncToSupabase() {
    try {
      // Check network availability
      if (!navigator.onLine) {
        return; // Offline, skip silently
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Handle network errors silently
      if (userError) {
        if (userError.message?.includes('Failed to fetch') || 
            userError.message?.includes('ERR_NAME_NOT_RESOLVED') ||
            userError.name === 'NetworkError') {
          return; // Fail silently
        }
      }

      if (!user) return;

      try {
        // Preferences are now stored in user_profiles, no separate sync needed
        // Nothing to do here
        
        // Aggiorna cache
        this.setState('cache', { 
          ...this.state.cache, 
          lastSync: Date.now() 
        }, true);

        console.log('[StateManager] ✅ Preferences synced to Supabase');
      } catch (e: any) {
        // Table might not exist or network error, ignore silently
        if (!e?.message?.includes('Failed to fetch') && 
            !e?.message?.includes('ERR_NAME_NOT_RESOLVED') &&
            e?.name !== 'NetworkError') {
          console.log('[StateManager] Cannot sync preferences, table might not exist');
        }
      }
    } catch (error: any) {
      // Handle outer catch for getUser errors
      if (!error?.message?.includes('Failed to fetch') &&
          !error?.message?.includes('ERR_NAME_NOT_RESOLVED') &&
          error?.name !== 'NetworkError') {
        console.error('[StateManager] ❌ Sync to Supabase error:', error);
      }
    }
  }

  // Auto-sync ogni 30 secondi
  private startAutoSync() {
    let consecutiveFailures = 0;
    let lastFailureTime = 0;
    const maxBackoff = 300000; // 5 minuti max
    const baseInterval = 30000; // 30 secondi base

    this.syncInterval = setInterval(async () => {
      try {
        // Check if Supabase is configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
          // Supabase not configured, skip sync silently
          return;
        }

        // Check network availability
        if (!navigator.onLine) {
          // Offline, skip sync silently
          return;
        }

        // Exponential backoff after failures
        const now = Date.now();
        if (consecutiveFailures > 0) {
          const backoffTime = Math.min(baseInterval * Math.pow(2, consecutiveFailures - 1), maxBackoff);
          if (now - lastFailureTime < backoffTime) {
            // Still in backoff period, skip this sync
            return;
          }
        }

        const { data: { user }, error } = await supabase.auth.getUser();
        
        // Handle auth errors gracefully
        if (error) {
          // Network errors, DNS errors, etc. - fail silently
          if (error.message?.includes('Failed to fetch') || 
              error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
              error.name === 'NetworkError') {
            consecutiveFailures++;
            lastFailureTime = now;
            return; // Fail silently, don't spam console
          }
          // Other auth errors (invalid token, etc.) - log but don't spam
          if (consecutiveFailures === 0) {
            console.log('[StateManager] Auth error, skipping sync:', error.message);
          }
          consecutiveFailures++;
          lastFailureTime = now;
          return;
        }

        if (user) {
          try {
            await this.syncFromSupabase();
            // Reset failure counter on success
            consecutiveFailures = 0;
            lastFailureTime = 0;
          } catch (syncError: any) {
            // Handle sync errors
            if (syncError?.message?.includes('Failed to fetch') || 
                syncError?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
                syncError?.name === 'NetworkError') {
              consecutiveFailures++;
              lastFailureTime = now;
              return; // Fail silently
            }
            // Other sync errors - log once
            if (consecutiveFailures === 0) {
              console.error('[StateManager] Sync error:', syncError);
            }
            consecutiveFailures++;
            lastFailureTime = now;
          }
        }
      } catch (error: any) {
        // Catch all other errors (network, etc.)
        if (error?.message?.includes('Failed to fetch') || 
            error?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
            error?.name === 'NetworkError') {
          consecutiveFailures++;
          lastFailureTime = Date.now();
          return; // Fail silently
        }
        // Other unexpected errors - log once
        if (consecutiveFailures === 0) {
          console.error('[StateManager] Unexpected error in auto-sync:', error);
        }
        consecutiveFailures++;
        lastFailureTime = Date.now();
      }
    }, baseInterval);
  }

  // Metodi pubblici
  getState(): AppState {
    return { ...this.state };
  }

  getStateKey<K extends keyof AppState>(key: K): AppState[K] {
    return this.state[key];
  }

  setState<K extends keyof AppState>(
    key: K, 
    value: AppState[K], 
    persist: boolean = true
  ) {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    if (persist && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`mymoney-${key}`, JSON.stringify(value));
        // Salva anche lo stato completo per backup
        localStorage.setItem('mymoney-state', JSON.stringify(this.state));
      } catch (e) {
        console.error('[StateManager] Error persisting to localStorage:', e);
      }
    }

    // Notifica listeners solo se il valore è cambiato
    if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
      this.listeners.get(key)?.forEach(listener => listener());
      this.listeners.get('*')?.forEach(listener => listener());
    }
  }

  subscribe(key: keyof AppState | '*', callback: () => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  // Reset state
  reset() {
    console.log('[StateManager] Resetting state...');
    this.state = this.getDefaultState();
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('mymoney-')) {
          localStorage.removeItem(key);
        }
      });
    }
    this.notifyAll();
  }

  private notifyAll() {
    this.listeners.forEach(callbacks => {
      callbacks.forEach(cb => {
        try {
          cb();
        } catch (e) {
          console.error('[StateManager] Error in listener:', e);
        }
      });
    });
  }

  destroy() {
    console.log('[StateManager] Destroying state manager...');
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.supabaseChannel) {
      supabase.removeChannel(this.supabaseChannel);
      this.supabaseChannel = null;
    }
  }
}

// Lazy initialization to avoid blocking app startup
let stateManagerInstance: StateManager | null = null;

export const stateManager = (() => {
  if (!stateManagerInstance) {
    try {
      stateManagerInstance = StateManager.getInstance();
    } catch (error) {
      console.error('[StateManager] Failed to initialize:', error);
      // Return a minimal fallback instance
      return {
        getState: () => ({ 
          user: { profile: {}, preferences: { currency: 'EUR', riskProfile: 'moderate', theme: 'system' } },
          transactions: [],
          investments: [],
          goals: [],
          aiInsights: [],
          cache: { lastSync: Date.now(), version: '1.0.0' }
        }),
        getStateKey: () => ([]),
        setState: () => {},
        subscribe: () => () => {},
        syncFromSupabase: async () => {},
        syncToSupabase: async () => {},
        reset: () => {},
      } as any;
    }
  }
  return stateManagerInstance;
})();

