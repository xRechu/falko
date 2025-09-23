export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { setAuthCookieOnResponse } from '@/lib/server-auth'
import sdk from '@/lib/medusa-client'
import { API_CONFIG } from '@/lib/api-config'

export async function POST(req: Request) {
  try {
    const { email, password, rememberMe } = await req.json()
    // Use Medusa SDK to obtain JWT
    const result: any = await (sdk as any).auth.login('customer', 'emailpass', { email, password })
    const token = typeof result === 'string'
      ? result
      : (result?.location || result?.token || result?.access_token || result?.jwt)
    if (!token) return NextResponse.json({ message: 'Brak tokenu' }, { status: 401 })

    // Verify if token is linked to a customer
    const meResp = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/customers/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY || ''
      }
    })

    if (meResp.ok) {
      const res = NextResponse.json({ ok: true })
      setAuthCookieOnResponse(res, token, rememberMe ? 30 : 1)
      return res
    }

    // Auto-provision: create customer minimal profile using email
    const createResp = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY || ''
      },
      body: JSON.stringify({ email })
    })

    if (!createResp.ok) {
      const text = await createResp.text()
      return NextResponse.json({ message: `Login OK, ale brak profilu klienta i nie udało się utworzyć: ${text}` }, { status: 401 })
    }

    // Re-login to get customer-linked token
    const relogin: any = await (sdk as any).auth.login('customer', 'emailpass', { email, password })
    const customerToken = typeof relogin === 'string'
      ? relogin
      : (relogin?.location || relogin?.token || relogin?.access_token || relogin?.jwt)
    if (!customerToken) return NextResponse.json({ message: 'Brak tokenu po utworzeniu klienta' }, { status: 401 })

    const res = NextResponse.json({ ok: true, provisioned: true })
    setAuthCookieOnResponse(res, customerToken, rememberMe ? 30 : 1)
    return res
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Login failed' }, { status: 400 })
  }
}
