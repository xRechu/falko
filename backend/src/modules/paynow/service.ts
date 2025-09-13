/**
 * Paynow V3 helper for backend plugin: signature HMAC, endpoint selection, webhook verification.
 */

import crypto from 'crypto'

export type PaynowEnv = 'sandbox' | 'production'

export const getPaynowBaseUrl = (env: PaynowEnv = (process.env.PAYNOW_ENV as PaynowEnv) || 'sandbox') => {
  return env === 'production' ? 'https://api.paynow.pl' : 'https://api.sandbox.paynow.pl'
}

export interface SignatureInputV3 {
  apiKey: string
  idempotencyKey: string
  bodyString: string // exact request JSON string
  signatureKey: string
  parameters?: Record<string, string | number | boolean | undefined>
}

export function calculateRequestSignatureV3(input: SignatureInputV3): string {
  const { apiKey, idempotencyKey, bodyString, signatureKey, parameters = {} } = input

  const sortedParams: Record<string, any> = {}
  Object.keys(parameters)
    .sort((a, b) => a.localeCompare(b))
    .forEach((k) => {
      const v = (parameters as any)[k]
      if (v !== undefined && v !== null && v !== '') {
        sortedParams[k] = v
      }
    })

  const payload = {
    headers: {
      'Api-Key': apiKey,
      'Idempotency-Key': idempotencyKey,
    },
    parameters: sortedParams,
    body: bodyString ?? '',
  }

  const payloadString = JSON.stringify(payload)
  const hmac = crypto.createHmac('sha256', signatureKey)
  hmac.update(payloadString)
  return hmac.digest('base64')
}

export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null, signatureKey: string): boolean {
  if (!signatureHeader) return false
  const hmac = crypto.createHmac('sha256', signatureKey)
  hmac.update(rawBody)
  const computed = hmac.digest('base64')
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(computed))
  } catch {
    return signatureHeader === computed
  }
}
