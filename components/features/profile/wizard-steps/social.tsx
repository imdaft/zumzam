'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronRight } from 'lucide-react'

interface WizardSocialProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function WizardSocial({ data, onNext, onSkip }: WizardSocialProps) {
  const [socialLinks, setSocialLinks] = useState({
    vk: data.social_links?.vk || '',
    instagram: data.social_links?.instagram || '',
    tiktok: data.social_links?.tiktok || '',
    telegram: data.social_links?.telegram || '',
    youtube: data.social_links?.youtube || '',
  })

  const handleNext = () => {
    onNext({ social_links: socialLinks })
  }

  const socialNetworks = [
    {
      key: 'vk',
      name: 'ВКонтакте',
      icon: '🟦',
      placeholder: 'https://vk.com/your_page',
      color: 'bg-blue-50 border-blue-200',
    },
    {
      key: 'instagram',
      name: 'Instagram',
      icon: '📷',
      placeholder: 'https://instagram.com/your_profile',
      color: 'bg-pink-50 border-pink-200',
    },
    {
      key: 'tiktok',
      name: 'TikTok',
      icon: '🎵',
      placeholder: 'https://tiktok.com/@your_profile',
      color: 'bg-black/5 border-gray-300',
    },
    {
      key: 'telegram',
      name: 'Telegram',
      icon: '✈️',
      placeholder: 'https://t.me/your_channel',
      color: 'bg-sky-50 border-sky-200',
    },
    {
      key: 'youtube',
      name: 'YouTube',
      icon: '📹',
      placeholder: 'https://youtube.com/@your_channel',
      color: 'bg-red-50 border-red-200',
    },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
          Социальные сети
        </h1>
        <p className="text-sm text-gray-500">
          <span className="text-blue-600 font-medium">Рекомендуется</span> · Укажите ссылки на ваши соцсети (можно пропустить)
        </p>
      </div>

      <div className="space-y-3">
        {socialNetworks.map((social) => (
          <div
            key={social.key}
            className={`bg-white border rounded-xl p-4 transition-colors ${
              socialLinks[social.key as keyof typeof socialLinks] ? social.color : 'border-gray-200'
            }`}
          >
            <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-2xl">{social.icon}</span>
              {social.name}
            </label>
            <Input
              type="url"
              value={socialLinks[social.key as keyof typeof socialLinks]}
              onChange={(e) =>
                setSocialLinks({
                  ...socialLinks,
                  [social.key]: e.target.value,
                })
              }
              placeholder={social.placeholder}
              className="h-11 sm:h-12 rounded-[16px]"
            />
          </div>
        ))}
      </div>

      {/* Подсказка */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-xs text-blue-900 leading-relaxed">
          💡 <strong>Совет:</strong> Активные соцсети помогают клиентам узнать вас лучше и увидеть реальные отзывы. Это повышает доверие!
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

















