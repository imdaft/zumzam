'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Crown, Lock } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'

interface FeatureGateProps {
  feature: string // 'ai_assistant', 'analytics', 'crm', etc
  children: ReactNode
  fallback?: ReactNode
  showUpgradeDialog?: boolean
}

/**
 * Компонент для ограничения доступа к функциям по подписке
 * 
 * Использование:
 * <FeatureGate feature="ai_assistant">
 *   <AIAssistant />
 * </FeatureGate>
 */
export function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showUpgradeDialog = true 
}: FeatureGateProps) {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setHasAccess(false)
      return
    }

    checkFeatureAccess()
  }, [isAuthenticated, feature])

  const checkFeatureAccess = async () => {
    try {
      const response = await fetch('/api/subscriptions/check-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feature }),
      })

      const data = await response.json()
      setHasAccess(data.hasAccess === true)
      
      if (!data.hasAccess && showUpgradeDialog) {
        setShowDialog(true)
      }
    } catch (error) {
      console.error('Error checking feature access:', error)
      setHasAccess(false)
    }
  }

  const handleUpgrade = () => {
    router.push('/pricing')
  }

  // Пока загружается проверка - показываем fallback или null
  if (hasAccess === null) {
    return fallback ? <>{fallback}</> : null
  }

  // Если доступ есть - показываем контент
  if (hasAccess) {
    return <>{children}</>
  }

  // Если доступа нет - показываем fallback или блокировку
  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <>
      <div className="relative">
        {/* Размытый контент */}
        <div className="blur-sm pointer-events-none select-none opacity-50">
          {children}
        </div>

        {/* Оверлей с замком */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center space-y-4 p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Функция недоступна
              </h3>
              <p className="text-sm text-gray-600">
                Обновите тариф, чтобы получить доступ
              </p>
            </div>
            <Button onClick={() => setShowDialog(true)} className="gap-2">
              <Crown className="w-4 h-4" />
              Обновить тариф
            </Button>
          </div>
        </div>
      </div>

      {/* Диалог обновления тарифа */}
      {showUpgradeDialog && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                Обновите тариф
              </DialogTitle>
              <DialogDescription>
                Эта функция доступна на платных тарифах
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                Чтобы использовать эту функцию, необходимо обновить ваш тарифный план.
                Выберите подходящий тариф и получите доступ ко всем возможностям платформы.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  Что вы получите:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Доступ к AI функциям</li>
                  <li>✓ Расширенную аналитику</li>
                  <li>✓ CRM воронки продаж</li>
                  <li>✓ Приоритет в поиске</li>
                  <li>✓ И многое другое</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Позже
              </Button>
              <Button onClick={handleUpgrade} className="gap-2">
                <Crown className="w-4 h-4" />
                Посмотреть тарифы
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

/**
 * Хук для проверки доступа к функции
 * 
 * Использование:
 * const hasAI = useFeatureAccess('ai_assistant')
 * if (!hasAI) return <UpgradeButton />
 */
export function useFeatureAccess(feature: string) {
  const { isAuthenticated } = useAuth()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      setHasAccess(false)
      setIsLoading(false)
      return
    }

    checkAccess()
  }, [isAuthenticated, feature])

  const checkAccess = async () => {
    try {
      const response = await fetch('/api/subscriptions/check-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feature }),
      })

      const data = await response.json()
      setHasAccess(data.hasAccess === true)
    } catch (error) {
      console.error('Error checking feature access:', error)
      setHasAccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  return { hasAccess, isLoading, checkAccess }
}

/**
 * Хук для проверки лимита
 * 
 * Использование:
 * const { canProceed, checkLimit } = useSubscriptionLimit('profiles')
 * if (!canProceed) return <MaxProfilesReached />
 */
export function useSubscriptionLimit(limitType: 'profiles' | 'orders' | 'ai_requests') {
  const { isAuthenticated } = useAuth()
  const [canProceed, setCanProceed] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkLimit = async (increment = 1) => {
    if (!isAuthenticated) {
      setCanProceed(false)
      return false
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/subscriptions/check-limit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limitType, increment }),
      })

      const data = await response.json()
      const result = data.canProceed === true
      setCanProceed(result)
      return result
    } catch (error) {
      console.error('Error checking limit:', error)
      setCanProceed(false)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { canProceed, isLoading, checkLimit }
}

