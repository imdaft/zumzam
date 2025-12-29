'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2, ArrowLeft, CheckCircle, Mail } from 'lucide-react'

import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth'
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

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Ошибка при отправке письма')
        return
      }

      // Успех - показываем сообщение
      setSuccess(true)
      form.reset()
    } catch (err) {
      console.error('Forgot password error:', err)
      setError('Произошла ошибка. Попробуйте позже.')
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
              href="/login" 
              className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            
            <h1 className="text-lg font-bold text-gray-900">Восстановление пароля</h1>
          </div>

          {success ? (
            // Экран успеха
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-base font-semibold text-gray-900">
                  Письмо отправлено!
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Мы отправили инструкции по восстановлению пароля на указанный email. 
                  Проверьте почту и перейдите по ссылке в письме.
                </p>
              </div>

              <Alert className="border-orange-200 bg-orange-50 text-orange-700 py-3 text-xs rounded-[18px]">
                <AlertDescription>
                  <strong>Важно:</strong> Ссылка действительна в течение 1 часа. 
                  Если письмо не пришло, проверьте папку "Спам".
                </AlertDescription>
              </Alert>

              <div className="pt-2 space-y-2">
                <Button
                  type="button"
                  onClick={() => setSuccess(false)}
                  variant="outline"
                  className="w-full h-10 rounded-xl text-sm font-semibold"
                >
                  Отправить ещё раз
                </Button>
                
                <Link 
                  href="/login"
                  className="block w-full h-10 rounded-xl bg-gray-900 text-sm font-medium text-white hover:bg-black transition-all text-center leading-10"
                >
                  Вернуться к входу
                </Link>
              </div>
            </div>
          ) : (
            // Форма ввода email
            <>
              <div className="mb-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-orange-50 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-orange-600" />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Введите email, который вы использовали при регистрации. 
                  Мы отправим вам ссылку для восстановления пароля.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  
                  {error && (
                    <Alert variant="destructive" className="border-red-100 bg-red-50 text-red-600 py-2 text-xs rounded-[18px]">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Ваш email"
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

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 active:scale-[0.98] shadow-lg shadow-orange-500/20 transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Отправить ссылку'
                    )}
                  </Button>

                  <div className="text-center pt-2">
                    <Link 
                      href="/login" 
                      className="text-xs text-gray-500 hover:text-gray-900 hover:underline transition-colors"
                    >
                      Вспомнили пароль? Войти
                    </Link>
                  </div>
                </form>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}



