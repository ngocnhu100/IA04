-- Seed example users
-- Uses pgcrypto's crypt() + gen_salt('bf') to generate bcrypt-compatible hashes server-side
-- Passwords used below (change as desired):
--  - alice@example.com -> Password123! (admin)
--  - bob@example.com   -> Password123! (user)

-- Ensure extensions (no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

INSERT INTO public.users (email, password, role)
VALUES
  ('alice@example.com', crypt('Password123!', gen_salt('bf', 10)), 'admin'),
  ('bob@example.com',   crypt('Password123!', gen_salt('bf', 10)), 'user')
ON CONFLICT (email) DO NOTHING;
