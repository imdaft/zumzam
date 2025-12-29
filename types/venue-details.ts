/**
 * Типы для специфичных деталей площадок (venue)
 * Основано на полном анализе рынка детских праздников
 */

// ============================================
// БАЗОВЫЕ ТИПЫ
// ============================================

export type VenueType = 
  | 'kids_center'
  | 'loft'
  | 'cafe'
  | 'entertainment_center'
  | 'outdoor'
  | 'trampoline_park'
  | 'karting'
  | 'lasertag'
  | 'climbing_park'
  | 'bowling'
  | 'water_park'
  | 'museum'
  | 'planetarium'
  | 'theater'
  | 'library'
  | 'art_studio'
  | 'pottery_workshop'
  | 'culinary_studio'
  | 'woodworking_workshop'
  | 'sewing_workshop'
  | 'zoo'
  | 'aquarium'
  | 'horse_club'
  | 'farm'
  | 'vr_arena'
  | 'quest_room'
  | 'cinema'
  | 'retail_workshop'
  | 'recreation_base'
  | 'glamping'
  | 'other'

// ============================================
// УНИВЕРСАЛЬНЫЕ ПОЛЯ (для всех типов)
// ============================================

export interface BaseVenueDetails {
  // Подтип
  subtype?: string
  
  // Вместимость
  capacity_min?: number
  capacity_max?: number
  area_sqm?: number
  
  // Возраст
  age_min?: number
  age_max?: number
  age_groups?: string[] // ['0-3', '3-7', '7-12', '12-18', '18+']
  
  // Инфраструктура
  parking?: boolean
  parking_spots?: number
  
  // Санитарные
  toilets?: boolean
  toilets_count?: number
  changing_rooms?: boolean
  showers?: boolean
  
  // Кухня
  kitchen?: boolean
  kitchen_type?: 'full' | 'mini' | 'warming' | 'none'
  cafe?: boolean
  own_food_allowed?: boolean
  catering_available?: boolean
  
  // Техническое оборудование
  wifi?: boolean
  projector?: boolean
  sound_system?: boolean
  microphone?: boolean
  lighting?: boolean
  air_conditioning?: boolean
  heating?: boolean
  
  // Мебель
  tables?: number
  chairs?: number
  kids_tables?: number
  kids_chairs?: number
  adult_tables?: number
  adult_chairs?: number
  
  // Доступность
  disabled_access?: boolean
  elevator?: boolean
  
  // Безопасность
  cctv?: boolean
  security?: boolean
  first_aid?: boolean
  fire_safety?: boolean
  insurance?: boolean
  
  // Правила
  rules?: {
    alcohol_allowed?: boolean
    smoking_allowed?: boolean
    pets_allowed?: boolean
    own_cake_allowed?: boolean
    decorations_allowed?: boolean
    confetti_allowed?: boolean
    loud_music_allowed?: boolean
  }
}

// ============================================
// СПЕЦИФИЧНЫЕ ТИПЫ ДЛЯ КАЖДОЙ КАТЕГОРИИ
// ============================================

// 1. Детский центр
export interface KidsCenterDetails extends BaseVenueDetails {
  center_subtype?: 'developing' | 'playroom' | 'sports' | 'mixed'
  zones?: string[] // ['play', 'food', 'active', 'quiet']
  equipment?: {
    trampoline?: boolean
    ball_pit?: boolean
    maze?: boolean
    slides?: boolean
    soft_play?: boolean
  }
  animator_room?: boolean
  birthday_packages?: boolean
}

// 2. Лофт / Студия
export interface LoftDetails extends BaseVenueDetails {
  interior_style?: 'loft' | 'minimalism' | 'classic' | 'modern' | 'other'
  natural_light?: boolean
  cyclorama?: boolean
  dressing_room?: boolean
  furniture_options?: 'standard' | 'designer' | 'none'
  panoramic_windows?: boolean
}

// 3. Кафе / Ресторан
export interface CafeDetails extends BaseVenueDetails {
  cafe_subtype?: 'cafe' | 'restaurant' | 'family_restaurant'
  kids_menu?: boolean
  separate_hall?: boolean
  cuisine_type?: 'european' | 'asian' | 'russian' | 'mixed' | 'other'
  banquet_service?: boolean
}

// 4. Парк развлечений
export interface EntertainmentCenterDetails extends BaseVenueDetails {
  park_subtype?: 'indoor' | 'outdoor' | 'theme_park' | 'mixed'
  attractions_count?: number
  age_restrictions_present?: boolean
  show_programs?: boolean
  food_courts?: boolean
  covered_areas?: boolean
}

