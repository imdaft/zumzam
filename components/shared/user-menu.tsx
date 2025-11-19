'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Settings, LogOut, Loader2 } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import { Button } from '@/components/ui/button'

/**
 * Компонент меню пользователя в header
 * Показывает кнопки логина/регистрации или меню авторизованного пользователя
 */
export function UserMenu() {
  const { user, profile, isLoading, isAuthenticated } = useUser()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await fetch('/auth/signout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Показываем загрузку
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Пользователь не авторизован - показываем кнопки входа
  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Вход</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/register">Регистрация</Link>
        </Button>
      </div>
    )
  }

  // Пользователь авторизован - показываем меню
  return (
    <div className="flex items-center gap-2">
      {/* Отображаем имя пользователя */}
      <div className="hidden md:flex flex-col items-end">
        <span className="text-sm font-medium">
          {profile?.full_name || user.email?.split('@')[0]}
        </span>
        <span className="text-xs text-muted-foreground capitalize">
          {profile?.role === 'parent' && 'Родитель'}
          {profile?.role === 'animator' && 'Аниматор'}
          {profile?.role === 'studio' && 'Студия'}
          {profile?.role === 'admin' && 'Администратор'}
        </span>
      </div>

      {/* Аватар или иконка */}
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name || 'User'}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <User className="h-5 w-5 text-primary" />
        )}
      </div>

      {/* Кнопки действий */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings" title="Настройки">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          title="Выйти"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

