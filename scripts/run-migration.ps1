# ================================================================================
# АВТОМАТИЧЕСКАЯ МИГРАЦИЯ STORAGE
# ================================================================================
# Этот скрипт автоматически выполняет все шаги миграции Storage
# ================================================================================

Write-Host "🚀 МИГРАЦИЯ STORAGE ZUMZAM" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия psql
Write-Host "🔍 Проверка наличия PostgreSQL..." -ForegroundColor Yellow
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "❌ ОШИБКА: psql не найден!" -ForegroundColor Red
    Write-Host "Установите PostgreSQL или добавьте его в PATH" -ForegroundColor Red
    exit 1
}
Write-Host "✅ PostgreSQL найден: $($psqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Параметры подключения
$DB_HOST = "127.0.0.1"
$DB_PORT = "54322"
$DB_USER = "postgres"
$DB_NAME = "postgres"

Write-Host "📋 Параметры подключения:" -ForegroundColor Yellow
Write-Host "   Host: $DB_HOST" -ForegroundColor Gray
Write-Host "   Port: $DB_PORT" -ForegroundColor Gray
Write-Host "   User: $DB_USER" -ForegroundColor Gray
Write-Host "   Database: $DB_NAME" -ForegroundColor Gray
Write-Host ""

# Проверка подключения к БД
Write-Host "🔌 Проверка подключения к базе данных..." -ForegroundColor Yellow
$testConnection = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ОШИБКА: Не удалось подключиться к базе данных!" -ForegroundColor Red
    Write-Host "Убедитесь, что Supabase запущен: supabase start" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Подключение успешно" -ForegroundColor Green
Write-Host ""

# ШАГ 1: Проверка текущего состояния
Write-Host "📊 ШАГ 1: Проверка текущего состояния Storage" -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
& psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "scripts/check-storage-migration.sql"
Write-Host ""

# Запрос подтверждения
Write-Host "❓ Продолжить создание Storage buckets? (Y/N)" -ForegroundColor Yellow
$confirmation = Read-Host
if ($confirmation -ne "Y" -and $confirmation -ne "y") {
    Write-Host "❌ Миграция отменена пользователем" -ForegroundColor Red
    exit 0
}
Write-Host ""

# ШАГ 2: Создание Storage buckets
Write-Host "🪣 ШАГ 2: Создание Storage buckets" -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
& psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "scripts/create-storage-buckets.sql"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ОШИБКА при создании buckets!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Storage buckets созданы" -ForegroundColor Green
Write-Host ""

# ШАГ 3: Обновление URL (опционально)
Write-Host "🔄 ШАГ 3: Обновление URL в базе данных" -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "⚠️  ВНИМАНИЕ: Этот шаг обновит все URL в базе данных!" -ForegroundColor Yellow
Write-Host "   Старые URL (США): https://dijcyhkmzohyvngaioiu.supabase.co/..." -ForegroundColor Gray
Write-Host "   Новые URL (локальные): http://127.0.0.1:54321/..." -ForegroundColor Gray
Write-Host ""
Write-Host "❓ Выполнить обновление URL? (Y/N)" -ForegroundColor Yellow
$updateUrls = Read-Host

if ($updateUrls -eq "Y" -or $updateUrls -eq "y") {
    Write-Host ""
    Write-Host "💾 Создание backup перед обновлением..." -ForegroundColor Yellow
    $backupFile = "backup_before_url_migration_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    & pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $backupFile
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup создан: $backupFile" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Не удалось создать backup, но продолжаем..." -ForegroundColor Yellow
    }
    Write-Host ""
    
    Write-Host "🔄 Обновление URL..." -ForegroundColor Yellow
    & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "scripts/migrate-storage-urls.sql"
    
    Write-Host ""
    Write-Host "⚠️  Транзакция открыта! Проверьте результаты выше." -ForegroundColor Yellow
    Write-Host "❓ Подтвердить изменения (COMMIT)? (Y/N)" -ForegroundColor Yellow
    $commitChanges = Read-Host
    
    if ($commitChanges -eq "Y" -or $commitChanges -eq "y") {
        & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "COMMIT;"
        Write-Host "✅ Изменения сохранены (COMMIT)" -ForegroundColor Green
    } else {
        & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "ROLLBACK;"
        Write-Host "↩️  Изменения отменены (ROLLBACK)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Обновление URL пропущено" -ForegroundColor Yellow
}
Write-Host ""

# ШАГ 4: Финальная проверка
Write-Host "✅ ШАГ 4: Финальная проверка" -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
& psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "scripts/check-storage-migration.sql"
Write-Host ""

# Итоги
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 МИГРАЦИЯ ЗАВЕРШЕНА!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Следующие шаги:" -ForegroundColor Yellow
Write-Host "   1. ✅ Storage buckets созданы" -ForegroundColor Green
Write-Host "   2. ✅ next.config.ts обновлен" -ForegroundColor Green
Write-Host "   3. 🔄 Пересоберите приложение: npm run build" -ForegroundColor Yellow
Write-Host "   4. 🔄 Перезапустите dev сервер: npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  ВАЖНО: Если обновляли URL, файлы нужно скопировать из старого Storage!" -ForegroundColor Yellow
Write-Host "   Используйте: node scripts/copy-storage-files.js" -ForegroundColor Gray
Write-Host ""

