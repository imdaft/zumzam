'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@/lib/hooks/useUser'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Service {
  id: string
  title: string
  description: string
  price: number | null
  price_from: number | null
  price_to: number | null
  currency: string
  duration_minutes: number | null
  age_from: number | null
  age_to: number | null
  tags: string[]
  active: boolean
  featured: boolean
  created_at: string
}

/**
 * Страница управления услугами в dashboard
 */
export default function ServicesPage() {
  const router = useRouter()
  const { user, profile } = useUser()
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)

  // Загрузка услуг
  useEffect(() => {
    if (user) {
      fetchServices()
    }
  }, [user])

  const fetchServices = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/services?profile_id=${user?.id}`)
      const data = await response.json()
      setServices(data.services || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Удаление услуги
  const handleDelete = async () => {
    if (!serviceToDelete) return

    try {
      const response = await fetch(`/api/services/${serviceToDelete}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setServices(services.filter(s => s.id !== serviceToDelete))
        setDeleteDialogOpen(false)
        setServiceToDelete(null)
        toast.success('Услуга удалена', {
          description: 'Услуга успешно удалена из вашего профиля',
        })
      } else {
        toast.error('Ошибка удаления', {
          description: 'Не удалось удалить услугу',
        })
      }
    } catch (error) {
      console.error('Error deleting service:', error)
      toast.error('Ошибка удаления', {
        description: 'Произошла ошибка при удалении услуги',
      })
    }
  }

  // Переключение активности
  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      })

      if (response.ok) {
        setServices(services.map(s =>
          s.id === id ? { ...s, active: !currentActive } : s
        ))
        toast.success(
          !currentActive ? 'Услуга активирована' : 'Услуга скрыта',
          {
            description: !currentActive 
              ? 'Услуга теперь видна в каталоге'
              : 'Услуга скрыта из каталога',
          }
        )
      } else {
        toast.error('Ошибка обновления', {
          description: 'Не удалось обновить статус услуги',
        })
      }
    } catch (error) {
      console.error('Error toggling service:', error)
      toast.error('Ошибка обновления', {
        description: 'Произошла ошибка при обновлении услуги',
      })
    }
  }

  // Форматирование цены
  const formatPrice = (service: Service) => {
    if (service.price) {
      return `${service.price.toLocaleString('ru-RU')} ₽`
    } else if (service.price_from && service.price_to) {
      return `${service.price_from.toLocaleString('ru-RU')} - ${service.price_to.toLocaleString('ru-RU')} ₽`
    }
    return 'По запросу'
  }

  // Проверяем наличие профиля
  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Создайте профиль</CardTitle>
            <CardDescription>
              Перед добавлением услуг необходимо создать профиль студии или аниматора
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/profile/create">Создать профиль</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Мои услуги</h1>
          <p className="text-muted-foreground mt-2">
            Управление вашими услугами и предложениями
          </p>
        </div>
        <Button asChild>
          <Link href="/services/create">
            <Plus className="mr-2 h-4 w-4" />
            Добавить услугу
          </Link>
        </Button>
      </div>

      {/* Загрузка */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Пустой список */}
      {!isLoading && services.length === 0 && (
        <EmptyState
          icon={Plus}
          title="Нет услуг"
          description="Добавьте первую услугу, чтобы родители могли вас найти"
          actionLabel="Добавить услугу"
          actionHref="/services/create"
        />
      )}

      {/* Список услуг */}
      {!isLoading && services.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {services.map((service) => (
            <Card key={service.id} className={!service.active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">{service.title}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {service.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleActive(service.id, service.active)}
                      title={service.active ? 'Скрыть' : 'Показать'}
                    >
                      {service.active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Цена */}
                <div>
                  <p className="text-2xl font-bold">{formatPrice(service)}</p>
                </div>

                {/* Детали */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {service.duration_minutes && (
                    <span>{service.duration_minutes} мин</span>
                  )}
                  {service.age_from !== null && service.age_to !== null && (
                    <span>{service.age_from}-{service.age_to} лет</span>
                  )}
                </div>

                {/* Теги */}
                {service.tags && service.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {service.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                    {service.tags.length > 3 && (
                      <Badge variant="secondary">
                        +{service.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Статус */}
                <div className="flex gap-2">
                  {!service.active && (
                    <Badge variant="outline">Скрыта</Badge>
                  )}
                  {service.featured && (
                    <Badge>Продвигается</Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  asChild
                >
                  <Link href={`/services/${service.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Редактировать
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setServiceToDelete(service.id)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Диалог удаления */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить услугу?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Услуга будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

