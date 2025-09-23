import { cookies } from 'next/headers'
import type { NextResponse } from 'next/server'

export const TOKEN_COOKIE = '_medusa_jwt'

export function setAuthCookieOnResponse(res: NextResponse, token: string, rememberDays = 30) {
  res.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: rememberDays * 24 * 60 * 60,
  })
}

export function clearAuthCookieOnResponse(res: NextResponse) {
  res.cookies.delete(TOKEN_COOKIE)
}

export async function getAuthTokenFromCookies(): Promise<string | null> {
  const c = await cookies()
  const t = c.get(TOKEN_COOKIE)
  return t?.value || null
}

export async function getAuthHeadersFromCookies(): Promise<Record<string, string>> {
  const token = await getAuthTokenFromCookies()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}
