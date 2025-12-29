# ⚠️ Supabase НЕ используется в проекте

## Статус

Проект **полностью мигрирован** с Supabase на Prisma + PostgreSQL.

## Что удалено

- ✅ `@supabase/supabase-js` - удалён из package.json
- ✅ `@supabase/ssr` - удалён из package.json
- ✅ `lib/supabase/client.ts` - удалён
- ✅ `lib/supabase/server.ts` - удалён
- ✅ `app/auth/callback/route.ts` - удалён (Supabase auth callback)
- ✅ `lib/contexts/auth-context-new.tsx` - удалён (использовал Supabase)
- ✅ `supabase/templates/recovery.html` - удалён (для Supabase Auth)

## Что используется

### База данных
- **Prisma** - ORM для работы с PostgreSQL
- **PostgreSQL** - основная база данных (Yandex Cloud Managed PostgreSQL)

### Аутентификация
- **JWT токены** (`lib/auth/jwt.ts`)
- **bcrypt** для хеширования паролей
- **Cookies** для хранения сессий
- **Yandex OAuth** для входа через Яндекс ID

### Восстановление пароля
- Токены хранятся в таблице `password_reset_tokens`
- В DEV режиме ссылки логируются в консоль
- В PROD нужно настроить email сервис (Resend, SendGrid, SMTP)

## Почему не Supabase

1. **Не нужен** - у нас есть своя база PostgreSQL
2. **Лишняя зависимость** - дополнительный сервис
3. **Сложность** - ненужные абстракции
4. **Контроль** - полный контроль над данными

## Если видите упоминания Supabase

Это могут быть:
- Старые backup файлы (`.final-backup`, `.supabase-backup`)
- Документация миграции (`MIGRATION_*.md`)
- Скрипты миграции (`scripts/export-from-old-supabase.mjs`)

**Не используйте их!** Они оставлены только для истории.

## Что делать при ошибках

Если видите ошибки типа:
```
Cannot find module '@supabase/supabase-js'
Cannot find module '@/lib/supabase/client'
```

Значит где-то остался старый импорт. Нужно:
1. Найти файл с импортом
2. Заменить на Prisma
3. Удалить импорт Supabase

## Контакты для вопросов

Если есть вопросы по миграции или работе без Supabase - обращайтесь к разработчикам проекта.



