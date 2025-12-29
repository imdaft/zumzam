'use client'

import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { CITIES } from '@/lib/constants'
import { SERVICE_TAGS } from '@/lib/validations/service'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface ServiceFiltersProps {
  onFilterChange: (filters: ServiceFilters) => void
}

export interface ServiceFilters {
  city?: string
  priceMin?: number
  priceMax?: number
  ageFrom?: number
  ageTo?: number
  tags?: string[]
}

/**
 * Компонент фильтров для каталога услуг
 */
export function ServiceFilters({ onFilterChange }: ServiceFiltersProps) {
  const [city, setCity] = useState<string>('')
  const [priceRange, setPriceRange] = useState<number[]>([0, 50000])
  const [ageRange, setAgeRange] = useState<number[]>([0, 18])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    setSelectedTags(newTags)
  }

  const applyFilters = () => {
    onFilterChange({
      city: city || undefined,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      ageFrom: ageRange[0],
      ageTo: ageRange[1],
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    })
  }

  const resetFilters = () => {
    setCity('')
    setPriceRange([0, 50000])
    setAgeRange([0, 18])
    setSelectedTags([])
    onFilterChange({})
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[24px] border border-gray-100 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-gray-900">Фильтры</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Город */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Город</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="flex h-11 w-full rounded-[18px] border border-gray-200 bg-white px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-100 md:text-sm"
            >
              <option value="">Все города</option>
              {CITIES.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
            </select>
          </div>

          {/* Цена */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Цена: {priceRange[0].toLocaleString('ru-RU')} - {priceRange[1].toLocaleString('ru-RU')} ₽
            </label>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              min={0}
              max={50000}
              step={1000}
              className="mt-2"
            />
          </div>

          {/* Возраст */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Возраст: {ageRange[0]} - {ageRange[1]} лет
            </label>
            <Slider
              value={ageRange}
              onValueChange={setAgeRange}
              min={0}
              max={18}
              step={1}
              className="mt-2"
            />
          </div>

          {/* Теги */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Теги</label>
            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
              {SERVICE_TAGS.slice(0, 20).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                Выбрано: {selectedTags.length}
              </p>
            )}
          </div>

          {/* Кнопки */}
          <div className="flex gap-2">
            <Button onClick={applyFilters} className="flex-1 rounded-full bg-orange-500 hover:bg-orange-600">
              Применить
            </Button>
            <Button onClick={resetFilters} variant="outline" className="rounded-full">
              Сбросить
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


