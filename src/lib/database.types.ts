
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
      action_items: {
        Row: {
          created_at: string
          id: string
          project_id: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string | null
          summary: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id?: string | null
          summary?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      linked_jira_items: {
        Row: {
          created_at: string
          id: string
          jira_key: string
          jira_title: string
          jira_url: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          jira_key: string
          jira_title: string
          jira_url: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          jira_key?: string
          jira_title?: string
          jira_url?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linked_jira_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          prd_url: string | null
          summary: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          prd_url?: string | null
          summary?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          prd_url?: string | null
          summary?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: number
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: number
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: number
          key?: string
          updated_at?: string
          value?: string
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
