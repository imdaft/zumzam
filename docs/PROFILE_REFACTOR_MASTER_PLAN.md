# 🎯 МАСТЕР-ПЛАН: Переформирование системы профилей
## Комплексная реформа с многомерной классификацией

**Дата начала:** 20 декабря 2025  
**Срок:** 6 недель  
**Подход:** Mobile-first (85% клиентов на телефонах)

---

## 🎨 ПРИНЦИПЫ ДИЗАЙНА

### **Mobile-First (85% клиентов)**
```
Приоритет №1: Телефон (320px-428px)
- Компактные карточки
- Свайпы вместо скроллов
- Touch-friendly (минимум 44x44px кнопки)
- Быстрая загрузка (< 2.5s)

Приоритет №2: Десктоп (для создания профилей)
- Drag & drop для блоков
- Боковая навигация
- Превью в реальном времени
```

### **Три варианта дизайна для каждого блока**
```
1. Standard - Сетка 2 колонки (универсальный)
2. Compact - Аккордеон (компактный для mobile)
3. Large - 1 колонка, крупные карточки (визуальный)
```

---

## 📊 ФАЗА 1: АРХИТЕКТУРА БД (Неделя 1)

### **Цель:** Создать новую многомерную классификацию

### **1.1. ENUMs для классификации**

```sql
-- Миграция: 20251221000000_create_classification_enums.sql

-- Основной тип деятельности
CREATE TYPE primary_venue_type_enum AS ENUM (
  'active_entertainment',    -- Активные развлечения
  'quest_escape',           -- Квесты
  'creative_studio',        -- Творческие студии
  'event_space',            -- Пространство для мероприятий
  'vr_digital',             -- VR и цифровые
  'animal_interaction',     -- С животными
  'outdoor_recreation'      -- Загородный отдых
);

-- Бизнес-модель
CREATE TYPE business_model_enum AS ENUM (
  'rental_only',            -- Только аренда
  'tickets_freeplay',       -- Билеты
  'packages_turnkey',       -- Пакеты под ключ
  'mobile_services',        -- Выездные программы
  'hybrid'                  -- Гибрид
);

-- Тип помещения
CREATE TYPE space_type_enum AS ENUM (
  'loft_studio',            -- Лофт / Студия
  'mall_venue',             -- В ТРЦ
  'closed_arena',           -- Закрытая арена
  'outdoor',                -- Открытая площадка
  'country_base',           -- База отдыха
  'mobile'                  -- Мобильная
);
```

### **1.2. Каталоги активностей и услуг**

```sql
-- Справочник активностей
CREATE TABLE activity_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'active', 'creative', 'entertainment'
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Предзаполнение
INSERT INTO activity_catalog (id, name_ru, name_en, category, icon) VALUES
  ('trampolines', 'Батуты', 'Trampolines', 'active', '🦘'),
  ('lasertag', 'Лазертаг', 'Lasertag', 'active', '🔫'),
  ('vr_games', 'VR-игры', 'VR Games', 'active', '🥽'),
  ('bowling', 'Боулинг', 'Bowling', 'active', '🎳'),
  ('cooking_classes', 'Кулинарные МК', 'Cooking', 'creative', '👨‍🍳'),
  ('art_classes', 'Художественные МК', 'Art', 'creative', '🎨'),
  ('quest_room', 'Квест-комната', 'Quest', 'entertainment', '🔐'),
  ('horses', 'Лошади и пони', 'Horses', 'other', '🐴');
  -- ... еще ~25 активностей

-- Справочник услуг
CREATE TABLE service_catalog (
  id TEXT PRIMARY KEY,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'event', 'food', 'media', 'other'
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO service_catalog (id, name_ru, name_en, category, icon) VALUES
  ('animator', 'Аниматоры', 'Animators', 'event', '🤹'),
  ('catering', 'Кейтеринг', 'Catering', 'food', '🍽️'),
  ('photographer', 'Фотограф', 'Photographer', 'media', '📷');
  -- ... еще ~12 услуг
```

### **1.3. Обновление таблицы profiles**

```sql
-- Добавляем колонки новой классификации
ALTER TABLE profiles
  ADD COLUMN primary_venue_type primary_venue_type_enum,
  ADD COLUMN activities TEXT[] DEFAULT '{}',
  ADD COLUMN business_models business_model_enum[] DEFAULT '{}',
  ADD COLUMN space_type space_type_enum,
  ADD COLUMN additional_services TEXT[] DEFAULT '{}',
  
  -- Метаданные для поиска
  ADD COLUMN search_vector tsvector,
  ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Индексы
CREATE INDEX idx_profiles_primary_type ON profiles(primary_venue_type);
CREATE INDEX idx_profiles_business_models ON profiles USING GIN(business_models);
CREATE INDEX idx_profiles_activities ON profiles USING GIN(activities);
CREATE INDEX idx_profiles_search_vector ON profiles USING GIN(search_vector);
```

