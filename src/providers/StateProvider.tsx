import { useEffect, ReactNode } from 'react';
import { stateManager, setQueryClient } from '@/core/state-manager';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Provider per inizializzare e gestire lo StateManager
 * Deve essere avvolto attorno all'app principale DENTRO QueryClientProvider in App.tsx
 */
export function StateProvider({ children }: { children: ReactNode }) {
  // useQueryClient DEVE essere dentro QueryClientProvider (già lo è in App.tsx)
  const queryClient = useQueryClient();

  // Imposta il queryClient nello StateManager
  useEffect(() => {
    try {
      setQueryClient(queryClient);
      console.log('[StateProvider] QueryClient set successfully');
    } catch (error) {
      console.error('[StateProvider] Error setting queryClient:', error);
    }
  }, [queryClient]);

  // Sync iniziale al mount (dopo che queryClient è disponibile)
  useEffect(() => {
    const initSync = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.log('[StateProvider] Auth error:', userError);
          return;
        }
        if (user) {
          console.log('[StateProvider] Initial sync for authenticated user');
          await stateManager.syncFromSupabase().catch(err => {
            console.error('[StateProvider] Sync error (non-critical):', err);
          });
        } else {
          console.log('[StateProvider] No user, resetting state');
          stateManager.reset();
        }
      } catch (error) {
        console.error('[StateProvider] Error in initial sync:', error);
        // Non bloccare il rendering dell'app per errori di sync
      }
    };

    // Delay iniziale per assicurarsi che tutto sia inizializzato
    const timeoutId = setTimeout(initSync, 200);
    return () => clearTimeout(timeoutId);
  }, []);

  // Sync su auth change
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          try {
            console.log('[StateProvider] Auth state changed:', event);
            if (event === 'SIGNED_IN' && session) {
              await stateManager.syncFromSupabase().catch(err => {
                console.error('[StateProvider] Sync error after SIGNED_IN:', err);
              });
            } else if (event === 'SIGNED_OUT') {
              stateManager.reset();
            } else if (event === 'TOKEN_REFRESHED' && session) {
              // Refresh silenzioso, non serve reset completo
              await stateManager.syncFromSupabase().catch(err => {
                console.error('[StateProvider] Sync error after TOKEN_REFRESHED:', err);
              });
            }
          } catch (error) {
            console.error('[StateProvider] Error in auth change handler:', error);
          }
        }
      );
      subscription = sub;
    } catch (error) {
      console.error('[StateProvider] Error setting up auth listener:', error);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return <>{children}</>;
}

