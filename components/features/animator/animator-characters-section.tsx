'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { Check, Play, Settings, Star, ShoppingBag } from 'lucide-react'
import { AnimatorCharacteristics } from '../profile/animator/animator-characteristics'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/contexts/auth-context'
import type { CharactersTemplateId, SectionTemplates, TemplateVariant } from '@/lib/types/templates'
import { useProfileTemplates } from '@/hooks/use-profile-templates'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { OrderAnimatorDialog } from './order-animator-dialog'
import { Button } from '@/components/ui/button'
import { CHARACTERS_SECTION_TEMPLATES } from '@/lib/constants/template-configs'

interface Character {
  id: string
  name: string
  description: string | null
  photos: string[]
  video_url: string | null
  age_range: string | null
  age_ranges?: string[] | null
  program_types: string[]
  work_format: string | null
}

interface AnimatorCharactersSectionProps {
  profileId: string
  details: any
  initialTemplates?: SectionTemplates
  isOwner?: boolean
  variant?: TemplateVariant
}

const AGE_RANGE_LABELS: Record<string, string> = {
  '3-5': '3-5 лет',
  '5-7': '5-7 лет',
  '7-10': '7-10 лет',
  '10-14': '10-14 лет',
  'universal': 'Любой возраст'
}

const PROGRAM_TYPE_LABELS: Record<string, string> = {
  'interactive': 'Интерактив',
  'show': 'Шоу',
  'quest': 'Квест',
  'master_class': 'Мастер-класс',
  'games': 'Игры'
}

const WORK_FORMAT_LABELS: Record<string, string> = {
  'mobile': 'Выездной',
  'studio': 'В студии',
  'both': 'Выездной и в студии'
}

