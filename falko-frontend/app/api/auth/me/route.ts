import { NextResponse } from 'next/server'
import { getAuthHeadersFromCookies } from '@/lib/server-auth'
import { API_CONFIG } from '@/lib/api-config'

export async function GET() {
  try {
    const authHeaders = await getAuthHeadersFromCookies()
    if (!authHeaders.Authorization) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    const resp = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/customers/me`, {
      method: 'GET',
      headers: {
        ...authHeaders,
        'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY || ''
      }
    })
    if (!resp.ok) return NextResponse.json({ message: await resp.text() }, { status: resp.status })
    const data = await resp.json()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Unauthorized' }, { status: 401 })
  }
}
