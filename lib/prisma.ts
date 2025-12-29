import { PrismaClient } from '@prisma/client'
import { prismaMonitorMiddleware } from './monitoring/prisma-monitor'

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['warn', 'error'] 
      : ['error'],
  })
  
  // Подключаем middleware для мониторинга
  client.$use(prismaMonitorMiddleware)
  
  return client
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

