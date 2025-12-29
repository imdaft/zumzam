'use client'

import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useViewModeStore } from '@/lib/store/view-mode-store'
import { useAuth } from '@/lib/contexts/auth-context'

interface ProfileSettingsButtonProps {
  profileSlug: string
  profileUserId: string
}

export function ProfileSettingsButton({ profileSlug, profileUserId }: ProfileSettingsButtonProps) {
  const [isOwner, setIsOwner] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  
  // Правильное имя поля: mode, а не viewMode!
  const mode = useViewModeStore((state) => state.mode)
  const isAdmin = useViewModeStore((state) => state.isAdmin)

  useEffect(() => {
    const checkOwnership = async () => {
      try {
        if (!user) {
          setIsOwner(false)
        } else {
          setIsOwner(user.id === profileUserId)
        }
      } catch (error) {
        console.error('Error checking ownership:', error)
        setIsOwner(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkOwnership()
  }, [profileUserId, user])

  // Обновляем canEdit при изменении mode, isAdmin или isOwner
  useEffect(() => {
    // Кнопка видна только если:
    // 1. Пользователь - владелец профиля
    // 2. И либо он не админ, либо находится в режиме "service"
    const shouldEdit = isOwner && (!isAdmin || mode === 'service')
    console.log('[ProfileSettingsButton] Обновление canEdit:', { isOwner, isAdmin, mode, shouldEdit })
    setCanEdit(shouldEdit)
  }, [isOwner, isAdmin, mode])

  const handleClick = () => {
    router.push(`/profiles/${profileSlug}/edit`)
  }

  // Не показываем кнопку, если идёт загрузка или нельзя редактировать
  if (isLoading || !canEdit) {
    return null
  }

  return (
    <button
      onClick={handleClick}
      className="absolute top-4 right-4 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 z-30"
      aria-label="Настройки профиля"
      title="Настройки профиля"
    >
      <Settings className="w-5 h-5" />
    </button>
  )
}



