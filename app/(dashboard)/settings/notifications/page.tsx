'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { 
  Bell, Mail, MessageSquare as TelegramIcon,
  FileText, MessageCircle, Star, CreditCard, Shield, 
  Calendar, CheckCircle2, XCircle, Loader2, AlertCircle, Copy, Check, ArrowLeft
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface NotificationSettings {
  // Каналы
  enabled_site: boolean
  enabled_email: boolean
  enabled_telegram: boolean
  enabled_push: boolean
  
  // Типы уведомлений
  notify_new_order: boolean
  notify_order_accepted: boolean
  notify_order_rejected: boolean
  notify_order_completed: boolean
  notify_order_cancelled: boolean
  
  notify_new_response: boolean
  notify_response_accepted: boolean
  notify_response_rejected: boolean
  
  notify_new_message: boolean
  notify_new_review: boolean
  notify_payment_success: boolean
  notify_payment_failed: boolean
  
  notify_subscription_expiring: boolean
  notify_subscription_expired: boolean
  notify_subscription_renewed: boolean
  
  notify_profile_verified: boolean
  notify_profile_rejected: boolean
  
  notify_board_new_match: boolean
  
  // Метаданные
  telegram_chat_id?: string
  email_verified: boolean
  telegram_verified: boolean
}

