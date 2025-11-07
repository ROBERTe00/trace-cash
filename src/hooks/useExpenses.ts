import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { stateManager } from "@/core/state-manager";
import { saveCache, loadCache } from "@/lib/offlineCache";
import { eventBus, Events } from "@/core/event-system";

// Helper per ottenere user ID direttamente da localStorage (sincrono, non può bloccarsi)
const getUserIdSync = (): string | null => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      console.warn('[getUserIdSync] No SUPABASE_URL found');
      return null;
    }
    
    // Estrai il project ref dall'URL (es: https://xxxxx.supabase.co -> xxxxx)
    const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
    const projectRef = urlMatch?.[1];
    
    // Prova diversi formati di chiavi possibili
    const possibleKeys: string[] = [];
    
    if (projectRef) {
      possibleKeys.push(`sb-${projectRef}-auth-token`);
    }
    
    // Aggiungi tutte le chiavi localStorage che potrebbero contenere la sessione
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-')) && 
          (key.includes('auth') || key.includes('token'))) {
        if (!possibleKeys.includes(key)) {
          possibleKeys.push(key);
        }
      }
    }
    
    console.log('[getUserIdSync] Searching in localStorage keys:', possibleKeys);
    
    // Prova ogni chiave possibile
    for (const key of possibleKeys) {
      try {
        const data = localStorage.getItem(key);
        if (!data) continue;
        
        const parsed = JSON.parse(data);
        console.log('[getUserIdSync] Checking key:', key, 'Parsed structure:', Object.keys(parsed));
        
        // Formato Supabase standard: { access_token, expires_at, user, ... }
        // Cerca user.id in vari formati possibili
        let userId = 
          parsed?.user?.id || 
          parsed?.currentSession?.user?.id ||
          parsed?.session?.user?.id ||
          parsed?.user_id;
        
        if (userId) {
          console.log('[getUserIdSync] ✅ Found user ID in key:', key, 'userId:', userId);
          return userId;
        }
        
        // Se non c'è user ma c'è access_token, decodifica il JWT token
        const accessToken = parsed?.access_token || parsed?.session?.access_token;
        
        if (accessToken && typeof accessToken === 'string') {
          try {
            // Decodifica JWT (base64url decode)
            const parts = accessToken.split('.');
            if (parts.length === 3) {
              // Base64 URL decode
              const payload = JSON.parse(
                atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
              );
              
              // JWT payload contiene user ID come 'sub' (subject)
              userId = payload?.sub || payload?.user_id || payload?.id || payload?.user?.id;
              
              if (userId) {
                console.log('[getUserIdSync] ✅ Found user ID in JWT token from key:', key, 'userId:', userId);
                return userId;
              }
            }
          } catch (jwtError) {
            console.warn('[getUserIdSync] Error decoding JWT from key:', key, jwtError);
            // Continua a cercare in altre chiavi
          }
        }
      } catch (e) {
        console.warn('[getUserIdSync] Error parsing key:', key, e);
        continue;
      }
    }
    
    console.warn('[getUserIdSync] ❌ No user ID found in localStorage. Available keys:', 
      Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
    );
    return null;
  } catch (e) {
    console.error('[getUserIdSync] ❌ Error:', e);
    return null;
  }
};

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'Expense' | 'Income';
  recurring: boolean;
  recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  linked_investment_id?: string;
  created_at: string;
  updated_at: string;
}

