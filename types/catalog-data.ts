// Структура данных для каталога активностей
export interface YandexVenueData {
  // Основные данные
  name: string;
  category: string;
  rating: number | null;
  reviewCount: number;
  
  // Контакты
  address: string;
  phone: string;
  website: string;
  
  // Время работы
  workingHours: string;
  
  // Контент
  description: string;
  services: string[];
  prices: Array<{
    name: string;
    price: string;
  }>;
  
  // Медиа
  photos: string[];
}

export interface CatalogResearchData {
  timestamp: string;
  searchUrl: string;
  totalVenues: number;
  venues: YandexVenueData[];
  statistics: {
    withPhones: number;
    withWebsites: number;
    withPhotos: number;
    withPrices: number;
    withDescription: number;
  };
}

export interface ActivityCatalogItem {
  id: string;
  name_ru: string;
  name_en: string;
  description_ru: string;
  category: 'active_entertainment' | 'creative' | 'educational' | 'unique';
  is_custom: boolean;
  sort_order: number;
  icon?: string;
  keywords?: string[];
  typical_price_range?: string;
  typical_age_range?: string;
  source_venues?: string[]; // Какие организации предоставляют эту активность
}

export interface CatalogAnalysis {
  popularActivities: Array<{
    keyword: string;
    count: number;
    percentage: number;
    venues: string[];
  }>;
  
  missingActivities: string[]; // Что есть на рынке, но нет в базе
  
  priceInsights: {
    averagePricePerChild: number;
    priceRange: { min: number; max: number };
    mostCommonPricePoints: number[];
  };
  
  recommendations: {
    newCategories: string[];
    suggestedActivities: ActivityCatalogItem[];
  };
}





