-- =====================================================
-- SCHEMA FIXES FOR GROWING TOGETHER APP
-- Run this in Supabase SQL Editor to fix schema mismatches
-- =====================================================

-- =====================================================
-- FIX 1: Add missing updated_at column to photos table
-- =====================================================

-- Add updated_at column if it doesn't exist
ALTER TABLE public.photos 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

-- Create trigger to auto-update updated_at for photos
CREATE OR REPLACE FUNCTION update_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS photos_updated_at_trigger ON public.photos;
CREATE TRIGGER photos_updated_at_trigger
BEFORE UPDATE ON public.photos
FOR EACH ROW
EXECUTE FUNCTION update_photos_updated_at();

-- =====================================================
-- FIX 2: Update rules table schema
-- =====================================================

-- Rename is_published to is_active if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rules' AND column_name = 'is_published'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rules' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.rules RENAME COLUMN is_published TO is_active;
  END IF;
END $$;

-- Add published_at column if it doesn't exist
ALTER TABLE public.rules 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Set published_at to created_at for existing published rules
UPDATE public.rules 
SET published_at = created_at 
WHERE is_active = true AND published_at IS NULL;

-- =====================================================
-- FIX 3: Ensure all required indexes exist
-- =====================================================

-- Index for photos queries
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON public.photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON public.photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON public.photos(created_at DESC);

-- Index for rules queries
CREATE INDEX IF NOT EXISTS idx_rules_is_active ON public.rules(is_active);
CREATE INDEX IF NOT EXISTS idx_rules_published_at ON public.rules(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_rules_created_by ON public.rules(created_by);


