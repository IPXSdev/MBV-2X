export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          tier: "free" | "creator" | "pro"
          submission_credits: number
          role: "user" | "admin" | "master_dev"
          is_verified: boolean
          profile_image_url: string | null
          bio: string | null
          website_url: string | null
          social_links: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          tier?: "free" | "creator" | "pro"
          submission_credits?: number
          role?: "user" | "admin" | "master_dev"
          is_verified?: boolean
          profile_image_url?: string | null
          bio?: string | null
          website_url?: string | null
          social_links?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          tier?: "free" | "creator" | "pro"
          submission_credits?: number
          role?: "user" | "admin" | "master_dev"
          is_verified?: boolean
          profile_image_url?: string | null
          bio?: string | null
          website_url?: string | null
          social_links?: any
          created_at?: string
          updated_at?: string
        }
      }
      hosts: {
        Row: {
          id: string
          name: string
          role: string
          bio: string
          image_url: string | null
          is_active: boolean
          social_links: any
          specialties: string[] | null
          years_experience: number | null
          notable_works: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          role: string
          bio: string
          image_url?: string | null
          is_active?: boolean
          social_links?: any
          specialties?: string[] | null
          years_experience?: number | null
          notable_works?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
          bio?: string
          image_url?: string | null
          is_active?: boolean
          social_links?: any
          specialties?: string[] | null
          years_experience?: number | null
          notable_works?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      tracks: {
        Row: {
          id: string
          user_id: string
          title: string
          artist_name: string
          genre: string | null
          duration: number | null
          file_url: string
          file_size: number | null
          file_type: string | null
          artwork_url: string | null
          description: string | null
          lyrics: string | null
          bpm: number | null
          key_signature: string | null
          status: "pending" | "under_review" | "approved" | "rejected" | "placed"
          play_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          artist_name: string
          genre?: string | null
          duration?: number | null
          file_url: string
          file_size?: number | null
          file_type?: string | null
          artwork_url?: string | null
          description?: string | null
          lyrics?: string | null
          bpm?: number | null
          key_signature?: string | null
          status?: "pending" | "under_review" | "approved" | "rejected" | "placed"
          play_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          artist_name?: string
          genre?: string | null
          duration?: number | null
          file_url?: string
          file_size?: number | null
          file_type?: string | null
          artwork_url?: string | null
          description?: string | null
          lyrics?: string | null
          bpm?: number | null
          key_signature?: string | null
          status?: "pending" | "under_review" | "approved" | "rejected" | "placed"
          play_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          track_id: string
          host_id: string
          user_id: string
          status: "submitted" | "reviewing" | "feedback_given" | "accepted" | "declined"
          feedback: string | null
          rating: number | null
          submitted_at: string
          reviewed_at: string | null
          feedback_given_at: string | null
        }
        Insert: {
          id?: string
          track_id: string
          host_id: string
          user_id: string
          status?: "submitted" | "reviewing" | "feedback_given" | "accepted" | "declined"
          feedback?: string | null
          rating?: number | null
          submitted_at?: string
          reviewed_at?: string | null
          feedback_given_at?: string | null
        }
        Update: {
          id?: string
          track_id?: string
          host_id?: string
          user_id?: string
          status?: "submitted" | "reviewing" | "feedback_given" | "accepted" | "declined"
          feedback?: string | null
          rating?: number | null
          submitted_at?: string
          reviewed_at?: string | null
          feedback_given_at?: string | null
        }
      }
      placements: {
        Row: {
          id: string
          track_id: string | null
          submission_id: string | null
          title: string
          type: string
          network: string | null
          episode_info: string | null
          air_date: string | null
          placement_fee: number | null
          royalty_percentage: number | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          track_id?: string | null
          submission_id?: string | null
          title: string
          type: string
          network?: string | null
          episode_info?: string | null
          air_date?: string | null
          placement_fee?: number | null
          royalty_percentage?: number | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          track_id?: string | null
          submission_id?: string | null
          title?: string
          type?: string
          network?: string | null
          episode_info?: string | null
          air_date?: string | null
          placement_fee?: number | null
          royalty_percentage?: number | null
          description?: string | null
          created_at?: string
        }
      }
      podcast_episodes: {
        Row: {
          id: string
          title: string
          description: string | null
          youtube_video_id: string | null
          duration: number | null
          episode_number: number | null
          season_number: number
          is_featured: boolean
          guest_hosts: string[] | null
          topics: string[] | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          youtube_video_id?: string | null
          duration?: number | null
          episode_number?: number | null
          season_number?: number
          is_featured?: boolean
          guest_hosts?: string[] | null
          topics?: string[] | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          youtube_video_id?: string | null
          duration?: number | null
          episode_number?: number | null
          season_number?: number
          is_featured?: boolean
          guest_hosts?: string[] | null
          topics?: string[] | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
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
    }
  }
}
