import prisma from '../lib/prisma'

async function checkEmbeddings() {
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count 
      FROM profiles 
      WHERE embedding IS NOT NULL
    `
    console.log('✅ Profiles with embeddings:', result[0]?.count || 0)
    
    const total = await prisma.profiles.count()
    console.log('📊 Total profiles:', total)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEmbeddings()

