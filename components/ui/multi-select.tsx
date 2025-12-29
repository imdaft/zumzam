'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'

export type Option = {
  value: string
  label: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Выберите опции...',
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (value: string) => {
    onChange(selected.filter((s) => s !== value))
  }

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      handleUnselect(value)
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'flex min-h-10 w-full flex-wrap gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        onClick={() => !disabled && setOpen(!open)}
      >
        {selected.length > 0 ? (
          selected.map((value) => {
            const option = options.find((opt) => opt.value === value)
            return (
              <Badge
                key={value}
                variant="secondary"
                className="rounded-sm px-2 py-0.5 text-xs font-normal"
              >
                {option?.label || value}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUnselect(value)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUnselect(value)
                  }}
                  disabled={disabled}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            )
          })
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </div>
      
      {open && !disabled && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-md outline-none animate-in">
          <Command>
            <CommandInput placeholder="Поиск..." className="h-9" />
            <CommandList>
              <CommandEmpty>Ничего не найдено</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selected.includes(option.value)
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleSelect(option.value)}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50 [&_svg]:invisible'
                        )}
                      >
                        <span className="h-4 w-4">✓</span>
                      </div>
                      <span>{option.label}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}

















