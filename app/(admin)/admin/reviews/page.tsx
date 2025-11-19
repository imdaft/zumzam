'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Eye, EyeOff, Loader2, Star } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

/**
 * Модерация отзывов
 */
export default function AdminReviewsPage() {
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login')
    }
  }, [user, userLoading, router])

  useEffect(() => {
    if (user) {
      loadReviews()
    }
  }, [user])

  const loadReviews = async () => {
    setIsLoading(true)
    try {
      // Загружаем ВСЕ отзывы (включая неодобренные)
      const response = await fetch('/api/reviews?author_id=' + user?.id)
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Load reviews error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (reviewId: string, approved: boolean) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: approved }),
      })

      if (!response.ok) {
        throw new Error('Failed to update review')
      }

      toast.success(approved ? 'Отзыв одобрен! ✓' : 'Одобрение снято')
      loadReviews()
    } catch (error: any) {
      toast.error('Ошибка', { description: error.message })
    }
  }

  const handleHide = async (reviewId: string, hidden: boolean) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_hidden: hidden }),
      })

      if (!response.ok) {
        throw new Error('Failed to update review')
      }

      toast.success(hidden ? 'Отзыв скрыт' : 'Отзыв показан')
      loadReviews()
    } catch (error: any) {
      toast.error('Ошибка', { description: error.message })
    }
  }

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const pendingReviews = reviews.filter(r => !r.is_approved)
  const approvedReviews = reviews.filter(r => r.is_approved && !r.is_hidden)
  const hiddenReviews = reviews.filter(r => r.is_hidden)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Модерация отзывов</h1>
        <p className="text-muted-foreground mt-2">
          Проверка и управление отзывами
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{reviews.length}</div>
            <p className="text-xs text-muted-foreground">Всего</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {pendingReviews.length}
            </div>
            <p className="text-xs text-muted-foreground">На модерации</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {approvedReviews.length}
            </div>
            <p className="text-xs text-muted-foreground">Одобрено</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">
              {hiddenReviews.length}
            </div>
            <p className="text-xs text-muted-foreground">Скрыто</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            На модерации ({pendingReviews.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Одобрено ({approvedReviews.length})
          </TabsTrigger>
          <TabsTrigger value="hidden">
            Скрыто ({hiddenReviews.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Все ({reviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Нет отзывов на модерации
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onApprove={handleApprove}
                onHide={handleHide}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-6">
          {approvedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onApprove={handleApprove}
              onHide={handleHide}
            />
          ))}
        </TabsContent>

        <TabsContent value="hidden" className="space-y-4 mt-6">
          {hiddenReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onApprove={handleApprove}
              onHide={handleHide}
            />
          ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-6">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onApprove={handleApprove}
              onHide={handleHide}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ReviewCard({
  review,
  onApprove,
  onHide,
}: {
  review: any
  onApprove: (id: string, approved: boolean) => void
  onHide: (id: string, hidden: boolean) => void
}) {
  const author = review.authors
  const profile = review.profiles

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <span className="text-sm font-semibold">
                  {author?.full_name?.charAt(0) || 'A'}
                </span>
              </div>
              <div>
                <p className="font-semibold">{author?.full_name || 'Аноним'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">
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
                    {format(new Date(review.created_at), 'dd MMM yyyy', { locale: ru })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Профиль: <a href={`/profiles/${profile?.slug}`} className="hover:underline">
                    {profile?.display_name}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {!review.is_approved && (
                <Badge variant="outline" className="bg-yellow-50">
                  На модерации
                </Badge>
              )}
              {review.is_approved && (
                <Badge className="bg-green-500">
                  Одобрено
                </Badge>
              )}
              {review.is_hidden && (
                <Badge variant="destructive">
                  Скрыто
                </Badge>
              )}
            </div>
          </div>

          {/* Comment */}
          <p className="text-sm whitespace-pre-wrap">{review.comment}</p>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {!review.is_approved ? (
              <Button
                size="sm"
                onClick={() => onApprove(review.id, true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Одобрить
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onApprove(review.id, false)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Снять одобрение
              </Button>
            )}

            {!review.is_hidden ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onHide(review.id, true)}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Скрыть
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onHide(review.id, false)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Показать
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