# АВТОМАТИЧЕСКАЯ МИГРАЦИЯ STORAGE
# ================================================================================
# Этот скрипт автоматически выполняет все шаги миграции Storage
# ================================================================================

Write-Host "🚀 МИГРАЦИЯ STORAGE ZUMZAM" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия psql
Write-Host "🔍 Проверка наличия PostgreSQL..." -ForegroundColor Yellow
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "❌ ОШИБКА: psql не найден!" -ForegroundColor Red
    Write-Host "Установите PostgreSQL или добавьте его в PATH" -ForegroundColor Red
    exit 1
}
Write-Host "✅ PostgreSQL найден: $($psqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Параметры подключения
$DB_HOST = "127.0.0.1"
$DB_PORT = "54322"
$DB_USER = "postgres"
$DB_NAME = "postgres"

Write-Host "📋 Параметры подключения:" -ForegroundColor Yellow
Write-Host "   Host: $DB_HOST" -ForegroundColor Gray
Write-Host "   Port: $DB_PORT" -ForegroundColor Gray
Write-Host "   User: $DB_USER" -ForegroundColor Gray
Write-Host "   Database: $DB_NAME" -ForegroundColor Gray
Write-Host ""

# Проверка подключения к БД
Write-Host "🔌 Проверка подключения к базе данных..." -ForegroundColor Yellow
$testConnection = & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ОШИБКА: Не удалось подключиться к базе данных!" -ForegroundColor Red
    Write-Host "Убедитесь, что Supabase запущен: supabase start" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Подключение успешно" -ForegroundColor Green
Write-Host ""

# ШАГ 1: Проверка текущего состояния
Write-Host "📊 ШАГ 1: Проверка текущего состояния Storage" -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
& psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "scripts/check-storage-migration.sql"
Write-Host ""

# Запрос подтверждения
Write-Host "❓ Продолжить создание Storage buckets? (Y/N)" -ForegroundColor Yellow
$confirmation = Read-Host
if ($confirmation -ne "Y" -and $confirmation -ne "y") {
    Write-Host "❌ Миграция отменена пользователем" -ForegroundColor Red
    exit 0
}
Write-Host ""

# ШАГ 2: Создание Storage buckets
Write-Host "🪣 ШАГ 2: Создание Storage buckets" -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
& psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "scripts/create-storage-buckets.sql"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ОШИБКА при создании buckets!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Storage buckets созданы" -ForegroundColor Green
Write-Host ""

# ШАГ 3: Обновление URL (опционально)
Write-Host "🔄 ШАГ 3: Обновление URL в базе данных" -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "⚠️  ВНИМАНИЕ: Этот шаг обновит все URL в базе данных!" -ForegroundColor Yellow
Write-Host "   Старые URL (США): https://dijcyhkmzohyvngaioiu.supabase.co/..." -ForegroundColor Gray
Write-Host "   Новые URL (локальные): http://127.0.0.1:54321/..." -ForegroundColor Gray
Write-Host ""
Write-Host "❓ Выполнить обновление URL? (Y/N)" -ForegroundColor Yellow
$updateUrls = Read-Host

if ($updateUrls -eq "Y" -or $updateUrls -eq "y") {
    Write-Host ""
    Write-Host "💾 Создание backup перед обновлением..." -ForegroundColor Yellow
    $backupFile = "backup_before_url_migration_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    & pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $backupFile
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup создан: $backupFile" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Не удалось создать backup, но продолжаем..." -ForegroundColor Yellow
    }
    Write-Host ""
    
    Write-Host "🔄 Обновление URL..." -ForegroundColor Yellow
    & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "scripts/migrate-storage-urls.sql"
    
    Write-Host ""
    Write-Host "⚠️  Транзакция открыта! Проверьте результаты выше." -ForegroundColor Yellow
    Write-Host "❓ Подтвердить изменения (COMMIT)? (Y/N)" -ForegroundColor Yellow
    $commitChanges = Read-Host
    
    if ($commitChanges -eq "Y" -or $commitChanges -eq "y") {
        & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "COMMIT;"
        Write-Host "✅ Изменения сохранены (COMMIT)" -ForegroundColor Green
    } else {
        & psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "ROLLBACK;"
        Write-Host "↩️  Изменения отменены (ROLLBACK)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Обновление URL пропущено" -ForegroundColor Yellow
}
Write-Host ""

# ШАГ 4: Финальная проверка
Write-Host "✅ ШАГ 4: Финальная проверка" -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Cyan
& psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "scripts/check-storage-migration.sql"
Write-Host ""

# Итоги
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 МИГРАЦИЯ ЗАВЕРШЕНА!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Следующие шаги:" -ForegroundColor Yellow
Write-Host "   1. ✅ Storage buckets созданы" -ForegroundColor Green
Write-Host "   2. ✅ next.config.ts обновлен" -ForegroundColor Green
Write-Host "   3. 🔄 Пересоберите приложение: npm run build" -ForegroundColor Yellow
Write-Host "   4. 🔄 Перезапустите dev сервер: npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  ВАЖНО: Если обновляли URL, файлы нужно скопировать из старого Storage!" -ForegroundColor Yellow
Write-Host "   Используйте: node scripts/copy-storage-files.js" -ForegroundColor Gray
Write-Host ""




