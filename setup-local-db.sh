#!/bin/bash

# Скрипт быстрой настройки локального PostgreSQL для ZumZam

set -e

echo "🚀 Настройка локального PostgreSQL для ZumZam"
echo ""

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker Desktop: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! docker ps &> /dev/null; then
    echo "❌ Docker не запущен. Запустите Docker Desktop"
    exit 1
fi

echo "✅ Docker установлен и запущен"

# Генерация пароля
if [ ! -f .env.postgres ]; then
    echo ""
    echo "📝 Создание файла .env.postgres..."
    read -sp "Введите пароль для PostgreSQL (или нажмите Enter для автогенерации): " password
    echo ""
    
    if [ -z "$password" ]; then
        password=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        echo "🔑 Автоматически сгенерирован пароль: $password"
    fi
    
    echo "POSTGRES_PASSWORD=$password" > .env.postgres
    echo "✅ Файл .env.postgres создан"
else
    echo "✅ Файл .env.postgres уже существует"
    source .env.postgres
    password=$POSTGRES_PASSWORD
fi

# Запуск PostgreSQL
echo ""
echo "🐘 Запуск PostgreSQL контейнера..."
docker-compose -f docker-compose.postgres.yml up -d

# Ожидание запуска
echo "⏳ Ожидание запуска PostgreSQL (10 секунд)..."
sleep 10

# Проверка подключения
echo ""
echo "🔍 Проверка подключения..."
if docker exec zumzam-postgres psql -U zumzam_admin -d zumzam -c "SELECT version();" &> /dev/null; then
    echo "✅ PostgreSQL успешно запущен!"
else
    echo "❌ Ошибка подключения к PostgreSQL"
    exit 1
fi

# Получение IP адреса
echo ""
echo "🌐 Настройка доступа из интернета:"
echo ""

# Определение ОС
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    local_ip=$(hostname -I | awk '{print $1}')
elif [[ "$OSTYPE" == "darwin"* ]]; then
    local_ip=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    local_ip=$(ipconfig | grep "IPv4" | head -1 | awk '{print $NF}')
else
    local_ip="192.168.1.100"
fi

echo "📍 Локальный IP вашего компьютера: $local_ip"
echo ""
echo "📋 Следующие шаги:"
echo ""
echo "1. Настройте Port Forwarding в роутере:"
echo "   - Внешний порт: 5432 (или другой, например 15432)"
echo "   - Внутренний IP: $local_ip"
echo "   - Внутренний порт: 5432"
echo "   - Протокол: TCP"
echo ""
echo "2. Откройте порт в Firewall:"
echo "   Windows: Брандмауэр → Правила для входящих → Создать правило → Порт 5432"
echo "   Linux: sudo ufw allow 5432/tcp"
echo ""
echo "3. Узнайте ваш внешний IP:"
echo "   Откройте: https://whatismyipaddress.com"
echo ""
echo "4. Обновите DATABASE_URL в .env.local:"
echo "   DATABASE_URL=\"postgresql://zumzam_admin:$password@ВАШ_ВНЕШНИЙ_IP:5432/zumzam?sslmode=prefer\""
echo ""
echo "5. Добавьте DATABASE_URL в настройки Vercel"
echo ""
echo "✅ Локальная база данных готова к использованию!"
echo ""
echo "🔧 Полезные команды:"
echo "   - Остановить: docker-compose -f docker-compose.postgres.yml down"
echo "   - Запустить: docker-compose -f docker-compose.postgres.yml up -d"
echo "   - Логи: docker logs zumzam-postgres"
echo "   - Подключиться: docker exec -it zumzam-postgres psql -U zumzam_admin -d zumzam"

