'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, Clock, Users, Music } from 'lucide-react'
import { SHOW_GENRES, SHOW_AGE_RANGES, SHOW_GENRE_ICONS, type ShowGenre, type ShowAgeRange } from '@/lib/constants/show-genres'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'

interface ShowProgramsSectionProps {
  profileId: string
  profileName?: string
}

interface ShowProgram {
  id: string
  name: string
  description: string | null
  photos: string[]
  video_url: string | null
  genres: string[]
  duration: number | null
  performers_count: number | null
  age_ranges: string[]
  requires_sound: boolean
  stage_requirements: string | null
  requires_light: boolean
}

export function ShowProgramsSection({ profileId, profileName }: ShowProgramsSectionProps) {
  const [programs, setPrograms] = useState<ShowProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const { addItem, items } = useCartStore()

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch(`/api/show-programs?profile_id=${profileId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch programs')
        }

        const result = await response.json()
        setPrograms(result.programs || [])
      } catch (error) {
        console.error('[ShowPrograms] Error fetching:', error)
        setLoadError('Не удалось загрузить программы')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrograms()
  }, [profileId])

  const handleAddToCart = async (programId: string, programName: string) => {
    setAddingToCart(programId)
    try {
      await addItem(programId, profileId, 1, `Шоу: ${programName}`)
      toast.success('Добавлено в заявку!')
    } catch (error) {
      console.error('[ShowPrograms] Cart error:', error)
      toast.error('Не удалось добавить в заявку')
    } finally {
      setAddingToCart(null)
    }
  }

  const isInCart = (programId: string) => items.some(item => item.service_id === programId)

  if (isLoading) {
    return (
      <div className="bg-white rounded-[32px] p-6 shadow-sm flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (loadError || programs.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-[32px] p-1 shadow-sm border border-slate-100">
      <div className="px-6 py-6 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">Номера и программы</h2>
        <p className="text-sm text-slate-500 mt-1">
          Выберите подходящую программу для вашего мероприятия
        </p>
      </div>

      <div className="p-2 space-y-2">
        {programs.map((program) => {
          const Icon = program.genres?.[0] ? SHOW_GENRE_ICONS[program.genres[0] as ShowGenre] : Sparkles
          const inCart = isInCart(program.id)
          const isAdding = addingToCart === program.id

          return (
            <div key={program.id} className="rounded-[28px] bg-slate-50/50 border border-slate-100 overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex gap-4 sm:gap-6">
                  {/* Фото */}
                  {program.photos?.[0] ? (
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-[24px] overflow-hidden bg-slate-100 shrink-0">
                      <Image
                        src={program.photos[0]}
                        alt={program.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[24px] bg-slate-100 flex items-center justify-center shrink-0">
                      <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300" />
                    </div>
                  )}

                  {/* Контент */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{program.name}</h3>
                    
                    {/* Метаданные */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {program.duration && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5" />
                          {program.duration} мин
                        </span>
                      )}
                      {program.performers_count && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
                          <Users className="w-3.5 h-3.5" />
                          {program.performers_count}
                        </span>
                      )}
                    </div>

                    {/* Жанры */}
                    {program.genres?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {program.genres.map((genre) => (
                          <span key={genre} className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold">
                            {SHOW_GENRES[genre as ShowGenre] || genre}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Описание */}
                    {program.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                        {program.description}
                      </p>
                    )}

                    {/* Возраст */}
                    {program.age_ranges?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="text-xs text-slate-500">Возраст:</span>
                        {program.age_ranges.map((range) => (
                          <span key={range} className="text-xs font-semibold text-slate-700">
                            {SHOW_AGE_RANGES[range as ShowAgeRange] || range}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Кнопка заказа */}
                    <Button
                      onClick={() => handleAddToCart(program.id, program.name)}
                      disabled={isAdding || inCart}
                      className={`h-11 px-6 rounded-full font-semibold transition-all ${
                        inCart
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }`}
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Добавление...
                        </>
                      ) : inCart ? (
                        'В заявке'
                      ) : (
                        'Заказать'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}





