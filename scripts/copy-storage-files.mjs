#!/usr/bin/env node
// ================================================================================
// КОПИРОВАНИЕ ФАЙЛОВ ИЗ СТАРОГО SUPABASE В НОВЫЙ
// ================================================================================
// Этот скрипт скачивает файлы со старого Supabase и загружает в локальный Storage
// 
// Использование: node scripts/copy-storage-files.mjs
// ================================================================================

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
const { Client } = pg;

// Конфигурация
const OLD_SUPABASE_URL = 'https://dijcyhkmzohyvngaioiu.supabase.co';
const OLD_STORAGE_URL = 'https://dijcyhkmzohyvngaioiu.supabase.co/storage/v1/object/public';

const NEW_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
// Используем service_role_key для обхода RLS политик при миграции
const NEW_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

// Временная директория для скачанных файлов
const TEMP_DIR = './temp_storage';

// Подключение к локальной БД для получения списка файлов
const dbClient = new Client({
  host: '127.0.0.1',
  port: 54322,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
});

// Supabase клиент для загрузки файлов
const supabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

console.log('🚀 КОПИРОВАНИЕ ФАЙЛОВ ИЗ СТАРОГО SUPABASE');
console.log('═══════════════════════════════════════════════════════════════════════════\n');

async function main() {
  try {
    // Создаем временную директорию
    await fs.mkdir(TEMP_DIR, { recursive: true });
    console.log(`✅ Временная директория создана: ${TEMP_DIR}\n`);

    // Подключаемся к БД
    await dbClient.connect();
    console.log('✅ Подключение к базе данных установлено\n');

    // Получаем список файлов для копирования
    console.log('🔍 Получение списка файлов из базы данных...\n');
    
    const result = await dbClient.query(`
      SELECT DISTINCT
        cover_photo as url,
        'portfolio' as bucket
      FROM profiles 
      WHERE cover_photo LIKE '%127.0.0.1%'
        AND cover_photo IS NOT NULL
      
      UNION ALL
      
      SELECT DISTINCT
        main_photo,
        'portfolio'
      FROM profiles
      WHERE main_photo LIKE '%127.0.0.1%'
        AND main_photo IS NOT NULL
      
      UNION ALL
      
      SELECT DISTINCT
        unnest(photos),
        'portfolio'
      FROM profiles
      WHERE photos IS NOT NULL
        AND array_length(photos, 1) > 0
        AND photos::text LIKE '%127.0.0.1%'
    `);

    const files = result.rows;
    console.log(`📊 Найдено файлов для копирования: ${files.length}\n`);

    if (files.length === 0) {
      console.log('⚠️  Нет файлов для копирования!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let alreadyExistsCount = 0;

    // Обрабатываем каждый файл
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const currentNum = i + 1;
      
      try {
        // Извлекаем путь к файлу из URL
        const urlMatch = file.url.match(/\/portfolio\/(.+)$/);
        if (!urlMatch) {
          console.log(`⚠️  [${currentNum}/${files.length}] Не удалось извлечь путь из URL: ${file.url}`);
          errorCount++;
          continue;
        }

        const filePath = urlMatch[1]; // например: "000bcedc.../1765476565075-gd7tjk.jpg"
        const oldFileUrl = `${OLD_STORAGE_URL}/portfolio/${filePath}`;
        const fileName = path.basename(filePath);

        console.log(`📥 [${currentNum}/${files.length}] Скачивание: ${fileName}`);

        // Проверяем, существует ли файл уже в новом Storage
        const { data: existingFiles } = await supabase.storage
          .from('portfolio')
          .list(path.dirname(filePath));

        if (existingFiles?.some(f => f.name === fileName)) {
          console.log(`   ⏭️  Файл уже существует, пропускаем\n`);
          alreadyExistsCount++;
          continue;
        }

        // Скачиваем файл со старого Supabase
        const response = await fetch(oldFileUrl);
        
        if (!response.ok) {
          console.log(`   ❌ Ошибка скачивания: ${response.status} ${response.statusText}\n`);
          errorCount++;
          continue;
        }

        const buffer = await response.buffer();
        const tempFilePath = path.join(TEMP_DIR, fileName);
        await fs.writeFile(tempFilePath, buffer);

        console.log(`   ✅ Скачано: ${(buffer.length / 1024).toFixed(2)} KB`);

        // Загружаем в новый Supabase Storage
        const fileData = await fs.readFile(tempFilePath);
        const { data, error } = await supabase.storage
          .from('portfolio')
          .upload(filePath, fileData, {
            contentType: response.headers.get('content-type') || 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.log(`   ❌ Ошибка загрузки: ${error.message}\n`);
          errorCount++;
        } else {
          console.log(`   ✅ Загружено в новый Storage: ${filePath}\n`);
          successCount++;
        }

        // Удаляем временный файл
        await fs.unlink(tempFilePath);

      } catch (err) {
        console.log(`   ❌ Ошибка обработки: ${err.message}\n`);
        errorCount++;
      }
    }

    // Итоги
    console.log('\n═══════════════════════════════════════════════════════════════════════════');
    console.log('📊 ИТОГИ КОПИРОВАНИЯ');
    console.log('═══════════════════════════════════════════════════════════════════════════\n');
    console.log(`✅ Успешно скопировано: ${successCount}`);
    console.log(`⏭️  Уже существовало: ${alreadyExistsCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
    console.log(`📋 Всего обработано: ${files.length}\n`);

    if (successCount > 0) {
      console.log('🎉 Файлы успешно скопированы в новый Storage!');
      console.log('✅ Теперь изображения будут загружаться локально\n');
    }

  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
    process.exit(1);
  } finally {
    // Закрываем соединение с БД
    await dbClient.end();
    
    // Удаляем временную директорию
    try {
      await fs.rm(TEMP_DIR, { recursive: true });
      console.log(`🗑️  Временная директория удалена\n`);
    } catch (err) {
      console.log(`⚠️  Не удалось удалить временную директорию: ${err.message}\n`);
    }
  }
}

main();


// КОПИРОВАНИЕ ФАЙЛОВ ИЗ СТАРОГО SUPABASE В НОВЫЙ
// ================================================================================
// Этот скрипт скачивает файлы со старого Supabase и загружает в локальный Storage
// 
// Использование: node scripts/copy-storage-files.mjs
// ================================================================================

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
const { Client } = pg;

// Конфигурация
const OLD_SUPABASE_URL = 'https://dijcyhkmzohyvngaioiu.supabase.co';
const OLD_STORAGE_URL = 'https://dijcyhkmzohyvngaioiu.supabase.co/storage/v1/object/public';

const NEW_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
// Используем service_role_key для обхода RLS политик при миграции
const NEW_SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

// Временная директория для скачанных файлов
const TEMP_DIR = './temp_storage';

// Подключение к локальной БД для получения списка файлов
const dbClient = new Client({
  host: '127.0.0.1',
  port: 54322,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
});

// Supabase клиент для загрузки файлов
const supabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

console.log('🚀 КОПИРОВАНИЕ ФАЙЛОВ ИЗ СТАРОГО SUPABASE');
console.log('═══════════════════════════════════════════════════════════════════════════\n');

async function main() {
  try {
    // Создаем временную директорию
    await fs.mkdir(TEMP_DIR, { recursive: true });
    console.log(`✅ Временная директория создана: ${TEMP_DIR}\n`);

    // Подключаемся к БД
    await dbClient.connect();
    console.log('✅ Подключение к базе данных установлено\n');

    // Получаем список файлов для копирования
    console.log('🔍 Получение списка файлов из базы данных...\n');
    
    const result = await dbClient.query(`
      SELECT DISTINCT
        cover_photo as url,
        'portfolio' as bucket
      FROM profiles 
      WHERE cover_photo LIKE '%127.0.0.1%'
        AND cover_photo IS NOT NULL
      
      UNION ALL
      
      SELECT DISTINCT
        main_photo,
        'portfolio'
      FROM profiles
      WHERE main_photo LIKE '%127.0.0.1%'
        AND main_photo IS NOT NULL
      
      UNION ALL
      
      SELECT DISTINCT
        unnest(photos),
        'portfolio'
      FROM profiles
      WHERE photos IS NOT NULL
        AND array_length(photos, 1) > 0
        AND photos::text LIKE '%127.0.0.1%'
    `);

    const files = result.rows;
    console.log(`📊 Найдено файлов для копирования: ${files.length}\n`);

    if (files.length === 0) {
      console.log('⚠️  Нет файлов для копирования!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let alreadyExistsCount = 0;

    // Обрабатываем каждый файл
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const currentNum = i + 1;
      
      try {
        // Извлекаем путь к файлу из URL
        const urlMatch = file.url.match(/\/portfolio\/(.+)$/);
        if (!urlMatch) {
          console.log(`⚠️  [${currentNum}/${files.length}] Не удалось извлечь путь из URL: ${file.url}`);
          errorCount++;
          continue;
        }

        const filePath = urlMatch[1]; // например: "000bcedc.../1765476565075-gd7tjk.jpg"
        const oldFileUrl = `${OLD_STORAGE_URL}/portfolio/${filePath}`;
        const fileName = path.basename(filePath);

        console.log(`📥 [${currentNum}/${files.length}] Скачивание: ${fileName}`);

        // Проверяем, существует ли файл уже в новом Storage
        const { data: existingFiles } = await supabase.storage
          .from('portfolio')
          .list(path.dirname(filePath));

        if (existingFiles?.some(f => f.name === fileName)) {
          console.log(`   ⏭️  Файл уже существует, пропускаем\n`);
          alreadyExistsCount++;
          continue;
        }

        // Скачиваем файл со старого Supabase
        const response = await fetch(oldFileUrl);
        
        if (!response.ok) {
          console.log(`   ❌ Ошибка скачивания: ${response.status} ${response.statusText}\n`);
          errorCount++;
          continue;
        }

        const buffer = await response.buffer();
        const tempFilePath = path.join(TEMP_DIR, fileName);
        await fs.writeFile(tempFilePath, buffer);

        console.log(`   ✅ Скачано: ${(buffer.length / 1024).toFixed(2)} KB`);

        // Загружаем в новый Supabase Storage
        const fileData = await fs.readFile(tempFilePath);
        const { data, error } = await supabase.storage
          .from('portfolio')
          .upload(filePath, fileData, {
            contentType: response.headers.get('content-type') || 'image/jpeg',
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.log(`   ❌ Ошибка загрузки: ${error.message}\n`);
          errorCount++;
        } else {
          console.log(`   ✅ Загружено в новый Storage: ${filePath}\n`);
          successCount++;
        }

        // Удаляем временный файл
        await fs.unlink(tempFilePath);

      } catch (err) {
        console.log(`   ❌ Ошибка обработки: ${err.message}\n`);
        errorCount++;
      }
    }

    // Итоги
    console.log('\n═══════════════════════════════════════════════════════════════════════════');
    console.log('📊 ИТОГИ КОПИРОВАНИЯ');
    console.log('═══════════════════════════════════════════════════════════════════════════\n');
    console.log(`✅ Успешно скопировано: ${successCount}`);
    console.log(`⏭️  Уже существовало: ${alreadyExistsCount}`);
    console.log(`❌ Ошибок: ${errorCount}`);
    console.log(`📋 Всего обработано: ${files.length}\n`);

    if (successCount > 0) {
      console.log('🎉 Файлы успешно скопированы в новый Storage!');
      console.log('✅ Теперь изображения будут загружаться локально\n');
    }

  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error);
    process.exit(1);
  } finally {
    // Закрываем соединение с БД
    await dbClient.end();
    
    // Удаляем временную директорию
    try {
      await fs.rm(TEMP_DIR, { recursive: true });
      console.log(`🗑️  Временная директория удалена\n`);
    } catch (err) {
      console.log(`⚠️  Не удалось удалить временную директорию: ${err.message}\n`);
    }
  }
}

main();

