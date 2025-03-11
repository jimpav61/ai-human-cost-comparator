export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      allowed_admins: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      generated_reports: {
        Row: {
          calculator_inputs: Json
          calculator_results: Json
          company_name: string
          contact_name: string
          email: string
          id: string
          phone_number: string | null
          report_date: string | null
        }
        Insert: {
          calculator_inputs: Json
          calculator_results: Json
          company_name: string
          contact_name: string
          email: string
          id: string
          phone_number?: string | null
          report_date?: string | null
        }
        Update: {
          calculator_inputs?: Json
          calculator_results?: Json
          company_name?: string
          contact_name?: string
          email?: string
          id?: string
          phone_number?: string | null
          report_date?: string | null
        }
        Relationships: []
      }
      lead_assignments: {
        Row: {
          agent_id: string
          assigned_at: string | null
          id: string
          lead_id: string
        }
        Insert: {
          agent_id: string
          assigned_at?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          agent_id?: string
          assigned_at?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          calculator_inputs: Json
          calculator_results: Json
          company_name: string
          created_at: string | null
          email: string
          employee_count: number | null
          form_completed: boolean | null
          id: string
          industry: string | null
          name: string
          phone_number: string | null
          proposal_sent: boolean | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          calculator_inputs: Json
          calculator_results: Json
          company_name: string
          created_at?: string | null
          email: string
          employee_count?: number | null
          form_completed?: boolean | null
          id?: string
          industry?: string | null
          name: string
          phone_number?: string | null
          proposal_sent?: boolean | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          calculator_inputs?: Json
          calculator_results?: Json
          company_name?: string
          created_at?: string | null
          email?: string
          employee_count?: number | null
          form_completed?: boolean | null
          id?: string
          industry?: string | null
          name?: string
          phone_number?: string | null
          proposal_sent?: boolean | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      pricing_configurations: {
        Row: {
          additional_voice_rate: number | null
          annual_price: number | null
          chatbot_base_price: number
          chatbot_per_message: number
          created_at: string | null
          id: string
          included_voice_minutes: number | null
          setup_fee: number | null
          tier: Database["public"]["Enums"]["package_tier"]
          updated_at: string | null
          voice_per_minute: number
        }
        Insert: {
          additional_voice_rate?: number | null
          annual_price?: number | null
          chatbot_base_price: number
          chatbot_per_message: number
          created_at?: string | null
          id?: string
          included_voice_minutes?: number | null
          setup_fee?: number | null
          tier: Database["public"]["Enums"]["package_tier"]
          updated_at?: string | null
          voice_per_minute: number
        }
        Update: {
          additional_voice_rate?: number | null
          annual_price?: number | null
          chatbot_base_price?: number
          chatbot_per_message?: number
          created_at?: string | null
          id?: string
          included_voice_minutes?: number | null
          setup_fee?: number | null
          tier?: Database["public"]["Enums"]["package_tier"]
          updated_at?: string | null
          voice_per_minute?: number
        }
        Relationships: []
      }
      proposal_revisions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_sent: boolean
          lead_id: string
          notes: string | null
          proposal_content: string
          title: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_sent?: boolean
          lead_id: string
          notes?: string | null
          proposal_content: string
          title?: string
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_sent?: boolean
          lead_id?: string
          notes?: string | null
          proposal_content?: string
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_revisions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_proposal_version: {
        Args: {
          p_lead_id: string
        }
        Returns: number
      }
      has_role: {
        Args: {
          role_to_check: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_allowed_admin: {
        Args: {
          email: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      package_tier: "starter" | "growth" | "premium"
      user_role: "admin" | "agent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
