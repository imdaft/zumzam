# ================================================================================
# ДЕПЛОЙ НА PRODUCTION (ZumZam.ru)
# ================================================================================
# Этот скрипт выполняет деплой приложения на production сервер
# ================================================================================

param(
    [string]$ServerIP = "",  # IP адрес сервера
    [string]$ServerUser = "root",  # Пользователь SSH
    [string]$ProjectPath = "/root/zumzam"  # Путь к проекту на сервере
)

Write-Host "╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                           ║" -ForegroundColor Cyan
Write-Host "║  " -NoNewline -ForegroundColor Cyan
Write-Host "🚀 ДЕПЛОЙ НА PRODUCTION (ZumZam.ru)" -NoNewline -ForegroundColor Yellow -BackgroundColor Black
Write-Host "                              ║" -ForegroundColor Cyan
Write-Host "║                                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Проверка параметров
if ([string]::IsNullOrEmpty($ServerIP)) {
    Write-Host "❌ ОШИБКА: Не указан IP адрес сервера!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Использование:" -ForegroundColor Yellow
    Write-Host "  .\scripts\deploy-production.ps1 -ServerIP <IP> [-ServerUser <user>] [-ProjectPath <path>]" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Пример:" -ForegroundColor Yellow
    Write-Host "  .\scripts\deploy-production.ps1 -ServerIP 123.45.67.89" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

$SSHKeyPath = "ssh\ssh-key-1766452287040\ssh-key-1766452287040"

# Проверка наличия SSH ключа
if (-not (Test-Path $SSHKeyPath)) {
    Write-Host "❌ ОШИБКА: SSH ключ не найден: $SSHKeyPath" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Параметры деплоя:" -ForegroundColor White
Write-Host "   • Сервер: $ServerUser@$ServerIP" -ForegroundColor Gray
Write-Host "   • Проект: $ProjectPath" -ForegroundColor Gray
Write-Host "   • SSH ключ: $SSHKeyPath" -ForegroundColor Gray
Write-Host ""

# Функция для выполнения команды на сервере
function Invoke-SSHCommand {
    param([string]$Command)
    
    ssh -i $SSHKeyPath -o StrictHostKeyChecking=no "$ServerUser@$ServerIP" $Command
}

# ШАГ 1: Проверка подключения
Write-Host "🔌 ШАГ 1: Проверка подключения к серверу..." -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

$testConnection = Invoke-SSHCommand "echo 'OK'"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Не удалось подключиться к серверу!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Подключение установлено" -ForegroundColor Green
Write-Host ""

# ШАГ 2: Git pull
Write-Host "📥 ШАГ 2: Получение последних изменений из Git..." -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

Invoke-SSHCommand "cd $ProjectPath && git pull origin main"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Git pull завершился с ошибками, продолжаем..." -ForegroundColor Yellow
}
Write-Host ""

# ШАГ 3: Установка зависимостей
Write-Host "📦 ШАГ 3: Установка зависимостей..." -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

Invoke-SSHCommand "cd $ProjectPath && npm ci --legacy-peer-deps"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при установке зависимостей!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Зависимости установлены" -ForegroundColor Green
Write-Host ""

# ШАГ 4: Build приложения
Write-Host "🔨 ШАГ 4: Сборка приложения (npm run build)..." -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

Invoke-SSHCommand "cd $ProjectPath && npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при сборке приложения!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Приложение собрано" -ForegroundColor Green
Write-Host ""

# ШАГ 5: Перезапуск PM2
Write-Host "🔄 ШАГ 5: Перезапуск приложения (PM2)..." -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

Invoke-SSHCommand "cd $ProjectPath && pm2 restart zumzam || pm2 start npm --name zumzam -- start"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при перезапуске PM2!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Приложение перезапущено" -ForegroundColor Green
Write-Host ""

# ШАГ 6: Проверка статуса
Write-Host "📊 ШАГ 6: Проверка статуса..." -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

Invoke-SSHCommand "cd $ProjectPath && pm2 status zumzam"
Write-Host ""

# ЗАВЕРШЕНИЕ
Write-Host "╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                           ║" -ForegroundColor Green
Write-Host "║  " -NoNewline -ForegroundColor Green
Write-Host "✅ ДЕПЛОЙ ЗАВЕРШЕН УСПЕШНО!" -NoNewline -ForegroundColor Yellow -BackgroundColor Black
Write-Host "                                     ║" -ForegroundColor Green
Write-Host "║                                                                           ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Сайт обновлен: https://zumzam.ru" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Полезные команды:" -ForegroundColor White
Write-Host "   • Логи: ssh -i $SSHKeyPath $ServerUser@$ServerIP 'pm2 logs zumzam'" -ForegroundColor Gray
Write-Host "   • Статус: ssh -i $SSHKeyPath $ServerUser@$ServerIP 'pm2 status'" -ForegroundColor Gray
Write-Host "   • Рестарт: ssh -i $SSHKeyPath $ServerUser@$ServerIP 'pm2 restart zumzam'" -ForegroundColor Gray
Write-Host ""


# ================================================================================
# Этот скрипт выполняет деплой приложения на production сервер
# ================================================================================

param(
    [string]$ServerIP = "",  # IP адрес сервера
    [string]$ServerUser = "root",  # Пользователь SSH
    [string]$ProjectPath = "/root/zumzam"  # Путь к проекту на сервере
)

Write-Host "╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                           ║" -ForegroundColor Cyan
Write-Host "║  " -NoNewline -ForegroundColor Cyan
Write-Host "🚀 ДЕПЛОЙ НА PRODUCTION (ZumZam.ru)" -NoNewline -ForegroundColor Yellow -BackgroundColor Black
Write-Host "                              ║" -ForegroundColor Cyan
Write-Host "║                                                                           ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Проверка параметров
if ([string]::IsNullOrEmpty($ServerIP)) {
    Write-Host "❌ ОШИБКА: Не указан IP адрес сервера!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Использование:" -ForegroundColor Yellow
    Write-Host "  .\scripts\deploy-production.ps1 -ServerIP <IP> [-ServerUser <user>] [-ProjectPath <path>]" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Пример:" -ForegroundColor Yellow
    Write-Host "  .\scripts\deploy-production.ps1 -ServerIP 123.45.67.89" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

$SSHKeyPath = "ssh\ssh-key-1766452287040\ssh-key-1766452287040"

# Проверка наличия SSH ключа
if (-not (Test-Path $SSHKeyPath)) {
    Write-Host "❌ ОШИБКА: SSH ключ не найден: $SSHKeyPath" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Параметры деплоя:" -ForegroundColor White
Write-Host "   • Сервер: $ServerUser@$ServerIP" -ForegroundColor Gray
Write-Host "   • Проект: $ProjectPath" -ForegroundColor Gray
Write-Host "   • SSH ключ: $SSHKeyPath" -ForegroundColor Gray
Write-Host ""

# Функция для выполнения команды на сервере
function Invoke-SSHCommand {
    param([string]$Command)
    
    ssh -i $SSHKeyPath -o StrictHostKeyChecking=no "$ServerUser@$ServerIP" $Command
}

# ШАГ 1: Проверка подключения
Write-Host "🔌 ШАГ 1: Проверка подключения к серверу..." -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

$testConnection = Invoke-SSHCommand "echo 'OK'"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Не удалось подключиться к серверу!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Подключение установлено" -ForegroundColor Green
Write-Host ""

# ШАГ 2: Git pull
Write-Host "📥 ШАГ 2: Получение последних изменений из Git..." -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

Invoke-SSHCommand "cd $ProjectPath && git pull origin main"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Git pull завершился с ошибками, продолжаем..." -ForegroundColor Yellow
}
Write-Host ""

# ШАГ 3: Установка зависимостей
Write-Host "📦 ШАГ 3: Установка зависимостей..." -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

Invoke-SSHCommand "cd $ProjectPath && npm ci --legacy-peer-deps"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при установке зависимостей!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Зависимости установлены" -ForegroundColor Green
Write-Host ""

# ШАГ 4: Build приложения
Write-Host "🔨 ШАГ 4: Сборка приложения (npm run build)..." -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

Invoke-SSHCommand "cd $ProjectPath && npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при сборке приложения!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Приложение собрано" -ForegroundColor Green
Write-Host ""

# ШАГ 5: Перезапуск PM2
Write-Host "🔄 ШАГ 5: Перезапуск приложения (PM2)..." -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

Invoke-SSHCommand "cd $ProjectPath && pm2 restart zumzam || pm2 start npm --name zumzam -- start"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Ошибка при перезапуске PM2!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Приложение перезапущено" -ForegroundColor Green
Write-Host ""

# ШАГ 6: Проверка статуса
Write-Host "📊 ШАГ 6: Проверка статуса..." -ForegroundColor Cyan
Write-Host "───────────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

Invoke-SSHCommand "cd $ProjectPath && pm2 status zumzam"
Write-Host ""

# ЗАВЕРШЕНИЕ
Write-Host "╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                                           ║" -ForegroundColor Green
Write-Host "║  " -NoNewline -ForegroundColor Green
Write-Host "✅ ДЕПЛОЙ ЗАВЕРШЕН УСПЕШНО!" -NoNewline -ForegroundColor Yellow -BackgroundColor Black
Write-Host "                                     ║" -ForegroundColor Green
Write-Host "║                                                                           ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Сайт обновлен: https://zumzam.ru" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Полезные команды:" -ForegroundColor White
Write-Host "   • Логи: ssh -i $SSHKeyPath $ServerUser@$ServerIP 'pm2 logs zumzam'" -ForegroundColor Gray
Write-Host "   • Статус: ssh -i $SSHKeyPath $ServerUser@$ServerIP 'pm2 status'" -ForegroundColor Gray
Write-Host "   • Рестарт: ssh -i $SSHKeyPath $ServerUser@$ServerIP 'pm2 restart zumzam'" -ForegroundColor Gray
Write-Host ""

