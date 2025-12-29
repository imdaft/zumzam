'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Check, ChevronDown, ChevronLeft, ChevronRight, Gift, Loader2, Settings, X } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/contexts/auth-context'
import { useCartStore } from '@/lib/store/cart-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SectionTemplates, ServicesTemplateId, TemplateVariant } from '@/lib/types/templates'
import { useProfileTemplates } from '@/hooks/use-profile-templates'
import { ServiceCard } from '@/components/features/profile/lavka-style/service-card'
import { SERVICES_SECTION_TEMPLATES } from '@/lib/constants/template-configs'

export interface ServiceItem {
  id: string
  profile_id?: string
  title: string
  price: number
  price_type?: 'fixed' | 'from' | 'hourly' | 'per_person' | 'negotiable'
  image?: string | string[] | null
  duration?: string
  description?: string
  is_package?: boolean
  package_includes?: string[]
}

export interface ServiceGroup {
  category?: string
  items: ServiceItem[]
}

type ServicesViewMode = 'standard' | 'compact' | 'large'

function templateToViewMode(tmpl: ServicesTemplateId | string | undefined): ServicesViewMode {
  // Маппим существующие значения шаблонов services -> режимы
  // list (default) = стандартный (2 колонки)
  // table = компактный (аккордеон)
  // cards = крупный (1 колонка)
  if (tmpl === 'table') return 'compact'
  if (tmpl === 'cards') return 'large'
  return 'standard'
}

function viewModeToTemplate(mode: ServicesViewMode): ServicesTemplateId {
  if (mode === 'compact') return 'table'
  if (mode === 'large') return 'cards'
  return 'list'
}

