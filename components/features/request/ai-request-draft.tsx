'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, Wand2, Loader2, Link2, Check, Sparkles } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'

/**
 * Быстрый ассистент: принимает свободный текст/диктовку и собирает черновик заявки.
 * Не публикует — отдаёт ссылку на страницу создания с предзаполненными полями.
 */
export function AIRequestDraftAssistant() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [link, setLink] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (text.trim().length < 10) {
      toast.error('Опишите задачу подробнее (минимум 10 символов)')
      return
    }

    setIsLoading(true)
    setLink(null)

    try {
      const response = await fetch('/api/ai/request-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Не удалось создать черновик')
      }

      if (result.link) {
        setLink(result.link)
        toast.success('Черновик готов', { description: 'Откройте ссылку и отредактируйте' })
      }
    } catch (error: any) {
      console.error('[AIRequestDraftAssistant] error', error)
      toast.error('Не получилось распознать запрос', {
        description: error.message || 'Попробуйте переформулировать или добавить детали',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpen = () => {
    if (link) {
      router.push(link)
    }
  }

  return (
    <Card className="shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)] rounded-[24px] border-none bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
          <Sparkles className="w-5 h-5 text-orange-500" />
          Скажи «Создай объявление» — остальное сделаем сами
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">
          Наговори или напиши: дату, время, кто нужен, бюджет, адрес. Помощник соберёт черновик и даст ссылку для редактирования и публикации.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="relative">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Пример: 25 декабря в 17:00 нужен фокусник за городом, ресторан «Рыба на даче», день рождения мальчику 10 лет, бюджет до 15 000 ₽."
            className="min-h-[120px] rounded-[20px] border-gray-200 focus-visible:ring-orange-500/30 focus-visible:border-orange-400 text-[15px]"
          />
          <button
            type="button"
            aria-label="Диктовка"
            className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 text-sm font-semibold border border-orange-100 hover:bg-orange-100 transition-all duration-300"
            onClick={() => toast.info('Голосовой ввод подключим позже')}
          >
            <Mic className="w-4 h-4" />
            Диктовать
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex-1 h-12 rounded-full bg-orange-500 hover:bg-orange-600 transition-all duration-300"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Собираем черновик...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Создать черновик
              </>
            )}
          </Button>

          <Button
            variant="outline"
            disabled={!link}
            onClick={handleOpen}
            className="h-12 rounded-full border-gray-200 text-gray-800 hover:bg-gray-50 transition-all duration-300"
          >
            {link ? (
              <>
                <Check className="w-5 h-5 mr-2 text-green-600" />
                Открыть черновик
              </>
            ) : (
              <>
                <Link2 className="w-5 h-5 mr-2" />
                Ссылка появится после генерации
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}