export const useExpenses = () => {
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async (): Promise<Expense[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[useExpenses] No authenticated user');
        const cached = loadCache<Expense[]>('expenses');
        if (cached) {
          console.warn('[useExpenses] Using cached expenses (no auth)');
          return cached;
        }
        return [];
      }

      console.log('[useExpenses] Fetching expenses for user:', user.id);

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('[useExpenses] Error fetching expenses:', error);
        const cached = loadCache<Expense[]>('expenses');
        if (cached) {
          console.warn('[useExpenses] Using cached expenses (offline mode)');
          return cached;
        }
        throw error;
      }
      
      console.log(`[useExpenses] Fetched ${data?.length || 0} expenses for user ${user.id}`);
      saveCache('expenses', data || []);
      return (data || []) as Expense[];
    },
    staleTime: 30 * 1000, // Considera i dati freschi per 30 secondi
    refetchOnWindowFocus: false, // Evita refetch automatico che può causare loop
    refetchOnMount: true,
    gcTime: 5 * 60 * 1000, // Mantieni in cache per 5 minuti
  });

  const createExpense = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      console.log('[useExpenses] mutationFn STARTED with expense:', expense);
      
      try {
        // Prova prima a leggere direttamente da localStorage (sincrono, non può bloccarsi)
        console.log('[useExpenses] 🔍 Getting user ID from localStorage (sync)...');
        let userId = getUserIdSync();
        
        if (!userId) {
          console.warn('[useExpenses] ⚠️ User ID not found in localStorage, will try async methods');
        }
        
        // Se non trovato, prova getSession() con timeout molto breve (3 secondi)
        if (!userId) {
          console.log('[useExpenses] User ID not in localStorage, trying getSession() with 3s timeout...');
          try {
            const sessionResult = await Promise.race([
              supabase.auth.getSession(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('getSession timeout after 3s')), 3000)
              )
            ]) as any;
            userId = sessionResult?.data?.session?.user?.id;
          } catch (e: any) {
            console.warn('[useExpenses] getSession() failed or timeout:', e?.message);
          }
        }
        
        // Ultimo tentativo: getUser() con timeout breve
        if (!userId) {
          console.log('[useExpenses] Still no user ID, trying getUser() with 5s timeout...');
          try {
            const userResult = await Promise.race([
              supabase.auth.getUser(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('getUser timeout after 5s')), 5000)
              )
            ]) as any;
            userId = userResult?.data?.user?.id;
          } catch (e: any) {
            console.warn('[useExpenses] getUser() failed or timeout:', e?.message);
          }
        }
        
        console.log('[useExpenses] Auth check - userId:', userId);
        
        if (!userId) {
          console.error('[useExpenses] Auth failed - no user ID found');
          throw new Error('Not authenticated. Please log in again.');
        }

        console.log('[useExpenses] Creating expense for user:', userId, 'expense data:', expense);

        // Logging dettagliato per capire dove si blocca
        console.log('[useExpenses] 📤 About to call supabase.from("expenses").insert()...');
        const insertStartTime = Date.now();
        
        try {
          console.log('[useExpenses] 🔄 Calling insert with payload:', {
            user_id: userId,
            ...expense
          });
          
          console.log('[useExpenses] 🔧 Using DIRECT fetch call to bypass PostgREST builder...');
          
          // SOLUZIONE: Bypassa PostgREST e usa fetch diretto
          // Il builder potrebbe non eseguire la query per qualche motivo
          
          // Ottieni il token dalla sessione
          const projectRef = import.meta.env.VITE_SUPABASE_URL?.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
          const storageKey = projectRef ? `sb-${projectRef}-auth-token` : null;
          const sessionData = storageKey ? localStorage.getItem(storageKey) : null;
          const parsed = sessionData ? JSON.parse(sessionData) : null;
          const accessToken = parsed?.access_token;
          
          if (!accessToken) {
            throw new Error('No access token found in localStorage');
          }
          
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          
          if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL or key not configured');
          }
          
          const insertUrl = `${supabaseUrl}/rest/v1/expenses`;
          const payload = {
            user_id: userId,
            ...expense,
          };
          
          console.log('[useExpenses] 📡 Direct fetch URL:', insertUrl);
          console.log('[useExpenses] 📡 Payload:', payload);
          console.log('[useExpenses] 📡 Has access token:', !!accessToken);
          
          // Usa fetch diretto - questo DOVREBBE chiamare il global.fetch wrapper
          const response = await fetch(insertUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${accessToken}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(payload)
          });
          
          const fetchDuration = Date.now() - insertStartTime;
          console.log(`[useExpenses] ✅ Direct fetch completed in ${fetchDuration}ms - Status:`, response.status, response.statusText);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[useExpenses] ❌ Direct fetch error response:', errorText);
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { message: errorText };
            }
            throw new Error(`Insert failed: ${response.status} ${errorData.message || errorText}`);
          }
          
          const dataArray = await response.json();
          const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;
          
          const totalDuration = Date.now() - insertStartTime;
          console.log(`[useExpenses] ✅ Expense created successfully in ${totalDuration}ms! Data:`, data);
          return data;
        } catch (insertError: any) {
          const insertDuration = Date.now() - insertStartTime;
          console.error(`[useExpenses] ❌ INSERT exception after ${insertDuration}ms:`, insertError);
          console.error('[useExpenses] Error type:', insertError?.constructor?.name);
          console.error('[useExpenses] Error message:', insertError?.message);
          console.error('[useExpenses] Error name:', insertError?.name);
          console.error('[useExpenses] Error code:', insertError?.code);
          if (insertError?.stack) {
            console.error('[useExpenses] Error stack:', insertError.stack);
          }
          throw insertError;
        }
      } catch (error: any) {
        console.error('[useExpenses] Exception in mutationFn:', error);
        console.error('[useExpenses] Error name:', error?.name);
        console.error('[useExpenses] Error message:', error?.message);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('[useExpenses] Expense created, updating cache and emitting event');
      
      // Optimistic update: aggiorna cache immediatamente (più veloce di invalidate)
      queryClient.setQueryData(['expenses'], (old: Expense[] | undefined) => {
        if (!old) return [data];
        // Evita duplicati
        if (old.some(e => e.id === data.id)) return old;
        return [data, ...old];
      });
      
      // Aggiorna anche dashboard-expenses se esiste
      queryClient.setQueryData(['dashboard-expenses'], (old: Expense[] | undefined) => {
        if (!old) return [data];
        if (old.some(e => e.id === data.id)) return old;
        return [data, ...old];
      });
      
      // Persist updated cache offline
      const next = (queryClient.getQueryData(['expenses']) as Expense[]) || [];
      saveCache('expenses', next);
      
      // Sync con StateManager
      const current = stateManager.getStateKey('transactions');
      stateManager.setState('transactions', [data, ...current]);
      
      // Emit event per real-time updates
      eventBus.emit(Events.TRANSACTION_CREATED, data);
      
      toast.success('Transaction added successfully!');
    },
    onError: () => {
      toast.error('Failed to add transaction');
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Expense> & { id: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidare tutte le query correlate per sincronizzazione
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-expenses'] });
      // Sync con StateManager
      const current = stateManager.getStateKey('transactions');
      const updated = current.map((t: any) => t.id === data.id ? data : t);
      stateManager.setState('transactions', updated);
      toast.success('Transaction updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update transaction');
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      // Invalidare tutte le query correlate per sincronizzazione
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-expenses'] });
      // Sync con StateManager
      const current = stateManager.getStateKey('transactions');
      const filtered = current.filter((t: any) => t.id !== deletedId);
      stateManager.setState('transactions', filtered);
      toast.success('Transaction deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete transaction');
    },
  });

  // Wrapper functions that return Promises
  const createExpenseAsync = async (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    console.log('[useExpenses] createExpenseAsync called with:', expense);
    console.log('[useExpenses] createExpense object:', createExpense);
    console.log('[useExpenses] createExpense type:', typeof createExpense);
    console.log('[useExpenses] createExpense.mutate:', typeof createExpense?.mutate);
    console.log('[useExpenses] createExpense.mutateAsync:', typeof (createExpense as any)?.mutateAsync);
    
    // Usa mutateAsync se disponibile (React Query v5)
    const hasMutateAsync = 'mutateAsync' in createExpense && typeof (createExpense as any).mutateAsync === 'function';
    console.log('[useExpenses] hasMutateAsync:', hasMutateAsync);
    
    if (hasMutateAsync) {
      try {
        console.log('[useExpenses] Using mutateAsync');
        const result = await (createExpense as any).mutateAsync(expense);
        console.log('[useExpenses] Mutation completed via mutateAsync:', result);
        return result;
      } catch (error) {
        console.error('[useExpenses] mutateAsync failed:', error);
        throw error;
      }
    }
    
    // Fallback: wrapper manuale con timeout e gestione errori migliorata
    console.log('[useExpenses] Using manual wrapper');
    return new Promise((resolve, reject) => {
      let resolved = false;
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.error('[useExpenses] Mutation timeout after 15s');
          reject(new Error('Mutation timeout after 15 seconds'));
        }
      }, 15000);
      
      console.log('[useExpenses] Calling createExpense.mutate with expense:', expense);
      console.log('[useExpenses] createExpense.mutate exists:', !!createExpense?.mutate);
      
      if (!createExpense?.mutate) {
        resolved = true;
        clearTimeout(timeout);
        const error = new Error('createExpense.mutate is not available');
        console.error('[useExpenses]', error);
        reject(error);
        return;
      }
      
      try {
        createExpense.mutate(expense, {
          onSuccess: (data: any) => {
            console.log('[useExpenses] onSuccess callback called with data:', data);
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              console.log('[useExpenses] Mutation success in wrapper, resolving Promise');
              resolve(data);
            } else {
              console.warn('[useExpenses] onSuccess called but already resolved!');
            }
          },
          onError: (error: any) => {
            console.error('[useExpenses] onError callback called with error:', error);
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              console.error('[useExpenses] Mutation error in wrapper, rejecting Promise');
              reject(error);
            } else {
              console.warn('[useExpenses] onError called but already resolved!');
            }
          },
        });
      } catch (mutateError) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.error('[useExpenses] Error calling mutate:', mutateError);
          reject(mutateError);
        }
      }
    });
  };

  const updateExpenseAsync = async (updates: Partial<Expense> & { id: string }) => {
    return new Promise((resolve, reject) => {
      updateExpense.mutate(updates, {
        onSuccess: (data) => resolve(data),
        onError: (error) => reject(error),
      });
    });
  };

  const deleteExpenseAsync = async (id: string) => {
    return new Promise((resolve, reject) => {
      deleteExpense.mutate(id, {
        onSuccess: () => resolve(undefined),
        onError: (error) => reject(error),
      });
    });
  };

  return {
    expenses: expenses || [],
    isLoading,
    // Usa sempre il wrapper async per garantire Promise affidabili
    createExpense: createExpenseAsync,
    updateExpense: updateExpenseAsync,
    deleteExpense: deleteExpenseAsync,
  };
};