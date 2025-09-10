import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatuje cenę z groszówki (Medusa format) na czytelną cenę
 * @param amount - cena w groszach (np. 30000 = 300.00 PLN)
 * @param currencyCode - kod waluty (domyślnie PLN)
 * @returns sformatowana cena (np. "300,00 zł")
 */
export function formatPrice(amount: number, currencyCode: string = 'PLN'): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount / 100); // Medusa przechowuje ceny w groszach
}

/**
 * Konwertuje cenę z groszówki na złotówki (liczba)
 * @param amount - cena w groszach (np. 30000)
 * @returns cena w złotówkach (np. 300.00)
 */
export function centsToPLN(amount: number): number {
  return amount / 100;
}

/**
 * Konwertuje cenę ze złotówek na groszówkę (dla API)
 * @param amount - cena w złotówkach (np. 300.00)
 * @returns cena w groszach (np. 30000)
 */
export function plnToCents(amount: number): number {
  return Math.round(amount * 100);
}
