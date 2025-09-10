"use client";

import { ProductPreview } from "@/lib/types/product";
import ProductCard from "./ProductCard";
import { motion } from "framer-motion";

interface RelatedProductsProps {
  products: ProductPreview[];
  currentProductId: string;
}

export default function RelatedProducts({ products, currentProductId }: RelatedProductsProps) {
  // Filtruj produkty (usuń aktualny produkt i ogranicz do 4)
  const relatedProducts = products
    .filter(product => product.id !== currentProductId)
    .slice(0, 4);

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 border-t">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold tracking-tight text-foreground mb-8 text-center">
            Może Cię również zainteresować
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
