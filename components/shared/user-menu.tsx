'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  User, Settings, LogOut, Loader2, LayoutDashboard, 
  FileText, Shield, Heart, MessageSquare, BarChart3, Building2, Bell, Eye, ChevronRight, ClipboardList, Home, Kanban
} from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function UserMenu() {
  const { 
    user, 
    profile, 
    isLoading, 
    isAuthenticated, 
    effectiveRole,
    viewAsRole,
    isClient,
    isProvider,
    isAdmin,
    isRealAdmin,
    isViewingAs,
    setViewAsRole,
  } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const handleSignOut = async () => {
    console.log('[UserMenu] 🚪 Sign out clicked')
    // Очищаем localStorage перед выходом
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase.auth.token')
      // Удаляем все supabase ключи
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key)
        }
      })
    }
    // Редирект на серверный signout (он сам сделает redirect на /login)
    window.location.href = '/api/auth/signout'
  }

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'admin': return { text: 'Администратор', color: 'text-red-600' }
      case 'provider': return { text: 'Исполнитель', color: 'text-orange-600' }
      default: return { text: 'Клиент', color: 'text-blue-600' }
    }
  }

  // Показываем спиннер только пока идёт начальная загрузка auth
  // Если профиль не загрузился — используем fallback из user
  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Гость
  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full">
          <Link href="/login">Вход</Link>
        </Button>
        <Button size="sm" asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-full">
          <Link href="/register">Регистрация</Link>
        </Button>
      </div>
    )
  }

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Пользователь'
  const userEmail = user?.email || ''
  const roleLabel = getRoleLabel(effectiveRole)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="outline-none group flex items-center gap-3 pl-3 pr-1 py-1 rounded-full hover:bg-gray-100 transition-all">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-gray-900 leading-tight">
              {userName}
            </span>
            <span className={`text-xs ${roleLabel.color}`}>
              {isViewingAs ? `Как ${roleLabel.text.toLowerCase()}` : roleLabel.text}
            </span>
          </div>
          <div className={`relative w-10 h-10 rounded-full overflow-hidden ring-2 transition-all shrink-0 ${
            isViewingAs ? 'ring-orange-400' : 'ring-gray-200 group-hover:ring-gray-300'
          }`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-500" />
              </div>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        side="bottom"
        className="w-80 p-0"
      >
        {/* Header — имя, email и кнопка настроек */}
        <div className="px-5 py-4 flex items-start justify-between gap-3">
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[17px] font-bold text-gray-900 truncate">{userName}</span>
            <span className="text-sm text-gray-500 truncate">{userEmail}</span>
          </div>
          <Link 
            href="/settings"
            className="shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Настройки"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>

        {/* ПЕРЕКЛЮЧАТЕЛЬ РЕЖИМА ПРОСМОТРА (только для реальных админов) */}
        {(isRealAdmin || profile?.role === 'admin') && (
          <div className="px-5 py-3 bg-orange-50 border-y border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Режим просмотра</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewAsRole(null)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-full transition-all ${
                  viewAsRole === null || viewAsRole === 'admin'
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Админ
              </button>
              <button
                onClick={() => setViewAsRole('provider')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-full transition-all ${
                  viewAsRole === 'provider'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Исполнитель
              </button>
              <button
                onClick={() => setViewAsRole('client')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-full transition-all ${
                  viewAsRole === 'client'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                Клиент
              </button>
            </div>
          </div>
        )}

        {/* Меню — стиль Яндекса */}
        <div className="py-2">{/* Здесь будут пункты меню */}
          {/* КЛИЕНТ */}
          {isClient && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/orders" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span>Мои заказы</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/my-requests" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-5 h-5 text-gray-400" />
                    <span>Мои объявления</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/messages" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    <span>Сообщения</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/favorites" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-gray-400" />
                    <span>Избранное</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/notifications" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <span>Уведомления</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {/* ИСПОЛНИТЕЛЬ */}
          {isProvider && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/crm" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Kanban className="w-5 h-5 text-orange-500" />
                    <span>CRM</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/profiles" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <span>Мои профили</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/orders" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span>Заказы</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/my-requests" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-5 h-5 text-gray-400" />
                    <span>Мои объявления</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/messages" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    <span>Сообщения</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/favorites" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-gray-400" />
                    <span>Избранное</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/notifications" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <span>Уведомления</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="my-2" />
              
              <DropdownMenuItem asChild>
                <Link href="/analytics" className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                    <span>Статистика</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
            </>
          )}

          {/* АДМИН */}
          {isAdmin && (
            <>
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center justify-between bg-red-50 hover:bg-red-100" prefetch={true}>
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-red-700">Админ-панель</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuItem asChild>
                <Link href="/crm" className="flex items-center justify-between" prefetch={true}>
                  <div className="flex items-center gap-3">
                    <Kanban className="w-5 h-5 text-orange-500" />
                    <span>CRM</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/profiles" className="flex items-center justify-between" prefetch={true}>
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <span>Мои профили</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/orders" className="flex items-center justify-between" prefetch={true}>
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span>Заказы</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/my-requests" className="flex items-center justify-between" prefetch={true}>
                  <div className="flex items-center gap-3">
                    <ClipboardList className="w-5 h-5 text-gray-400" />
                    <span>Мои объявления</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/messages" className="flex items-center justify-between" prefetch={true}>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    <span>Сообщения</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/favorites" className="flex items-center justify-between" prefetch={true}>
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-gray-400" />
                    <span>Избранное</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link href="/notifications" className="flex items-center justify-between" prefetch={true}>
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <span>Уведомления</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="my-2" />
              
              <DropdownMenuItem asChild>
                <Link href="/analytics" className="flex items-center justify-between" prefetch={true}>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                    <span>Статистика</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </div>

        {/* Выход */}
        <div className="py-2 border-t border-gray-100">
          <DropdownMenuItem 
            onClick={handleSignOut}
            className="flex items-center gap-3 text-gray-500 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span>Выйти</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
