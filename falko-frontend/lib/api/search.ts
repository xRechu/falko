import { API_CONFIG } from '../api-config';

export type SearchFacets = {
  categories: { id: string; name?: string; count: number }[]
  sizes: { size: string; count: number }[]
  price: { min: number; max: number }
}

export type SearchItem = {
  product_id: string
  title: string
  thumbnail: string | null
  handle: string
  variant_id: string
  variant_title: string
  min_price: number | null
}

export type SearchResponse = {
  items: SearchItem[]
  pagination: { total: number; page: number; limit: number }
  facets: SearchFacets
}

export type Suggestion = { label: string; handle?: string | null; type: 'product' | 'variant' | 'category' }

export async function searchProducts(params: {
  q?: string
  category?: string
  sizes?: string[]
  price_min?: number
  price_max?: number
  sort?: "relevance" | "price_asc" | "price_desc" | "created_at_asc" | "created_at_desc"
  page?: number
  limit?: number
  currency?: string
}) {
  const baseUrl = API_CONFIG.MEDUSA_BACKEND_URL
  const pubKey = API_CONFIG.MEDUSA_PUBLISHABLE_KEY
  if (!baseUrl) throw new Error('Search failed: missing MEDUSA_BACKEND_URL')
  if (!pubKey) throw new Error('Search failed: missing MEDUSA_PUBLISHABLE_KEY')

  const makeUrl = (p: typeof params) => {
    const url = new URL(`${baseUrl}/store/search/products`)
    for (const [k, v] of Object.entries(p)) {
      if (v === undefined || v === null) continue
      if (Array.isArray(v)) url.searchParams.set(k, v.join(","))
      else url.searchParams.set(k, String(v))
    }
    return url
  }

  const headers: Record<string, string> = { 'x-publishable-api-key': pubKey }

  // primary try
  let url = makeUrl(params)
  try {
    let res = await fetch(url.toString(), { cache: 'no-store', headers })
    if (!res.ok) {
      // fallback: if relevance + q, retry with created_at_desc
      const shouldFallback = (params.q && (!params.sort || params.sort === 'relevance'))
      if (shouldFallback) {
        const fallbackParams = { ...params, sort: 'created_at_desc' as const }
        const url2 = makeUrl(fallbackParams)
        // eslint-disable-next-line no-console
        console.warn('[searchProducts] primary failed, retry with created_at_desc', { url: url.toString(), status: res.status })
        res = await fetch(url2.toString(), { cache: 'no-store', headers })
        if (res.ok) return (await res.json()) as SearchResponse
        const text2 = await safeText(res)
        const msg2 = `Search failed: ${res.status} ${res.statusText}${text2 ? ` - ${truncate(text2, 400)}` : ''}`
        // eslint-disable-next-line no-console
        console.error('[searchProducts] fallback failed', { url: url2.toString(), status: res.status, text: text2 })
        throw new Error(msg2)
      }
      const text = await safeText(res)
      const msg = `Search failed: ${res.status} ${res.statusText}${text ? ` - ${truncate(text, 400)}` : ''}`
      // eslint-disable-next-line no-console
      console.error('[searchProducts] error', { url: url.toString(), status: res.status, text })
      throw new Error(msg)
    }
    return (await res.json()) as SearchResponse
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[searchProducts] fetch error', { url: url.toString(), err })
    throw new Error(err?.message || 'Search failed')
  }
}

export async function searchSuggest(q: string, limit = 8): Promise<Suggestion[]> {
  if (!q) return []
  const baseUrl = API_CONFIG.MEDUSA_BACKEND_URL
  const pubKey = API_CONFIG.MEDUSA_PUBLISHABLE_KEY
  if (!baseUrl || !pubKey) return []

  const url = new URL(`${baseUrl}/store/search/suggest`)
  url.searchParams.set('q', q)
  url.searchParams.set('limit', String(limit))
  const headers: Record<string, string> = {
    'x-publishable-api-key': pubKey
  }
  try {
    const res = await fetch(url.toString(), { cache: 'no-store', headers })
    if (!res.ok) {
      const text = await safeText(res)
      // eslint-disable-next-line no-console
      console.warn('[searchSuggest] non-ok', { url: url.toString(), status: res.status, text })
      return []
    }
    const data = await res.json()
    return data.suggestions as Suggestion[]
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[searchSuggest] fetch error', err)
    return []
  }
}

async function safeText(res: Response) {
  try { return await res.text() } catch { return '' }
}

function truncate(s: string, n = 200) {
  return s.length > n ? s.slice(0, n) + '…' : s
}
