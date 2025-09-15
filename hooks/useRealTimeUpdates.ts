import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';

interface UpdateEvent {
  type: 'match' | 'league' | 'video' | 'featured';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

// Global event emitter for real-time updates
class EventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, data: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
}

const globalEmitter = new EventEmitter();

export function useRealTimeUpdates() {
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const triggerUpdate = useCallback((event: UpdateEvent) => {
    setLastUpdate(Date.now());
    globalEmitter.emit('dreamlive-update', event);
    
    // Also try to broadcast via custom event for web compatibility
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('dreamlive-update', { detail: event }));
      } catch (error) {
        console.warn('Failed to dispatch custom event:', error);
      }
    }
  }, []);

  const subscribeToUpdates = useCallback((callback: (event: UpdateEvent) => void) => {
    globalEmitter.on('dreamlive-update', callback);
    
    // Also listen for custom events on web
    const handleCustomEvent = (event: CustomEvent<UpdateEvent>) => {
      callback(event.detail);
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        window.addEventListener('dreamlive-update', handleCustomEvent as EventListener);
      } catch (error) {
        console.warn('Failed to add event listener:', error);
      }
    }

    return () => {
      globalEmitter.off('dreamlive-update', callback);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          window.removeEventListener('dreamlive-update', handleCustomEvent as EventListener);
        } catch (error) {
          console.warn('Failed to remove event listener:', error);
        }
      }
    };
  }, []);

  return {
    lastUpdate,
    triggerUpdate,
    subscribeToUpdates
  };
}

export function useAutoRefresh(refreshCallback: () => Promise<void>, dependencies: any[] = []) {
  const { subscribeToUpdates } = useRealTimeUpdates();

  useEffect(() => {
    // Only set up auto-refresh if dependencies are valid
    if (dependencies.some(dep => dep === false || dep === null || dep === undefined)) {
      console.log('Skipping auto-refresh setup - invalid dependencies');
      return;
    }

    const unsubscribe = subscribeToUpdates(async (event) => {
      console.log('Auto-refreshing due to update:', event.type, event.action);
      try {
        await refreshCallback();
      } catch (error) {
        console.error('Error during auto-refresh:', error);
      }
    });

    return unsubscribe;
  }, dependencies);
}