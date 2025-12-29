/**
 * Компонент для отображения вложений к заказу
 * Красивые карточки для файлов, ссылок, промокодов
 */

'use client'

import { useState, useEffect } from 'react'
import { 
  FileText, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Gift, 
  Download, 
  ExternalLink,
  Copy,
  Loader2,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Attachment {
  id: string
  type: 'file' | 'image' | 'link' | 'promo_code' | 'document'
  title: string
  description?: string
  url?: string
  file_name?: string
  file_size?: number
  promo_code?: string
  promo_expires_at?: string
  uploader_role: 'client' | 'provider'
  created_at: string
}

interface OrderAttachmentsProps {
  orderId: string
  currentUserRole: 'client' | 'provider'
  onDelete?: () => void
}

export function OrderAttachments({ orderId, currentUserRole, onDelete }: OrderAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAttachments()
  }, [orderId])

  const fetchAttachments = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/attachments`)
      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      setAttachments(data.attachments || [])
    } catch (error) {
      console.error('Fetch attachments error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAttachment = async (attachmentId: string) => {
    try {
      const response = await fetch(
        `/api/orders/${orderId}/attachments?attachment_id=${attachmentId}`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) throw new Error('Failed to delete')
      
      toast.success('Вложение удалено')
      fetchAttachments()
      if (onDelete) onDelete()
    } catch (error) {
      toast.error('Ошибка удаления')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Скопировано!')
    } catch (error) {
      toast.error('Ошибка копирования')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5" strokeWidth={2.5} />
      case 'link':
        return <LinkIcon className="w-5 h-5" strokeWidth={2.5} />
      case 'promo_code':
        return <Gift className="w-5 h-5" strokeWidth={2.5} />
      default:
        return <FileText className="w-5 h-5" strokeWidth={2.5} />
    }
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      file: 'Файл',
      image: 'Изображение',
      link: 'Ссылка',
      promo_code: 'Промокод',
      document: 'Документ',
    }
    return labels[type as keyof typeof labels] || 'Файл'
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Нет вложений
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {attachments.map((attachment) => {
        const isOwner = attachment.uploader_role === currentUserRole

        return (
          <div
            key={attachment.id}
            className="bg-white rounded-[16px] shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Иконка */}
              <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${
                attachment.type === 'promo_code' ? 'bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600' :
                attachment.type === 'image' ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600' :
                attachment.type === 'link' ? 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {getIcon(attachment.type)}
              </div>

              {/* Контент */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-gray-900 truncate">
                      {attachment.title}
                    </h5>
                    {attachment.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {attachment.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(attachment.type)}
                      </Badge>
                      {attachment.uploader_role === 'provider' && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          От студии
                        </Badge>
                      )}
                      <span className="text-xs text-gray-500">
                        {format(new Date(attachment.created_at), 'd MMM yyyy', { locale: ru })}
                      </span>
                      {attachment.file_size && (
                        <span className="text-xs text-gray-500">
                          {formatFileSize(attachment.file_size)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex items-center gap-2 shrink-0">
                    {attachment.type === 'promo_code' && attachment.promo_code && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(attachment.promo_code!)}
                        className="rounded-[12px]"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Копировать
                      </Button>
                    )}
                    
                    {attachment.type === 'link' && attachment.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(attachment.url, '_blank')}
                        className="rounded-[12px]"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Открыть
                      </Button>
                    )}
                    
                    {(attachment.type === 'file' || attachment.type === 'document' || attachment.type === 'image') && attachment.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(attachment.url, '_blank')}
                        className="rounded-[12px]"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Скачать
                      </Button>
                    )}

                    {isOwner && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteAttachment(attachment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-[12px]"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Превью для изображений */}
                {attachment.type === 'image' && attachment.url && (
                  <div className="mt-3 rounded-[12px] overflow-hidden">
                    <img
                      src={attachment.url}
                      alt={attachment.title}
                      className="w-full max-h-[200px] object-cover"
                    />
                  </div>
                )}

                {/* Промокод */}
                {attachment.type === 'promo_code' && attachment.promo_code && (
                  <div className="mt-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-[12px] p-3">
                    <div className="flex items-center justify-between">
                      <code className="text-lg font-bold text-orange-900">
                        {attachment.promo_code}
                      </code>
                      {attachment.promo_expires_at && (
                        <span className="text-xs text-orange-700">
                          До {format(new Date(attachment.promo_expires_at), 'd MMM yyyy', { locale: ru })}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

