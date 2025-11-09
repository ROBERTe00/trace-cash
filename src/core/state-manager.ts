import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel, PostgrestError } from "@supabase/supabase-js";
import { QueryClient } from "@tanstack/react-query";

type ListenerKey = keyof AppState | "*";
type JsonRecord = Record<string, unknown>;

export interface UserPreferences {
  currency: string;
  riskProfile: "conservative" | "moderate" | "aggressive";
  theme: "light" | "dark" | "system";
}

export interface AppState {
  user: {
    profile: JsonRecord;
    preferences: UserPreferences;
  };
  transactions: JsonRecord[];
  investments: JsonRecord[];
  goals: JsonRecord[];
  aiInsights: JsonRecord[];
  cache: {
    lastSync: number;
    version: string;
  };
}

interface SupabasePreferencesRow {
  preferences?: Partial<UserPreferences> | null;
}

const NETWORK_ERROR_PATTERNS = ["Failed to fetch", "ERR_NAME_NOT_RESOLVED"];

const isNetworkError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error && typeof (error as { message?: unknown }).message === "string"
    ? (error as { message: string }).message
    : "";
  const name = "name" in error && typeof (error as { name?: unknown }).name === "string"
    ? (error as { name: string }).name
    : "";
  return NETWORK_ERROR_PATTERNS.some(pattern => message.includes(pattern)) || name === "NetworkError";
};

const getErrorMessage = (error: unknown): string | null => {
  if (!error || typeof error !== "object") return null;
  if ("message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return null;
};

const isAuthenticatedResponseError = (error: PostgrestError | null | undefined): error is PostgrestError => {
  return Boolean(error && typeof error === "object");
};

const isFulfilled = <T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> =>
  result.status === "fulfilled";

// Import queryClient - will be set from App.tsx
let queryClientInstance: QueryClient | null = null;

export function setQueryClient(client: QueryClient) {
  queryClientInstance = client;
}

class StateManager {
  private static instance: StateManager;
  private state: AppState;
  private listeners: Map<ListenerKey, Set<() => void>> = new Map();
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private supabaseChannel: RealtimeChannel | null = null;

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
        const parsed = JSON.parse(stored) as Partial<AppState>;
        // Merge con defaults per sicurezza
        const defaultState = this.getDefaultState();
        return {
          ...defaultState,
          ...parsed,
          user: {
            ...defaultState.user,
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
              const data = JSON.parse(e.newValue) as AppState[typeof key];
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
          } catch (error: unknown) {
            // Silently handle network errors in auth state change handler
            if (!isNetworkError(error)) {
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
          if (isNetworkError(userError)) {
            // Network error, fail silently
            return;
          }
          // Other auth errors - log once
          const errorMessage = getErrorMessage(userError);
          if (errorMessage) {
            console.log('[StateManager] Auth error on init:', errorMessage);
          }
          return;
        }

        if (user) {
          await this.syncFromSupabase();
          this.setupSupabaseRealtime();
        }
      } catch (error: unknown) {
        // Handle network errors silently
        if (isNetworkError(error)) {
          return; // Fail silently
        }
        console.error('[StateManager] Error getting user on init:', error);
      }

      // Store subscription for cleanup if needed
      // Note: Subscription cleanup handled by Supabase automatically
    } catch (error: unknown) {
      // Only log non-network errors
      if (!isNetworkError(error)) {
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
        if (isNetworkError(userError)) {
          // Network error, fail silently
          return;
        }
        // Other auth errors
        const errorMessage = getErrorMessage(userError);
        if (errorMessage && !errorMessage.includes('session_not_found')) {
          // Only log non-session errors (session_not_found is expected when logged out)
          console.log('[StateManager] Auth error, skipping sync:', errorMessage);
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
      if (isFulfilled(expensesResult)) {
        if (expensesResult.value.data && !expensesResult.value.error) {
          this.setState('transactions', expensesResult.value.data as JsonRecord[], true);
        } else if (isAuthenticatedResponseError(expensesResult.value.error) && !isNetworkError(expensesResult.value.error)) {
          console.error('[StateManager] Error loading expenses:', expensesResult.value.error);
        }
      } else if (!isNetworkError(expensesResult.reason)) {
        console.error('[StateManager] Error loading expenses:', expensesResult.reason);
      }

      // Gestisci investments
      if (isFulfilled(investmentsResult)) {
        if (investmentsResult.value.data && !investmentsResult.value.error) {
          this.setState('investments', investmentsResult.value.data as JsonRecord[], true);
        } else if (isAuthenticatedResponseError(investmentsResult.value.error) && !isNetworkError(investmentsResult.value.error)) {
          console.error('[StateManager] Error loading investments:', investmentsResult.value.error);
        }
      } else if (!isNetworkError(investmentsResult.reason)) {
        console.error('[StateManager] Error loading investments:', investmentsResult.reason);
      }

      // Gestisci goals
      if (isFulfilled(goalsResult)) {
        if (goalsResult.value.data && !goalsResult.value.error) {
          this.setState('goals', goalsResult.value.data as JsonRecord[], true);
        } else if (isAuthenticatedResponseError(goalsResult.value.error) && !isNetworkError(goalsResult.value.error)) {
          console.error('[StateManager] Error loading goals:', goalsResult.value.error);
        }
      } else if (!isNetworkError(goalsResult.reason)) {
        console.error('[StateManager] Error loading goals:', goalsResult.reason);
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
    } catch (error: unknown) {
      // Only log non-network errors
      if (!isNetworkError(error)) {
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
        if (isNetworkError(userError)) {
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
      } catch (error: unknown) {
        // Only log non-network errors
        if (!isNetworkError(error)) {
          console.error('[StateManager] ❌ Sync to Supabase error:', error);
        }
      }
    } catch (error: unknown) {
      // Handle outer catch for getUser errors
      if (!isNetworkError(error)) {
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
          if (isNetworkError(error)) {
            consecutiveFailures++;
            lastFailureTime = now;
            return; // Fail silently, don't spam console
          }
          // Other auth errors (invalid token, etc.) - log but don't spam
          if (consecutiveFailures === 0) {
            const message = getErrorMessage(error);
            if (message) {
              console.log('[StateManager] Auth error, skipping sync:', message);
            }
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
          } catch (syncError: unknown) {
            // Handle sync errors
            if (isNetworkError(syncError)) {
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
      } catch (error: unknown) {
        // Catch all other errors (network, etc.)
        if (isNetworkError(error)) {
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
    stateManagerInstance = StateManager.getInstance();
  }
  return stateManagerInstance;
})();

