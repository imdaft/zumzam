'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Check, Play, Settings, Star, ShoppingBag } from 'lucide-react'
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
import { ServiceCard } from '@/components/features/profile/lavka-style/service-card'
import type { SectionTemplates, TurnkeyTemplateId, TemplateVariant } from '@/lib/types/templates'
import { useProfileTemplates } from '@/hooks/use-profile-templates'
import { TURNKEY_SECTION_TEMPLATES } from '@/lib/constants/template-configs'

type TurnkeyViewMode = 'standard' | 'compact' | 'large'

export interface TurnkeyPackageItem {
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

export function TurnkeyPackagesBlock({
  profileId,
  initialTemplates,
  packages,
  title = 'Праздники под ключ',
  description = 'Готовые решения — всё включено',
  isOwner,
  variant,
}: {
  profileId: string
  initialTemplates?: SectionTemplates
  packages: TurnkeyPackageItem[]
  title?: string
  description?: string
  isOwner?: boolean
  variant?: TemplateVariant
}) {
  const { isClient } = useAuth()
  const showOwnerControls = Boolean(isOwner) && !isClient
  const { getTemplate, updateTemplate, isUpdating, variant: currentVariant } = useProfileTemplates({
    profileId,
    initialTemplates,
    variant,
  })

  const tmpl = getTemplate('turnkey')
  const viewMode: TurnkeyViewMode = tmpl === 'compact' || tmpl === 'large' ? (tmpl as TurnkeyViewMode) : 'standard'

  if (!packages || packages.length === 0) return null

  return (
    <div className="bg-white rounded-[32px] p-1 shadow-sm border border-slate-100">
      <div className="px-6 py-6 pb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{title}</h2>
          {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
        </div>

        {showOwnerControls && (
          <div className="flex items-center gap-2 shrink-0">
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
                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 border-b">
                  {currentVariant === 'mobile' ? '📱 Мобильная версия' : '💻 Десктопная версия'}
                </div>
                {TURNKEY_SECTION_TEMPLATES.templates.map((template) => (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      void updateTemplate('turnkey', template.id as TurnkeyTemplateId)
                    }}
                    className={`cursor-pointer ${
                      viewMode === template.id
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

      {viewMode === 'standard' ? (
        <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
          {packages.map((pkg) => (
            <ServiceCard key={pkg.id} {...pkg} image={pkg.image ?? undefined} />
          ))}
        </div>
      ) : viewMode === 'compact' ? (
        <div className="p-2">
          <CompactTurnkeyList packages={packages} />
        </div>
      ) : (
        <div className="p-2">
          <LargeTurnkeyGrid packages={packages} />
        </div>
      )}
    </div>
  )
}

function LargeTurnkeyGrid({ packages }: { packages: TurnkeyPackageItem[] }) {
  const sorted = useMemo(() => {
    return [...packages].sort((a, b) => (a.price || 0) - (b.price || 0))
  }, [packages])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {sorted.map((pkg) => (
        <LargeTurnkeyCard key={pkg.id} pkg={pkg} />
      ))}
    </div>
  )
}

function LargeTurnkeyCard({ pkg }: { pkg: TurnkeyPackageItem }) {
  const [isAdding, setIsAdding] = useState(false)
  const { addItem, items, clearCart } = useCartStore()

  const isInCart = items.some((item) => item.service_id === pkg.id)

  const images = Array.isArray(pkg.image) ? pkg.image : pkg.image ? [pkg.image] : []
  const cover = images[0]

  const handleAdd = async () => {
    if (isInCart) {
      toast.info('Пакет уже в корзине')
      return
    }
    
    if (items.length > 0 && items[0].profile_id !== pkg.profile_id) {
      const confirmed = window.confirm(
        'В корзине уже есть услуги от другого исполнителя. Очистить корзину и добавить этот пакет?'
      )
      if (!confirmed) return
      clearCart()
    }

    setIsAdding(true)
    try {
      await addItem({
        service_id: pkg.id,
        profile_id: pkg.profile_id || '',
        title: pkg.title,
        price: pkg.price,
        duration: pkg.duration,
      })
      toast.success('Добавлено в корзину')
    } catch (error) {
      toast.error('Ошибка добавления в корзину')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="bg-slate-50/50 rounded-[24px] border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
      {cover && (
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
          <Image
            src={cover}
            alt={pkg.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-lg font-bold text-slate-900 mb-2">{pkg.title}</h3>
        
        {pkg.description && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{pkg.description}</p>
        )}

        {pkg.package_includes && pkg.package_includes.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Включено:</div>
            <div className="space-y-1">
              {pkg.package_includes.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-slate-700">{item}</span>
                </div>
              ))}
              {pkg.package_includes.length > 3 && (
                <div className="text-xs text-slate-500 mt-1">
                  +{pkg.package_includes.length - 3} ещё
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200">
          <div>
            <div className="text-2xl font-bold text-slate-900">{pkg.price.toLocaleString('ru')} ₽</div>
            {pkg.duration && (
              <div className="text-xs text-slate-500">{pkg.duration}</div>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={isAdding || isInCart}
            className={cn(
              'gap-2',
              isInCart && 'bg-green-600 hover:bg-green-700'
            )}
          >
            {isAdding ? (
              'Добавление...'
            ) : isInCart ? (
              <>
                <Check className="w-4 h-4" />
                В корзине
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                Выбрать
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CompactTurnkeyList({ packages }: { packages: TurnkeyPackageItem[] }) {
  const sorted = useMemo(() => {
    return [...packages].sort((a, b) => (a.price || 0) - (b.price || 0))
  }, [packages])

  return (
    <Accordion type="single" collapsible className="w-full bg-slate-50/60 rounded-[24px] border border-slate-100 p-2">
      {sorted.map((pkg) => (
        <TurnkeyAccordionItem key={pkg.id} pkg={pkg} />
      ))}
    </Accordion>
  )
}

function TurnkeyAccordionItem({ pkg }: { pkg: TurnkeyPackageItem }) {
  const [isAdding, setIsAdding] = useState(false)
  const { addItem, items, clearCart } = useCartStore()

  const isInCart = items.some((item) => item.service_id === pkg.id)

  const handleAdd = async () => {
    if (isInCart) {
      toast.info('Пакет уже в корзине')
      return
    }
    
    if (items.length > 0 && items[0].profile_id !== pkg.profile_id) {
      const confirmed = window.confirm(
        'В корзине уже есть услуги от другого исполнителя. Очистить корзину и добавить этот пакет?'
      )
      if (!confirmed) return
      clearCart()
    }

    setIsAdding(true)
    try {
      await addItem({
        service_id: pkg.id,
        profile_id: pkg.profile_id || '',
        title: pkg.title,
        price: pkg.price,
        duration: pkg.duration,
      })
      toast.success('Добавлено в корзину')
    } catch (error) {
      toast.error('Ошибка добавления в корзину')
    } finally {
      setIsAdding(false)
    }
  }

  const images = Array.isArray(pkg.image) ? pkg.image : pkg.image ? [pkg.image] : []
  const cover = images[0]

  const includesCount = pkg.package_includes?.length || 0

  return (
    <AccordionItem value={pkg.id} className="border-b border-slate-200/60 last:border-0">
      <AccordionTrigger className="px-3 py-3 hover:no-underline">
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 min-w-0">
            {cover && (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                <Image src={cover} alt={pkg.title} fill className="object-cover" sizes="48px" />
              </div>
            )}
            <div className="min-w-0 text-left">
              <div className="font-semibold text-sm text-slate-900 truncate">{pkg.title}</div>
              {includesCount > 0 && (
                <div className="text-xs text-slate-500">{includesCount} позиций</div>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-bold text-slate-900">{pkg.price.toLocaleString('ru')} ₽</div>
            {pkg.duration && (
              <div className="text-xs text-slate-500">{pkg.duration}</div>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-3">
        <div className="pt-2 space-y-3">
          {pkg.description && (
            <p className="text-sm text-slate-600">{pkg.description}</p>
          )}

          {pkg.package_includes && pkg.package_includes.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Включено:</div>
              <div className="space-y-1.5">
                {pkg.package_includes.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1, 5).map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                  <Image src={src} alt={`${pkg.title} ${idx + 2}`} fill className="object-cover" sizes="(max-width: 768px) 25vw, 10vw" />
                </div>
              ))}
            </div>
          )}

          <Button
            size="sm"
            onClick={handleAdd}
            disabled={isAdding || isInCart}
            className={cn(
              'w-full gap-2',
              isInCart && 'bg-green-600 hover:bg-green-700'
            )}
          >
            {isAdding ? (
              'Добавление...'
            ) : isInCart ? (
              <>
                <Check className="w-4 h-4" />
                В корзине
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                Выбрать пакет
              </>
            )}
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}




