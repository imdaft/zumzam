'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Star, Upload, X } from 'lucide-react'
import { createReviewSchema, type CreateReviewInput } from '@/lib/validations/review'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ReviewFormProps {
  profileId: string
  profileName?: string
  bookingId?: string
  onSuccess?: () => void
}

/**
 * Форма написания отзыва
 */
export function ReviewForm({ profileId, profileName, bookingId, onSuccess }: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      profile_id: profileId,
      booking_id: bookingId,
      rating: 5,
      comment: '',
      photos: [],
    },
  })

  const onSubmit = async (data: CreateReviewInput) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка создания отзыва')
      }

      toast.success('Отзыв отправлен! 🎉', {
        description: 'Он будет опубликован после модерации.',
      })

      if (onSuccess) {
        onSuccess()
      }

      form.reset()
    } catch (error: any) {
      console.error('Review error:', error)
      toast.error('Ошибка отправки отзыва', {
        description: error.message || 'Попробуйте ещё раз.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const rating = form.watch('rating')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {profileName && (
          <div>
            <h3 className="text-lg font-semibold">Оставить отзыв</h3>
            <p className="text-sm text-muted-foreground">О: {profileName}</p>
          </div>
        )}

        {/* Рейтинг */}
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Оценка *</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => field.onChange(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          'h-8 w-8',
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        )}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-muted-foreground">
                    {rating} из 5
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Комментарий */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ваш отзыв *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Расскажите о вашем опыте..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Минимум 10 символов, максимум 1000
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? 'Отправляем...' : 'Отправить отзыв'}
        </Button>

        <p className="text-xs text-muted-foreground">
          Отзыв будет опубликован после проверки модератором
        </p>
      </form>
    </Form>
  )
}

