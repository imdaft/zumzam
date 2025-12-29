import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Соглашение с исполнителями — ZumZam',
  description: 'Правила и условия работы для исполнителей услуг на платформе ZumZam',
}

export default function ExecutorAgreementPage() {
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

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Соглашение с исполнителями</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          Дата последнего обновления: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Общие положения</h2>
          <p className="text-gray-600 mb-4">
            Настоящее Соглашение регулирует отношения между платформой ZumZam и исполнителями услуг
            (аниматорами, студиями, площадками, фотографами и другими поставщиками услуг для детских праздников).
          </p>
          <p className="text-gray-600">
            Регистрируясь на платформе как исполнитель, вы соглашаетесь с условиями настоящего Соглашения.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Регистрация и верификация</h2>
          <p className="text-gray-600 mb-4">
            Для работы на платформе необходимо:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Создать профиль исполнителя с полной информацией</li>
            <li>Предоставить контактные данные и описание услуг</li>
            <li>Пройти верификацию (рекомендуется, но не обязательно)</li>
            <li>Принять настоящие условия и Политику конфиденциальности</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Обязанности исполнителя</h2>

          <h3 className="text-lg font-medium text-gray-800 mb-3">3.1. Качество услуг</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Предоставлять услуги высокого качества, соответствующие описанию</li>
            <li>Соблюдать правила безопасности при работе с детьми</li>
            <li>Иметь все необходимые квалификации и разрешения</li>
            <li>Использовать безопасные материалы и оборудование</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">3.2. Информация и цены</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Предоставлять достоверную информацию о услугах</li>
            <li>Указывать реальные цены без скрытых платежей</li>
            <li>Обновлять информацию о доступности и ценах</li>
            <li>Четко описывать условия и ограничения услуг</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">3.3. Коммуникация с клиентами</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Отвечать на запросы клиентов в течение 24 часов</li>
            <li>Поддерживать вежливый и профессиональный тон</li>
            <li>Своевременно информировать о изменениях в заказах</li>
            <li>Предоставлять всю необходимую информацию для подготовки</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">3.4. Выполнение заказов</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Прибывать вовремя на мероприятие</li>
            <li>Соблюдать согласованные сроки и условия</li>
            <li>Обеспечивать безопасность участников</li>
            <li>Предоставлять качественные фото/видео по запросу</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Правила ценообразования</h2>
          <p className="text-gray-600 mb-4">
            Исполнители самостоятельно устанавливают цены на свои услуги. Запрещено:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Указывать цены ниже рыночных для демпинга</li>
            <li>Взимать скрытые платежи или комиссии</li>
            <li>Изменять цены после подтверждения заказа без согласия клиента</li>
            <li>Требовать предоплату более 50% от стоимости заказа</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Верификация и рейтинг</h2>
          <p className="text-gray-600 mb-4">
            Верификация профиля предоставляет преимущества:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Значок "Верифицировано" в профиле</li>
            <li>Повышенное доверие клиентов</li>
            <li>Приоритет в результатах поиска</li>
            <li>Статистика и аналитика профиля</li>
          </ul>
          <p className="text-gray-600">
            Рейтинг формируется на основе отзывов клиентов и соблюдения правил платформы.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Платные подписки</h2>
          <p className="text-gray-600 mb-4">
            Для расширения возможностей профиля доступны платные подписки:
          </p>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Базовая подписка (1,500-2,500 руб/мес)</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>До 5 услуг в профиле</li>
            <li>Базовое размещение в поиске</li>
            <li>Получение заявок от клиентов</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Стандартная подписка (3,000-4,500 руб/мес)</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>До 15 услуг в профиле</li>
            <li>Приоритетное размещение</li>
            <li>Расширенная аналитика</li>
            <li>Верификация профиля</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Премиум подписка (5,000-7,000 руб/мес)</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Неограниченное количество услуг</li>
            <li>Топ-размещение в поиске</li>
            <li>Полная аналитика с дашбордом</li>
            <li>Приоритет в рекомендациях AI</li>
            <li>Персональный менеджер</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Отмена и перенос заказов</h2>
          <p className="text-gray-600 mb-4">
            Правила отмены заказов со стороны исполнителя:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Более 30 дней до мероприятия:</strong> бесплатная отмена</li>
            <li><strong>15-30 дней до мероприятия:</strong> штраф 20% от стоимости</li>
            <li><strong>7-14 дней до мероприятия:</strong> штраф 50% от стоимости</li>
            <li><strong>Менее 7 дней:</strong> штраф 100% от стоимости</li>
          </ul>
          <p className="text-gray-600">
            В случае форс-мажора (болезнь, авария) штрафы могут быть отменены по решению администрации.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Ответственность исполнителя</h2>
          <p className="text-gray-600 mb-4">
            Исполнитель несёт ответственность за:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Качество предоставляемых услуг</li>
            <li>Безопасность участников мероприятия</li>
            <li>Соблюдение законодательства РФ</li>
            <li>Честность в отношениях с клиентами</li>
            <li>Конфиденциальность информации о клиентах</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Нарушения и санкции</h2>
          <p className="text-gray-600 mb-4">
            За нарушения правил платформы применяются следующие санкции:
          </p>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Легкие нарушения</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Предупреждение</li>
            <li>Временное понижение в поиске</li>
            <li>Обязательное обучение правилам</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Серьезные нарушения</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Блокировка профиля на 7-30 дней</li>
            <li>Удаление негативных отзывов</li>
            <li>Штраф в размере месячной подписки</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Критические нарушения</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Полная блокировка аккаунта</li>
            <li>Удаление всех данных и отзывов</li>
            <li>Запрет на повторную регистрацию</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Расторжение соглашения</h2>
          <p className="text-gray-600 mb-4">
            Соглашение может быть расторгнуто:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>По инициативе исполнителя:</strong> в любое время через настройки профиля</li>
            <li><strong>По инициативе платформы:</strong> при систематических нарушениях</li>
            <li><strong>Автоматически:</strong> при неуплате подписки более 30 дней</li>
          </ul>
          <p className="text-gray-600">
            При расторжении все активные заказы должны быть выполнены или отменены по правилам.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Контакты</h2>
          <p className="text-gray-600 mb-4">
            По вопросам работы на платформе обращайтесь:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Email:</strong> partners@zumzam.ru</li>
            <li><strong>Форма для исполнителей:</strong> через раздел "Стать партнером"</li>
            <li><strong>Telegram:</strong> @zumzam_partners</li>
          </ul>
        </section>
      </div>
    </div>
  )
}













