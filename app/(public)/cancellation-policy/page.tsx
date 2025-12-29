import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Политика отмены бронирований — ZumZam',
  description: 'Правила отмены и переноса бронирований услуг на платформе ZumZam',
}

export default function CancellationPolicyPage() {
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

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Политика отмены бронирований</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 mb-6">
          Дата последнего обновления: {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Общие положения</h2>
          <p className="text-gray-600 mb-4">
            Настоящая Политика регулирует порядок отмены и переноса бронирований услуг на платформе ZumZam.
            Политика применяется ко всем категориям услуг: аниматоры, шоу-программы, квесты, мастер-классы,
            фотографы и площадки для мероприятий.
          </p>
          <p className="text-gray-600">
            Цель политики — обеспечить справедливые условия для клиентов и исполнителей услуг,
            минимизировать финансовые потери и поддерживать надежность платформы.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Отмена бронирования клиентом</h2>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-red-900 mb-3">Правила отмены для клиентов</h3>
            <p className="text-red-800 mb-3">Штрафы рассчитываются от полной стоимости заказа:</p>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-red-200">
                  <th className="text-left py-2 text-red-900">Срок до мероприятия</th>
                  <th className="text-left py-2 text-red-900">Штраф</th>
                  <th className="text-left py-2 text-red-900">Возврат</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-red-100">
                  <td className="py-2">Более 30 дней</td>
                  <td className="py-2">0%</td>
                  <td className="py-2">100% возврата</td>
                </tr>
                <tr className="border-b border-red-100">
                  <td className="py-2">15-30 дней</td>
                  <td className="py-2">20%</td>
                  <td className="py-2">80% возврата</td>
                </tr>
                <tr className="border-b border-red-100">
                  <td className="py-2">7-14 дней</td>
                  <td className="py-2">50%</td>
                  <td className="py-2">50% возврата</td>
                </tr>
                <tr>
                  <td className="py-2">Менее 7 дней</td>
                  <td className="py-2">100%</td>
                  <td className="py-2">Возврат невозможен</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-gray-600 mb-4">
            <strong>Условия возврата средств:</strong>
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Возврат осуществляется на тот же способ оплаты</li>
            <li>Срок обработки: 3-10 рабочих дней</li>
            <li>Применяются комиссии платежных систем</li>
            <li>В случае форс-мажора штрафы могут быть отменены</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Отмена бронирования исполнителем</h2>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-orange-900 mb-3">Правила отмены для исполнителей</h3>
            <p className="text-orange-800 mb-3">Штрафы рассчитываются от стоимости заказа:</p>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-orange-200">
                  <th className="text-left py-2 text-orange-900">Срок до мероприятия</th>
                  <th className="text-left py-2 text-orange-900">Штраф</th>
                  <th className="text-left py-2 text-orange-900">Последствия</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-orange-100">
                  <td className="py-2">Более 30 дней</td>
                  <td className="py-2">20%</td>
                  <td className="py-2">Возврат клиенту 80%</td>
                </tr>
                <tr className="border-b border-orange-100">
                  <td className="py-2">15-30 дней</td>
                  <td className="py-2">50%</td>
                  <td className="py-2">Возврат клиенту 50%</td>
                </tr>
                <tr className="border-b border-orange-100">
                  <td className="py-2">7-14 дней</td>
                  <td className="py-2">80%</td>
                  <td className="py-2">Возврат клиенту 20%</td>
                </tr>
                <tr>
                  <td className="py-2">Менее 7 дней</td>
                  <td className="py-2">100%</td>
                  <td className="py-2">Возврат невозможен</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-gray-600 mb-4">
            <strong>Дополнительные последствия для исполнителей:</strong>
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Понижение рейтинга и позиции в поиске</li>
            <li>Временная блокировка получения новых заказов</li>
            <li>Обязательная компенсация клиенту (по договоренности)</li>
            <li>В严重的 случаях — блокировка профиля</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Перенос бронирования</h2>
          <p className="text-gray-600 mb-4">
            Перенос даты или времени мероприятия рассматривается как более мягкая процедура по сравнению с отменой:
          </p>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Условия переноса</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Более 14 дней до мероприятия:</strong> бесплатный перенос (один раз)</li>
            <li><strong>7-14 дней до мероприятия:</strong> штраф 10% от стоимости</li>
            <li><strong>Менее 7 дней:</strong> перенос возможен только по согласию исполнителя</li>
            <li>Перенос возможен не более чем на 30 дней от исходной даты</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Процедура переноса</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Обращение через чат в заказе или службу поддержки</li>
            <li>Согласование новой даты с исполнителем</li>
            <li>Подтверждение переноса обеими сторонами</li>
            <li>Обновление деталей заказа в системе</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Изменение условий заказа</h2>
          <p className="text-gray-600 mb-4">
            Изменение состава услуг, количества участников или других параметров заказа:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Увеличение стоимости:</strong> доплата в соответствии с прайсом исполнителя</li>
            <li><strong>Уменьшение стоимости:</strong> перерасчет и возврат разницы</li>
            <li><strong>Существенные изменения:</strong> могут быть расценены как отмена старого и создание нового заказа</li>
            <li>Изменения возможны не позднее чем за 7 дней до мероприятия</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Форс-мажорные обстоятельства</h2>
          <p className="text-gray-600 mb-4">
            В случае форс-мажора (болезнь, аварии, природные катастрофы, карантин и т.д.) применяются особые условия:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Отмена по форс-мажору:</strong> штрафы отменяются, полный возврат средств</li>
            <li><strong>Перенос мероприятия:</strong> возможен без штрафов в разумные сроки</li>
            <li><strong>Подтверждение форс-мажора:</strong> требуется документальное подтверждение</li>
            <li><strong>Альтернативные варианты:</strong> предлагаются доступные замены услуг</li>
          </ul>
          <p className="text-gray-600">
            Решение о форс-мажоре принимает служба поддержки на основе предоставленных документов.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Возврат средств</h2>
          <p className="text-gray-600 mb-4">
            Процедура возврата средств при отмене бронирования:
          </p>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Сроки возврата</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Банковские карты:</strong> 3-7 рабочих дней</li>
            <li><strong>Электронные кошельки:</strong> 1-3 рабочих дня</li>
            <li><strong>Банковский перевод:</strong> 5-10 рабочих дней</li>
          </ul>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Условия возврата</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Возврат осуществляется на тот же счет/карту</li>
            <li>Учитываются комиссии платежных систем</li>
            <li>В некоторых случаях возможен возврат на другой способ оплаты</li>
            <li>Возврат предоплаты осуществляется в полном объеме минус штрафы</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Споры и разногласия</h2>
          <p className="text-gray-600 mb-4">
            При возникновении споров по отмене бронирования:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Переговоры:</strong> стороны пытаются решить вопрос самостоятельно через чат</li>
            <li><strong>Медиация:</strong> служба поддержки выступает посредником</li>
            <li><strong>Арбитраж:</strong> в сложных случаях привлекается независимый эксперт</li>
            <li><strong>Судебное разбирательство:</strong> в соответствии с законодательством РФ</li>
          </ul>
          <p className="text-gray-600">
            ZumZam выступает гарантом соблюдения условий, но не несет ответственности за финансовые потери сторон.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Специальные условия</h2>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Корпоративные заказы</h3>
          <p className="text-gray-600 mb-4">
            Для корпоративных клиентов и мероприятий с большим количеством участников могут применяться индивидуальные условия отмены.
          </p>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Сезонные мероприятия</h3>
          <p className="text-gray-600 mb-4">
            Для новогодних, майских и других сезонных мероприятий могут действовать особые правила отмены с повышенными штрафами.
          </p>

          <h3 className="text-lg font-medium text-gray-800 mb-3">Долгосрочные контракты</h3>
          <p className="text-gray-600 mb-4">
            Для контрактов на серию мероприятий или ежемесячное обслуживание применяются отдельные условия.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Изменения политики</h2>
          <p className="text-gray-600 mb-4">
            ZumZam оставляет за собой право изменять настоящую Политику. При внесении существенных изменений:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li>Уведомление пользователей за 30 дней</li>
            <li>Публикация новых условий на сайте</li>
            <li>Применение новых правил только к новым заказам</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Контакты</h2>
          <p className="text-gray-600 mb-4">
            По вопросам отмены и переноса бронирований:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
            <li><strong>Email:</strong> cancellations@zumzam.ru</li>
            <li><strong>Чат поддержки:</strong> в разделе активных заказов</li>
            <li><strong>Телефон:</strong> для срочных случаев</li>
            <li><strong>Telegram:</strong> @zumzam_support</li>
          </ul>
        </section>
      </div>
    </div>
  )
}













