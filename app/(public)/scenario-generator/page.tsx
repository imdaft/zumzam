import { ScenarioGenerator } from '@/components/features/ai/scenario-generator'
import { Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Генератор сценариев праздников | DetiNaRakete',
  description: 'Создайте уникальный сценарий детского праздника с помощью AI. Персонализированные идеи для любой темы и возраста.',
}

/**
 * Страница генератора сценариев
 */
export default function ScenarioGeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Powered by AI</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Генератор сценариев праздников
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Создайте уникальный сценарий детского праздника за минуту. 
            AI подберёт игры, активности и советы специально для вашего ребёнка.
          </p>
        </div>

        {/* Generator */}
        <div className="max-w-5xl mx-auto">
          <ScenarioGenerator />
        </div>

        {/* Features */}
        <div className="mt-16 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-semibold mb-2">AI-персонализация</h3>
            <p className="text-sm text-muted-foreground">
              Сценарий учитывает возраст, интересы и особенности вашего ребёнка
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              📋
            </div>
            <h3 className="font-semibold mb-2">Детальный план</h3>
            <p className="text-sm text-muted-foreground">
              Пошаговый сценарий с таймингом, реквизитом и инструкциями
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
              🎭
            </div>
            <h3 className="font-semibold mb-2">Готовые решения</h3>
            <p className="text-sm text-muted-foreground">
              Запасные игры и советы на случай непредвиденных ситуаций
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