export function AnimatorCharactersSection({
  profileId,
  details,
  initialTemplates,
  isOwner,
  variant,
}: AnimatorCharactersSectionProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [expandedDesc, setExpandedDesc] = useState<Record<string, boolean>>({})
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false)
  const { isClient } = useAuth()
  const showOwnerControls = Boolean(isOwner) && !isClient

  const handleOrderCharacter = (character: Character) => {
    setSelectedCharacter(character)
    setIsOrderDialogOpen(true)
  }

  const handleCloseOrderDialog = () => {
    setIsOrderDialogOpen(false)
    setSelectedCharacter(null)
  }

  const { getTemplate, updateTemplate, isUpdating, variant: currentVariant } = useProfileTemplates({
    profileId,
    initialTemplates,
    variant,
  })

  const tmplRaw = getTemplate('characters')
  const viewMode: CharactersTemplateId =
    tmplRaw === 'standard' || tmplRaw === 'compact' || tmplRaw === 'large'
      ? (tmplRaw as CharactersTemplateId)
      : 'standard'

  useEffect(() => {
    if (!profileId) {
      setIsLoading(false)
      setLoadError('Профиль не найден')
      return
    }

    let isMounted = true
    const controller = new AbortController()

    const fetchCharacters = async () => {
      try {
        setIsLoading(true)
        setLoadError(null)

        // Таймаут на 10 секунд
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch(`/api/animator-characters?profileId=${profileId}`, {
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!isMounted) return

        if (!response.ok) {
          throw new Error('Не удалось загрузить персонажей')
        }

        const result = await response.json()
        setCharacters(result.characters || [])
      } catch (error: any) {
        if (!isMounted) return
        
        if (error.name === 'AbortError') {
          console.error('[AnimatorCharactersSection] Request timeout')
          setLoadError('Превышено время ожидания. Попробуйте обновить страницу.')
        } else {
          console.error('[AnimatorCharactersSection] Error fetching characters:', error)
          setLoadError('Не удалось загрузить персонажей')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchCharacters()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [profileId]) // eslint-disable-line react-hooks/exhaustive-deps

  const getAgeBadges = (c: Character) => {
    const ages = (c.age_ranges && c.age_ranges.length > 0 ? c.age_ranges : (c.age_range ? [c.age_range] : []))
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i)
    return ages
  }

  const header = (
    <div className="px-6 py-6 pb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">Персонажи и программы</h2>
        <p className="text-sm text-slate-500 mt-1">
          Персонажи, сценарии и особенности программы
        </p>
      </div>

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
            {CHARACTERS_SECTION_TEMPLATES.templates.map((template) => (
              <DropdownMenuItem
                key={template.id}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  void updateTemplate('characters', template.id as CharactersTemplateId)
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
      )}
    </div>
  )

  if (isLoading) {
    return (
      <section id="characters" className="bg-white rounded-[32px] p-1 shadow-sm border border-slate-100">
        {header}
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </section>
    )
  }

  if (loadError) {
    return (
      <section id="characters" className="bg-white rounded-[32px] p-1 shadow-sm border border-slate-100">
        {header}
        <div className="p-6 sm:p-8">
          <div className="bg-red-50 border border-red-200 rounded-[28px] p-4 text-center">
            <p className="text-sm text-red-800 font-medium">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-900 rounded-full text-sm font-semibold transition-colors"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (characters.length === 0) {
    // Показываем общие характеристики, если персонажи не добавлены
    if (details) {
      return (
        <section id="characters" className="bg-white rounded-[32px] p-1 shadow-sm border border-slate-100">
          {header}
          <div className="p-4 sm:p-6 pt-0">
            <AnimatorCharacteristics details={details} hideTitle={true} />
          </div>
        </section>
      )
    }
    return null
  }

  return (
    <section id="characters" className="bg-white rounded-[32px] shadow-sm border border-slate-100">
      {header}

      <div className="p-6 sm:p-8 pt-0 space-y-8">

      {/* Общие характеристики аниматора */}
      {details && (
        <AnimatorCharacteristics details={details} hideTitle={true} />
      )}

      {/* Список персонажей */}
      {viewMode === 'compact' ? (
        <div className="space-y-3">
          <Accordion type="single" collapsible className="w-full">
            {characters.map((c) => {
              const ages = getAgeBadges(c)
              const cover = c.photos?.[0]
              return (
                <AccordionItem key={c.id} value={c.id} className="border-b border-slate-200 last:border-b-0">
                  <AccordionTrigger className="py-4 hover:no-underline text-left hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4 w-full pr-2">
                      <div className="relative w-20 h-20 rounded-[18px] overflow-hidden bg-slate-100 shrink-0">
                        {cover ? (
                          <Image src={cover} alt={c.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Star className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-semibold text-slate-900 mb-1.5">
                          {c.name}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {ages.map((age) => (
                            <span key={age} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                              {AGE_RANGE_LABELS[age] || age}
                            </span>
                          ))}
                          {(c.program_types || []).slice(0, 2).map((t) => (
                            <span key={t} className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                              {PROGRAM_TYPE_LABELS[t] || t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="space-y-5 pt-2">
                      {c.description && (
                        <p className="text-sm text-slate-600 leading-relaxed">{c.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {(c.program_types || []).map((t) => (
                          <span key={t} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-md text-sm font-medium">
                            {PROGRAM_TYPE_LABELS[t] || t}
                          </span>
                        ))}
                        {c.work_format && (
                          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-[18px] text-sm font-medium">
                            {WORK_FORMAT_LABELS[c.work_format] || c.work_format}
                          </span>
                        )}
                      </div>
                      {c.video_url && (
                        <a
                          href={c.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-[18px] text-sm font-medium hover:bg-slate-200 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          Видео
                        </a>
                      )}
                      <Button
                        onClick={() => handleOrderCharacter(c)}
                        className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-medium transition-colors"
                      >
                        Заказать
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>
      ) : viewMode === 'large' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {characters.map((c) => {
            const cover = c.photos?.[0]
            const ages = getAgeBadges(c)
            const isExpanded = Boolean(expandedDesc[c.id])
            const canExpand = Boolean(
              c.description &&
                (c.description.trim().length > 120 || c.description.includes('\n'))
            )
            return (
              <div key={c.id} className="bg-white rounded-[28px] border border-slate-200 overflow-hidden">
                <div className="relative aspect-[16/10] bg-slate-100">
                  {cover ? (
                    <Image src={cover} alt={c.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Star className="w-10 h-10 opacity-30" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{c.name}</h3>
                  
                  {c.description && (
                    <>
                      <p className={cn('text-sm text-slate-600 leading-relaxed', !isExpanded && 'line-clamp-3')}>
                        {c.description}
                      </p>
                      {canExpand && (
                        <button
                          type="button"
                          className="mt-2 text-sm font-medium text-slate-900 hover:text-slate-700 underline"
                          onClick={() =>
                            setExpandedDesc((prev) => ({
                              ...prev,
                              [c.id]: !Boolean(prev[c.id]),
                            }))
                          }
                        >
                          {isExpanded ? 'Свернуть' : 'Показать полностью'}
                        </button>
                      )}
                    </>
                  )}
                  
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {ages.map((age) => (
                      <span key={age} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-[18px] text-sm font-medium">
                        {AGE_RANGE_LABELS[age] || age}
                      </span>
                    ))}
                    {(c.program_types || []).map((t) => (
                      <span key={t} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-md text-sm font-medium">
                        {PROGRAM_TYPE_LABELS[t] || t}
                      </span>
                    ))}
                    {c.work_format && (
                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md text-sm font-medium">
                        {WORK_FORMAT_LABELS[c.work_format] || c.work_format}
                      </span>
                    )}
                  </div>
                  
                  {c.video_url && (
                    <a
                      href={c.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-[18px] text-sm font-medium hover:bg-slate-200 transition-colors mt-4"
                    >
                      <Play className="w-4 h-4" />
                      Видео
                    </a>
                  )}
                  
                  <Button
                    onClick={() => handleOrderCharacter(c)}
                    className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-medium transition-colors mt-5"
                  >
                    Заказать
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-8">
          {characters.map((character, index) => (
            <div key={character.id} className={index > 0 ? 'border-t border-slate-200 pt-8' : ''}>
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Фото персонажа */}
                {character.photos && character.photos.length > 0 && (
                  <div className="w-full lg:w-80 flex-shrink-0">
                    <div className="aspect-square w-full relative rounded-[24px] overflow-hidden bg-slate-100">
                      <Image
                        src={character.photos[0]}
                        alt={character.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    {/* Дополнительные фото */}
                    {character.photos.length > 1 && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {character.photos.slice(1, 4).map((photo, i) => (
                          <div key={i} className="aspect-square relative rounded-[18px] overflow-hidden bg-slate-100">
                            <Image
                              src={photo}
                              alt={`${character.name} ${i + 2}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Информация о персонаже */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-semibold text-slate-900 mb-4">{character.name}</h3>

                  {character.description && (
                    <p className="text-base text-slate-600 leading-relaxed mb-6">
                      {character.description}
                    </p>
                  )}

                  {/* Характеристики программы */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {getAgeBadges(character).map((age) => (
                      <span key={age} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-[18px] text-sm font-medium">
                        {AGE_RANGE_LABELS[age] || age}
                      </span>
                    ))}
                    {character.program_types && character.program_types.map((type) => (
                      <span key={type} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-[18px] text-sm font-medium">
                        {PROGRAM_TYPE_LABELS[type] || type}
                      </span>
                    ))}
                    {character.work_format && (
                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md text-sm font-medium">
                        {WORK_FORMAT_LABELS[character.work_format] || character.work_format}
                      </span>
                    )}
                  </div>

                  {/* Видео и кнопка */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {character.video_url && (
                      <a
                        href={character.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-[18px] text-sm font-medium hover:bg-slate-200 transition-colors"
                      >
                        <Play className="w-4 h-4" />
                        Видео
                      </a>
                    )}
                    
                    <Button
                      onClick={() => handleOrderCharacter(character)}
                      className="h-11 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-medium transition-colors"
                    >
                      Заказать
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Order Dialog */}
      <OrderAnimatorDialog
        character={selectedCharacter}
        profileId={profileId}
        isOpen={isOrderDialogOpen}
        onClose={handleCloseOrderDialog}
      />
    </section>
  )
}

