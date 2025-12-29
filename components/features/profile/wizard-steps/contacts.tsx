'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronRight, Phone, Mail, Globe } from 'lucide-react'

interface WizardContactsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function WizardContacts({ data, onNext, onSkip }: WizardContactsProps) {
  const [phone, setPhone] = useState(data.phone || '')
  const [additionalPhone, setAdditionalPhone] = useState(data.additional_phone || '')
  const [email, setEmail] = useState(data.email || '')
  const [website, setWebsite] = useState(data.website || '')

  const handleNext = () => {
    onNext({
      phone,
      additional_phone: additionalPhone,
      email,
      website,
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
          Контактная информация
        </h1>
        <p className="text-sm text-gray-500">
          <span className="text-orange-600 font-medium">Рекомендуется</span> · Как с вами связаться (можно пропустить)
        </p>
      </div>

      <div className="space-y-4">
        {/* Основной телефон */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Основной телефон
          </label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (___) ___-__-__"
            className="h-11 sm:h-12 rounded-[16px]"
          />
          <p className="text-xs text-gray-500 mt-2">
            Этот номер будут видеть клиенты для связи
          </p>
        </div>

        {/* Дополнительный телефон */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Дополнительный телефон
            <span className="text-xs font-normal text-gray-500">(опционально)</span>
          </label>
          <Input
            type="tel"
            value={additionalPhone}
            onChange={(e) => setAdditionalPhone(e.target.value)}
            placeholder="+7 (___) ___-__-__"
            className="h-11 sm:h-12 rounded-[16px]"
          />
          <p className="text-xs text-gray-500 mt-2">
            Резервный номер для связи
          </p>
        </div>

        {/* Email */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="info@example.com"
            className="h-11 sm:h-12 rounded-[16px]"
          />
          <p className="text-xs text-gray-500 mt-2">
            Для деловой переписки и уведомлений
          </p>
        </div>

        {/* Сайт */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Веб-сайт
            <span className="text-xs font-normal text-gray-500">(опционально)</span>
          </label>
          <Input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className="h-11 sm:h-12 rounded-[16px]"
          />
          <p className="text-xs text-gray-500 mt-2">
            Ссылка на ваш сайт (если есть)
          </p>
        </div>
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

