// 5. Открытая площадка
export interface OutdoorDetails extends BaseVenueDetails {
  outdoor_subtype?: 'park' | 'forest' | 'beach' | 'field' | 'recreation_base'
  tent_available?: boolean
  electricity_access?: boolean
  water_access?: boolean
  toilet_facilities?: 'portable' | 'stationary' | 'none'
  surface_type?: 'lawn' | 'pavement' | 'asphalt' | 'sand' | 'mixed'
  backup_plan_weather?: boolean
  bbq_zone?: boolean
}

// 6. Батутный центр
export interface TrampolineParkDetails extends BaseVenueDetails {
  trampoline_zones_count?: number
  foam_pit?: boolean
  climbing_wall?: boolean
  ninja_course?: boolean
  dodgeball_court?: boolean
  basketball_hoops?: boolean
  coaches_available?: boolean
  safety_briefing?: boolean
  safety_equipment_included?: boolean
}

// 7. Картинг
export interface KartingDetails extends BaseVenueDetails {
  track_type?: 'indoor' | 'outdoor' | 'both'
  track_length?: number // метры
  kart_types?: string[] // ['kids', 'adult', 'electric', 'drift']
  max_speed?: number
  min_height?: number
  safety_equipment?: boolean
  instructor_available?: boolean
  championship_available?: boolean
  timing_system?: boolean
  vr_arena?: boolean
}

// 8. Лазертаг / Пейнтбол
export interface LasertagDetails extends BaseVenueDetails {
  game_type?: 'lasertag' | 'paintball' | 'nerf' | 'airsoft'
  arena_type?: 'indoor' | 'outdoor' | 'both'
  arena_size?: number // м²
  equipment_provided?: boolean
  safety_equipment?: boolean
  scenarios_count?: number
  team_games?: boolean
  birthday_packages?: boolean
}

// 9. Скалодром / Веревочный парк
export interface ClimbingParkDetails extends BaseVenueDetails {
  park_type?: 'climbing_wall' | 'rope_park' | 'zip_line' | 'obstacle_course'
  difficulty_levels?: string[] // ['kids', 'easy', 'medium', 'hard']
  height?: number // метры
  routes_count?: number
  safety_system?: 'continuous_belay' | 'net_protection'
  instructor_required?: boolean
  weight_limit?: number
}

// 10. Боулинг / Бильярд
export interface BowlingDetails extends BaseVenueDetails {
  lanes_count?: number
  kids_lanes?: boolean // бамперы
  kids_balls?: boolean
  billiard_tables?: number
  shoes_rental?: boolean
  scoring_system?: string
  music_system?: boolean
}

// 11. Аквапарк / Бассейн
export interface WaterParkDetails extends BaseVenueDetails {
  facility_type?: 'water_park' | 'pool_complex' | 'spa_center'
  pools?: {
    kids_pool?: boolean
    depth_min?: number
    depth_max?: number
    temperature?: number
  }
  slides?: {
    count?: number
    types?: string[] // ['kids', 'family', 'extreme']
    min_height?: number
  }
  wave_pool?: boolean
  lazy_river?: boolean
  water_playground?: boolean
  lifeguards?: boolean
  swimming_ability_required?: boolean
  floaties_available?: boolean
  lockers?: boolean
  sun_loungers?: boolean
}

// 12. Музей
export interface MuseumDetails extends BaseVenueDetails {
  museum_type?: 'interactive' | 'science' | 'history' | 'art' | 'nature' | 'technology'
  interactive_exhibits?: boolean
  touch_allowed?: boolean
  programs?: {
    guided_tours?: boolean
    master_classes?: boolean
    workshops?: boolean
    quests?: boolean
    experiments?: boolean
  }
  duration_minutes?: number
  group_size_max?: number
  gift_shop?: boolean
  cloakroom?: boolean
}

// 13. Планетарий
export interface PlanetariumDetails extends BaseVenueDetails {
  dome_size?: number // диаметр
  projection_system?: string
  shows?: {
    kids_shows?: boolean
    educational?: boolean
    interactive?: boolean
  }
  telescope_observation?: boolean
  space_quiz?: boolean
  seating_capacity?: number
}

// 14. Театр / Кукольный театр
export interface TheaterDetails extends BaseVenueDetails {
  theater_type?: 'puppet_theater' | 'drama_theater' | 'musical_theater' | 'interactive_theater'
  repertoire?: {
    genres?: string[]
    interactive_shows?: boolean
  }
  hall_capacity?: number
  private_shows?: boolean
  backstage_tour?: boolean
  meet_actors?: boolean
  photo_zone?: boolean
}

