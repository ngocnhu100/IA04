-- Seed example users
-- Uses pgcrypto's crypt() + gen_salt('bf') to generate bcrypt-compatible hashes server-side
-- Passwords used below (change as desired):
--  - alice@example.com -> Password123!
--  - bob@example.com   -> Password123!

-- Ensure extensions (no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

INSERT INTO public.users (email, password)
VALUES
  ('alice@example.com', crypt('Password123!', gen_salt('bf', 10))),
  ('bob@example.com',   crypt('Password123!', gen_salt('bf', 10)))
ON CONFLICT (email) DO NOTHING;
