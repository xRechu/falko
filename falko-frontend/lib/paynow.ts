/**
 * Paynow V3 helper: podpisy HMAC, konfiguracja endpointów i nagłówków
 * Uwaga: nie trzymaj kluczy w kodzie. Użyj env: PAYNOW_API_KEY, PAYNOW_SIGNATURE_KEY, PAYNOW_ENV
 */

import crypto from 'crypto'

export type PaynowEnv = 'sandbox' | 'production'

export const getPaynowBaseUrl = (env: PaynowEnv = (process.env.PAYNOW_ENV as PaynowEnv) || 'sandbox') => {
  return env === 'production' ? 'https://api.paynow.pl' : 'https://api.sandbox.paynow.pl'
}

export interface SignatureInputV3 {
  apiKey: string
  idempotencyKey: string
  bodyString: string // dokładny JSON string requestu (bez zmian formatowania)
  signatureKey: string
  parameters?: Record<string, string | number | boolean | undefined>
}

/**
 * Liczy Signature dla requestów (V3) zgodnie z dokumentacją Paynow.
 * Składa payload z: headers(Api-Key, Idempotency-Key), parameters (alfabetycznie) oraz body string.
 */
export function calculateRequestSignatureV3(input: SignatureInputV3): string {
  const { apiKey, idempotencyKey, bodyString, signatureKey, parameters = {} } = input

  // Posortuj parametry alfabetycznie po kluczach
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

/**
 * Weryfikacja podpisu webhooków: HMAC-SHA256 z surowego body, kluczem Signature-Key, base64.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null, signatureKey: string): boolean {
  if (!signatureHeader) return false
  const hmac = crypto.createHmac('sha256', signatureKey)
  hmac.update(rawBody)
  const computed = hmac.digest('base64')
  // Bezpieczne porównanie czasowe
  try {
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(computed))
  } catch {
    return signatureHeader === computed
  }
}
