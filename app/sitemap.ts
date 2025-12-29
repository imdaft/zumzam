import { MetadataRoute } from 'next'
import prisma from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zumzam.ru'
  
  // Статические страницы
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/scenario-generator`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]

  try {
    // Динамические страницы профилей
    const profiles = await prisma.profiles.findMany({
      where: {
        is_published: true,
      },
      select: {
        slug: true,
        updated_at: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
    })
    
    if (profiles && profiles.length > 0) {
      profiles.forEach((profile) => {
        routes.push({
          url: `${baseUrl}/profiles/${profile.slug}`,
          lastModified: profile.updated_at || new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      })
    }

    // Динамические страницы услуг
    const services = await prisma.services.findMany({
      where: {
        is_active: true,
      },
      select: {
        id: true,
        updated_at: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
    })
    
    if (services && services.length > 0) {
      services.forEach((service) => {
        routes.push({
          url: `${baseUrl}/services/${service.id}`,
          lastModified: service.updated_at || new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      })
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // В случае ошибки возвращаем хотя бы статические страницы
  }

  return routes
}

// Revalidate каждые 24 часа (86400 секунд)
export const revalidate = 86400


