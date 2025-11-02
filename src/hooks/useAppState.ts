import { useState, useEffect, useCallback } from 'react';
import { stateManager, AppState } from '@/core/state-manager';

/**
 * Hook per accedere e modificare uno specifico campo dello stato
 * @param key - La chiave dello stato da accedere
 * @returns [value, updateValue] - Valore corrente e funzione per aggiornarlo
 */
export function useAppState<K extends keyof AppState>(key: K) {
  const [value, setValue] = useState<AppState[K]>(() => 
    stateManager.getStateKey(key)
  );

  useEffect(() => {
    const unsubscribe = stateManager.subscribe(key, () => {
      const newValue = stateManager.getStateKey(key);
      setValue(newValue);
    });

    return unsubscribe;
  }, [key]);

  const updateValue = useCallback((newValue: AppState[K]) => {
    stateManager.setState(key, newValue);
  }, [key]);

  return [value, updateValue] as const;
}

/**
 * Hook per accedere all'intero stato globale
 * @returns {state, stateManager} - Stato completo e istanza del manager
 */
export function useGlobalState() {
  const [state, setState] = useState<AppState>(() => stateManager.getState());

  useEffect(() => {
    const unsubscribe = stateManager.subscribe('*', () => {
      setState(stateManager.getState());
    });

    return unsubscribe;
  }, []);

  return { state, stateManager };
}

/**
 * Hook per accedere alle preferenze utente
 */
export function useUserPreferences() {
  const [user] = useAppState('user');
  
  const updatePreferences = useCallback((preferences: Partial<AppState['user']['preferences']>) => {
    stateManager.setState('user', {
      ...user,
      preferences: {
        ...user.preferences,
        ...preferences
      }
    });
    // Sync immediato con Supabase
    stateManager.syncToSupabase();
  }, [user]);

  return {
    preferences: user.preferences,
    updatePreferences
  };
}

/**
 * Hook per sincronizzare manualmente con Supabase
 */
export function useStateSync() {
  const sync = useCallback(async () => {
    await stateManager.syncFromSupabase();
  }, []);

  return { sync };
}

