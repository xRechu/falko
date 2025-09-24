export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { API_CONFIG } from '@/lib/api-config'
import { getAuthHeadersFromCookies } from '@/lib/server-auth'

export async function GET() {
  try {
    const authHeaders = await getAuthHeadersFromCookies()
    if (!authHeaders.Authorization) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    const resp = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/customers/me`, {
      method: 'GET',
      headers: {
        ...authHeaders,
        'Accept': 'application/json',
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

export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const authHeaders = await getAuthHeadersFromCookies()
    if (!authHeaders.Authorization) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    // Medusa v2 update customer typically uses POST /store/customers/me
    const resp = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/customers/me`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY || ''
      },
      body: JSON.stringify(body)
    })
    if (!resp.ok) return NextResponse.json({ message: await resp.text() }, { status: resp.status })
    const data = await resp.json()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Update failed' }, { status: 400 })
  }
}
