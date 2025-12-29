'use client'

import { useMemo, useState } from 'react'
import {
  Check,
  Clock,
  ExternalLink,
  Image as ImageIcon,
  Info,
  LayoutGrid,
  MapPin,
  Phone,
  Play,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Ruler,
  Building,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { VenueDetailsDisplay } from './venue-details-display'
import { LocationGalleryLightbox } from '../location-gallery-lightbox'
import { YandexReviewsWidget } from '@/components/features/yandex-reviews/yandex-reviews-widget'
import Image from 'next/image'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SectionTemplates, TemplateVariant } from '@/lib/types/templates'
import { useProfileTemplates } from '@/hooks/use-profile-templates'
import { useAuth } from '@/lib/contexts/auth-context'

interface LocationsTabsProps {
  profileId: string
  initialTemplates?: SectionTemplates
  locations: any[]
  title?: string
  isOwner?: boolean
  variant?: TemplateVariant
}

type LocationsViewMode = 'standard' | 'compact'

// ===== Helpers for compact view =====
const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_LABEL: Record<(typeof DAY_ORDER)[number], string> = {
  mon: 'Пн',
  tue: 'Вт',
  wed: 'Ср',
  thu: 'Чт',
  fri: 'Пт',
  sat: 'Сб',
  sun: 'Вс',
}

function formatWorkingHours(workingHours: any): string | null {
  if (!workingHours) return null
  if (typeof workingHours === 'string') return workingHours
  if (typeof workingHours !== 'object') return null

  const items = DAY_ORDER
    .map((d) => ({ day: d, hours: workingHours[d] }))
    .filter((x) => typeof x.hours === 'string' && x.hours.trim().length > 0) as Array<{
    day: (typeof DAY_ORDER)[number]
    hours: string
  }>

  if (items.length === 0) return null

  const groups: Array<{ from: (typeof DAY_ORDER)[number]; to: (typeof DAY_ORDER)[number]; hours: string }> = []
  for (const it of items) {
    const last = groups[groups.length - 1]
    if (!last) {
      groups.push({ from: it.day, to: it.day, hours: it.hours })
      continue
    }
    const lastIdx = DAY_ORDER.indexOf(last.to)
    const curIdx = DAY_ORDER.indexOf(it.day)
    if (curIdx === lastIdx + 1 && it.hours === last.hours) {
      last.to = it.day
    } else {
      groups.push({ from: it.day, to: it.day, hours: it.hours })
    }
  }

  return groups
    .map((g) => {
      const dayPart = g.from === g.to ? DAY_LABEL[g.from] : `${DAY_LABEL[g.from]}–${DAY_LABEL[g.to]}`
      return `${dayPart} ${g.hours}`
    })
    .join(' · ')
}

const WORK_FORMAT_DESCRIPTIONS: Record<string, { title: string; desc: string; icon: 'sparkles' | 'shield' | 'image' }> = {
  venue_rental: { title: 'Аренда площадки', desc: 'Только пространство — программу можно свою.', icon: 'image' },
  own_programs: { title: 'Свои программы', desc: 'Есть аниматоры и шоу — всё в одном месте.', icon: 'sparkles' },
  turnkey: { title: 'Под ключ', desc: 'Еда, декор и развлечения — организуют за вас.', icon: 'shield' },
  tickets: { title: 'Входной билет', desc: 'Свободное посещение игровой зоны.', icon: 'sparkles' },
  hybrid: { title: 'Гибрид', desc: 'Комната + общая игровая зона.', icon: 'sparkles' },
  concept_studio: { title: 'Концепт-студия', desc: 'Авторский дизайн и активности.', icon: 'sparkles' },
}

function getWorkFormats(details: any) {
  const vals = (details?.work_format || []) as string[]
  return vals.map((v) => WORK_FORMAT_DESCRIPTIONS[v]).filter(Boolean)
}

function getAmenities(details: any): string[] {
  const list: string[] = []
  if (!details) return list
  if (Array.isArray(details.amenities)) {
    for (const a of details.amenities) {
      if (a?.available && a?.label) list.push(String(a.label))
    }
  }
  if (details.venue_type === 'loft') {
    if (details.has_stage) list.push('Сцена')
    if (details.sound_system) list.push('Проф. звук')
    if (details.light_equipment) list.push('Свет')
    if (details.projector) list.push('Проектор')
    if (details.kitchen_access) list.push('Кухня')
  }
  return Array.from(new Set(list))
}

