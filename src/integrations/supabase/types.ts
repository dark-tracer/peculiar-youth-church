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
      articles: {
        Row: {
          author_name: string | null
          body: string | null
          column_name: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          edition_label: string | null
          episode_number: number | null
          excerpt: string | null
          id: string
          publish_date: string | null
          reading_minutes: number | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          body?: string | null
          column_name?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          edition_label?: string | null
          episode_number?: number | null
          excerpt?: string | null
          id?: string
          publish_date?: string | null
          reading_minutes?: number | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          body?: string | null
          column_name?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          edition_label?: string | null
          episode_number?: number | null
          excerpt?: string | null
          id?: string
          publish_date?: string | null
          reading_minutes?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      artworks: {
        Row: {
          allow_download: boolean
          artist_name: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          featured: boolean
          id: string
          image_url: string | null
          scripture: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[] | null
          title: string
          updated_at: string
          watermark: boolean
        }
        Insert: {
          allow_download?: boolean
          artist_name?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          scripture?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          watermark?: boolean
        }
        Update: {
          allow_download?: boolean
          artist_name?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          scripture?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          watermark?: boolean
        }
        Relationships: []
      }
      bible_studies: {
        Row: {
          audience: string | null
          body: string | null
          created_at: string
          created_by: string | null
          discussion_questions: string[] | null
          id: string
          key_takeaway: string | null
          leader_name: string | null
          objective: string | null
          pdf_url: string | null
          resource_url: string | null
          scripture: string | null
          series_name: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          study_number: number | null
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          discussion_questions?: string[] | null
          id?: string
          key_takeaway?: string | null
          leader_name?: string | null
          objective?: string | null
          pdf_url?: string | null
          resource_url?: string | null
          scripture?: string | null
          series_name?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          study_number?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          discussion_questions?: string[] | null
          id?: string
          key_takeaway?: string | null
          leader_name?: string | null
          objective?: string | null
          pdf_url?: string | null
          resource_url?: string | null
          scripture?: string | null
          series_name?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          study_number?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string | null
          body: string | null
          category: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          excerpt: string | null
          id: string
          publish_date: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          body?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          publish_date?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          body?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          publish_date?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          contact_info: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string | null
          featured: boolean
          id: string
          location: string | null
          registration_url: string | null
          slug: string
          start_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          contact_info?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          featured?: boolean
          id?: string
          location?: string | null
          registration_url?: string | null
          slug: string
          start_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          contact_info?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          featured?: boolean
          id?: string
          location?: string | null
          registration_url?: string | null
          slug?: string
          start_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          bucket: string
          content_type: string | null
          created_at: string
          id: string
          mime_type: string | null
          name: string
          path: string
          size_bytes: number | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          bucket: string
          content_type?: string | null
          created_at?: string
          id?: string
          mime_type?: string | null
          name: string
          path: string
          size_bytes?: number | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          bucket?: string
          content_type?: string | null
          created_at?: string
          id?: string
          mime_type?: string | null
          name?: string
          path?: string
          size_bytes?: number | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sermon_series: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      sermons: {
        Row: {
          audio_url: string | null
          created_at: string
          created_by: string | null
          date_preached: string
          description: string | null
          featured: boolean
          id: string
          notes_pdf_url: string | null
          preacher_id: string | null
          preacher_name: string
          scripture: string | null
          series_id: string | null
          series_name: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          created_by?: string | null
          date_preached: string
          description?: string | null
          featured?: boolean
          id?: string
          notes_pdf_url?: string | null
          preacher_id?: string | null
          preacher_name: string
          scripture?: string | null
          series_id?: string | null
          series_name?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          created_by?: string | null
          date_preached?: string
          description?: string | null
          featured?: boolean
          id?: string
          notes_pdf_url?: string | null
          preacher_id?: string | null
          preacher_name?: string
          scripture?: string | null
          series_id?: string | null
          series_name?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sermons_preacher_id_fkey"
            columns: ["preacher_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sermons_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "sermon_series"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          facebook_url: string | null
          giving_note: string | null
          id: number
          instagram_url: string | null
          site_title: string
          tagline: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          facebook_url?: string | null
          giving_note?: string | null
          id?: number
          instagram_url?: string | null
          site_title?: string
          tagline?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          facebook_url?: string | null
          giving_note?: string | null
          id?: number
          instagram_url?: string | null
          site_title?: string
          tagline?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          name: string
          photo_url: string | null
          social_links: Json | null
          title: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          social_links?: Json | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          social_links?: Json | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_editor: { Args: { _user_id: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      super_admin_email: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "super_admin" | "editor" | "admin"
      content_status: "draft" | "published" | "scheduled"
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
      app_role: ["super_admin", "editor", "admin"],
      content_status: ["draft", "published", "scheduled"],
    },
  },
} as const
