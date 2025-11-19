'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Sparkles, Loader2, Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const scenarioFormSchema = z.object({
  theme: z.string().min(3, 'Минимум 3 символа'),
  age: z.coerce.number().min(1).max(18),
  duration: z.coerce.number().min(30).max(360),
  guestCount: z.coerce.number().min(1).max(100).optional(),
  interests: z.string().optional(),
  budget: z.coerce.number().min(0).optional(),
  location: z.enum(['помещение', 'улица', 'дом']).default('помещение'),
})

type ScenarioFormValues = z.infer<typeof scenarioFormSchema>

interface GeneratedScenario {
  title: string
  description: string
  preparation: {
    props: string[]
    decorations: string[]
    costumes: string[]
  }
  timeline: Array<{
    name: string
    duration: number
    description: string
    props: string[]
  }>
  hostTips: string[]
  backupGames: Array<{
    name: string
    description: string
    duration: number
  }>
}

/**
 * Генератор сценариев праздников
 */
export function ScenarioGenerator() {
  const [scenario, setScenario] = useState<GeneratedScenario | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const form = useForm<ScenarioFormValues>({
    resolver: zodResolver(scenarioFormSchema),
    defaultValues: {
      theme: '',
      age: 7,
      duration: 120,
      location: 'помещение',
    },
  })

  const onSubmit = async (data: ScenarioFormValues) => {
    setIsGenerating(true)
    setScenario(null)

    try {
      const response = await fetch('/api/ai/generate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          interests: data.interests ? data.interests.split(',').map(i => i.trim()) : [],
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка генерации сценария')
      }

      const result = await response.json()
      setScenario(result.scenario)
      toast.success('Сценарий сгенерирован! 🎉')
    } catch (error: any) {
      console.error('Scenario generation error:', error)
      toast.error('Ошибка генерации сценария. Попробуйте ещё раз.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!scenario) return

    const content = `
${scenario.title}
${'='.repeat(scenario.title.length)}

${scenario.description}

ПОДГОТОВКА
----------

Реквизит:
${scenario.preparation.props.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Украшения:
${scenario.preparation.decorations.map((d, i) => `${i + 1}. ${d}`).join('\n')}

${scenario.preparation.costumes.length > 0 ? `Костюмы:\n${scenario.preparation.costumes.map((c, i) => `${i + 1}. ${c}`).join('\n')}` : ''}

СЦЕНАРИЙ
--------

${scenario.timeline.map((activity, i) => `
${i + 1}. ${activity.name} (${activity.duration} мин)
   ${activity.description}
   ${activity.props.length > 0 ? `Реквизит: ${activity.props.join(', ')}` : ''}
`).join('\n')}

СОВЕТЫ ВЕДУЩЕМУ
----------------
${scenario.hostTips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

ЗАПАСНЫЕ ИГРЫ
-------------
${scenario.backupGames.map((game, i) => `
${i + 1}. ${game.name} (${game.duration} мин)
   ${game.description}
`).join('\n')}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${scenario.title}.txt`
    link.click()
    URL.revokeObjectURL(url)
    
    toast.success('Сценарий скачан!')
  }

  return (
    <div className="space-y-8">
      {/* Форма */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Генератор сценариев праздников
          </CardTitle>
          <CardDescription>
            Создайте уникальный сценарий детского праздника с помощью AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="theme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тема праздника *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Супергерои, принцессы, космос..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Возраст ребёнка *</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="18" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Длительность (минут) *</FormLabel>
                      <FormControl>
                        <Input type="number" min="30" max="360" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guestCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Количество гостей</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Локация *</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <option value="помещение">Помещение</option>
                          <option value="улица">Улица</option>
                          <option value="дом">Дом</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Бюджет (₽)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="Необязательно" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="interests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Интересы ребёнка (через запятую)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Например: динозавры, рисование, спорт" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isGenerating} size="lg" className="w-full">
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Генерируем сценарий...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Сгенерировать сценарий
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Результат */}
      {scenario && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{scenario.title}</CardTitle>
                <CardDescription className="text-base">
                  {scenario.description}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Скачать
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Подготовка */}
            <div>
              <h3 className="text-xl font-semibold mb-4">📋 Подготовка</h3>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <h4 className="font-semibold mb-2">Реквизит</h4>
                  <ul className="space-y-1">
                    {scenario.preparation.props.map((prop, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        • {prop}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Украшения</h4>
                  <ul className="space-y-1">
                    {scenario.preparation.decorations.map((deco, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        • {deco}
                      </li>
                    ))}
                  </ul>
                </div>
                {scenario.preparation.costumes.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Костюмы</h4>
                    <ul className="space-y-1">
                      {scenario.preparation.costumes.map((costume, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          • {costume}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Сценарий */}
            <div>
              <h3 className="text-xl font-semibold mb-4">🎭 Сценарий</h3>
              <div className="space-y-4">
                {scenario.timeline.map((activity, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            {activity.duration} мин
                          </Badge>
                          <CardTitle className="text-lg">{activity.name}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        {activity.description}
                      </p>
                      {activity.props.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {activity.props.map((prop, j) => (
                            <Badge key={j} variant="secondary" className="text-xs">
                              {prop}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Советы */}
            <div>
              <h3 className="text-xl font-semibold mb-4">💡 Советы ведущему</h3>
              <ul className="space-y-2">
                {scenario.hostTips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary font-semibold">{i + 1}.</span>
                    <span className="text-sm">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Запасные игры */}
            <div>
              <h3 className="text-xl font-semibold mb-4">🎲 Запасные игры</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {scenario.backupGames.map((game, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Badge variant="outline" className="w-fit mb-2">
                        {game.duration} мин
                      </Badge>
                      <CardTitle className="text-base">{game.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {game.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

