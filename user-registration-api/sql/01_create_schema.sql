-- PostgreSQL schema for IA04 user registration API
-- Safe to run multiple times (IF NOT EXISTS)

-- 1) Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid() and crypt()

-- 2) Create table: users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  password varchar(255) NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

-- 3) Ensure a unique constraint on email
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND constraint_name = 'uq_users_email'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT uq_users_email UNIQUE (email);
  END IF;
END$$;
