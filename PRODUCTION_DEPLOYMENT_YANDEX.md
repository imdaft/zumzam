# 🚀 РАЗВОРАЧИВАНИЕ PRODUCTION НА ЯНДЕКС.ОБЛАКЕ

## 📊 ТЕКУЩИЙ СТАТУС

### Что есть:
- ✅ Локальная разработка работает (`npm run dev`)
- ✅ Локальная БД Supabase Docker с данными
- ✅ ВМ на Яндексе (89.169.190.79)
- ❌ Managed PostgreSQL - НЕТ (создаём)
- ❌ Production Next.js - НЕ запущен

### Цель:
Запустить ZumZam.ru на Яндекс.Облаке с соблюдением 152-ФЗ

---

## 🎯 ПЛАН РАЗВЁРТЫВАНИЯ

### Этап 1: Managed PostgreSQL (10-15 мин)
**Действия:**
1. Создать кластер Managed PostgreSQL в Яндекс.Облаке
2. Настроить публичный доступ
3. Получить connection string

**Настройки кластера:**
- Имя: `zumzam-db`
- PostgreSQL версия: 16
- Класс хоста: `b2.medium` (2 vCPU, 4GB RAM)
- Хранилище: 20GB SSD
- База данных: `zumzam`
- Пользователь: `zumzam_admin`
- Пароль: (сложный, сохранить!)
- Публичный доступ: ✅ ДА

**Стоимость:** ~3000₽/мес

**Connection String формат:**
```
postgresql://zumzam_admin:PASSWORD@c-xxx.rw.mdb.yandexcloud.net:6432/zumzam
```

---

### Этап 2: Миграция данных (10 мин)

**Экспорт из локальной БД:**
```bash
# Запустить локальный Supabase
supabase start

# Экспорт данных
pg_dump -h localhost -p 54321 -U postgres -d postgres \
  --data-only \
  --exclude-table-data=auth.* \
  --exclude-table-data=storage.* \
  -f backup_data.sql
```

**Импорт в Managed PostgreSQL:**
```bash
# Применить миграции (структура таблиц)
psql "postgresql://zumzam_admin:PASSWORD@c-xxx.rw.mdb.yandexcloud.net:6432/zumzam" \
  -f supabase/migrations/*.sql

# Импорт данных
psql "postgresql://zumzam_admin:PASSWORD@c-xxx.rw.mdb.yandexcloud.net:6432/zumzam" \
  -f backup_data.sql
```

---

### Этап 3: Подготовка ВМ (30 мин)

**Опция А: Использовать текущую ВМ (89.169.190.79)**
```bash
# SSH подключение
ssh -i ssh/ssh-key-1766452287040/ssh-key-1766452287040 vanekseleznev@89.169.190.79

# 1. Найти и убить процесс, грузящий CPU
top
# Найти процесс с высоким CPU, запомнить PID
sudo kill -9 PID

# 2. Установить Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Установить PM2
sudo npm install -g pm2

# 4. Перейти в проект
cd /home/vanekseleznev/zumzam

# 5. Обновить .env.local
nano .env.local
# Вставить новый Managed PostgreSQL connection string
```

**Опция Б: Создать новую ВМ**
- Создать новую ВМ (1 vCPU, 2GB RAM) ~500-1000₽/мес
- Установить Node.js, PM2, Nginx
- Загрузить код

---

### Этап 4: Настройка .env.local

```bash
# На ВМ: /home/vanekseleznev/zumzam/.env.local

# Managed PostgreSQL
NEXT_PUBLIC_SUPABASE_URL=postgresql://zumzam_admin:PASSWORD@c-xxx.rw.mdb.yandexcloud.net:6432/zumzam
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Или если используем прямое подключение:
DATABASE_URL=postgresql://zumzam_admin:PASSWORD@c-xxx.rw.mdb.yandexcloud.net:6432/zumzam

# Next.js
NEXT_PUBLIC_APP_URL=https://zumzam.ru
NODE_ENV=production
```

---

### Этап 5: Сборка и запуск Next.js (20 мин)

```bash
# На ВМ
cd /home/vanekseleznev/zumzam

# 1. Установить зависимости
npm install --legacy-peer-deps

# 2. Собрать production build
npm run build

# 3. Запустить через PM2
pm2 start npm --name "zumzam" -- start

# 4. Сохранить конфигурацию PM2
pm2 save
pm2 startup

# 5. Проверить логи
pm2 logs zumzam
```

---

### Этап 6: Настройка Nginx (20 мин)

