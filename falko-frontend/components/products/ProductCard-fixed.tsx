"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ProductPreview } from "@/lib/types/product";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { useInventoryContext } from "@/lib/context/inventory-context";

/**
 * Props dla komponentu ProductCard
 */
interface ProductCardProps {
  product: ProductPreview;
  className?: string;
}

/**
 * Reużywalny komponent karty produktu
 * - Wyświetla miniaturę, tytuł i cenę produktu
 * - Animacja hover z efektem scale za pomocą Framer Motion
 * - Wykorzystuje shadcn/ui Card jako bazę
 * - Responsywny design dla premium UX
 * - Zgodny z Medusa.js API structure
 */
export default function ProductCard({ product, className }: ProductCardProps) {
  const formatPrice = (price: ProductPreview['price']) => {
    if (!price) return 'Cena do ustalenia';
    
    const formatter = new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: price.currency_code.toUpperCase(),
    });
    return formatter.format(price.amount / 100); // Assuming price is in cents
  };

  const { isVariantAvailable, getVariantQuantity } = useInventoryContext();

  // Sprawdź czy produkt ma wiele wariantów (więcej niż 1 opcję do wyboru)
  // Dla uproszczenia - jeśli firstVariant ma różne opcje w tytule to wymagaj wyboru
  const requiresVariantSelection = product.firstVariant?.title?.includes('/') || false;
  
  // Sprawdź dostępność - używamy inventory z backendu
  const isInStock = product.firstVariant ? isVariantAvailable(product.firstVariant.id) : false;
  
  // Pobierz ilość z inventory
  const inventoryQuantity = product.firstVariant ? getVariantQuantity(product.firstVariant.id) : 0;

  // Debug logging
  console.log('ProductCard:', {
    productTitle: product.title,
    variantId: product.firstVariant?.id,
    isInStock,
    inventoryQuantity,
    requiresVariantSelection
  });

  // Fallback thumbnail jeśli brak obrazu
  const thumbnailSrc = product.thumbnail || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Qcm9kdWt0PC90ZXh0Pjwvc3ZnPg==";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={className}
    >
      <Link href={`/products/${product.handle}`} className="block">
        <Card className="group overflow-hidden border-border/50 bg-card hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-0">
            <div className="aspect-square overflow-hidden">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-full w-full"
              >
                <Image
                  src={thumbnailSrc}
                  alt={product.title}
                  width={400}
                  height={400}
                  className="h-full w-full object-cover transition-transform duration-300"
                  priority={false}
                />
              </motion.div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col items-start space-y-3 p-4">
            <div className="w-full">
              <h3 className="text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors line-clamp-2 mb-2">
                {product.title}
              </h3>
              <div className="flex items-center justify-between mb-2">
                <p className="text-lg font-semibold text-foreground">
                  {formatPrice(product.price)}
                </p>
                <div onClick={(e) => e.preventDefault()}>
                  <AddToCartButton 
                    product={product} 
                    variant="outline" 
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    requiresVariantSelection={requiresVariantSelection}
                    isInStock={isInStock}
                  />
                </div>
              </div>
              
              {/* Status dostępności */}
              <div className="flex items-center justify-between text-xs">
                <div>
                  {product.collection && (
                    <p className="text-muted-foreground uppercase tracking-wider">
                      {product.collection.title}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {!isInStock ? (
                    <span className="text-red-500 font-medium">Wyprzedany</span>
                  ) : inventoryQuantity <= 5 && inventoryQuantity > 0 ? (
                    <span className="text-amber-500 font-medium">Zostało {inventoryQuantity}</span>
                  ) : (
                    <span className="text-green-600 font-medium">Dostępny</span>
                  )}
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}

/**
 * Komponent szkieletowy do ładowania
 */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="aspect-square bg-muted animate-pulse" />
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-2 p-4">
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-5 w-1/2 bg-muted animate-pulse rounded" />
        </CardFooter>
      </Card>
    </div>
  );
}
