'use client'

import { useEffect, useState } from 'react'
import { X, ChevronRight, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { CategoryStep } from './step-1-category'
import { PrimaryTypeStep } from './step-1-primary-type'
import { UniversalSelectorStep } from './universal-selector-step'
import { ServicesStep } from './step-3-services'

// Конфигурация каталогов для каждой категории
const CATALOG_CONFIG: Record<string, {
  catalog: string
  title: string
  description: string
  hint: string
}> = {
  animator: {
    catalog: 'animator_services_catalog',
    title: 'Ваши услуги',
    description: 'Выберите услуги, которые вы предоставляете. Можно выбрать несколько.',
    hint: 'Выберите хотя бы одну услугу, чтобы клиенты понимали, что вы предлагаете.'
  },
  show: {
    catalog: 'show_types_catalog',
    title: 'Виды шоу',
    description: 'Какие шоу вы проводите? Выберите все подходящие варианты.',
    hint: 'Выберите хотя бы один вид шоу.'
  },
  photographer: {
    catalog: 'photographer_styles_catalog',
    title: 'Стили съёмки',
    description: 'В каких стилях вы работаете? Можно выбрать несколько.',
    hint: 'Выберите хотя бы один стиль съёмки.'
  },
  master_class: {
    catalog: 'masterclass_types_catalog',
    title: 'Виды мастер-классов',
    description: 'Какие мастер-классы вы проводите?',
    hint: 'Выберите хотя бы один вид мастер-класса.'
  },
  quest: {
    catalog: 'quest_types_catalog',
    title: 'Виды квестов',
    description: 'Какие квесты вы предлагаете?',
    hint: 'Выберите хотя бы один вид квеста.'
  },
  agency: {
    catalog: 'agency_services_catalog',
    title: 'Услуги агентства',
    description: 'Какие услуги предоставляет ваше агентство?',
    hint: 'Выберите хотя бы одну услугу.'
  },
  venue: {
    catalog: 'activity_catalog',
    title: 'Активности и развлечения',
    description: 'Какие активности доступны на вашей площадке?',
    hint: 'Выберите хотя бы одну активность.'
  }
}

export interface ClassificationData {
  category?: string
  primary_venue_type?: string
  primary_services: string[]
  additional_services: string[]
}

/**
 * МОДАЛЬНЫЙ ВИЗАРД КЛАССИФИКАЦИИ ПРОФИЛЯ
 * Компактный, мобильный дизайн
 */
export function ModalClassificationWizard({
  open,
  onOpenChange,
  initialData,
  onComplete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<ClassificationData>
  onComplete: (data: ClassificationData) => void
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [data, setData] = useState<ClassificationData>({
    category: initialData?.category,
    primary_venue_type: initialData?.primary_venue_type,
    primary_services: initialData?.primary_services || [],
    additional_services: initialData?.additional_services || [],
  })

  // Синхронизация с initialData
  useEffect(() => {
    const newData = {
      category: initialData?.category,
      primary_venue_type: initialData?.primary_venue_type,
      primary_services: initialData?.primary_services || [],
      additional_services: initialData?.additional_services || [],
    }
    setData(newData)
  }, [
    initialData?.category, 
    initialData?.primary_venue_type, 
    JSON.stringify(initialData?.primary_services || []),
    JSON.stringify(initialData?.additional_services || [])
  ])
  
  // Обновление данных
  const updateData = (updates: Partial<ClassificationData>) => {
    setData({ ...data, ...updates })
  }
  
  // Конфигурация шагов
  const getSteps = () => {
    if (!data.category) {
      return [{ id: 1, label: 'Категория', required: true }]
    }
    
    switch (data.category) {
      case 'venue':
        return [
          { id: 1, label: 'Категория', required: true },
          { id: 2, label: 'Тип площадки', required: true },
          { id: 3, label: 'Активности', required: true },
          { id: 4, label: 'Услуги', required: false },
        ]
      
      case 'animator':
        return [
          { id: 1, label: 'Категория', required: true },
          { id: 2, label: 'Ваши услуги', required: true },
        ]
      
      case 'show':
        return [
          { id: 1, label: 'Категория', required: true },
          { id: 2, label: 'Виды шоу', required: true },
        ]
      
      case 'photographer':
        return [
          { id: 1, label: 'Категория', required: true },
          { id: 2, label: 'Стили съёмки', required: true },
        ]
      
      case 'master_class':
        return [
          { id: 1, label: 'Категория', required: true },
          { id: 2, label: 'Мастер-классы', required: true },
        ]
      
      case 'quest':
        return [
          { id: 1, label: 'Категория', required: true },
          { id: 2, label: 'Виды квестов', required: true },
        ]
      
      case 'agency':
        return [
          { id: 1, label: 'Категория', required: true },
          { id: 2, label: 'Услуги', required: true },
        ]
      
      default:
        return [{ id: 1, label: 'Категория', required: true }]
    }
  }
  
  const steps = getSteps()
  
  // Валидация
  const canProceed = () => {
    if (currentStep === 1) {
      return Boolean(data.category)
    }
    
    if (!data.category) return false
    
    if (data.category === 'venue') {
      switch (currentStep) {
        case 2:
          return Boolean(data.primary_venue_type)
        case 3:
          return data.primary_services.length > 0
        case 4:
          return true
        default:
          return false
      }
    }
    
    // Для остальных категорий (без шага 3 с доп. услугами)
    switch (currentStep) {
      case 2:
        return data.primary_services.length > 0
      default:
        return false
    }
  }
  
  const nextStep = () => {
    if (currentStep < steps.length && canProceed()) {
      setCurrentStep(currentStep + 1)
    }
  }
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }
  
  const handleSubmit = async () => {
    if (!canProceed()) return
    
    setIsSubmitting(true)
    try {
      await onComplete(data)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save classification:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Рендер контента шага
  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <CategoryStep
          selected={data.category}
          onSelect={(category) => {
            updateData({ 
              category, 
              primary_venue_type: undefined,
              primary_services: [],
              additional_services: []
            })
            // Автопереход на следующий шаг
            setTimeout(() => {
              if (category) {
                setCurrentStep(2)
              }
            }, 300)
          }}
        />
      )
    }
    
    if (!data.category) return null
    
    // Для venue: шаг 2 = тип площадки
    if (data.category === 'venue' && currentStep === 2) {
      return (
        <PrimaryTypeStep
          selected={data.primary_venue_type}
          onSelect={(type) => updateData({ primary_venue_type: type })}
        />
      )
    }
    
    // Для venue: шаг 3 = активности, для остальных: шаг 2 = основные услуги
    const isPrimaryServicesStep = 
      (data.category === 'venue' && currentStep === 3) ||
      (data.category !== 'venue' && currentStep === 2)
    
    if (isPrimaryServicesStep) {
      const config = CATALOG_CONFIG[data.category || 'venue'] || CATALOG_CONFIG.venue
      
      // Проверяем, что catalog определен
      if (!config || !config.catalog) {
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">Не удалось загрузить конфигурацию каталога</p>
          </div>
        )
      }
      
      return (
        <UniversalSelectorStep
          catalog={config.catalog as any}
          title={config.title}
          description={config.description}
          hint={config.hint}
          selected={data.primary_services}
          onSelect={(services) => updateData({ primary_services: services })}
          multiSelect={true}
        />
      )
    }
    
    // Последний шаг: доп. услуги (только для venue)
    const isAdditionalServicesStep = data.category === 'venue' && currentStep === 4
    
    if (isAdditionalServicesStep) {
      return (
        <ServicesStep
          profileCategory={data.category}
          selected={data.additional_services}
          onSelect={(services) => updateData({ additional_services: services })}
        />
      )
    }
    
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Шапка */}
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-base font-semibold text-gray-900">
                Классификация профиля
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Шаг {currentStep} из {steps.length}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </DialogHeader>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {renderStepContent()}
        </div>

        {/* Футер */}
        <div className="px-4 py-3 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={isSubmitting}
                className="h-10 px-4 text-sm"
              >
                Назад
              </Button>
            )}
            
            <div className="flex-1" />
            
            {currentStep < steps.length ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!canProceed() || isSubmitting}
                className="h-10 px-6 text-sm bg-orange-500 hover:bg-orange-600"
              >
                Далее
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="h-10 px-6 text-sm bg-orange-500 hover:bg-orange-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
                    Готово
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