```bash
# Установить Nginx
sudo apt update
sudo apt install -y nginx

# Создать конфиг для ZumZam.ru
sudo nano /etc/nginx/sites-available/zumzam

# Вставить конфигурацию:
server {
    listen 80;
    server_name zumzam.ru www.zumzam.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Активировать конфиг
sudo ln -s /etc/nginx/sites-available/zumzam /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### Этап 7: SSL сертификат (10 мин)

```bash
# Установить Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получить SSL сертификат
sudo certbot --nginx -d zumzam.ru -d www.zumzam.ru

# Автообновление сертификата
sudo systemctl enable certbot.timer
```

---

### Этап 8: Настройка DNS

**В панели регистратора домена (где купил zumzam.ru):**

Добавить A-записи:
```
@     A     89.169.190.79  (или IP новой ВМ)
www   A     89.169.190.79  (или IP новой ВМ)
```

**TTL:** 300 секунд (для быстрого обновления)

---

## 🎯 ЧЕКЛИСТ ЗАПУСКА

- [ ] Создан Managed PostgreSQL кластер
- [ ] Получен connection string
- [ ] Экспортированы данные из локальной БД
- [ ] Импортированы данные в Managed PostgreSQL
- [ ] ВМ подготовлена (CPU 100% устранён)
- [ ] Установлен Node.js 20
- [ ] Установлен PM2
- [ ] Обновлён .env.local с новыми credentials
- [ ] npm install выполнен
- [ ] npm run build выполнен
- [ ] PM2 запустил Next.js
- [ ] Nginx установлен и настроен
- [ ] SSL сертификат получен
- [ ] DNS записи обновлены
- [ ] ZumZam.ru открывается в браузере
- [ ] Публичные профили работают
- [ ] Редактирование профилей работает

---

## 💰 СТОИМОСТЬ

### Managed PostgreSQL:
- b2.medium (2 vCPU, 4GB RAM, 20GB SSD): ~3000₽/мес

### ВМ для Next.js:
- Если используем текущую (6 vCPU, 6GB RAM): ~2000-6000₽/мес
- Если создадим новую (1 vCPU, 2GB RAM): ~500-1000₽/мес

**ИТОГО:** ~3500-4000₽/мес (с новой маленькой ВМ)

**РЕКОМЕНДАЦИЯ:** Остановить текущую ВМ, создать новую маленькую для экономии.

---

## 📞 ПОЛЕЗНЫЕ КОМАНДЫ

### На ВМ:
```bash
# Проверить статус Next.js
pm2 status

# Логи
pm2 logs zumzam

# Перезапустить
pm2 restart zumzam

# Остановить
pm2 stop zumzam

# Проверить CPU/RAM
top
htop

# Проверить Nginx
sudo nginx -t
sudo systemctl status nginx
sudo systemctl restart nginx
```

### Локально:
```bash
# Экспорт данных
supabase db dump -f backup.sql --data-only

# Тестовое подключение к Managed PG
psql "postgresql://zumzam_admin:PASSWORD@c-xxx.rw.mdb.yandexcloud.net:6432/zumzam"
```

---

## 🚨 ВОЗМОЖНЫЕ ПРОБЛЕМЫ

### 1. CPU 100% на ВМ
**Решение:** Найти процесс через `top`, убить через `kill -9 PID`

### 2. npm install падает
**Решение:** Использовать `npm install --legacy-peer-deps`

### 3. Next.js не запускается
**Решение:** Проверить логи `pm2 logs zumzam`, проверить `.env.local`

### 4. Не подключается к БД
**Решение:**
- Проверить публичный доступ в настройках Managed PostgreSQL
- Проверить Security Group
- Проверить connection string

### 5. SSL не получается
**Решение:**
- Проверить DNS записи (должны указывать на IP ВМ)
- Подождать 5-10 минут распространения DNS
- Попробовать `sudo certbot --nginx -d zumzam.ru --dry-run`

---

## ✅ КРИТЕРИИ УСПЕХА

1. ZumZam.ru открывается по HTTPS ✅
2. Публичные профили отображаются ✅
3. Редактирование профилей работает ✅
4. Все данные на месте ✅
5. Соответствие 152-ФЗ ✅
6. Стабильная работа без падений ✅

---

## 📝 КОНТАКТЫ И ДОСТУПЫ

**SSH:**
```
ssh -i ssh/ssh-key-1766452287040/ssh-key-1766452287040 vanekseleznev@89.169.190.79
```

**Managed PostgreSQL:**
```
Host: c-xxx.rw.mdb.yandexcloud.net
Port: 6432
DB: zumzam
User: zumzam_admin
Password: [ТУТ БУДЕТ ТВОЙ ПАРОЛЬ]
```

**Яндекс.Облако Console:**
```
https://console.yandex.cloud
```

---

**Статус:** ⏳ Ожидание создания Managed PostgreSQL кластера


## 📊 ТЕКУЩИЙ СТАТУС

### Что есть:
- ✅ Локальная разработка работает (`npm run dev`)
- ✅ Локальная БД Supabase Docker с данными
- ✅ ВМ на Яндексе (89.169.190.79)
- ❌ Managed PostgreSQL - НЕТ (создаём)
- ❌ Production Next.js - НЕ запущен

### Цель:
Запустить ZumZam.ru на Яндекс.Облаке с соблюдением 152-ФЗ

---

## 🎯 ПЛАН РАЗВЁРТЫВАНИЯ

### Этап 1: Managed PostgreSQL (10-15 мин)
**Действия:**
1. Создать кластер Managed PostgreSQL в Яндекс.Облаке
2. Настроить публичный доступ
3. Получить connection string

**Настройки кластера:**
- Имя: `zumzam-db`
- PostgreSQL версия: 16
- Класс хоста: `b2.medium` (2 vCPU, 4GB RAM)
- Хранилище: 20GB SSD
- База данных: `zumzam`
- Пользователь: `zumzam_admin`
- Пароль: (сложный, сохранить!)
- Публичный доступ: ✅ ДА

**Стоимость:** ~3000₽/мес

**Connection String формат:**
```
postgresql://zumzam_admin:PASSWORD@c-xxx.rw.mdb.yandexcloud.net:6432/zumzam
```

---

### Этап 2: Миграция данных (10 мин)

**Экспорт из локальной БД:**
```bash
# Запустить локальный Supabase
supabase start

