'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

interface RateLimitState {
  attempts: number;
  isBlocked: boolean;
  blockExpiresAt: number | null;
  timeRemaining: number;
  canSubmit: boolean;
}

interface AttemptRecord {
  timestamp: number;
  ip?: string;
  userAgent?: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 10, // Zwiększ domyślny limit prób
  windowMs: 15 * 60 * 1000, // W oknie 15 minut
  blockDurationMs: 5 * 60 * 1000, // Skróć blokadę do 5 minut
};

/**
 * Hook do obsługi rate limiting dla formularzy
 * Chroni przed spamem i automatycznymi atakamii
 */
export function useRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): RateLimitState & {
  recordAttempt: () => void;
  reset: () => void;
} {
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);
  const [state, setState] = useState<RateLimitState>({
    attempts: 0,
    isBlocked: false,
    blockExpiresAt: null,
    timeRemaining: 0,
    canSubmit: true,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Klucz dla localStorage
  const storageKey = `rate_limit_${key}`;

  // Funkcja do pobierania prób z localStorage
  const getStoredAttempts = (): AttemptRecord[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Funkcja do zapisywania prób w localStorage
  const saveAttempts = useCallback((attempts: AttemptRecord[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(attempts));
    } catch {
      // Ignoruj błędy localStorage
    }
  }, [storageKey]);

  // Funkcja do czyszczenia starych prób
  const cleanOldAttempts = (attempts: AttemptRecord[]): AttemptRecord[] => {
    const now = Date.now();
    return attempts.filter(attempt => 
      now - attempt.timestamp < finalConfig.windowMs
    );
  };

  // Funkcja do sprawdzania statusu blokady
  const checkBlockStatus = useCallback(() => {
    const now = Date.now();
    const storedAttempts = getStoredAttempts();
    const attempts = cleanOldAttempts(storedAttempts);
    
    // Sprawdź czy mamy aktywną blokadę
    const blockData = localStorage.getItem(`${storageKey}_block`);
    if (blockData) {
      try {
        const { expiresAt } = JSON.parse(blockData);
        if (now < expiresAt) {
          const timeRemaining = Math.ceil((expiresAt - now) / 1000);
          setState(prev => ({
            ...prev,
            attempts: attempts.length,
            isBlocked: true,
            blockExpiresAt: expiresAt,
            timeRemaining,
            canSubmit: false,
          }));
          return;
        } else {
          // Blokada wygasła, usuń ją
          localStorage.removeItem(`${storageKey}_block`);
        }
      } catch {
        localStorage.removeItem(`${storageKey}_block`);
      }
    }

    // Sprawdź czy przekroczono limit prób
    if (attempts.length >= finalConfig.maxAttempts) {
      const blockExpiresAt = now + finalConfig.blockDurationMs;
      
      // Zapisz blokadę
      localStorage.setItem(`${storageKey}_block`, JSON.stringify({
        expiresAt: blockExpiresAt,
        reason: 'max_attempts_exceeded'
      }));

      const timeRemaining = Math.ceil(finalConfig.blockDurationMs / 1000);
      setState(prev => ({
        ...prev,
        attempts: attempts.length,
        isBlocked: true,
        blockExpiresAt,
        timeRemaining,
        canSubmit: false,
      }));
    } else {
      setState(prev => ({
        ...prev,
        attempts: attempts.length,
        isBlocked: false,
        blockExpiresAt: null,
        timeRemaining: 0,
        canSubmit: true,
      }));
    }
  }, [finalConfig.maxAttempts, finalConfig.blockDurationMs, finalConfig.windowMs, storageKey]);

  // Funkcja do zapisania próby
  const recordAttempt = useCallback(() => {
    const now = Date.now();
    const storedAttempts = getStoredAttempts();
    const attempts = cleanOldAttempts(storedAttempts);
    
    // Dodaj nową próbę
    const newAttempt: AttemptRecord = {
      timestamp: now,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
    };
    
    const updatedAttempts = [...attempts, newAttempt];
    saveAttempts(updatedAttempts);
    
    // Sprawdź status po dodaniu próby
    checkBlockStatus();
  }, [saveAttempts, checkBlockStatus]);

  // Funkcja do resetowania
  const reset = useCallback(() => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}_block`);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setState({
      attempts: 0,
      isBlocked: false,
      blockExpiresAt: null,
      timeRemaining: 0,
      canSubmit: true,
    });
  }, [storageKey]);

  // Uruchom timer dla odliczania
  useEffect(() => {
    if (state.isBlocked && state.blockExpiresAt) {
      const blockExpiresAt = state.blockExpiresAt; // Kopiuj wartość
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const timeRemaining = Math.max(0, Math.ceil((blockExpiresAt - now) / 1000));
        
        if (timeRemaining <= 0) {
          checkBlockStatus();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else {
          setState(prev => ({ ...prev, timeRemaining }));
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.isBlocked, state.blockExpiresAt]); // Usuń checkBlockStatus z dependencies

  // Sprawdź status przy inicjalizacji
  useEffect(() => {
    checkBlockStatus();
  }, []); // Pusta dependency array - uruchom tylko raz przy mount

  // Cleanup przy unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    recordAttempt,
    reset,
  };
}
