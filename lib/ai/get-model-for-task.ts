/**
 * Утилита для получения AI модели по задаче
 * Упрощённая версия - использует env переменные вместо БД
 */

export type AIProviderType = 'google' | 'openai' | 'anthropic' | 'ollama' | 'other'
export type AIModelType = 'chat' | 'embedding'

export interface AIModelConfig {
  type: AIProviderType
  modelName: string
  apiKey?: string
  baseUrl?: string
  modelType: AIModelType
  settings?: Record<string, unknown>
}

export interface TaskModelResult {
  primary: AIModelConfig | null
  fallback: AIModelConfig | null
  isEnabled: boolean
}

/**
 * Получить настройки модели для конкретной задачи
 * Временная реализация - возвращает Google Gemini из env
 */
export async function getModelForTask(taskKey: string): Promise<TaskModelResult> {
  console.log(`[AI] Getting model for task: ${taskKey}`)
  
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    console.warn('[AI] No GOOGLE_GEMINI_API_KEY found')
    return {
      primary: null,
      fallback: null,
      isEnabled: false,
    }
  }

  const config: AIModelConfig = {
    type: 'google',
    modelName: 'gemini-2.0-flash-exp',
    apiKey,
    modelType: 'chat',
    settings: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      topP: 0.95,
      topK: 40,
    },
  }

  return {
    primary: config,
    fallback: null,
    isEnabled: true,
  }
}

/**
 * Сбросить кеш настроек (заглушка для совместимости)
 */
export function clearAISettingsCache() {
  console.log('[AI] Cache cleared (no-op)')
}
