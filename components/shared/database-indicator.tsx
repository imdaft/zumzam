'use client'

import { useEffect, useState } from 'react'
import { Database, AlertTriangle } from 'lucide-react'

/**
 * Визуальный индикатор текущей базы данных
 * Показывается в правом нижнем углу в режиме разработки
 */
export function DatabaseIndicator() {
  const [dbInfo, setDbInfo] = useState<{
    isProduction: boolean
    url: string
  } | null>(null)

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const isProduction = !supabaseUrl.includes('127.0.0.1') && !supabaseUrl.includes('localhost')
    
    setDbInfo({
      isProduction,
      url: supabaseUrl
    })
  }, [])

  // Не показываем в продакшн сборке
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  if (!dbInfo) return null

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] px-3 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-semibold transition-all ${
        dbInfo.isProduction
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-green-500 text-white hover:bg-green-600'
      }`}
      title={`База данных: ${dbInfo.url}`}
    >
      {dbInfo.isProduction ? (
        <>
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>ПРОДАКШН БД</span>
        </>
      ) : (
        <>
          <Database className="w-3.5 h-3.5" />
          <span>ЛОКАЛЬНАЯ БД</span>
        </>
      )}
    </div>
  )
}

