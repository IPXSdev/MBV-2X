export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          tier: "creator" | "indie" | "pro"
          submission_credits: number
          role: "user" | "admin" | "master_dev"
          is_verified: boolean
          created_at: string
          updated_at: string
          profile_image_url?: string
          bio?: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          tier?: "creator" | "indie" | "pro"
          submission_credits?: number
          role?: "user" | "admin" | "master_dev"
          is_verified?: boolean
          created_at?: string
          updated_at?: string
          profile_image_url?: string
          bio?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          tier?: "creator" | "indie" | "pro"
          submission_credits?: number
          role?: "user" | "admin" | "master_dev"
          is_verified?: boolean
          created_at?: string
          updated_at?: string
          profile_image_url?: string
          bio?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_token?: string
          expires_at?: string
          created_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          user_id: string
          title: string
          artist_name: string
          genre: string
          mood_tags: string[]
          file_url: string
          status: "pending" | "in_review" | "approved" | "rejected"
          admin_rating?: number
          admin_feedback?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          artist_name: string
          genre: string
          mood_tags?: string[]
          file_url: string
          status?: "pending" | "in_review" | "approved" | "rejected"
          admin_rating?: number
          admin_feedback?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          artist_name?: string
          genre?: string
          mood_tags?: string[]
          file_url?: string
          status?: "pending" | "in_review" | "approved" | "rejected"
          admin_rating?: number
          admin_feedback?: string
          created_at?: string
          updated_at?: string
        }
      }
      media: {
        Row: {
          id: string
          title: string
          description?: string
          media_type: "youtube" | "audio" | "video" | "image"
          youtube_url?: string
          file_url?: string
          thumbnail_url?: string
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          media_type: "youtube" | "audio" | "video" | "image"
          youtube_url?: string
          file_url?: string
          thumbnail_url?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          media_type?: "youtube" | "audio" | "video" | "image"
          youtube_url?: string
          file_url?: string
          thumbnail_url?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
