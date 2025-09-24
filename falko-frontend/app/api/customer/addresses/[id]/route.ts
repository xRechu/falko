export const runtime = 'edge'
import { NextResponse } from 'next/server'
import { API_CONFIG } from '@/lib/api-config'
import { getAuthHeadersFromCookies } from '@/lib/server-auth'

export async function PATCH(_req: Request, ctx: { params: { id: string } }) {
  try {
    const authHeaders = await getAuthHeadersFromCookies()
    if (!authHeaders.Authorization) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    const id = ctx.params.id
    const body = await _req.json().catch(() => ({}))
    const resp = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/customers/addresses/${id}`, {
      method: 'POST', // Medusa v2 sometimes uses POST for update
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
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Update failed' }, { status: 400 })
  }
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  try {
    const authHeaders = await getAuthHeadersFromCookies()
    if (!authHeaders.Authorization) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    const id = ctx.params.id
    const resp = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/customers/addresses/${id}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders,
        'Accept': 'application/json',
        'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY || ''
      }
    })
    if (!resp.ok) return NextResponse.json({ message: await resp.text() }, { status: resp.status })
    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Delete failed' }, { status: 400 })
  }
}
