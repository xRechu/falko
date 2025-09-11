import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import { furgonetkaOAuth } from 'modules/furgonetka/services/oauth'
import { PickupPointSearchBody, FurgonetkaPickupPoint } from 'modules/furgonetka/types'
import crypto from 'crypto'

// Prosty in-memory cache + pending (coalescing) + limiter + breaker
interface CacheEntry { expires: number; data: any; etag: string }
const cache = new Map<string, CacheEntry>()
const pending = new Map<string, Promise<any>>()
const DEFAULT_TTL = Number(process.env.FURGONETKA_POINTS_CACHE_TTL || 600_000)

// Rate limit lokalny
const RATE_LIMIT_ENABLED = process.env.FURGONETKA_LOCAL_RATE_LIMIT === '1'
const RL_WINDOW = Number(process.env.FURGONETKA_RATE_LIMIT_WINDOW_MS || 60_000)
const RL_MAX = Number(process.env.FURGONETKA_RATE_LIMIT_MAX || 120)
interface RLState { count: number; reset: number }
const rlMap = new Map<string, RLState>()

// Circuit breaker lokalny
const BREAKER_THRESHOLD = Number(process.env.FURGONETKA_BREAKER_FAILURE_THRESHOLD || 0)
const BREAKER_COOLDOWN = Number(process.env.FURGONETKA_BREAKER_COOLDOWN_MS || 60_000)
let breakerFails = 0
let breakerOpenUntil = 0

function setCors(res: MedusaResponse) {
  const origins = process.env.STORE_CORS?.split(',').map(o=>o.trim()).filter(Boolean) || ['http://localhost:3000']
  res.setHeader('Access-Control-Allow-Origin', origins[0])
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) { setCors(res); return res.status(200).end() }

export async function POST(req: MedusaRequest<PickupPointSearchBody>, res: MedusaResponse) {
  setCors(res)
  try {
    const body = req.body || {}
    const { city, postal_code, provider, courierServices } = body
    if (!city && !postal_code) return res.status(400).json({ message: 'city lub postal_code wymagane' })

    // Rate limiting (lokalny)
    if (RATE_LIMIT_ENABLED) {
      const keyId = (req.ip || req.headers['x-forwarded-for'] || 'anon').toString().split(',')[0].trim()
      const now = Date.now()
      const state = rlMap.get(keyId) || { count: 0, reset: now + RL_WINDOW }
      if (now > state.reset) { state.count = 0; state.reset = now + RL_WINDOW }
      state.count++
      rlMap.set(keyId, state)
      if (state.count > RL_MAX) {
        res.setHeader('Retry-After', Math.ceil((state.reset - now)/1000).toString())
        return res.status(429).json({ message: 'rate_limited', retry_in_ms: state.reset - now })
      }
    }

    // Circuit breaker check
    const nowTs = Date.now()
    if (BREAKER_THRESHOLD > 0 && breakerOpenUntil > nowTs) {
      return respondWithCachedOrMock({ city, postal_code, provider, courierServices }, res, 'breaker_open')
    }

    // klucz cache
    const key = JSON.stringify({ city: (city||'').toLowerCase(), postal_code, provider: (provider||'').toLowerCase(), courierServices })
    const now = Date.now()
    const entry = cache.get(key)
    if (entry && entry.expires > now) {
      // ETag handling
      const inm = req.headers['if-none-match']
      if (inm && inm === entry.etag) {
        res.status(304)
        res.setHeader('ETag', entry.etag)
        res.setHeader('Cache-Control', `public, max-age=${Math.floor((entry.expires-now)/1000)}`)
        return res.end()
      }
      res.setHeader('ETag', entry.etag)
      res.setHeader('Cache-Control', `public, max-age=${Math.floor((entry.expires-now)/1000)}`)
      return res.json({ points: entry.data, source: 'cache', count: entry.data.length, ttl: entry.expires-now })
    }

    // Minimalna implementacja – brak oficjalnej spec, więc placeholder endpoint
    // Zakładamy że Furgonetka posiada endpoint np. /pickup-points z query parametrami
    const query = new URLSearchParams()
    if (city) query.set('city', city)
    if (postal_code) query.set('postal_code', postal_code)
    if (provider) query.set('provider', provider)
    if (courierServices) query.set('courierServices', Array.isArray(courierServices)? courierServices.join(','): courierServices)

    let apiOk = false
    let raw: any[] = []
    // Coalescing – jeśli identyczne zapytanie w toku
    if (pending.has(key)) {
      try { await pending.get(key) } catch {}
    } else {
      const p = (async () => {
        try {
          const resp = await furgonetkaOAuth.authenticatedRequest(`/pickup-points?${query.toString()}`)
          apiOk = resp.ok
          if (resp.ok) {
            const json = await resp.json()
            raw = Array.isArray(json?.points) ? json.points : (Array.isArray(json) ? json : [])
            breakerFails = 0
          } else {
            breakerFails++
          }
        } catch {
          breakerFails++
        }
      })()
      pending.set(key, p)
      await p.finally(()=> pending.delete(key))
    }

    if (BREAKER_THRESHOLD > 0 && breakerFails >= BREAKER_THRESHOLD) {
      breakerOpenUntil = Date.now() + BREAKER_COOLDOWN
    }

  let points: FurgonetkaPickupPoint[] = raw.map(mapRawPoint)
  if (!points.length) points = mockPoints(city, provider)
  const expires = now + DEFAULT_TTL
  const etag = makeETag(points)
  cache.set(key, { expires, data: points, etag })
  res.setHeader('ETag', etag)
  res.setHeader('Cache-Control', `public, max-age=${Math.floor(DEFAULT_TTL/1000)}`)
  return res.json({ points, source: apiOk ? 'furgonetka_api' : 'mock_fallback', count: points.length, ttl: DEFAULT_TTL })
  } catch (e:any) {
    return res.status(200).json({ points: mockPoints(req.body?.city, req.body?.provider), source: 'error_fallback', error: e?.message })
  }
}

