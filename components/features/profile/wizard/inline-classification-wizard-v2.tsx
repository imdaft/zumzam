'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

import { CategoryStep } from './step-1-category'
import { PrimaryTypeStep } from './step-1-primary-type'
import { UniversalSelectorStep } from './universal-selector-step'
import { ServicesStep } from './step-3-services'

export interface ClassificationData {
  category?: string
  primary_venue_type?: string
  primary_services: string[] // Основные услуги из соответствующего каталога
  additional_services: string[] // Доп. услуги (общие)
}

/**
 * УНИВЕРСАЛЬНЫЙ ВИЗАРД КЛАССИФИКАЦИИ V2
 * 
 * Адаптируется под выбранную категорию:
 * - venue: 4 шага
 * - остальные: 3 шага
 */
export function InlineClassificationWizard({
  initialData,
  onUpdate,
}: {
  initialData?: Partial<ClassificationData>
  onUpdate: (data: ClassificationData) => void
}) {
  const [currentStep, setCurrentStep] = useState(1)
  
  const [data, setData] = useState<ClassificationData>({
    category: initialData?.category,
    primary_venue_type: initialData?.primary_venue_type,
    primary_services: initialData?.primary_services || [],
    additional_services: initialData?.additional_services || [],
  })

  // Диагностика для отладки
  console.log('🔍 [Wizard] Initial render:', {
    category: initialData?.category,
    primary_services_count: initialData?.primary_services?.length || 0,
    additional_services_count: initialData?.additional_services?.length || 0,
    primary_services: initialData?.primary_services,
    additional_services: initialData?.additional_services,
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
    JSON.stringify(initialData?.primary_services || []),  // Сравниваем по содержимому
    JSON.stringify(initialData?.additional_services || [])  // Сравниваем по содержимому
  ])
  
  // Автообновление при изменениях
  const updateData = (updates: Partial<ClassificationData>) => {
    const newData = { ...data, ...updates }
    setData(newData)
    onUpdate(newData)
  }
  
  // Конфигурация шагов в зависимости от категории
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
          { id: 3, label: 'Доп. услуги', required: false },
        ]
      
      case 'show':
        return [
          { id: 1, label: 'Категория', required: true },
          { id: 2, label: 'Виды шоу', required: true },
          { id: 3, label: 'Доп. услуги', required: false },
        ]
      
      case 'photographer':
        return [
          { id: 1, label: 'Категория', required: true },
          { id: 2, label: 'Стили съёмки', required: true },
          { id: 3, label: 'Доп. услуги', required: false },
        ]
      
      case 'master_class':
        return [
          { id: 1, label: 'Категория', required: true },
          { id: 2, label: 'Мастер-классы', required: true },
          { id: 3, label: 'Доп. услуги', required: false },
        ]
      
      case 'quest':
        return [
          { id: 1, label: 'Категория', required: true },
          { id: 2, label: 'Виды квестов', required: true },
          { id: 3, label: 'Доп. услуги', required: false },
        ]
      
      case 'agency':
        return [
          { id: 1, label: 'Категория', required: true },
          { id: 2, label: 'Услуги', required: true },
          { id: 3, label: 'Доп. услуги', required: false },
        ]
      
      default:
        return [{ id: 1, label: 'Категория', required: true }]
    }
  }
  
  const steps = getSteps()
  
  // Валидация текущего шага
  const canProceed = () => {
    if (currentStep === 1) {
      return Boolean(data.category)
    }
    
    if (!data.category) return false
    
    if (data.category === 'venue') {
      switch (currentStep) {
        case 2: return Boolean(data.primary_venue_type)
        case 3: return data.primary_services.length > 0
        case 4: return true
        default: return false
      }
    } else {
      switch (currentStep) {
        case 2: return data.primary_services.length > 0
        case 3: return true
        default: return false
      }
    }
  }
  
  const nextStep = () => {
    if (currentStep < steps.length && canProceed()) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  
  const progress = (currentStep / steps.length) * 100
  
  // Контент для текущего шага
  const renderStepContent = () => {
    // Шаг 1: Всегда выбор категории
    if (currentStep === 1) {
      return (
        <CategoryStep
          selected={data.category}
          onSelect={(category) => {
            updateData({ category, primary_services: [], additional_services: [], primary_venue_type: undefined })
            // Автопереход к шагу 2
            setTimeout(() => setCurrentStep(2), 300)
          }}
        />
      )
    }
    
    if (!data.category) return null
    
    // Для venue
    if (data.category === 'venue') {
      if (currentStep === 2) {
        return (
          <PrimaryTypeStep
            selected={data.primary_venue_type}
            onSelect={(type) => updateData({ primary_venue_type: type })}
          />
        )
      }
      if (currentStep === 3) {
        return (
          <UniversalSelectorStep
            catalog="activity_catalog"
            title="Активности на площадке"
            description="Выберите всё, что есть у вас на площадке"
            hint="Выберите хотя бы одну активность"
            selected={data.primary_services}
            onSelect={(services) => updateData({ primary_services: services })}
          />
        )
      }
      if (currentStep === 4) {
        return (
          <ServicesStep
            selected={data.additional_services}
            onSelect={(services) => updateData({ additional_services: services })}
            profileCategory={data.category}
          />
        )
      }
    }
    
    // Для остальных категорий
    if (currentStep === 2) {
      const config = getCatalogConfig(data.category)
      if (!config || !config.catalog) {
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">Не удалось загрузить конфигурацию каталога</p>
          </div>
        )
      }
      
      return (
        <UniversalSelectorStep
          catalog={config.catalog}
          title={config.title}
          description={config.description}
          hint={config.hint}
          selected={data.primary_services}
          onSelect={(services) => updateData({ primary_services: services })}
        />
      )
    }
    
    if (currentStep === 3) {
      return (
        <ServicesStep
          selected={data.additional_services}
          onSelect={(services) => updateData({ additional_services: services })}
          profileCategory={data.category}
        />
      )
    }
    
    return null
  }
  
  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-3">
        <Progress value={progress} className="h-1" />
        
        {/* Steps pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {steps.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => step.id < currentStep && setCurrentStep(step.id)}
              disabled={step.id > currentStep}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                currentStep === step.id && 'bg-orange-500 text-white',
                currentStep > step.id && 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200',
                currentStep < step.id && 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              {currentStep > step.id && <Check className="w-3 h-3 inline mr-1" />}
              {step.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Step content */}
      <div className="bg-white rounded-[24px] p-4 sm:p-6 border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        {renderStepContent()}
      </div>
      
      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex-1 sm:flex-initial h-11 rounded-full border-slate-200 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        
        <div className="hidden sm:block text-sm text-slate-500 font-medium">
          Шаг {currentStep} из {steps.length}
        </div>
        
        {currentStep < steps.length ? (
          <Button
            type="button"
            onClick={nextStep}
            disabled={!canProceed()}
            className="flex-1 sm:flex-initial h-11 bg-orange-500 hover:bg-orange-600 rounded-full"
          >
            Далее
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!canProceed()}
            className="flex-1 sm:flex-initial h-11 bg-green-500 hover:bg-green-600 rounded-full"
          >
            Готово
            <Check className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}

