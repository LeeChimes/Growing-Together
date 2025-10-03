-- =====================================================
-- FIX: Add missing updated_at column to photos table
-- =====================================================

-- Add updated_at column if it doesn't exist
ALTER TABLE public.photos 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();

-- Create trigger to auto-update updated_at
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