function getRules(details: any): string[] {
  const rules = details?.rules
  if (!Array.isArray(rules)) return []
  return rules.filter((r) => r?.enabled && r?.text).map((r) => String(r.text))
}

function getKeySpecs(details: any): Array<{ label: string; value: string }> {
  if (!details) return []

  const out: Array<{ label: string; value: string }> = []
  if (details.capacity_max) out.push({ label: 'Вместимость', value: `до ${details.capacity_max} чел.` })
  if (details.area_sqm) out.push({ label: 'Площадь', value: `${details.area_sqm} м²` })
  if (details.floor !== undefined && details.floor !== null) out.push({ label: 'Этаж', value: `${details.floor}` })
  if (details.ceiling_height) out.push({ label: 'Потолки', value: `${details.ceiling_height} м` })

  const naturalLightMap: Record<string, string> = { yes: 'Естественный свет', partial: 'Смешанное', no: 'Искусственное' }
  if (details.natural_light) out.push({ label: 'Освещение', value: naturalLightMap[details.natural_light] || String(details.natural_light) })

  const interiorStyleMap: Record<string, string> = { loft: 'Лофт', modern: 'Модерн', minimal: 'Минимализм', classic: 'Классика', eclectic: 'Эклектика' }
  if (details.interior_style) out.push({ label: 'Интерьер', value: interiorStyleMap[details.interior_style] || String(details.interior_style) })

  const kitchenTypeMap: Record<string, string> = { european: 'Европейская', italian: 'Итальянская', fast_food: 'Фаст‑фуд', mixed: 'Смешанная' }
  if (details.kitchen_type) out.push({ label: 'Кухня', value: kitchenTypeMap[details.kitchen_type] || String(details.kitchen_type) })

  return out
}

