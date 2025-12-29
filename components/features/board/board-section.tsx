'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus } from 'lucide-react'
import { BoardCard } from './board-card'
import { type OrderRequest } from '@/lib/types/order-request'

interface BoardSectionProps {
  title?: string
  limit?: number
  onShowAll?: () => void
}

export function BoardSection({ 
  title = 'Доска объявлений', 
  limit = 4,
  onShowAll
}: BoardSectionProps) {
  const [requests, setRequests] = useState<OrderRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/requests?limit=${limit}&status=active`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки объявлений:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [limit])

  // Показываем сообщение если нет объявлений
  if (!isLoading && requests.length === 0) {
    return (
      <section className="py-4 md:py-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">Пока нет активных объявлений</p>
          <Link 
            href="/create-request"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Разместить объявление
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="py-4 md:py-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-3 md:mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Ищут прямо сейчас</p>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <Link 
            href="/create-request"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Разместить
          </Link>
          {onShowAll ? (
            <button
              onClick={onShowAll}
              className="flex items-center gap-1 px-3 h-8 bg-white hover:bg-gray-50 text-orange-500 hover:text-orange-600 rounded-full text-[13px] font-medium shadow-sm transition-all"
            >
              Все
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link 
              href="/board"
              className="flex items-center gap-1 px-3 h-8 bg-white hover:bg-gray-50 text-orange-500 hover:text-orange-600 rounded-full text-[13px] font-medium shadow-sm transition-all"
            >
              Все
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Карточки */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div 
              key={i} 
              className="h-32 md:h-40 bg-gray-100 rounded-[24px] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {requests.map((request) => (
            <BoardCard 
              key={request.id} 
              request={request} 
              compact 
              onDelete={fetchRequests}
            />
          ))}
        </div>
      )}

      {/* Мобильная кнопка */}
      <div className="mt-3 md:mt-4 sm:hidden">
        <Link 
          href="/create-request"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Разместить объявление
        </Link>
      </div>
    </section>
  )
}

