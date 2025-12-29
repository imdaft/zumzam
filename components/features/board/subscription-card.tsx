'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  Mail, 
  Send, 
  Smartphone,
  MoreVertical,
  Pencil,
  Trash2,
  Pause,
  Play,
  Tag,
  MapPin,
  Users,
  Wallet,
  Zap,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { BoardSubscription } from '@/lib/types/board-subscription'
import { CATEGORIES, CLIENT_TYPES } from '@/lib/types/order-request'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SubscriptionCardProps {
  subscription: BoardSubscription
  onEdit: (subscription: BoardSubscription) => void
  onRefresh: () => void
}

export function SubscriptionCard({ subscription, onEdit, onRefresh }: SubscriptionCardProps) {
  const router = useRouter()
  const [isToggling, setIsToggling] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { filters } = subscription

  // Получить лейблы для фильтров
  const categoryLabels = filters.categories?.map(
    c => CATEGORIES.find(cat => cat.id === c)?.label
  ).filter(Boolean) || []

  const clientTypeLabels = filters.clientTypes?.map(
    c => CLIENT_TYPES.find(ct => ct.id === c)?.label
  ).filter(Boolean) || []

  // Подсчёт активных каналов уведомлений
  const activeChannels = [
    subscription.notify_internal && 'internal',
    subscription.notify_push && 'push',
    subscription.notify_email && 'email',
    subscription.notify_telegram && 'telegram',
  ].filter(Boolean)

  // Переключение активности
  const handleToggle = async (active: boolean) => {
    setIsToggling(true)
    try {
      const response = await fetch(`/api/board-subscriptions/${subscription.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: active }),
      })

      if (!response.ok) throw new Error()

      toast.success(active ? 'Подписка включена' : 'Подписка приостановлена')
      onRefresh()
    } catch {
      toast.error('Ошибка при изменении подписки')
    } finally {
      setIsToggling(false)
    }
  }

  // Удаление
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/board-subscriptions/${subscription.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error()

      toast.success('Подписка удалена')
      setShowDeleteDialog(false)
      onRefresh()
    } catch {
      toast.error('Ошибка при удалении подписки')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div 
        className={cn(
          "bg-white rounded-[28px] border p-4 transition-all",
          subscription.is_active 
            ? "border-gray-200 shadow-sm" 
            : "border-gray-100 bg-gray-50 opacity-75"
        )}
      >
        {/* Заголовок */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              subscription.is_active ? "bg-orange-100" : "bg-gray-100"
            )}>
              <Bell className={cn(
                "w-4 h-4",
                subscription.is_active ? "text-orange-600" : "text-gray-400"
              )} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {subscription.name || 'Без названия'}
              </h3>
              {subscription.matches_count > 0 && (
                <p className="text-xs text-gray-500">
                  {subscription.matches_count} совпадений
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={subscription.is_active}
              onCheckedChange={handleToggle}
              disabled={isToggling}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(subscription)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToggle(!subscription.is_active)}>
                  {subscription.is_active ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Приостановить
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Возобновить
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Фильтры */}
        <div className="space-y-2 mb-4">
          {/* Категории */}
          {categoryLabels.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <div className="flex flex-wrap gap-1">
                {categoryLabels.map((label, i) => (
                  <span 
                    key={i}
                    className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full text-xs"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Тип заказчика */}
          {clientTypeLabels.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">
                {clientTypeLabels.join(', ')}
              </span>
            </div>
          )}

          {/* Город и районы */}
          {filters.city && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">
                {filters.city}
                {filters.districts && filters.districts.length > 0 && (
                  <span className="text-gray-400">
                    {' · '}{filters.districts.slice(0, 3).join(', ')}
                    {filters.districts.length > 3 && ` +${filters.districts.length - 3}`}
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Бюджет */}
          {(filters.budgetMin || filters.budgetMax) && (
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">
                {filters.budgetMin && filters.budgetMax
                  ? `${filters.budgetMin.toLocaleString()} — ${filters.budgetMax.toLocaleString()} ₽`
                  : filters.budgetMin
                    ? `от ${filters.budgetMin.toLocaleString()} ₽`
                    : `до ${filters.budgetMax?.toLocaleString()} ₽`
                }
              </span>
            </div>
          )}

          {/* Возраст */}
          {(filters.ageFrom || filters.ageTo) && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">
                Дети {filters.ageFrom || 1}–{filters.ageTo || 18} лет
              </span>
            </div>
          )}

          {/* Срочность */}
          {filters.urgentOnly && (
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
              <span className="text-gray-600">Только срочные</span>
            </div>
          )}

          {/* Ключевые слова */}
          {filters.keywords && filters.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.keywords.map((keyword, i) => (
                <span 
                  key={i}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                >
                  «{keyword}»
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Каналы уведомлений */}
        <div className="flex items-center gap-2 pt-3 border-t">
          <span className="text-xs text-gray-400 mr-1">Уведомления:</span>
          {subscription.notify_internal && (
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center" title="В личный кабинет">
              <Bell className="w-3 h-3 text-gray-500" />
            </div>
          )}
          {subscription.notify_push && (
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center" title="Push-уведомления">
              <Smartphone className="w-3 h-3 text-gray-500" />
            </div>
          )}
          {subscription.notify_email && (
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center" title="Email">
              <Mail className="w-3 h-3 text-gray-500" />
            </div>
          )}
          {subscription.notify_telegram && (
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center" title="Telegram">
              <Send className="w-3 h-3 text-blue-500" />
            </div>
          )}
          {activeChannels.length === 0 && (
            <span className="text-xs text-gray-400">не настроены</span>
          )}
        </div>
      </div>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить подписку?</AlertDialogTitle>
            <AlertDialogDescription>
              Подписка «{subscription.name || 'Без названия'}» будет удалена. 
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}






