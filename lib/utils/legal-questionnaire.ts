/**
 * Анкета для генерации юридических документов
 * Содержит вопросы, специфичные для каждого типа профиля и юридической формы
 */

export type QuestionType = 'select' | 'text' | 'number' | 'textarea'

export interface QuestionOption {
  value: string
  label: string
  description?: string
}

export interface Question {
  id: string
  question: string
  type: QuestionType
  options?: QuestionOption[] // Для select
  placeholder?: string
  hint?: string
  required: boolean
  allowCustom?: boolean // Разрешить свой вариант для select
  condition?: {
    profileType?: string[]
    legalForm?: string[]
  }
}

/**
 * Универсальные вопросы для всех типов
 */
const commonQuestions: Question[] = [
  // Юридические данные организации
  {
    id: 'company_name',
    question: 'Название компании / ФИО',
    type: 'text',
    placeholder: 'Например: ООО "Праздник" или Иванов Иван Иванович',
    hint: 'Укажите полное название компании или ваше ФИО для физического лица',
    required: true,
  },
  {
    id: 'legal_form',
    question: 'Правовая форма',
    type: 'select',
    options: [
      { value: 'private', label: 'Физическое лицо' },
      { value: 'self_employed', label: 'Самозанятый' },
      { value: 'ip', label: 'ИП' },
      { value: 'ooo', label: 'ООО' },
    ],
    required: true,
  },
  {
    id: 'inn',
    question: 'ИНН',
    type: 'text',
    placeholder: '1234567890 (ИП/ООО) или 123456789012 (Самозанятый)',
    hint: 'Обязательно для ИП, ООО и Самозанятых',
    required: false,
  },
  {
    id: 'ogrn',
    question: 'ОГРН/ОГРНИП',
    type: 'text',
    placeholder: '1234567890123',
    hint: 'Обязательно для ИП и ООО',
    required: false,
  },
  {
    id: 'legal_address',
    question: 'Юридический адрес',
    type: 'text',
    placeholder: 'г. Москва, ул. Примерная, д. 1, кв. 1',
    hint: 'Полный адрес регистрации компании или место жительства',
    required: true,
  },
  {
    id: 'director_name',
    question: 'ФИО руководителя / ИП',
    type: 'text',
    placeholder: 'Иванов Иван Иванович',
    hint: 'Полное ФИО директора (для ООО) или ИП',
    required: false,
  },
  {
    id: 'phone',
    question: 'Телефон',
    type: 'text',
    placeholder: '+7 (999) 123-45-67',
    required: true,
  },
  {
    id: 'email',
    question: 'Email',
    type: 'text',
    placeholder: 'info@example.com',
    required: true,
  },
  {
    id: 'website',
    question: 'Сайт (необязательно)',
    type: 'text',
    placeholder: 'example.com',
    required: false,
  },
  
  // Банковские реквизиты
  {
    id: 'bank_account',
    question: 'Расчётный счёт',
    type: 'text',
    placeholder: '40817810099910004312',
    hint: 'Обязательно для ИП и ООО (для получения задатка)',
    required: false,
  },
  {
    id: 'bank_name',
    question: 'Название банка',
    type: 'text',
    placeholder: 'ПАО Сбербанк',
    required: false,
  },
  {
    id: 'bank_bik',
    question: 'БИК банка',
    type: 'text',
    placeholder: '044525225',
    required: false,
  },
  {
    id: 'bank_corr_account',
    question: 'Корреспондентский счёт',
    type: 'text',
    placeholder: '30101810400000000225',
    required: false,
  },
  
  // Юрисдикция
  {
    id: 'city',
    question: 'Город (для определения подсудности)',
    type: 'text',
    placeholder: 'Москва',
    hint: 'Споры будут рассматриваться в суде по месту нахождения Исполнителя',
    required: true,
  },

  // Условия отмены и оплаты
  {
    id: 'cancellation_policy_days',
    question: 'За сколько дней до мероприятия клиент может отменить с полным возвратом?',
    type: 'select',
    options: [
      { value: '3', label: '3 дня', description: 'Минимальный срок' },
      { value: '7', label: '7 дней', description: 'Рекомендуемый срок' },
      { value: '14', label: '14 дней', description: 'Максимальный срок' },
      { value: 'custom', label: 'Свой вариант', description: 'Укажите свой срок' },
    ],
    required: true,
    allowCustom: true,
  },
  {
    id: 'cancellation_policy_days_custom',
    question: 'Укажите количество дней',
    type: 'number',
    placeholder: 'Например: 5',
    required: false,
    condition: {}, // Показывается условно
  },
  {
    id: 'partial_refund_days',
    question: 'За сколько дней до мероприятия клиент может отменить с частичным возвратом (50%)?',
    type: 'select',
    options: [
      { value: '24h', label: '24 часа (1 день)' },
      { value: '48h', label: '48 часов (2 дня)' },
      { value: '72h', label: '72 часа (3 дня)' },
      { value: 'none', label: 'Не предусмотрено' },
      { value: 'custom', label: 'Свой вариант' },
    ],
    required: true,
    allowCustom: true,
  },
  {
    id: 'partial_refund_days_custom_value',
    question: 'Укажите условия частичного возврата',
    type: 'text',
    placeholder: 'Например: за 12 часов до мероприятия',
    required: false,
    condition: {}, // Показывается условно (когда partial_refund_days === 'custom')
  },
  {
    id: 'deposit_amount',
    question: 'Размер задатка (в рублях)',
    type: 'number',
    placeholder: 'Например: 5000',
    hint: 'Рекомендуется 20-50% от стоимости услуги',
    required: true,
  },
  {
    id: 'full_payment_deadline',
    question: 'Когда клиент должен внести полную оплату?',
    type: 'select',
    options: [
      { value: 'day_of', label: 'В день мероприятия' },
      { value: '1_day', label: 'За 1 день до мероприятия' },
      { value: '3_days', label: 'За 3 дня до мероприятия' },
      { value: '7_days', label: 'За 7 дней до мероприятия' },
      { value: 'custom', label: 'Свой вариант' },
    ],
    required: true,
    allowCustom: true,
  },
  {
    id: 'full_payment_deadline_custom_value',
    question: 'Укажите срок полной оплаты',
    type: 'text',
    placeholder: 'Например: за 5 дней до мероприятия',
    required: false,
    condition: {}, // Показывается условно (когда full_payment_deadline === 'custom')
  },
  {
    id: 'late_arrival_policy',
    question: 'Что происходит при опоздании клиента?',
    type: 'select',
    options: [
      { value: 'not_applicable', label: 'Не применимо' },
      { value: 'time_reduced', label: 'Время мероприятия сокращается на время опоздания' },
      { value: 'extra_charge', label: 'Можно продлить за дополнительную плату' },
      { value: 'no_refund', label: 'Опоздание не компенсируется, возврат невозможен' },
    ],
    required: true,
  },
  {
    id: 'illness_policy',
    question: 'Что происходит при болезни клиента?',
    type: 'select',
    options: [
      { value: 'not_applicable', label: 'Не применимо' },
      { value: 'no_refund_can_reschedule', label: 'Возврат невозможен, но можно перенести дату' },
      { value: 'no_refund_no_reschedule', label: 'Возврат и перенос невозможны' },
      { value: 'partial_refund', label: 'Частичный возврат (50%)' },
      { value: 'medical_cert', label: 'Перенос при наличии медицинской справки' },
    ],
    required: true,
  },
]

