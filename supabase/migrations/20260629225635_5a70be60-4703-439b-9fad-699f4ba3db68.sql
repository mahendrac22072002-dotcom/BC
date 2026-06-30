
ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS keywords text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS og_image text,
  ADD COLUMN IF NOT EXISTS twitter_card text NOT NULL DEFAULT 'summary_large_image',
  ADD COLUMN IF NOT EXISTS robots text NOT NULL DEFAULT 'index,follow',
  ADD COLUMN IF NOT EXISTS schema_jsonld jsonb,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS show_in_nav boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_in_footer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nav_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS draft_body text,
  ADD COLUMN IF NOT EXISTS draft_blocks jsonb;

-- Validate visibility values via trigger (time-independent so a CHECK would also work, but a trigger is consistent with project style).
CREATE OR REPLACE FUNCTION public.validate_page_visibility()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.visibility NOT IN ('public','logged_in','subscribers','admins') THEN
    RAISE EXCEPTION 'invalid visibility %', NEW.visibility;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_pages_validate_visibility ON public.pages;
CREATE TRIGGER trg_pages_validate_visibility
BEFORE INSERT OR UPDATE ON public.pages
FOR EACH ROW EXECUTE FUNCTION public.validate_page_visibility();

CREATE INDEX IF NOT EXISTS idx_pages_show_in_nav ON public.pages (show_in_nav, nav_order) WHERE show_in_nav;
CREATE INDEX IF NOT EXISTS idx_pages_show_in_footer ON public.pages (show_in_footer, nav_order) WHERE show_in_footer;
CREATE INDEX IF NOT EXISTS idx_pages_parent ON public.pages (parent_id);
