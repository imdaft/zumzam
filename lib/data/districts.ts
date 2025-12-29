export interface District {
  code: string
  name: string
  region: string
}

// Районы Санкт-Петербурга
export const SPB_DISTRICTS: District[] = [
  { code: 'spb_admiralteysky', name: 'Адмиралтейский', region: 'Санкт-Петербург' },
  { code: 'spb_vasileostrovsky', name: 'Василеостровский', region: 'Санкт-Петербург' },
  { code: 'spb_vyborsky', name: 'Выборгский', region: 'Санкт-Петербург' },
  { code: 'spb_kalininsky', name: 'Калининский', region: 'Санкт-Петербург' },
  { code: 'spb_kirovsky', name: 'Кировский', region: 'Санкт-Петербург' },
  { code: 'spb_kolpinsky', name: 'Колпинский', region: 'Санкт-Петербург' },
  { code: 'spb_kronshtadtsky', name: 'Кронштадтский', region: 'Санкт-Петербург' },
  { code: 'spb_kurortny', name: 'Курортный', region: 'Санкт-Петербург' },
  { code: 'spb_moskovsky', name: 'Московский', region: 'Санкт-Петербург' },
  { code: 'spb_nevsky', name: 'Невский', region: 'Санкт-Петербург' },
  { code: 'spb_petrodvortsovy', name: 'Петродворцовый', region: 'Санкт-Петербург' },
  { code: 'spb_primorsky', name: 'Приморский', region: 'Санкт-Петербург' },
  { code: 'spb_pushkinsky', name: 'Пушкинский', region: 'Санкт-Петербург' },
  { code: 'spb_frunzensky', name: 'Фрунзенский', region: 'Санкт-Петербург' },
  { code: 'spb_tsentralny', name: 'Центральный', region: 'Санкт-Петербург' },
]

// Основные районы Ленинградской области (сжатый список для MVP)
export const LO_DISTRICTS: District[] = [
  { code: 'lo_vsevolozhsky', name: 'Всеволожский район', region: 'Ленинградская область' },
  { code: 'lo_gatchinsky', name: 'Гатчинский район', region: 'Ленинградская область' },
  { code: 'lo_vyborsky', name: 'Выборгский район', region: 'Ленинградская область' },
  { code: 'lo_tosnensky', name: 'Тосненский район', region: 'Ленинградская область' },
  { code: 'lo_lomonosovsky', name: 'Ломоносовский район', region: 'Ленинградская область' },
  { code: 'lo_kirishsky', name: 'Киришский район', region: 'Ленинградская область' },
  { code: 'lo_kengiseppsky', name: 'Кингисеппский район', region: 'Ленинградская область' },
  { code: 'lo_boksitogorsky', name: 'Бокситогорский район', region: 'Ленинградская область' },
  { code: 'lo_priozersky', name: 'Приозерский район', region: 'Ленинградская область' },
  { code: 'lo_tikhvinsky', name: 'Тихвинский район', region: 'Ленинградская область' },
]

export type CityKey = 'spb' | 'lo'

export const CITY_DISTRICTS: Record<CityKey, { name: string; districts: District[]; presets: Array<{ id: 'all_city' | 'all_region'; label: string }> }> = {
  spb: {
    name: 'Санкт-Петербург',
    districts: SPB_DISTRICTS,
    presets: [
      { id: 'all_city', label: 'Все районы Санкт-Петербурга' },
      { id: 'all_region', label: 'Вся Ленинградская область' },
    ],
  },
  lo: {
    name: 'Ленинградская область',
    districts: LO_DISTRICTS,
    presets: [
      { id: 'all_region', label: 'Вся Ленинградская область' },
    ],
  },
}

export function detectCityKey(cityName?: string): CityKey | null {
  if (!cityName) return null
  const lower = cityName.toLowerCase()
  if (lower.includes('петер') || lower.includes('спб') || lower.includes('санкт')) return 'spb'
  if (lower.includes('ленинград')) return 'lo'
  return null
}











