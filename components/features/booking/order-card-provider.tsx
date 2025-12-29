/**
 * Карточка заказа для провайдера
 * Красивый минималистичный дизайн в стиле клиентской карточки + чат
 */

'use client'

import { useState } from 'react'
import { ru } from 'date-fns/locale'
import { safeFormatDate } from '@/lib/utils'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  MessageSquare, 
  Phone, 
  Mail,
  Package,
  ChevronDown,
  ChevronUp,
  User,
  Baby,
  FileText,
  Edit2,
  Check,
  X,
  Trash2
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { CompactOrderChat } from '@/components/features/chat/compact-order-chat'
import { OrderAttachments } from '@/components/features/orders/order-attachments'
import { AddAttachmentForm } from '@/components/features/orders/add-attachment-form'

interface OrderCardProviderProps {
  order: any
  onStatusChange?: () => void
}

const statusConfig = {
  pending: { 
    label: 'Новая', 
    color: 'bg-orange-500 text-white'
  },
  confirmed: { 
    label: 'Подтверждено', 
    color: 'bg-blue-500 text-white'
  },
  in_progress: { 
    label: 'В работе', 
    color: 'bg-purple-500 text-white'
  },
  completed: { 
    label: 'Завершено', 
    color: 'bg-green-500 text-white'
  },
  cancelled: { 
    label: 'Отменено', 
    color: 'bg-gray-500 text-white'
  },
  rejected: { 
    label: 'Отклонено', 
    color: 'bg-red-500 text-white'
  },
}

