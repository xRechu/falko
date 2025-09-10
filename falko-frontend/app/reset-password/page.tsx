import { Metadata } from 'next';
import { ResetPasswordPageClient } from '@/components/auth/ResetPasswordPageClient';

export const metadata: Metadata = {
  title: 'Ustaw nowe hasło - Falko Project',
  description: 'Ustaw nowe hasło dla swojego konta w sklepie Falko Project',
};

/**
 * Strona ustawiania nowego hasła (po kliknięciu w link z emaila)
 * Server Component z delegacją do Client Component
 */
export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />;
}
