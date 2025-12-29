'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'

import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Проверка: если пользователь уже залогинен, перенаправляем его
  useEffect(() => {
    const checkAuth = () => {
      const userInfo = document.cookie
        .split('; ')
        .find(row => row.startsWith('user-info='))
      
      if (userInfo) {
        const redirectTo = searchParams.get('redirect') || '/'
        router.push(redirectTo)
      }
    }
    checkAuth()
  }, [router, searchParams])

  useEffect(() => {
    const errorParam = searchParams.get('error')
    const detailsParam = searchParams.get('details')
    const verifiedParam = searchParams.get('verified')
    const registeredParam = searchParams.get('registered')
    const passwordResetParam = searchParams.get('password_reset')
    
    // Показываем успешное сообщение о верификации email
    if (verifiedParam === 'true') {
      setError(null)
      setSuccess('Email успешно подтвержден! Теперь вы можете войти.')
    }
    
    // Показываем сообщение о регистрации
    if (registeredParam === 'true') {
      setError(null)
      setSuccess('Регистрация успешна! Проверьте почту для подтверждения email.')
    }
    
    // Показываем сообщение о сбросе пароля
    if (passwordResetParam === 'true') {
      setError(null)
      setSuccess('Пароль успешно изменен! Войдите с новым паролем.')
    }
    
    if (errorParam) {
      console.error('[Login] Error from URL params:', errorParam, detailsParam)
      const errorMessages: Record<string, string> = {
        'yandex_oauth_error': 'Ошибка авторизации через Яндекс. Попробуйте отключить блокировщик рекламы и повторить.',
        'no_code': 'Код авторизации не получен. Попробуйте еще раз.',
        'no_code_provided': 'Код авторизации не получен. Попробуйте еще раз.',
        'oauth_not_configured': 'OAuth не настроен. Обратитесь к администратору.',
        'token_exchange_failed': 'Ошибка обмена кода на токен. Попробуйте еще раз.',
        'no_access_token': 'Токен доступа не получен. Попробуйте еще раз.',
        'user_info_failed': 'Не удалось получить информацию о пользователе.',
        'no_email': 'Email не найден в аккаунте Яндекс.',
        'session_creation_failed': 'Не удалось создать сессию. ' + (detailsParam || ''),
        'admin_api_exception': 'Ошибка при работе с базой данных.',
        'oauth_exception': 'Общая ошибка авторизации.',
        'magiclink_verification_failed': 'Не удалось верифицировать ссылку для входа.',
        'oauth_exchange_failed': 'Ошибка при обмене кода авторизации.',
        'email_verification_failed': 'Не удалось подтвердить email. Ссылка могла устареть. Попробуйте зарегистрироваться заново.',
        'signup_verification_failed': 'Не удалось подтвердить email. Ссылка могла устареть. Попробуйте зарегистрироваться заново.',
        'Configuration': 'Проблема с конфигурацией. Пожалуйста, попробуйте еще раз.',
      }
      
      setError(errorMessages[errorParam] || `Ошибка авторизации: ${errorParam}${detailsParam ? ` (${detailsParam})` : ''}`)
    }
  }, [searchParams])

  // Больше не нужно обрабатывать hash токены - callback API устанавливает cookies напрямую

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const handleYandexLogin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const redirectTo = searchParams.get('redirect') || '/'
      window.location.href = `/api/auth/yandex?redirectTo=${encodeURIComponent(redirectTo)}`
    } catch (err) {
      console.error('Yandex OAuth error:', err)
      setError('Произошла ошибка при входе через Яндекс')
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Ошибка при входе')
        return
      }

      // Успешный вход - перенаправляем
      const redirectTo = searchParams.get('redirect') || '/'
      router.push(redirectTo)
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError('Произошла ошибка при входе. Попробуйте позже.')
    } finally {
      setIsLoading(false)
    }
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
          <div className="relative mb-6 text-center">
            <Link 
              href="/" 
              className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            
            <h1 className="text-lg font-bold text-gray-900">Вход</h1>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              
              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-700 py-2 text-xs rounded-xl">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="border-red-100 bg-red-50 text-red-600 py-2 text-xs rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2.5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Почта"
                          className="h-10 rounded-xl border-gray-200 bg-gray-50 px-4 text-sm transition-all focus:border-gray-900 focus:bg-white focus:ring-0 placeholder:text-gray-400"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Пароль"
                          className="h-10 rounded-xl border-gray-200 bg-gray-50 px-4 text-sm transition-all focus:border-gray-900 focus:bg-white focus:ring-0 placeholder:text-gray-400"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-right">
                  <Link 
                    href="/forgot-password" 
                    className="text-xs text-gray-500 hover:text-gray-900 hover:underline"
                  >
                    Забыли пароль?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-gray-900 text-sm font-medium text-white hover:bg-black active:scale-[0.98] shadow-lg shadow-gray-900/10 mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Войти'
                )}
              </Button>
            </form>
          </Form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-medium">
              <span className="bg-white px-2 text-gray-400">или</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleYandexLogin}
            disabled={isLoading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 transition-all hover:bg-gray-50 active:scale-[0.98]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.04 22.68c-.28 0-.52-.1-.7-.3a.95.95 0 0 1-.3-.7V2.32c0-.28.1-.52.3-.7a.95.95 0 0 1 .7-.3h19.92c.28 0 .52.1.7.3.2.18.3.42.3.7v19.36c0 .28-.1.52-.3.7a.95.95 0 0 1-.7.3H2.04zm15.68-11.16c-.14 0-.28-.02-.42-.06a1.2 1.2 0 0 1-.38-.18l-3.88-2.72a.4.4 0 0 0-.24-.08.4.4 0 0 0-.24.08l-3.88 2.72c-.14.1-.3.16-.38.18a1.2 1.2 0 0 1-.42.06c-.28 0-.52-.1-.7-.3a.95.95 0 0 1-.3-.7V6.64c0-.28.1-.52.3-.7a.95.95 0 0 1 .7-.3h11.52c.28 0 .52.1.7.3.2.18.3.42.3.7v3.88c0 .28-.1.52-.3.7a.95.95 0 0 1-.7.3z" fill="#FC3F1D"/>
            </svg>
            Яндекс ID
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-white/50">
            Нет аккаунта?{' '}
            <Link href="/register" className="font-medium text-white hover:text-white/80 hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
