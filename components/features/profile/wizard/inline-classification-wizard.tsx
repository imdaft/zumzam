'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

import { PrimaryTypeStep } from './step-1-primary-type'
import { ActivitiesStep } from './step-2-activities'
import { ServicesStep } from './step-3-services'

export interface ClassificationData {
  primary_venue_type?: string
  activities: string[]
  services: string[]
}

const getSteps = (category?: string) => {
  if (category === 'venue') {
    return [
      { id: 1, label: 'Тип площадки', required: true },
      { id: 2, label: 'Активности', required: true },
      { id: 3, label: 'Услуги', required: false },
    ]
  }
  
  // Для аниматоров, шоу, агентств и т.д. - без "Тип площадки"
  return [
    { id: 1, label: 'Программы', required: true },
    { id: 2, label: 'Доп. услуги', required: false },
  ]
}

/**
 * Встроенный визард классификации (без Dialog)
 * Отображается прямо в форме на странице
 * Адаптируется под категорию профиля
 */
export function InlineClassificationWizard({
  category,
  initialData,
  onUpdate,
}: {
  category?: string
  initialData?: Partial<ClassificationData>
  onUpdate: (data: ClassificationData) => void
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const steps = getSteps(category)
  
  const [data, setData] = useState<ClassificationData>({
    primary_venue_type: initialData?.primary_venue_type,
    activities: initialData?.activities || [],
    services: initialData?.services || [],
  })

  const areSameStringArrays = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false
    const setA = new Set(a)
    if (setA.size !== b.length) return false
    for (const v of b) {
      if (!setA.has(v)) return false
    }
    return true
  }

  // Важно: initialData подгружается асинхронно (после загрузки relations из БД).
  // Без синхронизации визард “сбрасывается” после refresh, даже если значения в форме есть.
  useEffect(() => {
    const next: ClassificationData = {
      primary_venue_type: initialData?.primary_venue_type,
      activities: initialData?.activities || [],
      services: initialData?.services || [],
    }

    setData((prev) => {
      const samePrimary = (prev.primary_venue_type || '') === (next.primary_venue_type || '')
      const sameActivities = areSameStringArrays(prev.activities, next.activities)
      const sameServices = areSameStringArrays(prev.services, next.services)
      if (samePrimary && sameActivities && sameServices) return prev
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.primary_venue_type, initialData?.activities, initialData?.services])
  
  // Автоматически синхронизируем данные с родителем при каждом изменении
  const updateData = (updates: Partial<ClassificationData>) => {
    const newData = { ...data, ...updates }
    setData(newData)
    onUpdate(newData)
  }
  
  // Валидация текущего шага
  const canProceed = () => {
    if (category === 'venue') {
      switch (currentStep) {
        case 1:
          return Boolean(data.primary_venue_type)
        case 2:
          return data.activities.length > 0
        case 3:
          return true
        default:
          return false
      }
    } else {
      // Для аниматоров/шоу и т.д.
      switch (currentStep) {
        case 1:
          return data.activities.length > 0 // Программы обязательны
        case 2:
          return true // Доп. услуги необязательны
        default:
          return false
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
  
  return (
    <div className="space-y-6">
      {/* Progress bar - тонкий, элегантный */}
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
        {category === 'venue' ? (
          <>
            {currentStep === 1 && (
              <PrimaryTypeStep
                selected={data.primary_venue_type}
                onSelect={(type) => updateData({ primary_venue_type: type })}
              />
            )}
            
            {currentStep === 2 && (
              <ActivitiesStep
                category="venue"
                selected={data.activities}
                onSelect={(activities) => updateData({ activities })}
              />
            )}
            
            {currentStep === 3 && (
              <ServicesStep
                selected={data.services}
                onSelect={(services) => updateData({ services })}
              />
            )}
          </>
        ) : (
          <>
            {currentStep === 1 && (
              <ActivitiesStep
                category={category}
                selected={data.activities}
                onSelect={(activities) => updateData({ activities })}
              />
            )}
            
            {currentStep === 2 && (
              <ServicesStep
                selected={data.services}
                onSelect={(services) => updateData({ services })}
              />
            )}
          </>
        )}
      </div>
      
      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 pt-4">
        {/* Back */}
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
        
        {/* Progress text */}
        <div className="hidden sm:block text-sm text-slate-500 font-medium">
          Шаг {currentStep} из {steps.length}
        </div>
        
        {/* Next */}
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
            onClick={() => {
              // На последнем шаге просто показываем галочку (данные уже синхронизированы)
              // Можно добавить toast или визуальную индикацию
            }}
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

