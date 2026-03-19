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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blueprint_runs: {
        Row: {
          blueprint: Json
          created_at: string
          id: string
          project_id: string
        }
        Insert: {
          blueprint?: Json
          created_at?: string
          id?: string
          project_id: string
        }
        Update: {
          blueprint?: Json
          created_at?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blueprint_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "setup_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      capability_registry: {
        Row: {
          capability_name: string
          capability_slug: string
          compatible_provider_types: Json
          created_at: string
          description: string
          display_order: number
          icon: string | null
          id: string
        }
        Insert: {
          capability_name: string
          capability_slug: string
          compatible_provider_types?: Json
          created_at?: string
          description: string
          display_order?: number
          icon?: string | null
          id?: string
        }
        Update: {
          capability_name?: string
          capability_slug?: string
          compatible_provider_types?: Json
          created_at?: string
          description?: string
          display_order?: number
          icon?: string | null
          id?: string
        }
        Relationships: []
      }
      command_events: {
        Row: {
          actor: string
          command_id: string
          created_at: string
          details: Json | null
          event_type: string
          id: string
        }
        Insert: {
          actor: string
          command_id: string
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          actor?: string
          command_id?: string
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "command_events_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "commands"
            referencedColumns: ["id"]
          },
        ]
      }
      command_outputs: {
        Row: {
          command_id: string
          created_at: string
          output_text: string
          truncated: boolean
        }
        Insert: {
          command_id: string
          created_at?: string
          output_text: string
          truncated?: boolean
        }
        Update: {
          command_id?: string
          created_at?: string
          output_text?: string
          truncated?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "command_outputs_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: true
            referencedRelation: "commands"
            referencedColumns: ["id"]
          },
        ]
      }
      command_plans: {
        Row: {
          created_at: string
          id: string
          machine_id: string
          project_id: string
          status: string
          step_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          machine_id: string
          project_id: string
          status?: string
          step_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          machine_id?: string
          project_id?: string
          status?: string
          step_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "command_plans_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "command_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "setup_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "command_plans_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "setup_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      commands: {
        Row: {
          argv_json: Json
          created_at: string
          cwd: string | null
          env_allowlist_json: Json | null
          exit_code: number | null
          finished_at: string | null
          id: string
          plan_id: string
          requires_approval: boolean
          risk_tier: string
          seq: number
          started_at: string | null
          state: string
          updated_at: string
        }
        Insert: {
          argv_json: Json
          created_at?: string
          cwd?: string | null
          env_allowlist_json?: Json | null
          exit_code?: number | null
          finished_at?: string | null
          id?: string
          plan_id: string
          requires_approval?: boolean
          risk_tier: string
          seq: number
          started_at?: string | null
          state?: string
          updated_at?: string
        }
        Update: {
          argv_json?: Json
          created_at?: string
          cwd?: string | null
          env_allowlist_json?: Json | null
          exit_code?: number | null
          finished_at?: string | null
          id?: string
          plan_id?: string
          requires_approval?: boolean
          risk_tier?: string
          seq?: number
          started_at?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commands_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "command_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      credential_requirements: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_required: boolean
          key_name: string
          project_id: string
          provider: string | null
          status: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_required?: boolean
          key_name: string
          project_id: string
          provider?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_required?: boolean
          key_name?: string
          project_id?: string
          provider?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_requirements_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "setup_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      framework_credential_requirements: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_name: string
          docs_url: string | null
          env_var_name: string
          format_hint: string | null
          framework_id: string
          id: string
          provider: string | null
          required: boolean
          sort_order: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          docs_url?: string | null
          env_var_name: string
          format_hint?: string | null
          framework_id: string
          id?: string
          provider?: string | null
          required?: boolean
          sort_order?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          docs_url?: string | null
          env_var_name?: string
          format_hint?: string | null
          framework_id?: string
          id?: string
          provider?: string | null
          required?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "framework_credential_requirements_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      framework_prerequisites: {
        Row: {
          check_command: string | null
          created_at: string
          expected_version: string | null
          framework_id: string
          id: string
          install_command_linux: string | null
          install_command_mac: string | null
          install_command_windows: string | null
          install_url: string | null
          name: string
          required: boolean
          sort_order: number
        }
        Insert: {
          check_command?: string | null
          created_at?: string
          expected_version?: string | null
          framework_id: string
          id?: string
          install_command_linux?: string | null
          install_command_mac?: string | null
          install_command_windows?: string | null
          install_url?: string | null
          name: string
          required?: boolean
          sort_order?: number
        }
        Update: {
          check_command?: string | null
          created_at?: string
          expected_version?: string | null
          framework_id?: string
          id?: string
          install_command_linux?: string | null
          install_command_mac?: string | null
          install_command_windows?: string | null
          install_url?: string | null
          name?: string
          required?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "framework_prerequisites_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      framework_setup_steps: {
        Row: {
          category: string | null
          column_name: string
          created_at: string
          description: string | null
          estimated_minutes: number | null
          framework_id: string
          id: string
          sort_order: number
          title: string
          verify_command: string | null
          verify_expected: string | null
        }
        Insert: {
          category?: string | null
          column_name: string
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          framework_id: string
          id?: string
          sort_order?: number
          title: string
          verify_command?: string | null
          verify_expected?: string | null
        }
        Update: {
          category?: string | null
          column_name?: string
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          framework_id?: string
          id?: string
          sort_order?: number
          title?: string
          verify_command?: string | null
          verify_expected?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "framework_setup_steps_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      frameworks: {
        Row: {
          config_format: string | null
          config_path: string | null
          created_at: string
          default_port: number | null
          docs_url: string | null
          github_url: string | null
          icon_color: string | null
          icon_letter: string | null
          id: string
          install_command: string | null
          language: string | null
          min_ram_mb: number | null
          min_storage_mb: number | null
          name: string
          slug: string
          status: string
          tagline: string | null
        }
        Insert: {
          config_format?: string | null
          config_path?: string | null
          created_at?: string
          default_port?: number | null
          docs_url?: string | null
          github_url?: string | null
          icon_color?: string | null
          icon_letter?: string | null
          id?: string
          install_command?: string | null
          language?: string | null
          min_ram_mb?: number | null
          min_storage_mb?: number | null
          name: string
          slug: string
          status?: string
          tagline?: string | null
        }
        Update: {
          config_format?: string | null
          config_path?: string | null
          created_at?: string
          default_port?: number | null
          docs_url?: string | null
          github_url?: string | null
          icon_color?: string | null
          icon_letter?: string | null
          id?: string
          install_command?: string | null
          language?: string | null
          min_ram_mb?: number | null
          min_storage_mb?: number | null
          name?: string
          slug?: string
          status?: string
          tagline?: string | null
        }
        Relationships: []
      }
      machines: {
        Row: {
          created_at: string
          id: string
          last_seen_at: string | null
          machine_fingerprint: string | null
          machine_label: string
          os_family: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen_at?: string | null
          machine_fingerprint?: string | null
          machine_label: string
          os_family: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_at?: string | null
          machine_fingerprint?: string | null
          machine_label?: string
          os_family?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pairing_attempts: {
        Row: {
          attempted_at: string
          id: string
          ip_address: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          ip_address: string
        }
        Update: {
          attempted_at?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      pairing_codes: {
        Row: {
          code: string
          consumed_at: string | null
          consumed_machine_id: string | null
          created_at: string
          expires_at: string
          user_id: string
        }
        Insert: {
          code: string
          consumed_at?: string | null
          consumed_machine_id?: string | null
          created_at?: string
          expires_at: string
          user_id: string
        }
        Update: {
          code?: string
          consumed_at?: string | null
          consumed_machine_id?: string | null
          created_at?: string
          expires_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pairing_codes_consumed_machine_id_fkey"
            columns: ["consumed_machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_capabilities: {
        Row: {
          capability: string
          config_json: Json | null
          created_at: string
          id: string
          model: string | null
          notes: string | null
          priority: number
          project_id: string
          provider_slug: string | null
        }
        Insert: {
          capability: string
          config_json?: Json | null
          created_at?: string
          id?: string
          model?: string | null
          notes?: string | null
          priority?: number
          project_id: string
          provider_slug?: string | null
        }
        Update: {
          capability?: string
          config_json?: Json | null
          created_at?: string
          id?: string
          model?: string | null
          notes?: string | null
          priority?: number
          project_id?: string
          provider_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_capabilities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "setup_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_capabilities_provider_slug_fkey"
            columns: ["provider_slug"]
            isOneToOne: false
            referencedRelation: "provider_registry"
            referencedColumns: ["provider_slug"]
          },
        ]
      }
      project_channels: {
        Row: {
          channel: string
          created_at: string
          id: string
          is_primary: boolean
          project_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          is_primary?: boolean
          project_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_channels_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "setup_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_environment: {
        Row: {
          created_at: string
          id: string
          node_version: string | null
          os: string
          project_id: string
          windows_mode: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          node_version?: string | null
          os: string
          project_id: string
          windows_mode?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          node_version?: string | null
          os?: string
          project_id?: string
          windows_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_environment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "setup_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_goals: {
        Row: {
          created_at: string
          description: string | null
          goal: string
          id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          goal: string
          id?: string
          project_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          goal?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_goals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "setup_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_step_status: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          project_id: string
          status: string
          step_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          project_id: string
          status?: string
          step_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string
          status?: string
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_step_status_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "setup_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_step_status_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "framework_setup_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_registry: {
        Row: {
          created_at: string
          display_order: number
          env_var_name: string | null
          id: string
          logo_icon: string | null
          pricing_note: string | null
          provider_name: string
          provider_slug: string
          provider_type: string
          signup_url: string | null
          supports_capabilities: Json
        }
        Insert: {
          created_at?: string
          display_order?: number
          env_var_name?: string | null
          id?: string
          logo_icon?: string | null
          pricing_note?: string | null
          provider_name: string
          provider_slug: string
          provider_type: string
          signup_url?: string | null
          supports_capabilities?: Json
        }
        Update: {
          created_at?: string
          display_order?: number
          env_var_name?: string | null
          id?: string
          logo_icon?: string | null
          pricing_note?: string | null
          provider_name?: string
          provider_slug?: string
          provider_type?: string
          signup_url?: string | null
          supports_capabilities?: Json
        }
        Relationships: []
      }
      setup_projects: {
        Row: {
          created_at: string
          framework_id: string
          id: string
          mode: string
          name: string
          skill_level: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          framework_id: string
          id?: string
          mode?: string
          name?: string
          skill_level?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          framework_id?: string
          id?: string
          mode?: string
          name?: string
          skill_level?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "setup_projects_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "frameworks"
            referencedColumns: ["id"]
          },
        ]
      }
      setup_steps: {
        Row: {
          category: string
          estimated_minutes: number
          id: string
          risk_level: string
          sort_order: number
          step_code: string
          title: string
        }
        Insert: {
          category: string
          estimated_minutes?: number
          id?: string
          risk_level?: string
          sort_order?: number
          step_code: string
          title: string
        }
        Update: {
          category?: string
          estimated_minutes?: number
          id?: string
          risk_level?: string
          sort_order?: number
          step_code?: string
          title?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          plan_status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan_status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      validation_runs: {
        Row: {
          check_type: string
          created_at: string
          id: string
          message: string | null
          passed: boolean
          project_id: string
        }
        Insert: {
          check_type: string
          created_at?: string
          id?: string
          message?: string | null
          passed?: boolean
          project_id: string
        }
        Update: {
          check_type?: string
          created_at?: string
          id?: string
          message?: string | null
          passed?: boolean
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "setup_projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      owns_command: { Args: { _command_id: string }; Returns: boolean }
      owns_command_plan: { Args: { _plan_id: string }; Returns: boolean }
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
