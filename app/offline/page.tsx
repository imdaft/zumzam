'use client'

import { WifiOff, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

/**
 * Страница для офлайн-режима
 * Показывается когда нет интернета и страница не закэширована
 */
export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Иконка */}
        <div className="mx-auto w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-slate-500" />
        </div>

        {/* Заголовок */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">
            Нет подключения к интернету
          </h1>
          <p className="text-slate-600">
            Проверьте подключение и попробуйте снова.
            Некоторые функции доступны в офлайн-режиме.
          </p>
        </div>

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Обновить
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            На главную
          </Link>
        </div>

        {/* Подсказка */}
        <p className="text-sm text-slate-500">
          Избранное и история просмотров доступны офлайн
        </p>
      </div>
    </div>
  )
}

