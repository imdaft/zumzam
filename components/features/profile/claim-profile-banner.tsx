'use client'

import Link from 'next/link'
import { Building2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ClaimProfileBannerProps {
  profileSlug: string
  claimStatus: string | null
  userId: string | null
}

/**
 * Баннер "Это ваш бизнес?" для unclaimed профилей
 * Показывается только если профиль не имеет владельца (claim_status = 'unclaimed' или user_id = null)
 */
export function ClaimProfileBanner({ profileSlug, claimStatus, userId }: ClaimProfileBannerProps) {
  // Показываем баннер только для профилей без владельца
  const isUnclaimed = !userId || claimStatus === 'unclaimed'
  
  if (!isUnclaimed) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-6 h-6 text-amber-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">
            Это ваш бизнес?
          </h3>
          <p className="text-sm text-slate-600">
            Получите контроль над профилем: редактирование, заявки, отзывы и статистика.
          </p>
        </div>
        
        <Link href={`/claim/${profileSlug}`}>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap">
            Подтвердить владение
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
