export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cash_registers: {
        Row: {
          attendant_id: string
          closed_at: string | null
          closed_by: string | null
          counted_amount: number | null
          created_at: string
          difference: number | null
          expected_amount: number | null
          id: string
          notes: string | null
          opened_at: string
          opening_amount: number
          status: string
          updated_at: string
        }
        Insert: {
          attendant_id: string
          closed_at?: string | null
          closed_by?: string | null
          counted_amount?: number | null
          created_at?: string
          difference?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_amount?: number
          status?: string
          updated_at?: string
        }
        Update: {
          attendant_id?: string
          closed_at?: string | null
          closed_by?: string | null
          counted_amount?: number | null
          created_at?: string
          difference?: number | null
          expected_amount?: number | null
          id?: string
          notes?: string | null
          opened_at?: string
          opening_amount?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      employee_reports: {
        Row: {
          author_id: string
          created_at: string
          id: string
          message: string
          read: boolean
          read_at: string | null
          read_by: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          message: string
          read?: boolean
          read_at?: string | null
          read_by?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          read_at?: string | null
          read_by?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipments: {
        Row: {
          active: boolean
          created_at: string
          hourly_rate: number
          id: string
          last_maintenance: string | null
          name: string
          specs: string | null
          status: string
          type: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          hourly_rate: number
          id?: string
          last_maintenance?: string | null
          name: string
          specs?: string | null
          status?: string
          type: string
        }
        Update: {
          active?: boolean
          created_at?: string
          hourly_rate?: number
          id?: string
          last_maintenance?: string | null
          name?: string
          specs?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          notes: string | null
          occurred_at: string
          payment_method: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          notes?: string | null
          occurred_at?: string
          payment_method?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          payment_method?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_records: {
        Row: {
          base_amount: number
          bonus: number
          created_at: string
          deductions: number
          employee_id: string
          id: string
          net_amount: number
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          payment_method: string | null
          reference_month: string
          status: string
          updated_at: string
        }
        Insert: {
          base_amount?: number
          bonus?: number
          created_at?: string
          deductions?: number
          employee_id: string
          id?: string
          net_amount?: number
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string | null
          reference_month: string
          status?: string
          updated_at?: string
        }
        Update: {
          base_amount?: number
          bonus?: number
          created_at?: string
          deductions?: number
          employee_id?: string
          id?: string
          net_amount?: number
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string | null
          reference_month?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          hire_date: string | null
          id: string
          name: string
          permission_level: string
          permissions: Json
          role: string
          salary: number | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          hire_date?: string | null
          id: string
          name: string
          permission_level?: string
          permissions?: Json
          role?: string
          salary?: number | null
        }
        Update: {
          active?: boolean
          created_at?: string
          hire_date?: string | null
          id?: string
          name?: string
          permission_level?: string
          permissions?: Json
          role?: string
          salary?: number | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          percent_off: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          percent_off?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          percent_off?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          attendant_id: string
          customer_id: string | null
          customer_name: string | null
          discount: number
          duration_minutes: number
          ended_at: string | null
          ends_at: string
          equipment_id: string
          equipment_name: string | null
          equipment_type: string | null
          hourly_rate: number | null
          id: string
          payment_method: string | null
          started_at: string
          status: string
          value: number
        }
        Insert: {
          attendant_id: string
          customer_id?: string | null
          customer_name?: string | null
          discount?: number
          duration_minutes: number
          ended_at?: string | null
          ends_at: string
          equipment_id: string
          equipment_name?: string | null
          equipment_type?: string | null
          hourly_rate?: number | null
          id?: string
          payment_method?: string | null
          started_at?: string
          status?: string
          value: number
        }
        Update: {
          attendant_id?: string
          customer_id?: string | null
          customer_name?: string | null
          discount?: number
          duration_minutes?: number
          ended_at?: string | null
          ends_at?: string
          equipment_id?: string
          equipment_name?: string | null
          equipment_type?: string | null
          hourly_rate?: number | null
          id?: string
          payment_method?: string | null
          started_at?: string
          status?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "sessions_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipments"
            referencedColumns: ["id"]
          },
        ]
      }
      waiting_list: {
        Row: {
          customer_id: string | null
          customer_name: string | null
          entered_at: string
          id: string
          position: number
        }
        Insert: {
          customer_id?: string | null
          customer_name?: string | null
          entered_at?: string
          id?: string
          position: number
        }
        Update: {
          customer_id?: string | null
          customer_name?: string | null
          entered_at?: string
          id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "waiting_list_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_employees_admin: {
        Args: never
        Returns: {
          active: boolean
          created_at: string
          hire_date: string
          id: string
          name: string
          permission_level: string
          permissions: Json
          role: string
          salary: number
        }[]
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      update_employee_admin: {
        Args: {
          _employee_id: string
          _hire_date: string
          _permission_level: string
          _permissions: Json
          _salary: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
