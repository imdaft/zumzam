'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ServiceCard } from '@/components/features/service/service-card'
import { ServiceFilters, type ServiceFilters as Filters } from '@/components/features/service/service-filters'
import { ServiceCardSkeleton } from '@/components/shared/skeletons'
import { Button } from '@/components/ui/button'

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
    fetchServices()
  }, [filters, page])

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
      
      if (page === 0) {
        setServices(data.services || [])
      } else {
        setServices([...services, ...(data.services || [])])
      }
      
      setHasMore((data.services || []).length === LIMIT)
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters)
    setPage(0)
  }

  const loadMore = () => {
    setPage(page + 1)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Каталог услуг</h1>
          <p className="text-muted-foreground mt-2">
            Найдите идеальное мероприятие для вашего ребёнка
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* Фильтры (десктоп) */}
          <aside className="hidden lg:block">
            <div className="sticky top-4">
              <ServiceFilters onFilterChange={handleFilterChange} />
            </div>
          </aside>

          {/* Контент */}
          <main>
            {/* Загрузка с skeleton */}
            {isLoading && page === 0 && (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ServiceCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Пустой результат */}
            {!isLoading && services.length === 0 && (
              <div className="rounded-lg border bg-white p-12 text-center dark:bg-slate-800">
                <h3 className="mb-2 text-lg font-semibold">Услуги не найдены</h3>
                <p className="text-muted-foreground">
                  Попробуйте изменить параметры фильтров
                </p>
              </div>
            )}

            {/* Сетка услуг */}
            {services.length > 0 && (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>

                {/* Кнопка "Загрузить ещё" */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <Button
                      onClick={loadMore}
                      variant="outline"
                      size="lg"
                      disabled={isLoading}
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
                <p className="mt-4 text-center text-sm text-muted-foreground">
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

