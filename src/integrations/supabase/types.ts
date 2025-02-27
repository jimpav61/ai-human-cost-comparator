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
          id?: string
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
          chatbot_base_price: number
          chatbot_per_message: number
          created_at: string | null
          id: string
          tier: Database["public"]["Enums"]["package_tier"]
          updated_at: string | null
          voice_per_minute: number
        }
        Insert: {
          chatbot_base_price: number
          chatbot_per_message: number
          created_at?: string | null
          id?: string
          tier: Database["public"]["Enums"]["package_tier"]
          updated_at?: string | null
          voice_per_minute: number
        }
        Update: {
          chatbot_base_price?: number
          chatbot_per_message?: number
          created_at?: string | null
          id?: string
          tier?: Database["public"]["Enums"]["package_tier"]
          updated_at?: string | null
          voice_per_minute?: number
        }
        Relationships: []
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
      has_role: {
        Args: {
          role_to_check: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      package_tier: "basic" | "standard" | "premium"
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
