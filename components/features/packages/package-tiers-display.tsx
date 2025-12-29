'use client'

import { useRef, useState, type MouseEvent } from 'react'
import { Check, Loader2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/contexts/auth-context'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { PackagesTemplateId, SectionTemplates, TemplateVariant } from '@/lib/types/templates'
import { useProfileTemplates } from '@/hooks/use-profile-templates'

interface PackageTier {
  id?: string // ID услуги-пакета
  name: string
  price: number
  duration: number
  includes: string[]
  highlighted_includes?: string[] // Массив включенных пунктов, которые нужно выделить как уникальные
  savings?: number // Экономия в рублях
  price_options?: Array<{condition: string, price: number}>
}

interface PackageTiersDisplayProps {
  title: string
  description?: string
  images?: string[]
  tiers: PackageTier[]
  profile_id?: string // ID профиля для добавления в корзину
  profileId?: string
  initialTemplates?: SectionTemplates
  isOwner?: boolean
  variant?: TemplateVariant // НОВЫЙ проп
}

export function PackageTiersDisplay({
  title,
  description,
  images: _images,
  tiers,
  profile_id,
  profileId,
  initialTemplates,
  isOwner,
  variant, // НОВЫЙ проп
}: PackageTiersDisplayProps) {
  const { isClient } = useAuth()
  const showOwnerControls = Boolean(isOwner) && !isClient
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const { addItem, items, clearCart } = useCartStore()

  // Используем profile_id или profileId (fallback)
  const actualProfileId = profile_id || profileId

  const { getTemplate, updateTemplate, isUpdating, variant: currentVariant } = useProfileTemplates({
    profileId: actualProfileId || '',
    initialTemplates,
    variant, // Передаем variant
  })

  const tmplRaw = getTemplate('packages')
  const viewMode: PackagesTemplateId =
    tmplRaw === 'grid' || tmplRaw === 'carousel' || tmplRaw === 'list' ? (tmplRaw as PackagesTemplateId) : 'grid'
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const onMouseDown = (e: MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeft(scrollRef.current.scrollLeft)
  }

  const onMouseLeave = () => {
    setIsDragging(false)
  }

  const onMouseUp = () => {
    setIsDragging(false)
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 1.5 // Скорость прокрутки
    scrollRef.current.scrollLeft = scrollLeft - walk
  }
  
  if (!tiers || tiers.length === 0) {
    console.log('[PackageTiersDisplay] No tiers provided')
    return null
  }
  
  // Debug: проверяем что приходит в tiers
  console.log('[PackageTiersDisplay] actualProfileId:', actualProfileId)
  console.log('[PackageTiersDisplay] allTiersHaveId:', tiers.every(t => t.id))
  console.log('[PackageTiersDisplay] tiers:', tiers)
  
  // Проверяем каждый tier
  tiers.forEach((tier, index) => {
    console.log(`[PackageTiersDisplay] Tier ${index}:`, {
      name: tier.name,
      id: tier.id,
      hasId: !!tier.id,
      price: tier.price
    })
  })
  
  const handleAddToCart = async (tier: PackageTier) => {
    // Если происходит перетаскивание, предотвращаем клик
    if (isDragging) return;

    console.log('[PackageTiersDisplay] handleAddToCart called:', {
      tierName: tier.name,
      tierId: tier.id,
      actualProfileId,
      isDragging
    })

    if (!tier.id || !actualProfileId) {
      toast.error('Невозможно добавить в корзину', {
        description: 'Нет ID пакета или профиля'
      })
      console.error('[PackageTiersDisplay] Missing required data:', { 
        tierId: tier.id, 
        hasId: !!tier.id,
        profileId: actualProfileId,
        hasProfileId: !!actualProfileId,
        tier 
      })
      return
    }
    
    // Проверяем, есть ли уже этот конкретный tier в корзине
    const tierNote = `Пакет: ${tier.name}`
    const isInCart = items.some(item => 
      item.service_id === tier.id && item.notes === tierNote
    )
    
    if (isInCart) {
      toast.info('Уже в корзине')
      return
    }
    
    try {
      setLoadingTier(tier.name) // Используем name вместо id для loading state
      // Передаем цену tier как custom_price
      await addItem(tier.id, actualProfileId, 1, tierNote, tier.price)
      toast.success('Добавлено в корзину! 🎉', {
        description: `${tier.name} добавлен в вашу корзину`,
      })
    } catch (error: any) {
      if (error?.code === 'DIFFERENT_PROFILE_EXISTS') {
        const confirmSwitch = window.confirm(error.message || 'В корзине уже есть услуги другого исполнителя. Очистить корзину и добавить новый пакет?')
        if (confirmSwitch) {
          try {
            await clearCart()
            await addItem(tier.id, actualProfileId, 1, tierNote, tier.price)
            toast.success('Корзина обновлена', {
              description: `${tier.name} добавлен в вашу корзину`,
            })
          } catch (confirmError: any) {
            toast.error('Не удалось обновить корзину', {
              description: confirmError?.message || 'Попробуйте ещё раз',
            })
          } finally {
            setLoadingTier(null)
          }
          return
        } else {
          toast.info('Корзина осталась без изменений')
          setLoadingTier(null)
          return
        }
      }
      console.error('[PackageTiersDisplay] Ошибка добавления в корзину:', error)
      toast.error('Не удалось добавить в корзину', {
        description: error.message || 'Попробуйте ещё раз',
      })
    } finally {
      setLoadingTier(null)
    }
  }

  const isTierInCart = (tier: PackageTier) => {
    const tierNote = `Пакет: ${tier.name}`
    return items.some((item) => item.service_id === tier.id && item.notes === tierNote)
  }

  const TierCard = ({ tier, variant }: { tier: PackageTier; variant: 'card' | 'compact' }) => {
    const inCart = isTierInCart(tier)

    return (
      <div
        className={cn(
          'bg-white border border-slate-200 rounded-[28px] transition-all duration-300',
          variant === 'card'
            ? 'p-5 hover:shadow-xl hover:border-orange-300'
            : 'rounded-[18px] bg-slate-50/60 hover:bg-slate-50'
        )}
      >
        <div className={cn(variant === 'card' ? 'flex flex-col h-full' : '')}>
          <div className={cn(variant === 'card' ? 'mb-4' : 'p-4')}>
            <div className={cn('inline-flex items-center px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 shadow-sm')}>
              <span className="text-xs font-bold uppercase tracking-wider">{tier.name}</span>
            </div>
          </div>

          <div className={cn(variant === 'card' ? 'mb-4 pb-4 border-b border-slate-100' : 'px-4 pb-4')}>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-medium text-slate-400">от</span>
              <span className={cn('font-bold text-slate-900', variant === 'card' ? 'text-3xl' : 'text-2xl')}>
                {tier.price.toLocaleString('ru')}
              </span>
              <span className="text-xl font-medium text-slate-400">₽</span>
            </div>
            {tier.duration && (
              <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                <span>🕒</span>
                <span>{tier.duration} мин</span>
              </div>
            )}
          </div>

          {tier.price_options && tier.price_options.length > 0 && variant === 'card' && (
            <div className="mb-4 pb-4 border-b border-slate-100">
              <div className="space-y-2">
                {tier.price_options.map((option, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 rounded-[18px] px-3 py-2 border border-slate-100">
                    <span className="text-slate-600 font-medium mr-2 flex-1 min-w-0 block leading-snug max-h-[2.6em] overflow-hidden break-words">
                      {option.condition}
                    </span>
                    <span className="font-bold text-orange-600 whitespace-nowrap flex-shrink-0">
                      {option.price.toLocaleString('ru')} ₽
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={cn(variant === 'card' ? 'flex-1 mb-6' : 'px-4 pb-4')}>
            <div className={cn('text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2', variant === 'card' ? '' : 'pt-2')}>
              <span>Включено</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div
              className={cn(
                variant === 'card'
                  ? 'space-y-2.5'
                  : 'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2'
              )}
            >
              {(variant === 'card' ? tier.includes : tier.includes).map((item, itemIndex) => {
                const isHighlighted = tier.highlighted_includes?.includes(item)
                return (
                  <div
                    key={itemIndex}
                    className={cn(
                      'flex items-start gap-3 text-sm',
                      isHighlighted ? 'text-slate-900 font-medium' : 'text-slate-600'
                    )}
                  >
                    <div
                      className={cn(
                        'shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5',
                        isHighlighted
                          ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                          : 'bg-slate-100 text-slate-400'
                      )}
                    >
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                    <span className="leading-snug">{item}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {tier.savings && tier.savings > 0 && variant === 'card' && (
            <div className="mb-4 text-center py-2 px-3 bg-green-50 border border-green-100 rounded-[18px]">
              <span className="text-sm text-green-700 font-bold">Выгода {tier.savings.toLocaleString('ru')} ₽</span>
            </div>
          )}

          <div className={cn(variant === 'card' ? 'mt-auto' : 'px-4 pb-4')}>
            <Button
              className={cn(
                'w-full rounded-full font-bold text-sm',
                variant === 'card' ? 'h-11 shadow-md hover:shadow-lg' : 'h-10',
                'bg-orange-500 hover:bg-orange-600 text-white'
              )}
              onClick={() => handleAddToCart(tier)}
              disabled={loadingTier === tier.name || inCart || !tier.id || !actualProfileId}
            >
              {loadingTier === tier.name ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Добавление...
                </>
              ) : inCart ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  В корзине
                </>
              ) : (
                'Выбрать пакет'
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section id="package-tiers" className="scroll-mt-24">
      <div className="bg-white rounded-[32px] p-1 shadow-sm border border-slate-100">
        {/* Заголовок */}
        <div className="px-6 py-6 pb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{title}</h2>
            {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
          </div>

        {showOwnerControls && profileId && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Индикатор текущего варианта */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full text-xs text-slate-600 font-medium">
              {currentVariant === 'mobile' ? '📱 Мобильная' : '💻 Десктоп'}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  title="Вид блока"
                  disabled={isUpdating}
                >
                  <Settings className="w-4 h-4 text-slate-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 border-b">
                  {currentVariant === 'mobile' ? '📱 Мобильная версия' : '💻 Десктопная версия'}
                </div>
                <DropdownMenuItem
                  className={cn(viewMode === 'grid' && 'bg-orange-50 text-orange-700')}
                  onClick={() => void updateTemplate('packages', 'grid')}
                >
                  <span>Сетка</span>
                  {viewMode === 'grid' && <Check className="w-4 h-4 ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(viewMode === 'carousel' && 'bg-orange-50 text-orange-700')}
                  onClick={() => void updateTemplate('packages', 'carousel')}
                >
                  <span>Карусель</span>
                  {viewMode === 'carousel' && <Check className="w-4 h-4 ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className={cn(viewMode === 'list' && 'bg-orange-50 text-orange-700')}
                  onClick={() => void updateTemplate('packages', 'list')}
                >
                  <span>Список</span>
                  {viewMode === 'list' && <Check className="w-4 h-4 ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-2 text-xs text-slate-500">Настройка сохраняется для всех посетителей.</div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        </div>

        {/* Пакеты */}
        {viewMode === 'grid' ? (
          <div className="p-2">
            <div className={cn('grid gap-2', tiers.length <= 2 ? 'md:grid-cols-2' : 'md:grid-cols-3')}>
              {tiers.map((tier, idx) => (
                <TierCard key={idx} tier={tier} variant="card" />
              ))}
            </div>
          </div>
        ) : viewMode === 'carousel' ? (
          <div className="p-2">
            <div className="md:hidden text-center text-xs text-slate-400 mb-2">← Свайп для сравнения →</div>
            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto pb-4 px-2 scrollbar-hide cursor-grab active:cursor-grabbing"
              onMouseDown={onMouseDown}
              onMouseLeave={onMouseLeave}
              onMouseUp={onMouseUp}
              onMouseMove={onMouseMove}
            >
              {tiers.map((tier, idx) => (
                <div key={idx} className="flex-shrink-0 w-[85%] sm:w-[300px] md:w-[310px] select-none snap-center">
                  <TierCard tier={tier} variant="card" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-2">
            <div className="bg-slate-50/60 rounded-[28px] border border-slate-100 p-2 sm:p-3">
              <Accordion type="single" collapsible className="w-full">
                {tiers.map((tier, idx) => (
                  <AccordionItem key={idx} value={`tier-${idx}`} className="border-b border-slate-200/60 last:border-b-0">
                    <AccordionTrigger className="px-3 py-3 hover:no-underline">
                      <div className="flex items-center justify-between gap-3 w-full">
                        <div className="min-w-0">
                          <div className="text-sm sm:text-base font-bold text-slate-900 break-words leading-snug">
                            {tier.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            от {tier.price.toLocaleString('ru')} ₽{tier.duration ? ` · ${tier.duration} мин` : ''}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-4">
                      <TierCard tier={tier} variant="compact" />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
