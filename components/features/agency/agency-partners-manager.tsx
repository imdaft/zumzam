'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Loader2, Users } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import Image from 'next/image'
import { toast } from 'sonner'

interface AgencyPartnersManagerProps {
  profileId: string
}

interface Partner {
  id: string
  partner_profile_id: string | null
  custom_name: string | null
  custom_specialization: string | null
  custom_photo: string | null
  is_active: boolean
  created_at: string
}

export function AgencyPartnersManager({ profileId }: AgencyPartnersManagerProps) {
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    
    const fetchPartners = async () => {
      setIsLoading(true)
      try {
        // Используем API route вместо прямого Supabase client (чтобы избежать зависания)
        const response = await fetch(`/api/agency-partners?profile_id=${profileId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch partners: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (isMounted) {
          setPartners(data || [])
        }
      } catch (error) {
        console.error('[AgencyPartners] Error:', error)
        toast.error('Не удалось загрузить партнеров')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchPartners()
    return () => { isMounted = false }
  }, [profileId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                Наши специалисты
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Добавьте специалистов вашей команды
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {partners.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-[24px]">
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-base font-semibold text-slate-900 mb-2">Нет специалистов</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Добавьте специалистов и партнеров вашего агентства
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {partners.map((partner) => (
                <Card key={partner.id} className="rounded-[28px] border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {partner.custom_photo && (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-100 shrink-0">
                          <Image src={partner.custom_photo} alt={partner.custom_name || ''} fill className="object-cover" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{partner.custom_name || 'Без имени'}</h3>
                        {partner.custom_specialization && (
                          <p className="text-sm text-slate-600 mb-3">{partner.custom_specialization}</p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.info('Функция редактирования в разработке')}
                            className="rounded-full"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1.5" />
                            Редактировать
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toast.info('Функция удаления в разработке')}
                            className="rounded-full text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}










