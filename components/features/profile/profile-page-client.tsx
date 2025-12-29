'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileSidebarLeft, type Section } from '@/components/features/profile/lavka-style/profile-sidebar-left'
import { MobileProfileNav } from '@/components/features/profile/mobile-profile-nav'
import { FloatingCartButton } from '@/components/features/profile/floating-cart-button'
import { toast } from 'sonner'
import { useViewModeStore } from '@/lib/store/view-mode-store'

interface ProfilePageClientProps {
  initialSections: Section[]
  /** Владелец профиля */
  isOwner: boolean
  profileId: string
  profileSlug?: string
  /** Явное право на редактирование (админ/суперпользователь) */
  canEditOverride?: boolean
  /** Рендерить только desktop sidebar (для aside) или mobile nav (для main) */
  variant?: 'desktop' | 'mobile' | 'floating-cart'
}

export function ProfilePageClient({
  initialSections,
  isOwner,
  profileId,
  profileSlug,
  canEditOverride,
  variant = 'desktop'
}: ProfilePageClientProps) {
  const [sections, setSections] = useState(initialSections)
  const router = useRouter()

  // Дублируем isAdmin из стора как fallback (иногда сервер не знает роль из-за cookies/кэша)
  const isAdminFromStore = useViewModeStore((state) => state.isAdmin)

  const canEdit = Boolean(isOwner || canEditOverride || isAdminFromStore)

  // Если initialSections поменялись (после refresh) — синхронизируем
  useEffect(() => {
    setSections(initialSections)
  }, [initialSections])

  const handleSectionsReorder = useCallback(async (newSections: Section[]) => {
    setSections(newSections)

    try {
      // Дедупим ids на случай редких глитчей DnD (иначе server-side порядок может считаться некорректно)
      const sectionIds: string[] = []
      for (const s of newSections) {
        if (!sectionIds.includes(s.id)) sectionIds.push(s.id)
      }

      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_order: sectionIds }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update section order')
      }

      toast.success('Порядок блоков обновлён')

      // Обновляем страницу чтобы применить новый порядок блоков
      setTimeout(() => {
        router.refresh()
      }, 500)
    } catch (err: any) {
      console.error('[ProfilePageClient] Error saving section order:', err)
      toast.error('Не удалось сохранить порядок')
    }
  }, [profileId, router])

  // Mobile navigation
  if (variant === 'mobile') {
    return <MobileProfileNav sections={sections} />
  }

  // Floating cart button for mobile
  if (variant === 'floating-cart') {
    return <FloatingCartButton />
  }

  // Desktop sidebar (default)
  return (
    <ProfileSidebarLeft
      sections={sections}
      isOwner={canEdit}
      profileSlug={profileSlug}
      onSectionsReorder={canEdit ? handleSectionsReorder : undefined}
    />
  )
}
