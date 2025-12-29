/**
 * Заполнение каталога услуг аниматора
 */

import prisma from '../lib/prisma'

const animatorServices = [
  {
    id: 'character_animation',
    name_ru: 'Персонажная анимация',
    name_en: 'Character Animation',
    category: 'performance',
    icon: '🎭',
    description: 'Выступление в костюме персонажа'
  },
  {
    id: 'games_contests',
    name_ru: 'Игры и конкурсы',
    name_en: 'Games and Contests',
    category: 'interactive',
    icon: '🎯',
    description: 'Веселые игры и конкурсы для детей'
  },
  {
    id: 'face_painting',
    name_ru: 'Аквагрим',
    name_en: 'Face Painting',
    category: 'creative',
    icon: '🎨',
    description: 'Рисунки на лице'
  },
  {
    id: 'balloon_twisting',
    name_ru: 'Твистинг (фигуры из шаров)',
    name_en: 'Balloon Twisting',
    category: 'creative',
    icon: '🎈',
    description: 'Создание фигур из воздушных шаров'
  },
  {
    id: 'mini_disco',
    name_ru: 'Мини-дискотека',
    name_en: 'Mini Disco',
    category: 'entertainment',
    icon: '💃',
    description: 'Танцы и музыка с детьми'
  },
  {
    id: 'interactive_show',
    name_ru: 'Интерактивное шоу',
    name_en: 'Interactive Show',
    category: 'performance',
    icon: '✨',
    description: 'Шоу с участием детей'
  },
  {
    id: 'quest_program',
    name_ru: 'Квест-программа',
    name_en: 'Quest Program',
    category: 'quest',
    icon: '🗺️',
    description: 'Приключенческий квест с загадками'
  },
  {
    id: 'master_class',
    name_ru: 'Мастер-класс',
    name_en: 'Master Class',
    category: 'educational',
    icon: '🎓',
    description: 'Обучающий мастер-класс'
  }
]

async function seedAnimatorCatalog() {
  console.log('🎭 Заполнение каталога услуг аниматора...\n')

  try {
    // Проверяем текущее количество
    const currentCount = await prisma.animator_services_catalog.count()
    console.log(`📊 Текущих записей: ${currentCount}`)

    if (currentCount > 0) {
      console.log('⚠️  Каталог уже заполнен')
      console.log('   Хотите перезаписать? (Ctrl+C для отмены)\n')
      
      // Удаляем старые записи
      await prisma.animator_services_catalog.deleteMany({})
      console.log('🗑️  Старые записи удалены')
    }

    // Добавляем новые записи
    for (const service of animatorServices) {
      await prisma.animator_services_catalog.create({
        data: service
      })
      console.log(`✅ ${service.icon} ${service.name_ru}`)
    }

    const newCount = await prisma.animator_services_catalog.count()
    console.log(`\n📊 Итого записей: ${newCount}`)
    console.log('\n✅ Каталог успешно заполнен!')
    console.log('\n💡 Теперь создание профиля аниматора будет работать')

  } catch (error: any) {
    console.error('\n❌ Ошибка:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedAnimatorCatalog()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error)
    process.exit(1)
  })

