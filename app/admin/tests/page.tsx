'use client'

/**
 * Админка: Страница тестирования
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface TestSuite {
  id: string
  name: string
  file: string
}

interface AssertionResult {
  title: string
  status: 'passed' | 'failed'
  failureMessages?: string[]
}

interface TestResult {
  success: boolean
  duration: number
  results: {
    numPassedTests?: number
    numFailedTests?: number
    numTotalTests?: number
    testResults?: Array<{
      assertionResults?: AssertionResult[]
    }>
  }
}

// Описания тестов для пользователей
const TEST_INFO: Record<string, { desc: string; fix: string }> = {
  'возвращает роль пользователя если она указана': { desc: 'Система определяет роль (клиент/исполнитель/админ)', fix: 'Проверьте таблицу users' },
  'возвращает client по умолчанию если роль не указана': { desc: 'Новые пользователи получают роль "клиент"', fix: 'Проверьте логику регистрации' },
  'корректно форматирует ответ с данными пользователя': { desc: 'API возвращает id, email и роль', fix: 'Проверьте /api/user' },
  'сохраняет все поля пользователя': { desc: 'Данные не теряются при передаче', fix: 'Проверьте сериализацию' },
  'валидирует корректные email адреса': { desc: 'Правильные email принимаются', fix: 'Проверьте валидацию' },
  'отклоняет некорректные email адреса': { desc: 'Неправильные email отклоняются', fix: 'Проверьте regex' },
  'возвращает true для авторизованного пользователя': { desc: 'Залогиненный определяется как авторизованный', fix: 'Проверьте сессию' },
  'возвращает false для неавторизованного пользователя': { desc: 'Гость определяется как неавторизованный', fix: 'Проверьте обработку null' },
  'генерирует корректный slug из названия': { desc: 'Из названия создаётся URL-slug', fix: 'Проверьте функцию slug' },
  'удаляет специальные символы': { desc: 'Символы @#$% удаляются', fix: 'Проверьте очистку' },
  'заменяет множественные пробелы и дефисы': { desc: 'Пробелы нормализуются', fix: 'Проверьте replace' },
  'принимает корректные slug': { desc: 'Правильные slug проходят', fix: 'Проверьте валидацию' },
  'отклоняет некорректные slug': { desc: 'Неправильные slug отклоняются', fix: 'Проверьте правила' },
  'фильтрует профили по городу': { desc: 'Поиск по городу работает', fix: 'Проверьте фильтр city' },
  'фильтрует профили по категории': { desc: 'Поиск по категории работает', fix: 'Проверьте фильтр category' },
  'сортирует по рейтингу (по убыванию)': { desc: 'Высокий рейтинг первым', fix: 'Проверьте ORDER BY' },
  'принимает валидные статусы': { desc: 'Статусы заказов принимаются', fix: 'Проверьте список статусов' },
  'отклоняет невалидные статусы': { desc: 'Неизвестные статусы отклоняются', fix: 'Проверьте валидацию' },
  'разрешает просмотр клиенту': { desc: 'Клиент видит свои заказы', fix: 'Проверьте client_id' },
  'разрешает просмотр исполнителю': { desc: 'Исполнитель видит заказы', fix: 'Проверьте provider_id' },
  'запрещает просмотр посторонним': { desc: 'Чужие заказы недоступны', fix: 'Проверьте RLS' },
  'принимает корректные российские номера': { desc: '+7 номера принимаются', fix: 'Проверьте regex телефона' },
  'отклоняет некорректные номера': { desc: 'Короткие номера отклоняются', fix: 'Проверьте валидацию' },
  'принимает будущие даты': { desc: 'Заказ на будущую дату ОК', fix: 'Проверьте сравнение дат' },
  'отклоняет прошедшие даты': { desc: 'Заказ на прошлую дату отклоняется', fix: 'Проверьте валидацию даты' },
  'фильтрует по городу': { desc: 'Поиск в городе работает', fix: 'Проверьте параметр city' },
  'фильтрует по категории': { desc: 'Поиск по категории работает', fix: 'Проверьте параметр category' },
  'сортирует по убыванию similarity': { desc: 'Релевантные первыми', fix: 'Проверьте сортировку' },
  'ограничивает количество результатов': { desc: 'Параметр limit работает', fix: 'Проверьте LIMIT' },
  'извлекает ключевые слова': { desc: 'Важные слова выделяются', fix: 'Проверьте extractKeywords' },
  'удаляет стоп-слова': { desc: 'Слова "в", "на" не учитываются', fix: 'Проверьте стоп-слова' },
}

function getTestInfo(title: string): { desc: string; fix: string } {
  return TEST_INFO[title] || { desc: 'Проверка функциональности', fix: 'Проверьте код теста' }
}

export default function AdminTestsPage() {
  const [suites, setSuites] = useState<TestSuite[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [canRun, setCanRun] = useState(false)

  useEffect(() => {
    fetch('/api/admin/tests')
      .then(res => res.json())
      .then(data => {
        setSuites(data.suites || [])
        setCanRun(data.canRun || false)
      })
      .finally(() => setLoading(false))
  }, [])

  const runTests = async () => {
    setRunning(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      setResult(data)
    } finally {
      setRunning(false)
    }
  }

  const getAllTests = (): AssertionResult[] => {
    if (!result?.results?.testResults) return []
    const tests: AssertionResult[] = []
    result.results.testResults.forEach(file => {
      file.assertionResults?.forEach(test => {
        tests.push({
          title: test.title,
          status: test.status === 'passed' ? 'passed' : 'failed',
          failureMessages: test.failureMessages,
        })
      })
    })
    return tests
  }

  if (loading) {
    return <div className="p-6 text-gray-500"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Загрузка...</div>
  }

  const stats = result?.results
  const tests = getAllTests()
  const failed = tests.filter(t => t.status === 'failed')
  const passed = tests.filter(t => t.status === 'passed')

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Тесты</h1>
        {canRun && (
          <Button onClick={runTests} disabled={running} variant="outline">
            {running ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Выполняется...</> : 'Запустить'}
          </Button>
        )}
      </div>

      {/* Результат */}
      {result && stats && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className={`text-2xl font-bold ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                {result.success ? 'OK' : 'FAIL'}
              </div>
              <div className="text-sm text-gray-500">Статус</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.numTotalTests}</div>
              <div className="text-sm text-gray-500">Всего</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.numPassedTests}</div>
              <div className="text-sm text-gray-500">Прошло</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.numFailedTests}</div>
              <div className="text-sm text-gray-500">Упало</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{(result.duration / 1000).toFixed(1)}s</div>
              <div className="text-sm text-gray-500">Время</div>
            </div>
          </div>
        </div>
      )}

      {/* Упавшие тесты */}
      {failed.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-red-600 mb-3">❌ Проблемы ({failed.length})</h2>
          <div className="space-y-2">
            {failed.map((test, i) => {
              const info = getTestInfo(test.title)
              return (
                <div key={i} className="border border-red-200 rounded-lg p-3 bg-red-50">
                  <div className="font-medium text-red-700">{test.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{info.desc}</div>
                  <div className="text-sm text-red-600 mt-1">💡 {info.fix}</div>
                  {test.failureMessages?.[0] && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-500 cursor-pointer">Техническая ошибка</summary>
                      <pre className="mt-1 p-2 bg-white text-xs text-red-800 overflow-x-auto rounded">
                        {test.failureMessages[0].split('\n').slice(0, 3).join('\n')}
                      </pre>
                    </details>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Прошедшие тесты */}
      {passed.length > 0 && (
        <div className="mb-6">
          <details>
            <summary className="font-semibold text-green-600 mb-2 cursor-pointer">
              ✅ Всё работает ({passed.length})
            </summary>
            <div className="mt-2 bg-white border rounded-lg divide-y">
              {passed.map((test, i) => {
                const info = getTestInfo(test.title)
                return (
                  <div key={i} className="px-3 py-2">
                    <span className="text-gray-700">{test.title}</span>
                    <span className="text-gray-400 ml-2">— {info.desc}</span>
                  </div>
                )
              })}
            </div>
          </details>
        </div>
      )}

      {/* Файлы тестов */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Файлы тестов</h2>
        <table className="w-full text-sm">
          <tbody>
            {suites.map(suite => (
              <tr key={suite.id} className="border-b last:border-0">
                <td className="py-2 text-gray-700">{suite.name}</td>
                <td className="py-2 text-gray-400 text-right">{suite.file}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-sm text-gray-400 mt-3">
          Терминал: <code className="bg-gray-100 px-2 py-1 rounded">npm run test:run</code>
        </div>
      </div>
    </div>
  )
}
