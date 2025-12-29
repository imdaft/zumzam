'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Download, Loader2, CheckCircle2, AlertCircle, ShieldCheck, ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface VKMarketImportProps {
  profileId: string
  onSuccess?: (count: number) => void
}

export function VKMarketImport({ profileId, onSuccess }: VKMarketImportProps) {
  const [vkUrl, setVkUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [importedCount, setImportedCount] = useState(0)
  
  // Terms of Service
  const [showTerms, setShowTerms] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  
  // OAuth
  const [vkAccessToken, setVkAccessToken] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  // Проверяем OAuth callback из URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const vkToken = params.get('vk_token')
    const vkAuth = params.get('vk_auth')
    const vkError = params.get('vk_error')
    
    if (vkToken) {
      setVkAccessToken(vkToken)
      setIsAuthorized(true)
      setStatus('idle')
      setMessage('')
      
      // Очищаем URL от параметров
      window.history.replaceState({}, '', window.location.pathname)
    }
    
    if (vkAuth === 'success') {
      setStatus('idle')
    }
    
    if (vkError) {
      setStatus('error')
      setMessage(`Ошибка авторизации: ${decodeURIComponent(vkError)}`)
    }
  }, [])
  
  // OAuth авторизация
  const handleVKAuth = () => {
    if (!vkUrl) {
      setStatus('error')
      setMessage('Сначала введите URL группы ВКонтакте')
      return
    }
    
    if (!acceptedTerms) {
      setStatus('error')
      setMessage('Необходимо принять условия использования')
      return
    }
    
    // Формируем URL для OAuth
    const VK_APP_ID = process.env.NEXT_PUBLIC_VK_APP_ID || '52761453' // Замени на свой
    const REDIRECT_URI = `${window.location.origin}/api/vk-oauth/callback`
    
    const authUrl = `https://oauth.vk.com/authorize?` +
      `client_id=${VK_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=groups,market` +
      `&response_type=code` +
      `&v=5.131`
    
    // Редирект на VK OAuth
    window.location.href = authUrl
  }
  
  // Импорт товаров
  const handleImport = async () => {
    if (!vkUrl) {
      setStatus('error')
      setMessage('Введите URL группы ВКонтакте')
      return
    }
    
    if (!vkAccessToken) {
      setStatus('error')
      setMessage('Сначала авторизуйтесь через ВКонтакте')
      return
    }
    
    setLoading(true)
    setStatus('idle')
    
    try {
      const response = await fetch('/api/vk-market/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vk_url: vkUrl,
          vk_access_token: vkAccessToken,
          profile_id: profileId,
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        if (data.verification_failed) {
          // Сбрасываем OAuth если верификация не прошла
          setIsAuthorized(false)
          setVkAccessToken(null)
        }
        
        if (response.status === 429) {
          // Лимит импортов
          throw new Error(data.details || data.error)
        }
        
        throw new Error(data.error || 'Ошибка импорта')
      }
      
      setStatus('success')
      setImportedCount(data.imported)
      setMessage(
        `Успешно импортировано ${data.imported} услуг из ${data.total_available} доступных (всего в группе: ${data.total_found})`
      )
      onSuccess?.(data.imported)
      
      // Сбрасываем форму
      setVkUrl('')
      setIsAuthorized(false)
      setVkAccessToken(null)
      
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'Не удалось импортировать услуги')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      {/* Поле URL */}
      <div className="space-y-3">
        <Input
          type="url"
          value={vkUrl}
          onChange={(e) => setVkUrl(e.target.value)}
          placeholder="https://vk.com/market-53593965"
          className="h-12 rounded-[16px]"
          disabled={loading}
        />
        
        {/* Terms of Service Checkbox */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            disabled={loading}
          />
          <label
            htmlFor="terms"
            className="text-sm text-gray-600 leading-tight cursor-pointer"
          >
            Я подтверждаю, что являюсь владельцем или администратором указанной группы и согласен с{' '}
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="text-blue-600 hover:underline"
            >
              условиями использования
            </button>
          </label>
        </div>
      </div>
      
      {/* Кнопки */}
      <div className="flex gap-3">
        {!isAuthorized ? (
          <Button
            onClick={handleVKAuth}
            disabled={loading || !vkUrl || !acceptedTerms}
            className="flex-1 h-12 rounded-[16px]"
          >
            <ShieldCheck className="w-5 h-5 mr-2" />
            Авторизоваться через VK
          </Button>
        ) : (
          <>
            <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-[16px]">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              <span className="text-sm text-green-900 font-medium">
                Авторизация подтверждена
              </span>
            </div>
            <Button
              onClick={handleImport}
              disabled={loading}
              className="shrink-0 h-12 px-6 rounded-[16px] bg-orange-500 hover:bg-orange-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Импорт...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Импортировать
                </>
              )}
            </Button>
          </>
        )}
      </div>
      
      {/* Статус */}
      {status !== 'idle' && (
        <div className={`p-4 rounded-[16px] flex items-start gap-3 ${
          status === 'success' 
            ? 'bg-green-50 text-green-900 border border-green-200'
            : 'bg-red-50 text-red-900 border border-red-200'
        }`}>
          {status === 'success' ? (
            <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">{message}</p>
            {status === 'success' && importedCount > 0 && (
              <p className="text-xs text-green-700 mt-1">
                Все услуги добавлены в ваш профиль. Вы можете отредактировать их в разделе "Услуги".
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Подсказка */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-[16px]">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="flex-1 space-y-2">
            <p className="text-sm text-blue-900 font-medium">
              Как это работает:
            </p>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Вставьте ссылку на раздел "Товары" вашей группы ВКонтакте</li>
              <li>Авторизуйтесь через VK (мы проверим, что вы администратор группы)</li>
              <li>Нажмите "Импортировать" - все товары автоматически добавятся в профиль</li>
            </ol>
            <a
              href="https://vk.com/faq18062"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-2"
            >
              Как найти ссылку на товары VK
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
      
      {/* Terms of Service Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Условия использования импорта из ВКонтакте</DialogTitle>
            <DialogDescription>
              Пожалуйста, внимательно прочитайте условия перед использованием
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Используя функцию импорта, вы подтверждаете, что:</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>Вы являетесь владельцем или администратором указанной группы ВКонтакте</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>У вас есть права на использование всех фотографий и описаний товаров</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>Вы не нарушаете авторские права третьих лиц</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>Импортируемый контент не содержит ложной или вводящей в заблуждение информации</span>
                </li>
              </ul>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2 text-red-900">Последствия нарушений:</h3>
              <ul className="space-y-2 ml-4 text-red-800">
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Блокировка профиля без предупреждения</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Удаление всего импортированного контента</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Бан аккаунта без возможности восстановления</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Передача данных правоохранительным органам (при мошенничестве)</span>
                </li>
              </ul>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Ограничения:</h3>
              <ul className="space-y-1 ml-4">
                <li>• Максимум 1 импорт в день на пользователя</li>
                <li>• Только товары из групп, где вы являетесь администратором</li>
                <li>• Автоматическая верификация владения через VK OAuth</li>
              </ul>
            </div>
            
            <div className="pt-4 border-t bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-600">
                Нажимая "Принять", вы соглашаетесь с этими условиями и берёте на себя полную ответственность 
                за импортируемый контент.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowTerms(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={() => {
                setAcceptedTerms(true)
                setShowTerms(false)
              }}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Принять условия
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
















