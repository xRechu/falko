'use client';

import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PointsEarningBadge } from '@/components/shared/PointsEarningBadge';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';

interface OrderSummaryProps {
  cart: {
    id: string;
    items: Array<{
      id: string;
      title: string;
      thumbnail?: string;
      quantity: number;
      unit_price: number;
      total?: number;
      variant_title?: string;
      variant?: {
        title: string;
        options?: Array<{
          value: string;
          option: { title: string };
        }>;
      };
    }>;
    subtotal: number;
    tax_total: number;
    shipping_total: number;
    total: number;
    item_count: number;
    region?: {
      currency_code: string;
    };
  };
  // Furgonetka shipping info
  shippingInfo?: {
    provider: string;
    service: string;
    cost: number;
    pickupPoint?: {
      name: string;
      address: string;
    };
  };
}

/**
 * Komponent podsumowania zamówienia w checkout
 * Wyświetla produkty, ceny i podsumowanie
 */
export function OrderSummary({ cart, shippingInfo }: OrderSummaryProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: cart.region?.currency_code || 'PLN',
    }).format(price / 100);
  };

  // Oblicz całkowity koszt z uwzględnieniem Furgonetka
  const totalWithShipping = () => {
    if (shippingInfo) {
      return cart.subtotal + cart.tax_total + (shippingInfo.cost * 100);
    }
    return cart.total;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gray-100 rounded-lg">
          <ShoppingCart className="h-5 w-5 text-gray-600" />
        </div>
        <h2 className="text-lg font-semibold">
          Podsumowanie zamówienia
        </h2>
      </div>

      {/* Lista produktów */}
      <div className="space-y-4 mb-6">
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {item.thumbnail ? (
                <Image
                  src={item.thumbnail}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-sm truncate">
                    {item.title}
                  </h4>
                  {/* Wyświetl opcje wariantów jako osobne linie */}
                  {item.variant?.options && item.variant.options.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {item.variant.options.map((opt, idx) => (
                        <p key={idx} className="text-xs text-gray-500">
                          {opt.option?.title}: {opt.value}
                        </p>
                      ))}
                    </div>
                  )}
                  {/* Fallback dla variant_title jeśli nie ma options */}
                  {(!item.variant?.options || item.variant.options.length === 0) && (item.variant?.title || item.variant_title) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {item.variant_title || item.variant?.title}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {item.quantity}x
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatPrice(item.unit_price)}
                    </span>
                  </div>
                </div>
                <p className="text-sm font-medium">
                  {formatPrice(item.total || (item.unit_price * item.quantity))}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Separator className="mb-4" />

      {/* Podsumowanie finansowe */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>Suma częściowa ({cart.item_count} produktów):</span>
          <span>{formatPrice(cart.subtotal)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Dostawa:</span>
          <div className="text-right">
            <span>
              {shippingInfo ? 
                new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(shippingInfo.cost) :
                cart.shipping_total > 0 ? formatPrice(cart.shipping_total) : 'Darmowa'
              }
            </span>
            {shippingInfo && (
              <div className="text-xs text-gray-500 mt-1">
                {shippingInfo.provider} - {shippingInfo.service}
                {shippingInfo.pickupPoint && (
                  <div className="text-xs">do {shippingInfo.pickupPoint.name}</div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {cart.tax_total > 0 && (
          <div className="flex justify-between text-sm">
            <span>Podatek VAT:</span>
            <span>{formatPrice(cart.tax_total)}</span>
          </div>
        )}
        
        <Separator />
        
        <div className="flex justify-between font-semibold text-base">
          <span>Razem do zapłaty:</span>
          <span className="text-lg">{formatPrice(totalWithShipping())}</span>
        </div>
        
        {/* Badge z punktami do zdobycia */}
        <PointsEarningBadge 
          orderTotal={totalWithShipping() / 100} 
          variant="large"
          className="mt-4"
        />
      </div>

      {/* Informacje dodatkowe */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
            <span>Darmowa dostawa przy zamówieniach powyżej 200 zł</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
            <span>30 dni na zwrot bez podania przyczyny</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
            <span>Gwarancja jakości produktów</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
