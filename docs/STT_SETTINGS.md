# 🎙️ Настройки распознавания речи (STT)

## 📋 Обзор

Теперь в админ-панели можно выбрать провайдер для распознавания голосовых сообщений:

1. **Whisper (локальный)** - Бесплатный, работает без интернета
2. **Gemini 2.0 Flash** - Облачный, быстрый и точный

---

## 🆚 Сравнение провайдеров

### Whisper (локальный)

**Преимущества:**
- ✅ **Бесплатно** - никаких затрат
- ✅ **Без интернета** - работает офлайн
- ✅ **Приватность** - данные не уходят с сервера
- ✅ **Без API ключей** - не нужно настраивать

**Недостатки:**
- ❌ **Медленнее** - 10-15 секунд на транскрипцию
- ❌ **Ниже точность** - 85-90%
- ❌ **Загрузка модели** - первый запуск медленный (75 MB)
- ❌ **Требует ffmpeg** - нужен на сервере

### Gemini 2.0 Flash

**Преимущества:**
- ✅ **Быстро** - 2-3 секунды на транскрипцию
- ✅ **Высокая точность** - 95-98%
- ✅ **Без загрузки** - работает сразу
- ✅ **Не требует ffmpeg** - просто API вызов

**Недостатки:**
- ❌ **Платно** - ~$0.00001 за секунду аудио
- ❌ **Требует интернет** - не работает офлайн
- ❌ **API ключ** - нужен Gemini API key
- ❌ **Данные в облаке** - отправляется в Google

---

## 🚀 Быстрый старт

### 1. Открой админ-панель

Перейди на страницу настроек AI:
```
http://localhost:4000/admin/ai-settings
```

Прокрути вниз до секции **"Распознавание речи (STT)"**.

### 2. Выбери провайдер

Увидишь 2 карточки:
- **Whisper (локальный)** - активен по умолчанию
- **Gemini 2.0 Flash** - неактивен

### 3. Переключи провайдер

Нажми на кнопку **"Использовать"** на нужной карточке.

✅ Готово! Теперь голосовые сообщения распознаются через выбранный провайдер.

---

## 💻 Техническая документация

### Архитектура

```
User speaks into microphone
      ↓
MediaRecorder API (WebM format)
      ↓
POST /api/ai/transcribe
      ↓
Load active STT setting from DB
      ↓
┌────────────────┬────────────────┐
│ If Whisper     │ If Gemini      │
├────────────────┼────────────────┤
│ WebM → WAV     │ WebM → base64  │
│ via ffmpeg     │                │
│       ↓        │       ↓        │
│ WAV → PCM      │ Send to Gemini │
│ (Float32Array) │ API            │
│       ↓        │       ↓        │
│ transformers.js│ Get response   │
│ Whisper model  │                │
└────────────────┴────────────────┘
      ↓
Return transcribed text
```

### База данных

**Таблица: `stt_settings`**

```sql
CREATE TABLE stt_settings (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL, -- 'whisper' | 'gemini'
  is_active BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

**Дефолтные данные:**

```json
[
  {
    "name": "Whisper (локальный)",
    "provider": "whisper",
    "is_active": true,
    "settings": {
      "model": "Xenova/whisper-small",
      "language": "ru"
    }
  },
  {
    "name": "Gemini 2.0 Flash",
    "provider": "gemini",
    "is_active": false,
    "settings": {
      "model": "gemini-2.0-flash-exp",
      "mimeType": "audio/webm"
    }
  }
]
```

### API Endpoints

#### GET /api/admin/stt-settings

Получить все настройки STT.

**Response:**
```json
{
  "settings": [
    {
      "id": "uuid",
      "name": "Whisper (локальный)",
      "provider": "whisper",
      "is_active": true,
      "settings": {...}
    },
    ...
  ]
}
```

#### PATCH /api/admin/stt-settings

Активировать провайдер.

**Request:**
```json
{
  "id": "uuid"
}
```

**Response:**
```json
{
  "setting": {
    "id": "uuid",
    "name": "Gemini 2.0 Flash",
    "is_active": true,
    ...
  }
}
```

#### POST /api/ai/transcribe

Транскрибировать аудио.

**Request:**
```
multipart/form-data:
  audio: File (WebM)
