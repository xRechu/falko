'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  checkReturnEligibility, 
  createReturn, 
  getReturnReasonOptions, 
  getSizeIssueOptions, 
  getQualityIssueOptions,
  type OrderEligibility,
  type CreateReturnRequest,
  type ReturnItem,
  type Return
} from '@/lib/api/returns'
import { useAuth } from '@/lib/context/auth-context'
import { Package, Gift, CreditCard, Star, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'

interface ReturnRequestModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  orderNumber: string
}

type Step = 'items' | 'survey' | 'refund' | 'confirmation'

export default function ReturnRequestModal({ 
  isOpen, 
  onClose, 
  orderId, 
  orderNumber 
}: ReturnRequestModalProps) {
  const { state } = useAuth()
  const [currentStep, setCurrentStep] = useState<Step>('items')
  const [loading, setLoading] = useState(false)
  const [eligibility, setEligibility] = useState<OrderEligibility | null>(null)
  
  // Form state
  const [selectedItems, setSelectedItems] = useState<ReturnItem[]>([])
  const [reasonCode, setReasonCode] = useState('')
  const [satisfactionRating, setSatisfactionRating] = useState<number>(0)
  const [sizeIssue, setSizeIssue] = useState('')
  const [qualityIssue, setQualityIssue] = useState('')
  const [description, setDescription] = useState('')
  const [refundMethod, setRefundMethod] = useState<'card' | 'loyalty_points'>('loyalty_points')
  
  const [createdReturn, setCreatedReturn] = useState<Return | null>(null)

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderEligibility()
    }
  }, [isOpen, orderId])

  const loadOrderEligibility = async () => {
    setLoading(true)
    try {
  const data = await checkReturnEligibility(orderId, state.user?.id)
      setEligibility(data)
      
      if (!data.eligible) {
        toast.error('To zamówienie nie kwalifikuje się do zwrotu')
        onClose()
      }
    } catch (error) {
      toast.error('Błąd podczas sprawdzania możliwości zwrotu')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleItemToggle = (item: OrderEligibility['items'][0], checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, {
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        title: item.title,
        thumbnail: item.thumbnail
      }])
    } else {
      setSelectedItems(prev => prev.filter(i => i.variant_id !== item.variant_id))
    }
  }

  const handleSubmitReturn = async () => {
    setLoading(true)
    try {
      const returnData: CreateReturnRequest = {
        order_id: orderId,
        items: selectedItems,
        reason_code: reasonCode,
        satisfaction_rating: satisfactionRating || undefined,
        size_issue: sizeIssue || undefined,
        quality_issue: qualityIssue || undefined,
        description: description || undefined,
        refund_method: refundMethod
      }

  const result = await createReturn(returnData, state.user?.id)
      setCreatedReturn(result)
      setCurrentStep('confirmation')
      
      toast.success('Zwrot został zgłoszony pomyślnie!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
      toast.error('Błąd podczas zgłaszania zwrotu', {
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const canProceedFromItems = selectedItems.length > 0
  const canProceedFromSurvey = reasonCode !== ''
  const canProceedFromRefund = Boolean(refundMethod)

  const totalRefundAmount = selectedItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  const loyaltyBonus = Math.floor(totalRefundAmount * 0.1) // 10% bonus
  const loyaltyTotal = totalRefundAmount + loyaltyBonus

  const resetModal = () => {
    setCurrentStep('items')
    setSelectedItems([])
    setReasonCode('')
    setSatisfactionRating(0)
    setSizeIssue('')
    setQualityIssue('')
    setDescription('')
    setRefundMethod('loyalty_points')
    setCreatedReturn(null)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  if (loading && !eligibility) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Sprawdzanie możliwości zwrotu...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Zgłoś zwrot - Zamówienie #{orderNumber}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-6">
          {(['items', 'survey', 'refund', 'confirmation'] as Step[]).map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${currentStep === step ? 'bg-blue-600 text-white' : 
                  index < (['items', 'survey', 'refund', 'confirmation'] as Step[]).indexOf(currentStep) 
                    ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}
              `}>
                {index < (['items', 'survey', 'refund', 'confirmation'] as Step[]).indexOf(currentStep) ? 
                  <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>
              {index < 3 && (
                <div className={`w-16 h-1 mx-2 ${
                  index < (['items', 'survey', 'refund', 'confirmation'] as Step[]).indexOf(currentStep) 
                    ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Items */}
        {currentStep === 'items' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Wybierz produkty do zwrotu</h3>
              <p className="text-sm text-gray-600 mb-4">
                Zaznacz produkty, które chcesz zwrócić z tego zamówienia.
              </p>
            </div>

            <div className="space-y-3">
              {eligibility?.items.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={selectedItems.some(i => i.variant_id === item.variant_id)}
                      onCheckedChange={(checked) => handleItemToggle(item, checked as boolean)}
                    />
                    {item.thumbnail && (
                      <img 
                        src={item.thumbnail} 
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-600">
                        Ilość: {item.quantity} | Cena: {(item.unit_price / 100).toFixed(2)} zł
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {((item.unit_price * item.quantity) / 100).toFixed(2)} zł
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {selectedItems.length > 0 && (
              <Card className="p-4 bg-blue-50">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Łączna kwota zwrotu:</span>
                  <span className="text-lg font-bold">
                    {(totalRefundAmount / 100).toFixed(2)} zł
                  </span>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: Survey */}
        {currentStep === 'survey' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Ankieta zwrotu</h3>
              <p className="text-sm text-gray-600 mb-4">
                Pomóż nam zrozumieć powód zwrotu - to pomoże nam ulepszyć nasze produkty.
              </p>
            </div>

            {/* Reason Code */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Powód zwrotu <span className="text-red-500">*</span>
              </Label>
              <Select value={reasonCode} onValueChange={setReasonCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz powód zwrotu" />
                </SelectTrigger>
                <SelectContent>
                  {getReturnReasonOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Satisfaction Rating */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Jak oceniasz produkt? (opcjonalne)
              </Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setSatisfactionRating(rating)}
                    className={`p-1 ${satisfactionRating >= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    <Star className="h-6 w-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* Size Issue */}
            {reasonCode === 'wrong_size' && (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Jaki problem z rozmiarem?
                </Label>
                <Select value={sizeIssue} onValueChange={setSizeIssue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz problem z rozmiarem" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSizeIssueOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quality Issue */}
            {reasonCode === 'quality_issue' && (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Jaki problem z jakością?
                </Label>
                <Select value={qualityIssue} onValueChange={setQualityIssue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz problem z jakością" />
                  </SelectTrigger>
                  <SelectContent>
                    {getQualityIssueOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Dodatkowe uwagi (opcjonalne)
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opisz szczegóły problemu..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        )}

        {/* Step 3: Refund Method */}
        {currentStep === 'refund' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Wybierz metodę zwrotu</h3>
              <p className="text-sm text-gray-600 mb-4">
                Zdecyduj, w jaki sposób chcesz otrzymać zwrot za wybrane produkty.
              </p>
            </div>

            <RadioGroup value={refundMethod} onValueChange={(value) => setRefundMethod(value as 'card' | 'loyalty_points')}>
              {/* Loyalty Points Option */}
              <Card className="p-4 border-2 border-green-200 bg-green-50">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="loyalty_points" id="loyalty_points" />
                  <Label htmlFor="loyalty_points" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Punkty lojalnościowe</span>
                        <Badge className="bg-green-100 text-green-800">+10% BONUS!</Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {Math.floor(loyaltyTotal / 100)} punktów
                        </div>
                        <div className="text-sm text-gray-600">
                          ({(totalRefundAmount / 100).toFixed(2)} zł + {(loyaltyBonus / 100).toFixed(2)} zł bonus)
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Otrzymasz dodatkowe 10% wartości w punktach lojalnościowych, które możesz wykorzystać na kolejne zakupy.
                    </p>
                  </Label>
                </div>
              </Card>

              {/* Card Refund Option */}
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-gray-600" />
                        <span className="font-medium">Zwrot na kartę</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {(totalRefundAmount / 100).toFixed(2)} zł
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Standardowy zwrot na kartę płatniczą w ciągu 3-5 dni roboczych.
                    </p>
                  </Label>
                </div>
              </Card>
            </RadioGroup>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 'confirmation' && createdReturn && (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-green-600 mb-2">
                Zwrot zgłoszony pomyślnie!
              </h3>
              <p className="text-gray-600">
                Numer zwrotu: <span className="font-mono font-medium">{createdReturn.id}</span>
              </p>
            </div>

            <Card className="p-6 bg-blue-50">
              <h4 className="font-semibold mb-3">📧 Co dalej?</h4>
              <div className="text-sm text-gray-700 space-y-2">
                <p>• Wysłaliśmy na Twój email instrukcje wraz z QR kodem do darmowej wysyłki</p>
                <p>• Zapakuj produkty w oryginalne opakowanie</p>
                <p>• Wydrukuj i przyklej QR kod do paczki</p>
                <p>• Zadzwoń po kuriera lub zostaw w punkcie odbioru</p>
              </div>
            </Card>

            <div className="flex gap-3 justify-center">
              <Button onClick={handleClose}>
                Zamknij
              </Button>
              <Button variant="outline" onClick={() => {
                // TODO: Navigate to returns history
                handleClose()
              }}>
                Zobacz historię zwrotów
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep !== 'confirmation' && (
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === 'items') {
                  handleClose()
                } else if (currentStep === 'survey') {
                  setCurrentStep('items')
                } else if (currentStep === 'refund') {
                  setCurrentStep('survey')
                }
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStep === 'items' ? 'Anuluj' : 'Wstecz'}
            </Button>

            <Button
              onClick={() => {
                if (currentStep === 'items' && canProceedFromItems) {
                  setCurrentStep('survey')
                } else if (currentStep === 'survey' && canProceedFromSurvey) {
                  setCurrentStep('refund')
                } else if (currentStep === 'refund' && canProceedFromRefund) {
                  handleSubmitReturn()
                }
              }}
              disabled={
                loading ||
                (currentStep === 'items' && !canProceedFromItems) ||
                (currentStep === 'survey' && !canProceedFromSurvey) ||
                (currentStep === 'refund' && !canProceedFromRefund)
              }
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : currentStep === 'refund' ? null : (
                <ArrowRight className="h-4 w-4 ml-2" />
              )}
              {currentStep === 'items' && 'Dalej'}
              {currentStep === 'survey' && 'Dalej'}
              {currentStep === 'refund' && (loading ? 'Zgłaszanie...' : 'Zgłoś zwrot')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}