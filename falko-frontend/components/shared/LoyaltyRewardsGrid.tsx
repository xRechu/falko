'use client';

import { useState } from 'react';
import { useLoyalty, LoyaltyReward } from '@/lib/context/loyalty-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, Gift, Truck, Percent, Crown, Lock, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function LoyaltyRewardsGrid() {
  const { points, availableRewards, redeemReward, loading } = useLoyalty();
  const [selectedReward, setSelectedReward] = useState<LoyaltyReward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const getCategoryIcon = (category: LoyaltyReward['category']) => {
    switch (category) {
      case 'discount': return <Percent className="h-5 w-5" />;
      case 'shipping': return <Truck className="h-5 w-5" />;
      case 'product': return <Gift className="h-5 w-5" />;
      case 'exclusive': return <Crown className="h-5 w-5" />;
      default: return <Star className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: LoyaltyReward['category']) => {
    switch (category) {
      case 'discount': return 'text-green-500';
      case 'shipping': return 'text-blue-500';
      case 'product': return 'text-purple-500';
      case 'exclusive': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const canRedeem = (reward: LoyaltyReward) => points >= reward.pointsCost;

  const handleRedeemClick = (reward: LoyaltyReward) => {
    setSelectedReward(reward);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedReward) return;
    
    setIsRedeeming(true);
    const success = await redeemReward(selectedReward.id);
    
    if (success) {
      setSelectedReward(null);
    }
    setIsRedeeming(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {availableRewards.map((reward, index) => {
          const canRedeemReward = canRedeem(reward);
          return (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  "relative overflow-hidden transition-all duration-200",
                  canRedeemReward ? "hover:shadow-md hover:border-primary cursor-pointer" : "opacity-60 cursor-not-allowed"
                )}
              >
                {reward.isLimited && (
                  <Badge className="absolute top-2 right-2 z-10" variant="destructive">
                    Limitowana
                  </Badge>
                )}
                <div className="p-4 md:p-5 flex items-start md:items-center gap-4">
                  <div className={cn("p-2 rounded-full bg-muted", getCategoryColor(reward.category))}>
                    {getCategoryIcon(reward.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-base md:text-lg truncate">{reward.title}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2 md:line-clamp-1">{reward.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-bold">{reward.pointsCost}</span>
                        <span className="text-muted-foreground text-xs">pkt</span>
                      </div>
                    </div>
                    {!canRedeemReward && (
                      <div className="flex items-center gap-2 mt-2 text-muted-foreground text-xs">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Brakuje {reward.pointsCost - points} pkt</span>
                      </div>
                    )}
                  </div>
                  <div className="w-36">
                    <Button
                      onClick={() => handleRedeemClick(reward)}
                      disabled={!canRedeemReward || loading}
                      className="w-full"
                      variant={canRedeemReward ? "default" : "outline"}
                    >
                      {canRedeemReward ? 'Odbierz' : 'Odblokuj'}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Premium Dialog potwierdzenia */}
      <Dialog open={!!selectedReward} onOpenChange={(open) => !open && setSelectedReward(null)}>
        <DialogContent className="sm:max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Star className="h-8 w-8 text-white fill-current" />
              </div>
              <DialogTitle className="text-xl font-bold">
                Wykorzystaj punkty lojalnościowe
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Potwierdzasz wykorzystanie punktów na wybraną nagrodę?
              </DialogDescription>
            </DialogHeader>
            
            {selectedReward && (
              <div className="my-6">
                {/* Karta nagrody */}
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 border-2 border-primary/20">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-xl bg-white dark:bg-gray-800 shadow-lg",
                      getCategoryColor(selectedReward.category)
                    )}>
                      {getCategoryIcon(selectedReward.category)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-bold text-lg leading-tight">{selectedReward.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {selectedReward.description}
                      </p>
                      {selectedReward.isLimited && (
                        <Badge variant="destructive" className="text-xs">
                          🔥 Oferta limitowana
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Koszt punktów */}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Koszt:</span>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-bold text-lg">{selectedReward.pointsCost}</span>
                        <span className="text-muted-foreground text-sm">punktów</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Status punktów */}
                <div className="mt-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between text-sm">
                    <span>Twoje punkty:</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-semibold">{points}</span>
                    </div>
                  </div>
                  {selectedReward && (
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span>Po wykorzystaniu:</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span className={cn(
                          "font-semibold",
                          points >= selectedReward.pointsCost ? "text-green-600" : "text-red-600"
                        )}>
                          {points - selectedReward.pointsCost}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Komunikat o braku punktów */}
                {selectedReward && points < selectedReward.pointsCost && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="h-3 w-3 text-red-600" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-red-800 dark:text-red-200">
                          Niewystarczająca liczba punktów
                        </p>
                        <p className="text-red-600 dark:text-red-300 mt-1">
                          Potrzebujesz jeszcze {selectedReward.pointsCost - points} punktów, aby odebrać tę nagrodę.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
            
            <DialogFooter className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setSelectedReward(null)}
                className="flex-1"
                disabled={isRedeeming}
              >
                Anuluj
              </Button>
              <Button 
                onClick={handleConfirmRedeem}
                disabled={!selectedReward || points < selectedReward.pointsCost || isRedeeming}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              >
                {isRedeeming ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Przetwarzanie...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-current" />
                    <span>Wykorzystaj punkty</span>
                  </div>
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
