# Инструкция по откату изменений

## Что было сделано

Объединение форм создания и редактирования профиля в единую систему `ProfileManageClient`.

### Изменённые файлы:
1. `app/(dashboard)/profiles/[slug]/edit/client.tsx` - адаптирован для режима создания
2. `app/(dashboard)/profiles/create/page.tsx` - теперь использует `ProfileManageClient`

### Backup файлы:
- `components/features/profile/create-profile-wizard.tsx.backup`
- `components/features/profile/wizard-progress.tsx.backup`
- `components/features/profile/draft-continue-dialog.tsx.backup`

## Как откатиться к старой версии

### Вариант 1: Откат через Git

```bash
# Откатиться на коммит перед объединением
git checkout HEAD~1

# Или вернуться на master/main
git checkout main
```

### Вариант 2: Восстановление wizard файлов

```bash
# Восстановить wizard
mv components/features/profile/create-profile-wizard.tsx.backup components/features/profile/create-profile-wizard.tsx
mv components/features/profile/wizard-progress.tsx.backup components/features/profile/wizard-progress.tsx
mv components/features/profile/draft-continue-dialog.tsx.backup components/features/profile/draft-continue-dialog.tsx

# Откатить изменения в других файлах
git checkout HEAD~1 app/(dashboard)/profiles/create/page.tsx
git checkout HEAD~1 app/(dashboard)/profiles/[slug]/edit/client.tsx
```

### Вариант 3: Удаление ветки

```bash
# Переключиться на основную ветку
git checkout main

# Удалить ветку с изменениями
git branch -D feature/unified-profile-form
```

## Что изменилось в новой версии

### Преимущества:
- ✅ Одна форма для создания и редактирования
- ✅ Нет рассинхронизации данных между wizard и edit
- ✅ Все поля доступны сразу
- ✅ Проще поддержка - один код вместо двух

### Возможные проблемы:
- ❌ Нет пошагового визарда (может быть сложнее для новых пользователей)
- ❌ Все поля показываются сразу (может быть перегружено)
- ❌ Потеря мобильной оптимизации wizard

## Текущая ветка

Изменения находятся в ветке: `feature/unified-profile-form`
Исходное состояние в ветке: `main` (или `master`)

## Рекомендации

После тестирования нужно принять решение:
1. **Оставить новую версию** → `git checkout main && git merge feature/unified-profile-form`
2. **Откатиться** → использовать один из вариантов выше
3. **Доработать** → продолжить работу в ветке `feature/unified-profile-form`