**Статус:** ✅ Готов к реализации

---

## 🧩 ФАЗА 2: ГЕНЕРАТОР БЛОКОВ (Неделя 2)

### **Цель:** Автоматически генерировать набор блоков по классификации

### **2.1. Функция генерации блоков**

```typescript
// lib/profile-blocks/generator.ts

export interface BlockConfig {
  id: string
  type: BlockType
  order: number
  required: boolean
  data?: any
}

export type BlockType =
  | 'hero'
  | 'activities'
  | 'turnkey-packages'
  | 'ticket-pricing'
  | 'rental-pricing'
  | 'services'
  | 'catering-menu'
  | 'gallery'
  | 'reviews'
  | 'contacts'

export function generateProfileBlocks(profile: Profile): BlockConfig[] {
  const blocks: BlockConfig[] = []
  
  // 1. ВСЕГДА: Герой
  blocks.push({
    id: 'about',
    type: 'hero',
    order: 0,
    required: true,
  })
  
  // 2. ЕСЛИ есть activities
  if (profile.activities && profile.activities.length > 0) {
    blocks.push({
      id: 'activities',
      type: 'activities',
      order: 10,
      required: false,
      data: { activities: profile.activities },
    })
  }
  
  // 3. ЕСЛИ есть packages_turnkey
  if (profile.business_models?.includes('packages_turnkey')) {
    blocks.push({
      id: 'turnkey',
      type: 'turnkey-packages',
      order: 20,
      required: false,
    })
  }
  
  // 4. ЕСЛИ есть tickets_freeplay
  if (profile.business_models?.includes('tickets_freeplay')) {
    blocks.push({
      id: 'tickets',
      type: 'ticket-pricing',
      order: 25,
      required: false,
    })
  }
  
  // 5. ЕСЛИ есть rental_only
  if (profile.business_models?.includes('rental_only')) {
    blocks.push({
      id: 'rental',
      type: 'rental-pricing',
      order: 30,
      required: false,
    })
  }
  
  // 6. ЕСЛИ есть services
  if (profile.additional_services && profile.additional_services.length > 0) {
    blocks.push({
      id: 'services',
      type: 'services',
      order: 40,
      required: false,
    })
  }
  
  // 7. ЕСЛИ есть catering
  if (profile.additional_services?.includes('catering')) {
    blocks.push({
      id: 'catering_menu',
      type: 'catering-menu',
      order: 45,
      required: false,
    })
  }
  
  // 8-10. ВСЕГДА
  blocks.push(
    { id: 'gallery', type: 'gallery', order: 50, required: true },
    { id: 'reviews', type: 'reviews', order: 60, required: true },
    { id: 'contacts', type: 'contacts', order: 70, required: true }
  )
  
  // Учитываем custom порядок
  if (profile.section_order) {
    return reorderBlocks(blocks, profile.section_order)
  }
  
  return blocks.sort((a, b) => a.order - b.order)
}
```

**Статус:** ✅ Готов к реализации

---

## 🎨 ФАЗА 3: ВИЗАРД 5 ШАГОВ (Недели 3-4)

### **Цель:** UI для заполнения новой классификации (mobile-first)

### **3.1. Структура визарда**

```
Шаг 1: Primary Type         (1 экран, визуальный выбор)
Шаг 2: Activities            (1-2 экрана, мульти-селект)
Шаг 3: Business Models       (1 экран, чекбоксы)
Шаг 4: Space Type            (1 экран, визуальный выбор)
Шаг 5: Additional Services   (1-2 экрана, мульти-селект)

+ Шаг 6: Заполнение данных   (динамические формы по результатам)
```

### **3.2. Компоненты визарда**

