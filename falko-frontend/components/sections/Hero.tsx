"use client";

import { HeroParallax } from "@/components/ui/hero-parallax";
import { ProductPreview } from "@/lib/types/product";
import { useState, useEffect } from "react";
import { fetchProducts } from "@/lib/products-service";
import { API_CONFIG } from "@/lib/api-config";

interface HeroProps {
  products?: ProductPreview[];
}

export default function Hero({ products = [] }: HeroProps) {
  const [heroProducts, setHeroProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run once on component mount
    if (heroProducts.length > 0) return; // Don't re-fetch if we already have products
    
    const loadRandomProducts = async () => {
      try {
        // If products are passed as props, use them
        if (products.length > 0) {
          const shuffledProducts = [...products].sort(() => Math.random() - 0.5);
          const formattedProducts = shuffledProducts.map(product => ({
            title: product.title,
            link: `/products/${product.handle}`,
            thumbnail: product.thumbnail || 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop&crop=center'
          }));
          setHeroProducts(formattedProducts);
        } else {
          console.log('🔍 DEBUGGING: Fetching products for hero...');
          console.log('🔍 Backend URL:', API_CONFIG.MEDUSA_BACKEND_URL);
          console.log('🔍 Publishable Key:', API_CONFIG.MEDUSA_PUBLISHABLE_KEY);

          // Attempt real backend first
          const backendUrl = `${API_CONFIG.MEDUSA_BACKEND_URL}/store/products?limit=50`;
          try {
            const response = await fetch(backendUrl, {
              headers: {
                'Content-Type': 'application/json',
                'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY || '',
              },
              credentials: 'include'
            });
            console.log('📡 Medusa /store/products status:', response.status);
            if (response.ok) {
              const data = await response.json();
              if (data?.products?.length) {
                const realProducts = data.products
                  .filter((p: any) => !!p.handle)
                  .sort(() => Math.random() - 0.5)
                  .slice(0, 30)
                  .map((product: any) => ({
                    title: product.title,
                    link: `/products/${product.handle}`,
                    thumbnail: product.thumbnail || product.images?.[0]?.url || 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop&crop=center'
                  }));
                setHeroProducts(realProducts);
                console.log(`✅ Loaded ${realProducts.length} Medusa products.`);
                return;
              }
            }
          } catch (err) {
            console.warn('⚠️ Direct backend fetch failed:', err);
          }

          // Fallback to products service
          const fetchedProducts = await fetchProducts();
          const isMockData = fetchedProducts.some((p: any) => p.title.includes('Falko'));
          if (isMockData) {
            console.warn('⚠️ fetchProducts returned mock data');
            setHeroProducts([
              { title: 'API Connection Issue', link: '#', thumbnail: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop&crop=center' },
              { title: 'Check Medusa Backend', link: '#', thumbnail: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&crop=center' }
            ]);
          } else {
            const randomProducts = [...fetchedProducts]
              .sort(() => Math.random() - 0.5)
              .map((product: any) => ({
                title: product.title,
                link: `/products/${product.handle}`,
                thumbnail: product.thumbnail || product.images?.[0]?.url || 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop&crop=center'
              }));
            setHeroProducts(randomProducts);
            console.log(`✅ Loaded ${randomProducts.length} fallback products.`);
          }
        }
      } catch (error) {
        console.error('❌ Error loading hero products:', error);
        // Fallback products
        setHeroProducts([
          {
            title: "Premium Hoodie",
            link: "/products/premium-hoodie", 
            thumbnail: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop&crop=center"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadRandomProducts();
  }, []); // Empty dependency array - only run once on mount

  // Ensure we have at least 15 products for the 3 rows (5 each) with unique keys
  const extendedProducts = [...heroProducts];
  let duplicateCounter = 1;
  
  while (extendedProducts.length < 15 && heroProducts.length > 0) {
    const remainingSlots = 15 - extendedProducts.length;
    const productsToAdd = heroProducts.slice(0, Math.min(heroProducts.length, remainingSlots));
    
    // Add unique keys to duplicated products
    const uniqueProducts = productsToAdd.map(product => ({
      ...product,
      title: `${product.title}`, // Keep original title
      uniqueKey: `${product.link}-${duplicateCounter}`, // Add unique identifier
    }));
    
    extendedProducts.push(...uniqueProducts);
    duplicateCounter++;
  }

  if (loading) {
    return (
      <div className="h-[300vh] py-40 overflow-hidden antialiased relative flex flex-col self-auto">
        <div className="max-w-7xl relative mx-auto py-20 md:py-40 px-4 w-full">
          <h1 className="text-2xl md:text-7xl font-bold dark:text-white">
            Falko Project <br /> Premium Streetwear
          </h1>
          <p className="max-w-2xl text-base md:text-xl mt-8 dark:text-neutral-200">
            Ładowanie produktów...
          </p>
        </div>
      </div>
    );
  }

  return <HeroParallax products={extendedProducts.slice(0, 15)} />;
}
