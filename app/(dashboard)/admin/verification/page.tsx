/**
 * Страница верификации профилей для админа
 * Показывает список профилей на проверке и позволяет одобрить/отклонить
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, ExternalLink, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function AdminVerificationPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const loadProfiles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/verification/pending')
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles || [])
      }
    } catch (error) {
      console.error('Load profiles error:', error)
      toast.error('Ошибка загрузки профилей')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  const handleApprove = async (profileId: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/profiles/${profileId}/verification`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (!response.ok) {
        throw new Error('Failed to approve')
      }

      toast.success('Профиль одобрен!')
      loadProfiles()
    } catch (error) {
      console.error('Approve error:', error)
      toast.error('Ошибка одобрения')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedProfile || !rejectionReason.trim()) {
      toast.error('Укажите причину отклонения')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/profiles/${selectedProfile.id}/verification`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejectionReason: rejectionReason.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to reject')
      }

      toast.success('Профиль отклонён')
      setShowRejectDialog(false)
      setSelectedProfile(null)
      setRejectionReason('')
      loadProfiles()
    } catch (error) {
      console.error('Reject error:', error)
      toast.error('Ошибка отклонения')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Верификация профилей</h1>
          <p className="text-gray-500 mt-2">
            Профилей на проверке: <strong>{profiles.length}</strong>
          </p>
        </div>
      </div>

      {profiles.length === 0 ? (
        <Card className="p-12 rounded-[24px] text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Нет профилей на проверке
          </h3>
          <p className="text-gray-500">
            Все заявки обработаны
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile) => (
            <Card key={profile.id} className="p-6 rounded-[24px] border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-6">
                {/* Аватарка профиля */}
                <div className="relative w-24 h-24 rounded-[16px] bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {profile.main_photo || profile.logo ? (
                    <img 
                      src={profile.main_photo || profile.logo} 
                      alt={profile.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-gray-400">
                      {profile.display_name?.[0] || '?'}
                    </span>
                  )}
                </div>

                {/* Информация */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {profile.display_name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {profile.city} • Отправлено {format(new Date(profile.updated_at), 'd MMM yyyy в HH:mm', { locale: ru })}
                      </p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 border-0">
                      На проверке
                    </Badge>
                  </div>

                  {/* Краткая информация */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-sm">
                      <span className="text-gray-500">Телефон:</span> 
                      <span className="ml-2 text-gray-900">{profile.phone || '—'}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Email:</span> 
                      <span className="ml-2 text-gray-900">{profile.email || '—'}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Категория:</span> 
                      <span className="ml-2 text-gray-900">{profile.category || '—'}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Slug:</span> 
                      <span className="ml-2 text-gray-900">{profile.slug || '—'}</span>
                    </div>
                  </div>

                  {/* Описание */}
                  {profile.description && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-[12px]">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {profile.description}
                      </p>
                    </div>
                  )}

                  {/* Действия */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => handleApprove(profile.id)}
                      disabled={isProcessing}
                      className="rounded-[12px] bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Одобрить
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedProfile(profile)
                        setShowRejectDialog(true)
                      }}
                      disabled={isProcessing}
                      variant="outline"
                      className="rounded-[12px]"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Отклонить
                    </Button>
                    <Link 
                      href={`/profiles/${profile.slug}`}
                      target="_blank"
                      className="ml-auto"
                    >
                      <Button variant="ghost" size="sm" className="rounded-[12px]">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Открыть профиль
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Диалог отклонения */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="rounded-[24px]">
          <DialogHeader>
            <DialogTitle>Отклонить верификацию</DialogTitle>
            <DialogDescription>
              Укажите причину отклонения. Пользователь увидит это сообщение.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Например: Не все фотографии соответствуют тематике, недостаточно информации в описании..."
              className="min-h-[120px] rounded-[16px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              className="rounded-[12px]"
            >
              Отмена
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isProcessing}
              className="rounded-[12px] bg-red-500 hover:bg-red-600"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Отклонение...
                </>
              ) : (
                'Отклонить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

