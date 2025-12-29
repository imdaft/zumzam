'use client'

import * as React from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AddressInputProps {
  value: string
  onChange: (address: string, coordinates?: [number, number]) => void
  label?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  city?: string
}

export function AddressInput({
  value,
  onChange,
  label = 'Адрес',
  placeholder = 'Введите адрес...',
  className,
  disabled = false,
  city,
}: AddressInputProps) {
  const [localValue, setLocalValue] = React.useState(value)
  const [suggestions, setSuggestions] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const debounceTimer = React.useRef<NodeJS.Timeout>()
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Закрытие списка при клике вне компонента
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoading(true)

    try {
      // Используем Dadata API для геокодинга (бесплатно для РФ)
      // Альтернатива: Yandex Geocoder API
      const response = await fetch('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // TODO: Заменить на реальный API ключ из .env
          'Authorization': 'Token ' + (process.env.NEXT_PUBLIC_DADATA_API_KEY || 'demo'),
        },
        body: JSON.stringify({
          query: city ? `${city}, ${query}` : query,
          count: 5,
          locations: city ? [{ city }] : undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Address search error:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    setShowSuggestions(true)

    // Debounce для API запросов
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300)
  }

  const handleSelectSuggestion = (suggestion: any) => {
    const address = suggestion.value
    const coordinates: [number, number] | undefined = suggestion.data?.geo_lat && suggestion.data?.geo_lon
      ? [Number(suggestion.data.geo_lat), Number(suggestion.data.geo_lon)]
      : undefined

    setLocalValue(address)
    onChange(address, coordinates)
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleBlur = () => {
    // Задержка, чтобы успел отработать клик по suggestion
    setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue)
      }
    }, 200)
  }

  return (
    <div className={cn('space-y-2', className)} ref={wrapperRef}>
      {label && <Label>{label}</Label>}
      
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        
        <Input
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-9"
        />

        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors border-b last:border-b-0"
              >
                <div className="font-medium">{suggestion.value}</div>
                {suggestion.data?.city && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {suggestion.data.city}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

