// 15. Библиотека
export interface LibraryDetails extends BaseVenueDetails {
  programs?: {
    story_time?: boolean
    reading_circles?: boolean
    book_themed_parties?: boolean
    author_meetings?: boolean
    literary_quests?: boolean
  }
  collections?: {
    picture_books?: boolean
    fairy_tales?: boolean
    science_books?: boolean
    comics?: boolean
  }
  reading_room?: boolean
  play_area?: boolean
}

// 16. Художественная студия
export interface ArtStudioDetails extends BaseVenueDetails {
  workshop_types?: string[] // ['painting', 'drawing', 'sculpture', 'mixed_media']
  materials_included?: boolean
  take_home_artwork?: boolean
  aprons_provided?: boolean
  themes?: string[]
  duration_minutes?: number
}

// 17. Гончарная мастерская
export interface PotteryWorkshopDetails extends BaseVenueDetails {
  pottery_wheels?: number
  kilns?: number
  hand_building?: boolean
  glazing?: boolean
  firing?: boolean
  pickup_later?: boolean
  protective_clothing?: boolean
}

// 18. Кулинарная студия
export interface CulinaryStudioDetails extends BaseVenueDetails {
  studio_type?: 'baking' | 'cooking' | 'desserts' | 'international'
  cuisine_types?: string[]
  recipes?: {
    difficulty?: string[]
    allergen_free?: boolean
    vegetarian?: boolean
  }
  ovens?: number
  workstations?: number
  ingredients_included?: boolean
  aprons_provided?: boolean
  recipes_to_take_home?: boolean
  eat_on_site?: boolean
  take_home_food?: boolean
  chef_supervision?: boolean
}

// 19. Столярная мастерская
export interface WoodworkingWorkshopDetails extends BaseVenueDetails {
  projects?: string[] // ['birdhouse', 'toy', 'furniture', 'custom']
  tools_provided?: boolean
  safety_equipment?: boolean
  materials_included?: boolean
  take_home_project?: boolean
  instructor_supervision?: boolean
}

// 20. Швейная мастерская
export interface SewingWorkshopDetails extends BaseVenueDetails {
  workshop_type?: 'sewing' | 'knitting' | 'embroidery' | 'crafts'
  sewing_machines?: number
  kid_friendly?: boolean
  materials_included?: boolean
  projects?: string[]
  take_home?: boolean
  skill_level?: string[]
}

// 21. Зоопарк
export interface ZooDetails extends BaseVenueDetails {
  zoo_type?: 'full_zoo' | 'contact_zoo' | 'mini_zoo' | 'farm'
  animals_count?: number
  animal_types?: string[] // ['mammals', 'birds', 'reptiles', 'farm_animals']
  interaction?: {
    contact_allowed?: boolean
    feeding_allowed?: boolean
    petting_zoo?: boolean
    pony_rides?: boolean
  }
  guided_tours?: boolean
  feeding_shows?: boolean
  animal_talks?: boolean
  playground?: boolean
  picnic_area?: boolean
  gift_shop?: boolean
}

// 22. Аквариум / Океанариум
export interface AquariumDetails extends BaseVenueDetails {
  facility_type?: 'aquarium' | 'oceanarium'
  tanks_count?: number
  species_count?: number
  exhibitions?: {
    tropical_fish?: boolean
    sharks?: boolean
    coral_reef?: boolean
    touch_pool?: boolean
    dolphinarium?: boolean
  }
  feeding_shows?: boolean
  underwater_tunnel?: boolean
  behind_scenes?: boolean
  gift_shop?: boolean
}

// 23. Конный клуб
export interface HorseClubDetails extends BaseVenueDetails {
  horses_count?: number
  ponies_count?: number
  programs?: {
    pony_rides?: boolean
    horse_riding_lessons?: boolean
    trail_rides?: boolean
    stable_tour?: boolean
    grooming_session?: boolean
    photo_with_horses?: boolean
  }
  indoor_arena?: boolean
  outdoor_arena?: boolean
  helmets_provided?: boolean
  instructor_required?: boolean
  experience_required?: boolean
  weight_limit?: number
}

// 24. Ферма
export interface FarmDetails extends BaseVenueDetails {
  farm_type?: 'traditional' | 'eco' | 'educational'
  animals?: string[] // ['cows', 'goats', 'sheep', 'chickens', 'rabbits']
  activities?: {
    animal_feeding?: boolean
    milking?: boolean
    egg_collecting?: boolean
    tractor_rides?: boolean
    haystack_jumping?: boolean
    garden_tour?: boolean
  }
  products?: {
    fresh_milk?: boolean
    farm_eggs?: boolean
    honey?: boolean
    vegetables?: boolean
    can_purchase?: boolean
  }
  picnic_area?: boolean
  playground?: boolean
}

