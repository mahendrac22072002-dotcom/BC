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
          type: string
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
          type: string
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
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_activities_deal_id"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_activities_lead_id"
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
            foreignKeyName: "fk_blog_post_tags_post_id"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_blog_post_tags_tag_id"
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
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
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
          status?: string
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
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_blog_posts_category_id"
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
      broker_staff: {
        Row: {
          broker_id: string | null
          created_at: string | null
          id: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          broker_id?: string | null
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          broker_id?: string | null
          created_at?: string | null
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_staff_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      brokers: {
        Row: {
          created_at: string | null
          id: string
          license_number: string | null
          name: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          license_number?: string | null
          name: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          license_number?: string | null
          name?: string
          verified?: boolean | null
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
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          message?: string | null
          requester_id: string
          status: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          message?: string | null
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
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
          last_message_at: string
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
            foreignKeyName: "fk_conversations_listing_id"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room_id: string
          sender_id: string | null
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          room_id: string
          sender_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "deal_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_requests: {
        Row: {
          commission_proposal: string | null
          created_at: string
          expected_closing_date: string | null
          id: string
          listing_broker_id: string | null
          listing_id: string | null
          message: string | null
          notes: string | null
          offer_price: number | null
          property_id: string | null
          request_id: string | null
          requesting_broker_id: string | null
          status: string
        }
        Insert: {
          commission_proposal?: string | null
          created_at?: string
          expected_closing_date?: string | null
          id?: string
          listing_broker_id?: string | null
          listing_id?: string | null
          message?: string | null
          notes?: string | null
          offer_price?: number | null
          property_id?: string | null
          request_id?: string | null
          requesting_broker_id?: string | null
          status?: string
        }
        Update: {
          commission_proposal?: string | null
          created_at?: string
          expected_closing_date?: string | null
          id?: string
          listing_broker_id?: string | null
          listing_id?: string | null
          message?: string | null
          notes?: string | null
          offer_price?: number | null
          property_id?: string | null
          request_id?: string | null
          requesting_broker_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_requests_listing_broker_id_fkey"
            columns: ["listing_broker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_requests_requesting_broker_id_fkey"
            columns: ["requesting_broker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_room_members: {
        Row: {
          created_at: string | null
          id: string
          joined_at: string | null
          listing_broker_id: string | null
          requesting_broker_id: string | null
          role: string | null
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          listing_broker_id?: string | null
          requesting_broker_id?: string | null
          role?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          listing_broker_id?: string | null
          requesting_broker_id?: string | null
          role?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "deal_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_rooms: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          property_id: string
          request_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          property_id: string
          request_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          property_id?: string
          request_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_rooms_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "deal_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_deal_rooms_deal_id"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_timeline: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
          room_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          room_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          room_id?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          created_at: string
          expected_close_date: string | null
          id: string
          lead_id: string | null
          listing_id: string
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
          listing_id: string
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
          listing_id?: string
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
            foreignKeyName: "fk_deals_lead_id"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_deals_listing_id"
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
          payload: Json
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
            foreignKeyName: "fk_form_submissions_form_id"
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
          schema: Json
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
          created_at: string | null
          doc_type: string | null
          document_type: string
          file_path: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: string | null
          uploaded_at: string | null
          user_id: string | null
          version: number | null
        }
        Insert: {
          broker_id: string
          created_at?: string | null
          doc_type?: string | null
          document_type: string
          file_path: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string | null
          uploaded_at?: string | null
          user_id?: string | null
          version?: number | null
        }
        Update: {
          broker_id?: string
          created_at?: string | null
          doc_type?: string | null
          document_type?: string
          file_path?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string | null
          uploaded_at?: string | null
          user_id?: string | null
          version?: number | null
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
      listing_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          listing_id: string | null
          position: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          listing_id?: string | null
          position?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          listing_id?: string | null
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
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
          attachments: Json
          created_at?: string
          description?: string | null
          id?: string
          listing_id: string
          reason: string
          reporter_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status: Database["public"]["Enums"]["listing_report_status"]
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
            foreignKeyName: "fk_listing_reports_listing_id"
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
          new_status: string
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
          new_status: string
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
          new_status?: string
          notes?: string | null
          previous_status?:
            | Database["public"]["Enums"]["listing_moderation_status"]
            | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_listing_status_history_listing_id"
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
          city: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          featured_until: string | null
          id: string
          listing_broker_id: string | null
          listing_type: string | null
          locality: string | null
          moderation_notes: string | null
          moderation_status:
            | Database["public"]["Enums"]["listing_moderation_status"]
            | null
          price: number | null
          property_type: string | null
          state: string | null
          status: string | null
          title: string
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          broker_id: string
          city?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          featured_until?: string | null
          id?: string
          listing_broker_id?: string | null
          listing_type?: string | null
          locality?: string | null
          moderation_notes?: string | null
          moderation_status?:
            | Database["public"]["Enums"]["listing_moderation_status"]
            | null
          price?: number | null
          property_type?: string | null
          state?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          broker_id?: string
          city?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          featured_until?: string | null
          id?: string
          listing_broker_id?: string | null
          listing_type?: string | null
          locality?: string | null
          moderation_notes?: string | null
          moderation_status?:
            | Database["public"]["Enums"]["listing_moderation_status"]
            | null
          price?: number | null
          property_type?: string | null
          state?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          size_bytes: number
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
            foreignKeyName: "fk_messages_conversation_id"
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
          location: string
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
          location: string
          open_in_new_tab?: boolean
          parent_id?: string | null
          position: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          href?: string
          id?: string
          label?: string
          location?: string
          open_in_new_tab?: boolean
          parent_id?: string | null
          position?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fk_nav_items_parent_id"
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
          created_at: string | null
          id: string
          kind: Database["public"]["Enums"]["notification_kind"] | null
          link: string | null
          message: string | null
          metadata: Json | null
          read: boolean | null
          read_at: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"] | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"] | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          read_at?: string | null
          title?: string
          user_id?: string | null
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
            foreignKeyName: "fk_page_revisions_page_id"
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
          position: number
          props: Json
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
            foreignKeyName: "fk_page_sections_page_id"
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
          status: string
          template: string
          theme: Json
          title: string
          twitter_card: string
          updated_at: string
          visibility: string
        }
        Insert: {
          author_id?: string | null
          blocks: Json
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
          page_type: string
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
          status?: string
          template: string
          theme: Json
          title: string
          twitter_card: string
          updated_at?: string
          visibility: string
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
          status?: string
          template?: string
          theme?: Json
          title?: string
          twitter_card?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pages_parent_id"
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
          company_name: string | null
          created_at: string
          firm: string | null
          first_name: string | null
          full_name: string | null
          id: string
          internal_notes: string | null
          kyc_status: string | null
          kyc_submitted_at: string | null
          last_name: string | null
          onboarding_kyc_submitted: boolean | null
          onboarding_listing_published: boolean | null
          onboarding_network_started: boolean | null
          onboarding_profile_completed: boolean | null
          phone: string | null
          suspended_at: string | null
          tags: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          firm?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          internal_notes?: string | null
          kyc_status?: string | null
          kyc_submitted_at?: string | null
          last_name?: string | null
          onboarding_kyc_submitted?: boolean | null
          onboarding_listing_published?: boolean | null
          onboarding_network_started?: boolean | null
          onboarding_profile_completed?: boolean | null
          phone?: string | null
          suspended_at?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          firm?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          internal_notes?: string | null
          kyc_status?: string | null
          kyc_submitted_at?: string | null
          last_name?: string | null
          onboarding_kyc_submitted?: boolean | null
          onboarding_listing_published?: boolean | null
          onboarding_network_started?: boolean | null
          onboarding_profile_completed?: boolean | null
          phone?: string | null
          suspended_at?: string | null
          tags?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_role_permissions_permission_id"
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
          brand_name: string
          contact_phone?: string | null
          created_at?: string
          footer_html?: string | null
          id?: string
          seo_description?: string | null
          seo_title?: string | null
          singleton: boolean
          social_links: Json
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
      staff_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          badge: string | null
          code: string | null
          created_at: string | null
          cta_text: string | null
          cta_url: string | null
          description: string | null
          features: Json | null
          highlighted: boolean | null
          id: string
          interval: string | null
          is_active: boolean | null
          listing_limit: number | null
          name: string
          price_inr: number | null
          price_monthly: number
          razorpay_plan_id: string | null
          sort_order: number
          stripe_product_id: string | null
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          badge?: string | null
          code?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          features?: Json | null
          highlighted?: boolean | null
          id?: string
          interval?: string | null
          is_active?: boolean | null
          listing_limit?: number | null
          name: string
          price_inr?: number | null
          price_monthly?: number
          razorpay_plan_id?: string | null
          sort_order?: number
          stripe_product_id?: string | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          badge?: string | null
          code?: string | null
          created_at?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          features?: Json | null
          highlighted?: boolean | null
          id?: string
          interval?: string | null
          is_active?: boolean | null
          listing_limit?: number | null
          name?: string
          price_inr?: number | null
          price_monthly?: number
          razorpay_plan_id?: string | null
          sort_order?: number
          stripe_product_id?: string | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          broker_id: string | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          external_ref: string | null
          id: string
          plan_id: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          broker_id?: string | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          external_ref?: string | null
          id?: string
          plan_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          broker_id?: string | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          external_ref?: string | null
          id?: string
          plan_id?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_subscriptions_plan_id"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "fk_support_attachments_message_id"
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
            foreignKeyName: "fk_support_internal_notes_thread_id"
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
          user_id: string | null
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          sender_id: string
          thread_id: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          thread_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_support_messages_thread_id"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
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
          created_at: string | null
          id: string
          last_message_at: string | null
          opener_id: string
          priority: string
          status: string
          subject: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          opener_id: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          opener_id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
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
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "broker" | "staff" | "admin"
      blog_status: "draft" | "scheduled" | "published" | "archived"
      connection_status:
        | "pending"
        | "accepted"
        | "declined"
        | "prospect"
        | "site_visit"
        | "offer"
        | "agreement"
        | "closed_won"
        | "closed_lost"
      deal_stage:
        | "prospect"
        | "site_visit"
        | "offer"
        | "negotiation"
        | "won"
        | "lost"
        | "agreement"
        | "closed_won"
        | "closed_lost"
      kyc_doc_status:
        | "uploaded"
        | "approved"
        | "rejected"
        | "aadhaar"
        | "pan"
        | "rera"
        | "license"
        | "other"
        | "broker_photo"
        | "visiting_card"
        | "office_photo"
      kyc_status:
        | "pending"
        | "in_review"
        | "verified"
        | "rejected"
        | "website"
        | "referral"
        | "marketplace"
        | "cold_call"
        | "social"
        | "event"
        | "other"
        | "new"
        | "contacted"
        | "qualified"
        | "proposal"
        | "negotiation"
        | "won"
        | "lost"
        | "approved"
        | "hidden"
        | "changes_requested"
        | "open"
        | "assigned"
        | "resolved"
        | "dismissed"
        | "escalated"
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
        | "changes_requested"
        | "hidden"
      listing_report_status:
        | "open"
        | "resolved"
        | "dismissed"
        | "pending"
        | "assigned"
        | "escalated"
      listing_status: "draft" | "active" | "closed"
      listing_type: "sale" | "rent" | "lease"
      nav_location:
        | "header"
        | "footer"
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
      notification_kind:
        | "listing_approved"
        | "listing_rejected"
        | "listing_hidden"
        | "listing_featured"
        | "kyc_approved"
        | "kyc_rejected"
        | "support_reply"
        | "subscription_expiring"
        | "system_announcement"
        | "report_update"
      page_status:
        | "draft"
        | "published"
        | "scheduled"
        | "archived"
        | "apartment"
        | "villa"
        | "plot"
        | "commercial"
        | "office"
        | "retail"
        | "warehouse"
        | "other"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "expired"
      page_visibility: "public" | "private" | "authenticated"
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
      app_role: ["broker", "staff", "admin"],
      blog_status: ["draft", "scheduled", "published", "archived"],
      connection_status: [
        "pending",
        "accepted",
        "declined",
        "prospect",
        "site_visit",
        "offer",
        "agreement",
        "closed_won",
        "closed_lost",
      ],
      deal_stage: [
        "prospect",
        "site_visit",
        "offer",
        "negotiation",
        "won",
        "lost",
        "agreement",
        "closed_won",
        "closed_lost",
      ],
      kyc_doc_status: [
        "uploaded",
        "approved",
        "rejected",
        "aadhaar",
        "pan",
        "rera",
        "license",
        "other",
        "broker_photo",
        "visiting_card",
        "office_photo",
      ],
      kyc_status: [
        "pending",
        "in_review",
        "verified",
        "rejected",
        "website",
        "referral",
        "marketplace",
        "cold_call",
        "social",
        "event",
        "other",
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiation",
        "won",
        "lost",
        "approved",
        "hidden",
        "changes_requested",
        "open",
        "assigned",
        "resolved",
        "dismissed",
        "escalated",
      ],
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
        "changes_requested",
        "hidden",
      ],
      listing_report_status: [
        "open",
        "resolved",
        "dismissed",
        "pending",
        "assigned",
        "escalated",
      ],
      listing_status: ["draft", "active", "closed"],
      listing_type: ["sale", "rent", "lease"],
      nav_location: [
        "header",
        "footer",
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
      notification_kind: [
        "listing_approved",
        "listing_rejected",
        "listing_hidden",
        "listing_featured",
        "kyc_approved",
        "kyc_rejected",
        "support_reply",
        "subscription_expiring",
        "system_announcement",
        "report_update",
      ],
      page_status: [
        "draft",
        "published",
        "scheduled",
        "archived",
        "apartment",
        "villa",
        "plot",
        "commercial",
        "office",
        "retail",
        "warehouse",
        "other",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "expired",
      ],
      page_visibility: ["public", "private", "authenticated"],
      support_priority: ["low", "normal", "high", "urgent"],
      support_status: ["open", "pending", "resolved", "closed"],
    },
  },
} as const
