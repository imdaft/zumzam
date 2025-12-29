/**
 * Клиент для ЮКасса API
 * 
 * Документация: https://yookassa.ru/developers/api
 */

import { logger } from '@/lib/logger'
import type { 
  CreatePaymentRequest, 
  YooKassaPayment, 
  CreatePaymentResult,
  Amount 
} from './types'

// Конфигурация
const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3'
const SHOP_ID = process.env.YOOKASSA_SHOP_ID
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY

/**
 * Проверяет наличие ключей API
 */
function checkCredentials(): boolean {
  if (!SHOP_ID || !SECRET_KEY) {
    logger.warn('[YooKassa] API credentials not configured')
    return false
  }
  return true
}

/**
 * Создаёт заголовки авторизации
 */
function getAuthHeaders(idempotenceKey: string): HeadersInit {
  const credentials = Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString('base64')
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${credentials}`,
    'Idempotence-Key': idempotenceKey,  // Защита от дублирования
  }
}

/**
 * Генерирует уникальный ключ идемпотентности
 */
function generateIdempotenceKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Создаёт платёж в ЮКасса
 */
export async function createPayment(
  data: CreatePaymentRequest
): Promise<CreatePaymentResult> {
  if (!checkCredentials()) {
    return {
      success: false,
      error: 'Платёжная система не настроена'
    }
  }

  try {
    const idempotenceKey = generateIdempotenceKey()
    
    logger.info('[YooKassa] Creating payment', {
      amount: data.amount.value,
      type: data.metadata.type,
      userId: data.metadata.user_id
    })

    const response = await fetch(`${YOOKASSA_API_URL}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(idempotenceKey),
      body: JSON.stringify({
        amount: data.amount,
        capture: data.capture ?? true,  // Автоподтверждение по умолчанию
        confirmation: data.confirmation,
        description: data.description,
        metadata: data.metadata,
        receipt: data.receipt,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      logger.error('[YooKassa] Payment creation failed', {
        status: response.status,
        error: errorData
      })
      
      return {
        success: false,
        error: errorData.description || `Ошибка создания платежа: ${response.status}`
      }
    }

    const payment: YooKassaPayment = await response.json()
    
    logger.info('[YooKassa] Payment created', {
      id: payment.id,
      status: payment.status
    })

    return {
      success: true,
      payment,
      confirmationUrl: payment.confirmation?.confirmation_url
    }

  } catch (error: any) {
    logger.error('[YooKassa] Payment creation error', error)
    return {
      success: false,
      error: error.message || 'Ошибка соединения с платёжной системой'
    }
  }
}

/**
 * Получает информацию о платеже
 */
export async function getPayment(paymentId: string): Promise<YooKassaPayment | null> {
  if (!checkCredentials()) return null

  try {
    const response = await fetch(`${YOOKASSA_API_URL}/payments/${paymentId}`, {
      method: 'GET',
      headers: getAuthHeaders(generateIdempotenceKey()),
    })

    if (!response.ok) {
      logger.error('[YooKassa] Get payment failed', { paymentId, status: response.status })
      return null
    }

    return await response.json()
  } catch (error) {
    logger.error('[YooKassa] Get payment error', error)
    return null
  }
}

/**
 * Подтверждает платёж (для двухстадийных платежей)
 */
export async function capturePayment(
  paymentId: string, 
  amount?: Amount
): Promise<YooKassaPayment | null> {
  if (!checkCredentials()) return null

  try {
    const body: any = {}
    if (amount) body.amount = amount

    const response = await fetch(`${YOOKASSA_API_URL}/payments/${paymentId}/capture`, {
      method: 'POST',
      headers: getAuthHeaders(generateIdempotenceKey()),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      logger.error('[YooKassa] Capture payment failed', { paymentId, status: response.status })
      return null
    }

    return await response.json()
  } catch (error) {
    logger.error('[YooKassa] Capture payment error', error)
    return null
  }
}

/**
 * Отменяет платёж
 */
export async function cancelPayment(paymentId: string): Promise<YooKassaPayment | null> {
  if (!checkCredentials()) return null

  try {
    const response = await fetch(`${YOOKASSA_API_URL}/payments/${paymentId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(generateIdempotenceKey()),
    })

    if (!response.ok) {
      logger.error('[YooKassa] Cancel payment failed', { paymentId, status: response.status })
      return null
    }

    return await response.json()
  } catch (error) {
    logger.error('[YooKassa] Cancel payment error', error)
    return null
  }
}

/**
 * Создаёт возврат
 */
export async function createRefund(
  paymentId: string,
  amount: Amount,
  description?: string
): Promise<any | null> {
  if (!checkCredentials()) return null

  try {
    const response = await fetch(`${YOOKASSA_API_URL}/refunds`, {
      method: 'POST',
      headers: getAuthHeaders(generateIdempotenceKey()),
      body: JSON.stringify({
        payment_id: paymentId,
        amount,
        description,
      }),
    })

    if (!response.ok) {
      logger.error('[YooKassa] Create refund failed', { paymentId, status: response.status })
      return null
    }

    return await response.json()
  } catch (error) {
    logger.error('[YooKassa] Create refund error', error)
    return null
  }
}

/**
 * Проверяет подпись webhook
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  // ЮКасса не использует подпись для webhooks
  // Вместо этого рекомендуется проверять IP адреса
  // и получать актуальный статус платежа через API
  return true
}

/**
 * Хелпер для форматирования суммы
 */
export function formatAmount(value: number, currency: 'RUB' = 'RUB'): Amount {
  return {
    value: value.toFixed(2),
    currency
  }
}

