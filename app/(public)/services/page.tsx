'use client'

import { useEffect, useState } from 'react'
import { Filter, Loader2, PackageSearch } from 'lucide-react'
import { ServiceCard } from '@/components/features/service/service-card'
import { ServiceFilters, type ServiceFilters as Filters } from '@/components/features/service/service-filters'
import { ServiceCardSkeleton } from '@/components/shared/skeletons'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

/**
 * Публичная страница каталога услуг
 */
export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({})
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const LIMIT = 12

  useEffect(() => {
    let isActive = true

    const fetchServices = async () => {
      try {
        setIsLoading(true)

        // Строим query params
        const params = new URLSearchParams()
        params.append('limit', LIMIT.toString())
        params.append('offset', (page * LIMIT).toString())
        params.append('active', 'true')

        if (filters.city) params.append('city', filters.city)
        // Примечание: фильтры по цене и возрасту пока не реализованы на backend
        // Нужно будет добавить в API route

        const response = await fetch(`/api/services?${params.toString()}`)
        const data = await response.json()

        const next = (data.services || []) as any[]
        if (!isActive) return

        setServices((prev) => (page === 0 ? next : [...prev, ...next]))
        setHasMore(next.length === LIMIT)
      } catch (error) {
        console.error('Error fetching services:', error)
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    fetchServices()

    return () => {
      isActive = false
    }
  }, [filters, page])

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters)
    setPage(0)
  }

  const loadMore = () => {
    setPage((p) => p + 1)
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="w-full px-2 py-4 pb-24 sm:container sm:mx-auto sm:px-6 sm:py-8">
        {/* Шапка */}
        <div className="sticky top-0 z-10 bg-[#F7F8FA] pt-2 pb-3">
          <div className="bg-white border border-gray-100 shadow-sm rounded-[24px] px-4 py-4 sm:px-5 sm:py-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Услуги</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Каталог программ и услуг для детских праздников
              </p>
            </div>

            {/* Фильтры (мобилка) */}
            <div className="lg:hidden shrink-0">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="rounded-full">
                    Фильтры
                    <Filter className="w-4 h-4 ml-2" />
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
                    <ServiceFilters onFilterChange={handleFilterChange} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr] lg:items-start">
          {/* Фильтры (десктоп) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <ServiceFilters onFilterChange={handleFilterChange} />
            </div>
          </aside>

          {/* Контент */}
          <main className="space-y-4">
            {/* Загрузка с skeleton */}
            {isLoading && page === 0 && (
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ServiceCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Пустой результат */}
            {!isLoading && services.length === 0 && (
              <div className="bg-white border border-gray-100 shadow-sm rounded-[24px] p-6 sm:p-8 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-orange-500 flex items-center justify-center">
                  <PackageSearch className="w-7 h-7 text-white" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">Услуги не найдены</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Попробуйте изменить параметры фильтров
                </p>
              </div>
            )}

            {/* Сетка услуг */}
            {services.length > 0 && (
              <>
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>

                {/* Кнопка "Загрузить ещё" */}
                {hasMore && (
                  <div className="pt-2 text-center">
                    <Button
                      onClick={loadMore}
                      variant="outline"
                      size="lg"
                      disabled={isLoading}
                      className="rounded-full border-orange-200 text-orange-700 hover:bg-orange-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Загрузка...
                        </>
                      ) : (
                        'Загрузить ещё'
                      )}
                    </Button>
                  </div>
                )}

                {/* Всего найдено */}
                <p className="text-center text-sm text-gray-500">
                  Показано: {services.length} услуг
                </p>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

