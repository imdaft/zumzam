# Telegram Бот - Локальная разработка

## Проблема

Сервер production (zumzam.ru) не отвечает, поэтому webhook не работает.

## Решения

### 1. Локальная разработка через Polling

Запустите бота в режиме polling (получение обновлений каждую секунду):

```bash
# Терминал 1: Запустите сервер
npm run dev

# Терминал 2: Запустите бота в режиме polling
node scripts/telegram-bot-local.js
```

**Как это работает:**
- Скрипт удаляет webhook
- Получает сообщения напрямую от Telegram API
- Пересылает их на локальный сервер `http://localhost:4000/api/telegram/webhook`
- Ваш код обработки работает без изменений

**Важно:** Когда закончите разработку, восстановите webhook:
```bash
node scripts/check-telegram-bot.js
```

### 2. Локальная разработка через ngrok (альтернатива)

Если хотите тестировать с реальным webhook:

```bash
# Установите ngrok
npm install -g ngrok

# Терминал 1: Запустите сервер
npm run dev

# Терминал 2: Создайте туннель
ngrok http 4000

# Терминал 3: Установите webhook на ngrok URL
node scripts/setup-ngrok-webhook.js https://your-id.ngrok.io
```

### 3. Production деплой

Для работы на production нужно:

1. **Задеплоить на zumzam.ru:**
   - Убедитесь, что сервер запущен
   - Проверьте, что endpoint `/api/telegram/webhook` доступен извне

2. **Установить переменные окружения на сервере:**
   ```bash
   TELEGRAM_BOT_TOKEN=8214756459:AAFaRzdLIkLBbCJ-sK6Kha6hlQu8l2TfNBM
   NEXT_PUBLIC_BASE_URL=https://zumzam.ru
   ```

3. **Настроить webhook:**
   ```bash
   node scripts/check-telegram-bot.js
   ```

## Текущий статус

- ✅ Бот создан: @ZumZamRu_bot
- ✅ Меню команд установлено
- ✅ Код обработки готов
- ⚠️ Webhook настроен, но сервер не отвечает
- ⚠️ 5 необработанных сообщений в очереди

## Быстрый старт (прямо сейчас)

```bash
# В двух терминалах одновременно:

# Терминал 1:
npm run dev

# Терминал 2:
node scripts/telegram-bot-local.js
```

Теперь можете тестировать команды в боте!

















