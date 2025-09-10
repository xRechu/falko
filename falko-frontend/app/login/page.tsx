import { Metadata } from 'next';
import LoginPageClient from '@/components/auth/LoginPageClient';

export const metadata: Metadata = {
  title: 'Logowanie - Falko Project',
  description: 'Zaloguj się do swojego konta w sklepie Falko Project',
};

/**
 * Strona logowania
 * Server Component z delegacją do Client Component
 */
export default function LoginPage() {
  return <LoginPageClient />;
}
