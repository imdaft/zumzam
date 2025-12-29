'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

/**
 * React Query Provider для всего приложения
 * Оборачивает дочерние компоненты и предоставляет QueryClient
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  // useState гарантирует, что QueryClient создается только один раз
  // и остается стабильным между ре-рендерами
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Не рефетчить при каждом фокусе окна
            refetchOnWindowFocus: false,
            // Кэшировать данные 5 минут
            staleTime: 5 * 60 * 1000,
            // Показывать кэшированные данные пока загружаются свежие (только если они есть)
            refetchOnMount: 'always', // ✅ ВСЕГДА делать запрос при монтировании
            // Повторять запрос 1 раз при ошибке
            retry: 1,
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}





