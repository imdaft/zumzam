'use client'

import Link from 'next/link'
import { User } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'

/**
 * Мобильная аватарка профиля в хедере
 * При клике ведёт на настройки профиля (для авторизованных) или login (для гостей)
 */
export function MobileProfileAvatar() {
  const { user, profile, isAuthenticated } = useAuth()
  
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null

  return (
    <Link
      href={isAuthenticated ? '/settings' : '/login'}
      className="md:hidden p-1"
    >
      {isAuthenticated && avatarUrl ? (
        <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-200 hover:ring-orange-300 transition-all">
          <img src={avatarUrl} alt="Профиль" className="w-full h-full object-cover" />
        </div>
      ) : isAuthenticated ? (
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ring-2 ring-gray-200 hover:ring-orange-300 transition-all">
          <User className="h-4 w-4 text-gray-500" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </Link>
  )
}





















