import prisma from '@/lib/prisma'

/**
 * Сохраняет связи профиля с активностями
 * Удаляет старые связи и создаёт новые
 */
export async function saveProfileActivities(
  profileId: string,
  activityIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Удаляем все старые связи
    await prisma.profile_activities.deleteMany({
      where: { profile_id: profileId },
    })

    // 2. Если нет новых активностей, выходим
    if (!activityIds || activityIds.length === 0) {
      return { success: true }
    }

    // 3. Создаём новые связи
    await prisma.profile_activities.createMany({
      data: activityIds.map((activityId) => ({
        profile_id: profileId,
        activity_id: activityId,
      })),
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [saveProfileActivities] Saved ${activityIds.length} activities for profile ${profileId}`)
    }
    return { success: true }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[saveProfileActivities] Error:', error)
    }
    return {
      success: false,
      error: error.message || 'Неизвестная ошибка при сохранении активностей',
    }
  }
}

/**
 * Сохраняет связи профиля с услугами
 * Удаляет старые связи и создаёт новые
 */
export async function saveProfileServices(
  profileId: string,
  serviceIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Удаляем все старые связи
    await prisma.profile_services.deleteMany({
      where: { profile_id: profileId },
    })

    // 2. Если нет новых услуг, выходим
    if (!serviceIds || serviceIds.length === 0) {
      return { success: true }
    }

    // 3. Создаём новые связи
    await prisma.profile_services.createMany({
      data: serviceIds.map((serviceId) => ({
        profile_id: profileId,
        service_id: serviceId,
        is_included: true,
      })),
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [saveProfileServices] Saved ${serviceIds.length} services for profile ${profileId}`)
    }
    return { success: true }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[saveProfileServices] Error:', error)
    }
    return {
      success: false,
      error: error.message || 'Неизвестная ошибка при сохранении услуг',
    }
  }
}

/**
 * Получить все активности профиля
 */
export async function getProfileActivities(profileId: string): Promise<string[]> {
  try {
    const links = await prisma.profile_activities.findMany({
      where: { profile_id: profileId },
      select: { activity_id: true },
    })

    return links.map((link) => link.activity_id)
  } catch (error: any) {
    console.error('[getProfileActivities] Error:', error)
    return []
  }
}

/**
 * Получить все услуги профиля
 */
export async function getProfileServices(profileId: string): Promise<string[]> {
  try {
    const links = await prisma.profile_services.findMany({
      where: { profile_id: profileId },
      select: { service_id: true },
    })

    return links.map((link) => link.service_id)
  } catch (error: any) {
    console.error('[getProfileServices] Error:', error)
    return []
  }
}
