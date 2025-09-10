'use client';

import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

interface EmailValidationIndicatorProps {
  isChecking: boolean;
  isAvailable: boolean | null;
  error: string | null;
  hasChecked: boolean;
  email: string;
  className?: string;
}

/**
 * Komponent wyświetlający status walidacji emaila
 */
export function EmailValidationIndicator({
  isChecking,
  isAvailable,
  error,
  hasChecked,
  email,
  className = ''
}: EmailValidationIndicatorProps) {
  // Nie pokazuj nic jeśli email jest pusty lub nieprawidłowy format
  if (!email || !email.includes('@')) {
    return null;
  }

  // Loading state
  if (isChecking) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-blue-600 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Sprawdzanie dostępności...</span>
      </div>
    );
  }

  // Error state
  if (error && hasChecked) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-orange-600 ${className}`}>
        <AlertCircle className="h-4 w-4" />
        <span>Nie można sprawdzić dostępności</span>
      </div>
    );
  }

  // Success states
  if (hasChecked && isAvailable !== null) {
    if (isAvailable) {
      return (
        <div className={`flex items-center space-x-2 text-sm text-green-600 ${className}`}>
          <CheckCircle className="h-4 w-4" />
          <span>Email dostępny</span>
        </div>
      );
    } else {
      return (
        <div className={`flex items-center space-x-2 text-sm text-red-600 ${className}`}>
          <XCircle className="h-4 w-4" />
          <span>Email już istnieje w systemie</span>
        </div>
      );
    }
  }

  return null;
}
