'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Shield, 
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { getSupportedPaymentMethods, formatPaymentAmount } from '@/lib/api/payments'

interface PaymentMethodSelectorProps {
  totalAmount: number
  currency?: string
  onPaymentMethodSelect: (method: string) => void
  onProceedToPayment: () => void
  loading?: boolean
  selectedMethod?: string
}

export default function PaymentMethodSelector({
  totalAmount,
  currency = 'PLN',
  onPaymentMethodSelect,
  onProceedToPayment,
  loading = false,
  selectedMethod = 'online'
}: PaymentMethodSelectorProps) {
  const [selected, setSelected] = useState(selectedMethod)
  const paymentMethods = getSupportedPaymentMethods()

  const handleMethodChange = (method: string) => {
    setSelected(method)
    onPaymentMethodSelect(method)
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'Karta płatnicza': return <CreditCard className="h-4 w-4" />
      case 'BLIK': return <Smartphone className="h-4 w-4" />
      case 'Przelew bankowy': return <Building2 className="h-4 w-4" />
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Wybierz metodę płatności</h3>
        <p className="text-sm text-gray-600">
          Wszystkie płatności są zabezpieczone i szyfrowane
        </p>
      </div>

      <RadioGroup value={selected} onValueChange={handleMethodChange}>
        {paymentMethods.map((provider) => (
          <Card key={provider.id} className={`p-4 cursor-pointer transition-all ${
            selected === provider.id 
              ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
              : 'hover:border-gray-300'
          }`}>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value={provider.id} id={provider.id} />
              <Label htmlFor={provider.id} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-xs">AP</span>
                    </div>
                    <div>
                      <div className="font-medium">{provider.name}</div>
                      <div className="text-sm text-gray-600">{provider.description}</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Shield className="h-3 w-3 mr-1" />
                    Bezpieczne
                  </Badge>
                </div>
              </Label>
            </div>

            {selected === provider.id && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {provider.methods.map((method, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                      {getMethodIcon(method)}
                      <span>{method}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <CheckCircle className="h-4 w-4" />
                    <span>Płatność zostanie przetworzona przez bezpieczną bramkę płatniczą</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </RadioGroup>

      <Separator />

      {/* Payment Summary */}
      <Card className="p-4 bg-gray-50">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">Metoda płatności:</span>
            <span className="text-blue-600 font-medium">
              {paymentMethods.find(p => p.id === selected)?.name}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Kwota do zapłaty:</span>
            <span className="text-xl font-bold text-green-600">
              {formatPaymentAmount(totalAmount, currency)}
            </span>
          </div>
        </div>
      </Card>

      {/* Security Info */}
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <Shield className="h-4 w-4 text-green-600" />
        <span>
          Twoje dane są chronione przez szyfrowanie SSL 256-bit. 
          Nie przechowujemy danych karty płatniczej.
        </span>
      </div>

      {/* Proceed Button */}
      <Button 
        onClick={onProceedToPayment}
        disabled={!selected || loading}
        className="w-full h-12 text-lg font-medium"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Przekierowywanie do płatności...
          </>
        ) : (
          <>
            Przejdź do płatności
            <ArrowRight className="h-5 w-5 ml-2" />
          </>
        )}
      </Button>

      {/* Payment Methods Info */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Akceptujemy wszystkie główne karty płatnicze oraz BLIK
        </p>
        <div className="flex justify-center gap-2 mt-2">
          {['💳', '📱', '🏦', '🅿️', '🍎', '🔍'].map((icon, index) => (
            <span key={index} className="text-lg opacity-60">{icon}</span>
          ))}
        </div>
      </div>
    </div>
  )
}