export function ServicesBlock({
  profileId,
  initialTemplates,
  variant, // НОВЫЙ проп
  groups,
  title,
  description,
  isOwner,
  sectionId = 'services',
}: {
  profileId: string
  initialTemplates?: SectionTemplates
  variant?: TemplateVariant // НОВЫЙ проп
  groups: ServiceGroup[]
  title: string
  description?: string
  isOwner?: boolean
  /** По умолчанию сохраняем в section_templates.services */
  sectionId?: string
}) {
  const { isClient } = useAuth()
  const showOwnerControls = Boolean(isOwner) && !isClient
  const { getTemplate, updateTemplate, isUpdating, variant: currentVariant } = useProfileTemplates({
    profileId,
    initialTemplates,
    variant, // Передаем variant
  })

  const raw = getTemplate(sectionId)
  const viewMode = templateToViewMode(raw as ServicesTemplateId)

  const flatCount = useMemo(() => groups.reduce((sum, g) => sum + (g.items?.length || 0), 0), [groups])
  if (flatCount === 0) return null

  return (
    <div className="bg-white rounded-[32px] p-1 shadow-sm border border-slate-100">
      <div className="px-6 py-6 pb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{title}</h2>
          {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
        </div>

        {showOwnerControls && (
          <div className="flex items-center gap-2">
            {/* Индикатор текущего варианта */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full text-xs text-slate-600 font-medium">
              {currentVariant === 'mobile' ? '📱 Мобильная' : '💻 Десктоп'}
            </div>
            
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
                {/* Заголовок с вариантом */}
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 border-b">
                  {currentVariant === 'mobile' ? '📱 Мобильная версия' : '💻 Десктопная версия'}
                </div>
                
                {SERVICES_SECTION_TEMPLATES.templates.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      void updateTemplate(sectionId, template.id as ServicesTemplateId)
                    }}
                    className={`cursor-pointer ${
                      viewModeToTemplate(viewMode) === template.id
                        ? 'bg-orange-50 text-orange-700 font-medium' 
                        : 'text-slate-700'
                    }`}
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

      {viewMode === 'compact' ? (
        <div className="p-2">
          <CompactServicesList groups={groups} />
        </div>
      ) : (
        <div className="p-2">
          {groups.map((group, idx) => (
            <div key={group.category || idx} className={cn(idx > 0 && 'mt-6')}>
              {group.category && groups.length > 1 && (
                <h3 className="px-4 text-lg font-semibold text-slate-700 mb-3">{group.category}</h3>
              )}
              <div className={cn('grid gap-2', viewMode === 'standard' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
                {group.items.map((it) => (
                  <ServiceCard key={it.id} {...it} image={it.image ?? undefined} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CompactServicesList({ groups }: { groups: ServiceGroup[] }) {
  return (
    <div className="bg-slate-50/60 rounded-[28px] border border-slate-100 p-2 sm:p-3">
      {groups.map((group, gIdx) => (
        <div key={group.category || gIdx} className={cn(gIdx > 0 && 'mt-4')}>
          {group.category && groups.length > 1 && (
            <div className="px-2 pb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              {group.category}
            </div>
          )}
          <Accordion type="single" collapsible className="w-full">
            {group.items.map((it) => (
              <ServiceAccordionItem key={it.id} item={it} />
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  )
}

function ServiceAccordionItem({ item }: { item: ServiceItem }) {
  const [isAdding, setIsAdding] = useState(false)
  const { addItem, items, clearCart } = useCartStore()

  const isInCart = items.some((i) => i.service_id === item.id)
  const images = Array.isArray(item.image) ? item.image : item.image ? [item.image] : []
  const cover = images[0]
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const thumbsRef = useRef<HTMLDivElement>(null)
  const [thumbsPage, setThumbsPage] = useState(0)

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!item.profile_id) {
      toast.error('Невозможно добавить в корзину')
      return
    }
    if (isInCart) {
      toast.info('Уже в корзине')
      return
    }

    try {
      setIsAdding(true)
      await addItem(item.id, item.profile_id, 1)
      toast.success('Добавлено в корзину', { description: item.title })
    } catch (error: any) {
      if (error?.code === 'DIFFERENT_PROFILE_EXISTS') {
        const confirmSwitch = window.confirm(
          error.message || 'В корзине уже есть услуги другого исполнителя. Очистить корзину и добавить эту услугу?'
        )
        if (confirmSwitch) {
          await clearCart()
          await addItem(item.id, item.profile_id, 1)
          toast.success('Корзина обновлена', { description: item.title })
        } else {
          toast.info('Корзина осталась без изменений')
        }
        return
      }
      toast.error('Не удалось добавить в корзину', { description: error?.message || 'Попробуйте ещё раз' })
    } finally {
      setIsAdding(false)
    }
  }

  const formatPrice = () => {
    if (item.price_type === 'negotiable') return 'Договорная'
    const prefix = item.price_type === 'from' ? 'от ' : ''
    const suffix = item.price_type === 'hourly' ? ' /час' : item.price_type === 'per_person' ? ' /чел' : ''
    return `${prefix}${item.price.toLocaleString('ru')} ₽${suffix}`
  }

  return (
    <AccordionItem value={item.id} className="border-b border-slate-200/60 last:border-b-0">
      <div className="relative">
        <AccordionTrigger className="px-3 py-3 hover:no-underline pr-28 text-left items-start sm:items-center">
          <div className="flex items-start sm:items-center gap-3 w-full">
            <div className="relative w-16 h-16 rounded-[16px] overflow-hidden bg-white border border-slate-200 shrink-0">
              {cover ? (
                <Image src={cover} alt={item.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Gift className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm sm:text-base font-bold text-slate-900 break-words leading-snug">{item.title}</div>
              <div className="flex flex-wrap items-center justify-start gap-2 mt-1">
                <div className="text-sm font-semibold text-slate-900">{formatPrice()}</div>
                {item.duration && <span className="text-xs text-slate-500">· {item.duration}</span>}
              </div>
            </div>
          </div>
        </AccordionTrigger>

        {/* ВАЖНО: кнопка вне AccordionTrigger */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 z-10">
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void handleAdd(e as any)
            }}
            disabled={isAdding || isInCart || !item.profile_id}
            className={cn(
              'rounded-full h-9 px-4 font-bold',
              isInCart ? 'bg-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-orange-500 hover:bg-orange-600'
            )}
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isInCart ? (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                В корзине
              </>
            ) : (
              'Добавить'
            )}
          </Button>
        </div>
      </div>

      <AccordionContent className="px-3 pb-4">
        <div className="space-y-4">
          {item.description && (
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
          )}

          {images.length > 1 && (
            <div className="rounded-[18px] bg-white border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Фото</div>
                <div className="text-xs text-slate-400">{images.length} шт.</div>
              </div>
              <Separator className="my-2" />
              <div className="relative">
                <div
                  ref={thumbsRef}
                  className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide scroll-smooth snap-x snap-mandatory"
                  onScroll={() => {
                    const el = thumbsRef.current
                    if (!el) return
                    const w = el.clientWidth || 1
                    setThumbsPage(Math.round(el.scrollLeft / w))
                  }}
                >
                  {images.map((src, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="relative w-28 h-20 sm:w-32 sm:h-24 rounded-[16px] overflow-hidden bg-slate-100 border border-slate-200 shrink-0 snap-start"
                      title="Открыть фото"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setLightboxIndex(idx)
                      }}
                    >
                      <Image src={src} alt={`Фото ${idx + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>

                {/* Стрелки листания (desktop) */}
                {images.length > 3 && (
                  <>
                    <button
                      type="button"
                      className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white shadow items-center justify-center border border-slate-200"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const el = thumbsRef.current
                        if (!el) return
                        const w = el.clientWidth || 0
                        el.scrollTo({ left: Math.max(0, el.scrollLeft - w), behavior: 'smooth' })
                      }}
                      aria-label="Листать фото влево"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-900" />
                    </button>
                    <button
                      type="button"
                      className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white shadow items-center justify-center border border-slate-200"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const el = thumbsRef.current
                        if (!el) return
                        const w = el.clientWidth || 0
                        el.scrollTo({ left: Math.min(el.scrollWidth, el.scrollLeft + w), behavior: 'smooth' })
                      }}
                      aria-label="Листать фото вправо"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-900" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ChevronDown className="w-4 h-4" />
            Нажмите на заголовок, чтобы свернуть
          </div>
        </div>
      </AccordionContent>

      {/* Lightbox */}
      {lightboxIndex !== null && images.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-12 right-0 text-white hover:text-orange-500 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-8 h-8" />
            </button>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg"
                  onClick={() => setLightboxIndex((v) => (v === null ? 0 : (v - 1 + images.length) % images.length))}
                  aria-label="Предыдущее"
                >
                  <ChevronLeft className="w-6 h-6 text-slate-900" />
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg"
                  onClick={() => setLightboxIndex((v) => (v === null ? 0 : (v + 1) % images.length))}
                  aria-label="Следующее"
                >
                  <ChevronRight className="w-6 h-6 text-slate-900" />
                </button>
              </>
            )}

            <div className="w-full max-h-[78vh] rounded-[18px] overflow-hidden bg-black flex items-center justify-center">
              <img
                src={images[lightboxIndex]}
                alt={`Фото ${lightboxIndex + 1}`}
                className="max-h-[78vh] w-auto object-contain"
              />
            </div>

            <div className="mt-3 text-center text-white/80 text-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </AccordionItem>
  )
}







