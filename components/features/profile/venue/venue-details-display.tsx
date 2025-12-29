'use client'

import { useState } from 'react'
import { Check, X, Info, Sparkles, Utensils, Music, Monitor, Layout, Clock, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VenueDetailsDisplayProps {
  details: any
}

// Описания для форматов работы (как в Яндекс Маркете - понятные блоки)
const WORK_FORMAT_DESCRIPTIONS: Record<string, { title: string; desc: string; icon: string }> = {
  venue_rental: { 
    title: 'Аренда площадки', 
    desc: 'Только пространство. Еду и программу можно свою.',
    icon: '🏛️',
  },
  own_programs: { 
    title: 'Свои программы', 
    desc: 'Есть аниматоры и шоу. Не нужно искать артистов.',
    icon: '🎪',
  },
  turnkey: { 
    title: 'Праздник под ключ', 
    desc: 'Организуем всё: еду, декор, торт и развлечения.',
    icon: '🎁',
  },
  tickets: { 
    title: 'Входной билет', 
    desc: 'Свободное посещение игровой зоны в любое время.',
    icon: '🎫',
  },
  hybrid: { 
    title: 'Гибридный формат', 
    desc: 'Своя комната + общая игровая зона.',
    icon: '🔄',
  },
  concept_studio: { 
    title: 'Концепт-студия', 
    desc: 'Авторский дизайн и уникальные активности.',
    icon: '✨',
  },
}

// Характеристики в стиле Яндекс Маркета (Label ................. Value)
const CHAR_LABELS: Record<string, string> = {
  natural_light: 'Освещение',
  interior_style: 'Стиль интерьера',
  kitchen_type: 'Кухня',
  ceiling_height: 'Высота потолков',
  capacity_max: 'Вместимость',
  area_sqm: 'Площадь',
}

const CHAR_VALUES: Record<string, Record<string, string>> = {
  natural_light: { 'yes': 'Естественный свет', 'partial': 'Смешанное', 'no': 'Искусственное' },
  interior_style: { 'loft': 'Лофт', 'modern': 'Модерн', 'minimal': 'Минимализм', 'classic': 'Классика', 'eclectic': 'Эклектика' },
  kitchen_type: { 'european': 'Европейская', 'italian': 'Итальянская', 'fast_food': 'Фаст-фуд', 'mixed': 'Смешанная' },
}

const getCharValue = (key: string, val: any) => {
  if (key === 'ceiling_height') return `${val} м`
  if (key === 'capacity_max') return `до ${val} чел.`
  if (key === 'area_sqm') return `${val} м²`
  return CHAR_VALUES[key]?.[val] || val
}

export function VenueDetailsDisplay({ details }: VenueDetailsDisplayProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'amenities' | 'rules'>('overview')

  if (!details) return null

  // Подготовка данных
  const formats = (details.work_format || []).map((f: string) => WORK_FORMAT_DESCRIPTIONS[f]).filter(Boolean)
  
  // Характеристики для таблицы
  const specs = [
    { key: 'capacity_max', val: details.capacity_max },
    { key: 'area_sqm', val: details.area_sqm },
    { key: 'ceiling_height', val: details.ceiling_height },
    { key: 'natural_light', val: details.natural_light },
    { key: 'interior_style', val: details.interior_style },
    { key: 'kitchen_type', val: details.kitchen_type },
  ].filter(item => item.val)

  // Удобства
  const amenitiesList = []
  if (details.venue_type === 'loft') {
    if (details.has_stage) amenitiesList.push('Сцена')
    if (details.sound_system) amenitiesList.push('Проф. звук')
    if (details.light_equipment) amenitiesList.push('Свет')
    if (details.projector) amenitiesList.push('Проектор')
    if (details.kitchen_access) amenitiesList.push('Кухня')
  }
  if (details.amenities) {
    details.amenities.filter((a: any) => a.available).forEach((a: any) => amenitiesList.push(a.label))
  }

  const rulesList = details.rules?.filter((r: any) => r.enabled) || []

  return (
    <div className="space-y-6">
      
      {/* Табы - стиль Apple/iOS Segmented Control */}
      <div className="p-1 bg-slate-100 rounded-xl inline-flex w-full sm:w-auto">
        {[
          { id: 'overview', label: 'Обзор' },
          { id: 'amenities', label: 'Удобства', count: amenitiesList.length },
          { id: 'rules', label: 'Правила', count: rulesList.length }
        ].map(tab => (
          tab.count === 0 && tab.id !== 'overview' ? null : (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-center",
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </button>
          )
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* === Вкладка ОБЗОР === */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* 1. Форматы работы - Компактные карточки */}
            {formats.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formats.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-[16px] border border-slate-100/50">
                    <span className="text-xl mt-0.5">{item.icon}</span>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{item.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Характеристики - Стиль Яндекс Маркета (Таблица) */}
            {specs.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide opacity-80">Характеристики</h4>
                <div className="space-y-3">
                  {specs.map((spec, idx) => (
                    <div key={idx} className="flex items-end text-sm">
                      <span className="text-slate-500 whitespace-nowrap">{CHAR_LABELS[spec.key]}</span>
                      <div className="flex-1 border-b border-slate-200 border-dashed mx-2 mb-1 opacity-50" />
                      <span className="text-slate-900 font-medium whitespace-nowrap">{getCharValue(spec.key, spec.val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === Вкладка УДОБСТВА === */}
        {activeTab === 'amenities' && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenitiesList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 p-3 bg-white border border-slate-100 rounded-[16px] shadow-sm">
                  <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === Вкладка ПРАВИЛА === */}
        {activeTab === 'rules' && (
          <div className="space-y-3">
            {rulesList.map((rule: any, idx: number) => (
              <div key={idx} className="flex gap-3 p-4 bg-orange-50/50 border border-orange-100 rounded-[16px]">
                <Info className="w-5 h-5 text-orange-400 shrink-0" />
                <span className="text-sm text-slate-700 leading-relaxed">
                  {rule.text}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}


