'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import ProductCard from '@/components/products/ProductCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { fetchProductsFromAPI } from '@/lib/api/products'
import type { ProductPreview } from '@/lib/types/product'
import { SearchBar } from '@/components/ui/search-bar'

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
  const [response, setResponse] = useState<ProductPreview[] | null>(null)
  const [totalCount, setTotalCount] = useState(0)

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
        const result = await fetchProductsFromAPI({
          limit: params.limit,
          offset: ((params.page || 1) - 1) * (params.limit || 24)
        })
        
        if (!cancelled) {
          if (result.data) {
            setResponse(result.data)
            setTotalCount(result.data.length) // Dla uproszczenia - w rzeczywistości Medusa powinno zwrócić count
          } else if (result.error) {
            setError(result.error.message || 'Błąd pobierania produktów')
          }
        }
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

  // Debounce podpowiedzi - tymczasowo wyłączone dla uproszczenia
  /*
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
  */

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
  const productPreviews = useMemo(() => response || [], [response])
  const total = totalCount
  const page = params.page || 1
  const limit = params.limit || 24
  const totalPages = Math.max(1, Math.ceil(total / limit))
  
  // Tymczasowo brak facets (kategorii, rozmiarów) - to wymaga dodatkowego API
  const facets = null

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
            {/* Filtry tymczasowo wyłączone - wymagają implementacji facets API */}
            {/*
            // Kategorie
            <div>
              <h3 className="text-sm font-semibold mb-3">Kategorie</h3>
              <div className="space-y-1">
                <button
                  className={`w-full text-left text-sm px-2 py-1 rounded ${!params.category ? 'bg-accent/40' : 'hover:bg-accent/30'}`}
                  onClick={() => updateQuery((sp) => sp.delete('category'))}
                >
                  Wszystkie
                </button>
              </div>
            </div>

            <Separator />

            // Rozmiary
            <div>
              <h3 className="text-sm font-semibold mb-3">Rozmiar</h3>
              <div className="space-y-2">
                Filtry rozmiaru wymagają implementacji API
              </div>
            </div>

            <Separator />

            // Cena
            <div>
              <h3 className="text-sm font-semibold mb-3">Cena (PLN)</h3>
              <div className="flex items-center gap-2">
                Filtry ceny wymagają implementacji API
              </div>
            </div>
            */}
            
            <div className="text-center text-muted-foreground py-8">
              Filtry będą dostępne wkrótce
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
