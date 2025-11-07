import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { stateManager } from "@/core/state-manager";
import { saveCache, loadCache } from "@/lib/offlineCache";
import { useEffect } from "react";

export interface FinancialGoal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  goal_type: 'savings' | 'investment' | 'debt_payoff' | 'purchase' | 'emergency_fund' | 'retirement';
  linked_asset_type?: string;
  investment_link?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export const useFinancialGoals = () => {
  const queryClient = useQueryClient();

  const { data: goals, isLoading, error } = useQuery({
    queryKey: ['financial-goals'],
    queryFn: async (): Promise<FinancialGoal[]> => {
      console.log('[useFinancialGoals] Query started');
      
      // Global timeout to prevent infinite loading
      const timeoutPromise = new Promise<FinancialGoal[]>((_, reject) => 
        setTimeout(() => {
          console.warn('[useFinancialGoals] Query timeout after 10s');
          reject(new Error('Query timeout after 10s'));
        }, 10000)
      );
      
      const queryPromise = (async (): Promise<FinancialGoal[]> => {
        try {
          // Usa getUserIdSync() come fallback per evitare timeout
          const getUserIdSync = (): string | null => {
            try {
              const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
              if (!supabaseUrl) return null;
              const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
              const projectRef = urlMatch?.[1];
              const possibleKeys: string[] = [];
              if (projectRef) {
                possibleKeys.push(`sb-${projectRef}-auth-token`);
              }
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('supabase') || key.includes('sb-')) && 
                    (key.includes('auth') || key.includes('token'))) {
                  if (!possibleKeys.includes(key)) {
                    possibleKeys.push(key);
                  }
                }
              }
              for (const key of possibleKeys) {
                try {
                  const storedData = localStorage.getItem(key);
                  if (!storedData) continue;
                  const parsed = JSON.parse(storedData);
                  let userId = parsed?.user?.id || parsed?.currentSession?.user?.id || parsed?.session?.user?.id || parsed?.user_id;
                  if (userId) {
                    return userId;
                  }
                  const accessToken = parsed?.access_token || parsed?.session?.access_token;
                  if (accessToken && typeof accessToken === 'string') {
                    try {
                      const parts = accessToken.split('.');
                      if (parts.length === 3) {
                        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                        userId = payload?.sub || payload?.user_id || payload?.id || payload?.user?.id;
                        if (userId) return userId;
                      }
                    } catch {}
                  }
                } catch (e) {
                  continue;
                }
              }
              return null;
            } catch (e) {
              return null;
            }
          };
          
          let userId: string | null = getUserIdSync();
          
          if (!userId) {
            // Try async method with timeout
            try {
              const sessionResult = await Promise.race([
                supabase.auth.getSession(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('getSession timeout after 3s')), 3000)
                )
              ]) as any;
              userId = sessionResult?.data?.session?.user?.id;
            } catch (e: any) {
              console.warn('[useFinancialGoals] getSession() failed or timeout:', e?.message);
            }
          }
          
          if (!userId) {
            // Last try with getUser() with timeout
            try {
              const userResult = await Promise.race([
                supabase.auth.getUser(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('getUser timeout after 5s')), 5000)
                )
              ]) as any;
              userId = userResult?.data?.user?.id;
            } catch (e: any) {
              console.warn('[useFinancialGoals] getUser() failed or timeout:', e?.message);
            }
          }
          
          if (!userId) {
            console.log('[useFinancialGoals] No user, returning empty array');
            return [];
          }

          console.log(`[useFinancialGoals] Fetching goals for user: ${userId}`);
          const { data, error } = await supabase
            .from('financial_goals')
            .select('*')
            .eq('user_id', userId)
            .order('priority', { ascending: false })
            .order('deadline', { ascending: true })
            .limit(500); // Limite ragionevole per performance

          if (error) {
            console.error('[useFinancialGoals] Error fetching goals:', error);
            // Return empty array instead of throwing to avoid infinite loading
            return [];
          }
          
          console.log(`[useFinancialGoals] Fetched ${data?.length || 0} goals`);
          saveCache('financial-goals', data || []);
          return (data || []) as FinancialGoal[];
        } catch (error: any) {
          console.error('[useFinancialGoals] Exception in queryFn:', error);
          const cached = loadCache<FinancialGoal[]>('financial-goals');
          if (cached) {
            console.warn('[useFinancialGoals] Using cached goals (offline mode)');
            return cached;
          }
          return [];
        }
      })();
      
      try {
        const result = await Promise.race([queryPromise, timeoutPromise]);
        return result;
      } catch (timeoutError: any) {
        console.warn('[useFinancialGoals] Query timed out or failed, using cache if available');
        const cached = loadCache<FinancialGoal[]>('financial-goals');
        if (cached) return cached;
        return [];
      }
    },
    enabled: true,
    retry: 2, // Retry fino a 2 volte
    staleTime: 30 * 1000, // Considera i dati freschi per 30 secondi
    refetchOnWindowFocus: false, // Evita refetch automatico per migliorare UX
    refetchOnMount: true,
    gcTime: 5 * 60 * 1000, // Mantieni in cache per 5 minuti
  });

  useEffect(() => {
    if (error) {
      console.error('[useFinancialGoals] Query error:', error);
    }
  }, [error]);

  const createGoal = useMutation({
    mutationFn: async (goal: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      console.log('[useFinancialGoals] mutationFn STARTED with goal:', goal);
      
      try {
        // Usa la stessa funzione getUserIdSync della query
        const getUserIdSync = (): string | null => {
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            if (!supabaseUrl) return null;
            const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
            const projectRef = urlMatch?.[1];
            const possibleKeys: string[] = [];
            if (projectRef) {
              possibleKeys.push(`sb-${projectRef}-auth-token`);
            }
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.includes('supabase') || key.includes('sb-')) && 
                  (key.includes('auth') || key.includes('token'))) {
                if (!possibleKeys.includes(key)) {
                  possibleKeys.push(key);
                }
              }
            }
            for (const key of possibleKeys) {
              try {
                const storedData = localStorage.getItem(key);
                if (!storedData) continue;
                const parsed = JSON.parse(storedData);
                let userId = parsed?.user?.id || parsed?.currentSession?.user?.id || parsed?.session?.user?.id || parsed?.user_id;
                if (userId) {
                  console.log('[useFinancialGoals] ✅ Found user ID in key:', key, 'userId:', userId);
                  return userId;
                }
                const accessToken = parsed?.access_token || parsed?.session?.access_token;
                if (accessToken && typeof accessToken === 'string') {
                  try {
                    const parts = accessToken.split('.');
                    if (parts.length === 3) {
                      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                      userId = payload?.sub || payload?.user_id || payload?.id || payload?.user?.id;
                      if (userId) {
                        console.log('[useFinancialGoals] ✅ Found user ID in JWT token from key:', key, 'userId:', userId);
                        return userId;
                      }
                    }
                  } catch {}
                }
              } catch (e) {
                continue;
              }
            }
            return null;
          } catch (e) {
            return null;
          }
        };
        
        console.log('[useFinancialGoals] 🔍 Getting user ID from localStorage (sync)...');
        let userId = getUserIdSync();
        
        if (!userId) {
          console.warn('[useFinancialGoals] ⚠️ User ID not found in localStorage, will try async methods');
        }
        
        if (!userId) {
          console.log('[useFinancialGoals] User ID not in localStorage, trying getSession() with 3s timeout...');
          try {
            const sessionResult = await Promise.race([
              supabase.auth.getSession(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('getSession timeout after 3s')), 3000)
              )
            ]) as any;
            userId = sessionResult?.data?.session?.user?.id;
          } catch (e: any) {
            console.warn('[useFinancialGoals] getSession() failed or timeout:', e?.message);
          }
        }
        
        if (!userId) {
          console.log('[useFinancialGoals] Still no user ID, trying getUser() with 5s timeout...');
          try {
            const userResult = await Promise.race([
              supabase.auth.getUser(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('getUser timeout after 5s')), 5000)
              )
            ]) as any;
            userId = userResult?.data?.user?.id;
          } catch (e: any) {
            console.warn('[useFinancialGoals] getUser() failed or timeout:', e?.message);
          }
        }
        
        console.log('[useFinancialGoals] Auth check - userId:', userId);
        
        if (!userId) {
          console.error('[useFinancialGoals] Auth failed - no user ID found');
          throw new Error('Not authenticated. Please log in again.');
        }

        console.log('[useFinancialGoals] Creating goal for user:', userId, 'goal data:', goal);
        console.log('[useFinancialGoals] 🔧 Using DIRECT fetch call to bypass PostgREST builder...');
        
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
        
        const insertUrl = `${supabaseUrl}/rest/v1/financial_goals`;
        const payload = {
          user_id: userId,
          ...goal,
        };
        
        console.log('[useFinancialGoals] 📡 Direct fetch URL:', insertUrl);
        console.log('[useFinancialGoals] 📡 Payload:', payload);
        console.log('[useFinancialGoals] 📡 Has access token:', !!accessToken);
        
        const insertStartTime = Date.now();
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
        console.log(`[useFinancialGoals] ✅ Direct fetch completed in ${fetchDuration}ms - Status:`, response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[useFinancialGoals] ❌ Direct fetch error response:', errorText);
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
        console.log(`[useFinancialGoals] ✅ Goal created successfully in ${totalDuration}ms! Data:`, data);
        return data;
      } catch (insertError: any) {
        console.error('[useFinancialGoals] ❌ INSERT exception:', insertError);
        console.error('[useFinancialGoals] Error type:', insertError?.constructor?.name);
        console.error('[useFinancialGoals] Error message:', insertError?.message);
        throw insertError;
      }
    },
    onSuccess: (data) => {
      // Optimistic update: aggiungi direttamente alla cache invece di invalidare (che triggera refetch che va in timeout)
      queryClient.setQueryData<FinancialGoal[]>(['financial-goals'], (oldData = []) => {
        // Evita duplicati
        const exists = oldData.some(g => g.id === data.id);
        if (exists) {
          console.log('[useFinancialGoals] Goal already in cache, skipping duplicate');
          return oldData;
        }
        console.log('[useFinancialGoals] Adding new goal to cache:', data.id);
        return [data, ...oldData];
      });
      
      // Sync con StateManager
      const current = stateManager.getStateKey('goals');
      stateManager.setState('goals', [data, ...current]);
      
      // Persist updated cache offline
      const next = (queryClient.getQueryData(['financial-goals']) as FinancialGoal[]) || [];
      saveCache('financial-goals', next);

      toast.success('Goal created successfully!');
    },
    onError: () => {
      toast.error('Failed to create goal');
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialGoal> & { id: string }) => {
      const { data, error } = await supabase
        .from('financial_goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      // Sync con StateManager
      const current = stateManager.getStateKey('goals');
      const updated = current.map((goal: any) => goal.id === data.id ? data : goal);
      stateManager.setState('goals', updated);
      toast.success('Goal updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update goal');
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      // Sync con StateManager
      const current = stateManager.getStateKey('goals');
      const filtered = current.filter((goal: any) => goal.id !== deletedId);
      stateManager.setState('goals', filtered);
      toast.success('Goal deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete goal');
    },
  });

  // Wrapper functions that return Promises
  const createGoalAsync = async (goal: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('[useFinancialGoals] createGoalAsync called');
      
      // Usa mutateAsync se disponibile
      if (createGoal.mutateAsync) {
        return await createGoal.mutateAsync(goal);
      }
      
      // Fallback: wrapper manuale
      return new Promise((resolve, reject) => {
        let resolved = false;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            reject(new Error('Mutation timeout after 15 seconds'));
          }
        }, 15000);
        
        createGoal.mutate(goal, {
          onSuccess: (data) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(data);
            }
          },
          onError: (error: any) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              reject(error);
            }
          },
        });
      });
    } catch (error) {
      console.error('[useFinancialGoals] createGoalAsync exception:', error);
      throw error;
    }
  };

  const updateGoalAsync = async (updates: Partial<FinancialGoal> & { id: string }) => {
    return new Promise((resolve, reject) => {
      updateGoal.mutate(updates, {
        onSuccess: (data) => resolve(data),
        onError: (error) => reject(error),
      });
    });
  };

  const deleteGoalAsync = async (id: string) => {
    return new Promise((resolve, reject) => {
      deleteGoal.mutate(id, {
        onSuccess: () => resolve(undefined),
        onError: (error) => reject(error),
      });
    });
  };

  return {
    goals: goals || [],
    isLoading,
    createGoal: createGoalAsync,
    updateGoal: updateGoalAsync,
    deleteGoal: deleteGoalAsync,
  };
};