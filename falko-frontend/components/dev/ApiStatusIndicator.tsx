"use client";

import { useState, useEffect } from "react";
import { API_CONFIG } from "@/lib/api-config";

interface ApiStatus {
  medusa: 'checking' | 'online' | 'offline';
  lastCheck: Date;
}

export default function ApiStatusIndicator() {
  const [status, setStatus] = useState<ApiStatus>({
    medusa: 'checking',
    lastCheck: new Date()
  });

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5s timeout
        });
        
        setStatus({
          medusa: response.ok ? 'online' : 'offline',
          lastCheck: new Date()
        });
      } catch (error) {
        console.log('Medusa API check failed:', error);
        setStatus({
          medusa: 'offline',
          lastCheck: new Date()
        });
      }
    };

    // Check immediately
    checkApiStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'API Online';
      case 'offline': return 'Using Mock Data';
      default: return 'Checking...';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-3 text-sm">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(status.medusa)}`}></div>
        <span className="font-medium">Medusa:</span>
        <span>{getStatusText(status.medusa)}</span>
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Last check: {status.lastCheck.toLocaleTimeString()}
      </div>
    </div>
  );
}
