# Модальный Wizard Классификации Профиля

## Описание

Компактный модальный wizard для выбора категории профиля и его характеристик. Оптимизирован для мобильных устройств.

## Использование

```tsx
import { ModalClassificationWizard } from './wizard/modal-classification-wizard'

function MyComponent() {
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setIsWizardOpen(true)}>
        Выбрать категорию
      </Button>
      
      <ModalClassificationWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        initialData={{
          category: 'animator',
          primary_services: ['Аниматор Человек-Паук'],
          additional_services: ['Аквагрим']
        }}
        onComplete={(data) => {
          console.log('Выбрано:', data)
          // Сохранить данные
        }}
      />
    </>
  )
}
```

## Props

- `open: boolean` - состояние открытия модального окна
- `onOpenChange: (open: boolean) => void` - callback для изменения состояния
- `initialData?: Partial<ClassificationData>` - начальные данные
- `onComplete: (data: ClassificationData) => Promise<void>` - callback при завершении

## Структура данных

```typescript
interface ClassificationData {
  category?: string // 'animator' | 'venue' | 'show' | ...
  primary_venue_type?: string // Только для venue
  primary_services: string[] // Основные услуги
  additional_services: string[] // Дополнительные услуги
}
```

## Особенности

- ✅ Компактный дизайн для мобильных
- ✅ Автопереход на следующий шаг после выбора категории
- ✅ Адаптивное количество шагов (3-4 в зависимости от категории)
- ✅ Валидация на каждом шаге
- ✅ Индикатор загрузки при сохранении

## Отличия от Inline версии

| Inline Wizard | Modal Wizard |
|--------------|--------------|
| Встроен в форму | Отдельное модальное окно |
| Занимает много места | Компактный |
| Автосохранение | Сохранение по кнопке "Готово" |
| Сложнее на мобильных | Оптимизирован для мобильных |

