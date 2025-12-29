import { ScenarioGenerator } from '@/components/features/ai/scenario-generator'
import { Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Генератор сценариев праздников | ZumZam',
  description: 'Создайте уникальный сценарий детского праздника с помощью AI за 5 минут. Персонализированные идеи для любой темы и возраста. Бесплатно!',
  alternates: {
    canonical: '/scenario-generator',
  },
  openGraph: {
    title: 'Генератор сценариев детских праздников с AI',
    description: 'Создайте уникальный сценарий за 5 минут с помощью AI',
    type: 'website',
  },
}

/**
 * Страница генератора сценариев
 */
export default function ScenarioGeneratorPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="w-full px-2 py-4 pb-24 sm:container sm:mx-auto sm:px-6 sm:py-10">
        {/* Hero */}
        <div className="bg-white border border-gray-100 shadow-sm rounded-[24px] p-5 sm:p-8 text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 mb-4 font-semibold">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm">AI‑инструмент</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Генератор сценариев праздников
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Создайте уникальный сценарий детского праздника за минуту. 
            AI подберёт игры, активности и советы специально для вашего ребёнка.
          </p>
        </div>

        {/* Generator */}
        <div className="max-w-5xl mx-auto">
          <ScenarioGenerator />
        </div>

        {/* Features */}
        <div className="mt-6 grid gap-3 sm:gap-4 md:grid-cols-3 max-w-5xl mx-auto">
          <div className="bg-white border border-gray-100 shadow-sm rounded-[24px] p-5 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-700 mb-3">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">AI‑персонализация</h3>
            <p className="text-sm text-gray-600">
              Сценарий учитывает возраст, интересы и особенности вашего ребёнка
            </p>
          </div>
          <div className="bg-white border border-gray-100 shadow-sm rounded-[24px] p-5 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-700 mb-3">
              📋
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Детальный план</h3>
            <p className="text-sm text-gray-600">
              Пошаговый сценарий с таймингом, реквизитом и инструкциями
            </p>
          </div>
          <div className="bg-white border border-gray-100 shadow-sm rounded-[24px] p-5 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-700 mb-3">
              🎭
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Готовые решения</h3>
            <p className="text-sm text-gray-600">
              Запасные игры и советы на случай непредвиденных ситуаций
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


