'use client'

import { Star, ThumbsUp } from 'lucide-react'

/**
 * Блок отзывов
 * TODO: Подключить реальные отзывы из БД
 */
export function ProfileReviews({ profileId }: { profileId: string }) {
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">Отзывы</h2>
      
      <div className="space-y-4">
        {/* Placeholder */}
        <div className="text-center py-12 text-slate-500">
          <p>Отзывы появятся здесь после первых бронирований</p>
        </div>
      </div>
    </div>
  )
}
