'use client';

import { useState, useEffect, useCallback } from 'react';
import { checkEmailAvailability } from '@/lib/api/auth'; // Zmienione z auth-new na auth

interface EmailValidationState {
  isChecking: boolean;
  isAvailable: boolean | null;
  error: string | null;
  hasChecked: boolean;
}

/**
 * Hook do sprawdzania dostępności emaila w czasie rzeczywistym
 * Z debouncing żeby nie wysyłać zbyt wielu requestów
 */
export function useEmailValidation(email: string, enabled: boolean = false) {
  const [state, setState] = useState<EmailValidationState>({
    isChecking: false,
    isAvailable: null,
    error: null,
    hasChecked: false,
  });

  // Debounced validation function
  const validateEmail = useCallback(
    async (emailToCheck: string) => {
      if (!emailToCheck || !enabled) {
        setState({
          isChecking: false,
          isAvailable: null,
          error: null,
          hasChecked: false,
        });
        return;
      }

      // Basic email format validation first
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailToCheck)) {
        setState({
          isChecking: false,
          isAvailable: null,
          error: null,
          hasChecked: false,
        });
        return;
      }

      setState(prev => ({
        ...prev,
        isChecking: true,
        error: null,
      }));

      try {
        const response = await checkEmailAvailability(emailToCheck);
        
        if (response.error) {
          setState({
            isChecking: false,
            isAvailable: null,
            error: response.error.message,
            hasChecked: true,
          });
        } else {
          setState({
            isChecking: false,
            isAvailable: response.data?.available ?? null,
            error: null,
            hasChecked: true,
          });
        }
      } catch (error: any) {
        setState({
          isChecking: false,
          isAvailable: null,
          error: error.message || 'Błąd sprawdzania emaila',
          hasChecked: true,
        });
      }
    },
    [enabled]
  );

  // Debounce effect
  useEffect(() => {
    if (!email || !enabled) {
      setState({
        isChecking: false,
        isAvailable: null,
        error: null,
        hasChecked: false,
      });
      return;
    }

    // Reset state when email changes
    setState(prev => ({
      ...prev,
      isChecking: false,
      hasChecked: false,
    }));

    // Debounce delay
    const timeoutId = setTimeout(() => {
      validateEmail(email);
    }, 800); // 800ms delay

    return () => clearTimeout(timeoutId);
  }, [email, enabled, validateEmail]);

  // Reset function
  const reset = useCallback(() => {
    setState({
      isChecking: false,
      isAvailable: null,
      error: null,
      hasChecked: false,
    });
  }, []);

  return {
    ...state,
    reset,
  };
}
