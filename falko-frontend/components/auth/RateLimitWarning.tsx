'use client';

import { AlertTriangle, Clock, Shield } from 'lucide-react';

interface RateLimitWarningProps {
  attempts: number;
  maxAttempts: number;
  isBlocked: boolean;
  timeRemaining: number;
  className?: string;
}

/**
 * Komponent wyświetlający ostrzeżenia o rate limiting
 */
export function RateLimitWarning({
  attempts,
  maxAttempts,
  isBlocked,
  timeRemaining,
  className = ''
}: RateLimitWarningProps) {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} sek`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return remainingSeconds > 0 
        ? `${minutes}min ${remainingSeconds}sek`
        : `${minutes}min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}min`
      : `${hours}h`;
  };

  // Jeśli zablokowany - pokaż komunikat o blokadzie
  if (isBlocked) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800 mb-1">
              Konto tymczasowo zablokowane
            </h3>
            <p className="text-sm text-red-700 mb-2">
              Przekroczono maksymalną liczbę prób rejestracji. Ze względów bezpieczeństwa 
              konto zostało tymczasowo zablokowane.
            </p>
            <div className="flex items-center space-x-2 text-sm text-red-600">
              <Clock className="h-4 w-4" />
              <span>
                Spróbuj ponownie za: <strong>{formatTime(timeRemaining)}</strong>
              </span>
            </div>
            <p className="text-xs text-red-600 mt-2">
              Jeśli potrzebujesz pomocy, skontaktuj się z naszym zespołem wsparcia.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Jeśli zbliża się do limitu - pokaż ostrzeżenie
  if (attempts > 0 && attempts >= Math.floor(maxAttempts * 0.6)) {
    const remainingAttempts = maxAttempts - attempts;
    
    return (
      <div className={`bg-orange-50 border border-orange-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-orange-800 mb-1">
              Ostrzeżenie o limicie prób
            </h3>
            <p className="text-sm text-orange-700">
              {remainingAttempts > 0 ? (
                <>
                  Pozostały <strong>{remainingAttempts}</strong> próby rejestracji. 
                  Po przekroczeniu limitu konto zostanie tymczasowo zablokowane.
                </>
              ) : (
                <>
                  To była ostatnia próba. Następna nieudana próba spowoduje 
                  tymczasową blokadę konta.
                </>
              )}
            </p>
            {remainingAttempts === 1 && (
              <p className="text-xs text-orange-600 mt-2">
                💡 Upewnij się, że wszystkie dane są prawidłowe przed wysłaniem formularza.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
