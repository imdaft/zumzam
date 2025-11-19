'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBrowserClient } from '@supabase/ssr'
import { Rocket, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'

import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * Страница регистрации
 */
export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Создаём клиент Supabase
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Инициализация формы
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      role: 'parent',
      phone: '',
    },
  })

  // Обработка отправки формы
  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setError(null)

    try {
      // 1. Регистрация в Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        if (authError.message.includes('User already registered')) {
          setError('Пользователь с таким email уже зарегистрирован')
        } else {
          setError(authError.message)
        }
        return
      }

      if (authData.user) {
        // 2. Создаём запись в таблице users (только если требуется email подтверждение)
        // Если email автоматически подтверждён, запись создастся через trigger
        
        setIsSuccess(true)
        
        // Редирект через 3 секунды
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Произошла ошибка при регистрации. Попробуйте позже.')
    } finally {
      setIsLoading(false)
    }
  }

  // Показываем сообщение об успехе
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
            <CardTitle className="text-2xl">Регистрация успешна!</CardTitle>
            <CardDescription>
              Проверьте почту для подтверждения аккаунта. Письмо с инструкциями отправлено на{' '}
              <span className="font-medium text-foreground">{form.getValues('email')}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Вы будете перенаправлены на страницу входа через несколько секунд...
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              className="w-full"
            >
              Перейти ко входу
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Регистрация</CardTitle>
          <CardDescription>
            Создайте аккаунт в DetiNaRakete
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Тип аккаунта */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип аккаунта</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'parent', label: 'Родитель' },
                          { value: 'animator', label: 'Аниматор' },
                          { value: 'studio', label: 'Студия' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => field.onChange(option.value)}
                            className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                              field.value === option.value
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-input bg-background hover:bg-accent'
                            }`}
                            disabled={isLoading}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Полное имя */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Полное имя</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Иван Иванов"
                        autoComplete="name"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="ivan@example.com"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Телефон */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Телефон (опционально)</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+7 900 123 45 67"
                        autoComplete="tel"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Для связи со студиями и аниматорами
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Пароль */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Минимум 6 символов
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Подтверждение пароля */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Подтвердите пароль</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Регистрация...
                  </>
                ) : (
                  'Создать аккаунт'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Войти
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}


