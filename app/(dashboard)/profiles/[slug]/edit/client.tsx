'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CreateProfileForm } from '@/components/features/profile/create-profile-form'
import { ServicesManager } from '@/components/features/services/services-manager'
import { PortfolioSettings } from '@/components/features/profile/portfolio-settings'
import { CharactersManager } from '@/components/features/animator/characters-manager'
import { LegalDocumentsManager } from '@/components/features/profile/legal-documents-manager'
import { FAQManager } from '@/components/features/profile/faq-manager'
import { LocationsManager } from '@/components/features/profile/locations-manager'
import { ReviewsSettingsManager } from '@/components/features/profile/reviews-settings-manager'
import { ProfileReadinessWidget, getIncompleteSections } from '@/components/features/profile/profile-readiness-widget'
import { ProfileTypeCard } from '@/components/features/profile/profile-type-card'
import { GeographyManager } from '@/components/features/geography/geography-manager'
import { ShowProgramsManager } from '@/components/features/show/show-programs-manager'
import { QuestProgramsManager } from '@/components/features/quest/quest-programs-manager'
import { MasterClassProgramsManager } from '@/components/features/master-class/master-class-programs-manager'
import { PhotographyStylesManager } from '@/components/features/photographer/photography-styles-manager'
import { AgencyPartnersManager } from '@/components/features/agency/agency-partners-manager'
import { ActivitiesManager } from '@/components/features/profile/activities-manager'
import { PricingManager } from '@/components/features/profile/pricing-manager'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { getMenuItemsByCategory, type TabValue as OldTabValue } from '@/lib/utils/profile-menu'
import { generateProfileMenu, type TabValue, type ProfileClassification } from '@/lib/utils/dynamic-profile-menu'
import { checkProfileReadiness } from '@/lib/utils/verification'

interface ProfileManageClientProps {
  profile: any // Профиль всегда есть
}

