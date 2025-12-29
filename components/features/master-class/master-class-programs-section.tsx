'use client'

import { useState, useEffect } from 'react'
import { Palette, Loader2, Clock, Users } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store/cart-store'
import { toast } from 'sonner'

interface MasterClassProgramsSectionProps {
  profileId: string
}

interface MasterClassProgram {
  id: string
  name: string
  description: string | null
  photo: string | null // Changed from photos: string[]
  duration_minutes: number | null // Changed from duration
  age_min: number | null
  age_max: number | null
  price: number | null
  active: boolean
  created_at: string
  profile_id: string
}

export function MasterClassProgramsSection({ profileId }: MasterClassProgramsSectionProps) {
  const [programs, setPrograms] = useState<MasterClassProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const { addItem, items } = useCartStore()

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch(`/api/master-class-programs?profile_id=${profileId}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const result = await response.json()
        setPrograms(result.programs || [])
      } catch (error) {
        console.error('[MasterClass] Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrograms()
  }, [profileId])

  const handleAddToCart = async (programId: string, programName: string) => {
    setAddingToCart(programId)
    try {
      await addItem(programId, profileId, 1, `Мастер-класс: ${programName}`)
      toast.success('Добавлено в заявку!')
    } catch (error) {
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

  if (programs.length === 0) return null

  return (
    <div className="bg-white rounded-[32px] p-1 shadow-sm border border-slate-100">
      <div className="px-6 py-6 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Виды мастер-классов</h2>
        <p className="text-sm text-slate-500 mt-1">Выберите подходящий мастер-класс</p>
      </div>

      <div className="p-2 space-y-2">
        {programs.map((program) => {
          const inCart = isInCart(program.id)
          const isAdding = addingToCart === program.id

          return (
            <div key={program.id} className="rounded-[28px] bg-slate-50/50 border border-slate-100 overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex gap-4 sm:gap-6">
                  {program.photo ? (
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-[24px] overflow-hidden bg-slate-100 shrink-0">
                      <Image src={program.photo} alt={program.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[24px] bg-slate-100 flex items-center justify-center shrink-0">
                      <Palette className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{program.name}</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {program.duration_minutes && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5" />
                          {program.duration_minutes} мин
                        </span>
                      )}
                      {program.age_min && program.age_max && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700">
                          <Users className="w-3.5 h-3.5" />
                          {program.age_min}-{program.age_max} лет
                        </span>
                      )}
                      {program.price && (
                        <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold">
                          {new Intl.NumberFormat('ru-RU').format(program.price)} ₽
                        </span>
                      )}
                    </div>

                    {program.description && (
                      <p className="text-sm text-slate-600 line-clamp-2 mb-4">{program.description}</p>
                    )}

                    <Button
                      onClick={() => handleAddToCart(program.id, program.name)}
                      disabled={isAdding || inCart}
                      className={`h-11 px-6 rounded-full font-semibold ${
                        inCart ? 'bg-slate-100 text-slate-600' : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }`}
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Добавление...
                        </>
                      ) : inCart ? 'В заявке' : 'Заказать'}
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

