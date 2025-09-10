"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { 
  Share2, 
  Truck, 
  Shield, 
  RotateCcw, 
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";

interface ProductDetailsProps {
  title: string;
  subtitle?: string;
  description?: string;
  price?: {
    amount: number;
    currency_code: string;
  };
  isInStock: boolean;
  collection?: {
    title: string;
    handle: string;
  };
  onShare?: () => void;
  className?: string;
}

export const ProductDetails = ({
  title,
  subtitle,
  description,
  price,
  isInStock,
  collection,
  onShare,
  className = ""
}: ProductDetailsProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const features = [
    {
      icon: Truck,
      title: "Darmowa dostawa",
      description: "Od 200 zł"
    },
    {
      icon: Shield,
      title: "Gwarancja jakości",
      description: "30 dni zwrotu"
    },
    {
      icon: RotateCcw,
      title: "Łatwy zwrot",
      description: "Bez dodatkowych kosztów"
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Collection Badge */}
      {collection && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Badge variant="secondary" className="text-xs font-medium">
            {collection.title}
          </Badge>
        </motion.div>
      )}

      {/* Title & Subtitle */}
      {title && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-3">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg text-muted-foreground mb-4">
              {subtitle}
            </p>
          )}
        </motion.div>
      )}

      {/* Price */}
      {price && (
        <motion.div
          className="flex items-center space-x-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-3xl font-bold text-foreground">
            {formatPrice(price.amount)}
          </span>
          <Badge variant={isInStock ? "default" : "destructive"} className="text-xs">
            {isInStock ? "Dostępny" : "Brak w magazynie"}
          </Badge>
        </motion.div>
      )}

      <Separator />

      {/* Action Buttons */}
      <motion.div
        className="flex gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button 
          variant="outline" 
          size="sm"
          className="w-full"
          onClick={onShare}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Udostępnij
        </Button>
      </motion.div>

      {/* Features */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="font-semibold text-foreground flex items-center">
          <Info className="h-4 w-4 mr-2" />
          Dlaczego warto wybrać Falko Project?
        </h3>
        <div className="space-y-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors duration-200"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <feature.icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm text-foreground">
                  {feature.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Description */}
      {description && (
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
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
          
          <AnimatePresence>
            {isDescriptionExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-gray-50/50 rounded-lg">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default ProductDetails;
