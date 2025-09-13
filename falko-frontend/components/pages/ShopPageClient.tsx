'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import ProductCard from '@/components/products/ProductCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { SearchItem, SearchResponse, searchProducts, searchSuggest } from '@/lib/api/search'
import type { ProductPreview } from '@/lib/types/product'
import { SearchBar } from '@/components/ui/search-bar'

// Pomocniczo: grupowanie wyników (wariantów) do unikalnych produktów dla ProductCard
function groupToProductPreviews(items: SearchItem[]): ProductPreview[] {
  const byProduct = new Map<string, SearchItem[]>()
  for (const it of items) {
    const arr = byProduct.get(it.product_id) || []
    arr.push(it)
    byProduct.set(it.product_id, arr)
  }
  const previews: ProductPreview[] = []
  for (const [_, variants] of byProduct.entries()) {
    // wybierz najtańszy wariant jako reprezentanta
    const best = variants.reduce((a, b) => {
      const av = a.min_price ?? Number.MAX_SAFE_INTEGER
      const bv = b.min_price ?? Number.MAX_SAFE_INTEGER
      return av <= bv ? a : b
    })
    previews.push({
      id: best.product_id,
      title: best.title,
      handle: best.handle,
      thumbnail: best.thumbnail || undefined,
      price: best.min_price != null ? { amount: best.min_price, currency_code: 'pln' } : undefined,
      firstVariant: { id: best.variant_id, title: best.variant_title, prices: best.min_price != null ? [{ id: 'tmp', amount: best.min_price, currency_code: 'pln' }] : [] },
      variantCount: variants.length,
    })
  }
  return previews
}

