import { NextRequest, NextResponse } from 'next/server'
import { API_CONFIG } from '@/lib/api-config'

export async function POST(req: NextRequest) {
  try {
  const { cartId, provider_id: rawProvider = 'pp_system_default', authorize = true } = await req.json()
  // Whitelist providerów (pp_system_default – online; manual_manual – COD)
  const allowedProviders = new Set(['pp_system_default', 'manual_manual'])
    const provider_id = allowedProviders.has(rawProvider) ? rawProvider : 'pp_system_default'
    // Prosta kontrola Origin (tylko w produkcji)
    if (process.env.NODE_ENV === 'production') {
      const origin = req.headers.get('origin') || ''
      const base = process.env.NEXT_PUBLIC_BASE_URL || ''
      if (origin && base && !origin.startsWith(base)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
    if (!cartId) return NextResponse.json({ error: 'cartId required' }, { status: 400 })

    const base = API_CONFIG.MEDUSA_BACKEND_URL
    const pub = API_CONFIG.MEDUSA_PUBLISHABLE_KEY || ''
    const cookie = req.headers.get('cookie') || ''
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-publishable-api-key': pub,
      'cookie': cookie,
    } as const

    // Preferowana ścieżka: payment sessions na poziomie koszyka
    // 1) Utwórz lub dołącz payment session dla wskazanego providera
    let sessionId: string | null = null
    let cartJson: any = null
    try {
      const psRes = await fetch(`${base}/store/carts/${encodeURIComponent(cartId)}/payment-sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ provider_id })
      })
      const psText = await psRes.text()
      if (!psRes.ok && psRes.status !== 409) {
        console.warn('initiate-payment: cart payment-sessions non-200', psRes.status, psText)
      }
    } catch (e) {
      console.warn('initiate-payment: cart payment-sessions failed', e)
    }

    // 2) Pobierz koszyk i znajdź ID sesji
    try {
      const cRes = await fetch(`${base}/store/carts/${encodeURIComponent(cartId)}`, { headers })
      const cText = await cRes.text()
      if (cRes.ok) {
        cartJson = JSON.parse(cText)
        const cart = cartJson?.cart || cartJson
        const sessions = cart?.payment_sessions || cart?.paymentSessions || cart?.payment_collection?.payment_sessions
        if (Array.isArray(sessions)) {
          const match = sessions.find((s: any) => s?.provider_id === provider_id) || sessions[0]
          sessionId = match?.id || null
        }
      } else {
        console.warn('initiate-payment: get cart non-200', cRes.status, cText)
      }
    } catch (e) {
      console.warn('initiate-payment: get cart failed', e)
    }

    // 3) Wybierz sesję (select), a następnie ewentualnie autoryzuj
    if (sessionId) {
      try {
        const sRes = await fetch(`${base}/store/carts/${encodeURIComponent(cartId)}/payment-sessions/${encodeURIComponent(sessionId)}/select`, {
          method: 'POST',
          headers,
        })
        if (!sRes.ok) {
          const sText = await sRes.text()
          console.warn('initiate-payment: cart select non-200', sRes.status, sText)
        }
      } catch (e) {
        console.warn('initiate-payment: cart select failed', e)
      }
    }

    if (authorize && sessionId) {
      try {
        const aRes = await fetch(`${base}/store/carts/${encodeURIComponent(cartId)}/payment-sessions/${encodeURIComponent(sessionId)}/authorize`, {
          method: 'POST',
          headers,
        })
        if (!aRes.ok) {
          const aText = await aRes.text()
          console.warn('initiate-payment: cart authorize non-200', aRes.status, aText)
        }
      } catch (e) {
        console.warn('initiate-payment: cart authorize failed', e)
      }
    }

    // 4) Fallback: jeśli nie mamy sesji, spróbuj przez payment-collections
    if (!sessionId) {
      let pcId: string | null = null
      try {
        const pcRes = await fetch(`${base}/store/payment-collections`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ cart_id: cartId })
        })
        const pcText = await pcRes.text()
        if (pcRes.ok || pcRes.status === 409) {
          // Odczytaj z koszyka
          const cRes = await fetch(`${base}/store/carts/${encodeURIComponent(cartId)}`, { headers })
          const cText = await cRes.text()
          if (cRes.ok) {
            const cData = JSON.parse(cText)
            pcId = cData?.cart?.payment_collection?.id || null
          }
        } else {
          console.warn('initiate-payment: create pc non-200', pcRes.status, pcText)
        }
      } catch (e) {
        console.warn('initiate-payment: create pc failed', e)
      }

      if (pcId) {
        try {
          const sRes = await fetch(`${base}/store/payment-collections/${encodeURIComponent(pcId)}/sessions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ provider_id })
          })
          const sText = await sRes.text()
          if (sRes.ok || sRes.status === 409) {
            const cRes = await fetch(`${base}/store/carts/${encodeURIComponent(cartId)}`, { headers })
            const cText = await cRes.text()
            if (cRes.ok) {
              const cData = JSON.parse(cText)
              const sessions = cData?.cart?.payment_collection?.payment_sessions
              if (Array.isArray(sessions)) {
                const match = sessions.find((s: any) => s?.provider_id === provider_id) || sessions[0]
                sessionId = match?.id || null
              }
            }
          } else {
            console.warn('initiate-payment: add session to pc non-200', sRes.status, sText)
          }
        } catch (e) {
          console.warn('initiate-payment: add session to pc failed', e)
        }
      }
    }

    return NextResponse.json({ payment_session_id: sessionId, cart: cartJson })
  } catch (e) {
    console.error('initiate-payment error', e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
