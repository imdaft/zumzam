'use client'

import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { ReviewCard } from './review-card'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ReviewListProps {
  profileId: string
}

/**
 * Список отзывов с фильтрами и сортировкой
 */
export function ReviewList({ profileId }: ReviewListProps) {
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sort, setSort] = useState('recent')
  const [ratingFilter, setRatingFilter] = useState('all')

  const loadReviews = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('profile_id', profileId)
      params.append('sort', sort)
      
      if (ratingFilter !== 'all') {
        params.append('rating_min', ratingFilter)
        params.append('rating_max', ratingFilter)
      }

      const response = await fetch(`/api/reviews?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to load reviews')
      }

      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Load reviews error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [profileId, sort, ratingFilter])

  if (isLoading) {
    return <div className="text-center py-8">Загрузка отзывов...</div>
  }

  return (
    <div className="space-y-6">
      {/* Фильтры */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Сначала новые</SelectItem>
            <SelectItem value="rating_high">Высокий рейтинг</SelectItem>
            <SelectItem value="rating_low">Низкий рейтинг</SelectItem>
            <SelectItem value="helpful">Самые полезные</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Рейтинг" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все оценки</SelectItem>
            <SelectItem value="5">5 звёзд</SelectItem>
            <SelectItem value="4">4 звезды</SelectItem>
            <SelectItem value="3">3 звезды</SelectItem>
            <SelectItem value="2">2 звезды</SelectItem>
            <SelectItem value="1">1 звезда</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Список */}
      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Нет отзывов"
          description="Будьте первым, кто оставит отзыв!"
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  )
}

