'use client'

import { useState, useEffect } from 'react'
import { Users, Loader2, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface AgencyPartnersSectionProps {
  profileId: string
}

interface Partner {
  id: string
  partner_profile_id: string | null
  custom_name: string | null
  custom_specialization: string | null
  custom_photo: string | null
  custom_description: string | null
  partner_profile?: {
    id: string
    name: string
    category: string
    avatar_url: string | null
    rating: number | null
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  animator: 'Аниматор',
  venue: 'Площадка',
  show: 'Шоу-программа',
  photographer: 'Фотограф',
  quest: 'Квест',
  master_class: 'Мастер-класс'
}

export function AgencyPartnersSection({ profileId }: AgencyPartnersSectionProps) {
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await fetch(`/api/agency-partners?profile_id=${profileId}`)
        if (response.ok) {
          const data = await response.json()
          setPartners(data)
        }
      } catch (error) {
        console.error('[AgencyPartners] Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPartners()
  }, [profileId])

  if (isLoading) {
    return (
      <div className="bg-white rounded-[32px] p-6 shadow-sm flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (partners.length === 0) return null

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-orange-500" />
          Наши специалисты
        </h2>
        <p className="text-sm text-slate-500 mt-1">Команда профессионалов</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {partners.map((partner) => {
          const isZumZamProfile = !!partner.partner_profile
          const name = isZumZamProfile ? partner.partner_profile!.name : partner.custom_name
          const photo = isZumZamProfile ? partner.partner_profile!.avatar_url : partner.custom_photo
          const specialization = isZumZamProfile 
            ? CATEGORY_LABELS[partner.partner_profile!.category] || partner.partner_profile!.category
            : partner.custom_specialization

          return (
            <div key={partner.id} className="rounded-[24px] bg-slate-50 p-4 border border-slate-100">
              <div className="flex items-start gap-3">
                {photo ? (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-200 shrink-0">
                    <Image src={photo} alt={name || ''} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {isZumZamProfile ? (
                    <Link 
                      href={`/profiles/${partner.partner_profile!.id}`}
                      className="text-base font-bold text-slate-900 hover:text-orange-600 transition-colors"
                    >
                      {name}
                    </Link>
                  ) : (
                    <h3 className="text-base font-bold text-slate-900">{name}</h3>
                  )}

                  {specialization && (
                    <p className="text-sm text-slate-600 mt-0.5">{specialization}</p>
                  )}

                  {isZumZamProfile && partner.partner_profile!.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-slate-700">
                        {partner.partner_profile!.rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {partner.custom_description && (
                <p className="text-sm text-slate-600 mt-3 line-clamp-2">{partner.custom_description}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}





