/**
 * Типы для платёжной системы ЮКасса
 */

// Статусы платежа
export type PaymentStatus = 
  | 'pending'      // Ожидает оплаты
  | 'waiting_for_capture'  // Успешно, ждёт подтверждения
  | 'succeeded'    // Успешно оплачен
  | 'canceled'     // Отменён
  | 'refunded'     // Возвращён

// Типы платежей (без комиссий — только внутренние услуги платформы)
export type PaymentType = 
  | 'subscription'  // Оплата подписки (PRO, Business)
  | 'promotion'     // Оплата рекламы и продвижения

// Способы оплаты
export type PaymentMethod = 
  | 'bank_card'     // Банковская карта
  | 'yoo_money'     // ЮMoney
  | 'sbp'           // СБП
  | 'sberbank'      // Сбербанк Онлайн

// Валюта
export type Currency = 'RUB'

/**
 * Сумма платежа
 */
export interface Amount {
  value: string  // Строка с суммой (например "1990.00")
  currency: Currency
}

/**
 * Данные для создания платежа
 */
export interface CreatePaymentRequest {
  // Обязательные поля
  amount: Amount
  description: string
  
  // Метаданные для отслеживания
  metadata: {
    type: PaymentType
    user_id: string
    subscription_plan_id?: string  // ID плана подписки
    campaign_id?: string           // ID рекламной кампании
  }
  
  // Опциональные
  capture?: boolean           // Автоматически подтверждать платёж
  confirmation?: {
    type: 'redirect'
    return_url: string        // URL для возврата после оплаты
  }
  receipt?: {
    customer: {
      email?: string
      phone?: string
    }
    items: ReceiptItem[]
  }
}

/**
 * Позиция в чеке (для ФЗ-54)
 */
export interface ReceiptItem {
  description: string         // Название товара/услуги
  quantity: string            // Количество
  amount: Amount
  vat_code: 1 | 2 | 3 | 4 | 5 | 6  // Ставка НДС
  payment_mode?: 'full_payment' | 'advance' | 'full_prepayment'
  payment_subject?: 'service' | 'commodity' | 'payment'
}

/**
 * Ответ от ЮКасса при создании платежа
 */
export interface YooKassaPayment {
  id: string
  status: PaymentStatus
  amount: Amount
  description: string
  recipient: {
    account_id: string
    gateway_id: string
  }
  created_at: string
  confirmation?: {
    type: 'redirect'
    confirmation_url: string
  }
  test: boolean
  paid: boolean
  refundable: boolean
  metadata: Record<string, any>
}

/**
 * Webhook событие от ЮКасса
 */
export interface YooKassaWebhookEvent {
  type: 'notification'
  event: 
    | 'payment.waiting_for_capture'
    | 'payment.succeeded'
    | 'payment.canceled'
    | 'refund.succeeded'
  object: YooKassaPayment
}

/**
 * Платёж в нашей БД
 */
export interface Payment {
  id: string
  yookassa_id: string
  user_id: string
  type: PaymentType
  amount: number
  currency: Currency
  status: PaymentStatus
  description: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  paid_at?: string
  canceled_at?: string
  refunded_at?: string
}

/**
 * Результат создания платежа
 */
export interface CreatePaymentResult {
  success: boolean
  payment?: YooKassaPayment
  confirmationUrl?: string
  error?: string
}

