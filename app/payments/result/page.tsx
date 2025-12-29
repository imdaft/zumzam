'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, Home, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

type PaymentStatus = 'loading' | 'succeeded' | 'pending' | 'canceled' | 'error'

/**
 * Страница результата платежа
 * Пользователь попадает сюда после оплаты в ЮКасса
 */
export default function PaymentResultPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<PaymentStatus>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Получаем параметры из URL (ЮКасса может передать статус)
    const paymentId = searchParams.get('payment_id')
    
    // Проверяем статус платежа
    checkPaymentStatus(paymentId)
  }, [searchParams])

  const checkPaymentStatus = async (paymentId: string | null) => {
    try {
      // Небольшая задержка для обработки webhook
      await new Promise(resolve => setTimeout(resolve, 2000))

      if (!paymentId) {
        // Если нет ID, считаем что оплата прошла (webhook обработает)
        setStatus('succeeded')
        setMessage('Платёж обрабатывается')
        return
      }

      // Проверяем статус через API
      const response = await fetch(`/api/payments/${paymentId}`)
      
      if (!response.ok) {
        setStatus('pending')
        setMessage('Платёж обрабатывается')
        return
      }

      const data = await response.json()
      
      switch (data.status) {
        case 'succeeded':
          setStatus('succeeded')
          setMessage('Оплата прошла успешно!')
          break
        case 'pending':
        case 'waiting_for_capture':
          setStatus('pending')
          setMessage('Платёж обрабатывается...')
          break
        case 'canceled':
          setStatus('canceled')
          setMessage('Платёж отменён')
          break
        default:
          setStatus('pending')
          setMessage('Проверяем статус...')
      }
    } catch {
      // При ошибке показываем успех (webhook всё равно обработает)
      setStatus('succeeded')
      setMessage('Платёж обрабатывается')
    }
  }

  const statusConfig = {
    loading: {
      icon: <Loader2 className="w-16 h-16 text-primary animate-spin" />,
      title: 'Проверяем платёж...',
      color: 'text-slate-600',
      bgColor: 'bg-slate-100',
    },
    succeeded: {
      icon: <CheckCircle className="w-16 h-16 text-green-500" />,
      title: 'Оплата успешна!',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    pending: {
      icon: <Clock className="w-16 h-16 text-amber-500" />,
      title: 'Обрабатываем платёж',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    canceled: {
      icon: <XCircle className="w-16 h-16 text-red-500" />,
      title: 'Платёж отменён',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    error: {
      icon: <XCircle className="w-16 h-16 text-red-500" />,
      title: 'Ошибка',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  }

  const config = statusConfig[status]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full">
        {/* Карточка результата */}
        <div className={`${config.bgColor} rounded-3xl p-8 text-center shadow-sm`}>
          {/* Иконка */}
          <div className="flex justify-center mb-6">
            {config.icon}
          </div>

          {/* Заголовок */}
          <h1 className={`text-2xl font-bold ${config.color} mb-2`}>
            {config.title}
          </h1>

          {/* Сообщение */}
          <p className="text-slate-600 mb-8">
            {message}
          </p>

          {/* Кнопки */}
          <div className="space-y-3">
            {status === 'succeeded' && (
              <>
                <Link href="/dashboard" className="block">
                  <Button className="w-full gap-2" size="lg">
                    Перейти в личный кабинет
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full gap-2" size="lg">
                    <Home className="w-4 h-4" />
                    На главную
                  </Button>
                </Link>
              </>
            )}

            {status === 'pending' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => checkPaymentStatus(searchParams.get('payment_id'))}
              >
                Проверить статус
              </Button>
            )}

            {(status === 'canceled' || status === 'error') && (
              <>
                <Button
                  className="w-full"
                  onClick={() => router.back()}
                >
                  Попробовать снова
                </Button>
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full gap-2">
                    <Home className="w-4 h-4" />
                    На главную
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Подсказка */}
        {status === 'pending' && (
          <p className="text-center text-sm text-slate-500 mt-4">
            Обычно это занимает несколько секунд. 
            Если статус не обновился, проверьте email.
          </p>
        )}
      </div>
    </div>
  )
}

