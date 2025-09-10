import { Metadata } from 'next';
import { RegisterPageClient } from '@/components/auth/RegisterPageClient';

export const metadata: Metadata = {
  title: 'Rejestracja - Falko Project',
  description: 'Utwórz nowe konto w sklepie Falko Project',
};

/**
 * Strona rejestracji
 * Server Component z delegacją do Client Component
 */
export default function RegisterPage() {
  return <RegisterPageClient />;
}
