'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/shared/search-bar'
import { SearchResults } from '@/components/features/search/search-results'
import { useSearch } from '@/lib/hooks/use-search'
import { ServiceFilters } from '@/components/features/service/service-filters'

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const { query, setQuery, filters, setFilters, results } = useSearch(initialQuery)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Search Header */}
      <div className="bg-white dark:bg-slate-800 border-b shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <SearchBar 
            defaultValue={initialQuery}
            onSearch={setQuery}
            variant="compact"
            placeholder="Праздник для ребёнка 7 лет, супергерои..."
            autoFocus={!initialQuery}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
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
