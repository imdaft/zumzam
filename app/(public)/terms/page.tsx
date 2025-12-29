import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Условия использования — ZumZam',
  description: 'Условия использования сервиса ZumZam — агрегатора детских праздников',
}

export default function TermsPage() {
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

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Условия использования</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          Дата последнего обновления: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Общие положения</h2>
          <p className="text-gray-600 mb-4">
            Настоящие Условия использования регулируют порядок использования сервиса ZumZam — 
            агрегатора детских праздников и развлечений.
          </p>
          <p className="text-gray-600">
            Используя сервис, вы соглашаетесь с данными условиями. Если вы не согласны с 
            какими-либо положениями, пожалуйста, воздержитесь от использования сервиса.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Описание сервиса</h2>
          <p className="text-gray-600 mb-4">
            ZumZam — это платформа, которая помогает родителям находить и бронировать услуги
            для организации детских праздников: аниматоров, площадки, шоу-программы,
            мастер-классы, квесты, фотографов и другие развлекательные услуги.
          </p>
          <p className="text-gray-600 mb-4">
            Мы являемся посредником между клиентами и исполнителями услуг. ZumZam не является
            поставщиком услуг и не несёт ответственности за качество услуг, оказываемых
            исполнителями. Платформа предоставляет инструменты для поиска, коммуникации и
            бронирования, но не гарантирует результат оказания услуг.
          </p>
          <p className="text-gray-600">
            Сервис предоставляется "как есть" без каких-либо гарантий, явных или подразумеваемых.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Регистрация и аккаунт</h2>
          <p className="text-gray-600 mb-4">
            Для использования некоторых функций сервиса требуется регистрация. Вы обязуетесь 
            предоставлять достоверную информацию и поддерживать её актуальность.
          </p>
          <p className="text-gray-600">
            Вы несёте ответственность за сохранность данных своего аккаунта и за все действия, 
            совершённые с его использованием.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Правила для исполнителей</h2>
          <p className="text-gray-600 mb-4">
            Исполнители услуг обязуются:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Предоставлять достоверную и актуальную информацию о своих услугах</li>
            <li>Своевременно отвечать на заявки клиентов (в течение 24 часов)</li>
            <li>Качественно выполнять взятые на себя обязательства</li>
            <li>Иметь все необходимые лицензии и разрешения для оказания услуг</li>
            <li>Соблюдать правила безопасности при работе с детьми</li>
            <li>Указывать реальные цены без скрытых платежей</li>
          </ul>
          <p className="text-gray-600">
            Подробные правила для исполнителей описаны в отдельном Соглашении с исполнителями.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Платные услуги</h2>
          <p className="text-gray-600 mb-4">
            Для исполнителей услуг доступны платные подписки для расширения возможностей профиля:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Базовая подписка:</strong> 1,500-2,500 руб/мес - базовое размещение</li>
            <li><strong>Стандартная подписка:</strong> 3,000-4,500 руб/мес - приоритетное размещение</li>
            <li><strong>Премиум подписка:</strong> 5,000-7,000 руб/мес - топ-размещение и аналитика</li>
            <li><strong>Верификация:</strong> 3,000-5,000 руб (единовременно) - значок доверия</li>
          </ul>
          <p className="text-gray-600">
            Подробные условия подписок описаны в разделе "Условия подписок".
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Ответственность платформы</h2>
          <p className="text-gray-600 mb-4">
            ZumZam несёт ответственность только за предоставление платформы и инструментов бронирования:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Техническая работоспособность сервиса</li>
            <li>Защита персональных данных пользователей</li>
            <li>Модерация контента и отзывов</li>
            <li>Предоставление инструментов коммуникации</li>
          </ul>
          <p className="text-gray-600 mb-4">
            <strong>ZumZam НЕ несёт ответственности за:</strong>
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Качество услуг, оказываемых исполнителями</li>
            <li>Соблюдение сроков и условий выполнения заказов</li>
            <li>Безопасность мероприятий и взаимодействие с детьми</li>
            <li>Финансовые отношения между клиентами и исполнителями</li>
            <li>Убытки, возникшие из-за действий третьих лиц</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Ограничения использования</h2>
          <p className="text-gray-600 mb-4">
            Запрещено использовать сервис для:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Нарушения законодательства Российской Федерации</li>
            <li>Распространения вредоносного ПО или вирусов</li>
            <li>Публикации оскорбительного, дискриминационного контента</li>
            <li>Спама, мошенничества или обмана пользователей</li>
            <li>Нарушения авторских прав и интеллектуальной собственности</li>
            <li>Организации мероприятий, опасных для детей</li>
            <li>Сбора персональных данных без согласия</li>
          </ul>
          <p className="text-gray-600">
            Нарушение этих правил может привести к блокировке аккаунта или юридической ответственности.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Отзывы и оценки</h2>
          <p className="text-gray-600 mb-4">
            Пользователи могут оставлять отзывы и оценки исполнителям. Правила модерации отзывов:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Отзывы должны быть объективными и основанными на реальном опыте</li>
            <li>Запрещены оскорбления, угрозы и нецензурная лексика</li>
            <li>ZumZam оставляет за собой право модерировать и удалять отзывы</li>
            <li>Исполнители могут отвечать на отзывы в течение 14 дней</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Прекращение использования</h2>
          <p className="text-gray-600 mb-4">
            Вы можете прекратить использование сервиса в любое время:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Удаление аккаунта через настройки профиля</li>
            <li>Отзыв согласия на обработку данных</li>
            <li>Отмена платных подписок</li>
          </ul>
          <p className="text-gray-600">
            При удалении аккаунта персональные данные удаляются в соответствии с Политикой конфиденциальности.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Изменения условий</h2>
          <p className="text-gray-600 mb-4">
            ZumZam оставляет за собой право изменять настоящие Условия использования. При внесении существенных изменений пользователи будут уведомлены через email или уведомление в сервисе.
          </p>
          <p className="text-gray-600">
            Продолжение использования сервиса после изменений означает согласие с обновленными условиями.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Применимое право</h2>
          <p className="text-gray-600 mb-4">
            Настоящие Условия регулируются законодательством Российской Федерации. Все споры разрешаются в судебном порядке в соответствии с законодательством РФ.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Контакты</h2>
          <p className="text-gray-600 mb-4">
            По всем вопросам, связанным с использованием сервиса, вы можете обратиться:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Email:</strong> support@zumzam.ru</li>
            <li><strong>Форма обратной связи:</strong> через раздел "Помощь" в сервисе</li>
            <li><strong>Telegram:</strong> @zumzam_support</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

