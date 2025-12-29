/**
 * Форма для добавления вложений к заказу
 * Поддерживает: файлы, ссылки, промокоды
 */

'use client'

import { useState } from 'react'
import { 
  Upload, 
  Link as LinkIcon, 
  Gift, 
  FileText, 
  Image as ImageIcon,
  X,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface AddAttachmentFormProps {
  orderId: string
  onSuccess?: () => void
}

export function AddAttachmentForm({ orderId, onSuccess }: AddAttachmentFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<'file' | 'link' | 'promo_code'>('link')
  const [isUploading, setIsUploading] = useState(false)
  
  // Поля формы
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoExpiresAt, setPromoExpiresAt] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setUrl('')
    setPromoCode('')
    setPromoExpiresAt('')
    setFile(null)
  }

  const handleSubmit = async () => {
    if (!title) {
      toast.error('Укажите название')
      return
    }

    if (type === 'link' && !url) {
      toast.error('Укажите ссылку')
      return
    }

    if (type === 'promo_code' && !promoCode) {
      toast.error('Укажите промокод')
      return
    }

    if (type === 'file' && !file) {
      toast.error('Выберите файл')
      return
    }

    setIsUploading(true)

    try {
      let fileUrl = url

      // Если это файл - загружаем через API
      if (type === 'file' && file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('bucket', 'portfolio')

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('Ошибка загрузки файла')
        }

        const uploadData = await uploadResponse.json()
        fileUrl = uploadData.url
      }

      // Определяем тип вложения
      let attachmentType = type
      if (type === 'file' && file) {
        if (file.type.startsWith('image/')) {
          attachmentType = 'image'
        } else {
          attachmentType = 'document'
        }
      }

      // Создаём вложение через API
      const response = await fetch(`/api/orders/${orderId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: attachmentType,
          title,
          description,
          url: fileUrl,
          file_name: file?.name,
          file_size: file?.size,
          mime_type: file?.type,
          promo_code: type === 'promo_code' ? promoCode : null,
          promo_expires_at: type === 'promo_code' && promoExpiresAt ? promoExpiresAt : null,
        }),
      })

      if (!response.ok) throw new Error('Failed to create attachment')

      toast.success('Вложение добавлено!')
      resetForm()
      setIsOpen(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error('Ошибка загрузки', { description: error.message })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="rounded-[12px]"
        >
          <Upload className="w-4 h-4 mr-2" />
          Добавить вложение
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-[24px]">
        <DialogHeader>
          <DialogTitle>Добавить вложение</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Выбор типа */}
          <div>
            <Label>Тип вложения</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                type="button"
                variant={type === 'link' ? 'default' : 'outline'}
                onClick={() => setType('link')}
                className="rounded-[12px] flex-col h-auto py-3"
              >
                <LinkIcon className="w-5 h-5 mb-1" />
                <span className="text-xs">Ссылка</span>
              </Button>
              <Button
                type="button"
                variant={type === 'file' ? 'default' : 'outline'}
                onClick={() => setType('file')}
                className="rounded-[12px] flex-col h-auto py-3"
              >
                <FileText className="w-5 h-5 mb-1" />
                <span className="text-xs">Файл</span>
              </Button>
              <Button
                type="button"
                variant={type === 'promo_code' ? 'default' : 'outline'}
                onClick={() => setType('promo_code')}
                className="rounded-[12px] flex-col h-auto py-3"
              >
                <Gift className="w-5 h-5 mb-1" />
                <span className="text-xs">Промокод</span>
              </Button>
            </div>
          </div>

          {/* Название */}
          <div>
            <Label htmlFor="title">Название *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === 'link' ? 'Приглашение на праздник' :
                type === 'promo_code' ? 'Скидка 20%' :
                'Памятка для родителей'
              }
              className="rounded-[12px] mt-2"
            />
          </div>

          {/* Описание */}
          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Дополнительная информация..."
              className="rounded-[12px] mt-2"
              rows={2}
            />
          </div>

          {/* Поля для ссылки */}
          {type === 'link' && (
            <div>
              <Label htmlFor="url">Ссылка *</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="rounded-[12px] mt-2"
              />
            </div>
          )}

          {/* Поля для промокода */}
          {type === 'promo_code' && (
            <>
              <div>
                <Label htmlFor="promo_code">Промокод *</Label>
                <Input
                  id="promo_code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="KIDS2024"
                  className="rounded-[12px] mt-2 font-mono font-bold"
                />
              </div>
              <div>
                <Label htmlFor="promo_expires">Срок действия (опционально)</Label>
                <Input
                  id="promo_expires"
                  type="date"
                  value={promoExpiresAt}
                  onChange={(e) => setPromoExpiresAt(e.target.value)}
                  className="rounded-[12px] mt-2"
                />
              </div>
            </>
          )}

          {/* Поля для файла */}
          {type === 'file' && (
            <div>
              <Label htmlFor="file">Файл *</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="rounded-[12px] mt-2"
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              {file && (
                <p className="text-xs text-gray-500 mt-2">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={isUploading}
              className="flex-1 rounded-[12px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Добавить
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
              className="rounded-[12px]"
            >
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

