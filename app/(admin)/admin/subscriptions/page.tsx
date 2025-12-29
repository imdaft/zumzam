'use client'

import { useEffect, useState } from 'react'
import { Loader2, Trash2, Bell, Mail, Send, Filter, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Subscription {
  id: string
  user_id: string
  category: string | null
  city: string | null
  budget_min: number | null
  budget_max: number | null
  notification_enabled: boolean
  email_enabled: boolean
  telegram_enabled: boolean
  created_at: string
  users: {
    id: string
    email: string
    full_name: string | null
    phone: string | null
  }
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')

  useEffect(() => {
    fetchSubscriptions()
  }, [page, categoryFilter, cityFilter])

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50'
      })
      if (categoryFilter) params.append('category', categoryFilter)
      if (cityFilter) params.append('city', cityFilter)

      const response = await fetch(`/api/admin/subscriptions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch subscriptions')

      const data = await response.json()
      setSubscriptions(data.subscriptions || [])
      setTotal(data.pagination?.total || 0)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту подписку?')) return

    try {
      const response = await fetch(`/api/admin/subscriptions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: id })
      })

      if (!response.ok) throw new Error('Failed to delete')

      fetchSubscriptions()
    } catch (error) {
      console.error('Error deleting subscription:', error)
      alert('Ошибка при удалении подписки')
    }
  }

  const clearFilters = () => {
    setCategoryFilter('')
    setCityFilter('')
    setPage(1)
  }

  if (isLoading && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="w-full px-2 sm:container sm:mx-auto sm:px-6 py-6 space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Подписки на доску</h1>
          <p className="text-sm text-slate-600 mt-1">
            Всего подписок: <span className="font-semibold">{total}</span>
          </p>
        </div>
      </div>

      {/* Фильтры */}
      <Card className="p-4 rounded-[24px] border-none shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Категория..."
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-[18px] border border-slate-200 text-sm flex-1 min-w-[200px]"
          />
          <input
            type="text"
            placeholder="Город..."
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 rounded-[18px] border border-slate-200 text-sm flex-1 min-w-[200px]"
          />
          {(categoryFilter || cityFilter) && (
            <Button
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Очистить
            </Button>
          )}
        </div>
      </Card>

      {/* Таблица подписок */}
      <Card className="rounded-[24px] border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Пользователь
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Категория
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Город
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Бюджет
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Уведомления
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Создана
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {sub.users.full_name || sub.users.email}
                      </p>
                      <p className="text-xs text-slate-500">{sub.users.email}</p>
                      {sub.users.phone && (
                        <p className="text-xs text-slate-500">{sub.users.phone}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {sub.category ? (
                      <Badge variant="outline" className="rounded-full">
                        {sub.category}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">Любая</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-700">
                      {sub.city || <span className="text-slate-400">Любой</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {sub.budget_min || sub.budget_max ? (
                      <span className="text-sm text-slate-700">
                        {sub.budget_min && `от ${sub.budget_min.toLocaleString()}₽`}
                        {sub.budget_min && sub.budget_max && ' '}
                        {sub.budget_max && `до ${sub.budget_max.toLocaleString()}₽`}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Любой</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {sub.notification_enabled && (
                        <Bell className="w-4 h-4 text-orange-500" title="Push" />
                      )}
                      {sub.email_enabled && (
                        <Mail className="w-4 h-4 text-blue-500" title="Email" />
                      )}
                      {sub.telegram_enabled && (
                        <Send className="w-4 h-4 text-sky-500" title="Telegram" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {format(new Date(sub.created_at), 'dd MMM yyyy', { locale: ru })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      onClick={() => handleDelete(sub.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {subscriptions.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Подписок не найдено</p>
            </div>
          )}
        </div>
      </Card>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            variant="outline"
            size="sm"
          >
            Назад
          </Button>
          <span className="text-sm text-slate-600">
            Страница {page} из {totalPages}
          </span>
          <Button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
            variant="outline"
            size="sm"
          >
            Вперёд
          </Button>
        </div>
      )}
    </div>
  )
}



