-- Drop the overly permissive INSERT policy on skills if it exists
DROP POLICY IF EXISTS "Anyone can insert skills" ON public.skills;

-- Skills are pre-seeded, so we just need authenticated users to be able to read them
-- No need for INSERT policy since skills are managed by admins