'use client'

/**
 * Админка: Отзывы
 */

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import Link from 'next/link'

interface Review {
  id: string
  profile_id: string
  user_id: string
  rating: number
  comment: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  profile?: { display_name: string; slug: string }
  reviewer?: { email: string }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [page, statusFilter, ratingFilter])

  const fetchReviews = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (ratingFilter !== 'all') params.append('rating', ratingFilter)

      const response = await fetch(`/api/admin/reviews?${params}`)
      if (!response.ok) throw new Error('Failed')

      const data = await response.json()
      setReviews(data.reviews)
      setTotalPages(data.pagination.totalPages)
    } catch {
      toast.error('Ошибка загрузки')
    } finally {
      setIsLoading(false)
    }
  }

  const updateReviewStatus = async (reviewId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error('Failed')
      toast.success(newStatus === 'approved' ? 'Одобрен' : 'Отклонён')
      fetchReviews()
    } catch {
      toast.error('Ошибка')
    }
  }

  const handleDeleteReview = (review: Review) => {
    setSelectedReview(review)
    setIsDeleteDialogOpen(true)
  }

  const deleteReview = async () => {
    if (!selectedReview) return
    try {
      const response = await fetch(`/api/admin/reviews/${selectedReview.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed')
      toast.success('Удалён')
      setIsDeleteDialogOpen(false)
      fetchReviews()
    } catch {
      toast.error('Ошибка')
    }
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'одобрен'
      case 'rejected': return 'отклонён'
      default: return 'ожидает'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-xl font-bold mb-4">Отзывы</h1>

      {/* Фильтры */}
      <div className="flex gap-3 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="pending">На модерации</SelectItem>
            <SelectItem value="approved">Одобренные</SelectItem>
            <SelectItem value="rejected">Отклонённые</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="5">★★★★★</SelectItem>
            <SelectItem value="4">★★★★</SelectItem>
            <SelectItem value="3">★★★</SelectItem>
            <SelectItem value="2">★★</SelectItem>
            <SelectItem value="1">★</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Список */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
            Загрузка...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Отзывы не найдены</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-sm text-gray-600">
                <th className="px-4 py-3 font-medium w-16">Оценка</th>
                <th className="px-4 py-3 font-medium">Профиль / Автор</th>
                <th className="px-4 py-3 font-medium">Комментарий</th>
                <th className="px-4 py-3 font-medium w-24 text-center">Статус</th>
                <th className="px-4 py-3 font-medium w-28">Дата</th>
                <th className="px-4 py-3 font-medium w-36 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-yellow-100 text-yellow-700 font-bold rounded">
                      {review.rating}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {review.profile && (
                      <Link href={`/profiles/${review.profile.slug}`} target="_blank" className="font-medium text-blue-600 hover:underline block">
                        {review.profile.display_name}
                      </Link>
                    )}
                    <div className="text-sm text-gray-500">{review.reviewer?.email || '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    {review.comment ? (
                      <div className="text-sm text-gray-700 max-w-md truncate" title={review.comment}>
                        {review.comment}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Без комментария</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-sm ${
                      review.status === 'approved' ? 'bg-green-100 text-green-700' :
                      review.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {statusLabel(review.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(review.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {review.status !== 'approved' && (
                      <button onClick={() => updateReviewStatus(review.id, 'approved')} className="text-green-600 hover:text-green-800 mr-2" title="Одобрить">
                        ✓
                      </button>
                    )}
                    {review.status !== 'rejected' && (
                      <button onClick={() => updateReviewStatus(review.id, 'rejected')} className="text-orange-600 hover:text-orange-800 mr-2" title="Отклонить">
                        ✗
                      </button>
                    )}
                    <button onClick={() => handleDeleteReview(review)} className="text-red-500 hover:text-red-700" title="Удалить">
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            ← Назад
          </Button>
          <span className="text-sm text-gray-500">Страница {page} из {totalPages}</span>
          <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Вперёд →
          </Button>
        </div>
      )}

      {/* Диалог удаления */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить отзыв?</DialogTitle>
            <DialogDescription>Это действие необратимо.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Отмена</Button>
            <Button variant="destructive" onClick={deleteReview}>Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