// 25. VR-арена
export interface VRArenaDetails extends BaseVenueDetails {
  vr_sets_count?: number
  play_area_size?: number
  game_categories?: string[] // ['adventure', 'sports', 'educational', 'multiplayer']
  games_count?: number
  multiplayer_support?: boolean
  headsets_type?: string
  full_body_tracking?: boolean
  session_duration?: number
  content_ratings?: string[]
}

// 26. Квест-комната
export interface QuestRoomDetails extends BaseVenueDetails {
  quest_type?: 'escape_room' | 'performance' | 'vr_quest' | 'outdoor_quest'
  themes?: string[] // ['detective', 'horror', 'adventure', 'fantasy']
  difficulty?: 'easy' | 'medium' | 'hard'
  duration_minutes?: number
  team_size_min?: number
  team_size_max?: number
  team_size_optimal?: number
  age_appropriate?: boolean
  scary_level?: number // 1-5
  actors_present?: boolean
  hints_available?: boolean
  success_rate?: number // %
}

// 27. Кинотеатр
export interface CinemaDetails extends BaseVenueDetails {
  hall_capacity?: number
  screen_size?: string
  sound_system?: string
  viewing_options?: {
    private_screening?: boolean
    film_choice?: boolean
    own_content?: boolean
    video_games?: boolean
  }
  seating_type?: 'standard' | 'vip' | 'bean_bags'
  recliners?: boolean
  food_options?: {
    popcorn?: boolean
    snacks?: boolean
    drinks?: boolean
    birthday_cake_allowed?: boolean
  }
  decorations_allowed?: boolean
  duration_hours?: number
}

// 28. Торговый центр / Склад
export interface RetailWorkshopDetails extends BaseVenueDetails {
  store_type?: 'hardware_store' | 'furniture_store' | 'craft_store' | 'toy_store'
  workshop_area?: boolean
  programs?: {
    construction?: boolean
    furniture_assembly?: boolean
    decorating?: boolean
    crafting?: boolean
  }
  materials?: {
    provided?: boolean
    can_purchase?: boolean
    discounts?: boolean
  }
  instructor?: boolean
  take_home_project?: boolean
  retail_access?: boolean
}

// 29. База отдыха / Загородный клуб
export interface RecreationBaseDetails extends BaseVenueDetails {
  facility_type?: 'recreation_base' | 'country_club' | 'resort' | 'camping'
  distance_from_city?: number // км
  transport_provided?: boolean
  accommodation?: {
    available?: boolean
    types?: string[] // ['cottages', 'rooms', 'tents']
    overnight_allowed?: boolean
  }
  outdoor_activities?: {
    swimming?: boolean
    fishing?: boolean
    hiking?: boolean
    bonfire?: boolean
    bbq_zone?: boolean
  }
  restaurant?: boolean
  playground?: boolean
  sports_grounds?: boolean
  event_hall?: boolean
  bathhouse?: boolean
  season?: string[] // ['summer', 'winter', 'year_round']
}

// 30. Глэмпинг
export interface GlampingDetails extends BaseVenueDetails {
  tent_types?: string[] // ['safari', 'geodesic', 'tree_house', 'pod']
  amenities?: {
    electricity?: boolean
    heating?: boolean
    real_beds?: boolean
    private_bathroom?: boolean
    wifi?: boolean
  }
  activities?: {
    nature_walks?: boolean
    stargazing?: boolean
    campfire?: boolean
    outdoor_cinema?: boolean
    yoga?: boolean
  }
  restaurant?: boolean
  bbq?: boolean
  self_catering?: boolean
  kid_friendly?: boolean
  season?: string[]
}

// ============================================
// UNION TYPE ДЛЯ ВСЕХ ДЕТАЛЕЙ
// ============================================

export type VenueDetails = 
  | KidsCenterDetails
  | LoftDetails
  | CafeDetails
  | EntertainmentCenterDetails
  | OutdoorDetails
  | TrampolineParkDetails
  | KartingDetails
  | LasertagDetails
  | ClimbingParkDetails
  | BowlingDetails
  | WaterParkDetails
  | MuseumDetails
  | PlanetariumDetails
  | TheaterDetails
  | LibraryDetails
  | ArtStudioDetails
  | PotteryWorkshopDetails
  | CulinaryStudioDetails
  | WoodworkingWorkshopDetails
  | SewingWorkshopDetails
  | ZooDetails
  | AquariumDetails
  | HorseClubDetails
  | FarmDetails
  | VRArenaDetails
  | QuestRoomDetails
  | CinemaDetails
  | RetailWorkshopDetails
  | RecreationBaseDetails
  | GlampingDetails

