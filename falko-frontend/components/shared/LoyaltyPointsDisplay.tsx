'use client';

import { useLoyalty } from '@/lib/context/loyalty-context';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoyaltyPointsDisplayProps {
  variant?: 'header' | 'profile';
  className?: string;
}

export function LoyaltyPointsDisplay({ 
  variant = 'header', 
  className = '' 
}: LoyaltyPointsDisplayProps) {
  const { points, loading, tier, nextTier, pointsToNextTier, lifetimeSpent } = useLoyalty() as any;

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 w-16 bg-muted rounded" />
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <motion.div 
        className={`flex items-center gap-1 ${className}`}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <Star className="h-4 w-4 text-yellow-500 fill-current" />
        <span className="text-sm font-medium">{points}</span>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`inline-flex flex-col gap-2 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1 text-base">
          <Star className="h-5 w-5 text-yellow-500 fill-current" />
          <span className="font-bold">{points.toLocaleString('pl-PL')}</span>
          <span className="text-muted-foreground">pkt</span>
        </Badge>
        <Badge className={`bg-gradient-to-r ${tier.gradient} text-white border-0 shadow`}>{tier.name}</Badge>
      </div>
      {nextTier && (
        <div className="w-full">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Do {nextTier.name}:</span>
            <span>{pointsToNextTier} zł</span>
          </div>
          <div className="h-2 w-full rounded bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 transition-all"
              style={{ 
                width: (() => {
                  const base = tier.minAmount ?? 0;
                  const target = nextTier.minAmount ?? (base + 1);
                  const progress = (lifetimeSpent - base) / Math.max(1, target - base);
                  return `${Math.min(100, Math.max(0, progress * 100))}%`;
                })()
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
