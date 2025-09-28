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
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'member' | 'guest'
          plot_number: string | null
          phone: string | null
          emergency_contact: string | null
          join_date: string
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'member' | 'guest'
          plot_number?: string | null
          phone?: string | null
          emergency_contact?: string | null
          join_date?: string
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'member' | 'guest'
          plot_number?: string | null
          phone?: string | null
          emergency_contact?: string | null
          join_date?: string
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      join_codes: {
        Row: {
          id: string
          code: string
          role: 'admin' | 'member' | 'guest'
          created_by: string
          is_active: boolean
          expires_at: string | null
          max_uses: number | null
          current_uses: number
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          role?: 'admin' | 'member' | 'guest'
          created_by: string
          is_active?: boolean
          expires_at?: string | null
          max_uses?: number | null
          current_uses?: number
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          role?: 'admin' | 'member' | 'guest'
          created_by?: string
          is_active?: boolean
          expires_at?: string | null
          max_uses?: number | null
          current_uses?: number
          created_at?: string
        }
      }
      diary_entries: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          template_type: 'sowing' | 'watering' | 'harvesting' | 'maintenance' | 'general'
          weather: string | null
          temperature: number | null
          photos: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          template_type: 'sowing' | 'watering' | 'harvesting' | 'maintenance' | 'general'
          weather?: string | null
          temperature?: number | null
          photos?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          template_type?: 'sowing' | 'watering' | 'harvesting' | 'maintenance' | 'general'
          weather?: string | null
          temperature?: number | null
          photos?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          start_date: string
          end_date: string | null
          location: string
          max_attendees: number | null
          bring_list: string[] | null
          created_by: string
          is_cancelled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          start_date: string
          end_date?: string | null
          location: string
          max_attendees?: number | null
          bring_list?: string[] | null
          created_by: string
          is_cancelled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          start_date?: string
          end_date?: string | null
          location?: string
          max_attendees?: number | null
          bring_list?: string[] | null
          created_by?: string
          is_cancelled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      event_rsvps: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: 'going' | 'maybe' | 'not_going'
          bringing_items: string[] | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status: 'going' | 'maybe' | 'not_going'
          bringing_items?: string[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          status?: 'going' | 'maybe' | 'not_going'
          bringing_items?: string[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          photos: string[] | null
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          photos?: string[] | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          photos?: string[] | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          type: 'personal' | 'site'
          assigned_to: string | null
          due_date: string | null
          is_completed: boolean
          proof_photos: string[] | null
          completed_at: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          type: 'personal' | 'site'
          assigned_to?: string | null
          due_date?: string | null
          is_completed?: boolean
          proof_photos?: string[] | null
          completed_at?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: 'personal' | 'site'
          assigned_to?: string | null
          due_date?: string | null
          is_completed?: boolean
          proof_photos?: string[] | null
          completed_at?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      albums: {
        Row: {
          id: string
          name: string
          description: string | null
          cover_photo: string | null
          created_by: string
          is_private: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          cover_photo?: string | null
          created_by: string
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          cover_photo?: string | null
          created_by?: string
          is_private?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      photos: {
        Row: {
          id: string
          url: string
          album_id: string | null
          caption: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          url: string
          album_id?: string | null
          caption?: string | null
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          url?: string
          album_id?: string | null
          caption?: string | null
          uploaded_by?: string
          created_at?: string
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
  }
}