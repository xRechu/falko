export interface PaynowInitiateBody {
  amount: number | string
  currency?: string
  externalId: string
  description: string
  buyer: { email: string }
  continueUrl?: string
  paymentMethodId?: number | string
  authorizationCode?: string
}

export interface PaynowWebhookPayload {
  paymentId?: string
  externalId?: string
  status?: string
  [k: string]: any
}
