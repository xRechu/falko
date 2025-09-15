'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

// Helpers
function setCookie(name: string, value: string, days = 180) {
  if (typeof document === 'undefined') return
  const d = new Date()
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = 'expires=' + d.toUTCString()
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

function loadInitialConsent() {
  return {
    preferences: getCookie('consent_preferences') === '1',
    statistics: getCookie('consent_statistics') === '1',
    marketing: getCookie('consent_marketing') === '1',
    seen: getCookie('consent_seen') === '1',
  }
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const firstFocusableRef = useRef<HTMLButtonElement | null>(null)
  const [prefs, setPrefs] = useState(() => loadInitialConsent())

  useEffect(() => {
    // show if not seen before
    if (!prefs.seen) {
      setOpen(true)
      setExpanded(false) // start collapsed
    }
  }, [prefs.seen])

  // Focus management when expanding panel
  useEffect(() => {
    if (open && expanded && panelRef.current) {
      // move focus inside panel
      panelRef.current.focus()
      // try focus first actionable
      const firstBtn = panelRef.current.querySelector('button') as HTMLButtonElement | null
      if (firstBtn) firstBtn.focus()
    }
  }, [open, expanded])

  // ESC to close expanded panel (return to collapsed), not to dismiss consent entirely
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && expanded) {
        e.preventDefault()
        setExpanded(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, expanded])

  const necessaryAlwaysOn = useMemo(() => true, [])

  const save = (options?: { reloadOnMarketing?: boolean }) => {
    const ts = new Date().toISOString()
    setCookie('consent_seen', '1')
    setCookie('consent_necessary', '1')
    setCookie('consent_preferences', prefs.preferences ? '1' : '0')
    setCookie('consent_statistics', prefs.statistics ? '1' : '0')
    setCookie('consent_marketing', prefs.marketing ? '1' : '0')
    setCookie('consent_version', '1.0.0')
    setCookie('consent_updated', ts)
    setOpen(false)
    if (typeof window !== 'undefined') {
      const shouldReload = options?.reloadOnMarketing && prefs.marketing
      if (shouldReload) window.location.reload()
    }
  }

  const acceptAll = () => {
    setPrefs({ preferences: true, statistics: true, marketing: true, seen: true })
    save({ reloadOnMarketing: true })
  }

  const rejectAll = () => {
    setPrefs({ preferences: false, statistics: false, marketing: false, seen: true })
    save()
  }

  // Floating button to reopen preferences
  const [reopenVisible, setReopenVisible] = useState(false)
  useEffect(() => {
    if (prefs.seen) setReopenVisible(true)
  }, [prefs.seen])

  if (!open) {
    return reopenVisible ? (
      <div className="fixed left-4 bottom-4 z-[90]">
        <Button variant="outline" size="sm" onClick={() => { setOpen(true); setExpanded(true) }}>
          Ustawienia prywatności
        </Button>
      </div>
    ) : null
  }

  // Collapsed, first-layer banner (compliant: equal prominence accept/reject)
  if (!expanded) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-[100]">
        <div className="mx-auto max-w-5xl m-4 rounded-lg border bg-background shadow-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Mobile sheet trigger */}
          <div className="md:hidden">
            <p className="text-sm text-foreground/80">
              Używamy cookies do działania serwisu (niezbędne) oraz – za Twoją zgodą – do preferencji, statystyk i marketingu.
            </p>
            <div className="flex flex-col gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={rejectAll}>Odrzuć wszystkie</Button>
              <Button variant="outline" size="sm" onClick={() => setExpanded(true)}>Ustawienia</Button>
              <Button size="sm" onClick={acceptAll} autoFocus>Akceptuję wszystkie</Button>
            </div>
          </div>
          {/* Desktop banner */}
          <div className="hidden md:flex w-full items-center gap-3">
            <p className="text-sm text-foreground/80 flex-1">
              Używamy cookies do działania serwisu (niezbędne) oraz – za Twoją zgodą – do preferencji, statystyk i marketingu. 
              Szczegóły: <Link href="/polityka-cookies" className="underline">Polityka cookies</Link>.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={rejectAll} aria-label="Odrzuć wszystkie">Odrzuć wszystkie</Button>
              <Button variant="outline" size="sm" onClick={() => setExpanded(true)} aria-expanded={false} aria-controls="cookie-consent-panel">Ustawienia</Button>
              <Button size="sm" onClick={acceptAll} autoFocus aria-label="Akceptuję wszystkie">Akceptuję wszystkie</Button>
            </div>
          </div>
          <p className="text-sm text-foreground/80 flex-1">
            Używamy cookies do działania serwisu (niezbędne) oraz – za Twoją zgodą – do preferencji, statystyk i marketingu. 
            Szczegóły: <Link href="/polityka-cookies" className="underline">Polityka cookies</Link>.
          </p>
          <div className="flex items-center gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={rejectAll} aria-label="Odrzuć wszystkie">Odrzuć wszystkie</Button>
            <Button variant="outline" size="sm" onClick={() => setExpanded(true)} aria-expanded={false} aria-controls="cookie-consent-panel">Ustawienia</Button>
            <Button size="sm" onClick={acceptAll} autoFocus aria-label="Akceptuję wszystkie">Akceptuję wszystkie</Button>
          </div>
        </div>
      </div>
    )
  }

  // Expanded, granular preferences
  return (
    <div className="fixed inset-x-0 bottom-0 z-[100]">
      <div ref={panelRef} id="cookie-consent-panel" className="mx-auto md:max-w-3xl m-0 md:m-4 rounded-t-2xl md:rounded-lg border bg-background shadow-xl p-4 md:p-4 w-full" role="dialog" aria-modal="true" aria-label="Zgody na cookies" tabIndex={-1} style={{paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)'}}>
        <h3 className="font-semibold mb-2 text-foreground">Twoja prywatność</h3>
        <p className="text-sm text-foreground/70 mb-4">
          Używamy plików cookies do zapewnienia prawidłowego działania strony (niezbędne), a także – za Twoją zgodą – do zapamiętywania preferencji, prowadzenia statystyk i działań marketingowych.
          Szczegóły znajdziesz w naszej {""}
          <Link href="/polityka-cookies" className="underline">Polityce plików cookies</Link> oraz <Link href="/polityka-prywatnosci" className="underline">Polityce prywatności</Link>.
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
            <Checkbox checked={necessaryAlwaysOn} disabled className="mt-0.5" aria-label="Cookies niezbędne" />
            <div>
              <p className="text-sm font-medium text-foreground">Niezbędne</p>
              <p className="text-xs text-foreground/60">Zawsze aktywne. Wymagane do prawidłowego działania serwisu (np. utrzymanie sesji, bezpieczeństwo).</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/30 transition-colors">
            <Checkbox checked={prefs.preferences} onCheckedChange={(v:any)=>setPrefs(p=>({...p, preferences: !!v}))} className="mt-0.5" aria-label="Cookies preferencji" />
            <div>
              <p className="text-sm font-medium text-foreground">Preferencje</p>
              <p className="text-xs text-foreground/60">Zapamiętywanie wyborów użytkownika (np. język, region).</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/30 transition-colors">
            <Checkbox checked={prefs.statistics} onCheckedChange={(v:any)=>setPrefs(p=>({...p, statistics: !!v}))} className="mt-0.5" aria-label="Cookies statystyczne" />
            <div>
              <p className="text-sm font-medium text-foreground">Statystyczne</p>
              <p className="text-xs text-foreground/60">Anonimowe statystyki użycia (np. analityka ruchu).</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/30 transition-colors">
            <Checkbox checked={prefs.marketing} onCheckedChange={(v:any)=>setPrefs(p=>({...p, marketing: !!v}))} className="mt-0.5" aria-label="Cookies marketingowe" />
            <div>
              <p className="text-sm font-medium text-foreground">Marketingowe</p>
              <p className="text-xs text-foreground/60">Personalizacja reklam i pomiar skuteczności (np. Meta Pixel).</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-end mt-4 sticky bottom-0 bg-gradient-to-t from-background to-background/60 pt-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={rejectAll}>Odrzuć wszystkie</Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={()=>save({ reloadOnMarketing: true })}>Zapisz preferencje</Button>
          <Button className="w-full sm:w-auto" onClick={acceptAll}>Akceptuję wszystkie</Button>
        </div>

        <p className="text-[11px] text-foreground/50 mt-3">
          Wersja zgód: 1.0.0 • Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}
        </p>
      </div>
    </div>
  )
}
