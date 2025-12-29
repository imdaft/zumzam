'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Camera, Loader2, CheckCircle2, AlertCircle, Mail, Phone, LogOut, ChevronLeft, Bell, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Минимум 2 символа')
    .max(100, 'Слишком длинное'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.length === 0) return true
        return /^(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/.test(val)
      },
      { message: 'Некорректный формат' }
    ),
  role: z.enum(['client', 'provider']).optional(),
})

type ProfileInput = z.infer<typeof profileSchema>

function SettingsPage() {
  const { user, profile, isLoading: isUserLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentRole, setCurrentRole] = useState<'client' | 'provider' | 'admin'>('client')

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key)
        }
      })
    }
    window.location.href = '/api/auth/signout'
  }

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      role: 'client',
    },
  })

  useEffect(() => {
    const loadUserRole = async () => {
      if (profile && user && !isUserLoading) {
        try {
          const response = await fetch('/api/users/me')
          
          if (response.ok) {
            const userData = await response.json()
            const userRole = (userData.role as 'client' | 'provider' | 'admin') || 'client'
            setCurrentRole(userRole)

            form.reset({
              full_name: profile.full_name || '',
              phone: profile.phone || '',
              role: userRole === 'admin' ? 'provider' : userRole,
            })
          }
        } catch (error) {
          console.error('Failed to load user role:', error)
        }
      }
    }
    
    loadUserRole()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, user, isUserLoading])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setIsUploadingAvatar(true)
    setError(null)
    setSuccess(null)

    try {
      if (file.size > 5 * 1024 * 1024) {
        setError('Максимум 5MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        setError('Только изображения')
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'avatars')

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Ошибка загрузки файла')
      }

      const uploadData = await uploadResponse.json()
      const avatarUrl = uploadData.url

      const updateResponse = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: avatarUrl }),
      })

      if (!updateResponse.ok) {
        throw new Error('Ошибка обновления аватара')
      }

      setSuccess('Фото обновлено')
      
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err: any) {
      console.error('Avatar upload error:', err)
      setError(err.message || 'Ошибка загрузки')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const onSubmit = async (data: ProfileInput) => {
    if (!user) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Обновляем профиль
      if (profile?.id) {
        const profileResponse = await fetch(`/api/profiles/${profile.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: data.full_name,
            phone: data.phone || null,
          }),
        })

        if (!profileResponse.ok) {
          throw new Error('Ошибка обновления профиля')
        }
      }

      // Обновляем роль пользователя
      if (data.role && data.role !== currentRole && currentRole !== 'admin') {
        const roleResponse = await fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: data.role }),
        })

        if (!roleResponse.ok) {
          throw new Error('Ошибка обновления роли')
        }
      }

      setSuccess('Сохранено')
      
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err: any) {
      console.error('Profile update error:', err)
      setError(err.message || 'Ошибка сохранения')
    } finally {
      setIsLoading(false)
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Мобильный заголовок с кнопкой назад */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <Link 
          href="/dashboard" 
          className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Настройки</h1>
      </div>

      {/* Уведомления */}
      {error && (
        <Alert variant="destructive" className="mb-4 rounded-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 rounded-2xl border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Профиль — аватар + имя */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mb-4">
        <div className="flex items-center gap-4">
          {/* Аватар с кнопкой загрузки */}
          <div className="relative shrink-0">
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'User'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-gray-400" />
              )}
            </div>
            
            {/* Кнопка камеры поверх аватара */}
            <label 
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-lg"
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                <Camera className="h-4 w-4 text-white" />
              )}
            </label>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar}
              className="hidden"
            />
          </div>

          {/* Имя и email */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-lg truncate">
              {profile?.full_name || 'Имя не указано'}
            </div>
            <div className="text-sm text-gray-500 truncate">{user?.email}</div>
            <div className="text-xs text-gray-400 mt-1">
              {currentRole === 'admin' ? 'Администратор' : currentRole === 'provider' ? 'Исполнитель' : 'Клиент'}
            </div>
          </div>
        </div>
      </div>

      {/* Быстрые ссылки на настройки */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Дополнительные настройки</h2>
        <div className="space-y-2">
          <Link
            href="/settings/notifications"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Bell className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">Уведомления</p>
                <p className="text-xs text-gray-500">Настройте способы получения уведомлений</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Форма редактирования */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mb-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Имя */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Имя</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Иван Иванов" 
                      {...field} 
                      className="rounded-xl h-12 text-base"
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
                  <FormLabel className="text-sm font-medium text-gray-700">Телефон</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+7 900 123 45 67"
                      {...field}
                      className="rounded-xl h-12 text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Тип аккаунта (скрыт для админа) */}
            {currentRole !== 'admin' && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Тип аккаунта</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="rounded-xl h-12 text-base">
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="client">Клиент</SelectItem>
                        <SelectItem value="provider">Исполнитель</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Email — только чтение */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Email</label>
              <div className="flex items-center gap-3 px-4 h-12 bg-gray-50 rounded-xl text-gray-500">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate text-base">{user?.email}</span>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full rounded-xl h-12 text-base font-semibold mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Сохранить'
              )}
            </Button>
          </form>
        </Form>
      </div>

      {/* Кнопка выхода — внизу, заметная */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl text-base font-medium text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-200 transition-colors"
      >
        <LogOut className="h-5 w-5" />
        Выйти
      </button>

      {/* Нижний отступ для мобильного меню */}
      <div className="h-20 md:h-0" />
    </div>
  )
}

export default SettingsPage
