'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2, CheckCircle, KeyRound } from 'lucide-react'

import { updatePasswordSchema, type UpdatePasswordInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)

  const form = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // Проверяем наличие токена восстановления
  useEffect(() => {
    const checkToken = () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setError('Ссылка для восстановления пароля недействительна или устарела')
      }

      setIsValidating(false)
    }

    checkToken()
  }, [searchParams])

  const onSubmit = async (data: UpdatePasswordInput) => {
    setIsLoading(true)
    setError(null)

    const token = searchParams.get('token')
    if (!token) {
      setError('Токен не найден')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
          password: data.password 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Ошибка при обновлении пароля')
        return
      }

      // Успех - показываем сообщение и перенаправляем
      setSuccess(true)
      
      // Перенаправляем на страницу входа через 3 секунды
      setTimeout(() => {
        router.push('/login?password_reset=true')
      }, 3000)
    } catch (err) {
      console.error('Reset password error:', err)
      setError('Произошла ошибка. Попробуйте позже.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidating) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-[#1c1c1e]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/60 text-sm">Проверка ссылки...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-[#1c1c1e] overflow-hidden">
      
      {/* Абстрактный фон (градиент) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-500/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/20 blur-[100px]" />
      </div>

      {/* Основной контейнер формы */}
      <div className="relative z-10 w-full max-w-[440px] px-4">
        <div className="animate-in fade-in zoom-in-95 duration-500 rounded-[28px] bg-white p-6 shadow-2xl sm:p-8">
          
          {/* Шапка */}
          <div className="mb-6 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-orange-50 flex items-center justify-center">
              <KeyRound className="w-7 h-7 text-orange-600" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Новый пароль</h1>
            <p className="text-sm text-gray-600 mt-2">
              Придумайте надежный пароль для вашего аккаунта
            </p>
          </div>

          {success ? (
            // Экран успеха
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-gray-900">
                  Пароль успешно изменен!
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Ваш пароль был обновлен. Сейчас вы будете перенаправлены на страницу входа.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Перенаправление...</span>
              </div>
            </div>
          ) : error && error.includes('недействительна') ? (
            // Экран ошибки токена
            <div className="text-center space-y-4">
              <Alert variant="destructive" className="border-red-100 bg-red-50 text-red-600 py-3 text-xs rounded-[18px]">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <p className="text-sm text-gray-600">
                Возможно, ссылка устарела или уже была использована. 
                Запросите новую ссылку для восстановления пароля.
              </p>

              <div className="space-y-2 pt-2">
                <Link 
                  href="/forgot-password"
                  className="block w-full h-11 rounded-xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 transition-all text-center leading-[44px]"
                >
                  Запросить новую ссылку
                </Link>
                
                <Link 
                  href="/login"
                  className="block w-full h-10 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all text-center leading-10"
                >
                  Вернуться к входу
                </Link>
              </div>
            </div>
          ) : (
            // Форма установки нового пароля
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                {error && !error.includes('недействительна') && (
                  <Alert variant="destructive" className="border-red-100 bg-red-50 text-red-600 py-2 text-xs rounded-[18px]">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Новый пароль
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Минимум 6 символов"
                          className="h-11 rounded-[18px] border-gray-200 bg-gray-50 px-4 text-sm transition-all focus:border-gray-900 focus:bg-white focus:ring-0 placeholder:text-gray-400"
                          disabled={isLoading}
                          autoFocus
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Подтвердите пароль
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Повторите пароль"
                          className="h-11 rounded-[18px] border-gray-200 bg-gray-50 px-4 text-sm transition-all focus:border-gray-900 focus:bg-white focus:ring-0 placeholder:text-gray-400"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Alert className="border-orange-200 bg-orange-50 text-orange-700 py-2 text-xs rounded-[18px]">
                  <AlertDescription>
                    💡 Используйте надежный пароль: минимум 6 символов, 
                    желательно с буквами и цифрами
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 active:scale-[0.98] shadow-lg shadow-orange-500/20 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Сохранить новый пароль'
                  )}
                </Button>

                <div className="text-center pt-2">
                  <Link 
                    href="/login" 
                    className="text-xs text-gray-500 hover:text-gray-900 hover:underline transition-colors"
                  >
                    Вернуться к входу
                  </Link>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  )
}

