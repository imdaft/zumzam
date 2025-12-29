# Настройка локального PostgreSQL для ZumZam

## Шаг 1: Установка Docker

### Windows
1. Скачайте Docker Desktop: https://www.docker.com/products/docker-desktop
2. Установите и запустите Docker Desktop
3. Убедитесь, что Docker запущен (иконка в трее)

### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

## Шаг 2: Настройка PostgreSQL

1. Скопируйте `.env.example` в `.env.local` (если еще нет)
2. Создайте файл `.env.postgres` в корне проекта:
```bash
POSTGRES_PASSWORD=ваш_надежный_пароль_здесь
```

3. Запустите PostgreSQL:
```bash
docker-compose -f docker-compose.postgres.yml up -d
```

4. Проверьте, что контейнер запущен:
```bash
docker ps
```

## Шаг 3: Настройка доступа из интернета

### 3.1. Настройка роутера (Port Forwarding)

1. Откройте настройки роутера (обычно 192.168.1.1 или 192.168.0.1)
2. Найдите раздел "Port Forwarding" или "Виртуальные серверы"
3. Добавьте правило:
   - **Внешний порт**: 5432 (или другой, например 15432)
   - **Внутренний IP**: IP вашего компьютера (например, 192.168.1.100)
   - **Внутренний порт**: 5432
   - **Протокол**: TCP

### 3.2. Узнать IP вашего компьютера

**Windows:**
```cmd
ipconfig
```
Найдите "IPv4 Address" (например, 192.168.1.100)

**Linux:**
```bash
ip addr show
# или
hostname -I
```

### 3.3. Настройка Firewall

**Windows:**
1. Откройте "Брандмауэр Защитника Windows"
2. "Дополнительные параметры" → "Правила для входящих подключений"
3. "Создать правило" → "Порт" → TCP → 5432 → "Разрешить подключение"

**Linux:**
```bash
sudo ufw allow 5432/tcp
sudo ufw reload
```

## Шаг 4: Настройка домена (опционально)

### Вариант A: Статический IP (если есть)
- Используйте ваш статический IP напрямую

### Вариант B: Динамический DNS (DDNS)
1. Зарегистрируйтесь на сервисе DDNS:
   - No-IP: https://www.noip.com (бесплатно)
   - DuckDNS: https://www.duckdns.org (бесплатно)
   - Dynu: https://www.dynu.com (бесплатно)

2. Установите клиент DDNS на компьютер:
   - Windows: скачайте клиент с сайта сервиса
   - Linux: используйте `ddclient` или встроенный клиент роутера

3. Получите домен вида: `yourname.ddns.net`

## Шаг 5: Настройка SSL (обязательно для безопасности)

### Генерация самоподписанного сертификата

```bash
# Создайте директорию для сертификатов
mkdir -p postgres-ssl

# Генерация сертификата
openssl req -new -x509 -days 365 -nodes -text \
  -out postgres-ssl/server.crt \
  -keyout postgres-ssl/server.key \
  -subj "/CN=your-domain.ddns.net"
```

### Обновление docker-compose.postgres.yml

Добавьте в секцию `volumes`:
```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
  - ./postgres-ssl:/var/lib/postgresql/ssl
```

И в `command`:
```yaml
command: 
  - "postgres"
  - "-c"
  - "listen_addresses=*"
  - "-c"
  - "ssl=on"
  - "-c"
  - "ssl_cert_file=/var/lib/postgresql/ssl/server.crt"
  - "-c"
  - "ssl_key_file=/var/lib/postgresql/ssl/server.key"
```

## Шаг 6: Настройка PostgreSQL для внешнего доступа

Отредактируйте `pg_hba.conf` (в Docker контейнере):

```bash
docker exec -it zumzam-postgres bash
echo "host    all    all    0.0.0.0/0    md5" >> /var/lib/postgresql/data/pg_hba.conf
exit
docker restart zumzam-postgres
```

Или создайте файл `pg_hba.conf` и подключите через volume.

## Шаг 7: Применение миграций Prisma

```bash
# Обновите DATABASE_URL в .env.local
DATABASE_URL="postgresql://zumzam_admin:ваш_пароль@ваш_домен_или_IP:5432/zumzam?sslmode=require"

# Примените миграции
npx prisma migrate deploy
# или для разработки
npx prisma migrate dev
```

## Шаг 8: Настройка Vercel

1. Перейдите в настройки проекта на Vercel
2. Добавьте переменную окружения:
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://zumzam_admin:ваш_пароль@ваш_домен_или_IP:5432/zumzam?sslmode=require`

## Безопасность

### ⚠️ ВАЖНО:

1. **Используйте сильный пароль** (минимум 20 символов, буквы, цифры, символы)
2. **Включите SSL** (обязательно для внешнего доступа)
3. **Ограничьте доступ по IP** (если возможно, используйте whitelist IP Vercel)
4. **Регулярно обновляйте** PostgreSQL и Docker
5. **Делайте бэкапы** регулярно

### Ограничение доступа по IP (опционально)

В `pg_hba.conf` вместо `0.0.0.0/0` укажите конкретные IP:
```
host    all    all    IP_VERCEL_1/32    md5
host    all    all    IP_VERCEL_2/32    md5
```

IP-адреса Vercel можно получить из их документации или поддержки.

## Проверка подключения

```bash
# Локально
psql "postgresql://zumzam_admin:пароль@localhost:5432/zumzam"

# Извне (замените на ваш домен/IP)
psql "postgresql://zumzam_admin:пароль@ваш_домен:5432/zumzam?sslmode=require"
```

## Бэкапы

```bash
# Создание бэкапа
docker exec zumzam-postgres pg_dump -U zumzam_admin zumzam > backup_$(date +%Y%m%d).sql

# Восстановление
docker exec -i zumzam-postgres psql -U zumzam_admin zumzam < backup_20240101.sql
```

## Мониторинг

```bash
# Проверка статуса
docker ps | grep postgres

# Логи
docker logs zumzam-postgres

# Использование ресурсов
docker stats zumzam-postgres
```

