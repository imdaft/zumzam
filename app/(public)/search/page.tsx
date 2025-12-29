'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Filter } from 'lucide-react'
import { SearchBar } from '@/components/shared/search-bar'
import { SearchResults } from '@/components/features/search/search-results'
import { useSearch } from '@/lib/hooks/use-search'
import { ServiceFilters } from '@/components/features/service/service-filters'
import tracker from '@/lib/analytics/tracker'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const { query, setQuery, filters, setFilters, results } = useSearch(initialQuery)
  const lastKeyRef = useRef<string>('')

  // Трекаем поиск (debounce), чтобы не спамить событиями на каждый символ
  useEffect(() => {
    const q = (query || '').trim()
    if (!q) return

    let filtersKey = ''
    try {
      filtersKey = JSON.stringify(filters || {})
    } catch {
      filtersKey = ''
    }

    const key = `${q}||${filtersKey}`
    if (key === lastKeyRef.current) return

    const t = window.setTimeout(() => {
      tracker.trackSearch(q, filters || {})
      lastKeyRef.current = key
    }, 600)

    return () => window.clearTimeout(t)
  }, [query, filters])

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Search Header */}
      <div className="sticky top-0 z-40 bg-[#F7F8FA] pt-2">
        <div className="w-full px-2 sm:container sm:mx-auto sm:px-6">
          <div className="bg-white border border-gray-100 shadow-sm rounded-[24px] px-3 py-3 sm:px-5 sm:py-5">
            <div className="flex items-center gap-2">
              <SearchBar
                defaultValue={initialQuery}
                onSearch={setQuery}
                variant="compact"
                placeholder="Праздник для ребёнка 7 лет, супергерои..."
                autoFocus={!initialQuery}
              />
              {/* Фильтры (мобилка) */}
              <div className="lg:hidden shrink-0">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="rounded-full">
                      <span className="hidden sm:inline">Фильтры</span>
                      <Filter className="w-4 h-4 sm:ml-2" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="bg-[#F7F8FA] border-t border-gray-100 rounded-t-[28px] px-2 pb-6 pt-4"
                  >
                    <SheetHeader className="px-2">
                      <SheetTitle className="text-lg font-bold text-gray-900">Фильтры</SheetTitle>
                    </SheetHeader>
                    <div className="px-2 mt-4">
                      <ServiceFilters onFilterChange={setFilters} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-2 py-4 pb-24 sm:container sm:mx-auto sm:px-6 sm:py-8">
        <div className="grid gap-4 lg:grid-cols-[320px_1fr] lg:items-start">
          {/* Filters Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <ServiceFilters onFilterChange={setFilters} />
            </div>
          </aside>

          {/* Results */}
          <main>
            <SearchResults
              query={query}
              services={results.services}
              profiles={results.profiles}
              isLoading={results.isLoading}
              error={results.error}
              method={results.method}
              onRelatedSearchClick={setQuery}
            />
          </main>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Загрузка...</div>}>
      <SearchContent />
    </Suspense>
  )
}
