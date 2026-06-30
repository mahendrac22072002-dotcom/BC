-- 0003_seed.sql
-- Base seed data for BrokerConnect

INSERT INTO public.subscription_plans (name, price_monthly, features) VALUES
('Basic', 49.00, '{"listings_limit": 5, "deal_rooms": false}'::jsonb),
('Pro', 199.00, '{"listings_limit": 50, "deal_rooms": true, "priority_support": true}'::jsonb),
('Enterprise', 499.00, '{"listings_limit": -1, "deal_rooms": true, "white_glove": true}'::jsonb)
ON CONFLICT DO NOTHING;
