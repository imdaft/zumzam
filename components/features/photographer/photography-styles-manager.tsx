'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Loader2, Camera } from 'lucide-react'
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

interface PhotographyStylesManagerProps {
  profileId: string
}

interface PhotographyStyle {
  id: string
  style: string
  title: string
  description: string | null
  photos: string[]
  base_price: number | null
  duration: number | null
  photo_count: string | null
  is_active: boolean
  created_at: string
}

const STYLE_LABELS: Record<string, string> = {
  portrait: 'Портретная',
  family: 'Семейная',
  children: 'Детская',
  event: 'Событийная',
  wedding: 'Свадебная',
  love_story: 'Love Story',
  product: 'Предметная',
  reportage: 'Репортажная',
  studio: 'Студийная',
  outdoor: 'Уличная',
  other: 'Другое'
}

export function PhotographyStylesManager({ profileId }: PhotographyStylesManagerProps) {
  const [styles, setStyles] = useState<PhotographyStyle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStyle, setEditingStyle] = useState<PhotographyStyle | null>(null)

  const fetchStyles = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/photography-styles?profile_id=${profileId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load styles: ${response.statusText}`)
      }
      
      const data = await response.json()
      const stylesList = Array.isArray(data) ? data : (data.styles || [])
      setStyles(stylesList)
    } catch (error) {
      console.error('[PhotographyStyles] Error:', error)
      toast.error('Не удалось загрузить стили')
    } finally {
      setIsLoading(false)
    }
  }, [profileId])

  useEffect(() => {
    fetchStyles()
  }, [fetchStyles])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/photography-styles/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete')
      }

      await fetchStyles()
      toast.success('Стиль удален')
    } catch (error) {
      toast.error('Не удалось удалить стиль')
    } finally {
      setDeletingId(null)
    }
  }

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
                <Camera className="w-5 h-5 text-orange-500" />
                Стили съемки
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Добавьте стили фотосессий, которые вы предлагаете
              </p>
            </div>
            <Button 
              onClick={() => setIsFormOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить стиль
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {styles.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-[24px]">
              <Camera className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-base font-semibold text-slate-900 mb-2">Нет стилей съемки</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Добавьте стили фотосессий, которые вы проводите
              </p>
              <Button 
                onClick={() => setIsFormOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 rounded-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить первый стиль
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {styles.map((style) => (
                <Card key={style.id} className="rounded-[28px] border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {style.photos?.[0] && (
                        <div className="relative w-24 h-24 rounded-[24px] overflow-hidden bg-slate-100 shrink-0">
                          <Image src={style.photos[0]} alt={style.title} fill className="object-cover" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{style.title}</h3>
                        <p className="text-xs text-slate-500 mb-2">
                          {STYLE_LABELS[style.style] || style.style}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-3 text-xs">
                          {style.base_price && (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-semibold">
                              от {style.base_price.toLocaleString('ru-RU')} ₽
                            </span>
                          )}
                          {style.duration && (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-semibold">
                              {style.duration} мин
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(style)}
                            className="rounded-full"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1.5" />
                            Редактировать
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingId(style.id)}
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

      {/* Delete Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить стиль съемки?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-red-600 hover:bg-red-700 rounded-full"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}