/**
 * Вопросы для площадки (venue)
 */
const venueQuestions: Question[] = [
  {
    id: 'max_guests',
    question: 'Максимальное количество гостей на площадке',
    type: 'number',
    placeholder: 'Например: 30',
    hint: 'Детей + взрослых',
    required: true,
  },
  {
    id: 'preparation_time',
    question: 'Время на подготовку до мероприятия (в минутах)',
    type: 'select',
    options: [
      { value: '0', label: 'Не требуется' },
      { value: '15', label: '15 минут' },
      { value: '30', label: '30 минут' },
      { value: '60', label: '1 час' },
      { value: 'custom', label: 'Свой вариант' },
    ],
    required: true,
    allowCustom: true,
  },
  {
    id: 'cleanup_time',
    question: 'Время на уборку после мероприятия (в минутах)',
    type: 'select',
    options: [
      { value: '0', label: 'Не требуется' },
      { value: '15', label: '15 минут' },
      { value: '30', label: '30 минут' },
      { value: '60', label: '1 час' },
      { value: 'custom', label: 'Свой вариант' },
    ],
    required: true,
    allowCustom: true,
  },
  {
    id: 'overtime_cost',
    question: 'Стоимость сверхурочного времени (за каждые 30 минут)',
    type: 'number',
    placeholder: 'Например: 1000 (или 0, если не применимо)',
    hint: 'В рублях. Укажите 0, если сверхурочные не предусмотрены',
    required: false,
  },
  {
    id: 'min_rental_hours',
    question: 'Минимальное время аренды (в часах)',
    type: 'select',
    options: [
      { value: '1', label: '1 час' },
      { value: '2', label: '2 часа' },
      { value: '3', label: '3 часа' },
    ],
    required: true,
  },
  {
    id: 'max_rental_hours',
    question: 'Максимальное время аренды (в часах)',
    type: 'select',
    options: [
      { value: '4', label: '4 часа' },
      { value: '6', label: '6 часов' },
      { value: '8', label: '8 часов' },
      { value: '12', label: '12 часов' },
    ],
    required: true,
  },
  {
    id: 'security_deposit',
    question: 'Залог за сохранность имущества (в рублях)',
    type: 'number',
    placeholder: 'Например: 5000 (или 0, если не требуется)',
    hint: 'Возвращается после проверки. Укажите 0, если залог не берёте',
    required: false,
  },
  {
    id: 'cleanup_fee',
    question: 'Стоимость дополнительной уборки при сильном загрязнении',
    type: 'number',
    placeholder: 'Например: 2000 (или 0, если не применимо)',
    hint: 'В рублях. Укажите 0, если не взимаете',
    required: false,
  },
  {
    id: 'cleanup_responsibilities',
    question: 'Что должен сделать клиент после мероприятия?',
    type: 'select',
    options: [
      { value: 'trash_dishes', label: 'Вынести мусор и помыть посуду' },
      { value: 'trash_only', label: 'Только вынести мусор' },
      { value: 'nothing', label: 'Генеральная уборка полностью на нас' },
    ],
    required: true,
  },
  {
    id: 'prohibited_items',
    question: 'Что запрещено приносить на площадку?',
    type: 'textarea',
    placeholder: 'Например: торты с блестками, конфетти, серпантин, свечи, алкоголь',
    hint: 'Перечислите через запятую',
    required: true,
  },
  {
    id: 'decoration_policy',
    question: 'Правила украшения площадки',
    type: 'select',
    options: [
      { value: 'full_service', label: 'Украшаем сами (включено в стоимость)' },
      { value: 'client_can', label: 'Клиент может украсить сам' },
      { value: 'extra_charge', label: 'Украшение за дополнительную плату' },
      { value: 'not_allowed', label: 'Украшения не предусмотрены' },
      { value: 'custom', label: 'Свой вариант' },
    ],
    required: true,
    allowCustom: true,
  },
  {
    id: 'catering_policy',
    question: 'Правила по еде и напиткам',
    type: 'select',
    options: [
      { value: 'own_only', label: 'Только наше меню/кейтеринг' },
      { value: 'client_can_bring', label: 'Можно принести своё' },
      { value: 'client_can_with_fee', label: 'Можно принести своё за доп. плату' },
      { value: 'not_applicable', label: 'Не применимо' },
      { value: 'custom', label: 'Свой вариант' },
    ],
    required: true,
    allowCustom: true,
  },
  {
    id: 'music_policy',
    question: 'Правила по музыке и звуковому оборудованию',
    type: 'select',
    options: [
      { value: 'provided', label: 'Оборудование предоставляется' },
      { value: 'client_brings', label: 'Клиент приносит своё' },
      { value: 'extra_charge', label: 'Оборудование за дополнительную плату' },
      { value: 'not_allowed', label: 'Музыка запрещена' },
      { value: 'custom', label: 'Свой вариант' },
    ],
    required: false,
    allowCustom: true,
  },
  {
    id: 'damage_policy',
    question: 'Политика возмещения ущерба',
    type: 'textarea',
    placeholder: 'Например: При повреждении имущества клиент возмещает полную стоимость ремонта/замены из залога. Оценку производит администрация площадки.',
    hint: 'Как определяется и возмещается ущерб',
    required: false,
  },
  {
    id: 'parent_supervision',
    question: 'Требуется ли присутствие родителей?',
    type: 'select',
    options: [
      { value: 'required', label: 'Обязательно (один родитель минимум)' },
      { value: 'recommended', label: 'Рекомендуется, но не обязательно' },
      { value: 'not_required', label: 'Не требуется' },
      { value: 'custom', label: 'Свой вариант' },
    ],
    required: false,
    allowCustom: true,
  },
  {
    id: 'age_restrictions',
    question: 'Возрастные ограничения',
    type: 'text',
    placeholder: 'Например: От 3 до 12 лет',
    hint: 'Укажите допустимый возраст детей',
    required: false,
  },
  {
    id: 'special_needs_policy',
    question: 'Политика для детей с особыми потребностями',
    type: 'textarea',
    placeholder: 'Например: Площадка адаптирована для детей с ограниченными возможностями. Есть пандус, широкие дверные проёмы.',
    hint: 'Доступность для детей с особыми потребностями',
    required: false,
  },
  {
    id: 'emergency_contact',
    question: 'Контакт для экстренных случаев (если отличается от основного)',
    type: 'text',
    placeholder: '+7 (999) 123-45-67',
    hint: 'Номер для связи в экстренных ситуациях во время мероприятия',
    required: false,
  },
  {
    id: 'insurance_policy',
    question: 'Наличие страхования ответственности',
    type: 'select',
    options: [
      { value: 'yes', label: 'Да, есть страхование' },
      { value: 'no', label: 'Нет страхования' },
    ],
    required: false,
  },
]

