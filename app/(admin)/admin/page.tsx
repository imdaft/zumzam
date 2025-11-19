'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Star, 
  Calendar, 
  FileText,
  TrendingUp,
} from 'lucide-react'

/**
 * Главная страница админ-панели
 */
export default function AdminPage() {
  const router = useRouter()
  const { user, loading } = useUser()

  // TODO: Добавить проверку роли админа
  // Пока пропускаем всех авторизованных
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="text-center py-12">Загрузка...</div>
  }

  if (!user) {
    return null
  }

  // Mock статистика
  const stats = [
    {
      title: 'Всего профилей',
      value: '0',
      change: '+0%',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Новых отзывов',
      value: '0',
      change: 'На модерации',
      icon: Star,
      color: 'text-yellow-600',
    },
    {
      title: 'Бронирований',
      value: '0',
      change: '+0%',
      icon: Calendar,
      color: 'text-green-600',
    },
    {
      title: 'Активных услуг',
      value: '0',
      change: '+0%',
      icon: FileText,
      color: 'text-purple-600',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-8 w-8 text-red-600" />
          Панель администратора
        </h1>
        <p className="text-muted-foreground mt-2">
          Управление платформой DetiNaRakete
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{stat.title}</CardDescription>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              Модерация отзывов
            </CardTitle>
            <CardDescription>
              Проверка новых отзывов
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/admin/reviews" className="text-primary hover:underline">
              Перейти →
            </a>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Проверка профилей
            </CardTitle>
            <CardDescription>
              Верификация студий и аниматоров
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/admin/profiles" className="text-primary hover:underline">
              Перейти →
            </a>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Аналитика
            </CardTitle>
            <CardDescription>
              Статистика и метрики платформы
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/admin/analytics" className="text-primary hover:underline">
              Перейти →
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Последняя активность</CardTitle>
          <CardDescription>
            Последние действия на платформе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Активность пока не отслеживается
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


