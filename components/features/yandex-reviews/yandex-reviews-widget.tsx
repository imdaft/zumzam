'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { Star, ChevronLeft, ChevronRight, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface YandexReview {
  id: string
  author: {
    name: string
    avatar?: string
    profile_url?: string
  }
  rating: number
  text: string
  date: string
  photos?: string[]
  businessComment?: {
    text: string
    date: string
  }
}

interface YandexReviewsWidgetProps {
  locationId: string
  layout?: 'slider' | 'grid' | 'list' | 'cards'
  maxReviews?: number
  yandexUrl?: string // Ссылка на организацию в Яндекс.Картах
  hideHeader?: boolean
}

// Компонент одной карточки отзыва
function ReviewCard({ review, formatDate }: { review: YandexReview, formatDate: (date: string) => string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const maxLength = 200 // Количество символов до обрезки
  const needsExpand = review.text.length > maxLength

  return (
    <div className="snap-start shrink-0 w-[300px]">
      <div className="h-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 space-y-4 border border-slate-200/50 hover:shadow-lg transition-shadow">
        {/* Автор */}
        <div className="flex items-start gap-3">
          {review.author.avatar ? (
            <Image
              src={review.author.avatar}
              alt={review.author.name}
              width={44}
              height={44}
              className="rounded-full"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {review.author.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 truncate">{review.author.name}</p>
            <p className="text-xs text-slate-500">{formatDate(review.date)}</p>
            <div className="flex mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < review.rating
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Текст отзыва */}
        <div className="space-y-2">
          <p className={`text-sm text-slate-700 leading-relaxed ${!isExpanded && needsExpand ? 'line-clamp-4' : ''}`}>
            {review.text}
          </p>
          
          {needsExpand && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              {isExpanded ? (
                <>
                  Свернуть <ChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  Читать полностью <ChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Ответ организации */}
        {review.businessComment && (
          <div className="bg-white/60 rounded-xl p-3 border border-amber-200/50 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">О</span>
              </div>
              <span className="text-xs font-semibold text-slate-700">Ответ организации</span>
              <span className="text-xs text-slate-500 ml-auto">{formatDate(review.businessComment.date)}</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{review.businessComment.text}</p>
          </div>
        )}

        {/* Ссылка на Яндекс */}
        {review.author.profile_url && (
          <a
            href={review.author.profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
          >
            Смотреть на Яндекс.Картах <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}

type SortType = 'default' | 'newest' | 'negative_first' | 'positive_first'

export function YandexReviewsWidget({ 
  locationId, 
  layout = 'cards',
  maxReviews = 10,
  yandexUrl,
  hideHeader = false
}: YandexReviewsWidgetProps) {
  const [reviews, setReviews] = useState<YandexReview[]>([])
  const [allReviews, setAllReviews] = useState<YandexReview[]>([]) // Все отзывы без сортировки
  const [rating, setRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [sortType, setSortType] = useState<SortType>('default')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/yandex-reviews/${locationId}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      // Сохраняем все отзывы для сортировки
      setAllReviews(data.reviews || [])
      setReviews(data.reviews.slice(0, maxReviews))
      setRating(data.rating)
      setReviewCount(data.review_count)
    } catch (error: any) {
      setError(error.message || 'Не удалось загрузить отзывы')
      setAllReviews([])
      setReviews([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (locationId) {
      fetchReviews()
    }
  }, [locationId])

  // Сортировка отзывов
  const sortedReviews = useMemo(() => {
    // Используем только allReviews для сортировки
    if (!allReviews || allReviews.length === 0) {
      return []
    }

    let sorted = [...allReviews]

    switch (sortType) {
      case 'newest':
        // По новизне (сначала новые)
        sorted.sort((a, b) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return dateB - dateA // Новые первыми
        })
        break
      
      case 'negative_first':
        // Сначала отрицательные (низкий рейтинг)
        sorted.sort((a, b) => {
          // Сначала по рейтингу (низкий выше)
          if (a.rating !== b.rating) {
            return a.rating - b.rating
          }
          // Если рейтинг одинаковый, то по дате (новые первыми)
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        })
        break
      
      case 'positive_first':
        // Сначала положительные (высокий рейтинг)
        sorted.sort((a, b) => {
          // Сначала по рейтингу (высокий выше)
          if (a.rating !== b.rating) {
            return b.rating - a.rating
          }
          // Если рейтинг одинаковый, то по дате (новые первыми)
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        })
        break
      
      case 'default':
      default:
        // По умолчанию - оставляем исходный порядок (без сортировки)
        break
    }

    return sorted.slice(0, maxReviews)
  }, [allReviews, sortType, maxReviews])

  // Обновляем reviews при изменении сортировки и сбрасываем скролл
  useEffect(() => {
    if (sortedReviews.length > 0 || allReviews.length === 0) {
      setReviews(sortedReviews)
      // Сбрасываем скролл при изменении сортировки
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = 0
      }
      setCurrentSlide(0)
      // Обновляем видимость стрелок после небольшой задержки
      setTimeout(() => {
        handleScroll()
      }, 100)
    }
  }, [sortedReviews, allReviews.length])

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320 // ширина карточки + отступ
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % reviews.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + reviews.length) % reviews.length)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-slate-500">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (reviews.length === 0) {
    return null
  }

  // Карточки (по умолчанию) - как на главной странице
  if (layout === 'cards') {
    return (
      <div className="space-y-6">
        {/* Шапка с рейтингом и сортировкой */}
        {!hideHeader && (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-slate-900">{rating?.toFixed(1)}</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(rating || 0)
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-sm text-slate-600">
                {reviewCount} отзывов на{' '}
                {yandexUrl ? (
                  <a 
                    href={yandexUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-base text-slate-900 hover:text-primary transition-colors underline decoration-2 underline-offset-2"
                  >
                    Яндекс.Картах
                  </a>
                ) : (
                  <span className="font-medium">Яндекс.Картах</span>
                )}
              </span>
            </div>
            
            {/* Селект сортировки */}
            <Select value={sortType} onValueChange={(value) => setSortType(value as SortType)}>
              <SelectTrigger className="w-[200px] bg-white border-slate-200">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">По умолчанию</SelectItem>
                <SelectItem value="newest">По новизне</SelectItem>
                <SelectItem value="negative_first">Сначала отрицательные</SelectItem>
                <SelectItem value="positive_first">Сначала положительные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Горизонтальный скролл с карточками */}
        <div className="relative group">
          {/* Стрелка влево */}
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="absolute -left-3 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-slate-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors border border-slate-100"
              aria-label="Листать влево"
            >
              <ChevronLeft className="w-6 h-6 text-slate-900 stroke-[2.5]" />
            </button>
          )}

          {/* Контейнер скролла */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto pb-4 px-2 -mx-2 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
          >
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} formatDate={formatDate} />
            ))}
          </div>

          {/* Стрелка вправо */}
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="absolute -right-3 translate-x-1/2 top-1/2 -translate-y-1/2 z-20 bg-white hover:bg-slate-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors border border-slate-100"
              aria-label="Листать вправо"
            >
              <ChevronRight className="w-6 h-6 text-slate-900 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Слайдер
  if (layout === 'slider') {
    return (
      <div className="space-y-4">
        {/* Шапка с рейтингом и сортировкой */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-slate-900">{rating?.toFixed(1)}</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(rating || 0)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-sm text-slate-600">
              {reviewCount} отзывов на{' '}
              {yandexUrl ? (
                <a 
                  href={yandexUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-base text-slate-900 hover:text-primary transition-colors underline decoration-2 underline-offset-2"
                >
                  Яндекс.Картах
                </a>
              ) : (
                <span className="font-medium">Яндекс.Картах</span>
              )}
            </span>
          </div>
          
          {/* Селект сортировки */}
          <Select value={sortType} onValueChange={(value) => setSortType(value as SortType)}>
            <SelectTrigger className="w-[200px] bg-white border-slate-200">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">По умолчанию</SelectItem>
              <SelectItem value="newest">По новизне</SelectItem>
              <SelectItem value="negative_first">Сначала отрицательные</SelectItem>
              <SelectItem value="positive_first">Сначала положительные</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Слайдер */}
        <div className="relative">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="space-y-4">
              {/* Автор */}
              <div className="flex items-center gap-3">
                {reviews[currentSlide].author.avatar ? (
                  <Image
                    src={reviews[currentSlide].author.avatar}
                    alt={reviews[currentSlide].author.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold">
                    {reviews[currentSlide].author.name[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900">{reviews[currentSlide].author.name}</p>
                  <p className="text-sm text-slate-500">{formatDate(reviews[currentSlide].date)}</p>
                </div>
                <div className="ml-auto flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < reviews[currentSlide].rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Текст отзыва */}
              <p className="text-slate-700 leading-relaxed">{reviews[currentSlide].text}</p>

              {/* Ссылка на Яндекс */}
              {reviews[currentSlide].author.profile_url && (
                <a
                  href={reviews[currentSlide].author.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
                >
                  Смотреть на Яндекс.Картах <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Навигация */}
          {reviews.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>

              {/* Индикаторы */}
              <div className="flex justify-center gap-2 mt-4">
                {reviews.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentSlide ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Сетка
  if (layout === 'grid') {
    return (
      <div className="space-y-4">
        {/* Шапка с сортировкой */}
        {!hideHeader && (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-slate-900">{rating?.toFixed(1)}</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(rating || 0)
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-sm text-slate-600">{reviewCount} отзывов</span>
            </div>
            
            {/* Селект сортировки */}
            <Select value={sortType} onValueChange={(value) => setSortType(value as SortType)}>
              <SelectTrigger className="w-[200px] bg-white border-slate-200">
                <SelectValue placeholder="Сортировка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">По умолчанию</SelectItem>
                <SelectItem value="newest">По новизне</SelectItem>
                <SelectItem value="negative_first">Сначала отрицательные</SelectItem>
                <SelectItem value="positive_first">Сначала положительные</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Сетка отзывов */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 space-y-3">
              {/* Автор */}
              <div className="flex items-center gap-3">
                {review.author.avatar ? (
                  <Image
                    src={review.author.avatar}
                    alt={review.author.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-semibold text-sm">
                    {review.author.name[0]}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-900">{review.author.name}</p>
                  <p className="text-xs text-slate-500">{formatDate(review.date)}</p>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < review.rating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Текст */}
              <p className="text-sm text-slate-700 line-clamp-4">{review.text}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Список (по умолчанию)
  return (
    <div className="space-y-4">
      {/* Шапка с сортировкой */}
      {!hideHeader && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-slate-900">{rating?.toFixed(1)}</span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(rating || 0)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-sm text-slate-600">{reviewCount} отзывов</span>
          </div>
          
          {/* Селект сортировки */}
          <Select value={sortType} onValueChange={(value) => setSortType(value as SortType)}>
            <SelectTrigger className="w-[200px] bg-white border-slate-200">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">По умолчанию</SelectItem>
              <SelectItem value="newest">По новизне</SelectItem>
              <SelectItem value="negative_first">Сначала отрицательные</SelectItem>
              <SelectItem value="positive_first">Сначала положительные</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Список отзывов */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className={`bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl ${hideHeader ? 'p-4' : 'p-6'} space-y-4`}
          >
            {/* Автор */}
            <div className="flex items-center gap-3">
              {review.author.avatar ? (
                <Image
                  src={review.author.avatar}
                  alt={review.author.name}
                  width={hideHeader ? 40 : 48}
                  height={hideHeader ? 40 : 48}
                  className="rounded-full"
                />
              ) : (
                <div className={`${hideHeader ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold`}>
                  {review.author.name[0]}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{review.author.name}</p>
                <p className="text-sm text-slate-500">{formatDate(review.date)}</p>
              </div>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Текст */}
            <p className="text-slate-700 leading-relaxed">{review.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

