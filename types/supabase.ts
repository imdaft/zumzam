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
          user_id: string
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
          category: Database['public']['Enums']['profile_category']
          details: Json
          main_photo: string | null
          is_published: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
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
          category?: Database['public']['Enums']['profile_category']
          details?: Json
          main_photo?: string | null
          is_published?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
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
          category?: Database['public']['Enums']['profile_category']
          details?: Json
          main_photo?: string | null
          is_published?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
      profile_locations: {
        Row: {
          id: string
          profile_id: string
          city: string
          address: string | null
          geo_location: unknown | null
          name: string | null
          phone: string | null
          email: string | null
          working_hours: Json | null
          active: boolean | null
          is_main: boolean | null
          details: Json
          yandex_url: string | null
          yandex_rating: number | null
          yandex_review_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          city: string
          address?: string | null
          geo_location?: unknown | null
          name?: string | null
          phone?: string | null
          email?: string | null
          working_hours?: Json | null
          active?: boolean | null
          is_main?: boolean | null
          details?: Json
          yandex_url?: string | null
          yandex_rating?: number | null
          yandex_review_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          city?: string
          address?: string | null
          geo_location?: unknown | null
          name?: string | null
          phone?: string | null
          email?: string | null
          working_hours?: Json | null
          active?: boolean | null
          is_main?: boolean | null
          details?: Json
          yandex_url?: string | null
          yandex_rating?: number | null
          yandex_review_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      services: {
        Row: {
          id: string
          profile_id: string
          category_id: string | null
          title: string
          description: string
          price: number | null
          price_from: number | null
          price_to: number | null
          currency: string | null
          duration: number | null
          age_from: number | null
          age_to: number | null
          capacity_min: number | null
          capacity_max: number | null
          tags: string[] | null
          embedding: string | null
          photos: string[] | null
          video_url: string | null
          is_active: boolean | null
          featured: boolean | null
          details: Json
          service_type: string | null
          price_type: string | null
          images: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          category_id?: string | null
          title: string
          description: string
          price?: number | null
          price_from?: number | null
          price_to?: number | null
          currency?: string | null
          duration?: number | null
          age_from?: number | null
          age_to?: number | null
          capacity_min?: number | null
          capacity_max?: number | null
          tags?: string[] | null
          embedding?: string | null
          photos?: string[] | null
          video_url?: string | null
          is_active?: boolean | null
          featured?: boolean | null
          details?: Json
          service_type?: string | null
          price_type?: string | null
          images?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          profile_id?: string
          category_id?: string | null
          title?: string
          description?: string
          price?: number | null
          price_from?: number | null
          price_to?: number | null
          currency?: string | null
          duration?: number | null
          age_from?: number | null
          age_to?: number | null
          capacity_min?: number | null
          capacity_max?: number | null
          tags?: string[] | null
          embedding?: string | null
          photos?: string[] | null
          video_url?: string | null
          is_active?: boolean | null
          featured?: boolean | null
          details?: Json
          service_type?: string | null
          price_type?: string | null
          images?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          profile_id: string
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          profile_id: string
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string
          notes?: string | null
          created_at?: string | null
        }
      }
      order_messages: {
        Row: {
          id: string
          order_id: string
          sender_role: 'client' | 'provider'
          message: string
          is_read: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          order_id: string
          sender_role: 'client' | 'provider'
          message: string
          is_read?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          sender_role?: 'client' | 'provider'
          message?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      profile_category:
        | 'venue'
        | 'animator'
        | 'agency'
        | 'show'
        | 'quest'
        | 'master_class'
        | 'photographer'
        | 'catering'
        | 'confectionery'
        | 'decorator'
        | 'dj_musician'
        | 'host'
        | 'transport'
    }
  }
}
