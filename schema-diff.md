# Schema Diff: Code Expectations vs Staging Database

## ❌ Missing Column: `deal_rooms.deal_id`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `deal_room_members.created_at`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `deal_room_members.listing_broker_id`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `deal_room_members.requesting_broker_id`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `deal_requests.property_id`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `deal_requests.request_id`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `deal_requests.offer_price`
- **Classification:** Missing column
- **Expected Type:** number

## ❌ Missing Column: `deal_requests.commission_proposal`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `deal_requests.expected_closing_date`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `deal_requests.message`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `deal_requests.notes`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Table: `deal_timeline`
- **Classification:** Missing table
- **Required Columns:** id, created_at, room_id, action, actor_id, details

## ❌ Missing Column: `deal_messages.body`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Table: `staff_roles`
- **Classification:** Missing table
- **Required Columns:** id, created_at, user_id, role

## ❌ Missing Table: `activities`
- **Classification:** Missing table
- **Required Columns:** body, completed_at, created_at, deal_id, due_at, id, lead_id, owner_id, subject, type

## ❌ Missing Table: `admin_audit_log`
- **Classification:** Missing table
- **Required Columns:** action, actor_id, after, before, created_at, id, metadata, resource, resource_id

## ❌ Missing Table: `api_keys`
- **Classification:** Missing table
- **Required Columns:** created_at, created_by, hashed_key, id, last_used_at, name, prefix, revoked_at

## ❌ Missing Table: `blog_categories`
- **Classification:** Missing table
- **Required Columns:** created_at, description, id, name, slug

## ❌ Missing Table: `blog_post_tags`
- **Classification:** Missing table
- **Required Columns:** post_id, tag_id

## ❌ Missing Table: `blog_posts`
- **Classification:** Missing table
- **Required Columns:** author_id, body, category_id, cover_url, created_at, excerpt, id, published_at, reading_minutes, scheduled_at, seo_description, seo_title, slug, status, title, updated_at

## ❌ Missing Table: `blog_tags`
- **Classification:** Missing table
- **Required Columns:** created_at, id, name, slug

## ❌ Missing Table: `connections`
- **Classification:** Missing table
- **Required Columns:** addressee_id, created_at, id, message, requester_id, status, updated_at

## ❌ Missing Table: `conversations`
- **Classification:** Missing table
- **Required Columns:** broker_a, broker_b, created_at, id, last_message_at, listing_id

## ❌ Missing Table: `deals`
- **Classification:** Missing table
- **Required Columns:** created_at, expected_close_date, id, lead_id, listing_id, notes, owner_id, probability, stage, title, updated_at, value

## ❌ Missing Table: `form_submissions`
- **Classification:** Missing table
- **Required Columns:** created_at, form_id, id, ip_hash, payload, submitted_by, submitter_email

## ❌ Missing Table: `forms`
- **Classification:** Missing table
- **Required Columns:** created_at, created_by, description, id, name, notify_email, published, schema, slug, success_message, updated_at

## ❌ Missing Column: `kyc_documents.broker_id`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `kyc_documents.created_at`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `kyc_documents.doc_type`
- **Classification:** Missing column
- **Expected Type:** Database["public"]["Enums"]["kyc_doc_type"]

## ❌ Missing Column: `kyc_documents.reviewed_at`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `kyc_documents.reviewer_id`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `kyc_documents.reviewer_notes`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `kyc_documents.rejection_reason`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `kyc_documents.version`
- **Classification:** Missing column
- **Expected Type:** number

## ❌ Missing Table: `leads`
- **Classification:** Missing table
- **Required Columns:** budget_max, budget_min, city, created_at, email, full_name, id, notes, owner_id, phone, requirement, source, status, updated_at

## ❌ Missing Table: `listing_reports`
- **Classification:** Missing table
- **Required Columns:** assigned_to, attachments, created_at, description, id, listing_id, reason, reporter_id, resolution_notes, resolved_at, status, updated_at

## ❌ Missing Table: `listing_status_history`
- **Classification:** Missing table
- **Required Columns:** created_at, id, listing_id, moderator_id, new_status, notes, reason

## ❌ Missing Column: `listings.area_sqft`
- **Classification:** Missing column
- **Expected Type:** number

## ❌ Missing Column: `listings.bathrooms`
- **Classification:** Missing column
- **Expected Type:** number

## ❌ Missing Column: `listings.bedrooms`
- **Classification:** Missing column
- **Expected Type:** number

## ❌ Missing Column: `listings.broker_id`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `listings.featured_until`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `listings.listing_type`
- **Classification:** Missing column
- **Expected Type:** Database["public"]["Enums"]["listing_type"]

## ❌ Missing Column: `listings.locality`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `listings.moderation_notes`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `listings.moderation_status`
- **Classification:** Missing column
- **Expected Type:** Database["public"]["Enums"]["listing_moderation_status"]

