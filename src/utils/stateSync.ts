import { useEffect, useCallback } from 'react';

interface StateSyncOptions {
  key: string;
  onUpdate?: (data: any) => void;
  debounceMs?: number;
}

export const useStateSync = ({ key, onUpdate, debounceMs = 300 }: StateSyncOptions) => {
  const saveState = useCallback((data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }, [key]);

  const loadState = useCallback(() => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load state:', error);
      return null;
    }
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          const newData = JSON.parse(event.newValue);
          onUpdate?.(newData);
        } catch (error) {
          console.error('Failed to parse state update:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, onUpdate]);

  return {
    saveState,
    loadState,
  };
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}; 