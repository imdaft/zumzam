'use client'

import { useEffect, useState } from 'react'
import { Loader2, Star, Trash2, ExternalLink, User, Filter, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  profile_id: string
  user_id: string | null
  profiles: {
    slug: string
    display_name: string
    category: string | null
  }
  users: {
    full_name: string | null
    email: string
  } | null
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [profileFilter, setProfileFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')

  useEffect(() => {
    fetchReviews()
  }, [page, profileFilter, userFilter])

  const fetchReviews = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      if (profileFilter) params.append('profile_id', profileFilter)
      if (userFilter) params.append('user_id', userFilter)

      const response = await fetch(`/api/admin/reviews?${params}`)
      if (!response.ok) throw new Error('Failed to fetch reviews')

      const data = await response.json()
      setReviews(data.reviews || [])
      setTotal(data.pagination?.total || 0)
      setTotalPages(data.pagination?.pages || 1)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return

    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete')

      fetchReviews()
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Ошибка при удалении отзыва')
    }
  }

  const clearFilters = () => {
    setProfileFilter('')
    setUserFilter('')
    setPage(1)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-orange-500 text-orange-500'
                : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    )
  }

  if (isLoading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="w-full px-2 sm:container sm:mx-auto sm:px-6 py-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Отзывы</h1>
          <p className="text-sm text-slate-600 mt-1">
            Всего отзывов: <span className="font-semibold">{total}</span>
          </p>
        </div>
      </div>

      {/* Фильтры */}
      <Card className="p-4 rounded-[24px] border-none shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="ID профиля..."
            value={profileFilter}
            onChange={(e) => setProfileFilter(e.target.value)}
            className="px-3 py-2 rounded-[18px] border border-slate-200 text-sm flex-1 min-w-[200px]"
          />
          <input
            type="text"
            placeholder="ID пользователя..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="px-3 py-2 rounded-[18px] border border-slate-200 text-sm flex-1 min-w-[200px]"
          />
          {(profileFilter || userFilter) && (
            <Button
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Очистить
            </Button>
          )}
        </div>
      </Card>

      {/* Список отзывов */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="p-6 rounded-[24px] border-none shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                {/* Рейтинг и дата */}
                <div className="flex items-center gap-4 flex-wrap">
                  {renderStars(review.rating)}
                  <span className="text-sm text-slate-500">
                    {format(new Date(review.created_at), 'dd MMM yyyy, HH:mm', { locale: ru })}
                  </span>
                </div>

                {/* Текст отзыва */}
                {review.comment && (
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {review.comment}
                  </p>
                )}

                {/* Профиль */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Профиль:</span>
                  <Link
                    href={`/profiles/${review.profiles.slug}`}
                    target="_blank"
                    className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    {review.profiles.display_name}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  {review.profiles.category && (
                    <Badge variant="outline" className="rounded-full text-xs">
                      {review.profiles.category}
                    </Badge>
                  )}
                </div>

                {/* Автор */}
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {review.users
                      ? review.users.full_name || review.users.email
                      : 'Аноним'}
                  </span>
                </div>
              </div>

              {/* Кнопка удаления */}
              <Button
                onClick={() => handleDelete(review.id)}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}

        {reviews.length === 0 && (
          <Card className="p-12 rounded-[24px] border-none shadow-sm text-center">
            <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Отзывов не найдено</p>
          </Card>
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            variant="outline"
            size="sm"
          >
            Назад
          </Button>
          <span className="text-sm text-slate-600">
            Страница {page} из {totalPages}
          </span>
          <Button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
            variant="outline"
            size="sm"
          >
            Вперёд
          </Button>
        </div>
      )}
    </div>
  )
}



