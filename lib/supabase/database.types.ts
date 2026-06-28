export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      activity_feed: {
        Row: {
          created_at: string
          event_type: string
          id: string
          incident_id: string | null
          message: string
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          incident_id?: string | null
          message: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          incident_id?: string | null
          message?: string
        }
        Relationships: []
      }
      incident_photos: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          incident_id: string
          public_url: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          incident_id: string
          public_url: string
          storage_path: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          incident_id?: string
          public_url?: string
          storage_path?: string
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          channel: string
          department: string | null
          error_message: string | null
          id: string
          incident_id: string
          recipient: string
          sent_at: string
          status: string
          subject: string
        }
        Insert: {
          channel?: string
          department?: string | null
          error_message?: string | null
          id?: string
          incident_id: string
          recipient: string
          sent_at?: string
          status?: string
          subject: string
        }
        Update: {
          channel?: string
          department?: string | null
          error_message?: string | null
          id?: string
          incident_id?: string
          recipient?: string
          sent_at?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      incident_timeline: {
        Row: {
          created_at: string
          event_label: string
          event_status: string
          event_time: string
          id: string
          incident_id: string
        }
        Insert: {
          created_at?: string
          event_label: string
          event_status?: string
          event_time?: string
          id?: string
          incident_id: string
        }
        Update: {
          created_at?: string
          event_label?: string
          event_status?: string
          event_time?: string
          id?: string
          incident_id?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          affected_people: number | null
          ai_confidence: number | null
          ai_geographic_impact: string | null
          ai_resource_recommendation: string | null
          ai_risk_assessment: string | null
          ai_agent_outputs: Json | null
          created_at: string
          description: string
          email: string | null
          emergency_type: string
          first_name: string
          id: string
          infrastructure_damage: string | null
          injuries: number | null
          last_name: string
          latitude: number
          location_name: string | null
          longitude: number
          notifications_sent_at: string | null
          phone: string
          processing_time_seconds: number | null
          reporter_id: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          affected_people?: number | null
          ai_confidence?: number | null
          ai_geographic_impact?: string | null
          ai_resource_recommendation?: string | null
          ai_risk_assessment?: string | null
          ai_agent_outputs?: Json | null
          created_at?: string
          description: string
          email?: string | null
          emergency_type: string
          first_name: string
          id?: string
          infrastructure_damage?: string | null
          injuries?: number | null
          last_name: string
          latitude: number
          location_name?: string | null
          longitude: number
          phone: string
          processing_time_seconds?: number | null
          reporter_id?: string | null
          severity: string
          status?: string
          updated_at?: string
        }
        Update: {
          affected_people?: number | null
          ai_confidence?: number | null
          ai_geographic_impact?: string | null
          ai_resource_recommendation?: string | null
          ai_risk_assessment?: string | null
          ai_agent_outputs?: Json | null
          created_at?: string
          description?: string
          email?: string | null
          emergency_type?: string
          first_name?: string
          id?: string
          infrastructure_damage?: string | null
          injuries?: number | null
          last_name?: string
          latitude?: number
          location_name?: string | null
          longitude?: number
          phone?: string
          processing_time_seconds?: number | null
          reporter_id?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      resource_deployments: {
        Row: {
          arrived_at: string | null
          created_at: string
          crew: string | null
          deployment_status: string
          id: string
          incident_id: string | null
          location: string | null
          resource_type: string
          unit_code: string
        }
        Insert: {
          arrived_at?: string | null
          created_at?: string
          crew?: string | null
          deployment_status?: string
          id?: string
          incident_id?: string | null
          location?: string | null
          resource_type: string
          unit_code: string
        }
        Update: {
          arrived_at?: string | null
          created_at?: string
          crew?: string | null
          deployment_status?: string
          id?: string
          incident_id?: string | null
          location?: string | null
          resource_type?: string
          unit_code?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          available: number
          created_at: string
          deployed: number
          icon: string | null
          id: string
          status: string
          total: number
          type: string
          updated_at: string
        }
        Insert: {
          available?: number
          created_at?: string
          deployed?: number
          icon?: string | null
          id?: string
          status?: string
          total?: number
          type: string
          updated_at?: string
        }
        Update: {
          available?: number
          created_at?: string
          deployed?: number
          icon?: string | null
          id?: string
          status?: string
          total?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
