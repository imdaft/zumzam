'use client'

import { useState } from 'react'
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

const STEPS = [
  { id: 1, label: 'Категория', required: true },
  { id: 2, label: 'Активности', required: true },
  { id: 3, label: 'Услуги', required: false },
]

/**
 * Визард классификации профиля (5 шагов)
 * Mobile-first, адаптивный
 */
export function ClassificationWizard({
  initialData,
  onComplete,
  onCancel,
}: {
  initialData?: Partial<ClassificationData>
  onComplete: (data: ClassificationData) => Promise<void>
  onCancel?: () => void
}) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [data, setData] = useState<ClassificationData>({
    primary_venue_type: initialData?.primary_venue_type,
    activities: initialData?.activities || [],
    services: initialData?.services || [],
  })
  
  // Валидация текущего шага
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return Boolean(data.primary_venue_type)
      case 2:
        return data.activities.length > 0
      case 3:
        return true // Услуги необязательны
      default:
        return false
    }
  }
  
  const nextStep = () => {
    if (currentStep < STEPS.length && canProceed()) {
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
  
  const handleSubmit = async () => {
    if (!canProceed()) return
    
    setIsSubmitting(true)
    try {
      await onComplete(data)
    } catch (error) {
      console.error('Failed to save classification:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const progress = (currentStep / STEPS.length) * 100
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          {/* Progress bar */}
          <div className="mb-3">
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Steps pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {STEPS.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                disabled={step.id > currentStep}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  currentStep === step.id && 'bg-orange-600 text-white',
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
      </div>
      
      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-slate-200">
          {/* Step content */}
          {currentStep === 1 && (
            <PrimaryTypeStep
              selected={data.primary_venue_type}
              onSelect={(type) => setData({ ...data, primary_venue_type: type })}
            />
          )}
          
          {currentStep === 2 && (
            <ActivitiesStep
              category={data.primary_venue_type}
              selected={data.activities}
              onSelect={(activities) => setData({ ...data, activities })}
            />
          )}
          
          {currentStep === 3 && (
            <ServicesStep
              profileCategory={data.primary_venue_type}
              selected={data.services}
              onSelect={(services) => setData({ ...data, services })}
            />
          )}
        </div>
        
        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-4">
          {/* Back */}
          <Button
            type="button"
            variant="outline"
            onClick={currentStep === 1 && onCancel ? onCancel : prevStep}
            disabled={isSubmitting}
            className="flex-1 md:flex-initial"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Отмена' : 'Назад'}
          </Button>
          
          {/* Progress text */}
          <div className="hidden md:block text-sm text-slate-600 font-medium">
            Шаг {currentStep} из {STEPS.length}
          </div>
          
          {/* Next / Submit */}
          {currentStep < STEPS.length ? (
            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceed() || isSubmitting}
              className="flex-1 md:flex-initial bg-orange-600 hover:bg-orange-700"
            >
              Далее
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="flex-1 md:flex-initial bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Сохранение...' : 'Завершить'}
              <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}





