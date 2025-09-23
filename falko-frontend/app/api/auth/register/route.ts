export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { setAuthCookieOnResponse } from '@/lib/server-auth'
import { API_CONFIG } from '@/lib/api-config'
import sdk from '@/lib/medusa-client'

export async function POST(req: Request) {
  try {
    const { email, password, first_name, last_name, phone } = await req.json()

    // Register via SDK to obtain token
  const reg: any = await (sdk as any).auth.register('customer', 'emailpass', { email, password })
  const regToken = typeof reg === 'string' ? reg : (reg?.location || reg?.token || reg?.access_token || reg?.jwt)
  if (!regToken) return NextResponse.json({ message: 'Brak tokenu rejestracji' }, { status: 400 })

    // Create customer profile using received JWT
    const createResp = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${regToken}`,
        'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY || ''
      },
      body: JSON.stringify({ email, first_name, last_name, phone })
    })
    if (!createResp.ok) return NextResponse.json({ message: await createResp.text() }, { status: 400 })

    // Perform login to obtain proper customer token
    const loginRes: any = await (sdk as any).auth.login('customer', 'emailpass', { email, password })
    const loginToken = typeof loginRes === 'string' ? loginRes : (loginRes?.location || loginRes?.token || loginRes?.access_token || loginRes?.jwt)
    if (!loginToken) return NextResponse.json({ message: 'Brak tokenu logowania' }, { status: 400 })

    const res = NextResponse.json({ ok: true })
    setAuthCookieOnResponse(res, loginToken)
    return res
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Registration failed' }, { status: 400 })
  }
}
