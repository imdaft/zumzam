'use client'

import { Building2, Users, Sparkles, Briefcase, Search, Palette, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileTypeCardProps {
  category: string
  categoryLabel: string
  subtypeLabel?: string
}

const CATEGORY_ICONS: Record<string, any> = {
  venue: Building2,
  animator: Users,
  show: Sparkles,
  agency: Briefcase,
  quest: Search,
  master_class: Palette,
  photographer: Camera,
}

export function ProfileTypeCard({ 
  category, 
  categoryLabel, 
  subtypeLabel,
}: ProfileTypeCardProps) {
  const Icon = CATEGORY_ICONS[category] || Building2

  return (
    <div className="rounded-[24px] p-3 border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-[18px] flex items-center justify-center shrink-0 bg-orange-50">
          <Icon className="w-5 h-5 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5 font-medium">Тип профиля</div>
          <h3 className="text-sm font-semibold text-gray-900 leading-tight">{categoryLabel}</h3>
          {subtypeLabel && (
            <p className="text-xs text-gray-600 mt-0.5 leading-tight capitalize">{subtypeLabel}</p>
          )}
        </div>
      </div>
    </div>
  )
}

