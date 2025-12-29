/**
 * Сидер для создания тестовых профилей БЕЗ владельцев (user_id = null).
 * Добавляет профили со всеми ключевыми полями, услугами и локациями.
 * Требует переменные окружения:
 *  - NEXT_PUBLIC_SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *  - GEMINI_API_KEY (опционально, для генерации embedding; если нет — запишет null)
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from '../lib/ai/embeddings'
import { Database } from '../types/supabase'
import * as fs from 'fs'
import * as path from 'path'

// Подхватываем .env.local, чтобы не дублировать ключи
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY обязательны')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type ProfileCategory = Database['public']['Enums']['profile_category']

type SeedService = {
  title: string
  description: string
  price: number
  duration?: number
  age_from?: number
  age_to?: number
  tags: string[]
}

type SeedLocation = {
  city: string
  address: string
  name?: string
  phone?: string
  email?: string
  is_main?: boolean
  active?: boolean
  working_hours?: Record<string, string>
  yandex_url?: string
}

type SeedProfile = {
  profile: {
    slug: string
    display_name: string
    bio: string
    description: string
    city: string
    category: ProfileCategory
    tags: string[]
    phone?: string
    email?: string
    website?: string
    address?: string
    price_range?: string
    social_links?: Record<string, string>
    photos?: string[]
    cover_photo?: string
    logo?: string
    main_photo?: string | null
    details?: any
  }
  services: SeedService[]
  locations: SeedLocation[]
}

const seedProfiles: SeedProfile[] = [
  {
    profile: {
      slug: 'aurora-loft',
      display_name: 'Aurora Loft',
      bio: 'Светлый лофт для дней рождения и камерных семейных праздников',
      description:
        'Двухзальный лофт в центре Москвы: панорамные окна, проектор, кухня, детская зона и комната для аниматоров. Идеален для семейных праздников, мастер-классов и фотосессий.',
      city: 'Москва',
      category: 'venue',
      tags: ['лофт', 'день рождения', 'панорамные окна', 'аренда зала', 'фотозона'],
      phone: '+7 (495) 777-12-12',
      email: 'hello@auroraloft.ru',
      website: 'https://aurora-loft.example.com',
      address: 'Москва, Большая Никитская ул., 22',
      price_range: '$$',
      social_links: {
        instagram: 'https://www.instagram.com/explore/tags/eventloft',
        vk: 'https://vk.com/eventloft',
      },
      cover_photo:
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80',
      logo:
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80',
      main_photo:
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      photos: [
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1523419400524-4c8b4a8b6dd0?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      ],
      details: {
        venue_type: 'loft',
        area_sqm: 220,
        capacity_max: 70,
        floor: 2,
        work_format: ['venue_rental', 'turnkey'],
        amenities: {
          item_0: true,
          item_0_label: 'Профессиональный свет',
          item_1: true,
          item_1_label: 'Звуковая система',
          item_2: true,
          item_2_label: 'Кухня/кейтеринг',
          item_3: true,
          item_3_label: 'Проектор + экран',
          item_4: true,
          item_4_label: 'Детская зона',
        },
        rules: {
          item_0: true,
          item_0_label: 'Можно свой торт',
          item_1: true,
          item_1_label: 'Тихий час после 22:00',
        },
        natural_light: 'yes',
        interior_style: 'modern',
        kitchen_type: 'european',
        ceiling_height: 4.2,
      },
    },
    services: [
      {
        title: 'Аренда основного зала 3 часа',
        description:
          'Главный зал 120 м² с проектором, светом, базовым декором и доступом к кухне. Подходит для праздников до 40 гостей.',
        price: 21000,
        duration: 180,
        tags: ['аренда', 'зал', 'лофт', 'день рождения'],
        age_from: 1,
        age_to: 99,
      },
      {
        title: 'Праздник под ключ «Семейный»',
        description:
          'Аренда зала, ведущий-аниматор, базовый декор, торт до 2 кг, фотозона и фотосъёмка 1 час.',
        price: 52000,
        duration: 240,
        age_from: 4,
        age_to: 12,
        tags: ['под ключ', 'аниматор', 'фотограф', 'декор'],
      },
    ],
    locations: [
      {
        city: 'Москва',
        address: 'Москва, Большая Никитская ул., 22',
        name: 'Aurora Loft — центр',
        phone: '+7 (495) 777-12-12',
        email: 'hello@auroraloft.ru',
        is_main: true,
        active: true,
        working_hours: {
          mon: '10:00-22:00',
          tue: '10:00-22:00',
          wed: '10:00-22:00',
          thu: '10:00-22:00',
          fri: '10:00-23:00',
          sat: '10:00-23:00',
          sun: '10:00-22:00',
        },
      },
    ],
  },
  {
    profile: {
      slug: 'orbit-quest-kids',
      display_name: 'Orbit Quest Kids',
      bio: 'Детские квест-комнаты в космической тематике',
      description:
        'Пять сюжетных квестов для детей 7–14 лет: космос, детектив, приключения и магия. Погружение с декорациями, актёром и технологичными загадками.',
      city: 'Санкт-Петербург',
      category: 'quest',
      tags: ['квест', 'космос', 'приключения', 'дети', 'головоломки'],
      phone: '+7 (812) 900-40-40',
      email: 'team@orbitquest.ru',
      website: 'https://orbitquest.example.com',
      address: 'Санкт-Петербург, Лиговский проспект, 54',
      price_range: '$$',
      social_links: {
        vk: 'https://vk.com/questkids',
        telegram: 'https://t.me/questkids',
      },
      cover_photo:
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
      logo:
        'https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=400&q=80',
      main_photo:
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      photos: [
        'https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1500336624523-d727130c3328?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1497493292307-31c376b6e479?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
      ],
      details: {
        subtype: 'location',
        difficulty: 'medium',
        duration_min: 60,
        participants_min: 3,
        participants_max: 8,
        age_min: 7,
        theme: ['adventure', 'sci-fi', 'kids'],
        quest_specifics: ['multi_room', 'immersive', 'tech_puzzles'],
        hints_available: true,
        actor_included: true,
        mobile: false,
      },
    },
    services: [
      {
        title: 'Квест «Станция орбиты»',
        description:
          'Командный квест в космическом антураже: нужно восстановить питание станции, решить логические задачи и запустить ракету.',
        price: 7500,
        duration: 70,
        age_from: 8,
        age_to: 14,
        tags: ['космос', 'командная игра', 'головоломки'],
      },
      {
        title: 'Квест «Школа магии»',
        description:
          'Интерактивный сюжет с актёром: варим зелья, ищем артефакты, проходим испытания факультетов. Декорации в стиле замка.',
        price: 8200,
        duration: 80,
        age_from: 9,
        age_to: 14,
        tags: ['магия', 'актер', 'погружение'],
      },
    ],
    locations: [
      {
        city: 'Санкт-Петербург',
        address: 'Санкт-Петербург, Лиговский проспект, 54',
        name: 'Основная площадка',
        phone: '+7 (812) 900-40-40',
        email: 'team@orbitquest.ru',
        is_main: true,
        active: true,
        working_hours: {
          mon: '11:00-21:00',
          tue: '11:00-21:00',
          wed: '11:00-21:00',
          thu: '11:00-21:00',
          fri: '11:00-23:00',
          sat: '10:00-23:00',
          sun: '10:00-22:00',
        },
      },
    ],
  },
  {
    profile: {
      slug: 'flash-animator',
      display_name: 'Flash Kids — Аниматоры',
      bio: 'Выездные аниматоры с персонажами мультфильмов и супергероев',
      description:
        'Команда из 12 аниматоров, профессиональные костюмы, акробатические номера и интерактивные сценарии. Работаем по Москве и области, подстраиваем программу под возраст и площадку.',
      city: 'Москва',
      category: 'animator',
      tags: ['аниматор', 'супергерои', 'девочкам', 'мальчикам', 'выездной'],
      phone: '+7 (916) 700-55-77',
      email: 'hi@flashkids.ru',
      website: 'https://flashkids.example.com',
      price_range: '$$',
      social_links: {
        instagram: 'https://www.instagram.com/explore/tags/animator',
        youtube: 'https://www.youtube.com/results?search_query=party+animator',
      },
      cover_photo:
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80',
      logo:
        'https://images.unsplash.com/photo-1509099836639-18ba02e2e1ba?auto=format&fit=crop&w=400&q=80',
      main_photo:
        'https://images.unsplash.com/photo-1441123694162-e54a981ceba3?auto=format&fit=crop&w=1200&q=80',
      photos: [
        'https://images.unsplash.com/photo-1441123694162-e54a981ceba3?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=1200&q=80',
      ],
      details: {
        character_name: 'Супергерой/Принцесса',
        age_range: '7-10',
        program_type: 'interactive',
        work_format: 'both',
        coverage_radius: 40,
        experience_years: 6,
        services: {
          face_painting: true,
          balloon_twisting: true,
          magic_tricks: true,
          glitter_tattoos: true,
        },
        has_music_equipment: true,
        has_car: true,
        has_med_book: true,
      },
    },
    services: [
      {
        title: 'Супергеройская тренировка',
        description:
          'Человек-паук или Капитан Америка учит детей ловкости, проводит эстафеты, мини-квест и фотосессию. Включен аквагрим.',
        price: 6500,
        duration: 60,
        age_from: 4,
        age_to: 10,
        tags: ['супергерои', 'эстафеты', 'аквагрим'],
      },
      {
        title: 'Принцесса на балу',
        description:
          'Принцесса Эльза/Белль проводит танцевальные конкурсы, обучает придворным этикетам, дарит блёст-тату. Сказочный реквизит включён.',
        price: 7200,
        duration: 70,
        age_from: 4,
        age_to: 9,
        tags: ['принцесса', 'девочкам', 'блест тату'],
      },
    ],
    locations: [
      {
        city: 'Москва',
        address: 'Выезд по Москве и МО',
        name: 'Выездной формат',
        phone: '+7 (916) 700-55-77',
        email: 'hi@flashkids.ru',
        is_main: true,
        active: true,
      },
    ],
  },
  {
    profile: {
      slug: 'candy-master',
      display_name: 'Candy Master — мастер-классы',
      bio: 'Сладкие мастер-классы для детей и взрослых',
      description:
        'Конфетная лаборатория: создаём леденцы, маршмеллоу, карамельные рисунки. Есть выездной формат и студия в центре.',
      city: 'Казань',
      category: 'master_class',
      tags: ['мастер-класс', 'конфеты', 'семейное', 'выезд'],
      phone: '+7 (843) 555-77-22',
      email: 'workshop@candymaster.ru',
      website: 'https://candymaster.example.com',
      address: 'Казань, ул. Баумана, 17',
      price_range: '$$',
      social_links: {
        instagram: 'https://www.instagram.com/explore/tags/candymaster',
      },
      cover_photo:
        'https://images.unsplash.com/photo-1464347744102-11db6282f854?auto=format&fit=crop&w=1600&q=80',
      logo:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      main_photo:
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      photos: [
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1544145945-f90425340c7b?auto=format&fit=crop&w=1200&q=80',
      ],
      details: {
        subtype: 'sweets',
        level: 'beginner',
        duration_min: 75,
        group_size: [4, 12],
        equipment: ['плиты', 'термометры', 'формы'],
        take_home: true,
        mobile: true,
      },
    },
    services: [
      {
        title: 'Леденцы своими руками',
        description:
          'Готовим авторские леденцы на палочке: варим сироп, выбираем вкус и форму, украшаем посыпками. Каждый уносит коробочку с 6 леденцами.',
        price: 3800,
        duration: 70,
        age_from: 6,
        age_to: 14,
        tags: ['леденцы', 'сладости', 'ручная работа'],
      },
      {
        title: 'Маршмеллоу и декор',
        description:
          'Взбиваем маршмеллоу, красим натуральными красителями, делаем фигурные формы. Есть безглютеновый вариант.',
        price: 4200,
        duration: 80,
        age_from: 7,
        age_to: 16,
        tags: ['маршмеллоу', 'безглютеново', 'десерт'],
      },
    ],
    locations: [
      {
        city: 'Казань',
        address: 'Казань, ул. Баумана, 17',
        name: 'Студия в центре',
        phone: '+7 (843) 555-77-22',
        email: 'workshop@candymaster.ru',
        is_main: true,
        active: true,
        working_hours: {
          mon: '11:00-21:00',
          tue: '11:00-21:00',
          wed: '11:00-21:00',
          thu: '11:00-21:00',
          fri: '11:00-22:00',
          sat: '10:00-22:00',
          sun: '10:00-20:00',
        },
      },
      {
        city: 'Казань',
        address: 'Выезд по городу и области',
        name: 'Выездной формат',
        phone: '+7 (843) 555-77-22',
        email: 'workshop@candymaster.ru',
        is_main: false,
        active: true,
      },
    ],
  },
  {
    profile: {
      slug: 'scene-show-agency',
      display_name: 'Scene Show Agency',
      bio: 'Шоу-программы и спецэффекты для детских праздников',
      description:
        'Иллюзионисты, неоновые и бумажные шоу, интерактивные научные выступления. Собственное оборудование, команда техников и реквизита.',
      city: 'Новосибирск',
      category: 'show',
      tags: ['шоу', 'иллюзионист', 'научное шоу', 'неон', 'бумажное'],
      phone: '+7 (383) 600-90-10',
      email: 'hello@sceneshow.ru',
      website: 'https://sceneshow.example.com',
      price_range: '$$$',
      social_links: {
        vk: 'https://vk.com/sceneshow',
        youtube: 'https://www.youtube.com/results?search_query=kids+show',
      },
      cover_photo:
        'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
      logo:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      main_photo:
        'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
      photos: [
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&w=1200&q=80',
      ],
      details: {
        formats: ['неоновое шоу', 'бумажное шоу', 'иллюзионист', 'научное шоу'],
        equipment: ['свет', 'дым-машины', 'пиротехника light'],
        duration_min: 45,
        team_size: 3,
        travel: true,
      },
    },
    services: [
      {
        title: 'Неоновое шоу',
        description:
          'LED-костюмы, световые мечи, неоновый реквизит и мыльные пузыри под УФ-светом. Включает дым-машину и звук.',
        price: 24000,
        duration: 45,
        age_from: 6,
        age_to: 16,
        tags: ['неон', 'свет', 'wow'],
      },
      {
        title: 'Научное шоу «Лаборатория»',
        description:
          'Безопасные эксперименты с жидким азотом, дымовыми реакциями и «слезами дракона». Дети участвуют в опытах.',
        price: 18000,
        duration: 50,
        age_from: 5,
        age_to: 14,
        tags: ['наука', 'опыты', 'интерактив'],
      },
    ],
    locations: [
      {
        city: 'Новосибирск',
        address: 'Выезд по городу и области',
        name: 'Мобильная бригада',
        phone: '+7 (383) 600-90-10',
        email: 'hello@sceneshow.ru',
        is_main: true,
        active: true,
      },
    ],
  },
]

async function generateProfileEmbedding(profile: SeedProfile['profile']) {
  const text = [
    profile.display_name,
    profile.bio,
    profile.description,
    `Категория: ${profile.category}`,
    `Теги: ${profile.tags.join(', ')}`,
    `Город: ${profile.city}`,
    profile.address ? `Адрес: ${profile.address}` : '',
  ]
    .filter(Boolean)
    .join('. ')

  return await generateEmbedding(text)
}

async function generateServiceEmbedding(service: SeedService, profileName: string) {
  const text = `${service.title}. ${service.description}. Цена: ${service.price}₽. Возраст: ${service.age_from || 'любой'}-${service.age_to || 'любой'} лет. Теги: ${service.tags.join(', ')}. Профиль: ${profileName}`
  return await generateEmbedding(text)
}

async function createUnclaimedProfiles() {
  console.log('🚀 Старт сидера для профилей без владельцев\n')

  for (const item of seedProfiles) {
    try {
      console.log(`📝 Обрабатываю: ${item.profile.display_name} (${item.profile.slug})`)

      // Проверяем, есть ли профиль со слугом
      const { data: existing } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('slug', item.profile.slug)
        .maybeSingle()

      if (existing) {
        console.log(`   ⚠️ Уже существует, пропускаю. user_id=${existing.user_id || 'null'}`)
        continue
      }

      // Генерируем embedding для профиля
      const profileEmbedding = await generateProfileEmbedding(item.profile)
      const embeddingString = profileEmbedding ? `[${profileEmbedding.join(',')}]` : null

      // Создаём профиль без владельца
      const payload: any = {
        ...item.profile,
        user_id: null,
        claim_status: 'unclaimed',
        embedding: embeddingString,
        is_published: true,
        verified: false,
        bio: item.profile.bio || item.profile.description,
      }

      const { data: createdProfile, error: profileError } = await supabase
        .from('profiles')
        .insert(payload)
        .select('id, slug')
        .single()

      if (profileError || !createdProfile) {
        throw profileError || new Error('Не удалось создать профиль')
      }

      console.log(`   ✅ Профиль создан (id=${createdProfile.id})`)

      // Локации
      if (item.locations?.length) {
        const locationPayload = item.locations.map((loc, idx) => ({
          profile_id: createdProfile.id,
          city: loc.city,
          address: loc.address,
          name: loc.name || null,
          phone: loc.phone || null,
          email: loc.email || null,
          working_hours: loc.working_hours || null,
          is_main: loc.is_main ?? idx === 0,
          active: loc.active ?? true,
          details: {},
          yandex_url: loc.yandex_url || null,
          yandex_rating: null,
          yandex_review_count: 0,
        }))

        const { error: locError } = await supabase.from('profile_locations').insert(locationPayload)
        if (locError) {
          console.error('   ⚠️ Ошибка при создании локаций:', locError.message)
        } else {
          console.log(`   📍 Локаций добавлено: ${locationPayload.length}`)
        }
      }

      // Услуги
      if (item.services?.length) {
        for (const service of item.services) {
          const serviceEmbedding = await generateServiceEmbedding(service, item.profile.display_name)
          const serviceEmbeddingString = serviceEmbedding ? `[${serviceEmbedding.join(',')}]` : null

          const { error: serviceError } = await supabase.from('services').insert({
            profile_id: createdProfile.id,
            title: service.title,
            description: service.description,
            price: service.price,
            duration: service.duration || null,
            age_from: service.age_from || null,
            age_to: service.age_to || null,
            tags: service.tags,
            embedding: serviceEmbeddingString,
            is_active: true,
            service_type: 'service',
            price_type: 'fixed',
          } as any)

          if (serviceError) {
            console.error(`   ⚠️ Услуга "${service.title}" не создана:`, serviceError.message)
          } else {
            console.log(`   📦 Услуга добавлена: ${service.title}`)
          }
        }
      }

      // Небольшая пауза, чтобы не перегружать внешние API
      await new Promise((resolve) => setTimeout(resolve, 400))
    } catch (error: any) {
      console.error(`   ❌ Ошибка для ${item.profile.slug}:`, error?.message || error)
    }
  }

  const { count: totalProfiles } = await supabase.from('profiles').select('*', { head: true, count: 'exact' })
  const { count: totalServices } = await supabase.from('services').select('*', { head: true, count: 'exact' })

  console.log('\n🎉 Готово.')
  console.log(`Всего профилей в базе: ${totalProfiles ?? '—'}`)
  console.log(`Всего услуг в базе: ${totalServices ?? '—'}`)
}

createUnclaimedProfiles().catch((err) => {
  console.error('Fatal error:', err)
})















