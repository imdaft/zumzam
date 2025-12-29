'use client'

import { Building2, Users, Sparkles, Briefcase, Search, Palette, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileHeaderMobileProps {
  category: string
  categoryLabel: string
  subtypeLabel?: string
  readiness: number
  onClick: () => void
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

// Единый оранжевый стиль для всех категорий (согласно дизайн-коду)
const CATEGORY_COLORS = 'text-orange-600 bg-orange-50'

export function ProfileHeaderMobile({ 
  category, 
  categoryLabel,
  subtypeLabel,
  readiness, 
  onClick 
}: ProfileHeaderMobileProps) {
  // Компонент теперь не используется - прогресс-бар перенесен в client.tsx
  return null
}