```tsx
// components/features/profile/wizard/step-1-primary-type.tsx
export function PrimaryTypeStep() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Шаг 1: Основной тип</h2>
      <p className="text-sm text-gray-600">Что вы предлагаете в первую очередь?</p>
      
      {/* Сетка 2 колонки на mobile */}
      <div className="grid grid-cols-2 gap-3">
        <TypeCard
          id="active_entertainment"
          icon="🎯"
          label="Активные развлечения"
          description="Батуты, лазертаг, скалодром"
        />
        <TypeCard
          id="quest_escape"
          icon="🔐"
          label="Квесты"
          description="Квест-комнаты, головоломки"
        />
        {/* ... */}
      </div>
    </div>
  )
}

// components/features/profile/wizard/step-2-activities.tsx
export function ActivitiesStep() {
  const { data: activities } = useQuery({
    queryKey: ['activity-catalog'],
    queryFn: () => fetchActivitiesCatalog(),
  })
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Шаг 2: Активности</h2>
      <p className="text-sm text-gray-600">Выберите всё, что есть у вас</p>
      
      {/* Группировка по категориям */}
      <ActivityMultiSelect activities={activities} />
    </div>
  )
}

// components/features/profile/wizard/step-3-business-models.tsx
export function BusinessModelsStep() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Шаг 3: Как вы работаете?</h2>
      
      <CheckboxGroup>
        <Checkbox value="packages_turnkey">
          <div>
            <div className="font-semibold">Пакеты "под ключ"</div>
            <div className="text-sm text-gray-600">Организуем праздник с программой</div>
          </div>
        </Checkbox>
        <Checkbox value="tickets_freeplay">
          <div>
            <div className="font-semibold">Билеты на посещение</div>
            <div className="text-sm text-gray-600">Приходите в любое время</div>
          </div>
        </Checkbox>
        {/* ... */}
      </CheckboxGroup>
    </div>
  )
}

// components/features/profile/wizard/step-4-space-type.tsx
export function SpaceTypeStep() {
  // Визуальный выбор типа помещения
}

// components/features/profile/wizard/step-5-services.tsx
export function ServicesStep() {
  // Мульти-селект доп. услуг
}
```

### **3.3. Дополнительные поля (новые)**

```tsx
// components/features/profile/wizard/step-6-details.tsx
export function DetailsStep() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Шаг 6: Детали</h2>
      
      {/* Время работы */}
      <WorkingHoursEditor />
      
      {/* Метро (для СПб) */}
      <MetroSelector />
      
      {/* Парковка */}
      <ParkingToggle />
      
      {/* Возраст */}
      <AgeRestrictionsInput />
      
      {/* Вместимость */}
      <CapacityInput />
      
      {/* Способы оплаты */}
      <PaymentMethodsCheckboxes />
      
      {/* Мессенджеры */}
      <MessengerContactsInput />
    </div>
  )
}
```

**Статус:** ✅ Готов к реализации

---

## 🎨 ФАЗА 4: НОВЫЕ БЛОКИ (Недели 4-5)

### **Цель:** Создать недостающие блоки с 3 вариантами дизайна

### **4.1. ActivitiesBlock (НОВЫЙ)**

```tsx
// components/features/profile/activities/activities-block.tsx

type ViewMode = 'standard' | 'compact' | 'large'

export function ActivitiesBlock({
  profileId,
  activities,
  variant = 'mobile',
  isOwner,
}: {
  profileId: string
  activities: string[]
  variant?: 'mobile' | 'desktop'
  isOwner?: boolean
}) {
  const { getTemplate } = useProfileTemplates({ profileId, variant })
  const viewMode: ViewMode = getTemplate('activities') || 'standard'
  
  // Подгружаем данные из каталога
  const { data } = useQuery({
    queryKey: ['activities', activities],
    queryFn: () => fetchActivitiesData(activities),
  })
  
  return (
    <div className="bg-white rounded-[32px] p-1 shadow-sm">
      {/* Header с Settings кнопкой */}
      <div className="px-6 py-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Чем можно заняться</h2>
          <p className="text-sm text-gray-500 mt-1">{data?.length} активностей</p>
        </div>
        
        {isOwner && (
          <DesignSwitcher
            section="activities"
            current={viewMode}
            onSelect={(mode) => updateTemplate('activities', mode)}
          />
        )}
      </div>
      
      {/* Контент по вариантам */}
      {viewMode === 'standard' ? (
        <ActivitiesGrid activities={data} columns={2} />
      ) : viewMode === 'compact' ? (
        <ActivitiesAccordion activities={data} />
      ) : (
        <ActivitiesGrid activities={data} columns={1} />
      )}
    </div>
  )
}
```

**3 варианта дизайна:**
```tsx
// Standard - Сетка 2 колонки
function ActivitiesGrid({ activities, columns }) {
  return (
    <div className={`grid gap-3 ${columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
      {activities.map(activity => (
        <ActivityCard key={activity.id} activity={activity} />
      ))}
    </div>
  )
}

