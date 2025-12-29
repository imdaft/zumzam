'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AddressSelector } from '../address-selector'
import { CITIES } from '@/lib/constants'
import { ChevronRight } from 'lucide-react'

interface WizardBasicInfoProps {
  data: any
  onNext: (data: any) => void
}

export function WizardBasicInfo({ data, onNext }: WizardBasicInfoProps) {
  const [displayName, setDisplayName] = useState(data.display_name || '')
  const [bio, setBio] = useState(data.bio || '')
  const [city, setCity] = useState(data.city || '')
  const [address, setAddress] = useState(data.address || '')
  const [geoLocation, setGeoLocation] = useState<[number, number] | null>(data.geo_location || null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Динамические тексты в зависимости от категории
  const categoryTexts = {
    venue: {
      title: 'Название площадки',
      placeholder: 'Например: Детский клуб «Радуга»',
      description: 'Расскажите о вашей площадке'
    },
    animator: {
      title: 'Ваше имя или название команды',
      placeholder: 'Например: Аниматор Светлана или «Весёлая команда»',
      description: 'Расскажите о себе или вашей команде'
    },
    show: {
      title: 'Название шоу-программы',
      placeholder: 'Например: Шоу мыльных пузырей «Фантазия»',
      description: 'Расскажите о вашем шоу'
    },
    agency: {
      title: 'Название агентства',
      placeholder: 'Например: Праздничное агентство «Счастье»',
      description: 'Расскажите о вашем агентстве'
    },
    quest: {
      title: 'Название квеста',
      placeholder: 'Например: Квест-комната «Пираты»',
      description: 'Расскажите о вашем квесте'
    },
    master_class: {
      title: 'Название мастер-класса',
      placeholder: 'Например: Мастер-класс по рисованию',
      description: 'Расскажите о вашем мастер-классе'
    },
    photographer: {
      title: 'Ваше имя или название студии',
      placeholder: 'Например: Фотограф Иван или «Светлый кадр»',
      description: 'Расскажите о себе или вашей студии'
    }
  }

  const currentTexts = data.category 
    ? categoryTexts[data.category as keyof typeof categoryTexts] 
    : categoryTexts.venue

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!displayName.trim()) {
      newErrors.display_name = 'Введите название'
    }
    if (!bio.trim() || bio.length < 30) {
      newErrors.bio = 'Минимум 30 символов'
    }
    if (!city) {
      newErrors.city = 'Выберите город'
    }
    if (!address.trim()) {
      newErrors.address = 'Введите адрес'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) {
      onNext({
        display_name: displayName,
        bio,
        city,
        address,
        geo_location: geoLocation,
      })
    }
  }

  const bioLength = bio.length
  const bioMin = 30
  const bioMax = 60

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Основная информация</h1>
      <p className="text-gray-500 mb-6">{currentTexts.description}</p>

      <div className="space-y-6">
        {/* Название */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">
            {currentTexts.title} <span className="text-red-500">*</span>
          </label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={currentTexts.placeholder}
            className="h-12 rounded-[16px]"
          />
          {errors.display_name && (
            <p className="text-xs text-red-500 mt-1">{errors.display_name}</p>
          )}
        </div>

        {/* Краткое описание */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-900">
              Краткое описание <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-gray-400">{bioLength}/{bioMax}</span>
          </div>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Кратко расскажите о вашей площадке в одном предложении"
            className="resize-none rounded-[16px]"
            rows={3}
            maxLength={bioMax}
          />
          {errors.bio && (
            <p className="text-xs text-red-500 mt-1">{errors.bio}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Минимум 30 символов</p>
        </div>

        {/* Город */}
        <div>
          <label className="text-sm font-semibold text-gray-900 mb-2 block">
            Город <span className="text-red-500">*</span>
          </label>
          <select
            value={city}
            onChange={(e) => {
              const newCity = e.target.value
              setCity(newCity)
              // Если город изменился и адрес был указан, очищаем адрес и координаты
              if (newCity !== city && address) {
                setAddress('')
                setGeoLocation(null)
              }
            }}
            className="flex h-12 w-full rounded-[16px] border border-gray-200 bg-white px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Выберите город</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.city && (
            <p className="text-xs text-red-500 mt-1">{errors.city}</p>
          )}
        </div>

        {/* Адрес */}
        <div>
          <AddressSelector
            city={city}
            address={address}
            onAddressChange={(addr, coords) => {
              setAddress(addr)
              setGeoLocation(coords)
            }}
            label="Адрес"
            placeholder={city ? `ул. Примерная, д. 1` : 'Сначала выберите город'}
            required
          />
          {errors.address && (
            <p className="text-xs text-red-500 mt-1">{errors.address}</p>
          )}
          {!city && (
            <p className="text-xs text-gray-500 mt-1">
              ⚠️ Адрес можно ввести только после выбора города
            </p>
          )}
        </div>
      </div>

      {/* Кнопка Далее */}
      <div className="mt-8 pb-20 lg:pb-0">
        <Button
          onClick={handleNext}
          className="w-full h-12 bg-orange-500 hover:bg-orange-600 rounded-full font-semibold"
        >
          Далее
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

