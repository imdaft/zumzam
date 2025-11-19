'use client'

import { Star, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Секция отзывов профиля
 * Пока заглушка, полная реализация будет в следующих фазах
 */
export function ProfileReviews() {
  // Заглушка: пустые отзывы
  const reviews: any[] = []

  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border bg-slate-50 p-12 text-center dark:bg-slate-900">
        <Star className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h3 className="mb-2 text-lg font-semibold">Пока нет отзывов</h3>
        <p className="text-muted-foreground">
          Станьте первым, кто оставит отзыв о работе с этим исполнителем
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Отзывы</h2>
        <Button variant="outline">Все отзывы</Button>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-lg border bg-white p-6 dark:bg-slate-800"
          >
            {/* Отзыв - полная реализация будет позже */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-semibold text-primary">
                  {review.author_name?.[0]}
                </span>
              </div>
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{review.author_name}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">{review.comment}</p>
                {review.studio_reply && (
                  <div className="mt-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="mb-1 text-sm font-semibold">Ответ студии:</p>
                    <p className="text-sm text-muted-foreground">
                      {review.studio_reply}
                    </p>
                  </div>
                )}
                <div className="mt-4 flex items-center gap-4">
                  <button className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    <ThumbsUp className="h-4 w-4" />
                    Полезно ({review.helpful_count || 0})
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

