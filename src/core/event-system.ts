// Global Event System - Cross-component communication
type EventHandler<T = any> = (payload: T) => void;
type EventMap = Record<string, EventHandler[]>;

class EventBus {
  private listeners: EventMap = {};

  /**
   * Emit an event to all listeners
   */
  emit<T = any>(event: string, payload?: T): void {
    const handlers = this.listeners[event];
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`[EventBus] Error in handler for ${event}:`, error);
        }
      });
    }

    // Also emit to wildcard listeners
    const wildcardHandlers = this.listeners['*'];
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => {
        try {
          handler({ event, payload });
        } catch (error) {
          console.error(`[EventBus] Error in wildcard handler:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to an event
   * Returns unsubscribe function
   */
  on<T = any>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.listeners[event]?.indexOf(handler);
      if (index !== undefined && index > -1) {
        this.listeners[event].splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to an event once
   */
  once<T = any>(event: string, handler: EventHandler<T>): void {
    const unsubscribe = this.on(event, (payload: T) => {
      handler(payload);
      unsubscribe();
    });
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners[event];
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: string): number {
    return this.listeners[event]?.length || 0;
  }
}

// Export singleton instance
export const eventBus = new EventBus();

// Predefined event types for type safety
export const Events = {
  // Transaction events
  TRANSACTION_CREATED: 'transaction:created',
  TRANSACTION_UPDATED: 'transaction:updated',
  TRANSACTION_DELETED: 'transaction:deleted',
  
  // Investment events
  INVESTMENT_CREATED: 'investment:created',
  INVESTMENT_UPDATED: 'investment:updated',
  INVESTMENT_DELETED: 'investment:deleted',
  
  // Goal events
  GOAL_CREATED: 'goal:created',
  GOAL_UPDATED: 'goal:updated',
  GOAL_DELETED: 'goal:deleted',
  
  // Filter events
  FILTER_CHANGED: 'filter:changed',
  FILTER_RESET: 'filter:reset',
  
  // Chart events
  CHART_REFRESH: 'chart:refresh',
  CHART_DATA_UPDATED: 'chart:data:updated',
  
  // Modal events
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  
  // Form events
  FORM_SUBMIT: 'form:submit',
  FORM_RESET: 'form:reset',
  FORM_VALIDATION_ERROR: 'form:validation:error',
  
  // State events
  STATE_CHANGED: 'state:changed',
  STATE_SYNCED: 'state:synced',
  
  // UI events
  TAB_CHANGED: 'tab:changed',
  NOTIFICATION_SHOW: 'notification:show',
  TOAST_SHOW: 'toast:show',
} as const;



