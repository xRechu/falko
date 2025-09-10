'use client';

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import ProductPageClient from "@/components/products/ProductPageClient";
import RelatedProducts from "@/components/products/RelatedProducts";
import { ProductDetailsSkeleton } from "@/components/ui/loading-skeletons";
import { useSmartLoading } from "@/lib/hooks/useLoading";
import { fetchProductByHandle, fetchProducts } from "@/lib/products-service";
import { ProductDetail } from "@/lib/types/product";

export default function ProductPageWithSkeleton() {
  const params = useParams();
  const handle = params?.handle as string;

  // useSmartLoading automatycznie zarządza ładowaniem
  const { data, loading, error } = useSmartLoading(
    async () => {
      if (!handle) throw new Error('Brak handle produktu');
      
      // Równoczesne ładowanie produktu i powiązanych produktów
      const [productData, allProducts] = await Promise.all([
        fetchProductByHandle(handle),
        fetchProducts()
      ]);
      
      if (!productData) {
        throw new Error('Produkt nie został znaleziony');
      }
      
      // Filtruj powiązane produkty (inne niż aktualny)
      const related = allProducts.filter(p => p.id !== productData.id).slice(0, 4);
      
      return {
        product: productData as ProductDetail,
        relatedProducts: related
      };
    },
    [handle], // dependencies
    400 // minimum loading time dla product page
  );

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <ProductDetailsSkeleton />
      </div>
    );
  }

  if (error || !data?.product) {
    // Jeśli produkt nie został znaleziony, przekieruj na stronę not-found
    // Next.js automatycznie wyświetli not-found.tsx z tego samego katalogu
    if (!data?.product) {
      notFound();
    }
    
    // Sprawdź czy błąd dotyczy braku produktu
    if (error && error.message && error.message.includes('nie został znaleziony')) {
      notFound();
    }
    
    // Inne błędy wyświetl jako błąd ogólny
    const errorMessage = error?.message || 'Błąd podczas ładowania produktu';
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Błąd</h1>
          <p className="text-foreground/70">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <ProductPageClient product={data.product} />
      </div>
      {data.relatedProducts.length > 0 && (
        <RelatedProducts products={data.relatedProducts} currentProductId={data.product.id} />
      )}
    </div>
  );
}
