'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createBrowserClient } from '@supabase/ssr'
import { User, Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useUser } from '@/lib/hooks/useUser'
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
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Схема валидации для обновления профиля
const profileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(100, 'Имя слишком длинное'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.length === 0) return true
        return /^(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/.test(val)
      },
      {
        message: 'Некорректный формат телефона',
      }
    ),
})

type ProfileInput = z.infer<typeof profileSchema>

/**
 * Страница настроек профиля
 */
export default function SettingsPage() {
  const { user, profile, isLoading: isUserLoading } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Форма профиля
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
    },
  })

  // Обновляем форму когда загрузится профиль
  if (profile && !isUserLoading && !form.formState.isDirty) {
    form.reset({
      full_name: profile.full_name || '',
      phone: profile.phone || '',
    })
  }

  // Обработка загрузки аватара
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setIsUploadingAvatar(true)
    setError(null)
    setSuccess(null)

    try {
      // Проверяем размер файла (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Файл слишком большой. Максимум 5MB')
        return
      }

      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        setError('Можно загружать только изображения')
        return
      }

      // Генерируем уникальное имя файла
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      // Загружаем в Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // Получаем публичный URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Обновляем профиль в БД
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('Аватар успешно обновлён')
      
      // Перезагружаем страницу для обновления аватара
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err: any) {
      console.error('Avatar upload error:', err)
      setError(err.message || 'Ошибка загрузки аватара')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Обработка обновления профиля
  const onSubmit = async (data: ProfileInput) => {
    if (!user) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('Профиль успешно обновлён')
      
      // Перезагружаем для обновления данных
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err: any) {
      console.error('Profile update error:', err)
      setError(err.message || 'Ошибка обновления профиля')
    } finally {
      setIsLoading(false)
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Настройки</h1>
        <p className="text-muted-foreground mt-2">
          Управление вашим профилем и настройками аккаунта
        </p>
      </div>

      {/* Аватар */}
      <Card>
        <CardHeader>
          <CardTitle>Фото профиля</CardTitle>
          <CardDescription>
            Загрузите ваше фото. Рекомендуемый размер: 400x400px. Максимум 5MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Текущий аватар */}
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-slate-400" />
                )}
              </div>
              
              {/* Индикатор загрузки */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Кнопка загрузки */}
            <div className="flex-1">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
                className="hidden"
              />
              <label htmlFor="avatar-upload">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUploadingAvatar}
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  asChild
                >
                  <span>
                    <Camera className="mr-2 h-4 w-4" />
                    {isUploadingAvatar ? 'Загрузка...' : 'Загрузить фото'}
                  </span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG, WEBP или GIF. Максимум 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Основная информация */}
      <Card>
        <CardHeader>
          <CardTitle>Основная информация</CardTitle>
          <CardDescription>
            Обновите информацию о вашем профиле
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email (только для чтения) */}
              <div className="space-y-2">
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-slate-50 dark:bg-slate-900"
                />
                <p className="text-xs text-muted-foreground">
                  Email нельзя изменить
                </p>
              </div>

              {/* Роль (только для чтения) */}
              <div className="space-y-2">
                <FormLabel>Тип аккаунта</FormLabel>
                <Input
                  value={
                    profile?.role === 'parent' ? 'Родитель' :
                    profile?.role === 'animator' ? 'Аниматор' :
                    profile?.role === 'studio' ? 'Студия' :
                    profile?.role === 'admin' ? 'Администратор' :
                    'Не указано'
                  }
                  disabled
                  className="bg-slate-50 dark:bg-slate-900"
                />
              </div>

              {/* Полное имя */}
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Полное имя</FormLabel>
                    <FormControl>
                      <Input placeholder="Иван Иванов" {...field} />
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
                    <FormLabel>Телефон</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="+7 900 123 45 67"
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

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Сохранить изменения'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

