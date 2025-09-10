import { Metadata } from 'next';
import CheckoutWithPayment from '@/components/checkout/CheckoutWithPayment';

export const metadata: Metadata = {
  title: 'Kasa - Falko Project',
  description: 'Finalizacja zamówienia w sklepie Falko Project',
};

/**
 * Strona checkout - finalizacja zamówienia
 * Server Component z delegacją do Client Component
 */
export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Finalizacja zamówienia</h1>
          <p className="text-gray-600 mt-2">
            Uzupełnij dane i wybierz metodę płatności
          </p>
        </div>
        
        <CheckoutWithPayment />
      </div>
    </div>
  );
}
