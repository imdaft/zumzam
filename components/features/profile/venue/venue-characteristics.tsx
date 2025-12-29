'use client'

import { 
  Users, 
  Maximize, 
  Car, 
  Wifi, 
  Music, 
  Projector, 
  Utensils, 
  Coffee, 
  Gamepad2, 
  Armchair, 
  Snowflake,
  CheckCircle2,
  XCircle
} from 'lucide-react'

export interface VenueCharacteristicsProps {
  details: any
  hideTitle?: boolean // Опция для скрытия заголовка, если он уже отображен выше
}

export function VenueCharacteristics({ details, hideTitle = false }: VenueCharacteristicsProps) {
  if (!details) return null

  const characteristics = [
    { 
      label: 'Вместимость', 
      value: details.capacity_max ? `до ${details.capacity_max} чел.` : null, 
      icon: Users 
    },
    { 
      label: 'Площадь', 
      value: details.area_sqm ? `${details.area_sqm} м²` : null, 
      icon: Maximize 
    },
    { 
      label: 'Этаж', 
      value: details.floor ? `${details.floor} этаж` : null, 
      icon: Maximize 
    },
    {
        label: 'Тип',
        value: getVenueTypeLabel(details.venue_type),
        icon: CheckCircle2
    }
  ].filter(item => item.value)

  // Собираем активные удобства из новой структуры (item_0...item_7)
  const allAmenities = []
  for (let i = 0; i < 8; i++) {
    const key = `item_${i}`
    const isEnabled = details.amenities?.[key]
    const label = details.amenities?.[`${key}_label`]
    
    if (isEnabled && label) {
      allAmenities.push({
        key,
        label,
        icon: CheckCircle2 // Используем CheckCircle2 как в форме
      })
    }
  }

  // Собираем активные правила из новой структуры (item_0...item_7)
  const allRules = []
  for (let i = 0; i < 8; i++) {
    const key = `item_${i}`
    const isEnabled = details.rules?.[key]
    const label = details.rules?.[`${key}_label`]
    
    if (isEnabled && label) {
      allRules.push({
        key,
        label
      })
    }
  }

  if (characteristics.length === 0 && allAmenities.length === 0) return null

  return (
    <div className={hideTitle ? "space-y-4" : "bg-white rounded-[32px] p-6 sm:p-8 shadow-sm space-y-6"}>
      <div>
        {!hideTitle && (
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Характеристики и удобства</h2>
        )}
        
        {/* Основные характеристики - компактный grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {characteristics.map((item) => (
            <div key={item.label} className="bg-slate-50/80 rounded-xl p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                <item.icon className="w-4 h-4 text-slate-700" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">{item.value}</div>
                <div className="text-xs text-slate-500 truncate">{item.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Удобства - без подзаголовка */}
        {allAmenities.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {allAmenities.map((item) => (
                <div key={item.key} className="inline-flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-gray-200 rounded-[12px] text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                  <div className="w-5 h-5 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                    <item.icon className="w-3 h-3 text-orange-500" strokeWidth={2.5} />
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Правила - без подзаголовка */}
        {allRules.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-2">
              {allRules.map((item) => (
                <div key={item.key} className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-[12px] text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" strokeWidth={2.5} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getVenueTypeLabel(type: string) {
    switch(type) {
        case 'kids_center': return 'Детский центр';
        case 'loft': return 'Лофт / Студия';
        case 'cafe': return 'Кафе/Ресторан';
        case 'activity_park': return 'Парк развлечений';
        case 'outdoor': return 'Открытая площадка';
        default: return null;
    }
}