/**
 * Вопросы для аниматора
 */
const animatorQuestions: Question[] = [
  {
    id: 'program_duration_min',
    question: 'Минимальная продолжительность программы (в часах)',
    type: 'select',
    options: [
      { value: '1', label: '1 час' },
      { value: '1.5', label: '1,5 часа' },
      { value: '2', label: '2 часа' },
    ],
    required: true,
  },
  {
    id: 'program_duration_max',
    question: 'Максимальная продолжительность программы (в часах)',
    type: 'select',
    options: [
      { value: '2', label: '2 часа' },
      { value: '3', label: '3 часа' },
      { value: '4', label: '4 часа' },
    ],
    required: true,
  },
  {
    id: 'kids_count_min',
    question: 'Минимальное количество детей',
    type: 'number',
    placeholder: 'Например: 5',
    required: true,
  },
  {
    id: 'kids_count_max',
    question: 'Максимальное количество детей',
    type: 'number',
    placeholder: 'Например: 20',
    required: true,
  },
  {
    id: 'min_space_area',
    question: 'Минимальная площадь помещения (в кв.м)',
    type: 'number',
    placeholder: 'Например: 20',
    hint: 'Для комфортного проведения программы',
    required: true,
  },
  {
    id: 'replacement_policy',
    question: 'Что происходит при болезни аниматора?',
    type: 'select',
    options: [
      { value: 'replacement', label: 'Замена на другого специалиста' },
      { value: 'reschedule', label: 'Перенос на другую дату' },
      { value: 'refund', label: 'Полный возврат средств' },
    ],
    required: true,
  },
  {
    id: 'parents_presence',
    question: 'Должны ли родители присутствовать на мероприятии?',
    type: 'select',
    options: [
      { value: 'required', label: 'Обязательно' },
      { value: 'recommended', label: 'Желательно' },
      { value: 'optional', label: 'По желанию' },
    ],
    required: true,
  },
  {
    id: 'program_type',
    question: 'Тип программы',
    type: 'select',
    options: [
      { value: 'interactive', label: 'Интерактивная (дети участвуют)' },
      { value: 'show', label: 'Шоу (дети смотрят)' },
      { value: 'mixed', label: 'Смешанная' },
      { value: 'custom', label: 'Свой вариант' },
    ],
    required: false,
    allowCustom: true,
  },
  {
    id: 'costume_included',
    question: 'Костюм включён в стоимость?',
    type: 'select',
    options: [
      { value: 'yes', label: 'Да, включён' },
      { value: 'extra_charge', label: 'За дополнительную плату' },
      { value: 'client_provides', label: 'Клиент предоставляет' },
    ],
    required: false,
  },
  {
    id: 'props_included',
    question: 'Реквизит и материалы для игр',
    type: 'select',
    options: [
      { value: 'included', label: 'Включено в стоимость' },
      { value: 'extra_charge', label: 'За дополнительную плату' },
      { value: 'client_provides', label: 'Клиент предоставляет' },
      { value: 'not_applicable', label: 'Не требуется' },
    ],
    required: false,
  },
  {
    id: 'additional_animator_cost',
    question: 'Стоимость дополнительного аниматора (руб/час)',
    type: 'number',
    placeholder: 'Например: 2000',
    hint: 'Если можно добавить еще одного аниматора',
    required: false,
  },
  {
    id: 'travel_distance_included',
    question: 'Бесплатный радиус выезда (в км)',
    type: 'number',
    placeholder: 'Например: 10',
    hint: 'В пределах какого расстояния выезд бесплатен',
    required: false,
  },
  {
    id: 'travel_cost_per_km',
    question: 'Стоимость выезда за пределы бесплатного радиуса (руб/км)',
    type: 'number',
    placeholder: 'Например: 30',
    hint: 'Если применимо',
    required: false,
  },
  {
    id: 'program_customization',
    question: 'Возможна ли индивидуальная программа?',
    type: 'select',
    options: [
      { value: 'yes_free', label: 'Да, бесплатно' },
      { value: 'yes_extra', label: 'Да, за дополнительную плату' },
      { value: 'limited', label: 'Ограниченная кастомизация' },
      { value: 'no', label: 'Нет, только стандартная программа' },
    ],
    required: false,
  },
  {
    id: 'photo_video_policy',
    question: 'Правила фото/видеосъемки',
    type: 'select',
    options: [
      { value: 'allowed', label: 'Разрешена' },
      { value: 'with_permission', label: 'Только с разрешения' },
      { value: 'not_allowed', label: 'Запрещена' },
      { value: 'extra_charge', label: 'За дополнительную плату' },
    ],
    required: false,
  },
]

