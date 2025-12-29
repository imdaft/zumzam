/**
 * Устаревшая страница детального просмотра заказа.
 * Раньше использовалась из уведомлений (/orders/[id]), но дублирует /orders.
 * Теперь всегда отправляем пользователя на /orders с раскрытием нужной заявки и встроенным чатом.
 */

import { redirect } from 'next/navigation'

interface PageProps {
  params: { id: string } | Promise<{ id: string }>
}

export default async function OrderDetailRedirectPage({ params }: PageProps) {
  const { id } = await params
  redirect(`/orders?id=${id}`)
}


