'use client'

import { useState, useEffect } from 'react'
import { Briefcase, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface AgencyCasesSectionProps {
  profileId: string
}

interface AgencyCase {
  id: string
  title: string
  description: string | null
  photos: string[]
  event_type: string | null
  guest_count: number | null
  budget_tier: string | null
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: 'День рождения',
  wedding: 'Свадьба',
  corporate: 'Корпоратив',
  graduation: 'Выпускной',
  anniversary: 'Юбилей',
  kids_party: 'Детский праздник',
  other: 'Другое'
}

const BUDGET_TIER_LABELS: Record<string, string> = {
  budget: 'Эконом',
  standard: 'Стандарт',
  premium: 'Премиум',
  luxury: 'Люкс'
}

export function AgencyCasesSection({ profileId }: AgencyCasesSectionProps) {
  const [cases, setCases] = useState<AgencyCase[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch(`/api/agency-cases?profile_id=${profileId}`)
        if (response.ok) {
          const data = await response.json()
          setCases(data)
        }
      } catch (error) {
        console.error('[AgencyCases] Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCases()
  }, [profileId])

  if (isLoading) {
    return (
      <div className="bg-white rounded-[32px] p-6 shadow-sm flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (cases.length === 0) return null

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-orange-500" />
          Кейсы
        </h2>
        <p className="text-sm text-slate-500 mt-1">Наши работы</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cases.map((caseItem) => (
          <div key={caseItem.id} className="rounded-[28px] bg-slate-50/50 border border-slate-100 overflow-hidden">
            {caseItem.photos?.[0] && (
              <div className="relative w-full aspect-[4/3] bg-slate-200">
                <Image src={caseItem.photos[0]} alt={caseItem.title} fill className="object-cover" />
              </div>
            )}

            <div className="p-4">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{caseItem.title}</h3>

              <div className="flex flex-wrap gap-2 mb-3">
                {caseItem.event_type && (
                  <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-semibold">
                    {EVENT_TYPE_LABELS[caseItem.event_type] || caseItem.event_type}
                  </span>
                )}
                {caseItem.budget_tier && (
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                    {BUDGET_TIER_LABELS[caseItem.budget_tier] || caseItem.budget_tier}
                  </span>
                )}
                {caseItem.guest_count && (
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                    {caseItem.guest_count} гостей
                  </span>
                )}
              </div>

              {caseItem.description && (
                <p className="text-sm text-slate-600 line-clamp-3">{caseItem.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}





