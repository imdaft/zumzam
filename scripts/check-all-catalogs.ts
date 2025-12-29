/**
 * Проверка всех каталогов
 */

import prisma from '../lib/prisma'

async function checkAllCatalogs() {
  console.log('📊 Проверка всех каталогов...\n')

  try {
    const catalogs = [
      { name: 'activity_catalog', model: prisma.activity_catalog },
      { name: 'animator_services_catalog', model: prisma.animator_services_catalog },
      { name: 'show_types_catalog', model: prisma.show_types_catalog },
      { name: 'photographer_styles_catalog', model: prisma.photographer_styles_catalog },
      { name: 'masterclass_types_catalog', model: prisma.masterclass_types_catalog },
      { name: 'quest_types_catalog', model: prisma.quest_types_catalog },
      { name: 'agency_services_catalog', model: prisma.agency_services_catalog },
      { name: 'additional_services_catalog', model: prisma.additional_services_catalog },
    ]

    for (const catalog of catalogs) {
      try {
        const count = await catalog.model.count()
        const status = count > 0 ? '✅' : '⚠️ '
        console.log(`${status} ${catalog.name}: ${count} записей`)
      } catch (error: any) {
        console.log(`❌ ${catalog.name}: ошибка (${error.message})`)
      }
    }

    console.log('\n💡 Если есть пустые каталоги (⚠️), нужно их заполнить')

  } catch (error: any) {
    console.error('\n❌ Ошибка:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllCatalogs()

