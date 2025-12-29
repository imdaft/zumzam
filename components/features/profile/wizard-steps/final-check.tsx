'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, AlertCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChecklistItem {
  id: string
  label: string
  completed: boolean
  required: boolean
  category: 'basic' | 'verification' | 'optional'
}

interface WizardFinalCheckProps {
  data: any
  onFinish: (data: any) => void
}

export function WizardFinalCheck({ data, onFinish }: WizardFinalCheckProps) {
  // Проверка заполненности полей (синхронизировано с checkProfileReadiness)
  const checklist: ChecklistItem[] = [
    // Базовые (обязательные для публикации)
    {
      id: 'name',
      label: 'Название (мин. 3 символа)',
      completed: !!data.display_name && data.display_name.length >= 3,
      required: true,
      category: 'basic',
    },
    {
      id: 'phone',
      label: 'Телефон',
      completed: !!data.phone,
      required: true,
      category: 'basic',
    },
    {
      id: 'email',
      label: 'Email',
      completed: !!data.email,
      required: true,
      category: 'basic',
    },
    {
      id: 'photos',
      label: 'Фотографии (мин. 3)',
      completed: (data.photos?.length || 0) >= 3,
      required: true,
      category: 'basic',
    },
    {
      id: 'description',
      label: 'Описание (мин. 50 символов)',
      completed: !!data.bio && data.bio.length >= 50,
      required: true,
      category: 'basic',
    },
    {
      id: 'address',
      label: 'Город и адрес',
      completed: !!data.city && !!data.address,
      required: true,
      category: 'basic',
    },

    // Рекомендуемые
    {
      id: 'logo',
      label: 'Логотип',
      completed: !!data.logo,
      required: false,
      category: 'verification',
    },
    {
      id: 'cover',
      label: 'Обложка',
      completed: !!data.cover_photo,
      required: false,
      category: 'verification',
    },

    // Опциональные
    {
      id: 'faq',
      label: 'Часто задаваемые вопросы',
      completed: (data.faq?.length || 0) > 0,
      required: false,
      category: 'optional',
    },
    {
      id: 'social',
      label: 'Социальные сети',
      completed: Object.values(data.social_links || {}).some((v) => !!v),
      required: false,
      category: 'optional',
    },
  ]

  const basicItems = checklist.filter((item) => item.category === 'basic')
  const verificationItems = checklist.filter((item) => item.category === 'verification')
  const optionalItems = checklist.filter((item) => item.category === 'optional')

  const basicCompleted = basicItems.filter((item) => item.completed).length
  const verificationCompleted = verificationItems.filter((item) => item.completed).length
  const optionalCompleted = optionalItems.filter((item) => item.completed).length

  const allRequiredCompleted = basicItems.filter((item) => item.required).every((item) => item.completed)
  
  // Профиль можно СОЗДАТЬ всегда, но ОПУБЛИКОВАТЬ только если все обязательные поля заполнены
  const canPublish = allRequiredCompleted
  
  // ПРИМЕЧАНИЕ: Услуги можно добавить только после создания профиля на странице редактирования,
  // поэтому здесь они не требуются для публикации

  const totalProgress = Math.round(
    (checklist.filter((item) => item.completed).length / checklist.length) * 100
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-orange-500" />
          Готовность профиля
        </h1>
        <p className="text-sm text-gray-500">
          Проверьте, что всё заполнено перед публикацией
        </p>
      </div>

      {/* Общий прогресс */}
      <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-900">
            Общий прогресс
          </span>
          <span className="text-2xl font-bold text-orange-600">
            {totalProgress}%
          </span>
        </div>
        <div className="w-full bg-orange-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>

      {/* Базовая информация */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">
            Базовая информация
          </h2>
          <span className="text-xs text-gray-500">
            {basicCompleted}/{basicItems.length}
          </span>
        </div>
        <div className="space-y-2">
          {basicItems.map((item) => (
            <ChecklistItemRow key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Для верификации */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            Для верификации
            <span className="text-xs font-normal px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
              Рекомендуется
            </span>
          </h2>
          <span className="text-xs text-gray-500">
            {verificationCompleted}/{verificationItems.length}
          </span>
        </div>
        <div className="space-y-2">
          {verificationItems.map((item) => (
            <ChecklistItemRow key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Дополнительно */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900">
            Дополнительно
          </h2>
          <span className="text-xs text-gray-500">
            {optionalCompleted}/{optionalItems.length}
          </span>
        </div>
        <div className="space-y-2">
          {optionalItems.map((item) => (
            <ChecklistItemRow key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Предупреждения */}
      {!canPublish && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-900 mb-1">
              Для публикации заполните обязательные поля
            </p>
            <p className="text-xs text-orange-700">
              Профиль будет сохранён как черновик. После добавления услуг в редактировании вы сможете его опубликовать.
            </p>
          </div>
        </div>
      )}

      {canPublish && verificationCompleted < verificationItems.length && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-900 mb-1">
              Рекомендуем заполнить поля для верификации
            </p>
            <p className="text-xs text-yellow-700">
              Это повысит доверие клиентов и ускорит верификацию профиля.
            </p>
          </div>
        </div>
      )}

      {/* Кнопки */}
      <div className="flex flex-col gap-3 pb-20 lg:pb-6">
        {/* Всегда можем сохранить как черновик */}
        <Button
          onClick={() => onFinish({ ...data, is_published: false })}
          variant="outline"
          className="w-full h-11 rounded-full font-semibold"
        >
          Сохранить как черновик
        </Button>
        
        {/* Публикация доступна только если все обязательные поля заполнены */}
        {canPublish ? (
          <Button
            onClick={() => onFinish({ ...data, is_published: true })}
            className="w-full h-12 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 rounded-full font-semibold text-base"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Опубликовать профиль
          </Button>
        ) : (
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
              Публикация будет доступна после добавления услуг в редактировании
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ChecklistItemRow({ item }: { item: ChecklistItem }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
        item.completed
          ? 'bg-green-50 border-green-200'
          : item.required
          ? 'bg-red-50 border-red-200'
          : 'bg-gray-50 border-gray-200'
      )}
    >
      <div
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
          item.completed ? 'bg-green-100' : 'bg-gray-200'
        )}
      >
        {item.completed ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2.5} />
        ) : (
          <Circle className="w-4 h-4 text-gray-400" strokeWidth={2} />
        )}
      </div>
      <span
        className={cn(
          'text-sm flex-1',
          item.completed ? 'text-green-900 font-medium' : 'text-gray-700'
        )}
      >
        {item.label}
        {item.required && !item.completed && (
          <span className="text-red-600 ml-1">*</span>
        )}
      </span>
    </div>
  )
}



