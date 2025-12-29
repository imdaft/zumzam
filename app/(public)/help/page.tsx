import { Metadata } from 'next'
import { FAQContent } from '@/components/features/help/faq-content'

export const metadata: Metadata = {
  title: 'Помощь и FAQ | ZumZam',
  description: 'Ответы на частые вопросы о сервисе ZumZam. Как найти аниматора, забронировать площадку, оставить отзыв и многое другое.',
}

export default function HelpPage() {
  return <FAQContent />
}
