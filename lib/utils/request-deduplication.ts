/**
 * Дедупликация параллельных HTTP запросов
 * Если несколько вкладок делают одинаковый запрос одновременно,
 * выполняется только один запрос, остальные ждут его результата
 */

type PendingRequest = {
  promise: Promise<Response>
  timestamp: number
}

const pendingRequests = new Map<string, PendingRequest>()
const REQUEST_TIMEOUT = 10000 // 10 секунд

/**
 * Выполняет HTTP запрос с дедупликацией
 * Если такой же запрос уже выполняется, возвращает клон его результата
 */
export async function deduplicatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const key = `${options?.method || 'GET'}:${url}`
  
  // Проверяем, есть ли уже выполняющийся запрос
  const pending = pendingRequests.get(key)
  if (pending) {
    // Проверяем, не истек ли таймаут
    if (Date.now() - pending.timestamp < REQUEST_TIMEOUT) {
      console.log(`[Deduplicated] ⏭️ Reusing pending request: ${key}`)
      // ✅ ВАЖНО: Клонируем response перед возвратом!
      const response = await pending.promise
      return response.clone()
    } else {
      // Таймаут истек, удаляем старый запрос
      console.log(`[Deduplicated] ⏰ Timeout expired, retrying: ${key}`)
      pendingRequests.delete(key)
    }
  }

  // Создаем новый запрос
  console.log(`[Deduplicated] 🚀 Making new request: ${key}`)
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    console.warn(`[Deduplicated] ⚠️ Request timed out: ${key}`)
    controller.abort()
    pendingRequests.delete(key)
  }, REQUEST_TIMEOUT)

  const promise = fetch(url, { ...options, signal: controller.signal })
    .then((response) => {
      clearTimeout(timeoutId)
      console.log(`[Deduplicated] ✅ Request completed: ${key}`)
      return response
    })
    .catch((error) => {
      clearTimeout(timeoutId)
      pendingRequests.delete(key)
      throw error
    })

  pendingRequests.set(key, {
    promise,
    timestamp: Date.now()
  })

  const response = await promise
  // ✅ Возвращаем клон, чтобы оригинал остался в кеше для других запросов
  return response.clone()
}

/**
 * Очищает все зависшие запросы (вызывается при размонтировании компонентов)
 */
export function clearPendingRequests() {
  pendingRequests.clear()
}
