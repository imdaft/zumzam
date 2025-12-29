/**
 * Утилиты для работы со статусами заказов
 * Маппинг между CRM-воронками сервиса и отображением для клиента
 */

export type SystemStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
export type ClientViewStatus = 'in_progress' | 'confirmed' | 'completed' | 'cancelled'

/**
 * Конфигурация отображения статусов для клиента
 */
export const clientStatusConfig: Record<ClientViewStatus, { label: string; color: string; description: string }> = {
  in_progress: {
    label: 'В работе',
    color: 'bg-yellow-100 text-yellow-700',
    description: 'Исполнитель обрабатывает вашу заявку'
  },
  confirmed: {
    label: 'Забронировано',
    color: 'bg-green-100 text-green-700',
    description: 'Заявка подтверждена, услуга забронирована'
  },
  completed: {
    label: 'Завершено',
    color: 'bg-green-100 text-green-700',
    description: 'Услуга оказана'
  },
  cancelled: {
    label: 'Отменено',
    color: 'bg-red-100 text-red-700',
    description: 'Заявка отменена'
  }
}

/**
 * Конфигурация отображения статусов для сервиса (CRM)
 */
export const providerStatusConfig: Record<SystemStatus, { label: string; color: string }> = {
  pending: {
    label: 'Входящие',
    color: 'bg-orange-100 text-orange-700'
  },
  confirmed: {
    label: 'Забронировано',
    color: 'bg-green-100 text-green-700'
  },
  completed: {
    label: 'Завершено',
    color: 'bg-green-100 text-green-700'
  },
  cancelled: {
    label: 'Отменено',
    color: 'bg-red-100 text-red-700'
  }
}

/**
 * Преобразует system_status этапа воронки в статус для отображения клиенту
 * Логика:
 * - pending (Входящие) → in_progress (В работе)
 * - confirmed (Забронировано) → confirmed (Забронировано)
 * - completed (Завершено) → completed (Завершено)
 * - cancelled (Отменено) → cancelled (Отменено)
 * - custom (любой кастомный) → in_progress (В работе)
 */
export function mapToClientStatus(systemStatus: SystemStatus | null | undefined): ClientViewStatus {
  if (!systemStatus) return 'in_progress' // Кастомные этапы без привязки
  
  switch (systemStatus) {
    case 'pending':
      return 'in_progress' // "Входящие" для клиента = "В работе"
    case 'confirmed':
      return 'confirmed'
    case 'completed':
      return 'completed'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'in_progress'
  }
}

/**
 * Получает конфигурацию отображения для клиента на основе system_status
 */
export function getClientStatusDisplay(systemStatus: SystemStatus | null | undefined) {
  const clientStatus = mapToClientStatus(systemStatus)
  return clientStatusConfig[clientStatus]
}

/**
 * Проверяет, является ли этап системным (неудаляемым)
 */
export function isSystemStage(systemStatus: SystemStatus | null | undefined): boolean {
  return systemStatus !== null && systemStatus !== undefined
}

/**
 * Проверяет, можно ли добавлять кастомные этапы после данного
 * Кастомные этапы можно добавлять только между "Входящие" и "Забронировано"
 */
export function canAddCustomStageAfter(systemStatus: SystemStatus | null | undefined): boolean {
  // Можно добавлять только после "pending" или после других кастомных (где systemStatus = null)
  return systemStatus === 'pending' || systemStatus === null
}

/**
 * Получает позицию для вставки нового этапа
 * Новый кастомный этап вставляется между текущим и следующим
 */
export function getNewStagePosition(currentPosition: number, nextPosition?: number): number {
  if (!nextPosition) {
    return currentPosition + 10
  }
  // Вставляем посередине
  return Math.floor((currentPosition + nextPosition) / 2)
}


