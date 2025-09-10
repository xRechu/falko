'use client';

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

/**
 * Skeleton dla karty produktu
 */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <Skeleton className="aspect-square w-full" />
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-3 p-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <div className="flex w-full gap-2 mt-3">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-9" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Skeleton dla listy produktów w siatce
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton dla szczegółów produktu
 */
export function ProductDetailsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Zdjęcie produktu */}
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-20 h-20 rounded-md" />
            ))}
          </div>
        </div>

        {/* Informacje o produkcie */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          {/* Opcje produktu */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="w-12 h-8" />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="w-8 h-8 rounded-full" />
                ))}
              </div>
            </div>
          </div>

          {/* Przyciski akcji */}
          <div className="flex gap-3">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 w-11" />
          </div>

          {/* Dodatkowe informacje */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton dla sekcji hero na stronie głównej
 */
export function HeroSkeleton() {
  return (
    <div className="relative min-h-[60vh] bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center space-y-6">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
          <div className="flex justify-center gap-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton dla nagłówka strony
 */
export function PageHeaderSkeleton() {
  return (
    <div className="border-b bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton dla koszyka
 */
export function CartSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex gap-4">
            <Skeleton className="w-16 h-16 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        </Card>
      ))}
      
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex justify-between font-bold">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-11 w-full mt-4" />
        </div>
      </Card>
    </div>
  );
}

/**
 * Skeleton dla konta użytkownika
 */
export function AccountSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header profilu */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </Card>

      {/* Menu sekcji */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-md" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Ostatnie zamówienia */}
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b last:border-b-0">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/**
 * Skeleton dla formularzy
 */
export function FormSkeleton() {
  return (
    <Card className="p-6 w-full max-w-md mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        
        <Skeleton className="h-11 w-full" />
        
        <div className="text-center">
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Skeleton dla całej strony
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen">
      <PageHeaderSkeleton />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <HeroSkeleton />
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  );
}
