/**
 * Скрипт генерации VAPID ключей для Push уведомлений
 * 
 * Запуск: node scripts/generate-vapid-keys.js
 */

const webpush = require('web-push')
const fs = require('fs')
const path = require('path')

console.log('🔑 Генерация VAPID ключей для Push уведомлений...\n')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('✅ Ключи сгенерированы!\n')
console.log('=' .repeat(60))
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey)
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey)
console.log('NEXT_PUBLIC_VAPID_KEY=' + vapidKeys.publicKey)
console.log('=' .repeat(60))

console.log('\n📋 Добавьте эти строки в файл .env.local')

// Пытаемся добавить в .env.local
const envPath = path.join(__dirname, '..', '.env.local')

try {
  const envContent = `
# VAPID ключи (сгенерировано ${new Date().toISOString()})
VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
NEXT_PUBLIC_VAPID_KEY=${vapidKeys.publicKey}
`
  
  if (fs.existsSync(envPath)) {
    fs.appendFileSync(envPath, envContent)
    console.log('\n✅ Ключи добавлены в .env.local')
  } else {
    console.log('\n⚠️ Файл .env.local не найден. Создайте его и добавьте ключи вручную.')
  }
} catch (error) {
  console.log('\n⚠️ Не удалось записать в .env.local:', error.message)
  console.log('Добавьте ключи вручную.')
}

console.log('\n🚀 Готово!')

