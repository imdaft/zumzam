import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Отказ от ответственности — ZumZam',
  description: 'Отказ от ответственности платформы ZumZam - мы являемся посредником',
}

export default function DisclaimerPage() {
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

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Отказ от ответственности</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          Дата последнего обновления: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Роль платформы ZumZam</h2>
          <p className="text-gray-600 mb-4">
            ZumZam является онлайн-платформой, которая предоставляет услуги по поиску, сравнению и бронированию
            детских развлечений и праздничных услуг. Мы действуем исключительно как посредник между клиентами
            и исполнителями услуг.
          </p>
          <p className="text-gray-600">
            <strong>ZumZam не является поставщиком услуг и не оказывает услуги непосредственно.</strong>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Отказ от ответственности за услуги</h2>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">Важное предупреждение</h3>
            <p className="text-yellow-800">
              Используя платформу ZumZam, вы понимаете и соглашаетесь, что мы не несем ответственности
              за качество, безопасность, законность или любые другие аспекты услуг, предоставляемых исполнителями.
            </p>
          </div>

          <p className="text-gray-600 mb-4">
            <strong>ZumZam не несет ответственности за:</strong>
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Качество предоставляемых услуг и соответствие описанию</li>
            <li>Безопасность мероприятий и защиту участников (особенно детей)</li>
            <li>Соблюдение исполнителями санитарных норм и правил безопасности</li>
            <li>Профессионализм и квалификацию исполнителей услуг</li>
            <li>Своевременность выполнения заказов и соблюдение сроков</li>
            <li>Финансовые отношения между клиентами и исполнителями</li>
            <li>Убытки, травмы или любой вред, причиненный во время мероприятий</li>
            <li>Нарушение авторских прав или интеллектуальной собственности</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Отказ от ответственности за контент</h2>
          <p className="text-gray-600 mb-4">
            Весь контент на платформе (фотографии, описания, отзывы, цены) предоставляется исполнителями услуг.
            ZumZam не проверяет достоверность всей информации и не гарантирует её точность.
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Мы не несем ответственности за неточности в описаниях услуг</li>
            <li>Мы не гарантируем актуальность фотографий и примеров работ</li>
            <li>Мы не проверяем законность использования изображений и материалов</li>
            <li>Мы оставляем за собой право модерировать и удалять контент</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Отказ от ответственности за отзывы</h2>
          <p className="text-gray-600 mb-4">
            Отзывы и оценки на платформе предоставляются пользователями и могут не отражать реальное
            качество услуг. Мы не несем ответственности за:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Достоверность и объективность отзывов</li>
            <li>Возможные клеветнические или оскорбительные отзывы</li>
            <li>Влияние отзывов на репутацию исполнителей</li>
            <li>Последствия использования отзывов при выборе услуг</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Отказ от ответственности за технические сбои</h2>
          <p className="text-gray-600 mb-4">
            Хотя мы стремимся обеспечивать бесперебойную работу платформы, могут возникать технические проблемы:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Временные сбои в работе сайта</li>
            <li>Потеря данных из-за технических проблем</li>
            <li>Ошибки в работе поисковых алгоритмов</li>
            <li>Проблемы с платежными системами</li>
            <li>Нарушения безопасности (несмотря на наши усилия)</li>
          </ul>
          <p className="text-gray-600">
            В таких случаях мы не несем ответственности за связанные убытки.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Отказ от ответственности за действия пользователей</h2>
          <p className="text-gray-600 mb-4">
            ZumZam не контролирует и не несет ответственности за действия пользователей платформы:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Взаимодействие между клиентами и исполнителями</li>
            <li>Переговоры и договоренности вне платформы</li>
            <li>Финансовые транзакции, проведенные вне системы</li>
            <li>Нарушение пользователями условий использования</li>
            <li>Мошеннические действия или обман</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Ограничение ответственности</h2>
          <p className="text-gray-600 mb-4">
            В максимальной степени, допускаемой законодательством, ответственность ZumZam ограничивается:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Суммой, уплаченной пользователем за использование платформы (если применимо)</li>
            <li>Стоимостью подписки исполнителя за последний месяц</li>
            <li>Прямые убытки, причиненные исключительно по нашей вине</li>
          </ul>
          <p className="text-gray-600">
            <strong>ZumZam не несет ответственности за косвенные убытки, упущенную выгоду или моральный вред.</strong>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Рекомендации пользователям</h2>
          <p className="text-gray-600 mb-4">
            Для минимизации рисков мы рекомендуем пользователям:
          </p>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Для клиентов:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Внимательно читать описания услуг и отзывы</li>
            <li>Проверять квалификацию и документы исполнителей</li>
            <li>Оформлять заказы только через платформу</li>
            <li>Сохранять переписку и договоренности</li>
            <li>Использовать здравый смысл при выборе услуг</li>
            <li>Приглашать знакомых на мероприятия с детьми</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Для исполнителей:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Предоставлять полную и достоверную информацию</li>
            <li>Иметь все необходимые лицензии и разрешения</li>
            <li>Соблюдать правила безопасности</li>
            <li>Четко оговаривать условия с клиентами</li>
            <li>Поддерживать высокий уровень сервиса</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Связь с исполнителями</h2>
          <p className="text-gray-600 mb-4">
            После бронирования через платформу общение происходит непосредственно между клиентом и исполнителем.
            ZumZam не участвует в таких коммуникациях и не несет ответственности за:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Изменение условий заказа по договоренности сторон</li>
            <li>Дополнительные договоренности вне платформы</li>
            <li>Качество коммуникации между сторонами</li>
            <li>Любые изменения, согласованные устно или в переписке</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Форс-мажор</h2>
          <p className="text-gray-600 mb-4">
            В случае форс-мажорных обстоятельств (стихийные бедствия, пандемии, войны, забастовки,
            изменения законодательства) ZumZam не несет ответственности за невозможность предоставления услуг
            или задержки в работе платформы.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Применимое право</h2>
          <p className="text-gray-600 mb-4">
            Настоящий отказ от ответственности регулируется законодательством Российской Федерации.
            Все споры разрешаются в соответствии с действующим законодательством РФ.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Изменения документа</h2>
          <p className="text-gray-600 mb-4">
            ZumZam оставляет за собой право изменять настоящий отказ от ответственности в любое время.
            Изменения вступают в силу с момента публикации на сайте.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Согласие пользователя</h2>
          <p className="text-gray-600 mb-4">
            Используя платформу ZumZam, вы подтверждаете, что прочитали, поняли и согласны с настоящим
            отказом от ответственности. Если вы не согласны с каким-либо пунктом, пожалуйста,
            воздержитесь от использования сервиса.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Контакты</h2>
          <p className="text-gray-600 mb-4">
            По вопросам, связанным с использованием платформы:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Email:</strong> legal@zumzam.ru</li>
            <li><strong>Форма обратной связи:</strong> через раздел "Помощь"</li>
            <li><strong>Телефон:</strong> для срочных юридических вопросов</li>
          </ul>
        </section>
      </div>
    </div>
  )
}













