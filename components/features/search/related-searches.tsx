'use client'

import { useEffect, useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RelatedSearchesProps {
  currentQuery: string
  onSearchClick: (query: string) => void
}

/**
 * Компонент "Похожие запросы" с AI-генерацией
 */
export function RelatedSearches({ currentQuery, onSearchClick }: RelatedSearchesProps) {
  const [relatedQueries, setRelatedQueries] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!currentQuery || currentQuery.length < 3) {
      setRelatedQueries([])
      return
    }

    setIsLoading(true)
    
    // Генерируем похожие запросы с помощью AI
    fetch('/api/search/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: `похожие запросы для: ${currentQuery}`,
        limit: 4,
      }),
    })
      .then(res => res.json())
      .then(data => {
        // Фильтруем, чтобы не показывать текущий запрос
        const filtered = (data.suggestions || []).filter(
          (s: string) => s.toLowerCase() !== currentQuery.toLowerCase()
        )
        setRelatedQueries(filtered)
      })
      .catch(err => console.error('Failed to load related searches:', err))
      .finally(() => setIsLoading(false))
  }, [currentQuery])

  if (isLoading || relatedQueries.length === 0) {
    return null
  }

  return (
    <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Похожие запросы</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {relatedQueries.map((query, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSearchClick(query)}
            className="hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Search className="mr-2 h-3 w-3" />
            {query}
          </Button>
        ))}
      </div>
    </div>
  )
}


