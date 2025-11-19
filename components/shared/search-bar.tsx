'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchBarProps {
  defaultValue?: string
  onSearch?: (query: string) => void
  variant?: 'default' | 'compact'
  placeholder?: string
  autoFocus?: boolean
}

/**
 * Компонент поисковой строки с debounce
 */
export function SearchBar({
  defaultValue = '',
  onSearch,
  variant = 'default',
  placeholder = 'Поиск услуг, студий, аниматоров...',
  autoFocus = false,
}: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(defaultValue || searchParams.get('q') || '')
  const [isSearching, setIsSearching] = useState(false)

  // Debounce поиска
  useEffect(() => {
    if (!query) {
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timeoutId = setTimeout(() => {
      if (onSearch) {
        onSearch(query)
      } else {
        // Редирект на страницу поиска
        router.push(`/search?q=${encodeURIComponent(query)}`)
      }
      setIsSearching(false)
    }, 500) // 500ms debounce

    return () => clearTimeout(timeoutId)
  }, [query, onSearch, router])

  const handleClear = () => {
    setQuery('')
    if (onSearch) {
      onSearch('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      if (onSearch) {
        onSearch(query)
      } else {
        router.push(`/search?q=${encodeURIComponent(query)}`)
      }
    }
  }

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9"
          autoFocus={autoFocus}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <div className="flex items-center gap-2 rounded-lg border bg-white p-2 shadow-lg dark:bg-slate-800">
          <Search className="ml-2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 border-0 bg-transparent px-2 focus-visible:ring-0"
            autoFocus={autoFocus}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {isSearching && (
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
          )}
          {!isSearching && (
            <Button type="submit" size="sm" className="mr-1">
              Найти
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