// Compact - Аккордеон
function ActivitiesAccordion({ activities }) {
  return (
    <Accordion type="single" collapsible>
      {activities.map(activity => (
        <ActivityAccordionItem key={activity.id} activity={activity} />
      ))}
    </Accordion>
  )
}

// ActivityCard - Карточка активности
function ActivityCard({ activity }) {
  return (
    <div className="border rounded-xl p-4 hover:border-orange-300 transition">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{activity.icon}</span>
        <h3 className="font-semibold text-lg">{activity.name_ru}</h3>
      </div>
      
      {activity.description && (
        <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
      )}
      
      {activity.features && (
        <ul className="space-y-1.5 text-sm text-gray-600">
          {activity.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-orange-600">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### **4.2. TicketPricingBlock (НОВЫЙ)**

```tsx
// components/features/profile/pricing/ticket-pricing-block.tsx

export function TicketPricingBlock({
  profileId,
  pricing,
}: {
  profileId: string
  pricing: {
    weekday_price: number
    weekend_price: number
    unlimited_price?: number
  }
}) {
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-4">🎫 Билеты</h2>
      <p className="text-sm text-gray-500 mb-6">
        Свободное посещение без брони
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PriceCard
          label="Будние дни"
          price={pricing.weekday_price}
          unit="час"
        />
        <PriceCard
          label="Выходные"
          price={pricing.weekend_price}
          unit="час"
        />
        {pricing.unlimited_price && (
          <PriceCard
            label="Безлимит"
            price={pricing.unlimited_price}
            unit="весь день"
            featured
          />
        )}
      </div>
    </div>
  )
}
```

### **4.3. RentalPricingBlock (НОВЫЙ)**

```tsx
// components/features/profile/pricing/rental-pricing-block.tsx

export function RentalPricingBlock({
  profileId,
  pricing,
}: {
  profileId: string
  pricing: Array<{
    item: string
    price: number
    unit: string
  }>
}) {
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm">
      <h2 className="text-2xl font-bold mb-4">📅 Почасовая аренда</h2>
      <p className="text-sm text-gray-500 mb-6">
        Организуете сами, мы даем площадку
      </p>
      
      <div className="space-y-3">
        {pricing.map((rate, idx) => (
          <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
            <span className="font-medium">{rate.item}</span>
            <span className="text-orange-600 font-semibold">
              {rate.price.toLocaleString('ru')} ₽/{rate.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### **4.4. CateringMenuBlock (НОВЫЙ)**

```tsx
// components/features/profile/catering/catering-menu-block.tsx

export function CateringMenuBlock({
  profileId,
  menu,
}: {
  profileId: string
  menu: CateringMenu[]
}) {
  const [openModal, setOpenModal] = useState(false)
  
  return (
    <>
      {/* Анонс в профиле */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-4">🍽️ Меню кейтеринга</h2>
        <p className="text-sm text-gray-500 mb-4">
          Большой выбор блюд для детей и взрослых
        </p>
        <Button onClick={() => setOpenModal(true)} className="w-full">
          Смотреть меню →
        </Button>
      </div>
      
      {/* Полное меню в модалке */}
      {openModal && (
        <CateringMenuModal 
          menu={menu}
          onClose={() => setOpenModal(false)}
        />
      )}
    </>
  )
}
```

**Статус:** ✅ Готов к реализации

---

## 🔄 ФАЗА 5: РЕНДЕРИНГ ПРОФИЛЯ (Неделя 5)

### **Цель:** Интеграция с ProfileSectionsRenderer

```tsx
// app/(dashboard)/profiles/[slug]/page.tsx

export default async function ProfilePage({ params }: { params: { slug: string } }) {
  const profile = await fetchProfile(params.slug)
  const isOwner = await checkIsOwner(profile.id)
  
  // АВТОМАТИЧЕСКАЯ ГЕНЕРАЦИЯ БЛОКОВ
  const blocks = generateProfileBlocks(profile)
  
  // МАППИНГ блоков → компоненты
  const sections = blocks
    .map(block => {
      switch (block.type) {
        case 'hero':
          return { id: block.id, component: <HeroSection profile={profile} /> }
        
        case 'activities':
          return { 
            id: block.id, 
            component: <ActivitiesBlock 
              profileId={profile.id}
              activities={profile.activities}
              variant={getVariant()}
              isOwner={isOwner}
            /> 
          }
        
        case 'turnkey-packages':
          return { 
            id: block.id, 
            component: <TurnkeyPackagesBlock 
              profileId={profile.id}
              packages={profile.turnkey_packages}
              variant={getVariant()}
              isOwner={isOwner}
            /> 
          }
        
        case 'ticket-pricing':
          return { 
            id: block.id, 
            component: <TicketPricingBlock 
              profileId={profile.id}
              pricing={profile.ticket_pricing}
            /> 
          }
        
        case 'rental-pricing':
          return { 
            id: block.id, 
            component: <RentalPricingBlock 
              profileId={profile.id}
              pricing={profile.hourly_rates}
            /> 
          }
        
        case 'services':
          return { 
            id: block.id, 
            component: <ServicesBlock 
              profileId={profile.id}
              services={profile.additional_services}
              variant={getVariant()}
              isOwner={isOwner}
            /> 
          }
        
        case 'catering-menu':
          return { 
            id: block.id, 
            component: <CateringMenuBlock 
              profileId={profile.id}
              menu={profile.catering_menu}
            /> 
          }
        
        case 'gallery':
          return { id: block.id, component: <ProfileGallery photos={profile.photos} /> }
        
        case 'reviews':
          return { id: block.id, component: <ProfileReviews profileId={profile.id} /> }
        
        case 'contacts':
          return { id: block.id, component: <ContactsBlock profile={profile} /> }
        
        default:
          return null
      }
    })
    .filter(Boolean)
  
  // Фильтруем скрытые блоки
  const visibleSections = sections.filter(s => 
    !profile.hidden_blocks?.includes(s.id)
  )
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ProfileHeader profile={profile} />
      
      {/* Основной контент */}
      <ProfileSectionsRenderer 
        sectionOrder={blocks.map(b => b.id)}
        sections={visibleSections}
      />
      
      {/* Редактор для владельца */}
      {isOwner && (
        <BlockOrderEditor 
          blocks={blocks}
          hidden={profile.hidden_blocks}
          onReorder={(order) => updateSectionOrder(profile.id, order)}
          onToggleVisibility={(blockId) => toggleBlockVisibility(profile.id, blockId)}
        />
      )}
    </div>
  )
}
```

**Статус:** ✅ Готов к реализации

---

## 🧪 ФАЗА 6: ТЕСТИРОВАНИЕ (Неделя 6)

### **Цель:** Создать 10 тестовых профилей разных типов

1. **МазаПарк** (active_entertainment + гибрид)
2. **Лофт для праздников** (event_space + packages)
3. **Квест-комната** (quest_escape + packages)
4. **Кулинарная студия** (creative_studio + packages)
5. **VR-арена** (vr_digital + tickets)
6. **Конный клуб** (animal_interaction + rental)
7. **База отдыха** (outdoor_recreation + rental)
8. **Выездной аниматор** (mobile_services)
9. **Батутный парк** (active_entertainment + tickets)
10. **Агентство праздников** (event_space + packages + services)

**Тестируем:**
- ✅ Генерация блоков
- ✅ 3 варианта дизайна на каждом блоке
- ✅ Mobile / Desktop адаптация
- ✅ Drag & drop порядка блоков
- ✅ Скрытие/показ блоков
- ✅ Performance (< 2.5s LCP)

---

## 📊 TIMELINE

```
Неделя 1 (21-27 дек): БД - ENUMs, каталоги, миграции
Неделя 2 (28-3 янв):  Генератор блоков + правила
Неделя 3 (4-10 янв):  Визард - шаги 1-3
Неделя 4 (11-17 янв): Визард - шаги 4-6 + детали
Неделя 5 (18-24 янв): Новые блоки + рендеринг
Неделя 6 (25-31 янв): Тестирование + доработки
```

---

## ✅ SUCCESS CRITERIA

### **Для клиента (мамы):**
- ✅ Профиль открывается < 2.5s на телефоне
- ✅ Прокрутка 4-5 экранов (не 11!)
- ✅ Всё понятно за 2 минуты
- ✅ Видит время работы, метро, парковку сразу

### **Для исполнителя:**
- ✅ Визард 5 шагов (понятно что выбирать)
- ✅ Блоки генерируются автоматически
- ✅ Может кастомизировать (порядок, дизайн, видимость)
- ✅ Работает на телефоне и десктопе

### **Технические:**
- ✅ Mobile-first (85% на телефонах)
- ✅ 3 варианта дизайна для каждого блока
- ✅ Генератор блоков работает
- ✅ 10 тестовых профилей созданы

---

**НАЧИНАЕМ РЕАЛИЗАЦИЮ! 🚀**





