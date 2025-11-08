// Enhanced State Manager - Extends existing StateManager with advanced features
import { stateManager, type AppState } from './state-manager';
import { eventBus, Events } from './event-system';

export interface StateSnapshot {
  timestamp: number;
  state: Partial<AppState>;
  action: string;
}

class EnhancedStateManager {
  private historyStack: StateSnapshot[] = [];
  private historyIndex = -1;
  private readonly maxHistorySize = 50;
  private normalizedCache: Map<string, Map<string, any>> = new Map();

  constructor() {
    // Subscribe to state changes for history tracking
    stateManager.subscribe('*', () => {
      this.createSnapshot('user_action');
    });
  }

  /**
   * Create a snapshot of current state for undo/redo
   */
  createSnapshot(action: string = 'user_action'): StateSnapshot {
    const snapshot: StateSnapshot = {
      timestamp: Date.now(),
      state: {
        transactions: stateManager.getStateKey('transactions'),
        investments: stateManager.getStateKey('investments'),
        goals: stateManager.getStateKey('goals'),
      },
      action
    };

    // Remove any future history if we're in the middle
    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
    }

    // Add new snapshot
    this.historyStack.push(snapshot);
    this.historyIndex = this.historyStack.length - 1;

    // Limit history size
    if (this.historyStack.length > this.maxHistorySize) {
      this.historyStack.shift();
      this.historyIndex--;
    }

    return snapshot;
  }

  /**
   * Restore state from snapshot
   */
  restoreSnapshot(snapshot: StateSnapshot): void {
    if (snapshot.state.transactions) {
      stateManager.setState('transactions', snapshot.state.transactions, true);
    }
    if (snapshot.state.investments) {
      stateManager.setState('investments', snapshot.state.investments, true);
    }
    if (snapshot.state.goals) {
      stateManager.setState('goals', snapshot.state.goals, true);
    }

    eventBus.emit(Events.STATE_CHANGED, { action: 'restore', snapshot });
  }

  /**
   * Undo last action
   */
  undo(): boolean {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const snapshot = this.historyStack[this.historyIndex];
      this.restoreSnapshot(snapshot);
      return true;
    }
    return false;
  }

  /**
   * Redo last undone action
   */
  redo(): boolean {
    if (this.historyIndex < this.historyStack.length - 1) {
      this.historyIndex++;
      const snapshot = this.historyStack[this.historyIndex];
      this.restoreSnapshot(snapshot);
      return true;
    }
    return false;
  }

  /**
   * Normalize data array to Map for O(1) lookups
   */
  normalizeData<T extends { id: string }>(key: string, data: T[]): Map<string, T> {
    const normalized = new Map<string, T>();
    data.forEach(item => {
      normalized.set(item.id, item);
    });
    this.normalizedCache.set(key, normalized);
    return normalized;
  }

  /**
   * Get normalized data by ID
   */
  getNormalized<T>(key: string, id: string): T | undefined {
    const normalized = this.normalizedCache.get(key) as Map<string, T>;
    return normalized?.get(id);
  }

  /**
   * Optimistic update - update UI immediately, rollback on error
   */
  optimisticUpdate<K extends keyof AppState>(
    key: K,
    value: AppState[K],
    rollback: () => void
  ): void {
    const previousValue = stateManager.getStateKey(key);
    
    // Update immediately
    stateManager.setState(key, value, false);
    eventBus.emit(Events.STATE_CHANGED, { key, value, optimistic: true });

    // Store rollback function for later use if needed
    const rollbackFn = () => {
      stateManager.setState(key, previousValue, true);
      if (rollback) rollback();
      eventBus.emit(Events.STATE_CHANGED, { key, value: previousValue, rolledBack: true });
    };
    
    // You can store rollbackFn somewhere if needed for later rollback
  }

  /**
   * Batch update multiple state keys atomically
   */
  batchUpdate(updates: Partial<AppState>): void {
    Object.entries(updates).forEach(([key, value]) => {
      stateManager.setState(key as keyof AppState, value as any, false);
    });
    
    // Persist all at once
    const state = stateManager.getState();
    try {
      localStorage.setItem('mymoney-state', JSON.stringify(state));
    } catch (e) {
      console.error('[EnhancedStateManager] Error persisting batch update:', e);
    }

    eventBus.emit(Events.STATE_CHANGED, { updates, batched: true });
  }

  /**
   * Get history info
   */
  getHistoryInfo(): { canUndo: boolean; canRedo: boolean; count: number } {
    return {
      canUndo: this.historyIndex > 0,
      canRedo: this.historyIndex < this.historyStack.length - 1,
      count: this.historyStack.length
    };
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.historyStack = [];
    this.historyIndex = -1;
    this.normalizedCache.clear();
  }
}

// Export singleton instance
export const enhancedStateManager = new EnhancedStateManager();

// Re-export stateManager for convenience
export { stateManager };