```

**Response:**
```json
{
  "text": "Расскажи про KidsPoint",
  "language": "ru",
  "provider": "whisper", // or "gemini"
  "duration": 3.5 // только для whisper
}
```

### Код

**Whisper транскрипция:**

```typescript
async function transcribeWithWhisper(audioFile: File, settings: any) {
  // 1. Load transformers.js
  const { pipeline } = await import('@xenova/transformers')
  const transcriber = await pipeline(
    'automatic-speech-recognition',
    settings.model || 'Xenova/whisper-small'
  )

  // 2. Convert WebM → WAV via ffmpeg
  const wavBuffer = await convertToWav(audioFile)

  // 3. Decode WAV → Float32Array (PCM)
  const audioFloat32 = await decodeWav(wavBuffer)

  // 4. Transcribe
  const result = await transcriber(audioFloat32, {
    language: settings.language || 'ru',
    task: 'transcribe',
  })

  return { text: result.text.trim(), provider: 'whisper' }
}
```

**Gemini транскрипция:**

```typescript
async function transcribeWithGemini(audioFile: File, settings: any) {
  // 1. Read audio as base64
  const arrayBuffer = await audioFile.arrayBuffer()
  const base64Audio = Buffer.from(arrayBuffer).toString('base64')

  // 2. Call Gemini API
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ 
    model: settings.model || 'gemini-2.0-flash-exp'
  })

  const result = await model.generateContent([
    {
      inlineData: {
        data: base64Audio,
        mimeType: settings.mimeType || 'audio/webm'
      }
    },
    {
      text: 'Транскрибируй аудио на русском. Верни только текст.'
    }
  ])

  return { text: result.response.text().trim(), provider: 'gemini' }
}
```

---

## 🧪 Тестирование

### 1. Проверь текущий провайдер

```bash
curl http://localhost:4000/api/admin/stt-settings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Найди провайдер с `is_active: true`.

### 2. Переключи на Gemini

```bash
curl -X PATCH http://localhost:4000/api/admin/stt-settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"id": "GEMINI_UUID"}'
```

### 3. Протестируй транскрипцию

В AI-чате:
1. Нажми на кнопку микрофона
2. Скажи что-нибудь (например: "Привет, как дела?")
3. Проверь, что текст распознался корректно

**Ожидаемое время:**
- **Whisper**: 10-15 секунд
- **Gemini**: 2-3 секунды

---

## 📊 Метрики и мониторинг

### Логи

**Whisper:**
```
[Whisper STT] Starting transcription...
[Whisper STT] Loading transformers...
[Whisper STT] Model loaded successfully!
[Whisper STT] Converting to WAV via ffmpeg...
[Whisper STT] Transcription successful: "текст"
```

**Gemini:**
```
[Gemini STT] Starting transcription...
[Gemini STT] Transcription successful: "текст"
```

### Стоимость (Gemini)

**Расчет:**
```
Цена: ~$0.00001 за секунду аудио
Средняя длина сообщения: 5 секунд
Стоимость: $0.00005 за сообщение
100 сообщений = $0.005
1000 сообщений = $0.05
```

**Итого:** Очень дешево! 💰

---

## ❓ FAQ

### Q: Какой провайдер выбрать?

**A:**
- **Для разработки**: Whisper (бесплатно)
- **Для production**: Gemini (быстрее и точнее)

### Q: Можно ли использовать оба провайдера?

**A:** Нет, активным может быть только один. Но переключение занимает 1 клик.

### Q: Что если у меня нет Gemini API ключа?

**A:** Используй Whisper! Он бесплатный и не требует API ключей.

### Q: Как добавить новый провайдер?

**A:**
1. Добавь запись в `stt_settings`
2. Обнови `/api/ai/transcribe` с новой логикой
3. Готово!

### Q: Можно ли кастомизировать настройки?

**A:** Да! Обнови поле `settings` в таблице `stt_settings`. Например:

```sql
UPDATE stt_settings
SET settings = '{"model": "Xenova/whisper-base", "language": "en"}'::jsonb
WHERE provider = 'whisper';
```

---

## 🎉 Готово!

Теперь у тебя есть гибкая система распознавания речи с выбором провайдера!

**Преимущества:**
- ✅ Легко переключаться между провайдерами
- ✅ Не зависишь от одного решения
- ✅ Можешь оптимизировать затраты
- ✅ Админ-панель для управления

**Что дальше:**
- 🔜 Добавить больше провайдеров (OpenAI Whisper API, Azure, и т.д.)
- 🔜 Статистика использования по провайдерам
- 🔜 A/B тестирование точности
- 🔜 Автоматический fallback при ошибках

