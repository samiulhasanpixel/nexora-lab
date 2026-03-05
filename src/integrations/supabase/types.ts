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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      otp_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          used: boolean | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          used?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          used?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string
          phone_verified: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          phone_verified?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          phone_verified?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          booking_id: string
          created_at: string
          customer_id: string
          id: string
          rating: number
          review: string | null
          seller_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          customer_id: string
          id?: string
          rating: number
          review?: string | null
          seller_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          rating?: number
          review?: string | null
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "service_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_profiles: {
        Row: {
          address: string | null
          alarm_message: string | null
          alarm_threshold: number | null
          booking_end_time: string | null
          booking_start_time: string | null
          business_name: string
          category: string | null
          created_at: string
          customer_message: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_bookings: number | null
          off_dates: string[] | null
          off_days: number[] | null
          plan_status: string | null
          profile_image_url: string | null
          rating: number | null
          subscription_end: string | null
          template_data: Json | null
          theme: string | null
          total_reviews: number | null
          trial_end_date: string | null
          trial_start_date: string | null
          unique_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          alarm_message?: string | null
          alarm_threshold?: number | null
          booking_end_time?: string | null
          booking_start_time?: string | null
          business_name?: string
          category?: string | null
          created_at?: string
          customer_message?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_bookings?: number | null
          off_dates?: string[] | null
          off_days?: number[] | null
          plan_status?: string | null
          profile_image_url?: string | null
          rating?: number | null
          subscription_end?: string | null
          template_data?: Json | null
          theme?: string | null
          total_reviews?: number | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          unique_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          alarm_message?: string | null
          alarm_threshold?: number | null
          booking_end_time?: string | null
          booking_start_time?: string | null
          business_name?: string
          category?: string | null
          created_at?: string
          customer_message?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_bookings?: number | null
          off_dates?: string[] | null
          off_days?: number[] | null
          plan_status?: string | null
          profile_image_url?: string | null
          rating?: number | null
          subscription_end?: string | null
          template_data?: Json | null
          theme?: string | null
          total_reviews?: number | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          unique_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_bookings: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          seller_id: string
          status: string
          token_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          seller_id: string
          status?: string
          token_number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          seller_id?: string
          status?: string
          token_number?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitor_logs: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          id: string
          ip_address: string | null
          os: string | null
          page_path: string
          referrer: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          os?: string | null
          page_path: string
          referrer?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          ip_address?: string | null
          os?: string | null
          page_path?: string
          referrer?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_all_bookings: { Args: never; Returns: Json }
      admin_get_all_sellers: { Args: never; Returns: Json }
      admin_get_all_users: { Args: never; Returns: Json }
      admin_get_stats: { Args: never; Returns: Json }
      admin_get_visitor_analytics: {
        Args: {
          p_browser?: string
          p_country?: string
          p_days?: number
          p_device_type?: string
          p_page_path?: string
        }
        Returns: Json
      }
      admin_toggle_seller_active: {
        Args: { p_active: boolean; p_seller_user_id: string }
        Returns: undefined
      }
      admin_upgrade_seller: {
        Args: { p_active: boolean; p_seller_user_id: string }
        Returns: undefined
      }
      create_booking: {
        Args: { p_customer_id: string; p_seller_id: string }
        Returns: Json
      }
      generate_seller_code: { Args: never; Returns: string }
      get_queue_data: { Args: { p_seller_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      submit_rating: {
        Args: {
          p_booking_id: string
          p_customer_id: string
          p_rating: number
          p_review?: string
          p_seller_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "customer" | "seller" | "admin"
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
    Enums: {
      app_role: ["customer", "seller", "admin"],
    },
  },
} as const
