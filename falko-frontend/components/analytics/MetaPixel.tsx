'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView } from '@/lib/analytics/meta-pixel'

export function MetaPixelTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track a page view on route changes
    trackPageView()
  }, [pathname, searchParams])

  return null
}

export default MetaPixelTracker
