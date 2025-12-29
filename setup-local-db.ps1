# Скрипт быстрой настройки локального PostgreSQL для ZumZam (Windows PowerShell)

Write-Host "🚀 Настройка локального PostgreSQL для ZumZam" -ForegroundColor Cyan
Write-Host ""

# Проверка Docker
try {
    docker ps | Out-Null
    Write-Host "✅ Docker установлен и запущен" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker не установлен или не запущен" -ForegroundColor Red
    Write-Host "Установите Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Генерация пароля
if (-not (Test-Path ".env.postgres")) {
    Write-Host ""
    Write-Host "📝 Создание файла .env.postgres..." -ForegroundColor Cyan
    
    $password = Read-Host "Введите пароль для PostgreSQL (или нажмите Enter для автогенерации)" -AsSecureString
    
    if ($password.Length -eq 0) {
        # Генерация случайного пароля
        $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
        $password = -join ((1..25) | ForEach-Object { Get-Random -Maximum $chars.Length | ForEach-Object { $chars[$_] } })
        Write-Host "🔑 Автоматически сгенерирован пароль: $password" -ForegroundColor Yellow
    } else {
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
        $password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    }
    
    "POSTGRES_PASSWORD=$password" | Out-File -FilePath ".env.postgres" -Encoding UTF8
    Write-Host "✅ Файл .env.postgres создан" -ForegroundColor Green
} else {
    Write-Host "✅ Файл .env.postgres уже существует" -ForegroundColor Green
    $envContent = Get-Content ".env.postgres"
    $password = ($envContent | Select-String "POSTGRES_PASSWORD=").ToString().Split("=")[1]
}

# Запуск PostgreSQL
Write-Host ""
Write-Host "🐘 Запуск PostgreSQL контейнера..." -ForegroundColor Cyan
docker-compose -f docker-compose.postgres.yml up -d

# Ожидание запуска
Write-Host "⏳ Ожидание запуска PostgreSQL (10 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Проверка подключения
Write-Host ""
Write-Host "🔍 Проверка подключения..." -ForegroundColor Cyan
try {
    docker exec zumzam-postgres psql -U zumzam_admin -d zumzam -c "SELECT version();" | Out-Null
    Write-Host "✅ PostgreSQL успешно запущен!" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка подключения к PostgreSQL" -ForegroundColor Red
    exit 1
}

# Получение IP адреса
Write-Host ""
Write-Host "🌐 Настройка доступа из интернета:" -ForegroundColor Cyan
Write-Host ""

$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" } | Select-Object -First 1).IPAddress

if (-not $localIP) {
    $localIP = "192.168.1.100"
}

Write-Host "📍 Локальный IP вашего компьютера: $localIP" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Следующие шаги:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Настройте Port Forwarding в роутере:" -ForegroundColor White
Write-Host "   - Внешний порт: 5432 (или другой, например 15432)" -ForegroundColor Gray
Write-Host "   - Внутренний IP: $localIP" -ForegroundColor Gray
Write-Host "   - Внутренний порт: 5432" -ForegroundColor Gray
Write-Host "   - Протокол: TCP" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Откройте порт в Firewall:" -ForegroundColor White
Write-Host "   - Откройте 'Брандмауэр Защитника Windows'" -ForegroundColor Gray
Write-Host "   - Дополнительные параметры → Правила для входящих" -ForegroundColor Gray
Write-Host "   - Создать правило → Порт → TCP → 5432 → Разрешить" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Узнайте ваш внешний IP:" -ForegroundColor White
Write-Host "   Откройте: https://whatismyipaddress.com" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Обновите DATABASE_URL в .env.local:" -ForegroundColor White
Write-Host "   DATABASE_URL=`"postgresql://zumzam_admin:$password@ВАШ_ВНЕШНИЙ_IP:5432/zumzam?sslmode=prefer`"" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Добавьте DATABASE_URL в настройки Vercel" -ForegroundColor White
Write-Host ""
Write-Host "✅ Локальная база данных готова к использованию!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Полезные команды:" -ForegroundColor Cyan
Write-Host "   - Остановить: docker-compose -f docker-compose.postgres.yml down" -ForegroundColor Gray
Write-Host "   - Запустить: docker-compose -f docker-compose.postgres.yml up -d" -ForegroundColor Gray
Write-Host "   - Логи: docker logs zumzam-postgres" -ForegroundColor Gray
Write-Host "   - Подключиться: docker exec -it zumzam-postgres psql -U zumzam_admin -d zumzam" -ForegroundColor Gray

