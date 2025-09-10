'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  X, 
  ArrowLeft,
  MapPin,
  CreditCard,
  FileText,
  Download,
  Loader2,
  RotateCcw
} from 'lucide-react';
import ReturnRequestModal from './ReturnRequestModal';
import { checkReturnEligibility } from '@/lib/api/returns';
import { useAuth } from '@/lib/context/auth-context';
import Image from 'next/image';
import { Order, getOrderDetails, getOrderStatusLabel, getOrderStatusColor, formatPrice } from '@/lib/api/orders';
import { toast } from 'sonner';

/**
 * Komponent do wyświetlania szczegółów zamówienia
 * Premium design z timeline statusu zamówienia
 */

export interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
}

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  const { state } = useAuth();
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnEligible, setReturnEligible] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [order.id]);

  useEffect(() => {
    if (orderDetails && orderDetails.status === 'completed') {
      checkReturnEligibilityForOrder();
    }
  }, [orderDetails]);

  const checkReturnEligibilityForOrder = async () => {
    if (!orderDetails) return;
    
    setCheckingEligibility(true);
    try {
  const eligibility = await checkReturnEligibility(orderDetails.id, state.user?.id);
      setReturnEligible(eligibility.eligible);
    } catch (error) {
      console.error('Error checking return eligibility:', error);
      setReturnEligible(false);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getOrderDetails(order.id);
      
      if (response.error) {
        setError(response.error.message);
      } else if (response.data) {
        setOrderDetails(response.data);
      }
    } catch (err: any) {
      setError('Błąd pobierania szczegółów zamówienia');
      console.error('OrderDetailsModal error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'pending': return Clock;
      case 'archived': return Package;
      case 'canceled': return X;
      default: return Clock;
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return 'Brak adresu';
    
    return [
      `${address.first_name} ${address.last_name}`,
      address.company,
      address.address_1,
      address.address_2,
      `${address.postal_code} ${address.city}`,
      address.country_code?.toUpperCase()
    ].filter(Boolean).join('\n');
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Ładowanie szczegółów zamówienia...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl p-8 text-center">
          <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Błąd</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={onClose}>Zamknij</Button>
        </Card>
      </div>
    );
  }

  if (!orderDetails) {
    return null;
  }

  const StatusIcon = getStatusIcon(orderDetails.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold">Zamówienie #{orderDetails.display_id}</h2>
                <p className="text-sm text-gray-600">
                  {new Date(orderDetails.created_at).toLocaleDateString('pl-PL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Status */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <StatusIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <Badge className={getOrderStatusColor(orderDetails.status)}>
                  {getOrderStatusLabel(orderDetails.status)}
                </Badge>
                <p className="text-sm text-gray-600 mt-1">
                  Status płatności: 
                  <Badge className={`ml-2 ${getOrderStatusColor(orderDetails.payment_status, 'payment')}`}>
                    {getOrderStatusLabel(orderDetails.payment_status, 'payment')}
                  </Badge>
                </p>
              </div>
            </div>
          </div>

          {/* Furgonetka - status przesyłki/tracking/etykieta */}
          {orderDetails.metadata?.furgonetka_shipment && (
            <Card className="p-6 mb-6 border-2 border-blue-200 bg-blue-50">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" />
                Status przesyłki (Furgonetka)
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {orderDetails.metadata.furgonetka_shipment.status || 'Nieznany'}
                  </Badge>
                </div>
                {orderDetails.metadata.furgonetka_shipment.tracking_number && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Numer przesyłki:</span>
                    <span className="font-mono text-sm">{orderDetails.metadata.furgonetka_shipment.tracking_number}</span>
                  </div>
                )}
                {orderDetails.metadata.furgonetka_shipment.label_url && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Etykieta:</span>
                    <a
                      href={orderDetails.metadata.furgonetka_shipment.label_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" /> Pobierz PDF
                    </a>
                  </div>
                )}
                {orderDetails.metadata.furgonetka_shipment.created_at && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Wygenerowano:</span>
                    <span>{new Date(orderDetails.metadata.furgonetka_shipment.created_at).toLocaleString('pl-PL')}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Products */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Produkty</h3>
                <div className="space-y-4">
                  {orderDetails.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        {item.thumbnail ? (
                          <Image
                            src={item.thumbnail}
                            alt={item.product_title}
                            width={64}
                            height={64}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product_title}</h4>
                        {item.variant_title && (
                          <p className="text-sm text-gray-600">{item.variant_title}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          Ilość: {item.quantity} × {formatPrice(item.unit_price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(item.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Shipping Address */}
              {orderDetails.shipping_address && (
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-semibold">Adres dostawy</h3>
                  </div>
                  <div className="text-sm text-gray-600 whitespace-pre-line">
                    {formatAddress(orderDetails.shipping_address)}
                  </div>
                </Card>
              )}

              {/* Billing Address */}
              {orderDetails.billing_address && (
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-semibold">Adres rozliczeniowy</h3>
                  </div>
                  <div className="text-sm text-gray-600 whitespace-pre-line">
                    {formatAddress(orderDetails.billing_address)}
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Podsumowanie</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Wartość produktów:</span>
                    <span>{formatPrice(orderDetails.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Dostawa:</span>
                    <span>{formatPrice(orderDetails.shipping_total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Podatek:</span>
                    <span>{formatPrice(orderDetails.tax_total)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Razem:</span>
                    <span>{formatPrice(orderDetails.total)}</span>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Akcje</h3>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2"
                    onClick={() => toast.info('Funkcja w przygotowaniu')}
                  >
                    <Download className="h-4 w-4" />
                    Pobierz fakturę
                  </Button>
                  
                  {orderDetails.status === 'completed' && (
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center gap-2"
                      onClick={() => toast.info('Funkcja w przygotowaniu')}
                    >
                      <Package className="h-4 w-4" />
                      Zamów ponownie
                    </Button>
                  )}
                  
                  {/* Return Button */}
                  {orderDetails.status === 'completed' && (
                    <div>
                      {checkingEligibility ? (
                        <Button 
                          variant="outline" 
                          className="w-full flex items-center gap-2"
                          disabled
                        >
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sprawdzanie...
                        </Button>
                      ) : returnEligible ? (
                        <Button 
                          variant="outline" 
                          className="w-full flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
                          onClick={() => setReturnModalOpen(true)}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Zgłoś zwrot
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full flex items-center gap-2 opacity-50"
                          disabled
                        >
                          <RotateCcw className="h-4 w-4" />
                          Zwrot niedostępny
                        </Button>
                      )}
                      {returnEligible && (
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          Masz 14 dni na zgłoszenie zwrotu
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              {/* Contact */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Potrzebujesz pomocy?</h3>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Jeśli masz pytania dotyczące tego zamówienia, skontaktuj się z nami.
                  </p>
                  <Button variant="outline" className="w-full">
                    Kontakt
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Return Request Modal */}
      {orderDetails && (
        <ReturnRequestModal
          isOpen={returnModalOpen}
          onClose={() => setReturnModalOpen(false)}
          orderId={orderDetails.id}
          orderNumber={orderDetails.display_id.toString()}
        />
      )}
    </div>
  );
}
