'use client'

/**
 * Админка: Аналитика
 */

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface AnalyticsData {
  users: { total: number; clients: number; providers: number; admins: number }
  profiles: { total: number; published: number; verified: number }
  reviews: { total: number; approved: number; pending: number; rejected: number }
  orders: { total: number; pending: number; confirmed: number; completed: number; cancelled: number }
  timelines: { users: Record<string, number>; profiles: Record<string, number>; orders: Record<string, number>; visitors: Record<string, number> }
  revenue: { total: number; last30Days: number }
  traffic: { unique_visitors_30d: number; online_now: number; today: { pageviews: number; unique_visitors: number; mobile: number; desktop: number } }
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(res => res.json())
      .then(setData)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return <div className="p-6 text-gray-500"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Загрузка...</div>
  }

  if (!data) {
    return <div className="p-6 text-gray-500">Не удалось загрузить аналитику</div>
  }

  // Добавляем дефолтные значения для отсутствующих данных
  const traffic = data.traffic || { online_now: 0, unique_visitors_30d: 0, today: { unique_visitors: 0, pageviews: 0, mobile: 0, desktop: 0 } }
  const timelines = data.timelines || { visitors: {}, users: {}, profiles: {}, orders: {} }
  const revenue = data.revenue || { total: 0, last30Days: 0 }
  const users = data.users || { total: 0, clients: 0, providers: 0, admins: 0 }
  const profiles = data.profiles || { total: 0, published: 0, verified: 0 }
  const reviews = data.reviews || { total: 0, approved: 0, pending: 0, rejected: 0 }
  const orders = data.orders || { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Аналитика</h1>

      {/* Трафик */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-[24px] p-5">
          <div className="text-3xl font-bold text-green-700">{traffic.online_now}</div>
          <div className="text-sm font-medium text-green-700 mt-1">Онлайн сейчас</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-[24px] p-5">
          <div className="text-3xl font-bold text-slate-900">{traffic.today.unique_visitors}</div>
          <div className="text-sm text-slate-600 mt-1">Сегодня (уники)</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-[24px] p-5">
          <div className="text-3xl font-bold text-slate-900">{traffic.unique_visitors_30d}</div>
          <div className="text-sm text-slate-600 mt-1">За 30 дней (уники)</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-[24px] p-5">
          <div className="text-3xl font-bold text-slate-900">{traffic.today.pageviews}</div>
          <div className="text-sm text-slate-600 mt-1">Просмотров сегодня</div>
        </div>
      </div>

      {/* Основные метрики */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-[24px] p-5">
          <div className="font-bold text-slate-900 mb-2">Пользователи</div>
          <div className="text-2xl font-bold text-slate-900 mb-3">{users.total}</div>
          <table className="w-full text-sm text-slate-700">
            <tbody>
              <tr><td className="text-slate-500">Клиенты</td><td className="text-right">{users.clients}</td></tr>
              <tr><td className="text-slate-500">Исполнители</td><td className="text-right">{users.providers}</td></tr>
              <tr><td className="text-slate-500">Админы</td><td className="text-right text-red-600 font-semibold">{users.admins}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="bg-white border border-slate-200 rounded-[24px] p-5">
          <div className="font-bold text-slate-900 mb-2">Профили</div>
          <div className="text-2xl font-bold text-slate-900 mb-3">{profiles.total}</div>
          <table className="w-full text-sm text-slate-700">
            <tbody>
              <tr><td className="text-slate-500">Опубликовано</td><td className="text-right text-green-600 font-semibold">{profiles.published}</td></tr>
              <tr><td className="text-slate-500">Проверено</td><td className="text-right text-blue-600 font-semibold">{profiles.verified}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="bg-white border border-slate-200 rounded-[24px] p-5">
          <div className="font-bold text-slate-900 mb-2">Отзывы</div>
          <div className="text-2xl font-bold text-slate-900 mb-3">{reviews.total}</div>
          <table className="w-full text-sm text-slate-700">
            <tbody>
              <tr><td className="text-slate-500">Одобрено</td><td className="text-right text-green-600 font-semibold">{reviews.approved}</td></tr>
              <tr><td className="text-slate-500">На модерации</td><td className="text-right text-yellow-600 font-semibold">{reviews.pending}</td></tr>
              <tr><td className="text-slate-500">Отклонено</td><td className="text-right text-red-600 font-semibold">{reviews.rejected}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="bg-white border border-slate-200 rounded-[24px] p-5">
          <div className="font-bold text-slate-900 mb-2">Заказы</div>
          <div className="text-2xl font-bold text-slate-900 mb-3">{orders.total}</div>
          <table className="w-full text-sm text-slate-700">
            <tbody>
              <tr><td className="text-slate-500">В работе</td><td className="text-right text-yellow-600 font-semibold">{orders.pending}</td></tr>
              <tr><td className="text-slate-500">Завершено</td><td className="text-right text-green-600 font-semibold">{orders.completed}</td></tr>
              <tr><td className="text-slate-500">Отменено</td><td className="text-right text-red-600 font-semibold">{orders.cancelled}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Доход */}
      <div className="bg-green-50 border border-green-200 rounded-[24px] p-5 mb-6">
        <div className="font-bold text-green-800 mb-1">Сумма заказов (30 дней)</div>
        <div className="text-3xl font-bold text-green-900">{revenue.last30Days.toLocaleString('ru-RU')} ₽</div>
      </div>

      {/* Таймлайны */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-[24px] p-5">
          <div className="font-bold text-slate-900 mb-3 text-sm">Посетители (7 дней)</div>
          <table className="w-full text-sm text-slate-700">
            <tbody>
              {Object.entries(timelines.visitors || {}).slice(-7).map(([date, count]) => (
                <tr key={date} className="border-b last:border-0">
                  <td className="py-1 text-slate-500">{formatDate(date)}</td>
                  <td className="py-1 text-right font-medium">{count as number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white border border-slate-200 rounded-[24px] p-5">
          <div className="font-bold text-slate-900 mb-3 text-sm">Пользователи (7 дней)</div>
          <table className="w-full text-sm text-slate-700">
            <tbody>
              {Object.entries(timelines.users || {}).slice(-7).map(([date, count]) => (
                <tr key={date} className="border-b last:border-0">
                  <td className="py-1 text-slate-500">{formatDate(date)}</td>
                  <td className="py-1 text-right font-medium">{count as number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white border border-slate-200 rounded-[24px] p-5">
          <div className="font-bold text-slate-900 mb-3 text-sm">Профили (7 дней)</div>
          <table className="w-full text-sm text-slate-700">
            <tbody>
              {Object.entries(timelines.profiles || {}).slice(-7).map(([date, count]) => (
                <tr key={date} className="border-b last:border-0">
                  <td className="py-1 text-slate-500">{formatDate(date)}</td>
                  <td className="py-1 text-right font-medium">{count as number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white border border-slate-200 rounded-[24px] p-5">
          <div className="font-bold text-slate-900 mb-3 text-sm">Заказы (7 дней)</div>
          <table className="w-full text-sm text-slate-700">
            <tbody>
              {Object.entries(timelines.orders || {}).slice(-7).map(([date, count]) => (
                <tr key={date} className="border-b last:border-0">
                  <td className="py-1 text-slate-500">{formatDate(date)}</td>
                  <td className="py-1 text-right font-medium">{count as number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
