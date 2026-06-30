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
      activities: {
        Row: {
          body: string | null
          completed_at: string | null
          created_at: string
          deal_id: string | null
          due_at: string | null
          id: string
          lead_id: string | null
          owner_id: string
          subject: string
          type: Database["public"]["Enums"]["activity_type"]
        }
        Insert: {
          body?: string | null
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          owner_id: string
          subject: string
          type: Database["public"]["Enums"]["activity_type"]
        }
        Update: {
          body?: string | null
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string
          subject?: string
          type?: Database["public"]["Enums"]["activity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          metadata: Json | null
          resource: string
          resource_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          resource: string
          resource_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          resource?: string
          resource_id?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          hashed_key: string
          id: string
          last_used_at: string | null
          name: string
          prefix: string
          revoked_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          hashed_key: string
          id?: string
          last_used_at?: string | null
          name: string
          prefix: string
          revoked_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          hashed_key?: string
          id?: string
          last_used_at?: string | null
          name?: string
          prefix?: string
          revoked_at?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          body: string
          category_id: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          reading_minutes: number
          scheduled_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["blog_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          reading_minutes?: number
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["blog_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          reading_minutes?: number
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["blog_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          message: string | null
          requester_id: string
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          message?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          message?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          broker_a: string
          broker_b: string
          created_at: string
          id: string
          last_message_at: string
          listing_id: string | null
        }
        Insert: {
          broker_a: string
          broker_b: string
          created_at?: string
          id?: string
          last_message_at?: string
          listing_id?: string | null
        }
        Update: {
          broker_a?: string
          broker_b?: string
          created_at?: string
          id?: string
          last_message_at?: string
          listing_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          created_at: string
          expected_close_date: string | null
          id: string
          lead_id: string | null
          listing_id: string | null
          notes: string | null
          owner_id: string
          probability: number | null
          stage: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          created_at?: string
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          listing_id?: string | null
          notes?: string | null
          owner_id: string
          probability?: number | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          created_at?: string
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          listing_id?: string | null
          notes?: string | null
          owner_id?: string
          probability?: number | null
          stage?: Database["public"]["Enums"]["deal_stage"]
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          created_at: string
          form_id: string
          id: string
          ip_hash: string | null
          payload: Json
          submitted_by: string | null
          submitter_email: string | null
        }
        Insert: {
          created_at?: string
          form_id: string
          id?: string
          ip_hash?: string | null
          payload?: Json
          submitted_by?: string | null
          submitter_email?: string | null
        }
        Update: {
          created_at?: string
          form_id?: string
          id?: string
          ip_hash?: string | null
          payload?: Json
          submitted_by?: string | null
          submitter_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          notify_email: string | null
          published: boolean
          schema: Json
          slug: string
          success_message: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          notify_email?: string | null
          published?: boolean
          schema?: Json
          slug: string
          success_message?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          notify_email?: string | null
          published?: boolean
          schema?: Json
          slug?: string
          success_message?: string
          updated_at?: string
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          broker_id: string
          created_at: string
          doc_type: Database["public"]["Enums"]["kyc_doc_type"]
          file_path: string
          id: string
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["kyc_doc_status"]
          rejection_reason: string | null
          version: number
        }
        Insert: {
          broker_id: string
          created_at?: string
          doc_type: Database["public"]["Enums"]["kyc_doc_type"]
          file_path: string
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["kyc_doc_status"]
          rejection_reason?: string | null
          version?: number
        }
        Update: {
          broker_id?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["kyc_doc_type"]
          file_path?: string
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["kyc_doc_status"]
          rejection_reason?: string | null
          version?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          owner_id: string
          phone: string | null
          requirement: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          owner_id: string
          phone?: string | null
          requirement?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          requirement?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: []
      }
      listing_reports: {
        Row: {
          assigned_to: string | null
          attachments: Json
          created_at: string
          description: string | null
          id: string
          listing_id: string
          reason: string
          reporter_id: string
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["listing_report_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json
          created_at?: string
          description?: string | null
          id?: string
          listing_id: string
          reason: string
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["listing_report_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json
          created_at?: string
          description?: string | null
          id?: string
          listing_id?: string
          reason?: string
          reporter_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["listing_report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_reports_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_status_history: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          moderator_id: string | null
          new_status: Database["public"]["Enums"]["listing_moderation_status"]
          notes: string | null
          previous_status:
            | Database["public"]["Enums"]["listing_moderation_status"]
            | null
          reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          moderator_id?: string | null
          new_status: Database["public"]["Enums"]["listing_moderation_status"]
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["listing_moderation_status"]
            | null
          reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          moderator_id?: string | null
          new_status?: Database["public"]["Enums"]["listing_moderation_status"]
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["listing_moderation_status"]
            | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_status_history_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          area_sqft: number | null
          bathrooms: number | null
          bedrooms: number | null
          broker_id: string
          city: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          featured_until: string | null
          id: string
          listing_type: Database["public"]["Enums"]["listing_type"]
          locality: string | null
          moderation_notes: string | null
          moderation_status: Database["public"]["Enums"]["listing_moderation_status"]
          price: number | null
          property_type: Database["public"]["Enums"]["property_type"]
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
        }
        Insert: {
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          broker_id: string
          city: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          featured_until?: string | null
          id?: string
          listing_type?: Database["public"]["Enums"]["listing_type"]
          locality?: string | null
          moderation_notes?: string | null
          moderation_status?: Database["public"]["Enums"]["listing_moderation_status"]
          price?: number | null
          property_type?: Database["public"]["Enums"]["property_type"]
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
        }
        Update: {
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          broker_id?: string
          city?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          featured_until?: string | null
          id?: string
          listing_type?: Database["public"]["Enums"]["listing_type"]
          locality?: string | null
          moderation_notes?: string | null
          moderation_status?: Database["public"]["Enums"]["listing_moderation_status"]
          price?: number | null
          property_type?: Database["public"]["Enums"]["property_type"]
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          alt_text: string | null
          created_at: string
          filename: string
          folder: string
          height: number | null
          id: string
          mime_type: string
          size_bytes: number
          storage_path: string
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          filename: string
          folder?: string
          height?: number | null
          id?: string
          mime_type: string
          size_bytes?: number
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          filename?: string
          folder?: string
          height?: number | null
          id?: string
          mime_type?: string
          size_bytes?: number
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      nav_items: {
        Row: {
          created_at: string
          href: string
          id: string
          label: string
          location: Database["public"]["Enums"]["nav_location"]
          open_in_new_tab: boolean
          parent_id: string | null
          position: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          href: string
          id?: string
          label: string
          location?: Database["public"]["Enums"]["nav_location"]
          open_in_new_tab?: boolean
          parent_id?: string | null
          position?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          href?: string
          id?: string
          label?: string
          location?: Database["public"]["Enums"]["nav_location"]
          open_in_new_tab?: boolean
          parent_id?: string | null
          position?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "nav_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "nav_items"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link: string | null
          metadata: Json
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          metadata?: Json
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          metadata?: Json
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      page_revisions: {
        Row: {
          created_at: string
          editor_id: string | null
          id: string
          page_id: string
          reason: string | null
          snapshot: Json
        }
        Insert: {
          created_at?: string
          editor_id?: string | null
          id?: string
          page_id: string
          reason?: string | null
          snapshot: Json
        }
        Update: {
          created_at?: string
          editor_id?: string | null
          id?: string
          page_id?: string
          reason?: string | null
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "page_revisions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_sections: {
        Row: {
          created_at: string
          id: string
          page_id: string
          position: number
          props: Json
          section_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_id: string
          position?: number
          props?: Json
          section_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          page_id?: string
          position?: number
          props?: Json
          section_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          author_id: string | null
          blocks: Json
          body: string | null
          canonical_url: string | null
          created_at: string
          draft_blocks: Json | null
          draft_body: string | null
          featured: boolean
          icon: string | null
          id: string
          keywords: string | null
          nav_order: number
          og_image: string | null
          page_type: string
          parent_id: string | null
          published_at: string | null
          robots: string
          scheduled_at: string | null
          schema_jsonld: Json | null
          seo_description: string | null
          seo_title: string | null
          show_in_footer: boolean
          show_in_nav: boolean
          slug: string
          status: Database["public"]["Enums"]["page_status"]
          template: string
          theme: Json
          title: string
          twitter_card: string
          updated_at: string
          visibility: string
        }
        Insert: {
          author_id?: string | null
          blocks?: Json
          body?: string | null
          canonical_url?: string | null
          created_at?: string
          draft_blocks?: Json | null
          draft_body?: string | null
          featured?: boolean
          icon?: string | null
          id?: string
          keywords?: string | null
          nav_order?: number
          og_image?: string | null
          page_type?: string
          parent_id?: string | null
          published_at?: string | null
          robots?: string
          scheduled_at?: string | null
          schema_jsonld?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          show_in_footer?: boolean
          show_in_nav?: boolean
          slug: string
          status?: Database["public"]["Enums"]["page_status"]
          template?: string
          theme?: Json
          title: string
          twitter_card?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_id?: string | null
          blocks?: Json
          body?: string | null
          canonical_url?: string | null
          created_at?: string
          draft_blocks?: Json | null
          draft_body?: string | null
          featured?: boolean
          icon?: string | null
          id?: string
          keywords?: string | null
          nav_order?: number
          og_image?: string | null
          page_type?: string
          parent_id?: string | null
          published_at?: string | null
          robots?: string
          scheduled_at?: string | null
          schema_jsonld?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          show_in_footer?: boolean
          show_in_nav?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["page_status"]
          template?: string
          theme?: Json
          title?: string
          twitter_card?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          resource: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          resource: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          resource?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          firm: string | null
          full_name: string | null
          id: string
          internal_notes: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          kyc_submitted_at: string | null
          onboarding_kyc_submitted: boolean
          onboarding_listing_published: boolean
          onboarding_network_started: boolean
          onboarding_profile_completed: boolean
          phone: string | null
          suspended_at: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          firm?: string | null
          full_name?: string | null
          id: string
          internal_notes?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          kyc_submitted_at?: string | null
          onboarding_kyc_submitted?: boolean
          onboarding_listing_published?: boolean
          onboarding_network_started?: boolean
          onboarding_profile_completed?: boolean
          phone?: string | null
          suspended_at?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          firm?: string | null
          full_name?: string | null
          id?: string
          internal_notes?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          kyc_submitted_at?: string | null
          onboarding_kyc_submitted?: boolean
          onboarding_listing_published?: boolean
          onboarding_network_started?: boolean
          onboarding_profile_completed?: boolean
          phone?: string | null
          suspended_at?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          brand_name: string
          contact_phone: string | null
          created_at: string
          footer_html: string | null
          id: string
          seo_description: string | null
          seo_title: string | null
          singleton: boolean
          social_links: Json
          support_email: string | null
          updated_at: string
        }
        Insert: {
          brand_name?: string
          contact_phone?: string | null
          created_at?: string
          footer_html?: string | null
          id?: string
          seo_description?: string | null
          seo_title?: string | null
          singleton?: boolean
          social_links?: Json
          support_email?: string | null
          updated_at?: string
        }
        Update: {
          brand_name?: string
          contact_phone?: string | null
          created_at?: string
          footer_html?: string | null
          id?: string
          seo_description?: string | null
          seo_title?: string | null
          singleton?: boolean
          social_links?: Json
          support_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          code: string
          created_at: string
          description: string | null
          features: Json
          id: string
          interval: string
          is_active: boolean
          listing_limit: number | null
          name: string
          price_inr: number
          sort_order: number
          updated_at: string
          badge: string | null
          cta_text: string | null
          cta_url: string | null
          trial_days: number | null
          stripe_product_id: string | null
          razorpay_plan_id: string | null
          highlighted: boolean | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          listing_limit?: number | null
          name: string
          price_inr?: number
          sort_order?: number
          updated_at?: string
          badge?: string | null
          cta_text?: string | null
          cta_url?: string | null
          trial_days?: number | null
          stripe_product_id?: string | null
          razorpay_plan_id?: string | null
          highlighted?: boolean | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          interval?: string
          is_active?: boolean
          listing_limit?: number | null
          name?: string
          price_inr?: number
          sort_order?: number
          updated_at?: string
          badge?: string | null
          cta_text?: string | null
          cta_url?: string | null
          trial_days?: number | null
          stripe_product_id?: string | null
          razorpay_plan_id?: string | null
          highlighted?: boolean | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          external_ref: string | null
          id: string
          plan_id: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          external_ref?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          external_ref?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_attachments: {
        Row: {
          created_at: string
          file_path: string
          id: string
          message_id: string
          mime_type: string | null
          size_bytes: number | null
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          message_id: string
          mime_type?: string | null
          size_bytes?: number | null
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          message_id?: string
          mime_type?: string | null
          size_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "support_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      support_internal_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          thread_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          thread_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_internal_notes_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      support_threads: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          id: string
          last_message_at: string
          opener_id: string
          priority: Database["public"]["Enums"]["support_priority"]
          status: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          opener_id: string
          priority?: Database["public"]["Enums"]["support_priority"]
          status?: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          opener_id?: string
          priority?: Database["public"]["Enums"]["support_priority"]
          status?: Database["public"]["Enums"]["support_status"]
          subject?: string
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
      webhooks: {
        Row: {
          created_at: string
          created_by: string | null
          events: string[]
          id: string
          is_active: boolean
          name: string
          secret: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          events?: string[]
          id?: string
          is_active?: boolean
          name: string
          secret?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          events?: string[]
          id?: string
          is_active?: boolean
          name?: string
          secret?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_permission: {
        Args: { _action: string; _resource: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_type:
        | "call"
        | "email"
        | "meeting"
        | "site_visit"
        | "note"
        | "task"
      app_role: "broker" | "staff" | "admin"
      blog_status: "draft" | "scheduled" | "published" | "archived"
      connection_status: "pending" | "accepted" | "declined"
      deal_stage:
        | "prospect"
        | "site_visit"
        | "offer"
        | "agreement"
        | "closed_won"
        | "closed_lost"
      kyc_doc_status: "uploaded" | "approved" | "rejected"
      kyc_doc_type:
        | "aadhaar"
        | "pan"
        | "rera"
        | "license"
        | "other"
        | "broker_photo"
        | "visiting_card"
        | "office_photo"
      kyc_status: "pending" | "in_review" | "verified" | "rejected"
      lead_source:
        | "website"
        | "referral"
        | "marketplace"
        | "cold_call"
        | "social"
        | "event"
        | "other"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "won"
        | "lost"
      listing_moderation_status:
        | "pending"
        | "approved"
        | "rejected"
        | "hidden"
        | "changes_requested"
      listing_report_status:
        | "open"
        | "assigned"
        | "resolved"
        | "dismissed"
        | "escalated"
      listing_status: "draft" | "active" | "closed"
      listing_type: "sale" | "rent" | "lease"
      nav_location: "header" | "footer"
      notification_kind:
        | "kyc_approved"
        | "kyc_rejected"
        | "listing_approved"
        | "listing_rejected"
        | "listing_hidden"
        | "listing_featured"
        | "support_reply"
        | "subscription_expiring"
        | "system_announcement"
        | "report_update"
      page_status: "draft" | "published" | "scheduled" | "archived"
      property_type:
        | "apartment"
        | "villa"
        | "plot"
        | "commercial"
        | "office"
        | "retail"
        | "warehouse"
        | "other"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "expired"
      support_priority: "low" | "normal" | "high" | "urgent"
      support_status: "open" | "pending" | "resolved" | "closed"
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
      activity_type: ["call", "email", "meeting", "site_visit", "note", "task"],
      app_role: ["broker", "staff", "admin"],
      blog_status: ["draft", "scheduled", "published", "archived"],
      connection_status: ["pending", "accepted", "declined"],
      deal_stage: [
        "prospect",
        "site_visit",
        "offer",
        "agreement",
        "closed_won",
        "closed_lost",
      ],
      kyc_doc_status: ["uploaded", "approved", "rejected"],
      kyc_doc_type: [
        "aadhaar",
        "pan",
        "rera",
        "license",
        "other",
        "broker_photo",
        "visiting_card",
        "office_photo",
      ],
      kyc_status: ["pending", "in_review", "verified", "rejected"],
      lead_source: [
        "website",
        "referral",
        "marketplace",
        "cold_call",
        "social",
        "event",
        "other",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiation",
        "won",
        "lost",
      ],
      listing_moderation_status: [
        "pending",
        "approved",
        "rejected",
        "hidden",
        "changes_requested",
      ],
      listing_report_status: [
        "open",
        "assigned",
        "resolved",
        "dismissed",
        "escalated",
      ],
      listing_status: ["draft", "active", "closed"],
      listing_type: ["sale", "rent", "lease"],
      nav_location: ["header", "footer"],
      notification_kind: [
        "kyc_approved",
        "kyc_rejected",
        "listing_approved",
        "listing_rejected",
        "listing_hidden",
        "listing_featured",
        "support_reply",
        "subscription_expiring",
        "system_announcement",
        "report_update",
      ],
      page_status: ["draft", "published", "scheduled", "archived"],
      property_type: [
        "apartment",
        "villa",
        "plot",
        "commercial",
        "office",
        "retail",
        "warehouse",
        "other",
      ],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "expired",
      ],
      support_priority: ["low", "normal", "high", "urgent"],
      support_status: ["open", "pending", "resolved", "closed"],
    },
  },
} as const
