import { NextResponse } from 'next/server'
import { clearAuthCookieOnResponse } from '@/lib/server-auth'

export async function POST() {
  try {
    const res = NextResponse.json({ ok: true })
    clearAuthCookieOnResponse(res)
    return res
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Logout failed' }, { status: 400 })
  }
}
