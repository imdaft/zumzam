import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Политика конфиденциальности — ZumZam',
  description: 'Политика конфиденциальности сервиса ZumZam — как мы защищаем ваши данные',
}

export default function PrivacyPage() {
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

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Политика конфиденциальности</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          Дата последнего обновления: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Общие положения</h2>
          <p className="text-gray-600 mb-4">
            Настоящая Политика конфиденциальности регулирует порядок обработки и защиты персональных данных пользователей сервиса ZumZam в соответствии с Федеральным законом РФ № 152-ФЗ "О персональных данных" и Общим регламентом по защите данных (GDPR) для пользователей из Европейского Союза.
          </p>
          <p className="text-gray-600 mb-4">
            Используя сервис ZumZam, вы соглашаетесь с условиями настоящей Политики.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Какие данные мы собираем</h2>
          <p className="text-gray-600 mb-4">
            При использовании сервиса ZumZam мы можем собирать следующую информацию:
          </p>

          <h3 className="text-lg font-medium text-gray-800 mb-3">2.1. Персональные данные пользователей:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Имя, фамилия</li>
            <li>Адрес электронной почты</li>
            <li>Номер телефона</li>
            <li>Дата рождения (для возрастных ограничений)</li>
            <li>Адрес доставки/проведения мероприятия</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">2.2. Данные о деятельности:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>История заказов и бронирований</li>
            <li>Предпочтения в услугах</li>
            <li>Отзывы и оценки</li>
            <li>Взаимодействие с исполнителями</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">2.3. Техническая информация:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>IP-адрес и геолокационные данные</li>
            <li>Тип устройства и браузера</li>
            <li>Cookies и аналогичные технологии</li>
            <li>Время и частота использования сервиса</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">2.4. Данные исполнителей услуг:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Наименование организации/ИП</li>
            <li>ИНН, ОГРН (для юридических лиц)</li>
            <li>Банковские реквизиты</li>
            <li>Документы для верификации</li>
            <li>Портфолио и примеры работ</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Цели обработки персональных данных</h2>
          <p className="text-gray-600 mb-4">
            Мы обрабатываем персональные данные исключительно для следующих целей:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Предоставление услуг:</strong> обработка заказов, бронирование услуг, коммуникация с исполнителями</li>
            <li><strong>Идентификация пользователей:</strong> подтверждение личности, верификация аккаунтов</li>
            <li><strong>Улучшение сервиса:</strong> анализ использования, оптимизация интерфейса, разработка новых функций</li>
            <li><strong>Маркетинг и коммуникации:</strong> отправка уведомлений о заказах, информационных рассылок (с согласия)</li>
            <li><strong>Безопасность:</strong> предотвращение мошенничества, защита от злоупотреблений</li>
            <li><strong>Юридические обязательства:</strong> соблюдение требований законодательства, разрешение споров</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Правовые основания обработки данных</h2>
          <p className="text-gray-600 mb-4">
            Обработка персональных данных осуществляется на следующих основаниях:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Согласие пользователя:</strong> для маркетинговых коммуникаций и несущественных данных</li>
            <li><strong>Необходимость исполнения договора:</strong> для предоставления услуг и обработки заказов</li>
            <li><strong>Законные интересы:</strong> для улучшения сервиса, безопасности и аналитики</li>
            <li><strong>Юридические обязательства:</strong> для соблюдения требований законодательства</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Передача данных третьим лицам</h2>
          <p className="text-gray-600 mb-4">
            Мы не продаём и не передаём ваши персональные данные третьим лицам для коммерческих целей. Передача возможна только в следующих случаях:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Исполнителям услуг:</strong> передача необходимых данных для выполнения заказа (имя, контакты, детали мероприятия)</li>
            <li><strong>Платежным системам:</strong> передача данных для обработки платежей (в соответствии с их политиками)</li>
            <li><strong>Провайдерам услуг:</strong> аналитика (Google Analytics), хостинг (Supabase), email-рассылки</li>
            <li><strong>Государственным органам:</strong> по официальным запросам в соответствии с законодательством РФ</li>
            <li><strong>Ваше согласие:</strong> при явном разрешении на передачу данных</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Международная передача данных</h2>
          <p className="text-gray-600 mb-4">
            Ваши данные могут передаваться в другие страны, включая страны Европейского Союза и США, где находятся наши провайдеры услуг. В таких случаях мы обеспечиваем адекватный уровень защиты данных в соответствии с требованиями GDPR.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Сроки хранения данных</h2>
          <p className="text-gray-600 mb-4">
            Мы храним персональные данные только в течение времени, необходимого для достижения целей обработки:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Данные аккаунта:</strong> до удаления аккаунта или отзыва согласия</li>
            <li><strong>История заказов:</strong> 5 лет после выполнения заказа (требования бухгалтерского учета)</li>
            <li><strong>Отзывы и оценки:</strong> бессрочно, если не запрошено удаление</li>
            <li><strong>Технические данные:</strong> до 2 лет для аналитики и улучшения сервиса</li>
            <li><strong>Данные для верификации:</strong> до прекращения отношений с исполнителем</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Защита данных</h2>
          <p className="text-gray-600 mb-4">
            Мы применяем современные методы защиты информации:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Шифрование:</strong> данные передаются по защищенным каналам (HTTPS/TLS)</li>
            <li><strong>Безопасное хранение:</strong> пароли хешируются, чувствительные данные шифруются</li>
            <li><strong>Контроль доступа:</strong> ограниченный доступ персонала к персональным данным</li>
            <li><strong>Регулярные аудиты:</strong> проверка безопасности систем и процессов</li>
            <li><strong>Мониторинг:</strong> обнаружение и предотвращение несанкционированного доступа</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Ваши права</h2>
          <p className="text-gray-600 mb-4">
            В соответствии с законодательством о персональных данных вы имеете следующие права:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Право на доступ:</strong> запросить информацию о том, какие данные о вас хранятся</li>
            <li><strong>Право на исправление:</strong> запросить исправление неточных или неполных данных</li>
            <li><strong>Право на удаление:</strong> запросить удаление ваших данных ("право на забвение")</li>
            <li><strong>Право на переносимость:</strong> получить копию ваших данных в машиночитаемом формате</li>
            <li><strong>Право на ограничение обработки:</strong> временно приостановить обработку данных</li>
            <li><strong>Право на возражение:</strong> возразить против обработки данных для маркетинговых целей</li>
            <li><strong>Право отозвать согласие:</strong> в любое время отозвать данное ранее согласие</li>
          </ul>
          <p className="text-gray-600 mt-4">
            Для реализации этих прав обратитесь в службу поддержки с соответствующим запросом.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Файлы cookie и аналогичные технологии</h2>
          <p className="text-gray-600 mb-4">
            Мы используем файлы cookie и аналогичные технологии для улучшения работы сервиса:
          </p>

          <h3 className="text-lg font-medium text-gray-800 mb-3">10.1. Необходимые cookie:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Аутентификация и безопасность сессии</li>
            <li>Запоминание предпочтений интерфейса</li>
            <li>Предотвращение мошенничества</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">10.2. Аналитические cookie:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Google Analytics для анализа трафика</li>
            <li>Метрики использования сервиса</li>
            <li>Улучшение пользовательского опыта</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">10.3. Маркетинговые cookie:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Персонализация рекомендаций</li>
            <li>Таргетированная реклама (только с согласия)</li>
          </ul>

          <p className="text-gray-600 mt-4">
            Вы можете управлять настройками cookie в вашем браузере или через наш баннер согласия.
            Отключение некоторых cookie может повлиять на функциональность сервиса.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Обработка данных детей</h2>
          <p className="text-gray-600 mb-4">
            Сервис ZumZam предназначен для организации детских праздников, поэтому мы можем обрабатывать данные несовершеннолетних в контексте заказов услуг. Мы не собираем персональные данные детей без согласия родителей или законных представителей.
          </p>
          <p className="text-gray-600">
            Если вы являетесь родителем или опекуном и хотите запросить удаление данных ребенка, обратитесь в службу поддержки.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Изменения в Политике</h2>
          <p className="text-gray-600 mb-4">
            Мы можем обновлять настоящую Политику конфиденциальности для отражения изменений в наших практиках или законодательстве. При внесении существенных изменений мы уведомим пользователей через email или уведомление в сервисе.
          </p>
          <p className="text-gray-600">
            Продолжение использования сервиса после изменений означает согласие с обновленной Политикой.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Контакты</h2>
          <p className="text-gray-600 mb-4">
            По вопросам, связанным с обработкой персональных данных, вы можете обратиться:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Email:</strong> privacy@zumzam.ru</li>
            <li><strong>Форма обратной связи:</strong> через раздел "Помощь" в сервисе</li>
            <li><strong>Почтовый адрес:</strong> Санкт-Петербург, для официальных запросов</li>
          </ul>
          <p className="text-gray-600">
            Мы стремимся отвечать на запросы в течение 30 дней в соответствии с требованиями законодательства.
          </p>
        </section>
      </div>
    </div>
  )
}