export function ProfileManageClient({ profile }: ProfileManageClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabValue>('info')
  const [services, setServices] = useState<any[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [profileDraft, setProfileDraft] = useState<any>(profile)
  
  // Локальное состояние для классификации (обновляется при выборе в форме)
  const [currentClassification, setCurrentClassification] = useState<ProfileClassification>({
    category: profile.category,
    primary_venue_type: profile.primary_venue_type,
    activities: profile.activities || [],
    business_models: profile.business_models || [],
    additional_services: profile.additional_services || [],
    space_type: profile.space_type,
  })
  
  // Динамическое меню на основе классификации
  const menuItems = useMemo(() => 
    generateProfileMenu(currentClassification), 
    [currentClassification]
  )
  
  // Для обратной совместимости
  const currentCategory = currentClassification.category || 'venue'
  
  // console.log('🔥 ProfileManageClient render:', { profileCategory: profile.category, currentCategory })
  
  // Синхронизация классификации с профилем из БД
  // ВАЖНО: Используем ref для отслеживания первой загрузки, чтобы не перезаписывать изменения пользователя
  const isInitialMount = useRef(true)
  
  useEffect(() => {
    // Обновляем классификацию только при первой загрузке или при изменении профиля извне (например, после сохранения)
    if (isInitialMount.current) {
      setCurrentClassification({
        category: profile.category as any,
        primary_venue_type: profile.primary_venue_type,
        primary_services: (profile.primary_services || profile.activities || []) as any,
        activities: profile.activities || [],
        business_models: profile.business_models || [],
        additional_services: (profile.additional_services || []) as any,
        space_type: profile.space_type,
      })
      isInitialMount.current = false
    }
  }, [profile.id]) // Зависим только от ID профиля - обновляем только при смене профиля
  
  // Callback для обновления классификации
  const handleClassificationChange = useCallback((updates: Partial<ProfileClassification>) => {
    setCurrentClassification(prev => ({
      ...prev,
      ...updates
    }))
  }, [])
  
  // Для обратной совместимости со старой системой
  const handleCategoryChange = useCallback((newCategory: string) => {
    handleClassificationChange({ category: newCategory as any })
  }, [handleClassificationChange])

  // Вычисляем незаполненные разделы для индикаторов
  const readiness = useMemo(() => checkProfileReadiness(profileDraft, services), [profileDraft, services])
  // Проценты/шкала готовности в mobile UI временно убраны по просьбе
  // const readinessPercentage = useMemo(() => {
  //   const filled = Object.values(readiness.checklist).filter(Boolean).length
  //   return Math.round((filled / 6) * 100)
  // }, [readiness])
  const incompleteSections = useMemo(() => getIncompleteSections(profileDraft, services), [profileDraft, services])
  
  // Метки категорий
  const CATEGORY_LABELS: Record<string, string> = {
    venue: 'Площадка',
    animator: 'Аниматор',
    show: 'Шоу-программа',
    agency: 'Агентство',
    quest: 'Выездной квест',
    master_class: 'Выездной мастер-класс',
    photographer: 'Фотограф',
  }
  
  const categoryLabel = CATEGORY_LABELS[currentCategory] || 'Профиль'
  const PRIMARY_VENUE_TYPE_LABELS: Record<string, string> = {
    active_entertainment: 'Активные развлечения',
    quest_escape: 'Квесты',
    creative_studio: 'Творческие студии',
    event_space: 'Площадка для мероприятий',
    vr_digital: 'VR и цифровые',
    animal_interaction: 'С животными',
    outdoor_recreation: 'Загородный отдых',
  }

  const subtypeLabel =
    currentCategory === 'venue'
      ? (profileDraft.primary_venue_type
          ? PRIMARY_VENUE_TYPE_LABELS[String(profileDraft.primary_venue_type)] || String(profileDraft.primary_venue_type)
          : (profileDraft.details?.venue_type ? profileDraft.details.venue_type.replace(/_/g, ' ') : undefined))
      : undefined

  // Синхронизируем черновик, если профиль обновился извне (например, после сохранения/refresh)
  useEffect(() => {
    setProfileDraft(profile)
  }, [profile])

  // Стабильный обработчик черновика (важно: иначе form.watch будет пересоздаваться и зациклится)
  const handleDraftChange = useCallback((draft: Partial<any>) => {
    setProfileDraft((prev: any) => {
      if (!draft) return prev
      // Не обновляем state, если реально ничего не поменялось (защита от лишних ререндеров)
      for (const [k, v] of Object.entries(draft)) {
        if ((prev as any)[k] !== v) {
          return { ...prev, ...draft }
        }
      }
      return prev
    })
  }, [])

  // Загрузка услуг для проверки готовности
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`/api/services?profileId=${profile.id}`)
        if (res.ok) {
          const data = await res.json()
          setServices(data.services || [])
        }
      } catch (error) {
      // В dev Next.js показывает оверлей на console.error — не используем его тут
      console.log('Error fetching services:', error)
      }
    }
    fetchServices()
  }, [profile.id, refreshTrigger])

  // Подменю для раздела "Основная информация" (упрощенное - без адресов)
  const infoSubmenu = [
    { id: 'section-category', label: 'Определите ваш профиль' },
    { id: 'section-info', label: 'Основная информация' },
    { id: 'section-logo', label: 'Логотип' },
    { id: 'section-cover', label: 'Обложка' },
    { id: 'section-contacts', label: 'Контакты' },
  ]

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = 100
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - offset
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const [mobileOpenSections, setMobileOpenSections] = useState<string[]>([])
  const [mobileShowOnlyIncomplete, setMobileShowOnlyIncomplete] = useState(false)

  const mobileSections = useMemo(
    () => menuItems.filter((i) => i.id !== 'info'),
    [menuItems]
  )
  const mobileIncompleteCount = useMemo(
    () => mobileSections.filter((i) => incompleteSections.includes(i.id as string)).length,
    [mobileSections, incompleteSections]
  )

  useEffect(() => {
    // Авто-открываем первый незаполненный раздел (только если пользователь еще ничего не открывал)
    if (mobileOpenSections.length > 0) return
    const firstIncomplete = mobileSections.find((i) => incompleteSections.includes(i.id as string))
    if (!firstIncomplete) return
    setMobileOpenSections([firstIncomplete.id])
    setActiveTab(firstIncomplete.id as TabValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobileSections.map(s => s.id).join('|'), incompleteSections.join('|')])

  const MOBILE_SECTION_HINTS: Partial<Record<TabValue, string>> = {
    locations: 'Адрес, как вас найти',
    geography: 'Районы и города, куда вы выезжаете',
    characters: 'Персонажи и программы аниматора',
    show_programs: 'Какие шоу вы проводите',
    quest_programs: 'Какие квесты есть',
    master_classes: 'Список мастер-классов',
    photography_styles: 'Ваши стили съёмки',
    agency_partners: 'Партнеры и подрядчики',
    services: 'Прайс, программы, пакеты',
    photos: 'Галерея и видео',
    faq: 'Ответы на частые вопросы',
    reviews: 'Источник и отображение отзывов',
    legal: 'Документы и реквизиты',
  }

  const MOBILE_SECTION_WHAT_TO_DO: Partial<Record<TabValue, string>> = {
    locations: 'Добавьте адрес(а), чтобы клиент понимал где вы находитесь.',
    geography: 'Отметьте города/районы, куда вы выезжаете.',
    characters: 'Создайте персонажей и программы — это ключевой блок для аниматора.',
    show_programs: 'Добавьте ваши шоу-программы, чтобы клиент видел варианты.',
    quest_programs: 'Добавьте ваши квесты: названия и описания.',
    master_classes: 'Добавьте мастер‑классы: что проводите и на каких условиях.',
    photography_styles: 'Выберите стили — так вас проще найти по фильтрам.',
    agency_partners: 'Заполните партнеров/подрядчиков (по желанию).',
    services: 'Добавьте услуги и цены — без этого клиенту сложно выбрать.',
    photos: 'Загрузите фото/видео — это повышает доверие.',
    faq: 'Добавьте ответы на частые вопросы — меньше уточнений от клиентов.',
    reviews: 'Настройте источник отзывов и отображение на странице.',
    legal: 'Заполните документы/реквизиты (для доверия и выплат).',
  }

  const scrollToMobileSection = (tabId: string) => {
    const el = document.getElementById(`mobile-section-${tabId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const scrollToInfoSection = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // легкий оффсет, чтобы заголовок секции не прилипал к самому верху
    setTimeout(() => window.scrollBy({ top: -12, left: 0, behavior: 'smooth' }), 50)
  }

  const openClassificationWizard = () => {
    // Сначала попробуем открыть модалку напрямую (если кнопка отрендерена)
    const btn = document.getElementById('open-classification-wizard') as HTMLButtonElement | null
    if (btn) {
      btn.click()
      return
    }
    // fallback: проскроллим к секции
    scrollToInfoSection('section-category')
  }

  const openAndScrollMobileSection = (tabId: string) => {
    setActiveTab(tabId)
    if (tabId !== 'info') {
      setMobileOpenSections((prev) => (prev.includes(tabId) ? prev : [...prev, tabId]))
      // Даем аккордеону раскрыться и только потом скроллим
      setTimeout(() => scrollToMobileSection(tabId), 50)
      return
    }
    scrollToMobileSection(tabId)
  }

  const renderTabContent = (tabId: TabValue, isMobile = false) => {
    switch (tabId) {
      case 'info':
        return (
          <CreateProfileForm 
            profileId={profile.id} 
            initialData={profile}
            onCategoryChange={handleCategoryChange}
            onClassificationChange={handleClassificationChange}
            onDraftChange={handleDraftChange}
            isMobile={isMobile}
          />
        )
      case 'activities':
        return (
          <ActivitiesManager
            profileId={profile.id}
            category={currentCategory}
            onUpdate={() => setRefreshTrigger(prev => prev + 1)}
          />
        )
      case 'pricing':
        return (
          <PricingManager
            profileId={profile.id}
            onUpdate={() => setRefreshTrigger(prev => prev + 1)}
          />
        )
      case 'additional_services':
        return (
          <Card className="rounded-[24px] border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] bg-white">
            <CardHeader>
              <CardTitle>Дополнительные услуги</CardTitle>
              <CardDescription>
                Украшение, аквагрим, фото/видео и другие доп. услуги
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Редактируйте в "Основная информация" → "Классификация" → Шаг 3
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )
      case 'catering':
        return (
          <Card className="rounded-[24px] border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] bg-white">
            <CardHeader>
              <CardTitle>Меню кейтеринга</CardTitle>
              <CardDescription>
                Управление меню и ценами на питание
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Редактируйте в "Основная информация" → "Классификация" → Шаг 3
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )
      case 'services':
        return (
          <ServicesManager 
            profileId={profile.id} 
            profileCategory={profile.category}
            onUpdate={() => setRefreshTrigger(prev => prev + 1)}
            hideHeader={isMobile}
          />
        )
      case 'characters':
        return <CharactersManager profileId={profile.id} hideHeader={isMobile} />
      case 'show_programs':
        return <ShowProgramsManager profileId={profile.id} />
      case 'quest_programs':
        return <QuestProgramsManager profileId={profile.id} />
      case 'master_classes':
        return <MasterClassProgramsManager profileId={profile.id} />
      case 'geography':
        return (
          <GeographyManager 
            profileId={profile.id}
            categoryType={currentCategory as any}
            hideHeader={isMobile}
          />
        )
      case 'locations':
        return (
          <LocationsManager
            profileId={profile.id}
            profileCategory={currentCategory}
            onUpdate={() => setRefreshTrigger(prev => prev + 1)}
          />
        )
      case 'photography_styles':
        return <PhotographyStylesManager profileId={profile.id} />
      case 'agency_partners':
        return <AgencyPartnersManager profileId={profile.id} />
      case 'photos':
        return (
          <PortfolioSettings 
            profileId={profile.id} 
            initialPhotos={profile.photos || []} 
            initialVideos={profile.videos || []}
            hideHeader={isMobile}
          />
        )
      case 'legal':
        return (
          <LegalDocumentsManager 
            profileId={profile.id}
            profileSlug={profile.slug}
            profileType={profile.category}
            legalForm={profile.legal_form || 'private'}
            initialData={profile}
          />
        )
      case 'faq':
        return (
          <FAQManager 
            profileId={profile.id}
            initialData={profile.faq || []}
            hideHeader={isMobile}
          />
        )
      case 'reviews':
        return (
          <ReviewsSettingsManager 
            profileId={profile.id}
            initialSource={(profile.details as any)?.reviews_source || 'internal'}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-full bg-[#F7F8FA]">
      {/* Mobile Nav: горизонтальное меню капсулами */}
      <div className="lg:hidden flex overflow-x-auto pb-2 gap-1.5 scrollbar-hide mb-3 -mx-1 px-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => openAndScrollMobileSection(item.id as TabValue)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all",
              activeTab === item.id
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-orange-200"
            )}
            aria-current={activeTab === item.id ? 'page' : undefined}
          >
            <item.icon className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-[180px] truncate">{item.label}</span>
            {incompleteSections.includes(item.id as string) && activeTab !== item.id && (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-[2000px] mx-auto w-full px-1 py-2 sm:px-6 sm:py-6">
        {/* Основная сетка: Меню + Контент + Виджет (центр максимально широкий) */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-2 sm:gap-8 items-start">
          
          {/* Left Sidebar (Navigation) - STICKY */}
          <aside className="hidden lg:block sticky top-[calc(72px+1.5rem)] h-[calc(100vh-72px-3rem)] self-start">
            {/* Кнопка назад */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors mb-3"
            >
              <ChevronLeft className="h-4 w-4" />
              Назад
            </button>
            
            <ScrollArea className="h-[calc(100%-60px)]">
              <div className="pr-4">
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <div key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id as TabValue)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-[18px] text-[13px] font-medium transition-all relative",
                        activeTab === item.id 
                          ? "bg-orange-50 text-orange-700" 
                          : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
                      )}
                    >
                      <item.icon className={cn(
                        "h-4 w-4 shrink-0",
                        activeTab === item.id ? "text-orange-600" : "text-gray-400"
                      )} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {/* Индикатор незаполненного раздела */}
                      {incompleteSections.includes(item.id as string) && (
                        <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" title="Есть незаполненные поля" />
                      )}
                    </button>
                  
                    {/* Submenu for 'info' tab */}
                    {item.id === 'info' && activeTab === 'info' && (
                      <div className="mt-1.5 mb-1.5 space-y-0.5 pl-3">
                        {infoSubmenu.map((subItem) => (
                          <button
                            key={subItem.id}
                            onClick={() => scrollToSection(subItem.id)}
                            className="w-full text-left px-3 py-2 text-[13px] text-slate-600 hover:text-orange-700 hover:bg-orange-50 rounded-[18px] transition-colors font-medium"
                          >
                            {subItem.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
              </div>
            </ScrollArea>
          </aside>

          {/* Main Content Area */}
          <main className="min-w-0">
            {/* Mobile: всё на одном экране (info всегда, остальные разделы раскрываются) */}
            <div className="lg:hidden space-y-4 pb-24">
              {/* Верхний блок: что делать дальше */}
              <Card className="rounded-[24px] border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] bg-white overflow-hidden">
                <CardHeader className="px-3 py-3 border-b border-slate-200">
                  <CardTitle className="text-[15px] font-bold text-slate-900 leading-tight text-left">
                    Настройка профиля
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500 leading-tight mt-1 text-left">
                    Идите по шагам ниже — так быстрее всего заполнить профиль.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 space-y-2.5">
                  {(() => {
                    const hasCategory = Boolean(profileDraft?.category)
                    const hasServices = Boolean(readiness?.checklist?.hasServices)
                    const hasContacts = Boolean(readiness?.checklist?.hasContacts)
                    const hasPhotos = Boolean(readiness?.checklist?.hasPhotos)
                    const hasAddress = Boolean(readiness?.checklist?.hasAddress)

                    const locationTab: TabValue | null = (menuItems.some(m => m.id === 'locations') ? 'locations' :
                      menuItems.some(m => m.id === 'geography') ? 'geography' : null)

                    const steps: Array<{
                      key: string
                      title: string
                      done: boolean
                      actionLabel: string
                      onAction: () => void
                    }> = [
                      {
                        key: 'classification',
                        title: '1) Выберите категорию и услуги',
                        done: hasCategory && hasServices,
                        actionLabel: 'Открыть',
                        onAction: openClassificationWizard,
                      },
                      {
                        key: 'contacts',
                        title: '2) Заполните контакты',
                        done: hasContacts,
                        actionLabel: 'Перейти',
                        onAction: () => scrollToInfoSection('section-contacts'),
                      },
                      {
                        key: 'media',
                        title: '3) Добавьте фото',
                        done: hasPhotos,
                        actionLabel: 'Открыть',
                        onAction: () => openAndScrollMobileSection('photos'),
                      },
                      ...(locationTab
                        ? [{
                            key: 'address',
                            title: '4) Укажите адрес/географию',
                            done: hasAddress,
                            actionLabel: 'Открыть',
                            onAction: () => openAndScrollMobileSection(locationTab),
                          }]
                        : []),
                    ]

                    return (
                      <div className="space-y-2.5">
                        {steps.map((s) => (
                          <div key={s.key} className="grid grid-cols-[20px_1fr_auto] items-start gap-2.5">
                            {/* Колонка 1: Иконка статуса (фиксированная ширина 20px) */}
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5",
                              s.done 
                                ? "bg-green-50 text-green-700 border border-green-200" 
                                : "bg-orange-50 text-orange-700 border border-orange-200"
                            )}>
                              {s.done ? '✓' : '·'}
                            </div>
                            
                            {/* Колонка 2: Текст шага (растягивается) */}
                            <div className="min-w-0 text-[13px] font-medium text-slate-900 leading-tight pt-0.5 text-left">
                              {s.title}
                            </div>
                            
                            {/* Колонка 3: Кнопка действия (авто-ширина) */}
                            <button
                              type="button"
                              onClick={s.onAction}
                              className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 transition-colors whitespace-nowrap pt-0.5"
                            >
                              {s.actionLabel}
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              <div id="mobile-section-info" className="scroll-mt-24">
                {renderTabContent('info', true)}
              </div>

              <Card className="rounded-[24px] border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.06)] bg-white overflow-hidden">
                <CardHeader className="px-3 py-3 border-b border-slate-200">
                  <CardTitle className="text-[15px] font-bold text-slate-900 leading-tight text-left">
                    Дополнительные настройки
                  </CardTitle>
                  <CardDescription className="text-[11px] text-slate-500 leading-tight mt-1 text-left">
                    {mobileIncompleteCount > 0
                      ? `Нужно заполнить: ${mobileIncompleteCount} • Остальное по желанию`
                      : 'Все основные разделы заполнены — остальное по желанию'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="px-3 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setMobileShowOnlyIncomplete((v) => !v)}
                      className={cn(
                        "h-8 px-3.5 rounded-full text-[11px] font-semibold transition-all border",
                        mobileShowOnlyIncomplete
                          ? "bg-orange-50 text-orange-700 border-orange-200"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {mobileShowOnlyIncomplete ? 'Показывать все' : 'Только незаполненные'}
                    </button>
                  </div>
                  <Accordion
                    type="multiple"
                    value={mobileOpenSections}
                    onValueChange={(v) => {
                      setMobileOpenSections(v)
                      const last = v[v.length - 1]
                      if (last) setActiveTab(last as TabValue)
                    }}
                    className="divide-y divide-slate-200"
                  >
                    {mobileSections
                      .filter((i) => !mobileShowOnlyIncomplete || incompleteSections.includes(i.id as string))
                      .map((item) => (
                        <AccordionItem
                          key={item.id}
                          value={item.id}
                          id={`mobile-section-${item.id}`}
                          className="border-0 scroll-mt-24"
                        >
                          <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-slate-50/50 transition-colors [&>svg]:ml-2 [&>svg]:mt-0.5">
                            <div className="flex-1 min-w-0 grid grid-cols-[16px_1fr_8px] items-start gap-2.5">
                              {/* Колонка 1: Иконка (фиксированная ширина 16px) */}
                              <item.icon className="h-4 w-4 text-slate-500 mt-0.5" />
                              
                              {/* Колонка 2: Текст (растягивается) */}
                              <div className="min-w-0 flex items-center">
                                <div className="text-[15px] font-semibold text-slate-900 leading-tight text-left">
                                  {item.label}
                                </div>
                              </div>
                              
                              {/* Колонка 3: Точка-индикатор (фиксированная ширина 8px) */}
                              {incompleteSections.includes(item.id as string) ? (
                                <span
                                  className="w-2 h-2 rounded-full bg-orange-500 mt-1"
                                  aria-label="Нужно заполнить"
                                />
                              ) : (
                                <span className="w-2 h-2 mt-1" aria-hidden="true" />
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-0 pb-0 pt-0">
                            {/* Контент раздела */}
                            {renderTabContent(item.id as TabValue, true)}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Фиксированная кнопка "Сохранить" внизу */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-2 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
                <div className="max-w-[2000px] mx-auto w-full px-1">
                  <Button
                    type="button"
                    onClick={() => document.getElementById('profile-main-form')?.requestSubmit()}
                    className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-[15px] font-semibold transition-colors"
                  >
                    Сохранить
                  </Button>
                </div>
              </div>
            </div>

            {/* Desktop: как было — вкладки */}
            <div className="hidden lg:block">
              {renderTabContent(activeTab)}
            </div>
          </main>

          {/* Right Sidebar (Profile Readiness Widget) - STICKY */}
          <aside className="hidden lg:block sticky top-[calc(72px+1.5rem)] space-y-4 self-start">
            {/* Карточка типа профиля */}
            <ProfileTypeCard
              category={currentCategory}
              categoryLabel={categoryLabel}
              subtypeLabel={subtypeLabel}
            />

            <ProfileReadinessWidget 
              profile={profileDraft} 
              services={services}
              onPublishChange={() => setRefreshTrigger(prev => prev + 1)}
            />
            
            {/* Кнопка сохранения - только для вкладки "info" */}
            {activeTab === 'info' && (
              <button
                onClick={() => {
                  // Находим форму и отправляем её
                  console.log('🔘 [SaveButton] Clicked!')
                  const form = document.querySelector('form')
                  console.log('🔍 [SaveButton] Form found:', !!form)
                  if (form) {
                    console.log('📤 [SaveButton] Submitting form...')
                    form.requestSubmit()
                  } else {
                    // В dev Next.js показывает оверлей на console.error — не используем его тут
                    console.log('❌ [SaveButton] Form not found!')
                  }
                }}
                className="w-full bg-primary text-white hover:bg-primary/90 font-bold rounded-[16px] px-6 py-3 shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Сохранить изменения
              </button>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}