// Parsowanie search params -> obiekt parametrów dla API
function getParamsFromSearch(sp: URLSearchParams) {
  const q = sp.get('q') || undefined
  const category = sp.get('category') || undefined
  const sizes = (sp.get('sizes') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const price_min = sp.get('price_min') ? Number(sp.get('price_min')) : undefined
  const price_max = sp.get('price_max') ? Number(sp.get('price_max')) : undefined
  const sort = sp.get('sort') as 'relevance' | 'price_asc' | 'price_desc' | 'created_at_asc' | 'created_at_desc' | undefined
  const page = sp.get('page') ? Number(sp.get('page')) : 1
  const limit = sp.get('limit') ? Number(sp.get('limit')) : 24
  return { q, category, sizes, price_min, price_max, sort, page, limit }
}

export default function ShopPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<SearchResponse | null>(null)

  // Sterowanie inputem wyszukiwania + podpowiedzi
  const [qInput, setQInput] = useState('')
  const [suggestions, setSuggestions] = useState<{
    label: string
    handle?: string | null
    type: string
  }[]>([])
  const [showSuggest, setShowSuggest] = useState(false)
  const suggestTimeout = useRef<NodeJS.Timeout | null>(null)
  const ignoreSyncRef = useRef<number>(0)

  // Synchronizuj input z URL (z pominięciem krótkiego okna po submit)
  useEffect(() => {
    if (Date.now() < ignoreSyncRef.current) return
    setQInput(searchParams.get('q') || '')
  }, [searchParams])

  // Fetch danych przy każdej zmianie URL query
  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const params = getParamsFromSearch(searchParams)
        const res = await searchProducts(params)
        if (!cancelled) setResponse(res)
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Błąd wyszukiwania';
        if (!cancelled) setError(errorMessage)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  // Debounce podpowiedzi
  useEffect(() => {
    if (suggestTimeout.current) clearTimeout(suggestTimeout.current)
    if (!qInput || qInput.length < 2) {
      setSuggestions([])
      return
    }
    suggestTimeout.current = setTimeout(async () => {
      try {
        const s = await searchSuggest(qInput, 8)
        setSuggestions(s)
      } catch {
        setSuggestions([])
      }
    }, 300)
    return () => {
      if (suggestTimeout.current) clearTimeout(suggestTimeout.current)
    }
  }, [qInput])

  // Helper do aktualizacji URL query
  const updateQuery = (mutate: (sp: URLSearchParams) => void, { scroll = false } = {}) => {
    const sp = new URLSearchParams(searchParams.toString())
    mutate(sp)
    // resetuj stronę na 1 przy każdej zmianie filtrów
    sp.set('page', '1')
    const qs = sp.toString()
    router.push(qs ? `?${qs}` : '?', { scroll })
  }

  // Aktywne parametry
  const params = useMemo(() => getParamsFromSearch(searchParams), [searchParams])

  // Posprzątane dane dla UI
  const productPreviews = useMemo(() => groupToProductPreviews(response?.items || []), [response])
  const total = response?.pagination.total || 0
  const page = params.page || 1
  const limit = params.limit || 24
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const facets = response?.facets

  // if (loading) { ...skeleton... } => usuwamy skeletony; przy pierwszym ładowaniu pokaż prosty komunikat
  const isFirstLoad = loading && !response

  if (isFirstLoad) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-6 text-center">Sklep Falko Project</h1>
          {error ? (
            <p className="text-center text-red-600">{error}</p>
          ) : (
            <p className="text-center text-muted-foreground">Ładowanie…</p>
          )}
        </div>
      </div>
    )
  }

  // Usunięto pełnoekranowy widok błędu; pokaż baner na stronie

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {/* Header */}
        <div className="mb-8 flex flex-col items-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4 text-center">
            Sklep Falko Project
          </h1>
          <div className="w-full max-w-2xl relative">
            <SearchBar
              value={qInput}
              onChange={(v) => {
                setQInput(v)
                setShowSuggest(true)
              }}
              onSubmit={() => {
                // na czas animacji vanish nie nadpisuj qInput synchro z URL
                ignoreSyncRef.current = Date.now() + 900
                updateQuery((sp) => {
                  if (qInput) sp.set('q', qInput)
                  else sp.delete('q')
                })
                setShowSuggest(false)
              }}
              suggestions={suggestions}
              showSuggestions={showSuggest}
              setShowSuggestions={setShowSuggest}
              onSelectSuggestion={(sug) => {
                setShowSuggest(false)
                if (sug.type === 'product' || (sug.type === 'variant' && sug.handle)) {
                  router.push(`/products/${sug.handle}`)
                } else if (sug.type === 'category') {
                  updateQuery((sp) => {
                    if (sug.label) sp.set('category', sug.label)
                    sp.delete('q')
                  })
                } else {
                  setQInput(sug.label)
                  ignoreSyncRef.current = Date.now() + 900
                  updateQuery((sp) => {
                    sp.set('q', sug.label)
                  })
                }
              }}
              placeholders={[
                'Szukaj: bluzy premium',
                'Szukaj: koszulki oversize',
                'Szukaj: hoodie Falko',
                'Szukaj: czapki beanie',
                'Szukaj: sweatshirts L',
              ]}
            />
          </div>
        </div>

        {/* Toolbar: sort + chips */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {loading ? 'Ładowanie…' : `Znaleziono ${total} wyników`}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Sortuj:</label>
            <select
              className="h-9 rounded-md border bg-background px-2 text-sm"
              value={params.sort || (params.q ? 'relevance' : 'created_at_desc')}
              onChange={(e) => updateQuery((sp) => {
                if (e.target.value) sp.set('sort', e.target.value)
                else sp.delete('sort')
              })}
            >
              <option value="relevance">Trafność</option>
              <option value="created_at_desc">Najnowsze</option>
              <option value="price_asc">Cena rosnąco</option>
              <option value="price_desc">Cena malejąco</option>
            </select>
            {(params.q || params.category || (params.sizes && params.sizes.length) || params.price_min || params.price_max) && (
              <Button
                variant="secondary"
                onClick={() => updateQuery((sp) => {
                  sp.delete('q'); sp.delete('category'); sp.delete('sizes'); sp.delete('price_min'); sp.delete('price_max'); sp.delete('sort')
                })}
              >Wyczyść filtry</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filtry (sidebar) */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Kategorie */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Kategorie</h3>
              <div className="space-y-1">
                <button
                  className={`w-full text-left text-sm px-2 py-1 rounded ${!params.category ? 'bg-accent/40' : 'hover:bg-accent/30'}`}
                  onClick={() => updateQuery((sp) => sp.delete('category'))}
                >
                  Wszystkie
                </button>
                {facets?.categories?.map((c) => (
                  <button
                    key={c.id}
                    className={`w-full text-left text-sm px-2 py-1 rounded flex items-center justify-between ${params.category === c.id || params.category === c.name ? 'bg-accent/40' : 'hover:bg-accent/30'}`}
                    onClick={() => updateQuery((sp) => sp.set('category', c.id || c.name || ''))}
                  >
                    <span>{c.name || c.id}</span>
                    <span className="text-muted-foreground">{c.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Rozmiary */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Rozmiar</h3>
              <div className="space-y-2">
                {facets?.sizes?.map((s) => {
                  const selected = params.sizes?.includes(s.size) || false
                  return (
                    <label key={s.size} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(checked) => {
                          updateQuery((sp) => {
                            const curr = new Set(
                              (sp.get('sizes') || '')
                                .split(',')
                                .map((x) => x.trim())
                                .filter(Boolean)
                            )
                            if (checked) curr.add(s.size)
                            else curr.delete(s.size)
                            const next = Array.from(curr)
                            if (next.length) sp.set('sizes', next.join(','))
                            else sp.delete('sizes')
                          })
                        }}
                      />
                      <span className="flex-1">{s.size}</span>
                      <span className="text-muted-foreground">{s.count}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Cena */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Cena (PLN)</h3>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder={facets ? String(Math.round((facets.price.min || 0) / 100)) : 'min'}
                  value={params.price_min ? Math.round(params.price_min / 100) : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const v = e.target.value
                    updateQuery((sp) => {
                      if (v) sp.set('price_min', String(Number(v) * 100))
                      else sp.delete('price_min')
                    })
                  }}
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder={facets ? String(Math.ceil((facets.price.max || 0) / 100)) : 'max'}
                  value={params.price_max ? Math.ceil(params.price_max / 100) : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const v = e.target.value
                    updateQuery((sp) => {
                      if (v) sp.set('price_max', String(Number(v) * 100))
                      else sp.delete('price_max')
                    })
                  }}
                />
              </div>
            </div>
          </aside>

          {/* Lista produktów */}
          <section className="lg:col-span-3">
            {productPreviews.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-foreground/60 mb-2">Brak wyników</h2>
                <p className="text-foreground/50">Zmień kryteria wyszukiwania lub usuń niektóre filtry.</p>
              </div>
            ) : (
              <>
                <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-70 transition-opacity' : ''}`}>
                  {productPreviews.map((product) => (
                    <ProductCard key={product.id} product={product} className="mx-auto w-full max-w-sm" />
                  ))}
                </div>

                {/* Paginacja przeniesiona poniżej, na pełną szerokość */}
              </>
            )}
          </section>

          {/* Paginacja (pełna szerokość strony) */}
          {productPreviews.length > 0 && (
            <div className="lg:col-span-4 mt-8">
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => updateQuery((sp) => sp.set('page', String(page - 1)), { scroll: true })}
                >
                  Poprzednia
                </Button>
                <span className="text-sm text-muted-foreground">
                  Strona {page} z {totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => updateQuery((sp) => sp.set('page', String(page + 1)), { scroll: true })}
                >
                  Następna
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
