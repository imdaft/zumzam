'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Building2, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  ExternalLink,
  Mail,
  Phone,
  User,
  FileText,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ClaimRequest {
  id: string
  profile_id: string
  user_id: string
  contact_name: string
  contact_phone: string | null
  contact_email: string
  position: string | null
  proof_description: string
  proof_links: string[]
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  created_at: string
  updated_at: string
  profiles: {
    id: string
    slug: string
    display_name: string
    city: string
    category: string
    main_photo: string | null
    logo: string | null
  }
}

export default function ClaimRequestsPage() {
  const [requests, setRequests] = useState<ClaimRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [total, setTotal] = useState(0)

  // Модальное окно для отклонения
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ClaimRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Модальное окно подтверждения одобрения
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/claim-requests?status=${statusFilter}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки')
      }

      setRequests(data.requests || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      console.error('Error fetching claim requests:', err)
      setError(err.message || 'Ошибка загрузки заявок')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleApprove = async () => {
    if (!selectedRequest) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/claim-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          action: 'approve',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка одобрения')
      }

      setApproveDialogOpen(false)
      setSelectedRequest(null)
      fetchRequests()
    } catch (err: any) {
      console.error('Error approving request:', err)
      alert(err.message || 'Ошибка при одобрении заявки')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/admin/claim-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          action: 'reject',
          rejection_reason: rejectionReason.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка отклонения')
      }

      setRejectDialogOpen(false)
      setSelectedRequest(null)
      setRejectionReason('')
      fetchRequests()
    } catch (err: any) {
      console.error('Error rejecting request:', err)
      alert(err.message || 'Ошибка при отклонении заявки')
    } finally {
      setIsProcessing(false)
    }
  }

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      'venue': 'Студия',
      'animator': 'Аниматор',
      'show': 'Шоу',
      'quest': 'Квест',
      'master_class': 'Мастер-класс',
      'photographer': 'Фотограф',
      'agency': 'Агентство',
    }
    return map[cat] || cat
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">На рассмотрении</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Одобрена</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Отклонена</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-[#FF6B35]" />
            Заявки на владение профилями
          </h1>
          <p className="text-slate-500 mt-1">
            Модерация запросов на получение доступа к профилям бизнесов
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Фильтр по статусу" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">На рассмотрении</SelectItem>
              <SelectItem value="approved">Одобренные</SelectItem>
              <SelectItem value="rejected">Отклонённые</SelectItem>
              <SelectItem value="all">Все заявки</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchRequests}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Список заявок */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-700">{error}</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Нет заявок</h3>
          <p className="text-slate-500">
            {statusFilter === 'pending' 
              ? 'Нет заявок, ожидающих рассмотрения'
              : 'Заявки с выбранным статусом не найдены'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex gap-6">
                {/* Информация о профиле */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100">
                    {request.profiles?.logo || request.profiles?.main_photo ? (
                      <Image
                        src={request.profiles.logo || request.profiles.main_photo || ''}
                        alt={request.profiles.display_name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Основная информация */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">
                          {request.profiles?.display_name || 'Профиль удалён'}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {getCategoryLabel(request.profiles?.category || '')}
                        </span>
                        {request.profiles?.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {request.profiles.city}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(request.created_at)}
                        </span>
                      </div>
                    </div>

                    {request.profiles?.slug && (
                      <Link
                        href={`/profiles/${request.profiles.slug}`}
                        target="_blank"
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </Link>
                    )}
                  </div>

                  {/* Данные заявителя */}
                  <div className="bg-slate-50 rounded-xl p-4 mb-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Данные заявителя</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-600">{request.contact_name}</span>
                        {request.position && (
                          <span className="text-slate-400">({request.position})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <a
                          href={`mailto:${request.contact_email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {request.contact_email}
                        </a>
                      </div>
                      {request.contact_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <a
                            href={`tel:${request.contact_phone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {request.contact_phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Описание подтверждения */}
                  <div className="mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <p className="text-slate-600">{request.proof_description}</p>
                    </div>
                  </div>

                  {/* Ссылки для подтверждения */}
                  {request.proof_links && request.proof_links.length > 0 && (
                    <div className="flex items-start gap-2 text-sm mb-4">
                      <LinkIcon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-wrap gap-2">
                        {request.proof_links.map((link, index) => {
                          try {
                            return (
                              <a
                                key={index}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {new URL(link).hostname}
                              </a>
                            )
                          } catch {
                            return (
                              <span key={index} className="text-slate-400">{link}</span>
                            )
                          }
                        })}
                      </div>
                    </div>
                  )}

                  {/* Причина отклонения */}
                  {request.status === 'rejected' && request.rejection_reason && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700">
                      <strong>Причина отклонения:</strong> {request.rejection_reason}
                    </div>
                  )}

                  {/* Кнопки действий */}
                  {request.status === 'pending' && (
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                      <Button
                        onClick={() => {
                          setSelectedRequest(request)
                          setApproveDialogOpen(true)
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Одобрить
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(request)
                          setRejectDialogOpen(true)
                        }}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Отклонить
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Диалог подтверждения одобрения */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтвердите одобрение</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите передать профиль{' '}
              <strong>{selectedRequest?.profiles?.display_name}</strong> пользователю{' '}
              <strong>{selectedRequest?.contact_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={isProcessing}
            >
              Отмена
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Одобрить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог отклонения */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонение заявки</DialogTitle>
            <DialogDescription>
              Укажите причину отклонения заявки на профиль{' '}
              <strong>{selectedRequest?.profiles?.display_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Причина отклонения..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setRejectionReason('')
              }}
              disabled={isProcessing}
            >
              Отмена
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
              variant="destructive"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

