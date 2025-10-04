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
          expires_at: string | null
          max_uses: number | null
          uses_count: number
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          role?: 'admin' | 'member' | 'guest'
          created_by: string
          expires_at?: string | null
          max_uses?: number | null
          uses_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          role?: 'admin' | 'member' | 'guest'
          created_by?: string
          expires_at?: string | null
          max_uses?: number | null
          uses_count?: number
          created_at?: string
        }
      }
      diary_entries: {
        Row: {
          id: string
          user_id: string
          plot_id: string | null
          title: string
          content: string
          template_type: string
          plant_id: string | null
          tags: string[] | null
          weather: string | null
          temperature: number | null
          photos: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plot_id?: string | null
          title: string
          content: string
          template_type?: string
          plant_id?: string | null
          tags?: string[] | null
          weather?: string | null
          temperature?: number | null
          photos?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plot_id?: string | null
          title?: string
          content?: string
          template_type?: string
          plant_id?: string | null
          tags?: string[] | null
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
          text: string
          photos: string[] | null
          is_pinned: boolean
          is_announcement: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          text: string
          photos?: string[] | null
          is_pinned?: boolean
          is_announcement?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          text?: string
          photos?: string[] | null
          is_pinned?: boolean
          is_announcement?: boolean
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
          status: 'available' | 'accepted' | 'in_progress' | 'completed' | 'overdue'
          assigned_to: string | null
          due_date: string | null
          is_completed: boolean
          proof_photos: string[] | null
          completed_at: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          category: 'general' | 'maintenance' | 'planting' | 'harvesting' | 'cleaning' | 'repair' | 'inspection' | 'community'
          estimated_duration: number | null
          location: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          type: 'personal' | 'site'
          status?: 'available' | 'accepted' | 'in_progress' | 'completed' | 'overdue'
          assigned_to?: string | null
          due_date?: string | null
          is_completed?: boolean
          proof_photos?: string[] | null
          completed_at?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          category?: 'general' | 'maintenance' | 'planting' | 'harvesting' | 'cleaning' | 'repair' | 'inspection' | 'community'
          estimated_duration?: number | null
          location?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: 'personal' | 'site'
          status?: 'available' | 'accepted' | 'in_progress' | 'completed' | 'overdue'
          assigned_to?: string | null
          due_date?: string | null
          is_completed?: boolean
          proof_photos?: string[] | null
          completed_at?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          category?: 'general' | 'maintenance' | 'planting' | 'harvesting' | 'cleaning' | 'repair' | 'inspection' | 'community'
          estimated_duration?: number | null
          location?: string | null
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
          updated_at: string
        }
        Insert: {
          id?: string
          url: string
          album_id?: string | null
          caption?: string | null
          uploaded_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          url?: string
          album_id?: string | null
          caption?: string | null
          uploaded_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      plots: {
        Row: {
          id: string
          number: number
          size: string
          holder_user_id: string | null
          status: 'occupied' | 'vacant' | 'pending'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          number: number
          size: string
          holder_user_id?: string | null
          status?: 'occupied' | 'vacant' | 'pending'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          number?: number
          size?: string
          holder_user_id?: string | null
          status?: 'occupied' | 'vacant' | 'pending'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string | null
          event_id: string | null
          user_id: string
          text: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id?: string | null
          event_id?: string | null
          user_id: string
          text: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string | null
          event_id?: string | null
          user_id?: string
          text?: string
          created_at?: string
          updated_at?: string
        }
      }
      reactions: {
        Row: {
          id: string
          post_id: string | null
          comment_id: string | null
          user_id: string
          type: 'like' | 'love' | 'helpful' | 'celebrate'
          created_at: string
        }
        Insert: {
          id?: string
          post_id?: string | null
          comment_id?: string | null
          user_id: string
          type: 'like' | 'love' | 'helpful' | 'celebrate'
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string | null
          comment_id?: string | null
          user_id?: string
          type?: 'like' | 'love' | 'helpful' | 'celebrate'
          created_at?: string
        }
      }
      inspections: {
        Row: {
          id: string
          plot_id: string
          inspector_id: string
          inspection_date: string
          use_status: 'active' | 'inactive' | 'partial'
          upkeep: 'excellent' | 'good' | 'fair' | 'poor'
          issues: string[] | null
          notes: string | null
          photos: string[] | null
          action: 'none' | 'advisory' | 'notice' | 'warning'
          reinspect_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plot_id: string
          inspector_id: string
          inspection_date?: string
          use_status: 'active' | 'inactive' | 'partial'
          upkeep: 'excellent' | 'good' | 'fair' | 'poor'
          issues?: string[] | null
          notes?: string | null
          photos?: string[] | null
          action: 'none' | 'advisory' | 'notice' | 'warning'
          reinspect_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plot_id?: string
          inspector_id?: string
          inspection_date?: string
          use_status?: 'active' | 'inactive' | 'partial'
          upkeep?: 'excellent' | 'good' | 'fair' | 'poor'
          issues?: string[] | null
          notes?: string | null
          photos?: string[] | null
          action?: 'none' | 'advisory' | 'notice' | 'warning'
          reinspect_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rules: {
        Row: {
          id: string
          title: string
          content: string
          category: string
          is_published: boolean
          version: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          category: string
          is_published?: boolean
          version?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          category?: string
          is_published?: boolean
          version?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      rule_acknowledgements: {
        Row: {
          id: string
          user_id: string
          rule_id: string
          acknowledged_at: string
        }
        Insert: {
          id?: string
          user_id: string
          rule_id: string
          acknowledged_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          rule_id?: string
          acknowledged_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          title: string
          type: 'insurance' | 'lease' | 'notice' | 'form' | 'other'
          file_path: string
          uploaded_by: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          type: 'insurance' | 'lease' | 'notice' | 'form' | 'other'
          file_path: string
          uploaded_by: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          type?: 'insurance' | 'lease' | 'notice' | 'form' | 'other'
          file_path?: string
          uploaded_by?: string
          expires_at?: string | null
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
  }
}