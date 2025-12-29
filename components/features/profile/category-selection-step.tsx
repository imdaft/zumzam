'use client'

import { 
  Building2, 
  User, 
  Briefcase, 
  Sparkles, 
  Map, 
  Palette, 
  Camera,
  UtensilsCrossed,
  Cake,
  PartyPopper,
  Music,
  Mic2,
  Car
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type ProfileCategory, PROFILE_CATEGORIES, CATEGORIES_LIST } from '@/lib/constants/profile-categories'

interface CategorySelectionStepProps {
  selectedCategory: ProfileCategory | null | undefined
  onSelect: (category: ProfileCategory) => void
}

// Маппинг категорий на иконки Lucide
const CATEGORY_ICONS: Record<ProfileCategory, any> = {
  venue: Building2,
  animator: User,
  show: Sparkles,
  agency: Briefcase,
  quest: Map,
  master_class: Palette,
  photographer: Camera,
  catering: UtensilsCrossed,
  confectionery: Cake,
  decorator: PartyPopper,
  dj_musician: Music,
  host: Mic2,
  transport: Car,
}

export function CategorySelectionStep({ selectedCategory, onSelect }: CategorySelectionStepProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Шаг 1: Категория</h2>
        <p className="text-xs text-gray-600">Выберите, что вы предлагаете</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {CATEGORIES_LIST.map((categoryId) => {
          const metadata = PROFILE_CATEGORIES[categoryId]
          const Icon = CATEGORY_ICONS[categoryId]
          const isSelected = selectedCategory === categoryId
          
          return (
            <button
              key={categoryId}
              type="button"
              onClick={() => onSelect(categoryId)}
              className={cn(
                "flex flex-col items-center gap-1.5 text-center p-3 rounded-xl transition-all duration-200",
                isSelected 
                  ? "bg-orange-500 text-white shadow-sm" 
                  : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm"
              )}
            >
              <div className={cn(
                "w-9 h-9 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                isSelected ? "bg-white/20" : "bg-gray-50"
              )}>
                <Icon className={cn(
                  "w-4.5 h-4.5",
                  isSelected ? "text-white" : "text-gray-600"
                )} />
              </div>
              <div className="w-full">
                <h3 className={cn(
                  "font-semibold text-xs leading-tight",
                  isSelected ? "text-white" : "text-gray-900"
                )}>{metadata.nameRu}</h3>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
