-- Insert Founder Story Blog Post
INSERT INTO blog_posts (
  id,
  title,
  slug,
  excerpt,
  body,
  cover_url,
  status,
  published_at,
  seo_title,
  seo_description,
  reading_minutes
) VALUES (
  gen_random_uuid(),
  'Why BrokersConnect Exists',
  'why-brokersconnect-exists',
  'Learn about the origins of BrokersConnect, India''s trusted broker collaboration platform, and why we are building the trust layer for Indian real estate.',
  '## Why BrokersConnect Exists
Explain how the idea started. We saw professionals struggling with tools that weren''t built for them. We realized that a dedicated B2B platform was needed, one that focused entirely on the needs of brokers, not buyers.

## The Problem
Describe why brokers lose genuine buyers because they don''t have matching inventory. Too often, brokers lose deals to fake leads, duplicate listings, or untrustworthy counterparts. The lack of a verified network means time is wasted on unqualified prospects and ghost inventory.

## The Opportunity
Explain broker-to-broker collaboration. By pooling resources with trusted peers, brokers can multiply their closing potential and service buyers perfectly.

## Our Mission
> No genuine buyer should ever be lost because one broker lacks inventory.

## Our Vision
Build India''s most trusted broker network. To become the standard operating system for India''s real estate brokers, where every genuine transaction originates from a trusted, verified connection.

## Message From the Founder
Trust is the product. We''d rather grow slowly with verified brokers than quickly with anonymous ones. BrokersConnect is built around three non-negotiables: verification before access, moderation before publication, and transparency in every interaction. We are building this platform for you — professional, not promotional; built in India, for India.

## Why BrokersConnect is Different
* Authentic Inventory
* Trusted Broker Network
* Professional Collaboration
* Secure Deal Rooms
* Faster Closings',
  '/founder.jpeg',
  'published',
  now(),
  'Why BrokersConnect Exists',
  'Learn about the origins of BrokersConnect, India''s trusted broker collaboration platform, and why we are building the trust layer for Indian real estate.',
  4
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  excerpt = EXCLUDED.excerpt,
  cover_url = EXCLUDED.cover_url,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;
