'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChevronRight, Plus, Trash2, Package } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string
  price: string
  price_type?: 'fixed' | 'from' | 'negotiable' // Тип цены
  duration?: string
}

interface WizardServicesProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function WizardServices({ data, onNext, onSkip }: WizardServicesProps) {
  const [services, setServices] = useState<Service[]>(data.services || [])
  const [newService, setNewService] = useState<Service>({
    id: '',
    name: '',
    description: '',
    price: '',
    price_type: 'fixed',
    duration: '',
  })
  const [showForm, setShowForm] = useState(false)

  const handleAddService = () => {
    if (!newService.name) {
      alert('Заполните название услуги')
      return
    }
    
    // Проверяем цену только если тип не "договорная"
    if (newService.price_type !== 'negotiable' && !newService.price) {
      alert('Укажите цену услуги')
      return
    }

    const service = {
      ...newService,
      id: `service-${Date.now()}`,
    }

    setServices([...services, service])
    setNewService({
      id: '',
      name: '',
      description: '',
      price: '',
      price_type: 'fixed',
      duration: '',
    })
    setShowForm(false)
  }

  const handleRemoveService = (id: string) => {
    setServices(services.filter((s) => s.id !== id))
  }

  const handleNext = () => {
    onNext({ services })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
          Товары и услуги
        </h1>
        <p className="text-sm text-gray-500">
          <span className="text-orange-600 font-medium">Опционально</span> · Добавьте ваши услуги или товары (можно пропустить)
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {services.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-xl">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">
              Услуги пока не добавлены
            </p>
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              className="mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить первую услугу
            </Button>
          </div>
        ) : (
          <>
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white border border-gray-200 rounded-xl p-4 relative"
              >
                <button
                  onClick={() => handleRemoveService(service.id)}
                  className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <h3 className="font-semibold text-gray-900 mb-1 pr-8">
                  {service.name}
                </h3>
                
                {service.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {service.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold text-orange-600">
                    {service.price_type === 'from' ? 'от ' : service.price_type === 'negotiable' ? '' : ''}
                    {service.price_type === 'negotiable' ? 'Договорная' : `${service.price} ₽`}
                  </span>
                  {service.duration && (
                    <span className="text-gray-500">
                      {service.duration}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {!showForm && (
              <Button
                onClick={() => setShowForm(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить ещё
              </Button>
            )}
          </>
        )}

        {showForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-gray-900">Новая услуга</h3>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Название услуги *
              </label>
              <Input
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                placeholder="Например: Детский праздник 2 часа"
                className="h-11 rounded-[16px]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Описание
              </label>
              <Textarea
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                placeholder="Что входит в услугу..."
                className="min-h-[80px] rounded-[16px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Тип цены *
                </label>
                <select
                  value={newService.price_type || 'fixed'}
                  onChange={(e) => setNewService({ ...newService, price_type: e.target.value as 'fixed' | 'from' | 'negotiable' })}
                  className="flex h-11 w-full rounded-[16px] border border-gray-200 bg-white px-4 py-2 text-sm"
                >
                  <option value="fixed">Фиксированная</option>
                  <option value="from">От указанной</option>
                  <option value="negotiable">Договорная</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Цена * (₽)
                </label>
                <Input
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  placeholder="5000"
                  className="h-11 rounded-[16px]"
                  disabled={newService.price_type === 'negotiable'}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                Длительность
              </label>
              <Input
                value={newService.duration}
                onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                placeholder="2 часа"
                className="h-11 rounded-[16px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowForm(false)
                  setNewService({
                    id: '',
                    name: '',
                    description: '',
                    price: '',
                    price_type: 'fixed',
                    duration: '',
                  })
                }}
                variant="outline"
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={handleAddService}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Добавить
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Кнопки навигации */}
      <div className="mt-8 flex gap-3 pb-20 lg:pb-6">
        <Button
          onClick={onSkip}
          variant="outline"
          className="flex-1 h-11 sm:h-12 rounded-full font-semibold text-sm"
        >
          Пропустить
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold text-sm"
        >
          Далее
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}



