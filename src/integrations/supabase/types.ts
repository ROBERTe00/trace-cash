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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          criteria: Json | null
          description: string | null
          icon: string | null
          id: string
          name: string
          points_reward: number | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          points_reward?: number | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          points_reward?: number | null
        }
        Relationships: []
      }
      ai_audit_logs: {
        Row: {
          ai_model: string
          ai_raw_response: string
          error: string | null
          feature: string
          id: string
          input_prompt: string
          latency_ms: number | null
          success: boolean | null
          temperature: number | null
          timestamp: string | null
          ui_summary: string | null
          user_id: string
        }
        Insert: {
          ai_model: string
          ai_raw_response: string
          error?: string | null
          feature: string
          id?: string
          input_prompt: string
          latency_ms?: number | null
          success?: boolean | null
          temperature?: number | null
          timestamp?: string | null
          ui_summary?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string
          ai_raw_response?: string
          error?: string | null
          feature?: string
          id?: string
          input_prompt?: string
          latency_ms?: number | null
          success?: boolean | null
          temperature?: number | null
          timestamp?: string | null
          ui_summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_feedback: {
        Row: {
          amount: number | null
          applied: boolean | null
          context: Json | null
          corrected_category: string
          created_at: string | null
          description: string
          id: string
          original_category: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          applied?: boolean | null
          context?: Json | null
          corrected_category: string
          created_at?: string | null
          description: string
          id?: string
          original_category: string
          user_id: string
        }
        Update: {
          amount?: number | null
          applied?: boolean | null
          context?: Json | null
          corrected_category?: string
          created_at?: string | null
          description?: string
          id?: string
          original_category?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          success: boolean
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          success?: boolean
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bank_statements: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          id: string
          status: string | null
          upload_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          id?: string
          status?: string | null
          upload_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          id?: string
          status?: string | null
          upload_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      budget_limits: {
        Row: {
          alert_threshold: number | null
          category: string
          created_at: string | null
          id: string
          monthly_limit: number
          user_id: string
        }
        Insert: {
          alert_threshold?: number | null
          category: string
          created_at?: string | null
          id?: string
          monthly_limit: number
          user_id: string
        }
        Update: {
          alert_threshold?: number | null
          category?: string
          created_at?: string | null
          id?: string
          monthly_limit?: number
          user_id?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          challenge_type: string | null
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          points_reward: number | null
          start_date: string
          target_value: number | null
          title: string
        }
        Insert: {
          challenge_type?: string | null
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          points_reward?: number | null
          start_date: string
          target_value?: number | null
          title: string
        }
        Update: {
          challenge_type?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          points_reward?: number | null
          start_date?: string
          target_value?: number | null
          title?: string
        }
        Relationships: []
      }
      community_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          parent_id: string | null
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          parent_id?: string | null
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          parent_id?: string | null
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts_public"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts_public"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          likes_count: number | null
          portfolio_data: Json | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          likes_count?: number | null
          portfolio_data?: Json | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          likes_count?: number | null
          portfolio_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string
          id: string
          linked_investment_id: string | null
          recurrence_type: string | null
          recurring: boolean | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date: string
          description: string
          id?: string
          linked_investment_id?: string | null
          recurrence_type?: string | null
          recurring?: boolean | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          linked_investment_id?: string | null
          recurrence_type?: string | null
          recurring?: boolean | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_linked_investment_id_fkey"
            columns: ["linked_investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_goals: {
        Row: {
          created_at: string | null
          current_amount: number | null
          deadline: string | null
          description: string | null
          goal_type: string
          id: string
          investment_link: string | null
          linked_asset_type: string | null
          priority: string | null
          status: string | null
          target_amount: number
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          description?: string | null
          goal_type?: string
          id?: string
          investment_link?: string | null
          linked_asset_type?: string | null
          priority?: string | null
          status?: string | null
          target_amount: number
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          description?: string | null
          goal_type?: string
          id?: string
          investment_link?: string | null
          linked_asset_type?: string | null
          priority?: string | null
          status?: string | null
          target_amount?: number
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      investment_suggestions: {
        Row: {
          amount_suggested: number | null
          asset_type: string | null
          confidence_score: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          reasoning: string | null
          status: string | null
          suggestion_type: string
          user_id: string
        }
        Insert: {
          amount_suggested?: number | null
          asset_type?: string | null
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          reasoning?: string | null
          status?: string | null
          suggestion_type: string
          user_id: string
        }
        Update: {
          amount_suggested?: number | null
          asset_type?: string | null
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          reasoning?: string | null
          status?: string | null
          suggestion_type?: string
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          category: string | null
          created_at: string | null
          current_price: number
          id: string
          live_tracking: boolean | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number
          quantity: number
          sector: string | null
          symbol: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_price: number
          id?: string
          live_tracking?: boolean | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price: number
          quantity: number
          sector?: string | null
          symbol?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_price?: number
          id?: string
          live_tracking?: boolean | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number
          quantity?: number
          sector?: string | null
          symbol?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leaderboard_entries: {
        Row: {
          achievements_count: number | null
          anonymous_name: string | null
          created_at: string | null
          id: string
          level: number | null
          period: string | null
          rank: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievements_count?: number | null
          anonymous_name?: string | null
          created_at?: string | null
          id?: string
          level?: number | null
          period?: string | null
          rank?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievements_count?: number | null
          anonymous_name?: string | null
          created_at?: string | null
          id?: string
          level?: number | null
          period?: string | null
          rank?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mfa_credentials: {
        Row: {
          counter: number
          created_at: string | null
          credential_id: string
          device_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string | null
          credential_id: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string | null
          credential_id?: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          subscription: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          subscription: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          subscription?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          acknowledged: boolean | null
          alert_type: string
          created_at: string | null
          details: Json | null
          id: string
          message: string
          severity: string
          user_id: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          alert_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          message: string
          severity: string
          user_id?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          alert_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          message?: string
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      shared_templates: {
        Row: {
          created_at: string | null
          description: string | null
          downloads_count: number | null
          id: string
          is_public: boolean | null
          rating: number | null
          template_data: Json
          template_name: string
          template_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          downloads_count?: number | null
          id?: string
          is_public?: boolean | null
          rating?: number | null
          template_data: Json
          template_name: string
          template_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          downloads_count?: number | null
          id?: string
          is_public?: boolean | null
          rating?: number | null
          template_data?: Json
          template_name?: string
          template_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      template_ratings: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number | null
          template_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          template_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number | null
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_ratings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "shared_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          progress: number | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          progress?: number | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          progress: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_levels: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          level: number | null
          longest_streak: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          longest_streak?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          longest_streak?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          assets: Json | null
          cash_available: number | null
          created_at: string | null
          debts: Json | null
          id: string
          income_sources: Json | null
          investment_interest: string | null
          main_goal: string | null
          monthly_budget: string | null
          monthly_income: number | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          subscription_expires_at: string | null
          subscription_tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assets?: Json | null
          cash_available?: number | null
          created_at?: string | null
          debts?: Json | null
          id?: string
          income_sources?: Json | null
          investment_interest?: string | null
          main_goal?: string | null
          monthly_budget?: string | null
          monthly_income?: number | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assets?: Json | null
          cash_available?: number | null
          created_at?: string | null
          debts?: Json | null
          id?: string
          income_sources?: Json | null
          investment_interest?: string | null
          main_goal?: string | null
          monthly_budget?: string | null
          monthly_income?: number | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string
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
      community_likes_count: {
        Row: {
          likes_count: number | null
          post_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts_public"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts_public: {
        Row: {
          content: string | null
          created_at: string | null
          id: string | null
          is_anonymous: boolean | null
          likes_count: number | null
          portfolio_data: Json | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          likes_count?: number | null
          portfolio_data?: Json | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_anonymous?: boolean | null
          likes_count?: number | null
          portfolio_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_savings_potential: {
        Args: { p_threshold?: number; p_user_id: string }
        Returns: {
          available_savings: number
          monthly_expenses: number
          monthly_income: number
          savings_rate: number
          suggestion: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