function mapRawPoint(p: any): FurgonetkaPickupPoint {
  return {
    id: p.id || p.code || p.point_id || 'unknown',
    provider: (p.provider || p.courier || 'unknown').toLowerCase(),
    name: p.name || p.display_name || 'Punkt Odbioru',
    address: p.address || [p.street, p.building_number, p.city].filter(Boolean).join(' ') || 'Adres nieznany',
    city: p.city,
    postal_code: p.postal_code || p.zip,
    country: p.country || 'PL',
    distance: Number(p.distance) || undefined,
    hours: p.opening_hours || p.hours || undefined,
    coordinates: p.lat && p.lng ? [Number(p.lat), Number(p.lng)] : undefined,
    raw: p
  }
}

function mockPoints(city?: string, provider?: string): FurgonetkaPickupPoint[] {
  const baseCity = city || 'Warszawa'
  const prov = (provider || 'inpost').toLowerCase()
  return [
    { id: `${prov}-mock-1`, provider: prov, name: `${prov.toUpperCase()} Punkt 1`, address: `Ul. Przykładowa 1, ${baseCity}`, city: baseCity, postal_code: '00-001', country: 'PL', hours: '24/7', coordinates: [52.2297, 21.0122] },
    { id: `${prov}-mock-2`, provider: prov, name: `${prov.toUpperCase()} Punkt 2`, address: `Ul. Testowa 5, ${baseCity}`, city: baseCity, postal_code: '00-002', country: 'PL', hours: '8-20', coordinates: [52.23, 21.01] }
  ]
}

function makeETag(data: any) {
  const hash = crypto.createHash('sha1').update(JSON.stringify(data)).digest('base64url')
  return `W/"${hash}"`
}

function respondWithCachedOrMock(params: any, res: MedusaResponse, reason: string) {
  const key = JSON.stringify({ city: (params.city||'').toLowerCase(), postal_code: params.postal_code, provider: (params.provider||'').toLowerCase(), courierServices: params.courierServices })
  const now = Date.now()
  const entry = cache.get(key)
  if (entry && entry.expires > now) {
    res.setHeader('ETag', entry.etag)
    res.setHeader('Cache-Control', `public, max-age=${Math.floor((entry.expires-now)/1000)}`)
    return res.json({ points: entry.data, source: 'cache_'+reason, reason, count: entry.data.length })
  }
  const mock = mockPoints(params.city, params.provider)
  return res.json({ points: mock, source: 'mock_'+reason, reason, count: mock.length })
}
