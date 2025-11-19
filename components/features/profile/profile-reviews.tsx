'use client'

import { ReviewList } from '@/components/features/review/review-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star } from 'lucide-react'

interface ProfileReviewsProps {
  profileId: string
}

/**
 * Секция отзывов профиля
 */
export function ProfileReviews({ profileId }: ProfileReviewsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Отзывы
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ReviewList profileId={profileId} />
      </CardContent>
    </Card>
  )
}
