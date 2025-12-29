'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, MoreVertical, Trash, Pencil, Copy, GripVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ServiceForm } from '@/components/features/services/service-form'
import { SortableServiceCard } from '@/components/features/services/sortable-service-card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

interface ServicesManagerProps {
  profileId: string
  profileCategory: string
  onUpdate?: () => void
  hideHeader?: boolean
}

export function ServicesManager({ profileId, profileCategory, onUpdate, hideHeader }: ServicesManagerProps) {
  const [services, setServices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list')
  const [editingService, setEditingService] = useState<any>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  
  // Категории, которые не поддерживают пакеты и "праздники под ключ"
  const isSimpleServiceCategory = ['animator', 'show', 'quest', 'master_class', 'photographer'].includes(profileCategory)
  const isAnimator = profileCategory === 'animator'

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchServices = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/services?profileId=${profileId}`)
      if (res.ok) {
        const data = await res.json()
        // Сортируем по display_order
        const sortedServices = (data.services || []).sort((a: any, b: any) => {
          const orderA = a.display_order ?? 999999
          const orderB = b.display_order ?? 999999
          return orderA - orderB
        })
        setServices(sortedServices)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [profileId])

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const res = await fetch(`/api/services/${deleteId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setServices(services.filter(s => s.id !== deleteId))
      }
    } catch (error) {
      console.error('Error deleting service:', error)
    } finally {
      setDeleteId(null)
    }
  }

  const handleDuplicate = async (service: any) => {
    try {
      // Создаем копию услуги без id
      const duplicateData = {
        ...service,
        name: `${service.name || service.title} (копия)`,
        profile_id: profileId,
        // Убираем id, created_at, updated_at, title (используем name)
        id: undefined,
        title: undefined,
        created_at: undefined,
        updated_at: undefined,
      }

      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData)
      })

      if (res.ok) {
        const { service: newService } = await res.json()
        // Добавляем новую услугу в список
        setServices([...services, newService])
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to duplicate service')
      }
    } catch (error: any) {
      console.error('Error duplicating service:', error)
      alert(`Ошибка при дублировании услуги: ${error.message}`)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (
    event: DragEndEvent,
    serviceType: 'main' | 'new-package' | 'tier-package' | 'package' | 'simple-package' | 'additional'
  ) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) {
      return
    }

    // Сохраняем текущее состояние для возможного отката
    const previousServices = [...services]

    // Получаем список услуг нужного типа
    let targetList: any[] = []
    if (serviceType === 'main') {
      targetList = services.filter(s => !s.is_additional && !s.is_package)
    } else if (serviceType === 'new-package') {
      targetList = services.filter(s => s.package_group_id)
    } else if (serviceType === 'tier-package' || serviceType === 'package') {
      targetList = services.filter(s => s.is_package && s.details?.tier_packages && s.details.tier_packages.length > 0)
    } else if (serviceType === 'simple-package') {
      targetList = services.filter(s => s.is_package && (!s.details?.tier_packages || s.details.tier_packages.length === 0))
    } else {
      targetList = services.filter(s => s.is_additional && !s.is_package)
    }

    const oldIndex = targetList.findIndex((s) => s.id === active.id)
    const newIndex = targetList.findIndex((s) => s.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // Переупорядочиваем список услуг нужного типа
    const reorderedList = arrayMove(targetList, oldIndex, newIndex)

    // Назначаем новый display_order для переупорядоченных услуг
    // Берем минимальный display_order из группы как базу
    const minOrder = Math.min(...targetList.map(s => s.display_order ?? 0))
    const reorderedWithOrder = reorderedList.map((service, index) => ({
      ...service,
      display_order: minOrder + index
    }))

    // Создаем Map для быстрой замены
    const reorderedMap = new Map(reorderedWithOrder.map(s => [s.id, s]))

    // Обновляем общий массив услуг: заменяем переупорядоченные элементы
    let updatedServices = services.map(service => 
      reorderedMap.has(service.id) ? reorderedMap.get(service.id)! : service
    )

    // Сортируем все услуги по display_order для корректного отображения
    updatedServices = updatedServices.sort((a, b) => 
      (a.display_order ?? 999999) - (b.display_order ?? 999999)
    )

    // Оптимистично обновляем UI
    setServices(updatedServices)

    // Подготавливаем обновления для отправки на сервер
    const updates = reorderedWithOrder.map(service => ({
      id: service.id,
      display_order: service.display_order
    }))

    // Отправляем на сервер
    try {
      const response = await fetch('/api/services/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, profileId })
      })

      if (!response.ok) {
        throw new Error('Failed to reorder services')
      }

      // Не перезагружаем данные - они уже обновлены оптимистично
      // Это сохраняет позицию скролла и избегает мерцания
    } catch (error) {
      console.error('Error reordering services:', error)
      // Откатываем изменения при ошибке
      setServices(previousServices)
      alert('Ошибка при изменении порядка')
    }
  }

  if (view === 'create') {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Создание услуги</h2>
        </div>
        <ServiceForm 
          profileCategory={profileCategory}
          profileId={profileId}
          onSuccess={() => {
            setView('list')
            fetchServices()
            onUpdate?.() // Обновляем родительский компонент
          }}
          onCancel={() => setView('list')}
        />
      </div>
    )
  }

  if (view === 'edit' && editingService) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Редактирование услуги</h2>
        </div>
        <ServiceForm 
          profileCategory={profileCategory}
          profileId={profileId}
          initialData={editingService}
          isEditMode
          onSuccess={() => {
            setView('list')
            setEditingService(null)
            fetchServices()
          }}
          onCancel={() => {
            setView('list')
            setEditingService(null)
          }}
        />
      </div>
    )
  }

  // Разделяем услуги на типы используя service_type
  // Для venue и подобных: разделяем на 3 категории
  // Для аниматоров: только программы + дополнительные опции
  
  // 1. Дополнительные услуги (service_type='service' или is_additional=true)
  const additionalServices = services
    .filter(s => s.service_type === 'service' || s.is_additional)
    .sort((a, b) => (a.display_order ?? 999999) - (b.display_order ?? 999999))
  
  // 2. Пакетные предложения (service_type='package')
  const packageServices = isSimpleServiceCategory ? [] : services
    .filter(s => s.service_type === 'package')
    .sort((a, b) => (a.display_order ?? 999999) - (b.display_order ?? 999999))
  
  // 3. Праздники под ключ (service_type='turnkey')
  const turnkeyServices = isSimpleServiceCategory ? [] : services
    .filter(s => s.service_type === 'turnkey')
    .sort((a, b) => (a.display_order ?? 999999) - (b.display_order ?? 999999))
  
  // 4. Основные услуги (всё остальное без service_type)
  const mainServices = services
    .filter(s => !s.service_type && !s.is_additional && !s.is_package)
    .sort((a, b) => (a.display_order ?? 999999) - (b.display_order ?? 999999))

  // Legacy: старые пакеты аниматоров (для обратной совместимости)
  const legacyAnimatorPackages = isAnimator
    ? services
        .filter((s) => s.is_package || s.package_group_id)
        .sort((a, b) => (a.display_order ?? 999999) - (b.display_order ?? 999999))
    : []

  const addButton = (
    <Button
      onClick={() => setView('create')}
      className="w-full sm:w-auto h-10 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-[24px] px-5 shrink-0 transition-colors"
    >
      <Plus className="mr-2 h-4 w-4" />
      {isAnimator ? 'Добавить программу' : 'Добавить услугу'}
    </Button>
  )

  const content = (
    <>
      {!hideHeader && (
        <CardHeader className="border-b border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-tight text-left">
              {isAnimator ? 'Программы и опции' : 'Товары и услуги'}
            </CardTitle>
            {addButton}
          </div>
        </CardHeader>
      )}

      <CardContent className={hideHeader ? "p-0" : "p-4"}>
        {hideHeader && services.length > 0 && (
          <div className="px-3 pt-3 pb-2">
            {addButton}
          </div>
        )}

        {isLoading ? (
        <div className={hideHeader ? "flex justify-center py-12 px-3" : "flex justify-center py-12"}>
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : services.length === 0 ? (
        <div className={hideHeader ? "text-center py-12 px-3" : "text-center py-12 bg-slate-50 rounded-[24px] border border-slate-200"}>
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-base text-slate-600 mb-4">Добавьте услуги</p>
          <Button onClick={() => setView('create')} className="rounded-[24px] h-10 px-5 bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="mr-2 h-4 w-4" />
            {isAnimator ? 'Добавить программу' : 'Создать услугу'}
          </Button>
        </div>
      ) : (
        <div className={hideHeader ? "space-y-4 px-3 pb-3" : "space-y-8"}>
          {/* Для аниматоров: если в базе остались пакетные услуги — показываем отдельный блок, чтобы можно было удалить/отредактировать */}
          {isAnimator && legacyAnimatorPackages.length > 0 && (
            <Card className="border border-yellow-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[24px] bg-yellow-50/40">
              <CardHeader className="p-4 border-b border-yellow-200">
                <CardTitle className="text-base font-bold text-slate-900 text-left leading-tight">
                  ⚠️ Старые пакеты
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 mt-1 text-left leading-snug">
                  Удалите или переделайте в обычную услугу
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                  {legacyAnimatorPackages.map((service) => (
                    <SortableServiceCard
                      key={service.id}
                      service={service}
                      onEdit={(service) => {
                        setEditingService(service)
                        setView('edit')
                      }}
                      onDuplicate={handleDuplicate}
                      onDelete={setDeleteId}
                      variant="package"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Основные услуги */}
          {mainServices.length > 0 && (
            <Card className="border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[24px]">
              <CardHeader className="p-4 border-b border-slate-200">
                <CardTitle className="text-base font-bold text-slate-900 text-left leading-tight">
                  {isAnimator ? 'Программы' : 'Основные услуги'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={(e) => handleDragEnd(e, 'main')}
                >
                  <SortableContext items={mainServices.map(s => s.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    {mainServices.map((service) => (
                      <SortableServiceCard
                        key={service.id}
                        service={service}
                        onEdit={(service) => {
                          setEditingService(service)
                          setView('edit')
                        }}
                        onDuplicate={handleDuplicate}
                        onDelete={setDeleteId}
                      />
                    ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          )}

          {/* Пакетные предложения (по service_type='package') */}
          {!isAnimator && packageServices.length > 0 && (
            <Card className="border border-orange-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[24px] bg-gradient-to-br from-orange-50 via-white to-orange-50/30">
              <CardHeader className="p-4 border-b border-orange-200">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2 text-left leading-tight">
                  📦 Пакетные предложения
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={(e) => handleDragEnd(e, 'package')}
                >
                  <SortableContext items={packageServices.map(s => s.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    {packageServices.map((service) => (
                      <SortableServiceCard
                        key={service.id}
                        service={service}
                        onEdit={(service) => {
                          setEditingService(service)
                          setView('edit')
                        }}
                        onDuplicate={handleDuplicate}
                        onDelete={setDeleteId}
                        variant="package"
                      />
                    ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          )}

          {/* Праздники под ключ (по service_type='turnkey') */}
          {!isSimpleServiceCategory && turnkeyServices.length > 0 && (
            <Card className="border border-orange-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[24px] bg-gradient-to-br from-orange-50 to-white">
              <CardHeader className="p-4 border-b border-orange-200">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2 text-left leading-tight">
                  🎉 Праздники под ключ
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={(e) => handleDragEnd(e, 'turnkey')}
                >
                  <SortableContext items={turnkeyServices.map(s => s.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    {turnkeyServices.map((service) => (
                      <SortableServiceCard
                        key={service.id}
                        service={service}
                        onEdit={(service) => {
                          setEditingService(service)
                          setView('edit')
                        }}
                        onDuplicate={handleDuplicate}
                        onDelete={setDeleteId}
                        variant="package"
                      />
                    ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          )}

          {/* Дополнительные услуги */}
          {additionalServices.length > 0 && (
            <Card className="border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[24px]">
              <CardHeader className="p-4 border-b border-slate-200">
                <CardTitle className="text-base font-bold text-slate-900 text-left leading-tight">
                  Дополнительные услуги
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={(e) => handleDragEnd(e, 'additional')}
                >
                  <SortableContext items={additionalServices.map(s => s.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    {additionalServices.map((service) => (
                      <SortableServiceCard
                        key={service.id}
                        service={service}
                        onEdit={(service) => {
                          setEditingService(service)
                          setView('edit')
                        }}
                        onDuplicate={handleDuplicate}
                        onDelete={setDeleteId}
                      />
                    ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить услугу?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Услуга будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 rounded-full">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )

  // Для мобильной версии (hideHeader=true) - без Card обертки
  if (hideHeader) {
    return <div className="space-y-0">{content}</div>
  }

  // Для десктопной версии - с Card оберткой
  return (
    <Card className="shadow-[0_2px_8px_rgba(0,0,0,0.06)] rounded-[24px] border border-slate-200">
      {content}
    </Card>
  )
}

