import { Metadata } from 'next';
import { AccountPageClient } from '@/components/account/AccountPageClient';

export const metadata: Metadata = {
  title: 'Moje Konto - Falko Project',
  description: 'Panel użytkownika - zarządzaj swoim kontem, zamówieniami i preferencjami w sklepie Falko Project',
};

/**
 * Strona panelu użytkownika
 * Server Component z delegacją do Client Component
 */
export default function AccountPage() {
  return <AccountPageClient />;
}