export function LocationsTabs({ profileId, initialTemplates, locations, title, isOwner, variant }: LocationsTabsProps) {
  const { isClient } = useAuth()
  const showOwnerControls = Boolean(isOwner) && !isClient
  const [activeTab, setActiveTab] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const { getTemplate, updateTemplate, isUpdating, variant: currentVariant } = useProfileTemplates({
    profileId,
    initialTemplates,
    variant,
  })

  if (!locations || locations.length === 0) return null

  const activeLocation = locations[activeTab]

  const viewMode: LocationsViewMode = getTemplate('locations') === 'compact' ? 'compact' : 'standard'

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const activeLocationLabel = useMemo(() => {
    const base = activeLocation?.name || activeLocation?.address || activeLocation?.city || 'Локация'
    return String(base)
  }, [activeLocation])

  return (
    <>
    <section id="locations" className="bg-white rounded-[32px] p-4 sm:p-6 md:p-8 shadow-sm relative group">
      {/* Заголовок и настройки */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          {title || (locations.length === 1 ? 'Наш адрес' : 'Наши адреса')}
        </h2>

        {showOwnerControls && (
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
              <DropdownMenuItem
                onClick={() => void updateTemplate('locations', 'standard')}
                className={`cursor-pointer ${
                  viewMode === 'standard'
                    ? 'bg-orange-50 text-orange-700 font-medium' 
                    : 'text-slate-700'
                }`}
              >
                <div>
                  <div className="font-medium">Вариант 1</div>
                  <div className="text-xs text-slate-500">Стандартный с табами</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => void updateTemplate('locations', 'compact')}
                className={`cursor-pointer ${
                  viewMode === 'compact'
                    ? 'bg-orange-50 text-orange-700 font-medium' 
                    : 'text-slate-700'
                }`}
              >
                <div>
                  <div className="font-medium">Вариант 2</div>
                  <div className="text-xs text-slate-500">Компактный список</div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      {viewMode === 'standard' ? (
        <>
          {/* Tabs Navigation */}
          {locations.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
              {locations.map((location: any, index: number) => (
                <button
                  key={location.id || index}
                  onClick={() => setActiveTab(index)}
                  className={cn(
                    "shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                    activeTab === index
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-200 scale-100"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {location.name || `Филиал ${index + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* Active Location Content */}
          <div className="space-y-6 animate-in fade-in duration-300">
        
        {/* Верхний блок: Адрес и Ключевые метрики */}
        <div className="flex flex-col gap-4">
          
          {/* Адрес и телефон - Clean Style */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-0">
            <div className="flex items-start gap-3">
              <div className="mt-1 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <div>
                <p className="text-lg text-slate-900 font-bold leading-tight">
                  {activeLocation.address || activeLocation.city}
                </p>
                {activeLocation.metro_stations && activeLocation.metro_stations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activeLocation.metro_stations.map((station: any, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: station.color || '#999' }}
                        />
                        {station.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {activeLocation.phone && (
              <a 
                href={`tel:${activeLocation.phone}`} 
                className="flex items-center gap-3 pl-4 pr-6 py-3 bg-green-50 hover:bg-green-100 rounded-[20px] transition-all group/phone w-fit border border-green-100/50 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Phone className="w-4 h-4 text-green-600 group-hover/phone:scale-110 transition-transform" />
                </div>
                <span className="text-lg text-slate-900 font-bold tracking-tight">
                  {activeLocation.phone}
                </span>
              </a>
            )}
          </div>

          {/* Метрики (Вместимость, Площадь, Этаж) - Compact Strip */}
          {(activeLocation.details?.capacity_max || activeLocation.details?.area_sqm || activeLocation.details?.floor) && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 py-3 px-4 bg-slate-50 rounded-[16px] w-fit">
              
              {/* Вместимость */}
              {activeLocation.details.capacity_max && (
                <div className="flex items-center gap-2" title="Вместимость">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">
                    до {activeLocation.details.capacity_max} чел.
                  </span>
                </div>
              )}

              {/* Разделитель */}
              {activeLocation.details.capacity_max && activeLocation.details.area_sqm && (
                <div className="hidden sm:block w-px h-4 bg-slate-200" />
              )}
              
              {/* Площадь */}
              {activeLocation.details.area_sqm && (
                <div className="flex items-center gap-2" title="Площадь">
                  <Ruler className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">
                    {activeLocation.details.area_sqm} м²
                  </span>
                </div>
              )}

              {/* Разделитель */}
              {(activeLocation.details.capacity_max || activeLocation.details.area_sqm) && activeLocation.details.floor && (
                <div className="hidden sm:block w-px h-4 bg-slate-200" />
              )}

              {/* Этаж */}
              {activeLocation.details.floor !== undefined && activeLocation.details.floor !== null && (
                <div className="flex items-center gap-2" title="Этаж">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">
                    {activeLocation.details.floor} этаж
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Фотогалерея */}
        {(activeLocation.photos?.length > 0 || activeLocation.video_url) && (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {/* Видео если есть */}
            {activeLocation.video_url && (
              <button
                onClick={() => handleOpenLightbox(activeLocation.photos?.length || 0)}
                className="col-span-3 md:col-span-2 md:row-span-2 relative aspect-video md:aspect-square rounded-[24px] overflow-hidden group/video bg-slate-900"
              >
                <div className="absolute inset-0 bg-black/40 z-10" />
                <Image
                  src={activeLocation.video_cover || activeLocation.photos?.[0] || '/placeholder-video.jpg'} 
                  alt="Video cover"
                  fill
                  className="object-cover opacity-80 group-hover/video:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover/video:scale-110 transition-transform border border-white/30 shadow-lg">
                    <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                  </div>
                  <span className="text-white text-sm font-semibold tracking-wide drop-shadow-md">
                    Видео-обзор
                  </span>
                </div>
                {/* Бейдж видео */}
                <div className="absolute top-3 right-3 z-20 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Video</span>
                </div>
              </button>
            )}

            {/* Фотографии: Показываем до 6 фоток рядом с видео (если видео есть) или 5 если нет */}
            {(() => {
              const maxPhotos = activeLocation.video_url ? 6 : 5
              const photosToShow = activeLocation.photos?.slice(0, maxPhotos) || []
              const hasMore = (activeLocation.photos?.length || 0) > maxPhotos

              return photosToShow.map((photo: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleOpenLightbox(idx)}
                  className={cn(
                    "relative aspect-square rounded-[24px] overflow-hidden bg-slate-100 hover:opacity-90 transition-opacity",
                    // Первая фотка большая если нет видео
                    !activeLocation.video_url && idx === 0 ? "col-span-2 row-span-2 rounded-[24px]" : ""
                  )}
                >
                  <Image
                    src={photo}
                    alt={`Фото ${idx + 1}`}
                    fill
                    className="object-cover"
                  />
                  {/* Кнопка "Ещё фото" на последней фото, если есть ещё */}
                  {idx === photosToShow.length - 1 && hasMore && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 group/more">
                      <span className="text-lg font-bold text-white group-hover/more:scale-110 transition-transform">
                        +{(activeLocation.photos?.length || 0) - maxPhotos}
                      </span>
                      <span className="text-[10px] text-white/80 font-medium uppercase tracking-wider">фото</span>
                    </div>
                  )}
                </button>
              ))
            })()}
          </div>
        )}

        {/* Детальная информация - скрываем если пусто */}
        {activeLocation.details && (
          <div className="pt-2">
            <VenueDetailsDisplay details={activeLocation.details} />
          </div>
        )}

        {/* Отзывы Яндекса (footer) */}
        {(activeLocation.yandex_review_count > 0 || activeLocation.reviews?.length > 0) && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-xl font-bold text-slate-900">Отзывы Яндекс.Карты</h3>
              {activeLocation.yandex_rating && (
                <div className="flex items-center gap-1 bg-slate-900 text-white px-2.5 py-1 rounded-[10px] text-sm font-bold">
                  <span>★</span>
                  <span>{activeLocation.yandex_rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            
            {activeLocation.yandex_url ? (
              <div className="space-y-6">
                {activeLocation.yandex_rating && (
                  <div className="flex items-center justify-between p-4 bg-[#FCE000]/10 rounded-[20px] border border-[#FCE000]/20">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#fc3f1d] text-white w-10 h-10 rounded-[12px] flex items-center justify-center text-lg font-bold shadow-sm">
                        Я
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-slate-900">{activeLocation.yandex_rating.toFixed(1)}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={`text-sm ${i < Math.floor(activeLocation.yandex_rating) ? 'text-amber-400' : 'text-slate-300'}`}>★</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-xs font-medium text-slate-500">
                          Рейтинг организации на Яндекс.Картах
                        </div>
                      </div>
                    </div>
                    <a 
                      href={activeLocation.yandex_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white text-slate-900 text-sm font-medium rounded-[12px] shadow-sm hover:shadow hover:bg-slate-50 transition-all"
                    >
                      Читать все
                    </a>
                  </div>
                )}
                
                <YandexReviewsWidget 
                  locationId={activeLocation.id} 
                  layout="cards"
                  maxReviews={100}
                  yandexUrl={activeLocation.yandex_url}
                  hideHeader
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
        </>
      ) : (
        <CompactLocationsView
          locations={locations}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeLocation={activeLocation}
          activeLocationLabel={activeLocationLabel}
          onOpenLightbox={handleOpenLightbox}
        />
      )}

      {/* Lightbox Gallery */}
      <LocationGalleryLightbox
        photos={activeLocation.photos || []}
        videoUrl={activeLocation.video_url}
        isOpen={lightboxOpen}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </section>
    </>
  )
}

function CompactLocationsView({
  locations,
  activeTab,
  setActiveTab,
  activeLocation,
  activeLocationLabel,
  onOpenLightbox,
}: {
  locations: any[]
  activeTab: number
  setActiveTab: (idx: number) => void
  activeLocation: any
  activeLocationLabel: string
  onOpenLightbox: (idx: number) => void
}) {
  const workingHoursText = useMemo(() => formatWorkingHours(activeLocation?.working_hours), [activeLocation?.working_hours])
  const formats = useMemo(() => getWorkFormats(activeLocation?.details), [activeLocation?.details])
  const amenities = useMemo(() => getAmenities(activeLocation?.details), [activeLocation?.details])
  const rules = useMemo(() => getRules(activeLocation?.details), [activeLocation?.details])
  const specs = useMemo(() => getKeySpecs(activeLocation?.details), [activeLocation?.details])

  const hasMedia = (activeLocation?.photos?.length || 0) > 0 || !!activeLocation?.video_url
  const hasReviews = (activeLocation?.yandex_review_count || 0) > 0 || (activeLocation?.reviews?.length || 0) > 0

  return (
    <div
      className={cn(
        'grid gap-4 md:gap-6 min-w-0',
        locations.length > 1 ? 'grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]' : 'grid-cols-1'
      )}
    >
      {/* Locations list */}
      {locations.length > 1 && (
        <>
          {/* Mobile: compact horizontal switcher */}
          <div className="lg:hidden">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {locations.map((loc: any, idx: number) => (
                  <button
                    key={loc.id || idx}
                    onClick={() => setActiveTab(idx)}
                    className={cn(
                      'shrink-0 rounded-[18px] px-3 py-2 text-left border transition-all',
                      idx === activeTab
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <div className="text-sm font-semibold leading-tight">{loc.name || `Филиал ${idx + 1}`}</div>
                    <div className={cn('text-xs mt-0.5', idx === activeTab ? 'text-white/80' : 'text-slate-500')}>
                      {loc.address || loc.city}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Desktop: sidebar */}
          <div className="hidden lg:block">
            <div className="rounded-[24px] border border-slate-200 bg-white p-3">
              <div className="text-xs font-semibold text-slate-500 uppercase px-2 pb-2">
                Локации
              </div>
              <Separator className="mb-2" />
              <ScrollArea className="h-[520px] pr-2">
                <div className="space-y-2">
                  {locations.map((loc: any, idx: number) => {
                    const isActive = idx === activeTab
                    return (
                      <button
                        key={loc.id || idx}
                        onClick={() => setActiveTab(idx)}
                        className={cn(
                          'w-full text-left rounded-[18px] p-3 border transition-all',
                          isActive
                            ? 'bg-orange-50 border-orange-200 shadow-sm'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {loc.name || `Филиал ${idx + 1}`}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {loc.address || loc.city}
                            </div>
                          </div>

                          {loc.yandex_rating && (
                            <div className="shrink-0">
                              <Badge variant="secondary" className="rounded-full">
                                ★ {Number(loc.yandex_rating).toFixed(1)}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </>
      )}

      {/* Details */}
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="rounded-[24px] border border-slate-200 bg-gradient-to-b from-white to-slate-50/40 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                    {activeLocation?.address || activeLocation?.city || activeLocationLabel}
                  </div>
                  {activeLocation?.name && (
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {activeLocation?.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {workingHoursText && (
                  <Badge variant="secondary" className="rounded-full">
                    <Clock className="w-3 h-3 mr-1" />
                    {workingHoursText}
                  </Badge>
                )}
                {activeLocation?.details?.capacity_max && (
                  <Badge variant="secondary" className="rounded-full">
                    <Users className="w-3 h-3 mr-1" />до {activeLocation.details.capacity_max}
                  </Badge>
                )}
                {activeLocation?.details?.area_sqm && (
                  <Badge variant="secondary" className="rounded-full">
                    <Ruler className="w-3 h-3 mr-1" />{activeLocation.details.area_sqm} м²
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              {activeLocation?.phone && (
                <Button asChild size="sm" className="rounded-[14px]">
                  <a href={`tel:${activeLocation.phone}`}>
                    <Phone className="w-4 h-4 mr-2" />
                    Позвонить
                  </a>
                </Button>
              )}
              {activeLocation?.yandex_url && (
                <Button asChild size="sm" variant="secondary" className="rounded-[14px]">
                  <a href={activeLocation.yandex_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    На карте
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Media */}
        {hasMedia && (
          <div className="rounded-[24px] border border-slate-200 bg-white p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ImageIcon className="w-4 h-4 text-slate-500" />
                Фото и видео
              </div>
              <div className="text-xs text-slate-500">
                {activeLocation?.photos?.length ? `${activeLocation.photos.length} фото` : ''}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2">
              {/* Main */}
              {activeLocation?.photos?.[0] && (
                <button
                  onClick={() => onOpenLightbox(0)}
                  className="col-span-12 sm:col-span-7 relative aspect-[16/10] rounded-[18px] overflow-hidden bg-slate-100 hover:opacity-95 transition-opacity"
                  aria-label="Открыть фото"
                >
                  <Image src={activeLocation.photos[0]} alt="Фото" fill className="object-cover" />
                </button>
              )}

              {/* Right column */}
              <div className="col-span-12 sm:col-span-5 grid grid-cols-2 gap-2">
                {activeLocation?.video_url && (
                  <button
                    onClick={() => onOpenLightbox(activeLocation?.photos?.length || 0)}
                    className="col-span-2 relative aspect-[16/10] rounded-[18px] overflow-hidden bg-slate-900 group"
                    aria-label="Открыть видео"
                  >
                    <div className="absolute inset-0 bg-black/35" />
                    <Image
                      src={activeLocation?.video_cover || activeLocation?.photos?.[1] || activeLocation?.photos?.[0] || '/placeholder-video.jpg'}
                      alt="Видео"
                      fill
                      className="object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
                        <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  </button>
                )}

                {(activeLocation?.photos || []).slice(1, activeLocation?.video_url ? 3 : 5).map((p: string, idx: number) => (
                  <button
                    key={`${p}-${idx}`}
                    onClick={() => onOpenLightbox(idx + 1)}
                    className="relative aspect-[16/10] rounded-[18px] overflow-hidden bg-slate-100 hover:opacity-95 transition-opacity"
                    aria-label={`Открыть фото ${idx + 2}`}
                  >
                    <Image src={p} alt={`Фото ${idx + 2}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Details accordion */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-2 sm:p-3">
          <Accordion type="multiple" defaultValue={['overview']} className="w-full">
            <AccordionItem value="overview" className="border-b border-slate-100">
              <AccordionTrigger className="px-3 py-3 text-sm font-semibold">
                Обзор
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4">
                <div className="space-y-4">
                  {formats.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {formats.map((f, idx) => (
                        <div key={idx} className="rounded-[16px] border border-slate-100 bg-slate-50 p-3">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 w-8 h-8 rounded-[12px] bg-white border border-slate-100 flex items-center justify-center">
                              {f.icon === 'sparkles' ? (
                                <Sparkles className="w-4 h-4 text-orange-600" />
                              ) : f.icon === 'shield' ? (
                                <ShieldCheck className="w-4 h-4 text-green-600" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-slate-600" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{f.title}</div>
                              <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">{f.desc}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {specs.length > 0 && (
                    <div className="rounded-[16px] border border-slate-100 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Характеристики</div>
                      <div className="space-y-2">
                        {specs.slice(0, 8).map((s, idx) => (
                          <div key={idx} className="flex items-end text-sm min-w-0">
                            <span className="text-slate-500 min-w-0 break-words">{s.label}</span>
                            <div className="flex-1 border-b border-slate-200 border-dashed mx-2 mb-1 opacity-60" />
                            <span className="text-slate-900 font-medium min-w-0 break-words text-right">
                              {s.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="amenities" className="border-b border-slate-100">
              <AccordionTrigger className="px-3 py-3 text-sm font-semibold">
                Удобства{amenities.length ? ` (${amenities.length})` : ''}
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4">
                {amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((a, idx) => (
                      <Badge key={idx} variant="secondary" className="rounded-full">
                        {a}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Нет данных по удобствам.</div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rules" className="border-b border-slate-100">
              <AccordionTrigger className="px-3 py-3 text-sm font-semibold">
                Правила{rules.length ? ` (${rules.length})` : ''}
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4">
                {rules.length > 0 ? (
                  <div className="space-y-2">
                    {rules.map((r, idx) => (
                      <div key={idx} className="flex gap-2 rounded-[16px] border border-orange-100 bg-orange-50/50 p-3">
                        <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-700 leading-relaxed">{r}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Нет данных по правилам.</div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="reviews" className="border-b-0">
              <AccordionTrigger className="px-3 py-3 text-sm font-semibold">
                Отзывы
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-4">
                {hasReviews ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 truncate">
                          {activeLocation?.name || activeLocationLabel}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {activeLocation?.yandex_review_count ? `${activeLocation.yandex_review_count} отзывов` : 'Отзывы'}
                        </div>
                      </div>
                      {activeLocation?.yandex_rating && (
                        <Badge className="rounded-full bg-slate-900 text-white hover:bg-slate-900">
                          ★ {Number(activeLocation.yandex_rating).toFixed(1)}
                        </Badge>
                      )}
                    </div>

                    {activeLocation?.yandex_url ? (
                      <>
                        <Button asChild variant="secondary" size="sm" className="rounded-[14px] w-fit">
                          <a href={activeLocation.yandex_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Открыть на Яндекс.Картах
                          </a>
                        </Button>

                        <div className="max-h-[520px] overflow-auto pr-1">
                          <YandexReviewsWidget
                            locationId={activeLocation.id}
                            layout="grid"
                            maxReviews={8}
                            yandexUrl={activeLocation.yandex_url}
                            hideHeader
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-slate-500">
                        Ссылка на отзывы не указана.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Пока нет отзывов для этой локации.</div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  )
}