// Конфигурация каталогов для каждой категории
function getCatalogConfig(category: string) {
  const configs = {
    animator: {
      catalog: 'animator_services_catalog' as const,
      title: 'Ваши программы и услуги',
      description: 'Что вы предлагаете: анимация, аквагрим, шары, шоу...',
      hint: 'Выберите хотя бы одну услугу',
    },
    show: {
      catalog: 'show_types_catalog' as const,
      title: 'Виды шоу',
      description: 'Какие шоу-программы вы проводите',
      hint: 'Выберите хотя бы один вид шоу',
    },
    photographer: {
      catalog: 'photographer_styles_catalog' as const,
      title: 'Стили съёмки',
      description: 'Какие виды фотосъёмки вы предлагаете',
      hint: 'Выберите хотя бы один стиль',
    },
    master_class: {
      catalog: 'masterclass_types_catalog' as const,
      title: 'Ваши мастер-классы',
      description: 'Какие мастер-классы вы проводите',
      hint: 'Выберите хотя бы один вид мастер-класса',
    },
    quest: {
      catalog: 'quest_types_catalog' as const,
      title: 'Виды квестов',
      description: 'Какие квесты вы проводите',
      hint: 'Выберите хотя бы один вид квеста',
    },
    agency: {
      catalog: 'agency_services_catalog' as const,
      title: 'Услуги агентства',
      description: 'Что вы организуете',
      hint: 'Выберите хотя бы одну услугу',
    },
  }
  
  return configs[category as keyof typeof configs]
}


