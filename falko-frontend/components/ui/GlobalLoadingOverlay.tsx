'use client';

import { useLoading } from '@/lib/hooks/useLoading';
import { Loader2 } from 'lucide-react';

/**
 * Globalny loading overlay dla całej aplikacji
 */
export function GlobalLoadingOverlay() {
  const { globalLoading } = useLoading();

  if (!globalLoading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white bg-opacity-90 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Falko Project</h2>
          <p className="text-foreground/60 animate-pulse">Ładowanie...</p>
        </div>
      </div>
    </div>
  );
}