## ❌ Missing Table: `media_assets`
- **Classification:** Missing table
- **Required Columns:** alt_text, created_at, filename, folder, height, id, mime_type, size_bytes, storage_path, updated_at, uploaded_by, width

## ❌ Missing Table: `messages`
- **Classification:** Missing table
- **Required Columns:** body, conversation_id, created_at, id, sender_id

## ❌ Missing Table: `nav_items`
- **Classification:** Missing table
- **Required Columns:** created_at, href, id, label, location, open_in_new_tab, parent_id, position, updated_at, visible

## ❌ Missing Column: `notifications.body`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `notifications.kind`
- **Classification:** Missing column
- **Expected Type:** Database["public"]["Enums"]["notification_kind"]

## ❌ Missing Column: `notifications.metadata`
- **Classification:** Missing column
- **Expected Type:** Json

## ❌ Missing Column: `notifications.read_at`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Table: `page_revisions`
- **Classification:** Missing table
- **Required Columns:** created_at, editor_id, id, page_id, reason, snapshot

## ❌ Missing Table: `page_sections`
- **Classification:** Missing table
- **Required Columns:** created_at, id, page_id, position, props, section_type, updated_at

## ❌ Missing Table: `pages`
- **Classification:** Missing table
- **Required Columns:** author_id, blocks, body, canonical_url, created_at, draft_blocks, draft_body, featured, icon, id, keywords, nav_order, og_image, page_type, parent_id, published_at, robots, scheduled_at, schema_jsonld, seo_description, seo_title, show_in_footer, show_in_nav, slug, status, template, theme, title, twitter_card, updated_at, visibility

## ❌ Missing Table: `permissions`
- **Classification:** Missing table
- **Required Columns:** action, created_at, description, id, resource

## ❌ Missing Column: `profiles.city`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `profiles.firm`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `profiles.internal_notes`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `profiles.kyc_submitted_at`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `profiles.onboarding_kyc_submitted`
- **Classification:** Missing column
- **Expected Type:** boolean

## ❌ Missing Column: `profiles.onboarding_listing_published`
- **Classification:** Missing column
- **Expected Type:** boolean

## ❌ Missing Column: `profiles.onboarding_network_started`
- **Classification:** Missing column
- **Expected Type:** boolean

## ❌ Missing Column: `profiles.onboarding_profile_completed`
- **Classification:** Missing column
- **Expected Type:** boolean

## ❌ Missing Column: `profiles.suspended_at`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `profiles.tags`
- **Classification:** Missing column
- **Expected Type:** string[]

## ❌ Missing Table: `role_permissions`
- **Classification:** Missing table
- **Required Columns:** created_at, id, permission_id, role

## ❌ Missing Table: `site_settings`
- **Classification:** Missing table
- **Required Columns:** brand_name, contact_phone, created_at, footer_html, id, seo_description, seo_title, singleton, social_links, support_email, updated_at

## ❌ Missing Column: `subscription_plans.code`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `subscription_plans.created_at`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `subscription_plans.description`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `subscription_plans.interval`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `subscription_plans.is_active`
- **Classification:** Missing column
- **Expected Type:** boolean

## ❌ Missing Column: `subscription_plans.listing_limit`
- **Classification:** Missing column
- **Expected Type:** number

## ❌ Missing Column: `subscription_plans.price_inr`
- **Classification:** Missing column
- **Expected Type:** number

## ❌ Missing Column: `subscription_plans.sort_order`
- **Classification:** Missing column
- **Expected Type:** number

## ❌ Missing Column: `subscription_plans.updated_at`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `subscription_plans.badge`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `subscription_plans.cta_text`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `subscription_plans.cta_url`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `subscription_plans.trial_days`
- **Classification:** Missing column
- **Expected Type:** number

## ❌ Missing Column: `subscription_plans.stripe_product_id`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `subscription_plans.razorpay_plan_id`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `subscription_plans.highlighted`
- **Classification:** Missing column
- **Expected Type:** boolean

## ❌ Missing Column: `subscriptions.canceled_at`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `subscriptions.external_ref`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `subscriptions.started_at`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `subscriptions.updated_at`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `subscriptions.user_id`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Table: `support_attachments`
- **Classification:** Missing table
- **Required Columns:** created_at, file_path, id, message_id, mime_type, size_bytes

## ❌ Missing Table: `support_internal_notes`
- **Classification:** Missing table
- **Required Columns:** author_id, body, created_at, id, thread_id

## ❌ Missing Column: `support_messages.body`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `support_messages.sender_id`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `support_threads.assigned_to`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `support_threads.closed_at`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `support_threads.last_message_at`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `support_threads.opener_id`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Column: `support_threads.priority`
- **Classification:** Missing column
- **Expected Type:** Database["public"]["Enums"]["support_priority"]

## ❌ Missing Column: `support_threads.updated_at`
- **Classification:** Missing column
- **Expected Type:** string

## ❌ Missing Table: `webhooks`
- **Classification:** Missing table
- **Required Columns:** created_at, created_by, events, id, is_active, name, secret, updated_at, url

