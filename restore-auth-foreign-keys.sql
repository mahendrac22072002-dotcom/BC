-- This script recreates ONLY the foreign keys that have been verified to have NO orphan rows.
-- Tables with orphan rows have been intentionally excluded to prevent execution failure.

DO $$
BEGIN
    -- 1. listing_reports(reporter_id) -> auth.users(id)
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname='listing_reports_reporter_id_fkey'
    ) THEN
        ALTER TABLE public.listing_reports
        ADD CONSTRAINT listing_reports_reporter_id_fkey
        FOREIGN KEY (reporter_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;
    END IF;

    -- 2. media_assets(uploaded_by) -> auth.users(id)
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname='media_assets_uploaded_by_fkey'
    ) THEN
        ALTER TABLE public.media_assets
        ADD CONSTRAINT media_assets_uploaded_by_fkey
        FOREIGN KEY (uploaded_by)
        REFERENCES auth.users(id)
        ON DELETE SET NULL;
    END IF;

    -- 3. webhooks(created_by) -> auth.users(id)
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname='webhooks_created_by_fkey'
    ) THEN
        ALTER TABLE public.webhooks
        ADD CONSTRAINT webhooks_created_by_fkey
        FOREIGN KEY (created_by)
        REFERENCES auth.users(id)
        ON DELETE SET NULL;
    END IF;

END $$;
