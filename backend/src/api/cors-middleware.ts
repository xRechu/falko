import { MedusaRequest, MedusaResponse, MedusaNextFunction } from '@medusajs/framework';
import { ADMIN_CORS, AUTH_CORS, STORE_CORS } from '../lib/constants'

/**
 * CORS middleware for enhanced cookie support
 * Ensures cookies are properly handled across domains
 */
export function corsMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): void {
  const origin = req.headers.origin as string

  // Build allowed origins union from env CORS settings
  const parseOrigins = (v?: string) => (v || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  const allowedOrigins = new Set<string>([
    ...parseOrigins(STORE_CORS),
    ...parseOrigins(AUTH_CORS),
    ...parseOrigins(ADMIN_CORS),
    // safe fallbacks
    'http://localhost:3000',
    'https://falkoprojects.com',
    'https://www.falkoprojects.com',
  ])

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  // CORS essentials
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')

  // Respect requested headers, but always include our known list
  const reqHeaders = (req.headers['access-control-request-headers'] as string) || ''
  const baseAllowedHeaders = [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cookie',
    'x-publishable-api-key',
  ]
  const mergedHeaders = Array.from(new Set([...baseAllowedHeaders, ...reqHeaders.split(',').map(h => h.trim()).filter(Boolean)]))
  res.setHeader('Access-Control-Allow-Headers', mergedHeaders.join(', '))

  res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie')
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Max-Age', '600')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  next()
}