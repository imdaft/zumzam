'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, isToday as checkIsToday, isTomorrow as checkIsTomorrow } from 'date-fns'
import { ru } from 'date-fns/locale'
import { 
  Zap,
  MessageSquare,
  Eye,
  Pin,
  Crown,
  Sparkles,
  Trash2,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  CATEGORIES, 
  CLIENT_TYPES,
  type OrderRequest 
} from '@/lib/types/order-request'
import { useAuth } from '@/lib/contexts/auth-context'
import { toast } from 'sonner'

interface BoardCardProps {
  request: OrderRequest & {
    isPinned?: boolean
    listing_plan_id?: string
    highlight_color?: string
  }
  compact?: boolean // Для главной страницы
  onDelete?: () => void // Callback после удаления
}

export function BoardCard({ request, compact = false, onDelete }: BoardCardProps) {
  const { isAdmin } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const category = CATEGORIES.find(c => c.id === request.category)
  const clientType = CLIENT_TYPES.find(c => c.id === request.client_type)
  
  const eventDate = new Date(request.event_date)
  const isToday = checkIsToday(eventDate)
  const isTomorrow = checkIsTomorrow(eventDate)
  
  const dateLabel = isToday 
    ? 'Сегодня' 
    : isTomorrow 
      ? 'Завтра' 
      : format(eventDate, 'd MMM', { locale: ru })
  const timeLabel = request.event_time ? request.event_time.slice(0, 5) : null

  // Локация — только район или адрес, без города
  const location = request.district || request.address || null

  // Премиум статус
  const isPremium = !!request.listing_plan_id
  const isPinned = request.isPinned

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm('Вы уверены, что хотите удалить это объявление?')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/requests/${request.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Не удалось удалить объявление')
      }

      toast.success('Объявление удалено')
      onDelete?.()
    } catch (error: any) {
      console.error('Error deleting request:', error)
      toast.error(error.message || 'Ошибка при удалении')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Link 
      href={`/board/${request.id}`}
      className={cn(
        "group block bg-white overflow-hidden transition-all duration-200",
        compact ? "rounded-[24px]" : "rounded-[28px]",
        "hover:shadow-lg hover:shadow-orange-100/50 hover:-translate-y-0.5",
        "border border-gray-100 hover:border-orange-200",
        // Выделение для премиум объявлений
        isPinned && "ring-2 ring-orange-300 shadow-md shadow-orange-100/50",
        isPremium && !isPinned && "border-orange-200 bg-orange-50/30"
      )}
    >
      {/* Верхняя часть с цветной полосой категории */}
      <div className="relative">
        {/* Кнопка удаления для админа */}
        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-2 left-2 z-10 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Удалить объявление"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* Значок закрепления */}
        {isPinned && (
          <div className="absolute top-2 right-2 z-10">
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-semibold shadow-sm">
              <Pin className="w-3 h-3" />
              Закреплено
            </div>
          </div>
        )}
        
        {/* Значок премиум (если не закреплено) */}
        {isPremium && !isPinned && (
          <div className="absolute top-2 right-2 z-10">
            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-full text-xs font-semibold shadow-sm">
              <Sparkles className="w-3 h-3" />
              TOP
            </div>
          </div>
        )}

        {/* Цветная полоса сверху */}
        <div className={cn(
          "h-1.5 w-full",
          request.is_urgent 
            ? "bg-gradient-to-r from-red-400 to-orange-400" 
            : isPinned 
              ? "bg-gradient-to-r from-orange-500 to-amber-400"
              : "bg-gradient-to-r from-orange-400 to-amber-300"
        )} />
        
        {/* Контент карточки */}
        <div className={cn("p-3 md:p-4", compact && "p-2.5 md:p-3")}>
          {/* Шапка: категория + срочность */}
          <div className="flex items-center justify-between gap-1.5 md:gap-2 mb-2 md:mb-3">
            <span className={cn(
              "inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-semibold",
              "bg-gray-100 text-gray-700"
            )}>
              <span>{category?.emoji}</span>
              <span>{category?.label}</span>
            </span>
            
            {request.is_urgent && (
              <span className="inline-flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2.5 py-0.5 md:py-1 bg-red-50 text-red-600 rounded-full text-[10px] md:text-xs font-semibold">
                <Zap className="w-2.5 h-2.5 md:w-3 md:h-3" />
                <span className="hidden md:inline">Срочно</span>
              </span>
            )}
          </div>

          {/* Заголовок */}
          <h3 className={cn(
            "font-bold text-gray-900 line-clamp-2 mb-1.5 md:mb-2 group-hover:text-orange-600 transition-colors",
            compact ? "text-sm md:text-sm" : "text-[16px] md:text-base leading-snug"
          )}>
            {request.title}
          </h3>

          {/* Мета-информация */}
          <div className="flex flex-wrap items-center gap-x-2 md:gap-x-2 gap-y-1 text-xs text-gray-500 mb-2 md:mb-3">
            {/* Кто ищет — скрыто на мобильных */}
            <span className="hidden md:inline text-gray-500">{clientType?.label}</span>
            <span className="hidden md:inline text-gray-300">·</span>
            
            {/* Дата */}
            <span className={cn(
              "inline-flex items-center gap-1",
              (isToday || isTomorrow) && "text-orange-600 font-semibold"
            )}>
              {dateLabel}
              {timeLabel && <span className="text-gray-500 font-medium">в {timeLabel}</span>}
            </span>
            
            {/* Локация (только район) */}
            {location && (
              <>
                <span className="text-gray-300">·</span>
                <span className="truncate max-w-[80px] md:max-w-none">{location}</span>
              </>
            )}
          </div>

          {/* Нижняя часть: бюджет + статистика */}
          <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-gray-100">
            {/* Бюджет */}
            <div className={cn(
              "font-bold",
              request.budget ? "text-green-600" : "text-gray-400"
            )}>
              {request.budget 
                ? <span className="text-sm md:text-base">{request.budget.toLocaleString('ru-RU')} ₽</span>
                : <span className="text-xs md:text-sm">Договорная</span>
              }
            </div>
            
            {/* Статистика */}
            {!compact && (
              <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-gray-400">
                <span className="inline-flex items-center gap-0.5 md:gap-1">
                  <Eye className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  {request.views_count || 0}
                </span>
                <span className="inline-flex items-center gap-0.5 md:gap-1">
                  <MessageSquare className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  {request.responses_count || 0}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
