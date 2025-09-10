'use client';

import { useLoyalty, LoyaltyTransaction } from '@/lib/context/loyalty-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Clock, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

export function LoyaltyHistory() {
  const { pointsHistory, loading } = useLoyalty();

  const getTransactionIcon = (transaction: LoyaltyTransaction) => {
    if (transaction.type === 'earned') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: pl });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historia Punktów
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-muted-foreground/20 rounded-full" />
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-muted-foreground/20 rounded" />
                    <div className="h-3 w-24 bg-muted-foreground/20 rounded" />
                  </div>
                </div>
                <div className="h-6 w-16 bg-muted-foreground/20 rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Historia Punktów
        </CardTitle>
        <CardDescription>
          Ostatnie {pointsHistory.length} transakcji punktowych
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pointsHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Brak historii punktów</p>
            <p className="text-sm">Punkty pojawią się tu po pierwszym zakupie</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {pointsHistory.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction)}
                    <div>
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.createdAt)}
                      </p>
                      {transaction.orderId && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {transaction.orderId}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={transaction.type === 'earned' ? 'default' : 'destructive'}
                      className="font-bold"
                    >
                      {transaction.type === 'earned' ? '+' : '-'}{transaction.points}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
