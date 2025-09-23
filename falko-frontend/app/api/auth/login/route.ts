import { NextResponse } from 'next/server'
import { setAuthCookieOnResponse } from '@/lib/server-auth'
import sdk from '@/lib/medusa-client'

export async function POST(req: Request) {
  try {
    const { email, password, rememberMe } = await req.json()
    // Use Medusa SDK to obtain JWT
    const result: any = await (sdk as any).auth.login('customer', 'emailpass', { email, password })
    const token = typeof result === 'string' ? result : result?.token || result?.access_token || result?.jwt
    if (!token) return NextResponse.json({ message: 'Brak tokenu' }, { status: 401 })

    const res = NextResponse.json({ ok: true })
    setAuthCookieOnResponse(res, token, rememberMe ? 30 : 1)
    return res
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Login failed' }, { status: 400 })
  }
}
