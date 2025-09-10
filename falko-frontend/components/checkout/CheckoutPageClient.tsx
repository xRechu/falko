'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/context/cart-context';
import { completeCart, CheckoutCompleteRequest } from '@/lib/api/cart';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Truck, Shield, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { CheckoutForm, CheckoutFormData } from './CheckoutForm';
import { OrderSummary } from './OrderSummary';
import { trackInitiateCheckout, trackPurchase } from '@/lib/analytics/meta-pixel';

/**
 * Główny komponent strony checkout dla Falko Project
 * Premium, minimalistyczny design z pełną funkcjonalnością e-commerce
 */
export function CheckoutPageClient() {
  const { state, snapshotCart, resetCart, hasCartSnapshot, restoreCartFromSnapshot } = useCart();
  const [canRestore, setCanRestore] = useState(false);

  useEffect(() => {
    setCanRestore(hasCartSnapshot());
  }, [hasCartSnapshot]);
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'payment' | 'confirmation'>('form');
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const { cart } = state;

  // Redirect jeśli koszyk jest pusty - bez czekania na loading
  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      toast.error('Koszyk jest pusty');
      router.push('/sklep');
    }
  }, [cart, router]);

  const handleFormSubmit = useCallback(async (formData: CheckoutFormData) => {
    console.log('🚀 handleFormSubmit wywołane z danymi:', formData);
    
    if (!cart) {
      console.error('❌ Brak koszyka do finalizacji');
      toast.error('Brak koszyka do finalizacji');
      return;
    }

    console.log('🛒 Koszyk do finalizacji:', cart);
    setIsProcessing(true);
    
    try {
      console.log('🛒 Finalizacja zamówienia dla koszyka:', cart.id);
      console.log('📦 Dane checkout:', formData);

      // Meta Pixel: InitiateCheckout before calling API
      try {
        const contents = cart.items.map(item => ({
          id: item.variant_id,
          quantity: item.quantity,
          item_price: (item.unit_price ?? 0) / 100
        }))
        const value = (cart.total ?? cart.subtotal ?? 0) / 100
        trackInitiateCheckout({
          value,
          currency: cart.region?.currency_code?.toUpperCase?.() || 'PLN',
          num_items: cart.items.length,
          contents
        })
      } catch {}
      
      // Przygotuj dane dla API
      const checkoutData: CheckoutCompleteRequest = {
        email: formData.email,
        payment_method: formData.paymentMethod, // Dodane: metoda płatności
        shipping_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          city: formData.city,
          postal_code: formData.postalCode,
          country_code: (formData.country || 'PL').toLowerCase(), // Medusa wymaga małych liter
          phone: formData.phone,
        },
        // Jeśli adres rozliczeniowy jest inny - dodaj logikę później
        billing_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          city: formData.city,
          postal_code: formData.postalCode,
          country_code: (formData.country || 'PL').toLowerCase(), // Medusa wymaga małych liter
          phone: formData.phone,
        },
        // Dane Furgonetki - mapuj tylko jeśli istnieją
        furgonetka_data: formData.deliveryOption || formData.pickupPoint ? {
          pickup_point: formData.pickupPoint ? {
            id: formData.pickupPoint.id,
            name: formData.pickupPoint.name,
            address: formData.pickupPoint.address,
            provider: formData.pickupPoint.provider,
            distance: formData.pickupPoint.distance,
            hours: formData.pickupPoint.hours,
            coordinates: formData.pickupPoint.coordinates,
          } : undefined,
          delivery_option: formData.deliveryOption ? {
            id: formData.deliveryOption.id,
            provider: formData.deliveryOption.provider,
            service: formData.deliveryOption.service,
            type: formData.deliveryOption.type,
            price: formData.deliveryOption.price,
            delivery_time: formData.deliveryOption.delivery_time,
          } : undefined,
        } : undefined
      };

      // Wywołaj API do finalizacji
      console.log('🔗 Wywołuję completeCart API...');
  // Zrób snapshot koszyka przed próbą płatności
  snapshotCart();

  const response = await completeCart(cart.id, checkoutData);
      console.log('📨 Odpowiedź z completeCart API:', response);
      
      if (response.error) {
        throw new Error(response.error.message || 'Błąd podczas finalizacji zamówienia');
      }

  // Po pełnym sukcesie: wyczyść koszyk (usunięcie cart_id już robi API helper), usuń snapshot
  resetCart();

  // Ustaw dane zamówienia i przejdź do potwierdzenia
      setCompletedOrder(response.data.order || response.data.cart);
      setCurrentStep('confirmation');
      toast.success('Zamówienie zostało złożone!');

      // Meta Pixel: Purchase
      try {
        const order = response.data.order || response.data.cart
        const contents = (order?.items || cart.items).map((item: any) => ({
          id: item.variant_id,
          quantity: item.quantity,
          item_price: (item.unit_price ?? 0) / 100
        }))
        const value = ((order?.total ?? cart.total ?? cart.subtotal) ?? 0) / 100
        trackPurchase({
          value,
          currency: order?.region?.currency_code?.toUpperCase?.() || cart.region?.currency_code?.toUpperCase?.() || 'PLN',
          contents,
          order_id: order?.id || cart.id
        })
      } catch {}
      
      console.log('✅ Zamówienie finalizowane pomyślnie:', response.data);
      
    } catch (error) {
      console.error('❌ Błąd podczas składania zamówienia:', error);
      const msg = error instanceof Error ? error.message : 'Wystąpił błąd podczas składania zamówienia';
      toast.error(msg, {
        description: hasCartSnapshot() ? 'Możesz przywrócić koszyk i spróbować ponownie.' : undefined,
        action: hasCartSnapshot() ? {
          label: 'Przywróć koszyk',
          onClick: async () => {
            const ok = await restoreCartFromSnapshot();
            if (ok) {
              toast.success('Przywrócono koszyk');
            } else {
              toast.error('Nie udało się przywrócić koszyka');
            }
          }
        } : undefined
      });
    } finally {
      setIsProcessing(false);
    }
  }, [cart]);

  // Sprawdź koszyk bez loading state - jeśli jest pusty, przekieruj
  console.log('🛒 Stan koszyka w CheckoutPageClient:', { cart, hasItems: cart?.items?.length });
  
  if (!cart || cart.items.length === 0) {
    // useEffect już obsługuje przekierowanie
    return null;
  }

  if (currentStep === 'confirmation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dziękujemy za zamówienie!
              </h1>
              <p className="text-gray-600">
                Twoje zamówienie zostało przyjęte i jest przetwarzane
              </p>
              {completedOrder && (
                <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500 mb-2">Numer zamówienia:</p>
                  <p className="font-mono text-lg font-semibold">
                    #{completedOrder.display_id || completedOrder.id}
                  </p>
                  {completedOrder.total && (
                    <p className="text-gray-600 mt-2">
                      Kwota: {(completedOrder.total / 100).toFixed(2)} PLN
                    </p>
                  )}
                </div>
              )}
            </div>
            
                        {canRestore && (
                          <Alert className="mb-4 border-blue-200 bg-blue-50">
                            <AlertDescription className="flex items-center justify-between gap-4 text-blue-800">
                              <span>Masz zapisaną zawartość koszyka z poprzedniej próby płatności.</span>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={async () => {
                                  const ok = await restoreCartFromSnapshot();
                                  if (ok) {
                                    setCanRestore(false);
                                    toast.success('Przywrócono koszyk');
                                  } else {
                                    toast.error('Nie udało się przywrócić koszyka');
                                  }
                                }}>Przywróć koszyk</Button>
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Szczegóły zamówienia</h2>
              <div className="text-left space-y-2">
                <div className="flex justify-between">
                  <span>Numer zamówienia:</span>
                  <span className="font-mono">#{completedOrder?.display_id || 'FP' + Date.now().toString().slice(-6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant="outline" className={
                    completedOrder?.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'
                  }>
                    {completedOrder?.status === 'confirmed' ? 'Potwierdzone' : 'Oczekuje na płatność'}
                  </Badge>
                </div>
                {completedOrder?.payment_method && (
                  <div className="flex justify-between">
                    <span>Płatność:</span>
                    <span>{
                      completedOrder.payment_method === 'cod' ? 'Przy odbiorze' :
                      completedOrder.payment_method === 'card' ? 'Karta płatnicza' :
                      completedOrder.payment_method === 'transfer' ? 'Przelew bankowy' :
                      'Nieokreślona'
                    }</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Przewidywana dostawa:</span>
                  <span>3-5 dni roboczych</span>
                </div>
                {completedOrder?.furgonetka_data?.pickup_point && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-1">Punkt odbioru:</p>
                    <p className="text-sm text-blue-700">{completedOrder.furgonetka_data.pickup_point.name}</p>
                  </div>
                )}
                {completedOrder?.message && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">{completedOrder.message}</p>
                  </div>
                )}
              </div>
            </Card>

            <div className="space-y-4">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/">
                  Powrót na stronę główną
                </Link>
              </Button>
              <br />
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/sklep">
                  Kontynuuj zakupy
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Finalizacja zamówienia</h1>
              <p className="text-gray-600 text-sm">
                Krok {currentStep === 'form' ? '1' : '2'} z 2
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            <CheckoutForm 
              onSubmit={handleFormSubmit}
              isProcessing={isProcessing}
            />
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <OrderSummary 
                cart={cart} 
              />
              
              {/* Trust Badges */}
              <Card className="p-4 mt-6">
                <h3 className="font-semibold mb-4 text-center">
                  Bezpieczne zakupy
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Shield className="h-6 w-6 text-blue-600" />
                    <span className="text-xs text-gray-600">
                      Bezpieczne płatności
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="h-6 w-6 text-green-600" />
                    <span className="text-xs text-gray-600">
                      Szybka dostawa
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <CreditCard className="h-6 w-6 text-purple-600" />
                    <span className="text-xs text-gray-600">
                      Różne metody płatności
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
