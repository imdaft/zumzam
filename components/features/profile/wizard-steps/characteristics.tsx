'use client'

import { 
  KidsCenterCharacteristics, 
  LoftCharacteristics, 
  CafeCharacteristics, 
  ParkCharacteristics, 
  OutdoorCharacteristics, 
  OtherVenueCharacteristics 
} from './venue-types'
import { BaseVenueCharacteristics } from './venue-types/base-venue'
import {
  AnimatorCharacteristics,
  ShowCharacteristics,
  AgencyCharacteristics,
  PhotographerCharacteristics,
  QuestCharacteristics,
  MasterClassCharacteristics,
  CateringCharacteristics,
  ConfectioneryCharacteristics,
  DecoratorCharacteristics,
  DjMusicianCharacteristics,
  HostCharacteristics,
  TransportCharacteristics,
} from './index'

interface WizardCharacteristicsProps {
  data: any
  onNext: (data: any) => void
  onSkip: () => void
}

export function WizardCharacteristics({ data, onNext, onSkip }: WizardCharacteristicsProps) {
  const category = data.category
  const subtype = data.details?.subtype

  // Маршрутизация по категориям
  switch (category) {
    case 'venue':
      // Для площадок - рендерим специфичный компонент по подтипу
      if (subtype) {
        switch (subtype) {
          // Существующие типы с детальными формами
          case 'kids_center':
            return <KidsCenterCharacteristics data={data} onNext={onNext} onSkip={onSkip} />
          case 'loft':
            return <LoftCharacteristics data={data} onNext={onNext} onSkip={onSkip} />
          case 'cafe':
            return <CafeCharacteristics data={data} onNext={onNext} onSkip={onSkip} />
          case 'park':
          case 'entertainment_center':
            return <ParkCharacteristics data={data} onNext={onNext} onSkip={onSkip} />
          case 'outdoor':
            return <OutdoorCharacteristics data={data} onNext={onNext} onSkip={onSkip} />
          case 'other':
            return <OtherVenueCharacteristics data={data} onNext={onNext} onSkip={onSkip} />
          
          // Новые типы площадок (используют базовую форму)
          // Спортивно-активные
          case 'trampoline_park':
          case 'karting':
          case 'lasertag':
          case 'climbing_park':
          case 'bowling':
          // Водные
          case 'water_park':
          // Образовательно-культурные
          case 'museum':
          case 'planetarium':
          case 'theater':
          case 'library':
          // Творческие мастерские
          case 'art_studio':
          case 'pottery_workshop':
          case 'culinary_studio':
          case 'woodworking_workshop':
          case 'sewing_workshop':
          // Животные и природа
          case 'zoo':
          case 'aquarium':
          case 'horse_club':
          case 'farm':
          // Специализированные
          case 'vr_arena':
          case 'quest_room':
          case 'cinema':
          case 'retail_workshop':
          // Загородный отдых
          case 'recreation_base':
          case 'glamping':
            return <BaseVenueCharacteristics data={data} onNext={onNext} onSkip={onSkip} />
        }
      }
      // Fallback для venue без подтипа
      return <BaseVenueCharacteristics data={data} onNext={onNext} onSkip={onSkip} />

    case 'animator':
      return <AnimatorCharacteristics data={data} onNext={onNext} onSkip={onSkip} />

    case 'show':
      return <ShowCharacteristics data={data} onNext={onNext} onSkip={onSkip} />

    case 'agency':
      return <AgencyCharacteristics data={data} onNext={onNext} onSkip={onSkip} />

    case 'quest':
      return <QuestCharacteristics data={data} onNext={onNext} onSkip={onSkip} />

    case 'master_class':
      return <MasterClassCharacteristics data={data} onNext={onNext} onSkip={onSkip} />

    case 'photographer':
      return <PhotographerCharacteristics data={data} onNext={onNext} onSkip={onSkip} />

    case 'catering':
      return <CateringCharacteristics data={data} onNext={onNext} onSkip={onSkip} />

    case 'confectionery':
      return <ConfectioneryCharacteristics data={data} onNext={onNext} onSkip={onSkip} />

    case 'decorator':
      return <DecoratorCharacteristics data={data} onNext={onNext} onSkip={onSkip} />

    case 'dj_musician':
      return <DjMusicianCharacteristics data={data} onNext={onNext} onSkip={onSkip} />

    case 'host':
      return <HostCharacteristics data={data} onNext={onNext} onSkip={onSkip} />

    case 'transport':
      return <TransportCharacteristics data={data} onNext={onNext} onSkip={onSkip} />

    default:
      // Fallback: пропускаем шаг если категория неизвестна
      onSkip()
      return null
  }
}

