import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { saveCache, loadCache } from "@/lib/offlineCache";
import { toast } from "sonner";
import { stateManager } from "@/core/state-manager";

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: string;
  category: string;
  symbol?: string;
  purchase_price: number;
  current_price: number;
  quantity: number;
  sector?: string;
  notes?: string;
  purchase_date?: string;
  live_tracking: boolean;
  created_at: string;
  updated_at: string;
}

export const useInvestments = () => {
  const queryClient = useQueryClient();
  const { data: investments, isLoading } = useQuery({
    queryKey: ['investments'],
    queryFn: async (): Promise<Investment[]> => {
      console.log('[useInvestments] Query started');
      
      // Global timeout to prevent infinite loading
      const timeoutPromise = new Promise<Investment[]>((_, reject) => 
        setTimeout(() => {
          console.warn('[useInvestments] Query timeout after 10s');
          reject(new Error('Query timeout after 10s'));
        }, 10000)
      );
      
      const queryPromise = (async (): Promise<Investment[]> => {
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
              console.warn('[useInvestments] getSession() failed or timeout:', e?.message);
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
              console.warn('[useInvestments] getUser() failed or timeout:', e?.message);
            }
          }
          
          if (!userId) {
            console.log('[useInvestments] No authenticated user found');
            return [];
          }

          console.log(`[useInvestments] Fetching investments for user: ${userId}`);
          const { data, error } = await supabase
            .from('investments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(500);

          if (error) {
            console.error('[useInvestments] Error fetching investments:', error);
            const cached = loadCache<Investment[]>('investments');
            if (cached) {
              console.warn('[useInvestments] Using cached investments (offline mode)');
              return cached;
            }
            return [];
          }
          
          console.log(`[useInvestments] Fetched ${data?.length || 0} investments for user ${userId}`);
          saveCache('investments', data || []);
          return (data || []) as Investment[];
        } catch (error: any) {
          console.error('[useInvestments] Exception in queryFn:', error);
          const cached = loadCache<Investment[]>('investments');
          if (cached) {
            console.warn('[useInvestments] Using cached investments (offline mode)');
            return cached;
          }
          return [];
        }
      })();
      
      try {
        const result = await Promise.race([queryPromise, timeoutPromise]);
        return result;
      } catch (timeoutError: any) {
        console.warn('[useInvestments] Query timed out or failed, using cache if available');
        const cached = loadCache<Investment[]>('investments');
        if (cached) return cached;
        return [];
      }
    },
    retry: 0, // Disable retry to avoid waiting - timeout already handles it
    staleTime: 30 * 1000, // Considera i dati freschi per 30 secondi
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    gcTime: 5 * 60 * 1000, // Mantieni in cache per 5 minuti
  });

  const totalValue = investments?.reduce((sum, inv) => {
    return sum + (inv.current_price * inv.quantity);
  }, 0) || 0;

  const totalCost = investments?.reduce((sum, inv) => {
    return sum + (inv.purchase_price * inv.quantity);
  }, 0) || 0;

  const totalGain = totalValue - totalCost;
  const gainPercentage = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const predictGrowth = (amount: number, months: number = 12) => {
    const monthlyRate = 0.08 / 12; // 8% annual return
    return amount * Math.pow(1 + monthlyRate, months);
  };

  const createInvestment = useMutation({
    mutationFn: async (investment: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      console.log('[useInvestments] mutationFn STARTED with investment:', investment);
      
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
                  console.log('[useInvestments] ✅ Found user ID in key:', key, 'userId:', userId);
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
                        console.log('[useInvestments] ✅ Found user ID in JWT token from key:', key, 'userId:', userId);
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
        
        console.log('[useInvestments] 🔍 Getting user ID from localStorage (sync)...');
        let userId = getUserIdSync();
        
        if (!userId) {
          console.warn('[useInvestments] ⚠️ User ID not found in localStorage, will try async methods');
        }
        
        if (!userId) {
          console.log('[useInvestments] User ID not in localStorage, trying getSession() with 3s timeout...');
          try {
            const sessionResult = await Promise.race([
              supabase.auth.getSession(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('getSession timeout after 3s')), 3000)
              )
            ]) as any;
            userId = sessionResult?.data?.session?.user?.id;
          } catch (e: any) {
            console.warn('[useInvestments] getSession() failed or timeout:', e?.message);
          }
        }
        
        if (!userId) {
          console.log('[useInvestments] Still no user ID, trying getUser() with 5s timeout...');
          try {
            const userResult = await Promise.race([
              supabase.auth.getUser(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('getUser timeout after 5s')), 5000)
              )
            ]) as any;
            userId = userResult?.data?.user?.id;
          } catch (e: any) {
            console.warn('[useInvestments] getUser() failed or timeout:', e?.message);
          }
        }
        
        console.log('[useInvestments] Auth check - userId:', userId);
        
        if (!userId) {
          console.error('[useInvestments] Auth failed - no user ID found');
          throw new Error('Not authenticated. Please log in again.');
        }

        console.log('[useInvestments] Creating investment for user:', userId, 'investment data:', investment);
        console.log('[useInvestments] 🔧 Using DIRECT fetch call to bypass PostgREST builder...');
        
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
        
        const insertUrl = `${supabaseUrl}/rest/v1/investments`;
        const payload = {
          user_id: userId,
          ...investment,
        };
        
        console.log('[useInvestments] 📡 Direct fetch URL:', insertUrl);
        console.log('[useInvestments] 📡 Payload:', payload);
        console.log('[useInvestments] 📡 Has access token:', !!accessToken);
        
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
        console.log(`[useInvestments] ✅ Direct fetch completed in ${fetchDuration}ms - Status:`, response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[useInvestments] ❌ Direct fetch error response:', errorText);
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
        console.log(`[useInvestments] ✅ Investment created successfully in ${totalDuration}ms! Data:`, data);
        return data;
      } catch (insertError: any) {
        console.error('[useInvestments] ❌ INSERT exception:', insertError);
        console.error('[useInvestments] Error type:', insertError?.constructor?.name);
        console.error('[useInvestments] Error message:', insertError?.message);
        throw insertError;
      }
    },
    onSuccess: (data) => {
      // Optimistic update: aggiungi direttamente alla cache invece di invalidare (che triggera refetch che va in timeout)
      queryClient.setQueryData<Investment[]>(['investments'], (oldData = []) => {
        // Evita duplicati
        const exists = oldData.some(inv => inv.id === data.id);
        if (exists) {
          console.log('[useInvestments] Investment already in cache, skipping duplicate');
          return oldData;
        }
        console.log('[useInvestments] Adding new investment to cache:', data.id);
        return [data, ...oldData];
      });
      // Persist updated cache offline
      const next = (queryClient.getQueryData(['investments']) as Investment[]) || [];
      saveCache('investments', next);
      
      // Sync con StateManager
      const current = stateManager.getStateKey('investments');
      stateManager.setState('investments', [data, ...current]);
      
      toast.success('Investment added successfully!');
    },
    onError: () => {
      toast.error('Failed to add investment');
    },
  });

  const updateInvestment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Investment> & { id: string }) => {
      const { data, error } = await supabase
        .from('investments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      // Sync con StateManager
      const current = stateManager.getStateKey('investments');
      const updated = current.map((inv: any) => inv.id === data.id ? data : inv);
      stateManager.setState('investments', updated);
      toast.success('Investment updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update investment');
    },
  });

  const deleteInvestment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onMutate: async (deletedId: string) => {
      await queryClient.cancelQueries({ queryKey: ['investments'] });
      const previous = queryClient.getQueryData<Investment[]>(['investments']) || [];
      const next = previous.filter(inv => inv.id !== deletedId);
      queryClient.setQueryData(['investments'], next);
      saveCache('investments', next);
      const current = stateManager.getStateKey('investments');
      stateManager.setState('investments', current.filter((inv: any) => inv.id !== deletedId));
      return { previous };
    },
    onError: (err, deletedId, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(['investments'], ctx.previous);
        saveCache('investments', ctx.previous);
      }
      toast.error('Failed to delete investment');
    },
    onSuccess: () => {
      // Cache già aggiornata in onMutate; invalidazione soft opzionale
      // queryClient.invalidateQueries({ queryKey: ['investments'], refetchType: 'inactive' });
      toast.success('Investment deleted successfully!');
    },
  });

  // Wrapper functions that return Promises
  const createInvestmentAsync = async (investment: Omit<Investment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('[useInvestments] createInvestmentAsync called');
      
      // Usa mutateAsync se disponibile
      if (createInvestment.mutateAsync) {
        return await createInvestment.mutateAsync(investment);
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
        
        createInvestment.mutate(investment, {
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
      console.error('[useInvestments] createInvestmentAsync exception:', error);
      throw error;
    }
  };

  const updateInvestmentAsync = async (updates: Partial<Investment> & { id: string }) => {
    return new Promise((resolve, reject) => {
      updateInvestment.mutate(updates, {
        onSuccess: (data) => resolve(data),
        onError: (error) => reject(error),
      });
    });
  };

  const deleteInvestmentAsync = async (id: string) => {
    return new Promise((resolve, reject) => {
      deleteInvestment.mutate(id, {
        onSuccess: () => resolve(undefined),
        onError: (error) => reject(error),
      });
    });
  };

  return {
    investments: investments || [],
    isLoading,
    totalValue,
    totalCost,
    totalGain,
    gainPercentage,
    predictGrowth,
    createInvestment: createInvestmentAsync,
    updateInvestment: updateInvestmentAsync,
    deleteInvestment: deleteInvestmentAsync,
  };
};
