'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, SlidersHorizontal, X } from 'lucide-react'
import Link from 'next/link'
import { BoardCard } from '@/components/features/board/board-card'
import { CATEGORIES, CLIENT_TYPES, type OrderRequest } from '@/lib/types/order-request'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export default function BoardPage() {
  const [requests, setRequests] = useState<OrderRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  
  // Фильтры
  const [category, setCategory] = useState<string>('_all')
  const [clientType, setClientType] = useState<string>('_all')
  const [urgent, setUrgent] = useState<boolean>(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [category, clientType, urgent])

  async function fetchRequests() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('status', 'active')
      params.set('limit', '100')
      if (category && category !== '_all') params.set('category', category)
      if (clientType && clientType !== '_all') params.set('clientType', clientType)
      if (urgent) params.set('urgent', 'true')

      const response = await fetch(`/api/requests?${params}`)
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Ошибка загрузки объявлений:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearFilters = () => {
    setCategory('_all')
    setClientType('_all')
    setUrgent(false)
  }

  const hasActiveFilters = (category !== '_all') || (clientType !== '_all') || urgent

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Доска объявлений
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {total} {total === 1 ? 'объявление' : total < 5 ? 'объявления' : 'объявлений'}
              </p>
            </div>

            {/* Desktop кнопки */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  hasActiveFilters
                    ? 'bg-orange-50 text-orange-600 border border-orange-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Фильтры
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </button>

              <Link
                href="/create-request"
                className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Разместить объявление
              </Link>
            </div>

            {/* Mobile кнопка фильтров */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors relative"
            >
              <Filter className="w-5 h-5 text-gray-700" />
              {hasActiveFilters && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Панель фильтров */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-[24px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Фильтры</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Сбросить
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Категория */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Категория
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="rounded-[18px] border-gray-200">
                      <SelectValue placeholder="Все категории" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Все категории</SelectItem>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Тип заказчика */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Тип заказчика
                  </label>
                  <Select value={clientType} onValueChange={setClientType}>
                    <SelectTrigger className="rounded-[18px] border-gray-200">
                      <SelectValue placeholder="Все типы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Все типы</SelectItem>
                      {CLIENT_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Срочность */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Срочность
                  </label>
                  <button
                    onClick={() => setUrgent(!urgent)}
                    className={`w-full h-10 px-3 rounded-[18px] text-sm font-medium transition-colors ${
                      urgent
                        ? 'bg-orange-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {urgent ? '⚡ Только срочные' : 'Все объявления'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-48 bg-white rounded-[24px] animate-pulse"
              />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Filter className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Объявлений не найдено
            </h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters
                ? 'Попробуйте изменить фильтры'
                : 'Будьте первым, кто разместит объявление'}
            </p>
            {hasActiveFilters ? (
              <Button
                onClick={clearFilters}
                variant="outline"
                className="rounded-full"
              >
                Сбросить фильтры
              </Button>
            ) : (
              <Link
                href="/create-request"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Разместить объявление
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {requests.map((request) => (
              <BoardCard key={request.id} request={request} onDelete={fetchRequests} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (Mobile) */}
      <div className="md:hidden fixed bottom-20 right-4 z-20">
        <Link
          href="/create-request"
          className="flex items-center justify-center w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition-all hover:scale-110"
        >
          <Plus className="w-6 h-6" />
        </Link>
      </div>
    </div>
  )
}



