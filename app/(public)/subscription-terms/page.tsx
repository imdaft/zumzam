import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Условия подписок — ZumZam',
  description: 'Условия платных подписок для исполнителей услуг на платформе ZumZam',
}

export default function SubscriptionTermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Назад */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        На главную
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Условия подписок</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          Дата последнего обновления: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Общие положения</h2>
          <p className="text-gray-600 mb-4">
            Платные подписки предоставляют исполнителям услуг расширенные возможности на платформе ZumZam.
            Все подписки являются добровольными и не обязательными для работы на платформе.
          </p>
          <p className="text-gray-600">
            Подписки позволяют улучшить видимость профиля, получить аналитику и дополнительные инструменты для привлечения клиентов.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Виды подписок</h2>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Базовая подписка</h3>
            <p className="text-blue-800 font-medium mb-2">Стоимость: 1,500 - 2,500 руб/мес</p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>До 5 услуг в профиле</li>
              <li>Базовое размещение в результатах поиска</li>
              <li>Получение заявок от клиентов</li>
              <li>Базовая статистика просмотров</li>
              <li>Возможность отвечать на отзывы</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">Стандартная подписка</h3>
            <p className="text-green-800 font-medium mb-2">Стоимость: 3,000 - 4,500 руб/мес</p>
            <ul className="list-disc list-inside text-green-700 space-y-1">
              <li>До 15 услуг в профиле</li>
              <li>Приоритетное размещение в поиске</li>
              <li>Расширенная аналитика (конверсия, источники трафика)</li>
              <li>Верификация профиля со значком ✓</li>
              <li>Приоритетная поддержка</li>
              <li>Выделение профиля цветом</li>
            </ul>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">Премиум подписка</h3>
            <p className="text-purple-800 font-medium mb-2">Стоимость: 5,000 - 7,000 руб/мес</p>
            <ul className="list-disc list-inside text-purple-700 space-y-1">
              <li>Неограниченное количество услуг</li>
              <li>Топ-размещение (всегда вверху результатов поиска)</li>
              <li>Полная аналитика с дашбордом и экспортом</li>
              <li>Приоритет в AI-рекомендациях</li>
              <li>API доступ для интеграций</li>
              <li>Персональный менеджер поддержки</li>
              <li>Премиум-бейдж и максимальное выделение</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Дополнительные услуги</h2>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Верификация профиля</h3>
          <p className="text-gray-600 mb-2"><strong>Стоимость:</strong> 3,000 - 5,000 руб (единовременно)</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Проверка документов и квалификации</li>
            <li>Значок "Верифицировано" в профиле</li>
            <li>Повышенное доверие клиентов</li>
            <li>Приоритет в результатах поиска</li>
            <li>Сертификат верификации</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Продвижение профиля</h3>
          <p className="text-gray-600 mb-2"><strong>Стоимость:</strong> 2,000 - 4,000 руб/мес</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Увеличенная карточка в результатах поиска</li>
            <li>Выделение цветом и специальными значками</li>
            <li>Реклама в категориях и рекомендациях</li>
            <li>Статистика эффективности продвижения</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Расширенная аналитика</h3>
          <p className="text-gray-600 mb-2"><strong>Стоимость:</strong> +1,000 руб/мес (дополнительно к подписке)</p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Детальная статистика просмотров и заявок</li>
            <li>A/B тестирование описаний услуг</li>
            <li>Экспорт данных в различных форматах</li>
            <li>Отчеты по эффективности</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Оплата и биллинг</h2>
          <p className="text-gray-600 mb-4">
            Оплата подписок осуществляется следующими способами:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Банковские карты (Visa, MasterCard, Мир)</li>
            <li>Электронные кошельки (ЮMoney, QIWI)</li>
            <li>Банковский перевод (для юридических лиц)</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Период оплаты</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Месячная подписка:</strong> оплата каждый месяц</li>
            <li><strong>Квартальная подписка:</strong> скидка 5% при оплате за 3 месяца</li>
            <li><strong>Годовая подписка:</strong> скидка 15% при оплате за 12 месяцев</li>
          </ul>

          <p className="text-gray-600 mb-4">
            <strong>Автопродление:</strong> подписки автоматически продлеваются на следующий период,
            если не отключены за 3 дня до окончания срока.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Отмена и возврат средств</h2>
          <p className="text-gray-600 mb-4">
            Вы можете отменить подписку в любое время через настройки профиля:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Отмена до начала оплаченного периода:</strong> полный возврат средств в течение 3-5 рабочих дней</li>
            <li><strong>Отмена в течение оплаченного периода:</strong> возврат пропорционально неиспользованному времени</li>
            <li><strong>Автопродление:</strong> можно отключить за 3 дня до окончания периода</li>
          </ul>

          <p className="text-gray-600 mb-4">
            <strong>Условия возврата:</strong>
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Возврат осуществляется на тот же способ оплаты</li>
            <li>Срок обработки возврата: 3-10 рабочих дней</li>
            <li>При возврате взимается комиссия платежной системы (если применимо)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Изменение тарифов</h2>
          <p className="text-gray-600 mb-4">
            ZumZam оставляет за собой право изменять стоимость подписок. При увеличении тарифов:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Уведомление за 30 дней до изменения</li>
            <li>Возможность отмены подписки без штрафов</li>
            <li>Заморозка текущего тарифа для существующих подписчиков (опционально)</li>
          </ul>
          <p className="text-gray-600">
            Снижение тарифов применяется ко всем подписчикам без дополнительных условий.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Техническая поддержка</h2>
          <p className="text-gray-600 mb-4">
            В зависимости от типа подписки предоставляется разный уровень поддержки:
          </p>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Базовая подписка</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Email поддержка в течение 24 часов</li>
            <li>База знаний и FAQ</li>
            <li>Общие рекомендации по оптимизации</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Стандартная подписка</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Приоритетная email поддержка в течение 12 часов</li>
            <li>Телефонная консультация 1 раз в месяц</li>
            <li>Персональные рекомендации по профилю</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Премиум подписка</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Персональный менеджер (чат в Telegram)</li>
            <li>Срочная поддержка в течение 2 часов</li>
            <li>Регулярные звонки для анализа профиля</li>
            <li>Помощь в продвижении и маркетинге</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Ограничения и ответственность</h2>
          <p className="text-gray-600 mb-4">
            Подписки предоставляют дополнительные возможности, но не гарантируют:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Конкретное количество заявок или клиентов</li>
            <li>Положительные отзывы или высокий рейтинг</li>
            <li>Финансовый результат от использования платформы</li>
          </ul>
          <p className="text-gray-600">
            ZumZam не несёт ответственности за бизнес-результаты использования подписок.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Изменения условий</h2>
          <p className="text-gray-600 mb-4">
            Условия подписок могут быть изменены ZumZam в одностороннем порядке. При внесении существенных изменений подписчики уведомляются за 30 дней.
          </p>
          <p className="text-gray-600">
            Продолжение использования подписки после изменений означает согласие с новыми условиями.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Контакты</h2>
          <p className="text-gray-600 mb-4">
            По вопросам подписок обращайтесь:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Email:</strong> billing@zumzam.ru</li>
            <li><strong>Раздел подписок:</strong> в личном кабинете исполнителя</li>
            <li><strong>Telegram:</strong> @zumzam_billing</li>
          </ul>
        </section>
      </div>
    </div>
  )
}













