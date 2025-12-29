'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronRight, Star, ExternalLink } from 'lucide-react'

interface WizardReviewsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function WizardReviews({ data, onNext, onSkip }: WizardReviewsProps) {
  const [yandexMapsUrl, setYandexMapsUrl] = useState(data.yandex_maps_url || '')
  const [dgisUrl, setDgisUrl] = useState(data.dgis_url || '')

  const handleNext = () => {
    onNext({
      yandex_maps_url: yandexMapsUrl,
      dgis_url: dgisUrl,
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
          Интеграция с отзывами
        </h1>
        <p className="text-sm text-gray-500">
          <span className="text-green-600 font-medium">Рекомендуется для верификации</span> · Автоматический импорт отзывов (можно пропустить)
        </p>
      </div>

      <div className="space-y-4">
        {/* Яндекс.Карты */}
        <div className="bg-white border-2 border-orange-200 rounded-xl p-4">
          <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            Яндекс.Карты
            <span className="ml-auto text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Активно
            </span>
          </label>
          <Input
            type="url"
            value={yandexMapsUrl}
            onChange={(e) => setYandexMapsUrl(e.target.value)}
            placeholder="https://yandex.ru/maps/org/..."
            className="h-11 sm:h-12 rounded-[16px]"
          />
          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600">
                Отзывы с Яндекс.Карт будут автоматически отображаться в вашем профиле
              </p>
            </div>
            <a
              href="https://yandex.ru/maps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 ml-6"
            >
              Найти мою организацию на Яндекс.Картах
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* 2GIS */}
        <div className="bg-white border-2 border-orange-200 rounded-xl p-4">
          <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-xl">🏙️</span>
            2ГИС
            <span className="ml-auto text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Активно
            </span>
          </label>
          <Input
            type="url"
            value={dgisUrl}
            onChange={(e) => setDgisUrl(e.target.value)}
            placeholder="https://2gis.ru/moscow/firm/..."
            className="h-11 sm:h-12 rounded-[16px]"
          />
          <div className="mt-3 space-y-2">
            <div className="flex items-start gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-current shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600">
                Отзывы с 2ГИС будут автоматически отображаться в вашем профиле
              </p>
            </div>
            <a
              href="https://2gis.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 ml-6"
            >
              Найти мою организацию на 2ГИС
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Важная информация */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
        <p className="text-xs text-green-900 leading-relaxed">
          ⭐ <strong>Для верификации:</strong> Интеграция с картами повышает доверие клиентов и ускоряет процесс верификации вашего профиля. Отзывы импортируются автоматически.
        </p>
        <p className="text-xs text-gray-600 mt-2">
          🔄 После успешной загрузки отзывы обновляются раз в 3 дня
        </p>
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

