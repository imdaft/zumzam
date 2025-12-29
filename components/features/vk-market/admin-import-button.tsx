'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Loader2, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react'

interface VKMarketAdminImportProps {
  profileId: string
  onSuccess?: (count: number) => void
}

export function VKMarketAdminImport({ profileId, onSuccess }: VKMarketAdminImportProps) {
  const [vkUrl, setVkUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [importedCount, setImportedCount] = useState(0)
  
  const handleImport = async () => {
    if (!vkUrl) {
      setStatus('error')
      setMessage('Введите URL группы ВКонтакте')
      return
    }
    
    setLoading(true)
    setStatus('idle')
    
    try {
      // Админы используют dummy токен - верификация пропускается на бэкенде
      const response = await fetch('/api/vk-market/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vk_url: vkUrl,
          vk_access_token: 'admin_import', // Placeholder, не используется для админов
          profile_id: profileId,
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка импорта')
      }
      
      setStatus('success')
      setImportedCount(data.imported)
      setMessage(
        `Успешно импортировано ${data.imported} услуг из ${data.total_available} доступных (всего: ${data.total_found})`
      )
      onSuccess?.(data.imported)
      
      // Сбрасываем форму
      setVkUrl('')
      
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'Не удалось импортировать услуги')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      {/* Предупреждение для админа */}
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-900">Режим администратора</p>
          <p className="text-xs text-yellow-700 mt-1">
            Вы можете импортировать товары из любой группы VK без верификации владения. 
            Используйте эту возможность ответственно!
          </p>
        </div>
      </div>
      
      {/* Поле URL и кнопка */}
      <div className="flex gap-3">
        <Input
          type="url"
          value={vkUrl}
          onChange={(e) => setVkUrl(e.target.value)}
          placeholder="https://vk.com/market-53593965"
          className="flex-1 h-12 rounded-[16px]"
          disabled={loading}
        />
        <Button
          onClick={handleImport}
          disabled={loading || !vkUrl}
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
                Все услуги добавлены в профиль. Можно редактировать в разделе "Услуги".
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Подсказка */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-[16px]">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="flex-1">
            <p className="text-xs text-blue-800">
              <strong>Как использовать:</strong> Просто вставьте ссылку на раздел "Товары" группы ВКонтакте 
              и нажмите "Импортировать". Все товары автоматически добавятся в профиль.
              Верификация владения не требуется для администраторов.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
















