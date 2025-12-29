'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Rocket, AlertCircle, Loader2, ArrowLeft, Sparkles, Store } from 'lucide-react'

import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
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
import { HoneypotField, validateHoneypot } from '@/components/security/honeypot-field'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      role: 'client',
      phone: '',
    },
  })

  const role = form.watch('role')

  const handleYandexSignUp = async () => {
    setIsLoading(true)
    setError(null)
    try {
      window.location.href = `/api/auth/yandex?redirectTo=${encodeURIComponent('/')}`
    } catch (err) {
      console.error('Yandex OAuth error:', err)
      setError('Произошла ошибка при регистрации через Яндекс')
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: RegisterInput, event?: React.BaseSyntheticEvent) => {
    setIsLoading(true)
    setError(null)

    try {
      // Проверка honeypot (защита от ботов)
      if (event) {
        const formData = new FormData(event.target as HTMLFormElement)
        if (!validateHoneypot(formData)) {
          console.warn('[Security] Bot detected in registration')
          setError('Подозрительная активность. Попробуйте еще раз.')
          setIsLoading(false)
          return
        }
      }
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          role: data.role,
          phone: data.phone,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Ошибка при регистрации')
        return
      }

      // Успешная регистрация - перенаправляем на главную
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Registration error:', err)
      setError('Произошла ошибка при регистрации. Попробуйте позже.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    // Фиксированный контейнер на весь экран без скролла
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
            
            <h1 className="text-lg font-bold text-gray-900">Регистрация</h1>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              
              {/* Honeypot для защиты от ботов */}
              <HoneypotField />
              
              {/* Переключатель ролей */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100 rounded-xl">
                        <button
                          type="button"
                          onClick={() => field.onChange('client')}
                          className={`flex items-center justify-center gap-2 rounded-[10px] py-2.5 px-3 text-sm font-semibold transition-all duration-200 ${
                            field.value === 'client'
                              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                          }`}
                        >
                          <Sparkles className={`h-4 w-4 flex-shrink-0 ${field.value === 'client' ? 'text-yellow-500' : 'text-gray-400'}`} />
                          <span className="whitespace-nowrap">Ищу праздник</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange('provider')}
                          className={`flex items-center justify-center gap-2 rounded-[10px] py-2.5 px-3 text-sm font-semibold transition-all duration-200 ${
                            field.value === 'provider'
                              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                          }`}
                        >
                          <Store className={`h-4 w-4 flex-shrink-0 ${field.value === 'provider' ? 'text-blue-500' : 'text-gray-400'}`} />
                          <span className="whitespace-nowrap">Предлагаю услуги</span>
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive" className="border-red-100 bg-red-50 text-red-600 py-2 text-xs rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2.5">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Ваше имя"
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Телефон"
                          className="h-10 rounded-xl border-gray-200 bg-gray-50 px-4 text-sm transition-all focus:border-gray-900 focus:bg-white focus:ring-0 placeholder:text-gray-400"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-2.5 grid-cols-2">
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
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Повторите"
                            className="h-10 rounded-xl border-gray-200 bg-gray-50 px-4 text-sm transition-all focus:border-gray-900 focus:bg-white focus:ring-0 placeholder:text-gray-400"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  'Создать аккаунт'
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
            onClick={handleYandexSignUp}
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
            Уже есть аккаунт?{' '}
            <Link href="/login" className="font-medium text-white hover:text-white/80 hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
