'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, X, Sparkles, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  defaultValue?: string
  onSearch?: (query: string) => void
  variant?: 'default' | 'compact'
  placeholder?: string
  autoFocus?: boolean
  showSuggestions?: boolean
}

/**
 * Компонент поисковой строки с AI-подсказками и autocomplete
 */
export function SearchBar({
  defaultValue = '',
  onSearch,
  variant = 'default',
  placeholder = 'Поиск услуг, студий, аниматоров...',
  autoFocus = false,
  showSuggestions = true,
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [trendingSearches, setTrendingSearches] = useState<string[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Загрузка популярных запросов при монтировании
  useEffect(() => {
    if (showSuggestions) {
      fetch('/api/search/suggestions')
        .then(res => res.json())
        .then(data => setTrendingSearches(data.trending || []))
        .catch(err => console.error('Failed to load trending searches:', err))
    }
  }, [showSuggestions])

  // Загрузка AI-подсказок при вводе
  useEffect(() => {
    if (!showSuggestions || query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoadingSuggestions(true)
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch('/api/search/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, limit: 5 }),
        })
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      } catch (error) {
        console.error('Failed to load suggestions:', error)
        setSuggestions([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 300) // 300ms debounce для подсказок

    return () => clearTimeout(timeoutId)
  }, [query, showSuggestions])

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
        router.push(`/search?q=${encodeURIComponent(query)}`)
      }
      setIsSearching(false)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [query, onSearch, router])

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setShowDropdown(false)
    if (onSearch) {
      onSearch('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setShowDropdown(false)
      if (onSearch) {
        onSearch(query)
      } else {
        router.push(`/search?q=${encodeURIComponent(query)}`)
      }
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowDropdown(false)
    if (onSearch) {
      onSearch(suggestion)
    } else {
      router.push(`/search?q=${encodeURIComponent(suggestion)}`)
    }
  }

  const handleInputFocus = () => {
    if (showSuggestions) {
      setShowDropdown(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query.length >= 2 ? suggestions : trendingSearches
    
    if (!showDropdown || items.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => (prev < items.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < items.length) {
          e.preventDefault()
          handleSuggestionClick(items[highlightedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const displaySuggestions = query.length >= 2 ? suggestions : trendingSearches
  const showDropdownContent = showDropdown && showSuggestions && displaySuggestions.length > 0

  if (variant === 'compact') {
    return (
      <div className="relative w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            className="pl-9 pr-9"
            autoFocus={autoFocus}
          />
          {query && !isSearching && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </form>

        {/* Dropdown с подсказками */}
        {showDropdownContent && (
          <div
            ref={dropdownRef}
            className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-lg border shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            <div className="py-2">
              {query.length < 2 && (
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" />
                  Популярные запросы
                </div>
              )}
              {query.length >= 2 && (
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  {isLoadingSuggestions ? 'Генерируем подсказки...' : 'AI подсказки'}
                </div>
              )}
              {displaySuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
                    highlightedIndex === index && 'bg-slate-100 dark:bg-slate-700'
                  )}
                >
                  <Search className="inline h-3 w-3 mr-2 text-muted-foreground" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 rounded-lg border bg-white p-2 shadow-lg dark:bg-slate-800">
          <Search className="ml-2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            className="flex-1 border-0 bg-transparent px-2 focus-visible:ring-0"
            autoFocus={autoFocus}
          />
          {query && !isSearching && (
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
      </form>

      {/* Dropdown с подсказками */}
      {showDropdownContent && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-lg border shadow-xl z-50 max-h-96 overflow-y-auto"
        >
          <div className="py-2">
            {query.length < 2 && (
              <div className="px-4 py-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Популярные запросы
              </div>
            )}
            {query.length >= 2 && (
              <div className="px-4 py-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {isLoadingSuggestions ? 'Генерируем подсказки...' : 'AI подсказки'}
              </div>
            )}
            {displaySuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  'w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
                  highlightedIndex === index && 'bg-slate-100 dark:bg-slate-700'
                )}
              >
                <Search className="inline h-4 w-4 mr-2 text-muted-foreground" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
