'use client'

import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import Link from 'next/link'
import { FileText, Trash2, Clock, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProfileDrafts, type ProfileDraft } from '@/hooks/use-profile-drafts'
import { useState } from 'react'
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

const categoryNames: Record<string, string> = {
  venue: 'Площадка',
  animator: 'Аниматор',
  show: 'Шоу-программа',
  agency: 'Агентство',
  quest: 'Квест',
  master_class: 'Мастер-класс',
  photographer: 'Фото/Видео',
}

export function ProfileDraftsList() {
  const { drafts, deleteDraft, clearAllDrafts } = useProfileDrafts()
  const [draftToDelete, setDraftToDelete] = useState<ProfileDraft | null>(null)
  const [showClearAll, setShowClearAll] = useState(false)

  if (drafts.length === 0) return null

  // Сортируем по дате обновления (новые первыми) и показываем только последние 10
  const sortedDrafts = [...drafts]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 10)

  const handleDelete = () => {
    if (draftToDelete) {
      console.log('[ProfileDraftsList] Deleting draft:', draftToDelete.id, draftToDelete.data.display_name)
      deleteDraft(draftToDelete.id)
      setDraftToDelete(null)
      console.log('[ProfileDraftsList] Draft deleted and dialog closed')
    }
  }

  const handleClearAll = () => {
    clearAllDrafts()
    setShowClearAll(false)
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between px-3 sm:px-0">
          <h2 className="text-base font-semibold text-gray-900">
            Незавершённые черновики ({drafts.length})
            {drafts.length > 10 && (
              <span className="text-xs font-normal text-gray-500 ml-1">
                (показано последние 10)
              </span>
            )}
          </h2>
          {drafts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearAll(true)}
              className="text-xs text-gray-500 hover:text-red-600 h-7 px-2"
            >
              Очистить все
            </Button>
          )}
        </div>
        
        {sortedDrafts.map((draft) => (
          <div
            key={draft.id}
            className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-[16px] sm:rounded-[20px] border border-orange-200 p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-orange-200 text-orange-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-gray-900 mb-1">
                  {draft.data.display_name || 'Новый профиль'}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                  <span className="px-2 py-0.5 bg-white/80 rounded-full font-medium">
                    {categoryNames[draft.category]}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>Шаг {draft.currentStep} из {draft.totalSteps}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {formatDistanceToNow(draft.updatedAt, { 
                      addSuffix: true,
                      locale: ru 
                    })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <Link href={`/profiles/create?draft=${draft.id}`}>
                  <Button
                    size="sm"
                    className="h-9 rounded-[12px] bg-orange-500 hover:bg-orange-600 text-white font-medium px-4"
                  >
                    Продолжить
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDraftToDelete(draft)}
                  className="h-9 rounded-[12px] text-gray-600 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1.5 bg-white/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${(draft.currentStep / draft.totalSteps) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Диалог подтверждения удаления */}
      <AlertDialog open={!!draftToDelete} onOpenChange={(open) => !open && setDraftToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить черновик?</AlertDialogTitle>
            <AlertDialogDescription>
              Черновик "{draftToDelete?.data.display_name || 'Новый профиль'}" будет удалён.
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог подтверждения очистки всех черновиков */}
      <AlertDialog open={showClearAll} onOpenChange={setShowClearAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Очистить все черновики?</AlertDialogTitle>
            <AlertDialogDescription>
              Все {drafts.length} черновик(ов) будут удалены. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-red-500 hover:bg-red-600">
              Очистить все
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

