'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Activity, Settings, ChevronDown, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/contexts/auth-context'
import { useProfileTemplates } from '@/hooks/use-profile-templates'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ViewMode = 'standard' | 'compact' | 'large'

interface ActivityData {
  id: string
  name_ru: string
  name_en: string
  category: string
  icon: string
  description?: string
}

const ACTIVITIES_TEMPLATES = {
  templates: [
    {
      id: 'standard',
      name: 'Стандарт',
      description: 'Сетка 2 колонки',
    },
    {
      id: 'compact',
      name: 'Компактный',
      description: 'Аккордеон (экономит место)',
    },
    {
      id: 'large',
      name: 'Крупный',
      description: '1 колонка, большие карточки',
    },
  ],
}

/**
 * Блок "Чем можно заняться" - показывает активности площадки
 * 3 варианта дизайна: standard (сетка 2 кол), compact (аккордеон), large (1 кол)
 */
export function ActivitiesBlock({
  profileId,
  activities,
  variant = 'mobile',
  isOwner,
}: {
  profileId: string
  activities: string[]
  variant?: 'mobile' | 'desktop'
  isOwner?: boolean
}) {
  const { isClient } = useAuth()
  const showOwnerControls = Boolean(isOwner) && !isClient
  
  const { getTemplate, updateTemplate, isUpdating, variant: currentVariant } = useProfileTemplates({
    profileId,
    variant,
  })
  
  const tmpl = getTemplate('activities')
  const viewMode: ViewMode = (tmpl as ViewMode) || 'standard'
  
  // Подгружаем данные активностей из каталога
  const { data: activitiesData } = useQuery<ActivityData[]>({
    queryKey: ['activities-data', activities],
    queryFn: async () => {
      const response = await fetch('/api/catalogs?name=activity_catalog')
      if (!response.ok) {
        throw new Error('Failed to load activities')
      }
      const { items } = await response.json()
      // Фильтруем на клиенте по нужным ID
      return (items || []).filter((item: ActivityData) => activities.includes(item.id))
    },
    enabled: activities.length > 0,
  })
  
  if (!activitiesData || activitiesData.length === 0) return null
  
  return (
    <div className="bg-white rounded-[32px] p-1 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-200">
      {/* Header */}
      <div className="px-6 py-6 pb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
            Чем можно заняться
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {activitiesData.length} {activitiesData.length === 1 ? 'активность' : activitiesData.length < 5 ? 'активности' : 'активностей'}
          </p>
        </div>
        
        {showOwnerControls && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Индикатор варианта */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full text-xs text-slate-600 font-medium">
              {currentVariant === 'mobile' ? '📱 Мобильная' : '💻 Десктоп'}
            </div>
            
            {/* Кнопка настроек */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                  type="button"
                  aria-label="Настройки дизайна"
                  disabled={isUpdating}
                >
                  <Settings className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 border-b">
                  {currentVariant === 'mobile' ? '📱 Мобильная версия' : '💻 Десктопная версия'}
                </div>
                {ACTIVITIES_TEMPLATES.templates.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      void updateTemplate('activities', template.id)
                    }}
                    className={cn(
                      'cursor-pointer',
                      viewMode === template.id
                        ? 'bg-orange-50 text-orange-700 font-medium'
                        : 'text-slate-700'
                    )}
                  >
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-slate-500">{template.description}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      {/* Контент по вариантам */}
      <div className="p-2">
        {viewMode === 'standard' ? (
          <ActivitiesGrid activities={activitiesData} columns={2} />
        ) : viewMode === 'compact' ? (
          <ActivitiesAccordion activities={activitiesData} />
        ) : (
          <ActivitiesGrid activities={activitiesData} columns={1} />
        )}
      </div>
    </div>
  )
}

/**
 * ВАРИАНТ 1: Standard - Сетка карточек (2 колонки на desktop, 1 на mobile)
 */
function ActivitiesGrid({ 
  activities, 
  columns 
}: { 
  activities: ActivityData[]
  columns: 1 | 2
}) {
  const [showAll, setShowAll] = useState(false)
  const displayedActivities = showAll ? activities : activities.slice(0, 6)
  
  return (
    <div className="space-y-3">
      <div className={cn(
        'grid gap-3',
        columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
      )}>
        {displayedActivities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} large={columns === 1} />
        ))}
      </div>
      
      {/* Показать еще */}
      {activities.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-3 bg-slate-50 text-slate-700 rounded-full font-medium hover:bg-slate-100 transition flex items-center justify-center gap-2"
        >
          {showAll ? (
            <>
              Скрыть <ChevronDown className="w-4 h-4" />
            </>
          ) : (
            <>
              Показать еще {activities.length - 6} <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  )
}

/**
 * Карточка активности
 */
function ActivityCard({ 
  activity, 
  large = false 
}: { 
  activity: ActivityData
  large?: boolean
}) {
  return (
    <div className={cn(
      'border border-slate-200 rounded-[18px] p-4 hover:border-orange-300 hover:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.14)] transition-all cursor-pointer',
      large && 'p-6'
    )}>
      {/* Иконка и название */}
      <div className="flex items-center gap-3 mb-3">
        <span className={cn('', large ? 'text-4xl' : 'text-3xl')}>{activity.icon}</span>
        <h3 className={cn('font-semibold', large ? 'text-xl' : 'text-lg')}>
          {activity.name_ru}
        </h3>
      </div>
      
      {/* Описание */}
      {activity.description && (
        <p className="text-sm text-slate-600 leading-relaxed">
          {activity.description}
        </p>
      )}
      
      {/* Категория badge */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <Badge variant="secondary" className="text-xs">
          {activity.category === 'active' && 'Активное'}
          {activity.category === 'creative' && 'Творческое'}
          {activity.category === 'entertainment' && 'Развлечение'}
          {activity.category === 'other' && 'Другое'}
        </Badge>
      </div>
    </div>
  )
}

/**
 * ВАРИАНТ 2: Compact - Аккордеон (экономит место на mobile)
 */
function ActivitiesAccordion({ activities }: { activities: ActivityData[] }) {
  return (
    <Accordion type="single" collapsible className="w-full bg-slate-50/60 rounded-[24px] border border-slate-100 p-2">
      {activities.map((activity) => (
        <AccordionItem 
          key={activity.id} 
          value={activity.id}
          className="border-b border-slate-200/60 last:border-0"
        >
          <AccordionTrigger className="px-3 py-3 hover:no-underline">
            <div className="flex items-center gap-3 w-full text-left">
              <span className="text-2xl">{activity.icon}</span>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-slate-900">{activity.name_ru}</div>
                <div className="text-xs text-slate-500">{activity.category}</div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3">
            {activity.description && (
              <p className="text-sm text-slate-600 leading-relaxed">
                {activity.description}
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}





