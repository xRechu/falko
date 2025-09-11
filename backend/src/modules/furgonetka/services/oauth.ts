/**
 * Furgonetka OAuth + API helper (produkcyjny szkielet przeniesiony z old-plugins)
 * Minimalne dostosowanie: czystsze logi + eksport DI-friendly singleton.
 */

export class FurgonetkaOAuthService {
  private clientId: string
  private clientSecret: string
  private baseUrl: string
  private accessToken: string | null = null
  private tokenExpiry = 0
  private partnerUserId: string | null = null
  private userAccessToken: string | null = null
  private userTokenExpiry = 0

  constructor() {
    this.clientId = process.env.FURGONETKA_OAUTH_CLIENT_ID || ''
    this.clientSecret = process.env.FURGONETKA_OAUTH_CLIENT_SECRET || ''
    this.baseUrl = process.env.FURGONETKA_BASE_URL || 'https://api.sandbox.furgonetka.pl'
    this.partnerUserId = process.env.FURGONETKA_PARTNER_USER_ID || null

    if (!this.clientId || !this.clientSecret) {
      console.warn('[furgonetka] Brak Client ID / Secret – endpointy będą działały w trybie mock lub zwracały błędy')
    }
  }

  private log(...a: any[]) { if (process.env.NODE_ENV !== 'production' || process.env.FURGONETKA_DEBUG) console.log('[furgonetka]', ...a) }
  private warn(...a: any[]) { console.warn('[furgonetka]', ...a) }
  private error(...a: any[]) { console.error('[furgonetka]', ...a) }

  async getAccessToken(): Promise<string> {
    const now = Date.now()
    const buffer = 5 * 60 * 1000
    if (this.accessToken && now < this.tokenExpiry - buffer) return this.accessToken

    if (!this.clientId || !this.clientSecret) throw new Error('Furgonetka OAuth nie skonfigurowano (client id/secret)')

    this.log('Pobieranie nowego tokenu OAuth')
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    })
    const scope = process.env.FURGONETKA_OAUTH_SCOPE
    const audience = process.env.FURGONETKA_OAUTH_AUDIENCE
    if (scope) params.append('scope', scope)
    if (audience) params.append('audience', audience)

    const resp = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    })
    if (!resp.ok) throw new Error(`OAuth request failed ${resp.status}`)
    const data = await resp.json() as any
    this.accessToken = data.access_token
    this.tokenExpiry = now + data.expires_in * 1000
    this.log('Token uzyskany – wygasa', new Date(this.tokenExpiry).toISOString())
    return this.accessToken
  }

  private async getEffectiveAccessToken(): Promise<string> {
    if (!this.partnerUserId) return this.getAccessToken()
    const now = Date.now(); const buffer = 5 * 60 * 1000
    if (this.userAccessToken && now < this.userTokenExpiry - buffer) return this.userAccessToken
    const appToken = await this.getAccessToken()
    try {
      const url = `${this.baseUrl}/account/token/${encodeURIComponent(this.partnerUserId)}`
      const r = await fetch(url, { headers: { Authorization: `Bearer ${appToken}`, Accept: 'application/vnd.furgonetka.v1+json' } })
      if (!r.ok) throw new Error('User token exchange failed ' + r.status)
      const d = await r.json() as any
      this.userAccessToken = d.access_token
      this.userTokenExpiry = now + Number(d.expires_in || 0) * 1000
      return this.userAccessToken
    } catch (e) {
      this.warn('Impersonation nieudana – fallback do tokenu aplikacji', e)
      return appToken
    }
  }

  async authenticatedRequest(endpoint: string, options: RequestInit = {}) {
    const token = await this.getEffectiveAccessToken()
    const headers: Record<string,string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.furgonetka.v1+json',
      'X-Language': 'pl_PL'
    }
    if (options.body) headers['Content-Type'] = 'application/vnd.furgonetka.v1+json'
    if (process.env.FURGONETKA_AUTH_TOKEN) headers['X-Auth-Token'] = process.env.FURGONETKA_AUTH_TOKEN
    if (process.env.FURGONETKA_COMPANY_ID) headers['X-Company-Id'] = process.env.FURGONETKA_COMPANY_ID
    if (process.env.FURGONETKA_USER_EMAIL) headers['X-User-Email'] = process.env.FURGONETKA_USER_EMAIL
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`
    const resp = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } })
    if (!resp.ok) {
      let preview = ''
      try { preview = await resp.clone().text() } catch {}
      this.error('API error', resp.status, preview.slice(0,300))
    }
    return resp
  }

  async testConnection() {
    try { const r = await this.authenticatedRequest('/configuration/dictionary'); return r.ok } catch { return false }
  }
  async getAvailableServices() { const r = await this.authenticatedRequest('/account/services'); if (!r.ok) throw new Error('services failed'); return r.json() }
  async calculateShippingPrice(pkg: any) { const r = await this.authenticatedRequest('/packages/calculate-price', { method: 'POST', body: JSON.stringify(pkg) }); if (!r.ok) throw new Error('calc price failed'); return r.json() }
}

export const furgonetkaOAuth = new FurgonetkaOAuthService()
export default FurgonetkaOAuthService
