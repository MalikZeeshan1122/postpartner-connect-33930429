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
      brands: {
        Row: {
          brand_voice: Json | null
          created_at: string
          guidelines: string | null
          id: string
          name: string
          sample_posts: string[] | null
          updated_at: string
          user_id: string
          visual_identity: Json | null
          website_url: string | null
        }
        Insert: {
          brand_voice?: Json | null
          created_at?: string
          guidelines?: string | null
          id?: string
          name: string
          sample_posts?: string[] | null
          updated_at?: string
          user_id: string
          visual_identity?: Json | null
          website_url?: string | null
        }
        Update: {
          brand_voice?: Json | null
          created_at?: string
          guidelines?: string | null
          id?: string
          name?: string
          sample_posts?: string[] | null
          updated_at?: string
          user_id?: string
          visual_identity?: Json | null
          website_url?: string | null
        }
        Relationships: []
      }
      content_plans: {
        Row: {
          brand_id: string
          created_at: string
          description: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          description?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_plans_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_items: {
        Row: {
          created_at: string
          cta: string | null
          extra_context: string | null
          id: string
          intent: string
          plan_id: string
          platform: string
          scheduled_date: string | null
          status: string
          tone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          cta?: string | null
          extra_context?: string | null
          id?: string
          intent: string
          plan_id: string
          platform: string
          scheduled_date?: string | null
          status?: string
          tone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          cta?: string | null
          extra_context?: string | null
          id?: string
          intent?: string
          plan_id?: string
          platform?: string
          scheduled_date?: string | null
          status?: string
          tone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "content_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      post_variations: {
        Row: {
          caption: string
          created_at: string
          feedback_notes: Json | null
          feedback_score: number | null
          id: string
          image_prompt: string | null
          image_url: string | null
          is_selected: boolean
          iteration: number
          plan_item_id: string
          platform: string
          text_overlay: string | null
          user_id: string
        }
        Insert: {
          caption: string
          created_at?: string
          feedback_notes?: Json | null
          feedback_score?: number | null
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          is_selected?: boolean
          iteration?: number
          plan_item_id: string
          platform: string
          text_overlay?: string | null
          user_id: string
        }
        Update: {
          caption?: string
          created_at?: string
          feedback_notes?: Json | null
          feedback_score?: number | null
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          is_selected?: boolean
          iteration?: number
          plan_item_id?: string
          platform?: string
          text_overlay?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_variations_plan_item_id_fkey"
            columns: ["plan_item_id"]
            isOneToOne: false
            referencedRelation: "plan_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          goal: string | null
          id: string
          notify_email_digest: boolean
          notify_post_reminders: boolean
          notify_weekly_report: boolean
          onboarding_completed: boolean
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          goal?: string | null
          id?: string
          notify_email_digest?: boolean
          notify_post_reminders?: boolean
          notify_weekly_report?: boolean
          onboarding_completed?: boolean
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          goal?: string | null
          id?: string
          notify_email_digest?: boolean
          notify_post_reminders?: boolean
          notify_weekly_report?: boolean
          onboarding_completed?: boolean
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          brand_id: string | null
          caption: string
          created_at: string
          cta_text: string | null
          format: string
          id: string
          image_url: string | null
          platform: string
          scheduled_at: string
          status: string
          text_overlay: string | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          brand_id?: string | null
          caption: string
          created_at?: string
          cta_text?: string | null
          format?: string
          id?: string
          image_url?: string | null
          platform: string
          scheduled_at: string
          status?: string
          text_overlay?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          brand_id?: string | null
          caption?: string
          created_at?: string
          cta_text?: string | null
          format?: string
          id?: string
          image_url?: string | null
          platform?: string
          scheduled_at?: string
          status?: string
          text_overlay?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_posts: {
        Row: {
          brand_name: string | null
          caption: string
          created_at: string
          cta_text: string | null
          feedback_notes: string | null
          feedback_score: number | null
          format: string
          id: string
          image_url: string | null
          platform: string
          share_token: string
          text_overlay: string | null
          user_id: string
        }
        Insert: {
          brand_name?: string | null
          caption: string
          created_at?: string
          cta_text?: string | null
          feedback_notes?: string | null
          feedback_score?: number | null
          format?: string
          id?: string
          image_url?: string | null
          platform: string
          share_token?: string
          text_overlay?: string | null
          user_id: string
        }
        Update: {
          brand_name?: string | null
          caption?: string
          created_at?: string
          cta_text?: string | null
          feedback_notes?: string | null
          feedback_score?: number | null
          format?: string
          id?: string
          image_url?: string | null
          platform?: string
          share_token?: string
          text_overlay?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_connections: {
        Row: {
          account_name: string | null
          connected: boolean
          connected_at: string | null
          created_at: string
          id: string
          platform: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          connected?: boolean
          connected_at?: string | null
          created_at?: string
          id?: string
          platform: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          connected?: boolean
          connected_at?: string | null
          created_at?: string
          id?: string
          platform?: string
          user_id?: string
        }
        Relationships: []
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
