'use client'

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Star, ThumbsUp } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface ReviewCardProps {
  review: any
}

/**
 * Карточка отзыва
 */
export function ReviewCard({ review }: ReviewCardProps) {
  const author = review.authors
  const createdDate = new Date(review.created_at)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {author?.full_name && (
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <span className="text-sm font-semibold">
                  {author.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold">{author?.full_name || 'Аноним'}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
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
                <span className="text-xs text-muted-foreground">
                  {format(createdDate, 'dd MMMM yyyy', { locale: ru })}
                </span>
              </div>
            </div>
          </div>

          {!review.is_approved && (
            <Badge variant="outline">На модерации</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Комментарий */}
        <p className="text-sm whitespace-pre-wrap">{review.comment}</p>

        {/* Фотографии */}
        {review.photos && review.photos.length > 0 && (
          <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
            {review.photos.slice(0, 3).map((photo: string, i: number) => (
              <div
                key={i}
                className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800"
              >
                <Image
                  src={photo}
                  alt={`Фото ${i + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Полезность */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <Button variant="ghost" size="sm" className="gap-2">
            <ThumbsUp className="h-4 w-4" />
            Полезно ({review.helpful_count || 0})
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