export function OrderCardProvider({ order, onStatusChange }: OrderCardProviderProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notes, setNotes] = useState(order.provider_internal_notes || '')

  const status = statusConfig[order.status as keyof typeof statusConfig]
  
  // Проверка, можно ли удалить заказ
  const canDelete = ['pending', 'cancelled', 'rejected'].includes(order.status)

  // Доступные переходы статусов
  const getAvailableStatuses = () => {
    const current = order.status
    const available: { value: string; label: string; color: string }[] = []

    if (current === 'pending') {
      available.push(
        { value: 'confirmed', label: 'Подтвердить', color: statusConfig.confirmed.color },
        { value: 'rejected', label: 'Отклонить', color: statusConfig.rejected.color }
      )
    } else if (current === 'confirmed') {
      available.push(
        { value: 'in_progress', label: 'В работу', color: statusConfig.in_progress.color }
      )
    } else if (current === 'in_progress') {
      available.push(
        { value: 'completed', label: 'Завершить', color: statusConfig.completed.color }
      )
    }

    return available
  }

  const availableStatuses = getAvailableStatuses()

  const saveNotes = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_internal_notes: notes }),
      })

      if (!response.ok) throw new Error('Failed to update')

      toast.success('Заметки сохранены')
      setIsEditing(false)
      if (onStatusChange) onStatusChange()
    } catch (error) {
      toast.error('Ошибка сохранения')
    } finally {
      setIsUpdating(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update')

      toast.success('Статус обновлён')
      if (onStatusChange) onStatusChange()
    } catch (error) {
      toast.error('Ошибка обновления')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation() // Не открываем карточку при клике на удаление
    
    if (!canDelete) {
      toast.error('Невозможно удалить заказ', {
        description: 'Заказ должен быть завершён, отменён или отклонён'
      })
      return
    }

    const confirm = window.confirm(
      `Вы уверены, что хотите удалить заказ?\n\nЭто действие нельзя отменить.`
    )
    
    if (!confirm) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Ошибка удаления заказа')
      }

      toast.success('Заказ удалён')
      if (onStatusChange) onStatusChange()
    } catch (error: any) {
      toast.error('Не удалось удалить заказ', {
        description: error.message
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-0 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-shadow overflow-hidden">
      {/* Компактный вид */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsExpanded(!isExpanded)
          }
        }}
        className="w-full p-5 text-left hover:bg-gray-50/50 transition-colors group cursor-pointer"
      >
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          {/* КЛИЕНТ */}
          <div className="flex items-center gap-4 min-w-[240px]">
            <div className="relative w-12 h-12 rounded-[16px] bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shrink-0 overflow-hidden">
              {order.client?.avatar_url ? (
                <img 
                  src={order.client.avatar_url} 
                  alt={order.client.full_name || order.client_name || 'Клиент'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-blue-600" strokeWidth={2.5} />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-orange-600 transition-colors">
                {order.client?.full_name || order.client_name || 'Клиент'}
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                № {order.order_number || order.id.slice(0, 8)}
              </p>
            </div>
          </div>

          {/* ДАТА+ВРЕМЯ и АДРЕС */}
          <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Calendar className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900">
                    {safeFormatDate(order.event_date, 'd MMMM', { locale: ru })}
                  </p>
                  <span className="text-gray-300">|</span>
                  <p className="text-sm font-bold text-gray-900">
                    {order.event_time}
                  </p>
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  {safeFormatDate(order.event_date, 'EEEE', { locale: ru })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                <MapPin className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 truncate max-w-[200px]">
                  {order.event_address.split(',')[0]}
                </p>
                <p className="text-xs text-gray-500 font-medium truncate max-w-[200px]">
                  {order.event_address.split(',').slice(1).join(', ') || 'Адрес'}
                </p>
              </div>
            </div>
          </div>

          {/* СТАТУС И ЦЕНА */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Кнопка удаления (только для pending/cancelled/rejected) */}
            {canDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Удалить заказ"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            <div className="text-right">
              <div className="text-xl font-bold text-gray-900">
                {order.total_amount?.toLocaleString('ru-RU')} ₽
              </div>
              {/* Dropdown для изменения статуса в стиле Яндекса */}
              {availableStatuses.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button 
                      className={`${status.color} text-[13px] font-bold px-4 py-1.5 rounded-full mt-3 inline-flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all disabled:opacity-60`}
                      disabled={isUpdating}
                      type="button"
                    >
                      {status.label}
                      <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-56 rounded-[18px] border-none shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)] p-2"
                  >
                    <div className="px-3 py-2 mb-1">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Изменить статус
                      </p>
                    </div>
                    {availableStatuses.map((s) => (
                      <DropdownMenuItem
                        key={s.value}
                        onClick={(e) => {
                          e.stopPropagation()
                          updateStatus(s.value)
                        }}
                        className="cursor-pointer rounded-[12px] px-3 py-2.5 focus:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${s.color} flex items-center justify-center shadow-sm`}>
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[15px] font-semibold text-gray-900">
                              {s.label}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className={`${status.color} text-[13px] font-bold px-4 py-1.5 rounded-full mt-3 shadow-sm inline-block`}>
                  {status.label}
                </div>
              )}
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180 bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
              <ChevronDown className={`w-5 h-5 ${isExpanded ? 'text-blue-600' : 'text-gray-600'}`} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Развёрнутый вид - ДВЕ КОЛОНКИ */}
      {isExpanded && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 p-6 pt-6 border-t border-gray-100">
          {/* ЛЕВАЯ КОЛОНКА - ДЕТАЛИ */}
          <div className="space-y-6">
            {/* Участники - только если есть данные */}
            {(order.child_age || order.children_count || order.adults_count) && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" strokeWidth={2.5} />
                  Участники
                </h4>
                <div className="bg-white rounded-[16px] shadow-sm p-4">
                  <div className="space-y-2">
                    {order.children_count > 0 && (
                      <div className="flex items-center gap-2">
                        <Baby className="w-4 h-4 text-gray-400" strokeWidth={2.5} />
                        <span className="text-sm text-gray-900">
                          Детей: <span className="font-semibold">{order.children_count}</span>
                          {order.child_age && <span className="text-gray-500 ml-1">(возраст {order.child_age} лет)</span>}
                        </span>
                      </div>
                    )}
                    {order.adults_count > 0 && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" strokeWidth={2.5} />
                        <span className="text-sm text-gray-900">
                          Взрослых: <span className="font-semibold">{order.adults_count}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Контакты клиента */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4" strokeWidth={2.5} />
                Контакты клиента
              </h4>
              <div className="bg-white rounded-[16px] shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" strokeWidth={2.5} />
                  <a href={`tel:${order.client_phone}`} className="text-sm text-gray-900 font-medium hover:text-orange-600">
                    {order.client_phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" strokeWidth={2.5} />
                  <a href={`mailto:${order.client_email}`} className="text-sm text-gray-900 font-medium hover:text-orange-600">
                    {order.client_email}
                  </a>
                </div>
              </div>
            </div>

            {/* Пожелания клиента */}
            {order.notes && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" strokeWidth={2.5} />
                  Пожелания клиента
                </h4>
                <div className="bg-orange-50 rounded-[16px] p-4 border border-orange-100">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{order.notes}</p>
                </div>
              </div>
            )}

            {/* Услуги */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" strokeWidth={2.5} />
                Услуги ({order.items?.length || 0})
              </h4>
              <div className="space-y-3">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="bg-white rounded-[16px] shadow-sm p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{item.service_title}</p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-gray-500 mt-1">Количество: {item.quantity}</p>
                      )}
                    </div>
                    <p className="font-bold text-gray-900">{item.subtotal.toLocaleString('ru-RU')} ₽</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Заметки для себя */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4" strokeWidth={2.5} />
                  Внутренние заметки
                </h4>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="h-8"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Редактировать
                  </Button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-3">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Добавьте заметки для себя..."
                    className="min-h-[100px] rounded-[16px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={saveNotes}
                      disabled={isUpdating}
                      className="rounded-[12px]"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Сохранить
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false)
                        setNotes(order.provider_internal_notes || '')
                      }}
                      className="rounded-[12px]"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-[16px] p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {notes || 'Нет заметок'}
                  </p>
                </div>
              )}
            </div>

            {/* Материалы для клиента */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4" strokeWidth={2.5} />
                  Материалы для клиента
                </h4>
                <AddAttachmentForm
                  orderId={order.id}
                  onSuccess={() => {}}
                />
              </div>
              <OrderAttachments
                orderId={order.id}
                currentUserRole="provider"
              />
            </div>

            {/* Быстрые действия */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4">Действия</h4>
              <div className="flex flex-wrap gap-2">
                {order.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateStatus('confirmed')}
                      disabled={isUpdating}
                      className="rounded-[12px] bg-blue-500 hover:bg-blue-600"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Подтвердить
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus('rejected')}
                      disabled={isUpdating}
                      className="rounded-[12px]"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Отклонить
                    </Button>
                  </>
                )}
                {order.status === 'confirmed' && (
                  <Button
                    size="sm"
                    onClick={() => updateStatus('in_progress')}
                    disabled={isUpdating}
                    className="rounded-[12px] bg-purple-500 hover:bg-purple-600"
                  >
                    В работу
                  </Button>
                )}
                {order.status === 'in_progress' && (
                  <Button
                    size="sm"
                    onClick={() => updateStatus('completed')}
                    disabled={isUpdating}
                    className="rounded-[12px] bg-green-500 hover:bg-green-600"
                  >
                    Завершить
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ПРАВАЯ КОЛОНКА - ЧАТ */}
          <div className="lg:h-[calc(100vh-400px)] lg:sticky lg:top-6">
            <CompactOrderChat 
              orderId={order.id}
              currentUserRole="provider"
              clientName={order.client?.full_name || order.client_name || 'Клиент'}
              providerName={order.profile?.display_name || 'Провайдер'}
            />
          </div>
        </div>
      )}
    </div>
  )
}
