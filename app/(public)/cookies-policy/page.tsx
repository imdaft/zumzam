import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Политика использования cookies — ZumZam',
  description: 'Информация об использовании файлов cookie на платформе ZumZam',
}

export default function CookiesPolicyPage() {
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

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Политика использования cookies</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          Дата последнего обновления: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Что такое cookies?</h2>
          <p className="text-gray-600 mb-4">
            Cookies (куки) — это небольшие текстовые файлы, которые сохраняются на вашем устройстве
            (компьютере, смартфоне или планшете) при посещении веб-сайтов. Они помогают сайту запомнить
            ваши предпочтения и настройки, улучшить пользовательский опыт и собрать статистику использования.
          </p>
          <p className="text-gray-600">
            Cookies не содержат вредоносный код и не могут получить доступ к информации на вашем устройстве.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Как мы используем cookies</h2>
          <p className="text-gray-600 mb-4">
            На платформе ZumZam мы используем различные типы cookies для обеспечения нормальной работы сервиса,
            улучшения пользовательского опыта и сбора аналитической информации.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Типы cookies, которые мы используем</h2>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">Необходимые cookies</h3>
            <p className="text-green-800 mb-3">
              Эти cookies обязательны для работы основных функций сайта. Без них сервис не сможет функционировать properly.
            </p>
            <ul className="list-disc list-inside text-green-700 space-y-1">
              <li><strong>Аутентификация:</strong> сохранение сессии пользователя</li>
              <li><strong>Безопасность:</strong> защита от CSRF-атак и мошенничества</li>
              <li><strong>Настройки интерфейса:</strong> язык, тема, предпочтения отображения</li>
              <li><strong>Корзина и бронирования:</strong> сохранение выбранных услуг</li>
            </ul>
            <p className="text-green-700 text-sm mt-2">
              <strong>Срок хранения:</strong> до окончания сессии или 30 дней
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Аналитические cookies</h3>
            <p className="text-blue-800 mb-3">
              Эти cookies помогают нам понять, как пользователи взаимодействуют с сайтом, и улучшить его работу.
            </p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li><strong>Google Analytics:</strong> статистика посещений и поведения пользователей</li>
              <li><strong>Yandex.Metrika:</strong> анализ трафика и конверсий</li>
              <li><strong>Внутренняя аналитика:</strong> метрики использования функций</li>
              <li><strong>A/B тестирование:</strong> оценка эффективности изменений</li>
            </ul>
            <p className="text-blue-700 text-sm mt-2">
              <strong>Срок хранения:</strong> 26 месяцев
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3">Функциональные cookies</h3>
            <p className="text-yellow-800 mb-3">
              Эти cookies позволяют сохранять ваши предпочтения и настройки для более удобного использования.
            </p>
            <ul className="list-disc list-inside text-yellow-700 space-y-1">
              <li><strong>Геолокация:</strong> сохранение города и региона для поиска</li>
              <li><strong>Избранное:</strong> сохранение понравившихся профилей</li>
              <li><strong>Фильтры поиска:</strong> сохранение параметров фильтрации</li>
              <li><strong>Язык и регион:</strong> предпочтения локализации</li>
            </ul>
            <p className="text-yellow-700 text-sm mt-2">
              <strong>Срок хранения:</strong> 1 год
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">Маркетинговые cookies</h3>
            <p className="text-purple-800 mb-3">
              Эти cookies используются для показа релевантной рекламы и измерения эффективности маркетинговых кампаний.
            </p>
            <ul className="list-disc list-inside text-purple-700 space-y-1">
              <li><strong>Таргетированная реклама:</strong> показ предложений на основе интересов</li>
              <li><strong>Рекомендации:</strong> персонализация предложений услуг</li>
              <li><strong>Ретаргетинг:</strong> показ рекламы просмотренных услуг</li>
              <li><strong>Партнерские программы:</strong> отслеживание рефералов</li>
            </ul>
            <p className="text-purple-700 text-sm mt-2">
              <strong>Срок хранения:</strong> 90 дней
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Cookies третьих сторон</h2>
          <p className="text-gray-600 mb-4">
            Мы используем сервисы третьих сторон, которые устанавливают свои cookies:
          </p>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Google Analytics</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Цель:</strong> Анализ трафика и поведения пользователей</li>
            <li><strong>Политика конфиденциальности:</strong> <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline">Google Privacy Policy</a></li>
            <li><strong>Отказ от отслеживания:</strong> <a href="https://tools.google.com/dlpage/gaoptout" className="text-blue-600 hover:underline">Google Analytics Opt-out</a></li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Yandex.Metrika</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Цель:</strong> Веб-аналитика и статистика</li>
            <li><strong>Политика конфиденциальности:</strong> <a href="https://yandex.ru/legal/confidential/" className="text-blue-600 hover:underline">Yandex Privacy Policy</a></li>
            <li><strong>Отказ от отслеживания:</strong> <a href="https://yandex.ru/support/metrika/general/opt-out.html" className="text-blue-600 hover:underline">Yandex Metrika Opt-out</a></li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Платежные системы</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>ЮKassa, Robokassa:</strong> Обработка платежей</li>
            <li><strong>Цель:</strong> Безопасная оплата услуг</li>
            <li><strong>Политики:</strong> Определяются платежными системами</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Управление cookies</h2>
          <p className="text-gray-600 mb-4">
            Вы можете контролировать использование cookies следующими способами:
          </p>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Настройки браузера</h3>
          <p className="text-gray-600 mb-4">
            Большинство браузеров позволяют управлять cookies через настройки:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Chrome:</strong> Настройки → Конфиденциальность → Cookies</li>
            <li><strong>Firefox:</strong> Настройки → Конфиденциальность → Cookies</li>
            <li><strong>Safari:</strong> Настройки → Конфиденциальность → Управление данными веб-сайтов</li>
            <li><strong>Edge:</strong> Настройки → Cookies и разрешения сайтов</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Наш баннер согласия</h3>
          <p className="text-gray-600 mb-4">
            При первом посещении сайта вы увидите баннер с настройками cookies. Вы можете:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Принять все cookies</li>
            <li>Отказаться от маркетинговых cookies</li>
            <li>Настроить предпочтения индивидуально</li>
            <li>Изменить настройки в любое время через ссылку в футере</li>
          </ul>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
            <p className="text-gray-700 text-sm">
              <strong>Важно:</strong> Отключение необходимых cookies может повлиять на функциональность сайта.
              Некоторые функции могут стать недоступными.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Cookies и персональные данные</h2>
          <p className="text-gray-600 mb-4">
            Cookies могут содержать информацию, которая считается персональными данными в соответствии с GDPR:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Идентификаторы:</strong> уникальные ID для отслеживания сессий</li>
            <li><strong>IP-адреса:</strong> для геолокации и безопасности</li>
            <li><strong>История просмотров:</strong> для персонализации рекомендаций</li>
          </ul>
          <p className="text-gray-600">
            Обработка таких данных регулируется нашей <Link href="/privacy" className="text-blue-600 hover:underline">Политикой конфиденциальности</Link>
            и соответствует требованиям GDPR и ФЗ-152.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Срок хранения cookies</h2>
          <p className="text-gray-600 mb-4">
            Различные типы cookies имеют разные сроки хранения:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Сессионные cookies:</strong> удаляются при закрытии браузера</li>
            <li><strong>Постоянные cookies:</strong> хранятся от нескольких дней до 2 лет</li>
            <li><strong>Cookies третьих сторон:</strong> определяются их политиками</li>
          </ul>
          <p className="text-gray-600">
            Cookies автоматически удаляются по истечении срока или при очистке кэша браузера.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Влияние на приватность</h2>
          <p className="text-gray-600 mb-4">
            Cookies помогают нам предоставлять лучший пользовательский опыт, но мы уважаем вашу приватность:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Анонимизация:</strong> аналитические данные анонимизируются</li>
            <li><strong>Минимизация данных:</strong> собираем только необходимую информацию</li>
            <li><strong>Прозрачность:</strong> полный список cookies в этой политике</li>
            <li><strong>Контроль:</strong> возможность отказаться от несущественных cookies</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Мобильные приложения</h2>
          <p className="text-gray-600 mb-4">
            Если у нас будет мобильное приложение, оно также может использовать аналогичные технологии для хранения данных на устройстве.
            Настройки приватности в приложении будут соответствовать этой политике.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Изменения политики</h2>
          <p className="text-gray-600 mb-4">
            Мы можем обновлять эту политику для отражения изменений в технологиях или законодательстве.
            При внесении существенных изменений мы уведомим пользователей через сайт или email.
          </p>
          <p className="text-gray-600">
            Дата последнего обновления указана в начале документа.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Контакты</h2>
          <p className="text-gray-600 mb-4">
            По вопросам использования cookies и приватности:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Email:</strong> privacy@zumzam.ru</li>
            <li><strong>Форма обратной связи:</strong> через раздел "Помощь"</li>
            <li><strong>Настройки cookies:</strong> ссылка в футере сайта</li>
          </ul>
        </section>
      </div>
    </div>
  )
}













