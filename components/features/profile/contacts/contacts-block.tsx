'use client'

import { Check, Settings } from 'lucide-react'

import { cn } from '@/lib/utils'
import { ProfileMap } from '@/components/features/profile/profile-map'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/contexts/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ContactsTemplateId, SectionTemplates } from '@/lib/types/templates'
import { useProfileTemplates } from '@/hooks/use-profile-templates'
import { CONTACTS_SECTION_TEMPLATES } from '@/lib/constants/template-configs'

type SocialLinks = Record<string, string | null | undefined>

export interface ContactsBlockLocation {
  id?: string
  city?: string | null
  address?: string | null
  name?: string | null
  phone?: string | null
  email?: string | null
  yandex_url?: string | null
  geo_location?: {
    type: string
    coordinates: [number, number]
  } | null
}

export function ContactsBlock({
  profileId,
  initialTemplates,
  isOwner,
  title = 'Как нас найти',
  profileName,
  locations,
  phone,
  email,
  website,
  socialLinks,
  hideMap,
  hideBranches,
  workAreas,
  variant,
}: {
  profileId: string
  initialTemplates?: SectionTemplates
  isOwner?: boolean
  title?: string
  profileName?: string
  locations: ContactsBlockLocation[]
  phone?: string | null
  email?: string | null
  website?: string | null
  socialLinks?: SocialLinks | null
  variant?: TemplateVariant
  /** Для категорий без адресов (например, аниматор) */
  hideMap?: boolean
  /** Скрыть блок филиалов/адресов */
  hideBranches?: boolean
  /** География работы (районы/города) */
  workAreas?: string[]
}) {
  const { isClient } = useAuth()
  const showOwnerControls = Boolean(isOwner) && !isClient
  const { getTemplate, updateTemplate, isUpdating, variant: currentVariant } = useProfileTemplates({
    profileId,
    initialTemplates,
    variant,
  })

  const tmplRaw = getTemplate('contacts')
  const viewMode: ContactsTemplateId =
    tmplRaw === 'standard' || tmplRaw === 'map-first' || tmplRaw === 'split'
      ? (tmplRaw as ContactsTemplateId)
      : 'standard'

  const branches = (locations || []).filter((l) => l && (l.address || l.city || l.name))

  const commonPhone = phone || branches.find((b) => b.phone)?.phone || null
  const commonEmail = email || branches.find((b) => b.email)?.email || null

  const socials: Array<{ key: string; value: string }> = Object.entries(socialLinks || {})
    .filter(([, v]) => typeof v === 'string' && v.trim().length > 0)
    .map(([k, v]) => ({ key: k, value: String(v) }))

  const Info = () => (
    <div className="bg-slate-50/50 rounded-[24px] border border-slate-100 p-3 sm:p-4">
      <div className="space-y-3">
        <div>
          <div className="rounded-[18px] bg-white border border-slate-200 overflow-hidden">
            {commonPhone && (
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="text-sm text-slate-500">Телефон</div>
                <a
                  href={`tel:${commonPhone}`}
                  className="text-sm font-semibold text-slate-900 hover:text-orange-700 break-words text-right"
                >
                  {commonPhone}
                </a>
              </div>
            )}
            {commonPhone && (commonEmail || website) && <Separator />}

            {commonEmail && (
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="text-sm text-slate-500">Почта</div>
                <a
                  href={`mailto:${commonEmail}`}
                  className="text-sm font-semibold text-slate-900 hover:text-orange-700 break-words text-right"
                >
                  {commonEmail}
                </a>
              </div>
            )}
            {commonEmail && website && <Separator />}

            {website && (
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="text-sm text-slate-500">Сайт</div>
                <a
                  href={website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-slate-900 hover:text-orange-700 break-words text-right"
                >
                  {website}
                </a>
              </div>
            )}

            {!commonPhone && !commonEmail && !website && (
              <div className="px-4 py-3 text-sm text-slate-500">Контакты не указаны</div>
            )}
          </div>
        </div>

        {socials.length > 0 && (
          <div>
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Соцсети</div>
              <div className="text-xs text-slate-400">{socials.length}</div>
            </div>
            <Separator className="my-2" />
            <div className="flex flex-wrap gap-1.5">
              {socials.map((s) => (
                <a
                  key={s.key}
                  href={s.value}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-white border border-slate-200 px-2.5 py-1 text-sm font-semibold text-slate-700 hover:border-orange-200 hover:text-orange-700 transition"
                >
                  {s.key}
                </a>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(workAreas) && workAreas.length > 0 && (
          <div>
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">География работы</div>
              <div className="text-xs text-slate-400">{workAreas.length}</div>
            </div>
            <Separator className="my-2" />
            <div className="flex flex-wrap gap-1.5">
              {workAreas.map((a, idx) => (
                <span
                  key={`${a}-${idx}`}
                  className="inline-flex items-center rounded-full bg-white border border-slate-200 px-2.5 py-1 text-sm font-semibold text-slate-700"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {!hideBranches && (
          <div>
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Филиалы</div>
              <div className="text-xs text-slate-400">{branches.length}</div>
            </div>
            <Separator className="my-2" />
            {branches.length > 0 ? (
              <div className="rounded-[18px] bg-white border border-slate-200 overflow-hidden divide-y divide-slate-200/70">
                {branches.map((b, idx) => (
                  <div key={b.id || idx} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 break-words leading-snug">
                          {b.name || [b.city, b.address].filter(Boolean).join(', ') || 'Филиал'}
                        </div>
                        <div className="text-sm text-slate-600 mt-1 break-words">
                          {[b.city, b.address].filter(Boolean).join(', ')}
                        </div>
                      </div>
                      {b.phone && (
                        <a
                          href={`tel:${b.phone}`}
                          className="shrink-0 text-sm font-semibold text-slate-900 hover:text-orange-700 text-right"
                        >
                          {b.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[18px] bg-white border border-slate-200 px-4 py-4 text-sm text-slate-500">
                Адреса не указаны
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const Map = () => (
    <div className="rounded-[24px] overflow-hidden border border-slate-100 bg-white">
      {locations.length > 0 ? (
        <div className="h-[260px] sm:h-[300px] md:h-[340px]">
          <ProfileMap locations={locations as any} profileName={profileName || title} />
        </div>
      ) : (
        <div className="p-8 bg-slate-50 text-center text-slate-500">Адреса не указаны</div>
      )}
    </div>
  )

  return (
    <div className="bg-white rounded-[32px] p-1 shadow-sm border border-slate-100">
      <div className="px-6 py-6 pb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">{title}</h2>
        </div>

        {showOwnerControls && !hideMap && (
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
              {CONTACTS_SECTION_TEMPLATES.templates.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    void updateTemplate('contacts', template.id as ContactsTemplateId)
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

      {hideMap ? (
        <div className="p-2">
          <Info />
        </div>
      ) : viewMode === 'map-first' ? (
        <div className="p-2 space-y-2">
          <Map />
          <Info />
        </div>
      ) : viewMode === 'split' ? (
        <div className="p-2 grid grid-cols-1 lg:grid-cols-2 gap-2">
          <Info />
          <Map />
        </div>
      ) : (
        <div className="p-2 space-y-2">
          <Info />
          <Map />
        </div>
      )}
    </div>
  )
}






