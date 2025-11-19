/**
 * Базовые типы для Supabase Database
 * Сгенерировано на основе схемы БД
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          slug: string
          display_name: string
          bio: string | null
          description: string | null
          city: string
          address: string | null
          geo_location: unknown | null
          rating: number | null
          reviews_count: number | null
          bookings_completed: number | null
          response_time_minutes: number | null
          price_range: string | null
          tags: string[] | null
          embedding: string | null
          photos: string[] | null
          videos: string[] | null
          cover_photo: string | null
          portfolio_url: string | null
          verified: boolean | null
          verification_date: string | null
          email: string | null
          phone: string | null
          website: string | null
          social_links: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          slug: string
          display_name: string
          bio?: string | null
          description?: string | null
          city: string
          address?: string | null
          geo_location?: unknown | null
          rating?: number | null
          reviews_count?: number | null
          bookings_completed?: number | null
          response_time_minutes?: number | null
          price_range?: string | null
          tags?: string[] | null
          embedding?: string | null
          photos?: string[] | null
          videos?: string[] | null
          cover_photo?: string | null
          portfolio_url?: string | null
          verified?: boolean | null
          verification_date?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          social_links?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          display_name?: string
          bio?: string | null
          description?: string | null
          city?: string
          address?: string | null
          geo_location?: unknown | null
          rating?: number | null
          reviews_count?: number | null
          bookings_completed?: number | null
          response_time_minutes?: number | null
          price_range?: string | null
          tags?: string[] | null
          embedding?: string | null
          photos?: string[] | null
          videos?: string[] | null
          cover_photo?: string | null
          portfolio_url?: string | null
          verified?: boolean | null
          verification_date?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          social_links?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      // Можно добавить другие таблицы по мере необходимости
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}


