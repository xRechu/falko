"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle, Wifi, WifiOff } from "lucide-react";
import { API_CONFIG } from "@/lib/api-config";

interface ApiStatusProps {
  className?: string;
}

export default function ApiStatus({ className }: ApiStatusProps) {
  const [status, setStatus] = useState<'checking' | 'connected' | 'fallback'>('checking');

  useEffect(() => {
    // Sprawdź status Medusa backend API
    const checkApiStatus = async () => {
      try {
        const response = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) {
          setStatus('connected');
        } else {
          setStatus('fallback');
        }
      } catch {
        setStatus('fallback');
      }
    };

    checkApiStatus();
    // Sprawdź co 30 sekund
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusInfo = () => {
    switch (status) {
      case 'checking':
        return {
          icon: <Wifi className="h-3 w-3" />,
          text: 'Sprawdzanie...',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
        };
      case 'connected':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Połączono',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
        };
      case 'fallback':
        return {
          icon: <WifiOff className="h-3 w-3" />,
          text: 'Mock Data',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusInfo.bgColor} ${statusInfo.textColor} ${className}`}>
      {statusInfo.icon}
      <span>{statusInfo.text}</span>
    </div>
  );
}
