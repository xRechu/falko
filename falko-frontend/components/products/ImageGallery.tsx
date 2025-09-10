"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import ImageLens from "@/components/ui/image-lens";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface ProductImage {
  id: string;
  url: string;
}

interface ImageGalleryProps {
  images: ProductImage[];
  productTitle: string;
  className?: string;
}

export const ImageGallery = ({ images, productTitle, className = "" }: ImageGalleryProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "Escape") setIsLightboxOpen(false);
  };

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        {/* Main Image with Lens Effect */}
        <motion.div 
          className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg"
          layoutId="product-image"
        >
          <AspectRatio ratio={1} className="overflow-hidden">
            <ImageLens
              src={images[selectedImageIndex]?.url || ''}
              alt={productTitle}
              width={800}
              height={800}
              className="rounded-xl"
              zoomFactor={4}
            />
          </AspectRatio>
          
          {/* Zoom button overlay */}
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
            onClick={() => setIsLightboxOpen(true)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Navigation arrows for main image */}
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
                onClick={prevImage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
                onClick={nextImage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </motion.div>
        
        {/* Thumbnail Images */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                className={`overflow-hidden rounded-lg cursor-pointer transition-all duration-300 shadow-sm ${
                  selectedImageIndex === index 
                    ? 'ring-2 ring-primary shadow-lg scale-105' 
                    : 'hover:shadow-md hover:scale-102'
                }`}
                onClick={() => setSelectedImageIndex(index)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AspectRatio ratio={1}>
                  <Image
                    src={image.url}
                    alt={`${productTitle} - zdjęcie ${index + 1}`}
                    width={200}
                    height={200}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </AspectRatio>
              </motion.div>
            ))}
          </div>
        )}

        {/* Image indicator dots */}
        {images.length > 1 && (
          <div className="flex justify-center space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  selectedImageIndex === index 
                    ? 'bg-primary w-6' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                onClick={() => setSelectedImageIndex(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLightboxOpen(false)}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <motion.div
              className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[selectedImageIndex]?.url || ''}
                alt={`${productTitle} - pełny widok`}
                width={1200}
                height={1200}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />

              {/* Close button */}
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 right-4 shadow-lg"
                onClick={() => setIsLightboxOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Navigation in lightbox */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute left-4 top-1/2 -translate-y-1/2 shadow-lg"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute right-4 top-1/2 -translate-y-1/2 shadow-lg"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {selectedImageIndex + 1} / {images.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageGallery;
