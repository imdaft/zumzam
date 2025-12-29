'use client'

import * as React from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  suffix?: string
  className?: string
  disabled?: boolean
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  label,
  suffix,
  className,
  disabled = false,
}: NumberInputProps) {
  const [localValue, setLocalValue] = React.useState(value.toString())

  React.useEffect(() => {
    setLocalValue(value.toString())
  }, [value])

  const handleIncrement = () => {
    const newValue = Math.min(value + step, max)
    onChange(newValue)
  }

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min)
    onChange(newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setLocalValue(inputValue)

    // Разрешаем пустое значение во время ввода
    if (inputValue === '') {
      return
    }

    const numValue = Number(inputValue)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue))
      onChange(clampedValue)
    }
  }

  const handleBlur = () => {
    // При потере фокуса убеждаемся, что значение корректно
    if (localValue === '' || isNaN(Number(localValue))) {
      setLocalValue(value.toString())
    } else {
      const numValue = Number(localValue)
      const clampedValue = Math.max(min, Math.min(max, numValue))
      if (clampedValue !== value) {
        onChange(clampedValue)
      }
      setLocalValue(clampedValue.toString())
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="relative flex-1">
          <Input
            type="number"
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled}
            className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min={min}
            max={max}
            step={step}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              {suffix}
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

















