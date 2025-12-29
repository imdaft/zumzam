/**
 * Админ-панель — Главная
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { toast } from 'sonner'
import Link from 'next/link'
import { deduplicatedFetch } from '@/lib/utils/request-deduplication'

interface Stats {
  users: { total: number; clients: number; providers: number; admins: number }
  profiles: { total: number; verified: number; pending: number }
  orders: { total: number; pending: number; completed: number }
  reviews: { total: number; pending: number }
}

export default function AdminPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    users: { total: 0, clients: 0, providers: 0, admins: 1 },
    profiles: { total: 0, verified: 0, pending: 0 },
    orders: { total: 0, pending: 0, completed: 0 },
    reviews: { total: 0, pending: 0 },
  })

  useEffect(() => {
    checkAdminAccess()
  }, [user, authLoading])

  const checkAdminAccess = async () => {
    try {
      if (authLoading) return
      if (!user) {
        router.push('/login?redirect=/admin')
        return
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      try {
        const response = await deduplicatedFetch('/api/user', {
          signal: controller.signal,
          cache: 'no-store'
        })
        clearTimeout(timeoutId)

        if (!response.ok) throw new Error('Failed to check access')
        const data = await response.json()
        
        if (data.role !== 'admin') {
          toast.error('Доступ запрещён')
          router.push('/')
          return
        }

        setIsAdmin(true)
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          toast.error('Превышено время ожидания')
        }
        throw fetchError
      }
    } catch (error) {
      console.error('Admin access check error:', error)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="p-6 text-gray-500 flex items-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Проверка доступа...
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Обзор</h1>

      {/* Статистика */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white border rounded-lg p-3 sm:p-4">
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.users.total}</div>
          <div className="text-xs sm:text-sm text-gray-500">Пользователей</div>
        </div>
        <div className="bg-white border rounded-lg p-3 sm:p-4">
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.profiles.total}</div>
          <div className="text-xs sm:text-sm text-gray-500">Профилей</div>
        </div>
        <div className="bg-white border rounded-lg p-3 sm:p-4">
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.orders.total}</div>
          <div className="text-xs sm:text-sm text-gray-500">Заказов</div>
        </div>
        <div className="bg-white border rounded-lg p-3 sm:p-4">
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.reviews.total}</div>
          <div className="text-xs sm:text-sm text-gray-500">Отзывов</div>
        </div>
      </div>

      {/* Детали */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Пользователи</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b"><td className="py-2 text-gray-600">Клиенты</td><td className="py-2 text-right font-medium">{stats.users.clients}</td></tr>
              <tr className="border-b"><td className="py-2 text-gray-600">Исполнители</td><td className="py-2 text-right font-medium">{stats.users.providers}</td></tr>
              <tr><td className="py-2 text-gray-600">Админы</td><td className="py-2 text-right font-medium text-red-600">{stats.users.admins}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Профили</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b"><td className="py-2 text-gray-600">Проверенные</td><td className="py-2 text-right font-medium text-green-600">{stats.profiles.verified}</td></tr>
              <tr><td className="py-2 text-gray-600">На модерации</td><td className="py-2 text-right font-medium text-orange-600">{stats.profiles.pending}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Навигация */}
      <div className="mb-6">
        <h2 className="font-semibold text-gray-700 mb-3">Разделы</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link href="/admin/users" className="bg-white border rounded-lg px-3 sm:px-4 py-3 hover:bg-gray-50 transition-colors text-sm">
            Пользователи →
          </Link>
          <Link href="/admin/profiles" className="bg-white border rounded-lg px-3 sm:px-4 py-3 hover:bg-gray-50 transition-colors text-sm">
            Профили →
          </Link>
          <Link href="/admin/reviews" className="bg-white border rounded-lg px-3 sm:px-4 py-3 hover:bg-gray-50 transition-colors text-sm">
            Отзывы →
          </Link>
          <Link href="/admin/analytics" className="bg-white border rounded-lg px-3 sm:px-4 py-3 hover:bg-gray-50 transition-colors text-sm">
            Аналитика →
          </Link>
          <Link href="/admin/ai-settings" className="bg-white border rounded-lg px-3 sm:px-4 py-3 hover:bg-gray-50 transition-colors text-sm">
            Настройки AI →
          </Link>
          <Link href="/admin/tests" className="bg-white border rounded-lg px-3 sm:px-4 py-3 hover:bg-gray-50 transition-colors text-sm">
            Тесты →
          </Link>
        </div>
      </div>

      {/* Инфо */}
      <div className="text-xs sm:text-sm text-gray-400">
        Роль: <code className="bg-gray-100 px-2 py-1 rounded text-xs">admin</code> · 
        URL: <code className="bg-gray-100 px-2 py-1 rounded text-xs">/admin</code>
      </div>
    </div>
  )
}
