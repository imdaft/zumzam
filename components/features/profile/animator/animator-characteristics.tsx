'use client'

import { 
  User, 
  MapPin, 
  Briefcase, 
  Star, 
  ShieldCheck,
  Sparkles,
  Palette,
  PartyPopper,
  Wand2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatorCharacteristicsProps {
  details: any
  hideTitle?: boolean
}

// Маппинг возрастных категорий
const AGE_RANGE_LABELS: Record<string, string> = {
  '3-5': '3-5 лет',
  '5-7': '5-7 лет',
  '7-10': '7-10 лет',
  '10-14': '10-14 лет',
  'universal': 'Любой возраст'
}

// Маппинг типов программ
const PROGRAM_TYPE_LABELS: Record<string, string> = {
  'interactive': 'Интерактивная программа',
  'show': 'Шоу-программа',
  'quest': 'Квест',
  'master_class': 'Мастер-класс',
  'games': 'Игры и конкурсы',
  'combined': 'Комбинированная'
}

// Маппинг форматов работы
const WORK_FORMAT_LABELS: Record<string, string> = {
  'mobile': 'Только выездной',
  'studio': 'Только в студии',
  'both': 'Выездной и в студии'
}

export function AnimatorCharacteristics({ details, hideTitle = false }: AnimatorCharacteristicsProps) {
  if (!details) return null

  const characteristics = [
    { 
      label: 'Персонаж', 
      value: details.character_name, 
      icon: Star 
    },
    { 
      label: 'Возраст программы', 
      value: details.age_range ? AGE_RANGE_LABELS[details.age_range] : null, 
      icon: User 
    },
    { 
      label: 'Тип программы', 
      value: details.program_type ? PROGRAM_TYPE_LABELS[details.program_type] : null, 
      icon: PartyPopper 
    },
    { 
      label: 'Формат работы', 
      value: details.work_format ? WORK_FORMAT_LABELS[details.work_format] : null, 
      icon: MapPin 
    },
    { 
      label: 'Радиус выезда', 
      value: details.coverage_radius ? `до ${details.coverage_radius} км` : null, 
      icon: MapPin 
    },
    { 
      label: 'Опыт работы', 
      value: details.experience_years ? `${details.experience_years} лет` : null, 
      icon: Briefcase 
    },
  ].filter(item => item.value)

  // Дополнительные услуги
  const additionalServicesList = [
    { key: 'face_painting', label: 'Аквагрим', icon: Palette },
    { key: 'balloon_twisting', label: 'Твистинг', icon: PartyPopper },
    { key: 'magic_tricks', label: 'Фокусы', icon: Wand2 },
    { key: 'glitter_tattoos', label: 'Глиттер-тату', icon: Sparkles },
  ]

  const activeServices = additionalServicesList.filter(
    item => details.services?.[item.key]
  )

  // Оборудование и возможности
  const capabilitiesList = [
    { key: 'has_music_equipment', label: 'Музыкальное оборудование' },
    { key: 'has_car', label: 'Свой автомобиль' },
    { key: 'has_med_book', label: 'Медицинская книжка' },
  ]

  const activeCapabilities = capabilitiesList.filter(
    item => details[item.key]
  )

  if (characteristics.length === 0 && activeServices.length === 0 && activeCapabilities.length === 0) return null

  return (
    <div className="space-y-3">
      {!hideTitle && (
        <div className="text-sm font-semibold text-slate-900">Особенности</div>
      )}

      {/* Макет в две колонки: слева характеристики + доп. услуги, справа оборудование */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Левая колонка: основные характеристики + доп. услуги */}
        <div className="space-y-4">
          {characteristics.length > 0 && (
            <div className="space-y-2">
              {characteristics.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-2.5"
                >
                  <div className="w-8 h-8 rounded-[18px] bg-slate-100 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <div className="text-sm font-semibold text-slate-900 leading-snug break-words">
                      {String(item.value)}
                    </div>
                    <div className="text-xs text-slate-500 leading-tight">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeServices.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Доп. услуги
              </div>
              <div className="flex flex-wrap gap-2">
                {activeServices.map((item) => (
                  <span
                    key={item.key}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-800 border border-orange-100 text-sm font-semibold"
                  >
                    <item.icon className="w-4 h-4 text-orange-700" />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Правая колонка: оборудование и возможности */}
        {activeCapabilities.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Оборудование и возможности
            </div>
            <div className="flex flex-wrap gap-2">
              {activeCapabilities.map((item) => (
                <span
                  key={item.key}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold',
                    'bg-emerald-50 text-emerald-800 border-emerald-100'
                  )}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}




