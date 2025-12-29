import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Правила модерации отзывов — ZumZam',
  description: 'Правила публикации и модерации отзывов на платформе ZumZam',
}

export default function ReviewsPolicyPage() {
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

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Правила модерации отзывов</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          Дата последнего обновления: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Цель отзывов</h2>
          <p className="text-gray-600 mb-4">
            Отзывы на платформе ZumZam помогают пользователям принимать обоснованные решения при выборе услуг
            для детских праздников. Они способствуют улучшению качества сервиса и формированию доверия
            между клиентами и исполнителями.
          </p>
          <p className="text-gray-600">
            Все отзывы должны быть объективными, полезными и основанными на реальном опыте использования услуг.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Правила публикации отзывов</h2>

          <h3 className="text-lg font-medium text-gray-800 mb-3">2.1. Кто может оставлять отзывы</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Только пользователи, которые реально пользовались услугами исполнителя</li>
            <li>Заказ должен быть подтвержден через платформу ZumZam</li>
            <li>Отзыв можно оставить в течение 30 дней после завершения мероприятия</li>
            <li>Один отзыв на одного исполнителя от одного клиента</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">2.2. Содержание отзыва</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Описывать реальный опыт использования услуг</li>
            <li>Указывать конкретные факты и детали</li>
            <li>Быть объективным и сбалансированным</li>
            <li>Избегать субъективных оценок без обоснования</li>
            <li>Минимум 50 символов, максимум 2000 символов</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">2.3. Рейтинг</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Обязательная оценка от 1 до 5 звезд</li>
            <li>1 звезда - очень плохо, 5 звезд - отлично</li>
            <li>Рейтинг должен соответствовать тексту отзыва</li>
            <li>Нельзя ставить заниженный рейтинг без обоснования</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Запрещенный контент</h2>
          <p className="text-gray-600 mb-4">
            Следующие типы отзывов будут удалены, а аккаунты нарушителей могут быть заблокированы:
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-red-900 mb-3">Строго запрещено</h3>
            <ul className="list-disc list-inside text-red-700 space-y-1">
              <li>Оскорбления, угрозы, нецензурная лексика</li>
              <li>Клевета и заведомо ложная информация</li>
              <li>Разглашение персональных данных</li>
              <li>Нарушение авторских прав</li>
              <li>Спам и рекламные материалы</li>
              <li>Политические высказывания</li>
              <li>Дискриминация по признакам пола, расы, религии</li>
              <li>Пропаганда насилия или вредных привычек</li>
            </ul>
          </div>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Не рекомендуется</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Субъективные оценки без фактов</li>
            <li>Сравнение с другими исполнителями</li>
            <li>Требования компенсаций или угрозы</li>
            <li>Излишне эмоциональный язык</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Процесс модерации</h2>

          <h3 className="text-lg font-medium text-gray-800 mb-3">4.1. Премодерация</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Все отзывы проходят автоматическую проверку на запрещенный контент</li>
            <li>Подозрительные отзывы отправляются на ручную модерацию</li>
            <li>Время проверки: до 24 часов в рабочее время</li>
            <li>Автор получает уведомление о статусе отзыва</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">4.2. Ручная модерация</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Проводится специалистами ZumZam</li>
            <li>Оценивается соответствие правилам</li>
            <li>Принимается решение об одобрении или отклонении</li>
            <li>В спорных случаях привлекается дополнительный модератор</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">4.3. Постмодерация</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Опубликованные отзывы могут быть удалены при жалобах</li>
            <li>Регулярная проверка отзывов на соответствие правилам</li>
            <li>Удаление отзывов по истечении срока давности</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Ответы исполнителей</h2>
          <p className="text-gray-600 mb-4">
            Исполнители имеют право отвечать на отзывы в течение 14 дней после публикации:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Ответ должен быть вежливым и конструктивным</li>
            <li>Максимум 1000 символов</li>
            <li>Запрещено оскорблять автора отзыва</li>
            <li>Ответы проходят ту же модерацию</li>
            <li>Можно предложить решение проблемы или компенсацию</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Жалобы на отзывы</h2>
          <p className="text-gray-600 mb-4">
            Если вы считаете, что отзыв нарушает правила, вы можете подать жалобу:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Через кнопку "Пожаловаться" под отзывом</li>
            <li>Указать причину жалобы</li>
            <li>Предоставить доказательства (при наличии)</li>
            <li>Жалоба рассматривается в течение 48 часов</li>
          </ul>
          <p className="text-gray-600">
            Злоупотребление системой жалоб может привести к блокировке аккаунта.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Система рейтинга</h2>
          <p className="text-gray-600 mb-4">
            Общий рейтинг исполнителя рассчитывается на основе всех отзывов:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Среднее арифметическое всех оценок</li>
            <li>Учитываются только проверенные отзывы</li>
            <li>Рейтинг обновляется в реальном времени</li>
            <li>Отображается с точностью до 0.1 звезды</li>
            <li>Влияет на позицию в поиске</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Последствия нарушений</h2>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Для авторов отзывов</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Предупреждение:</strong> удаление отзыва с возможностью переписать</li>
            <li><strong>Блокировка отзывов:</strong> запрет на публикацию новых отзывов</li>
            <li><strong>Блокировка аккаунта:</strong> при систематических нарушениях</li>
            <li><strong>Удаление аккаунта:</strong> при грубых нарушениях</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Для исполнителей</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Удаление ответа:</strong> на нарушение в ответе</li>
            <li><strong>Понижение рейтинга:</strong> при подозрении в накрутке отзывов</li>
            <li><strong>Блокировка профиля:</strong> при систематических жалобах</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Борьба с накруткой отзывов</h2>
          <p className="text-gray-600 mb-4">
            Мы активно боремся с искусственным завышением или занижением рейтинга:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Проверка подлинности заказов перед публикацией отзывов</li>
            <li>Мониторинг подозрительной активности</li>
            <li>Анализ текстов отзывов на предмет шаблонности</li>
            <li>Проверка IP-адресов и аккаунтов на связь</li>
            <li>Удаление фейковых отзывов без предупреждения</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Хранение отзывов</h2>
          <p className="text-gray-600 mb-4">
            Отзывы хранятся на платформе бессрочно, если не запрошено их удаление:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Автор отзыва может запросить удаление в любое время</li>
            <li>Исполнитель может запросить удаление только по согласованию с автором</li>
            <li>Удаленные отзывы не восстанавливаются</li>
            <li>Статистика рейтинга пересчитывается после удаления</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Конфиденциальность</h2>
          <p className="text-gray-600 mb-4">
            При публикации отзывов соблюдаются принципы конфиденциальности:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Персональные данные автора скрыты</li>
            <li>Отображаются только имя/никнейм и дата</li>
            <li>Полные данные доступны только администрации</li>
            <li>Отзывы не передаются третьим лицам</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Изменения правил</h2>
          <p className="text-gray-600 mb-4">
            ZumZam оставляет за собой право изменять правила модерации отзывов. При внесении существенных изменений:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Уведомление пользователей за 7 дней</li>
            <li>Публикация новых правил на сайте</li>
            <li>Применение новых правил только к новым отзывам</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Рекомендации по написанию отзывов</h2>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">Как написать хороший отзыв</h3>
            <ul className="list-disc list-inside text-green-700 space-y-1">
              <li>Опишите, что именно понравилось или не понравилось</li>
              <li>Укажите конкретные детали: время, место, участники</li>
              <li>Будьте объективны и конструктивны</li>
              <li>Помните, что отзывы читают другие родители</li>
              <li>Если были проблемы, укажите, как исполнитель их решил</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Примеры хороших отзывов</h3>
            <div className="text-blue-700 space-y-2">
              <p><strong>Положительный:</strong> "Аниматор пришел вовремя, дети были в восторге от программы. Все прошло безопасно, много фотографий сделали. Спасибо за праздник!"</p>
              <p><strong>Конструктивный:</strong> "Шоу было веселым, но началось с небольшой задержкой. Организаторы исправились, добавив дополнительные игры. В целом довольны."</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Контакты</h2>
          <p className="text-gray-600 mb-4">
            По вопросам модерации отзывов и жалобам:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Email:</strong> moderation@zumzam.ru</li>
            <li><strong>Форма жалобы:</strong> кнопка "Пожаловаться" под отзывом</li>
            <li><strong>Чат поддержки:</strong> для вопросов по правилам</li>
          </ul>
        </section>
      </div>
    </div>
  )
}