/**
 * Вопросы для шоу-программы
 */
const showQuestions: Question[] = [
  {
    id: 'performance_duration',
    question: 'Длительность выступления (в минутах)',
    type: 'number',
    placeholder: 'Например: 60',
    required: true,
  },
  {
    id: 'soundcheck_time',
    question: 'Время на саундчек/техническую репетицию (в минутах)',
    type: 'number',
    placeholder: 'Например: 30',
    required: true,
  },
  {
    id: 'technical_requirements',
    question: 'Основные технические требования',
    type: 'textarea',
    placeholder: 'Например: сцена 4x6м, 2 микрофона, звуковая система 2кВт',
    hint: 'Опишите требования к сцене, свету, звуку',
    required: true,
  },
  {
    id: 'artist_replacement',
    question: 'Возможна ли замена артистов в составе?',
    type: 'select',
    options: [
      { value: 'no', label: 'Нет, только заявленный состав' },
      { value: 'yes', label: 'Да, при болезни возможна замена' },
      { value: 'notify', label: 'Да, с предварительным уведомлением' },
    ],
    required: true,
  },
  {
    id: 'show_type',
    question: 'Тип шоу',
    type: 'select',
    options: [
      { value: 'magic', label: 'Фокусы/Иллюзии' },
      { value: 'circus', label: 'Цирковое/Акробатика' },
      { value: 'music', label: 'Музыкальное' },
      { value: 'puppet', label: 'Кукольное' },
      { value: 'science', label: 'Научное шоу' },
      { value: 'custom', label: 'Другое' },
    ],
    required: false,
    allowCustom: true,
  },
  {
    id: 'audience_size_min',
    question: 'Минимальное количество зрителей',
    type: 'number',
    placeholder: 'Например: 10',
    hint: 'Для эффективного выступления',
    required: false,
  },
  {
    id: 'audience_size_max',
    question: 'Максимальное количество зрителей',
    type: 'number',
    placeholder: 'Например: 100',
    hint: 'С учетом технических возможностей',
    required: false,
  },
  {
    id: 'outdoor_performance',
    question: 'Возможно ли выступление на улице?',
    type: 'select',
    options: [
      { value: 'yes', label: 'Да, без ограничений' },
      { value: 'weather_dependent', label: 'Да, при хорошей погоде' },
      { value: 'extra_charge', label: 'Да, за дополнительную плату' },
      { value: 'no', label: 'Нет, только в помещении' },
    ],
    required: false,
  },
  {
    id: 'equipment_transport',
    question: 'Правила транспортировки оборудования',
    type: 'select',
    options: [
      { value: 'included', label: 'Включено в стоимость' },
      { value: 'extra_charge', label: 'За дополнительную плату' },
      { value: 'client_provides', label: 'Клиент обеспечивает' },
      { value: 'not_applicable', label: 'Не применимо' },
    ],
    required: false,
  },
  {
    id: 'setup_assistance_required',
    question: 'Требуется ли помощь в установке оборудования?',
    type: 'select',
    options: [
      { value: 'yes', label: 'Да, минимум 1-2 человека' },
      { value: 'recommended', label: 'Желательно' },
      { value: 'no', label: 'Нет, справимся сами' },
    ],
    required: false,
  },
  {
    id: 'recording_policy',
    question: 'Правила видеозаписи выступления',
    type: 'select',
    options: [
      { value: 'allowed', label: 'Разрешена' },
      { value: 'for_personal', label: 'Только для личного использования' },
      { value: 'not_allowed', label: 'Запрещена' },
      { value: 'by_agreement', label: 'По договоренности' },
    ],
    required: false,
  },
]

