'use client'

import { Search as SearchIcon } from 'lucide-react'
import { ServiceCard } from '@/components/features/service/service-card'
import { ServiceCardSkeleton } from '@/components/shared/skeletons'
import { EmptyState } from '@/components/shared/empty-state'

interface SearchResultsProps {
  query: string
  services: any[]
  profiles: any[]
  isLoading: boolean
  error: string | null
}

/**
 * Компонент отображения результатов поиска
 */
export function SearchResults({
  query,
  services,
  profiles,
  isLoading,
  error,
}: SearchResultsProps) {
  // Загрузка
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Ищем: "{query}"
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Ошибка
  if (error) {
    return (
      <EmptyState
        icon={SearchIcon}
        title="Ошибка поиска"
        description={error}
      />
    )
  }

  const totalResults = services.length + profiles.length

  // Нет результатов
  if (totalResults === 0 && query) {
    return (
      <EmptyState
        icon={SearchIcon}
        title="Ничего не найдено"
        description={`По запросу "${query}" ничего не найдено. Попробуйте изменить запрос.`}
      />
    )
  }

  // Результаты
  return (
    <div className="space-y-8">
      {/* Заголовок */}
      {query && (
        <div>
          <h2 className="text-2xl font-bold">
            Результаты поиска: "{query}"
          </h2>
          <p className="text-muted-foreground mt-1">
            Найдено: {totalResults} {totalResults === 1 ? 'результат' : 'результатов'}
          </p>
        </div>
      )}

      {/* Услуги */}
      {services.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Услуги ({services.length})
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}

      {/* Профили (будут добавлены позже) */}
      {profiles.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Студии и аниматоры ({profiles.length})
          </h3>
          {/* ProfileCard компоненты */}
        </div>
      )}
    </div>
  )
}

