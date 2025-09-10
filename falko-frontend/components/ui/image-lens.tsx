"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface ImageLensProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  zoomFactor?: number;
}

export const ImageLens = ({
  src,
  alt,
  width = 600,
  height = 600,
  className = "",
  zoomFactor = 4,
}: ImageLensProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const lensSize = 200;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate lens position (centered on cursor)
    const lensX = Math.max(
      lensSize / 2,
      Math.min(rect.width - lensSize / 2, x)
    );
    const lensY = Math.max(
      lensSize / 2,
      Math.min(rect.height - lensSize / 2, y)
    );

    setMousePosition({ x, y });
    setLensPosition({ x: lensX, y: lensY });
  };

  const backgroundPosition = `${
    (lensPosition.x / (imageRef.current?.offsetWidth || 1)) * 100
  }% ${(lensPosition.y / (imageRef.current?.offsetHeight || 1)) * 100}%`;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        ref={imageRef}
        className="relative cursor-crosshair"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="h-full w-full object-cover transition-transform duration-300"
          priority
        />

        {/* Lens overlay */}
        {isHovered && (
          <motion.div
            className="absolute pointer-events-none border-4 border-white shadow-2xl"
            style={{
              width: lensSize,
              height: lensSize,
              left: lensPosition.x - lensSize / 2,
              top: lensPosition.y - lensSize / 2,
              backgroundImage: `url(${src})`,
              backgroundSize: `${zoomFactor * 100}%`,
              backgroundPosition,
              backgroundRepeat: "no-repeat",
              borderRadius: "50%",
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {/* Overlay for better lens visibility */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 bg-black/10 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    </div>
  );
};

export default ImageLens;