# Экспорт данных
pg_dump -h localhost -p 54321 -U postgres -d postgres \
  --data-only \
  --exclude-table-data=auth.* \
  --exclude-table-data=storage.* \
  -f backup_data.sql
```

**Импорт в Managed PostgreSQL:**
```bash
# Применить миграции (структура таблиц)
psql "postgresql://zumzam_admin:PASSWORD@c-xxx.rw.mdb.yandexcloud.net:6432/zumzam" \
  -f supabase/migrations/*.sql

# Импорт данных
psql "postgresql://zumzam_admin:PASSWORD@c-xxx.rw.mdb.yandexcloud.net:6432/zumzam" \
  -f backup_data.sql
```

---

### Этап 3: Подготовка ВМ (30 мин)

**Опция А: Использовать текущую ВМ (89.169.190.79)**
```bash
# SSH подключение
ssh -i ssh/ssh-key-1766452287040/ssh-key-1766452287040 vanekseleznev@89.169.190.79

# 1. Найти и убить процесс, грузящий CPU
top
# Найти процесс с высоким CPU, запомнить PID
sudo kill -9 PID

# 2. Установить Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Установить PM2
sudo npm install -g pm2

# 4. Перейти в проект
cd /home/vanekseleznev/zumzam

# 5. Обновить .env.local
nano .env.local
# Вставить новый Managed PostgreSQL connection string
```

**Опция Б: Создать новую ВМ**
- Создать новую ВМ (1 vCPU, 2GB RAM) ~500-1000₽/мес
- Установить Node.js, PM2, Nginx
- Загрузить код

---

### Этап 4: Настройка .env.local

```bash
# На ВМ: /home/vanekseleznev/zumzam/.env.local

# Managed PostgreSQL
NEXT_PUBLIC_SUPABASE_URL=postgresql://zumzam_admin:PASSWORD@c-xxx.rw.mdb.yandexcloud.net:6432/zumzam
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Или если используем прямое подключение:
DATABASE_URL=postgresql://zumzam_admin:PASSWORD@c-xxx.rw.mdb.yandexcloud.net:6432/zumzam

# Next.js
NEXT_PUBLIC_APP_URL=https://zumzam.ru
NODE_ENV=production
```

---

### Этап 5: Сборка и запуск Next.js (20 мин)

```bash
# На ВМ
cd /home/vanekseleznev/zumzam

# 1. Установить зависимости
npm install --legacy-peer-deps

# 2. Собрать production build
npm run build

# 3. Запустить через PM2
pm2 start npm --name "zumzam" -- start

# 4. Сохранить конфигурацию PM2
pm2 save
pm2 startup

# 5. Проверить логи
pm2 logs zumzam
```

---

### Этап 6: Настройка Nginx (20 мин)

```bash
# Установить Nginx
sudo apt update
sudo apt install -y nginx

# Создать конфиг для ZumZam.ru
sudo nano /etc/nginx/sites-available/zumzam

# Вставить конфигурацию:
server {
    listen 80;
    server_name zumzam.ru www.zumzam.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Активировать конфиг
sudo ln -s /etc/nginx/sites-available/zumzam /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### Этап 7: SSL сертификат (10 мин)

```bash
# Установить Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получить SSL сертификат
sudo certbot --nginx -d zumzam.ru -d www.zumzam.ru

# Автообновление сертификата
sudo systemctl enable certbot.timer
```

---

### Этап 8: Настройка DNS

**В панели регистратора домена (где купил zumzam.ru):**

Добавить A-записи:
```
@     A     89.169.190.79  (или IP новой ВМ)
www   A     89.169.190.79  (или IP новой ВМ)
```

**TTL:** 300 секунд (для быстрого обновления)

---

## 🎯 ЧЕКЛИСТ ЗАПУСКА

- [ ] Создан Managed PostgreSQL кластер
- [ ] Получен connection string
- [ ] Экспортированы данные из локальной БД
- [ ] Импортированы данные в Managed PostgreSQL
- [ ] ВМ подготовлена (CPU 100% устранён)
- [ ] Установлен Node.js 20
- [ ] Установлен PM2
- [ ] Обновлён .env.local с новыми credentials
- [ ] npm install выполнен
- [ ] npm run build выполнен
- [ ] PM2 запустил Next.js
- [ ] Nginx установлен и настроен
- [ ] SSL сертификат получен
- [ ] DNS записи обновлены
- [ ] ZumZam.ru открывается в браузере
- [ ] Публичные профили работают
- [ ] Редактирование профилей работает

---

## 💰 СТОИМОСТЬ

### Managed PostgreSQL:
- b2.medium (2 vCPU, 4GB RAM, 20GB SSD): ~3000₽/мес

### ВМ для Next.js:
- Если используем текущую (6 vCPU, 6GB RAM): ~2000-6000₽/мес
- Если создадим новую (1 vCPU, 2GB RAM): ~500-1000₽/мес

**ИТОГО:** ~3500-4000₽/мес (с новой маленькой ВМ)

**РЕКОМЕНДАЦИЯ:** Остановить текущую ВМ, создать новую маленькую для экономии.

---

## 📞 ПОЛЕЗНЫЕ КОМАНДЫ

### На ВМ:
```bash
# Проверить статус Next.js
pm2 status

# Логи
pm2 logs zumzam

# Перезапустить
pm2 restart zumzam

# Остановить
pm2 stop zumzam

# Проверить CPU/RAM
top
htop

# Проверить Nginx
sudo nginx -t
sudo systemctl status nginx
sudo systemctl restart nginx
```

### Локально:
```bash
# Экспорт данных
supabase db dump -f backup.sql --data-only

# Тестовое подключение к Managed PG
psql "postgresql://zumzam_admin:PASSWORD@c-xxx.rw.mdb.yandexcloud.net:6432/zumzam"
```

---

## 🚨 ВОЗМОЖНЫЕ ПРОБЛЕМЫ

### 1. CPU 100% на ВМ
**Решение:** Найти процесс через `top`, убить через `kill -9 PID`

### 2. npm install падает
**Решение:** Использовать `npm install --legacy-peer-deps`

### 3. Next.js не запускается
**Решение:** Проверить логи `pm2 logs zumzam`, проверить `.env.local`

### 4. Не подключается к БД
**Решение:**
- Проверить публичный доступ в настройках Managed PostgreSQL
- Проверить Security Group
- Проверить connection string

### 5. SSL не получается
**Решение:**
- Проверить DNS записи (должны указывать на IP ВМ)
- Подождать 5-10 минут распространения DNS
- Попробовать `sudo certbot --nginx -d zumzam.ru --dry-run`

---

## ✅ КРИТЕРИИ УСПЕХА

1. ZumZam.ru открывается по HTTPS ✅
2. Публичные профили отображаются ✅
3. Редактирование профилей работает ✅
4. Все данные на месте ✅
5. Соответствие 152-ФЗ ✅
6. Стабильная работа без падений ✅

---

## 📝 КОНТАКТЫ И ДОСТУПЫ

**SSH:**
```
ssh -i ssh/ssh-key-1766452287040/ssh-key-1766452287040 vanekseleznev@89.169.190.79
```

**Managed PostgreSQL:**
```
Host: c-xxx.rw.mdb.yandexcloud.net
Port: 6432
DB: zumzam
User: zumzam_admin
Password: [ТУТ БУДЕТ ТВОЙ ПАРОЛЬ]
```

**Яндекс.Облако Console:**
```
https://console.yandex.cloud
```

---

**Статус:** ⏳ Ожидание создания Managed PostgreSQL кластера




