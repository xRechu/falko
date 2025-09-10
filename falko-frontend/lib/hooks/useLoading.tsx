'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  loadingStates: Record<string, boolean>;
  setPageLoading: (page: string, loading: boolean) => void;
  isPageLoading: (page: string) => boolean;
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [globalLoading, setGlobalLoadingState] = useState(true); // Start z loading=true
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Global loading: hide on full window load, with safety timeout fallback
  useEffect(() => {
    let timeoutId: any;
    const hide = () => setGlobalLoadingState(false);

    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        // Already fully loaded
        hide();
      } else {
        window.addEventListener('load', hide, { once: true });
        // Safety fallback to avoid locking the overlay forever (e.g.,  assets blocked)
        timeoutId = setTimeout(hide, 7000); // 7s max
      }
    } else {
      // SSR fallback
      setGlobalLoadingState(false);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('load', hide as any);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setPageLoading = useCallback((page: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [page]: loading
    }));
  }, []);

  const isPageLoading = useCallback((page: string) => {
    return loadingStates[page] || false;
  }, [loadingStates]);

  const setGlobalLoading = useCallback((loading: boolean) => {
    setGlobalLoadingState(loading);
  }, []);

  return (
    <LoadingContext.Provider value={{
      isLoading,
      setLoading,
      loadingStates,
      setPageLoading,
      isPageLoading,
      globalLoading,
      setGlobalLoading
    }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

/**
 * Hook do automatycznego zarządzania loading state dla strony
 * Teraz z opcją wcześniejszego zakończenia gdy dane są gotowe
 */
export function usePageLoading(pageName: string, duration: number = 1500, forceReady?: boolean) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Jeśli forceReady jest true, natychmiast wyłącz loading
    if (forceReady) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [duration, forceReady]);

  return isLoading;
}

/**
 * Hook dla danych które są od razu dostępne (jak mockProducts)
 */
export function useInstantLoad() {
  return false; // Zawsze zwracaj false - nie ma loading
}

/**
 * Hook dla rzeczywistych operacji async z inteligentnym loading
 */
export function useSmartLoading<T>(
  asyncFn: () => Promise<T>, 
  dependencies: React.DependencyList = [],
  minLoadingTime: number = 300 // minimum 300ms żeby uniknąć flashy
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const startTime = Date.now();
    
    setLoading(true);
    setError(null);

    asyncFn()
      .then(result => {
        if (!cancelled) {
          const elapsed = Date.now() - startTime;
          const remainingTime = Math.max(0, minLoadingTime - elapsed);
          
          // Jeśli operacja była bardzo szybka, czekaj minimum czasu
          if (remainingTime > 0) {
            setTimeout(() => {
              if (!cancelled) {
                setData(result);
                setLoading(false);
              }
            }, remainingTime);
          } else {
            setData(result);
            setLoading(false);
          }
        }
      })
      .catch(err => {
        if (!cancelled) {
          const elapsed = Date.now() - startTime;
          const remainingTime = Math.max(0, minLoadingTime - elapsed);
          
          if (remainingTime > 0) {
            setTimeout(() => {
              if (!cancelled) {
                setError(err);
                setLoading(false);
              }
            }, remainingTime);
          } else {
            setError(err);
            setLoading(false);
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, dependencies);

  return { data, error, loading };
}

/**
 * Hook do ładowania danych z automatycznym loading state
 */
export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    operation()
      .then(result => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, error, loading };
}