/**
 * Вопросы для агентства
 */
const agencyQuestions: Question[] = [
  {
    id: 'services_included',
    question: 'Какие услуги включены в организацию "под ключ"?',
    type: 'textarea',
    placeholder: 'Например: подбор площадки, аниматоры, декор, кейтеринг, фотограф',
    hint: 'Перечислите основные услуги',
    required: true,
  },
  {
    id: 'variants_count',
    question: 'Сколько вариантов предоставляется на выбор по каждой позиции?',
    type: 'select',
    options: [
      { value: '2', label: '2 варианта' },
      { value: '3', label: '3 варианта' },
      { value: '5', label: '5 вариантов' },
    ],
    required: true,
  },
  {
    id: 'changes_deadline',
    question: 'До какого срока можно вносить изменения бесплатно?',
    type: 'select',
    options: [
      { value: '3', label: 'За 3 дня до мероприятия' },
      { value: '7', label: 'За 7 дней до мероприятия' },
      { value: '14', label: 'За 14 дней до мероприятия' },
    ],
    required: true,
  },
  {
    id: 'agency_commission',
    question: 'Комиссия агентства',
    type: 'select',
    options: [
      { value: 'fixed', label: 'Фиксированная сумма' },
      { value: 'percent', label: 'Процент от стоимости' },
      { value: 'included', label: 'Включена в стоимость услуг' },
      { value: 'custom', label: 'Свой вариант' },
    ],
    required: true,
    allowCustom: true,
  },
  {
    id: 'consultation_included',
    question: 'Включена ли предварительная консультация?',
    type: 'select',
    options: [
      { value: 'yes_free', label: 'Да, бесплатно' },
      { value: 'yes_paid', label: 'Да, платно' },
      { value: 'no', label: 'Нет' },
    ],
    required: false,
  },
  {
    id: 'contract_with',
    question: 'С кем клиент заключает договоры на услуги?',
    type: 'select',
    options: [
      { value: 'agency_only', label: 'Только с агентством' },
      { value: 'with_vendors', label: 'С каждым исполнителем отдельно' },
      { value: 'mixed', label: 'Смешанный вариант' },
    ],
    required: false,
  },
  {
    id: 'payment_schedule',
    question: 'График оплаты для комплексной организации',
    type: 'textarea',
    placeholder: 'Например: 30% при подписании, 40% за 2 недели, 30% в день мероприятия',
    hint: 'Опишите этапы оплаты',
    required: false,
  },
  {
    id: 'coordinator_presence',
    question: 'Присутствие координатора на мероприятии',
    type: 'select',
    options: [
      { value: 'included', label: 'Включено в стоимость' },
      { value: 'extra_charge', label: 'За дополнительную плату' },
      { value: 'not_provided', label: 'Не предоставляется' },
      { value: 'optional', label: 'По желанию клиента' },
    ],
    required: false,
  },
  {
    id: 'emergency_backup',
    question: 'Наличие резервных исполнителей при форс-мажоре',
    type: 'select',
    options: [
      { value: 'yes', label: 'Да, гарантируем замену' },
      { value: 'try', label: 'Постараемся найти замену' },
      { value: 'refund', label: 'Возврат средств' },
      { value: 'no', label: 'Не предусмотрено' },
    ],
    required: false,
  },
  {
    id: 'package_deals',
    question: 'Есть ли готовые пакетные предложения?',
    type: 'select',
    options: [
      { value: 'yes', label: 'Да, несколько пакетов' },
      { value: 'custom_only', label: 'Нет, только индивидуальный подбор' },
      { value: 'both', label: 'И пакеты, и индивидуальный подбор' },
    ],
    required: false,
  },
]

