'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowLeft, 
  RefreshCw,
  CreditCard,
  Shield
} from 'lucide-react'
import { checkPaymentStatus, formatPaymentAmount, type PaymentStatus } from '@/lib/api/payments'
import { toast } from 'sonner'

interface PaymentProcessingProps {
  orderId: string
  onPaymentSuccess: (order: PaymentStatus) => void
  onPaymentFailed: (error: string) => void
  onReturnToCheckout: () => void
}

export default function PaymentProcessing({
  orderId,
  onPaymentSuccess,
  onPaymentFailed,
  onReturnToCheckout
}: PaymentProcessingProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkCount, setCheckCount] = useState(0)

  useEffect(() => {
    if (orderId) {
      checkStatus()
      
      // Set up polling for payment status
      const interval = setInterval(() => {
        if (checkCount < 30) { // Max 30 checks (5 minutes)
          checkStatus()
          setCheckCount(prev => prev + 1)
        } else {
          clearInterval(interval)
          setError('Timeout sprawdzania płatności')
        }
      }, 10000) // Check every 10 seconds

      return () => clearInterval(interval)
    }
  }, [orderId, checkCount])

  const checkStatus = async () => {
    try {
      setLoading(true)
      const status = await checkPaymentStatus(orderId)
      setPaymentStatus(status)

      if (status.payment_status === 'captured') {
        onPaymentSuccess(status)
      } else if (status.payment_status === 'failed') {
        onPaymentFailed('Płatność nie powiodła się')
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Error checking payment status:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    setCheckCount(0)
    checkStatus()
  }

  const getStatusIcon = () => {
    if (loading) return <Clock className="h-8 w-8 text-blue-600 animate-pulse" />
    if (error) return <AlertCircle className="h-8 w-8 text-red-600" />
    
    switch (paymentStatus?.payment_status) {
      case 'captured':
        return <CheckCircle className="h-8 w-8 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-8 w-8 text-red-600" />
      default:
        return <Clock className="h-8 w-8 text-blue-600 animate-pulse" />
    }
  }

  const getStatusMessage = () => {
    if (loading && !paymentStatus) return 'Sprawdzanie statusu płatności...'
    if (error) return error
    
    switch (paymentStatus?.payment_status) {
      case 'captured':
        return 'Płatność została pomyślnie przetworzona!'
      case 'failed':
        return 'Płatność nie powiodła się. Spróbuj ponownie.'
      case 'pending':
        return 'Oczekiwanie na potwierdzenie płatności...'
      default:
        return 'Sprawdzanie statusu płatności...'
    }
  }

  const getStatusColor = () => {
    if (error) return 'text-red-600'
    
    switch (paymentStatus?.payment_status) {
      case 'captured':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Status Card */}
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>
          
          <div>
            <h2 className={`text-xl font-semibold ${getStatusColor()}`}>
              {getStatusMessage()}
            </h2>
            {paymentStatus && (
              <p className="text-sm text-gray-600 mt-2">
                Zamówienie #{paymentStatus.order_id}
              </p>
            )}
          </div>

          {paymentStatus?.payment_status === 'pending' && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Automatyczne sprawdzanie co 10 sekund...</span>
            </div>
          )}
        </div>
      </Card>

      {/* Payment Details */}
      {paymentStatus && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Szczegóły płatności</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Numer zamówienia:</span>
              <span className="font-medium">#{paymentStatus.order_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Kwota:</span>
              <span className="font-medium">
                {formatPaymentAmount(paymentStatus.total_amount, paymentStatus.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status płatności:</span>
              <Badge className={
                paymentStatus.payment_status === 'captured' 
                  ? 'bg-green-100 text-green-800'
                  : paymentStatus.payment_status === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }>
                {paymentStatus.payment_status === 'captured' && 'Opłacone'}
                {paymentStatus.payment_status === 'failed' && 'Nieudane'}
                {paymentStatus.payment_status === 'pending' && 'Oczekuje'}
              </Badge>
            </div>
      {paymentStatus.transaction_id && (
              <div className="flex justify-between">
                <span className="text-gray-600">ID transakcji:</span>
        <span className="font-mono text-sm">{paymentStatus.transaction_id}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Security Info */}
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <Shield className="h-4 w-4 text-green-600" />
        <span>
          Płatność jest przetwarzana przez bezpieczną bramkę płatniczą
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {error && (
          <Button 
            onClick={handleRetry}
            variant="outline"
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sprawdź ponownie
          </Button>
        )}
        
        {(error || paymentStatus?.payment_status === 'failed') && (
          <Button 
            onClick={onReturnToCheckout}
            variant="outline"
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót do checkout
          </Button>
        )}
      </div>

      {/* Help Text */}
      {paymentStatus?.payment_status === 'pending' && (
        <div className="text-center text-sm text-gray-600 space-y-2">
          <p>
            Jeśli płatność trwa dłużej niż zwykle, sprawdź swoją aplikację bankową 
            lub skontaktuj się z nami.
          </p>
          <div className="flex items-center justify-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Płatność może potrwać do 5 minut</span>
          </div>
        </div>
      )}
    </div>
  )
}