'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface RangeSliderProps {
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  label?: string
  formatValue?: (value: number) => string
  className?: string
  disabled?: boolean
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  formatValue = (v) => v.toString(),
  className,
  disabled = false,
}: RangeSliderProps) {
  const [localValue, setLocalValue] = React.useState(value)

  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Number(e.target.value)
    const newValue: [number, number] = [Math.min(newMin, localValue[1]), localValue[1]]
    setLocalValue(newValue)
    onChange(newValue)
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Number(e.target.value)
    const newValue: [number, number] = [localValue[0], Math.max(newMax, localValue[0])]
    setLocalValue(newValue)
    onChange(newValue)
  }

  const percentMin = ((localValue[0] - min) / (max - min)) * 100
  const percentMax = ((localValue[1] - min) / (max - min)) * 100

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">
            {formatValue(localValue[0])} - {formatValue(localValue[1])}
          </span>
        </div>
      )}

      <div className="relative pt-1 pb-2">
        {/* Track */}
        <div className="relative h-1.5 bg-gray-200 rounded-full">
          {/* Active range */}
          <div
            className="absolute h-1.5 bg-primary rounded-full"
            style={{
              left: `${percentMin}%`,
              right: `${100 - percentMax}%`,
            }}
          />
        </div>

        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[0]}
          onChange={handleMinChange}
          disabled={disabled}
          className={cn(
            'absolute top-0 w-full h-1.5 opacity-0 cursor-pointer',
            disabled && 'cursor-not-allowed'
          )}
          style={{ pointerEvents: 'all' }}
        />

        {/* Max slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[1]}
          onChange={handleMaxChange}
          disabled={disabled}
          className={cn(
            'absolute top-0 w-full h-1.5 opacity-0 cursor-pointer',
            disabled && 'cursor-not-allowed'
          )}
          style={{ pointerEvents: 'all' }}
        />

        {/* Min thumb */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ left: `calc(${percentMin}% - 8px)` }}
        />

        {/* Max thumb */}
        <div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ left: `calc(${percentMax}% - 8px)` }}
        />
      </div>
    </div>
  )
}

















