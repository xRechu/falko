'use client';

import { useState, useEffect } from 'react';
import { API_CONFIG } from '@/lib/api-config';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Wifi, WifiOff, Database, Server } from 'lucide-react';
import { motion } from 'framer-motion';

export function LoyaltyConnectionStatus() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected' | 'cors_error'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  useEffect(() => {
    checkBackendConnection();
    const interval = setInterval(checkBackendConnection, 30000); // Sprawdź co 30 sekund
    return () => clearInterval(interval);
  }, []);

  const checkBackendConnection = async () => {
    try {
      console.log('🔍 Checking backend connection...');
      
      const baseURL = API_CONFIG.MEDUSA_BACKEND_URL;
      if (!baseURL) {
        console.warn('⚠️ Brak MEDUSA_BACKEND_URL – pomijam sprawdzenie backendu');
        setBackendStatus('disconnected');
        setLastCheck(new Date());
        return;
      }
      const response = await fetch(`${baseURL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      setLastCheck(new Date());

      if (response.ok) {
        setBackendStatus('connected');
        console.log('✅ Backend connection successful');
      } else {
        setBackendStatus('disconnected');
        console.log('❌ Backend responded with error:', response.status);
      }
    } catch (error: any) {
      setLastCheck(new Date());
      
      if (error.message?.includes('CORS') || error.name === 'TypeError') {
        setBackendStatus('cors_error');
        console.log('🚫 CORS error - backend available but not configured for frontend');
      } else {
        setBackendStatus('disconnected');
        console.log('❌ Backend connection failed:', error);
      }
    }
  };

  const getStatusInfo = () => {
    switch (backendStatus) {
      case 'checking':
        return {
          icon: <Wifi className="h-4 w-4 animate-pulse" />,
          text: 'Sprawdzanie połączenia...',
          variant: 'secondary' as const,
          color: 'text-blue-600'
        };
      case 'connected':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Połączono z API',
          variant: 'default' as const,
          color: 'text-green-600'
        };
      case 'cors_error':
        return {
          icon: <Server className="h-4 w-4" />,
          text: 'Backend dostępny (CORS)',
          variant: 'destructive' as const,
          color: 'text-orange-600'
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: 'Tryb offline',
          variant: 'secondary' as const,
          color: 'text-gray-600'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="border-dashed bg-muted/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${statusInfo.color}`}>
              {statusInfo.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Status połączenia</span>
                <Badge variant={statusInfo.variant} className="text-xs">
                  {statusInfo.text}
                </Badge>
              </div>
              {lastCheck && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ostatnie sprawdzenie: {lastCheck.toLocaleTimeString('pl-PL')}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {backendStatus === 'connected' ? 'Live API' : 'Mock Data'}
            </span>
          </div>
        </div>

        {backendStatus === 'cors_error' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-orange-800 dark:text-orange-200">
                <p className="font-medium">Backend Medusa.js jest dostępny, ale wymaga konfiguracji CORS</p>
                <p className="mt-1 text-orange-700 dark:text-orange-300">
                  System działa w trybie offline z danymi demonstracyjnymi.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {backendStatus === 'disconnected' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 bg-gray-50 dark:bg-gray-950/50 border border-gray-200 dark:border-gray-800 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-800 dark:text-gray-200">
                <p className="font-medium">Backend Medusa.js nie jest dostępny</p>
                <p className="mt-1 text-gray-700 dark:text-gray-300">
                  Sprawdź czy serwer działa na porcie 9000. System używa danych demonstracyjnych.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
