'use client';

import { useLoyalty } from '@/lib/context/loyalty-context';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface PointsEarningBadgeProps {
  orderTotal: number;
  variant?: 'default' | 'large';
  className?: string;
}

export function PointsEarningBadge({ 
  orderTotal, 
  variant = 'default',
  className = ''
}: PointsEarningBadgeProps) {
  const { getPointsForOrder } = useLoyalty();
  const pointsToEarn = getPointsForOrder(orderTotal);

  if (pointsToEarn === 0) return null;

  if (variant === 'large') {
    return (
      <motion.div 
        className={`flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg ${className}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-2 bg-yellow-100 rounded-full">
          <Star className="h-5 w-5 text-yellow-600 fill-current" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="font-medium text-sm">
              Zdobędziesz <span className="font-bold text-yellow-700">{pointsToEarn} punktów</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Za ten zakup (1 punkt za każde 1 PLN)
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Badge 
        variant="secondary" 
        className={`flex items-center gap-1 ${className}`}
      >
        <Star className="h-3 w-3 text-yellow-500 fill-current" />
        <span className="text-xs">+{pointsToEarn} pkt</span>
      </Badge>
    </motion.div>
  );
}
