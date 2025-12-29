'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Users, Sparkles, Briefcase, Search, Palette, Camera, Info } from 'lucide-react'

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 py-12">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            📚 Справка и вопросы
          </h1>
          <p className="text-lg text-gray-600">
            Все, что нужно знать о категориях и типах профилей
          </p>
        </div>

        {/* Категории профилей */}
        <section id="categories" className="mb-12 scroll-mt-24">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            🎯 Категории профилей
          </h2>
          
          <div className="space-y-6">
            {/* Площадка */}
            <Card className="border-2 border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  Площадка
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">
                  <strong>Что это:</strong> Физическое место для проведения детских праздников.
                </p>
                <p className="text-gray-700">
                  <strong>Примеры:</strong> Кафе, лофт, детский центр, батутный центр, студия праздников.
                </p>
                <p className="text-gray-700">
                  <strong>Как работает:</strong> Может сдаваться в аренду, проводить свои программы, или оба варианта.
                </p>
                <Alert className="bg-white/50 border-blue-300">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm">
                    Родители ищут по типу площадки (батутный центр, кафе) и формату работы (аренда, свои программы).
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Аниматор */}
            <Card className="border-2 border-purple-200 bg-purple-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Users className="w-6 h-6 text-purple-600" />
                  Аниматор
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">
                  <strong>Что это:</strong> Профессиональный артист в образе персонажа.
                </p>
                <p className="text-gray-700">
                  <strong>Примеры:</strong> Человек-паук, принцесса Эльза, Гарри Поттер, пираты.
                </p>
                <p className="text-gray-700">
                  <strong>Как работает:</strong> Выезжает на мероприятия, проводит игры и развлечения.
                </p>
              </CardContent>
            </Card>

            {/* Шоу-программа */}
            <Card className="border-2 border-pink-200 bg-pink-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Sparkles className="w-6 h-6 text-pink-600" />
                  Шоу-программа
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">
                  <strong>Что это:</strong> Интерактивное представление с эффектами.
                </p>
                <p className="text-gray-700">
                  <strong>Примеры:</strong> Научное шоу, бумажное шоу, химическое шоу, фокусник.
                </p>
                <p className="text-gray-700">
                  <strong>Как работает:</strong> Готовая программа с реквизитом и спецэффектами.
                </p>
              </CardContent>
            </Card>

            {/* Агентство */}
            <Card className="border-2 border-orange-200 bg-orange-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Briefcase className="w-6 h-6 text-orange-600" />
                  Агентство
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">
                  <strong>Что это:</strong> Организация праздников "под ключ".
                </p>
                <p className="text-gray-700">
                  <strong>Что делает:</strong> Подбирает площадку, артистов, декор, кейтеринг, фотографа.
                </p>
                <p className="text-gray-700">
                  <strong>Для кого:</strong> Родители, которые хотят полностью делегировать организацию.
                </p>
              </CardContent>
            </Card>

            {/* Квест */}
            <Card className="border-2 border-emerald-200 bg-emerald-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Search className="w-6 h-6 text-emerald-600" />
                  Квест
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">
                  <strong>Что это:</strong> Игра с головоломками и загадками.
                </p>
                <p className="text-gray-700">
                  <strong>Примеры:</strong> Квест-комната, эскейп-рум, детективное расследование.
                </p>
                <p className="text-gray-700">
                  <strong>Как работает:</strong> Команда решает задачи, чтобы выбраться из комнаты или найти сокровище.
                </p>
              </CardContent>
            </Card>

            {/* Мастер-класс */}
            <Card className="border-2 border-amber-200 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Palette className="w-6 h-6 text-amber-600" />
                  Мастер-класс
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">
                  <strong>Что это:</strong> Обучающее творческое занятие.
                </p>
                <p className="text-gray-700">
                  <strong>Примеры:</strong> Роспись пряников, лепка из глины, рисование, изготовление слаймов.
                </p>
                <p className="text-gray-700">
                  <strong>Как работает:</strong> Мастер показывает технику, дети создают поделку под руководством.
                </p>
              </CardContent>
            </Card>

            {/* Фотограф */}
            <Card className="border-2 border-rose-200 bg-rose-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Camera className="w-6 h-6 text-rose-600" />
                  Фотограф
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700">
                  <strong>Что это:</strong> Профессиональная фото и видео съемка праздника.
                </p>
                <p className="text-gray-700">
                  <strong>Что делает:</strong> Снимает процесс, постановочные кадры, обрабатывает фото/видео.
                </p>
                <p className="text-gray-700">
                  <strong>Результат:</strong> Альбом, слайдшоу, видеоролик с праздника.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Типы площадок */}
        <section id="venue-types" className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            🏢 Типы площадок
          </h2>
          
          <Alert className="mb-6 border-2 border-blue-300 bg-blue-50">
            <Info className="h-5 w-5 text-blue-600" />
            <AlertDescription>
              <strong>Важно:</strong> Тип площадки влияет на поисковую выдачу. Выбирайте тот, который максимально точно описывает ваш бизнес.
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Площадки под аренду */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📍 Площадки под аренду</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <strong className="text-blue-600">Кафе / Ресторан</strong>
                  <p className="text-sm text-gray-600">Аренда зала для банкета</p>
                </div>
                <div>
                  <strong className="text-blue-600">Лофт</strong>
                  <p className="text-sm text-gray-600">Стильное пространство</p>
                </div>
                <div>
                  <strong className="text-blue-600">Банкетный зал</strong>
                  <p className="text-sm text-gray-600">Специализированный зал</p>
                </div>
              </CardContent>
            </Card>

            {/* Студии и центры */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">✨ Студии и центры</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <strong className="text-purple-600">Event-студия</strong>
                  <p className="text-sm text-gray-600">Готовые программы или аренда</p>
                </div>
                <div>
                  <strong className="text-purple-600">Детский развлекательный центр</strong>
                  <p className="text-sm text-gray-600">Билеты, игровые зоны</p>
                </div>
              </CardContent>
            </Card>

            {/* Активные развлечения */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🏃 Активные развлечения</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Батутный центр</p>
                <p>• Картинг-центр</p>
                <p>• Лазертаг / Пейнтбол</p>
                <p>• Скалодром / Веревочный парк</p>
                <p>• Боулинг / Бильярд</p>
                <p>• Аквапарк / Бассейн</p>
              </CardContent>
            </Card>

            {/* Творческие мастерские */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🎨 Творческие мастерские</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Художественная студия</p>
                <p>• Гончарная мастерская</p>
                <p>• Кулинарная студия</p>
                <p>• Столярная мастерская</p>
                <p>• Швейная мастерская</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Форматы работы */}
        <section id="work-formats" className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            🎭 Форматы работы площадок
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🏢</span>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Сдаем в аренду</h3>
                    <p className="text-gray-600 text-sm">
                      Вы арендуете зал, приглашаете своих артистов и организуете праздник самостоятельно.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Примеры: Лофт, кафе, банкетный зал
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🎭</span>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Свои программы</h3>
                    <p className="text-gray-600 text-sm">
                      Готовые программы с аниматорами. Вы приходите, мы организуем все сами.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Примеры: Kids Point, студии праздников
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🎁</span>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Праздник под ключ</h3>
                    <p className="text-gray-600 text-sm">
                      Полная организация: площадка, артисты, декор, кейтеринг, фото.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Примеры: Event-агентства, студии
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🎫</span>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Билеты</h3>
                    <p className="text-gray-600 text-sm">
                      Свободное посещение по билетам. Можно забронировать зал для праздника.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Примеры: Joki Joya, КидБург, батутные центры
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Часто задаваемые вопросы */}
        <section id="faq" className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            ❓ Часто задаваемые вопросы
          </h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Как выбрать правильную категорию?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Выбирайте основную деятельность. Если у вас площадка - выбирайте "Площадка" и укажите тип. 
                  Если вы аниматор, который также проводит шоу - основная категория "Аниматор", дополнительная "Шоу-программа".
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Чем отличается Event-студия от Детского центра?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  <strong>Event-студия:</strong> Небольшое пространство (до 200м²), готовые программы, возможна аренда.<br/>
                  <strong>Детский центр:</strong> Большой (200м²+), продажа билетов, игровые зоны, лабиринты, город профессий.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Можно ли выбрать несколько форматов работы?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Да! Например, ваша студия может одновременно сдаваться в аренду и проводить свои программы. 
                  Отметьте все подходящие варианты при заполнении профиля.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Влияет ли выбор категории на поиск?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Да, очень сильно! Родители ищут по конкретным категориям. Неправильный выбор = вас не найдут. 
                  Если сомневаетесь, посмотрите примеры в этой справке или напишите в поддержку.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Контакты поддержки */}
        <Alert className="border-2 border-orange-300 bg-orange-50">
          <Info className="h-5 w-5 text-orange-600" />
          <AlertDescription>
            <strong>Нужна помощь?</strong> Напишите нам в поддержку, мы поможем правильно настроить ваш профиль!
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}















