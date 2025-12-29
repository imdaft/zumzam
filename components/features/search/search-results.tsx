'use client'

import { Search as SearchIcon, Sparkles, Hash } from 'lucide-react'
import { ServiceCard } from '@/components/features/service/service-card'
import { ServiceCardSkeleton } from '@/components/shared/skeletons'
import { EmptyState } from '@/components/shared/empty-state'
import { Badge } from '@/components/ui/badge'
import { RelatedSearches } from './related-searches'

interface SearchResultsProps {
  query: string
  services: any[]
  profiles: any[]
  isLoading: boolean
  error: string | null
  method?: 'keyword' | 'semantic'
  onRelatedSearchClick?: (query: string) => void
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
  method,
  onRelatedSearchClick,
}: SearchResultsProps) {
  // Загрузка
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Ищем: "{query}"
          </h2>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Результаты поиска: "{query}"
            </h2>
            {method && (
              <Badge
                className={
                  method === 'semantic'
                    ? 'rounded-full bg-blue-100 text-blue-700 px-2'
                    : 'rounded-full bg-gray-100 text-gray-700 px-2'
                }
              >
                {method === 'semantic' ? (
                  <>
                    <Sparkles className="mr-1 h-3 w-3" />
                    AI поиск
                  </>
                ) : (
                  <>
                    <Hash className="mr-1 h-3 w-3" />
                    Текстовый поиск
                  </>
                )}
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            Найдено: {totalResults} {totalResults === 1 ? 'результат' : 'результатов'}
          </p>
        </div>
      )}

      {/* Услуги */}
      {services.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Услуги ({services.length})
          </h3>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      )}

      {/* Профили (будут добавлены позже) */}
      {profiles.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Студии и аниматоры ({profiles.length})
          </h3>
          {/* ProfileCard компоненты */}
        </div>
      )}

      {/* Похожие запросы */}
      {query && services.length > 0 && onRelatedSearchClick && (
        <RelatedSearches 
          currentQuery={query} 
          onSearchClick={onRelatedSearchClick}
        />
      )}
    </div>
  )
}

