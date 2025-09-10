import { Metadata } from 'next';
import { ForgotPasswordPageClient } from '@/components/auth/ForgotPasswordPageClient';

export const metadata: Metadata = {
  title: 'Resetowanie hasła - Falko Project',
  description: 'Zresetuj hasło do swojego konta w sklepie Falko Project',
};

/**
 * Strona resetowania hasła
 * Server Component z delegacją do Client Component
 */
export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