export default function NotificationSettingsPage() {
  const { user, isProvider, isClient } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Email подтверждение
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [emailCode, setEmailCode] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  
  // Telegram подключение
  const [showTelegramDialog, setShowTelegramDialog] = useState(false)
  const [telegramCode, setTelegramCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null)

  // Загрузка настроек
  useEffect(() => {
    if (!user) return
    
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings/notifications')
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
          setTelegramUsername(data.telegram_username || null)
        } else if (response.status === 404) {
          // Создаем настройки по умолчанию
          const defaultSettings: NotificationSettings = {
            enabled_site: true,
            enabled_email: true,
            enabled_telegram: false,
            enabled_push: false,
            
            notify_new_order: true,
            notify_order_accepted: true,
            notify_order_rejected: true,
            notify_order_completed: true,
            notify_order_cancelled: true,
            
            notify_new_response: true,
            notify_response_accepted: true,
            notify_response_rejected: true,
            
            notify_new_message: true,
            notify_new_review: true,
            notify_payment_success: true,
            notify_payment_failed: true,
            
            notify_subscription_expiring: true,
            notify_subscription_expired: true,
            notify_subscription_renewed: true,
            
            notify_profile_verified: true,
            notify_profile_rejected: true,
            
            notify_board_new_match: true,
            
            email_verified: false,
            telegram_verified: false,
          }
          setSettings(defaultSettings)
          await saveSettings(defaultSettings)
        }
      } catch (error) {
        console.error('Error loading notification settings:', error)
        setError('Не удалось загрузить настройки')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadSettings()
  }, [user])

  const saveSettings = async (newSettings: NotificationSettings) => {
    setIsSaving(true)
    setError(null)
    setSuccess(false)
    
    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })
      
      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError('Ошибка сохранения настроек')
      }
    } catch (error) {
      console.error('Error saving notification settings:', error)
      setError('Ошибка сохранения настроек')
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    if (!settings) return
    
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    saveSettings(newSettings)
  }
  
  // Email подтверждение
  const sendEmailVerification = async () => {
    setIsSendingEmail(true)
    setError(null)
    
    try {
      const response = await fetch('/api/settings/notifications/email-verify', {
        method: 'POST',
      })
      
      if (response.ok) {
        setEmailSent(true)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Не удалось отправить письмо')
      }
    } catch (error) {
      console.error('Error sending verification email:', error)
      setError('Ошибка отправки письма')
    } finally {
      setIsSendingEmail(false)
    }
  }
  
  const verifyEmailCode = async () => {
    if (!emailCode.trim()) {
      setError('Введите код из письма')
      return
    }
    
    setIsVerifyingEmail(true)
    setError(null)
    
    try {
      const response = await fetch('/api/settings/notifications/email-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: emailCode }),
      })
      
      if (response.ok) {
        if (settings) {
          setSettings({ ...settings, email_verified: true })
        }
        setShowEmailDialog(false)
        setEmailSent(false)
        setEmailCode('')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Неверный код')
      }
    } catch (error) {
      console.error('Error verifying email code:', error)
      setError('Ошибка проверки кода')
    } finally {
      setIsVerifyingEmail(false)
    }
  }
  
  // Telegram подключение (используем существующую систему telegram_users)
  const generateTelegramCode = () => {
    // Открываем бота напрямую с параметром start=connect
    window.open('https://t.me/ZumZamRu_bot?start=connect', '_blank')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!settings) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Не удалось загрузить настройки уведомлений
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-0">
      {/* Header - мобильный с кнопкой назад */}
      <div className="mb-4 md:mb-6">
        <Link 
          href="/settings" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-3 md:mb-4 text-sm md:text-base"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Вернуться в настройки
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Настройки уведомлений</h1>
        <p className="text-gray-500 mt-1 md:mt-2 text-sm md:text-base">
          Управляйте способами получения уведомлений и выберите, о чём хотите узнавать
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <Alert className="mb-4 md:mb-6 border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 text-sm">
            Настройки успешно сохранены
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-4 md:mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 md:space-y-6">
        {/* Каналы доставки */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-3 md:p-6">
          <h2 className="text-sm md:text-lg font-semibold text-gray-900 mb-2 md:mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
            Каналы доставки
          </h2>
          <p className="text-[11px] md:text-sm text-gray-500 mb-3 md:mb-6">
            Выберите, где вы хотите получать уведомления. Push-уведомления доступны только в мобильном приложении.
          </p>

          <div className="space-y-2">
            {/* Сайт */}
            <div className="flex items-center justify-between p-2.5 md:p-4 rounded-lg md:rounded-xl bg-gray-50 transition-colors">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                  <Bell className="h-3.5 w-3.5 md:h-5 md:w-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-xs md:text-base leading-tight">На сайте</p>
                  <p className="text-[10px] md:text-sm text-gray-500 truncate leading-tight">Уведомления в интерфейсе ZumZam</p>
                </div>
              </div>
              <Switch
                checked={settings.enabled_site}
                onCheckedChange={(checked) => updateSetting('enabled_site', checked)}
                disabled={isSaving}
                className="ml-2 shrink-0 scale-90 md:scale-100"
              />
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-2.5 md:p-4 rounded-lg md:rounded-xl bg-gray-50 transition-colors">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Mail className="h-3.5 w-3.5 md:h-5 md:w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-xs md:text-base leading-tight">Email</p>
                  <p className="text-[10px] md:text-sm text-gray-500 truncate leading-tight">
                    {settings.email_verified 
                      ? 'Подтверждён' 
                      : 'Требуется подтверждение'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                {!settings.email_verified && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3"
                    onClick={() => setShowEmailDialog(true)}
                  >
                    Подтвердить
                  </Button>
                )}
                <Switch
                  checked={settings.enabled_email}
                  onCheckedChange={(checked) => updateSetting('enabled_email', checked)}
                  disabled={isSaving || !settings.email_verified}
                  className="scale-90 md:scale-100"
                />
              </div>
            </div>

            {/* Telegram */}
            <div className="flex items-center justify-between p-2.5 md:p-4 rounded-lg md:rounded-xl bg-gray-50 transition-colors">
              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                  <TelegramIcon className="h-3.5 w-3.5 md:h-5 md:w-5 text-sky-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-xs md:text-base leading-tight">Telegram</p>
                  <p className="text-[10px] md:text-sm text-gray-500 truncate leading-tight">
                    {settings.telegram_verified 
                      ? `@ZumZamRu_bot${telegramUsername ? ` (${telegramUsername})` : ''}` 
                      : 'Подключите бота'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                {!settings.telegram_verified ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3"
                    onClick={generateTelegramCode}
                  >
                    Подключить
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={async () => {
                      if (confirm('Отключить Telegram бот?')) {
                        await fetch('/api/settings/notifications/telegram-disconnect', { method: 'POST' })
                        if (settings) {
                          setSettings({ ...settings, telegram_verified: false })
                          setTelegramUsername(null)
                        }
                      }
                    }}
                  >
                    Отключить
                  </Button>
                )}
                <Switch
                  checked={settings.enabled_telegram}
                  onCheckedChange={(checked) => updateSetting('enabled_telegram', checked)}
                  disabled={isSaving || !settings.telegram_verified}
                  className="scale-90 md:scale-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Заявки и заказы */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
            Заявки и заказы
          </h2>

          <div className="space-y-2 md:space-y-3">
            {isProvider && (
              <SettingItem
                label="Новая заявка"
                description="Когда клиент создает новую заявку"
                checked={settings.notify_new_order}
                onChange={(checked) => updateSetting('notify_new_order', checked)}
                disabled={isSaving}
              />
            )}
            
            {isClient && (
              <SettingItem
                label="Новый отклик"
                description="Когда исполнитель откликнулся на ваше объявление"
                checked={settings.notify_new_response}
                onChange={(checked) => updateSetting('notify_new_response', checked)}
                disabled={isSaving}
              />
            )}
            
            <SettingItem
              label="Заявка принята"
              description="Когда ваша заявка или отклик приняты"
              checked={settings.notify_order_accepted}
              onChange={(checked) => updateSetting('notify_order_accepted', checked)}
              disabled={isSaving}
            />
            
            <SettingItem
              label="Заявка отклонена"
              description="Когда ваша заявка или отклик отклонены"
              checked={settings.notify_order_rejected}
              onChange={(checked) => updateSetting('notify_order_rejected', checked)}
              disabled={isSaving}
            />
            
            <SettingItem
              label="Заказ завершён"
              description="Когда заказ завершён"
              checked={settings.notify_order_completed}
              onChange={(checked) => updateSetting('notify_order_completed', checked)}
              disabled={isSaving}
            />
            
            <SettingItem
              label="Заказ отменён"
              description="Когда заказ отменён"
              checked={settings.notify_order_cancelled}
              onChange={(checked) => updateSetting('notify_order_cancelled', checked)}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Сообщения и отзывы */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
            Сообщения и отзывы
          </h2>

          <div className="space-y-2 md:space-y-3">
            <SettingItem
              label="Новое сообщение"
              description="Когда вам пишут в чате"
              checked={settings.notify_new_message}
              onChange={(checked) => updateSetting('notify_new_message', checked)}
              disabled={isSaving}
            />
            
            <SettingItem
              label="Новый отзыв"
              description="Когда оставляют отзыв на ваш профиль"
              checked={settings.notify_new_review}
              onChange={(checked) => updateSetting('notify_new_review', checked)}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Платежи и подписки */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
            Платежи и подписки
          </h2>

          <div className="space-y-2 md:space-y-3">
            <SettingItem
              label="Успешная оплата"
              description="Подтверждение оплаты"
              checked={settings.notify_payment_success}
              onChange={(checked) => updateSetting('notify_payment_success', checked)}
              disabled={isSaving}
            />
            
            <SettingItem
              label="Ошибка оплаты"
              description="Когда не удалось обработать платёж"
              checked={settings.notify_payment_failed}
              onChange={(checked) => updateSetting('notify_payment_failed', checked)}
              disabled={isSaving}
            />
            
            <SettingItem
              label="Подписка заканчивается"
              description="За 3 дня до окончания подписки"
              checked={settings.notify_subscription_expiring}
              onChange={(checked) => updateSetting('notify_subscription_expiring', checked)}
              disabled={isSaving}
            />
            
            <SettingItem
              label="Подписка истекла"
              description="Когда подписка закончилась"
              checked={settings.notify_subscription_expired}
              onChange={(checked) => updateSetting('notify_subscription_expired', checked)}
              disabled={isSaving}
            />
            
            <SettingItem
              label="Подписка продлена"
              description="Когда подписка успешно продлена"
              checked={settings.notify_subscription_renewed}
              onChange={(checked) => updateSetting('notify_subscription_renewed', checked)}
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Профиль */}
        {isProvider && (
          <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-4 md:p-6">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 md:h-5 md:w-5 text-indigo-500" />
              Профиль и верификация
            </h2>

            <div className="space-y-2 md:space-y-3">
              <SettingItem
                label="Профиль верифицирован"
                description="Когда ваш профиль прошёл проверку"
                checked={settings.notify_profile_verified}
                onChange={(checked) => updateSetting('notify_profile_verified', checked)}
                disabled={isSaving}
              />
              
              <SettingItem
                label="Профиль отклонён"
                description="Когда профиль не прошёл проверку"
                checked={settings.notify_profile_rejected}
                onChange={(checked) => updateSetting('notify_profile_rejected', checked)}
                disabled={isSaving}
              />
            </div>
          </div>
        )}

        {/* Доска объявлений */}
        <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
            Доска объявлений
          </h2>

          <div className="space-y-2 md:space-y-3">
            <SettingItem
              label="Новое объявление по подписке"
              description="Когда на доске появляется объявление, соответствующее вашим интересам"
              checked={settings.notify_board_new_match}
              onChange={(checked) => updateSetting('notify_board_new_match', checked)}
              disabled={isSaving}
            />
          </div>
        </div>
      </div>
      
      {/* Email подтверждение диалог */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              Подтверждение Email
            </DialogTitle>
            <DialogDescription>
              {!emailSent 
                ? `Мы отправим код подтверждения на ${user?.email}`
                : 'Введите код из письма'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!emailSent ? (
              <Button
                onClick={sendEmailVerification}
                disabled={isSendingEmail}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  'Отправить код'
                )}
              </Button>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Код подтверждения
                  </label>
                  <Input
                    type="text"
                    placeholder="Введите код из письма"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    className="text-center text-lg tracking-wider"
                    maxLength={6}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEmailSent(false)
                      setEmailCode('')
                    }}
                    className="flex-1"
                  >
                    Отправить заново
                  </Button>
                  <Button
                    onClick={verifyEmailCode}
                    disabled={isVerifyingEmail || !emailCode}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                  >
                    {isVerifyingEmail ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Проверка...
                      </>
                    ) : (
                      'Подтвердить'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Компонент для отдельной настройки
function SettingItem({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled: boolean
}) {
  return (
    <div className="flex items-start justify-between py-2 md:py-3">
      <div className="flex-1 pr-3">
        <p className="font-medium text-gray-900 text-xs md:text-sm">{label}</p>
        <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="shrink-0"
      />
    </div>
  )
}

