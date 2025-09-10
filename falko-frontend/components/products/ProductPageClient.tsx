"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/ui/breadcrumbs";
import ImageGallery from "@/components/products/ImageGallery";
import { PointsEarningBadge } from "@/components/shared/PointsEarningBadge";
import { ProductDetail } from "@/lib/types/product";
import { ProductVariantSelector } from "@/components/cart/ProductVariantSelector";
import { useInventoryContext } from "@/lib/context/inventory-context";
import { formatPrice } from "@/lib/utils";
import { Heart, Share2, Truck, Shield, RotateCcw, Info, ChevronUp, ChevronDown, Zap } from "lucide-react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { trackViewContent } from "@/lib/analytics/meta-pixel";

interface ProductPageClientProps {
  product: ProductDetail;
}

export default function ProductPageClient({ product }: ProductPageClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(product.variants[0]?.id || "");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Meta Pixel: track ViewContent on mount/variant change
  useEffect(() => {
    const pricePln = product.variants[0]?.prices?.find(p => p.currency_code.toLowerCase() === 'pln')?.amount
      ?? product.variants[0]?.prices?.[0]?.amount
      ?? 0
    trackViewContent({
      content_ids: [product.id],
      content_name: product.title,
      value: pricePln / 100,
      currency: 'PLN',
      content_type: 'product'
    })
  }, [product.id, product.title])

  const { isVariantAvailable, getVariantQuantity } = useInventoryContext();

  // Oblicz cenę wybranego wariantu bezpośrednio z danych wariantu
  const selectedVariant = product.variants.find(v => v.id === selectedVariantId) || product.variants[0];
  
  // Pobierz cenę z wariantu (pierwsza cena w PLN lub pierwsza dostępna)
  const selectedPriceData = selectedVariant?.prices?.find(price => 
    price.currency_code.toLowerCase() === 'pln'
  ) || selectedVariant?.prices?.[0];

  // Sprawdź dostępność wybranego wariantu
  const isInStock = selectedVariant ? isVariantAvailable(selectedVariant.id) : false;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.subtitle || `Sprawdź ${product.title} w Falko Project`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Image Gallery */}
      <ImageGallery 
        images={product.images}
        productTitle={product.title}
      />
      
      {/* Product Info */}
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumbs 
          items={[
            { label: "Sklep", href: "/sklep" },
            ...(product.collection ? [{ label: product.collection.title, href: `/sklep?collection=${product.collection.handle}` }] : []),
            { label: product.title }
          ]}
        />
        
        {/* Nazwa produktu */}
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-2">
            {product.title}
          </h1>
        </div>
        
        {/* Nazwa kolekcji */}
        {product.collection && (
          <div className="mb-4">
            <span className="text-lg text-muted-foreground font-medium">
              {product.collection.title}
            </span>
          </div>
        )}
        
        {/* Cena i dostępność */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            {selectedPriceData && (
              <span className="text-3xl font-bold text-foreground">
                {formatPrice(selectedPriceData.amount)}
              </span>
            )}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isInStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isInStock ? 'Dostępny' : 'Brak w magazynie'}
            </div>
          </div>
          
          {/* Badge z punktami do zdobycia */}
          {selectedPriceData && (
            <PointsEarningBadge 
              orderTotal={selectedPriceData.amount / 100}
              variant="large"
            />
          )}
        </div>
        
        {/* Selector wariantów z ceną i zarządzaniem koszykiem */}
        <ProductVariantSelector 
          product={product} 
          selectedVariantId={selectedVariantId}
          onVariantChange={setSelectedVariantId}
        />
        
        {/* Kup teraz i Udostępnij */}
        <div className="flex gap-3">
          <AddToCartButton
            product={{
              id: product.id,
              title: product.title,
              handle: product.handle,
              thumbnail: product.images[0]?.url || undefined,
              price: selectedPriceData ? {
                amount: selectedPriceData.amount,
                currency_code: selectedPriceData.currency_code
              } : undefined,
              collection: product.collection,
              firstVariant: selectedVariant,
              variantCount: 1 // Na stronie produktu już wybraliśmy wariant
            }}
            variant="default"
            size="sm"
            className="flex-1"
            buyNow={true}
            isInStock={isVariantAvailable(selectedVariantId)}
            requiresVariantSelection={false} // Wymuszone - już wybraliśmy wariant
          />
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Udostępnij
          </Button>
        </div>
        
        {/* Features - tylko sekcja z funkcjami */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Dlaczego warto wybrać Falko Project?
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200">
              <Truck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-foreground">
                  Darmowa dostawa
                </p>
                <p className="text-xs text-muted-foreground">
                  Od 200 zł
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200">
              <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-foreground">
                  Gwarancja jakości
                </p>
                <p className="text-xs text-muted-foreground">
                  30 dni zwrotu
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200">
              <RotateCcw className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-foreground">
                  Łatwy zwrot
                </p>
                <p className="text-xs text-muted-foreground">
                  Bez dodatkowych kosztów
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Opis produktu */}
        {product.description && (
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between p-3 h-auto"
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            >
              <span className="font-medium">Opis produktu</span>
              {isDescriptionExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            
            {isDescriptionExpanded && (
              <div className="p-4 bg-gray-50/50 rounded-lg">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Specifications */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold text-foreground">
            Specyfikacja
          </h3>
          <dl className="grid grid-cols-1 gap-2 text-sm">
            {product.material && (
              <>
                <dt className="font-medium text-foreground">Materiał:</dt>
                <dd className="text-muted-foreground mb-2">{product.material}</dd>
              </>
            )}
            {product.origin_country && (
              <>
                <dt className="font-medium text-foreground">Kraj pochodzenia:</dt>
                <dd className="text-muted-foreground mb-2">{product.origin_country}</dd>
              </>
            )}
            {product.weight && (
              <>
                <dt className="font-medium text-foreground">Waga:</dt>
                <dd className="text-muted-foreground mb-2">{product.weight}g</dd>
              </>
            )}
            {selectedVariant?.sku && (
              <>
                <dt className="font-medium text-foreground">SKU:</dt>
                <dd className="text-muted-foreground mb-2">{selectedVariant.sku}</dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
