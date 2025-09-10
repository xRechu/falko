'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Komponent zapewniający automatyczne przewijanie do góry strony
 * przy każdej zmianie ścieżki (nawigacji)
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Przewiń do góry przy każdej zmianie ścieżki
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [pathname]);

  // Ten komponent nie renderuje nic - tylko obsługuje logikę przewijania
  return null;
}