/**
 * Получить все вопросы для конкретного типа профиля
 */
export function getQuestionsForProfile(
  profileType: 'venue' | 'animator' | 'show' | 'agency',
  legalForm: 'private' | 'ip' | 'ooo' | 'self_employed'
): Question[] {
  const questions = [...commonQuestions]

  // Добавляем вопросы в зависимости от типа профиля
  switch (profileType) {
    case 'venue':
      questions.push(...venueQuestions)
      break
    case 'animator':
      questions.push(...animatorQuestions)
      break
    case 'show':
      questions.push(...showQuestions)
      break
    case 'agency':
      questions.push(...agencyQuestions)
      break
  }

  // Фильтруем вопросы по условиям
  return questions.filter((q) => {
    if (!q.condition) return true
    if (q.condition.profileType && !q.condition.profileType.includes(profileType)) return false
    if (q.condition.legalForm && !q.condition.legalForm.includes(legalForm)) return false
    return true
  })
}

/**
 * Проверить, должен ли вопрос отображаться (для условных вопросов)
 */
export function shouldShowQuestion(
  question: Question,
  answers: Record<string, string | number>
): boolean {
  // Если это вопрос с кастомным значением
  if (question.id === 'cancellation_policy_days_custom') {
    return answers['cancellation_policy_days'] === 'custom'
  }
  if (question.id === 'partial_refund_days_custom_value') {
    return answers['partial_refund_days'] === 'custom'
  }
  if (question.id === 'full_payment_deadline_custom_value') {
    return answers['full_payment_deadline'] === 'custom'
  }
  
  // Общая логика для всех custom-полей (на случай, если пропустили какие-то)
  if (question.id.endsWith('_custom_value')) {
    const parentFieldId = question.id.replace('_custom_value', '')
    return answers[parentFieldId] === 'custom'
  }
  
  return true
}

/**
 * Проверить, заполнена ли анкета
 */
export function isQuestionnaireComplete(
  answers: Record<string, string | number>,
  questions: Question[]
): { isComplete: boolean; missingQuestions: string[] } {
  const missingQuestions: string[] = []

  for (const question of questions) {
    // Пропускаем скрытые условные вопросы
    if (!shouldShowQuestion(question, answers)) {
      continue
    }
    
    if (question.required && !answers[question.id]) {
      missingQuestions.push(question.question)
    }
  }

  return {
    isComplete: missingQuestions.length === 0,
    missingQuestions,
  }
}

