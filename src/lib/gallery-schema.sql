-- Gallery tables for the Growing Together app
-- Run this SQL in your Supabase SQL editor to create the gallery tables

-- Albums table
CREATE TABLE IF NOT EXISTS albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cover_photo TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
    caption TEXT,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_albums_created_by ON albums(created_by);
CREATE INDEX IF NOT EXISTS idx_albums_is_private ON albums(is_private);
CREATE INDEX IF NOT EXISTS idx_albums_created_at ON albums(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Albums policies
-- Allow users to see public albums and their own albums
CREATE POLICY "Albums are viewable by everyone if public or by owner" ON albums
    FOR SELECT USING (is_private = false OR created_by = auth.uid());

-- Allow users to create albums
CREATE POLICY "Users can create albums" ON albums
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Allow users to update their own albums
CREATE POLICY "Users can update their own albums" ON albums
    FOR UPDATE USING (created_by = auth.uid());

-- Allow users to delete their own albums
CREATE POLICY "Users can delete their own albums" ON albums
    FOR DELETE USING (created_by = auth.uid());

-- Photos policies
-- Allow users to see photos in public albums and their own photos
CREATE POLICY "Photos are viewable based on album privacy" ON photos
    FOR SELECT USING (
        album_id IS NULL OR
        EXISTS (
            SELECT 1 FROM albums 
            WHERE albums.id = photos.album_id 
            AND (albums.is_private = false OR albums.created_by = auth.uid())
        ) OR
        uploaded_by = auth.uid()
    );

-- Allow users to upload photos
CREATE POLICY "Users can upload photos" ON photos
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- Allow users to update their own photos
CREATE POLICY "Users can update their own photos" ON photos
    FOR UPDATE USING (uploaded_by = auth.uid());

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own photos" ON photos
    FOR DELETE USING (uploaded_by = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_albums_updated_at BEFORE UPDATE ON albums
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to authenticated users
GRANT ALL ON albums TO authenticated;
GRANT ALL ON photos TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;