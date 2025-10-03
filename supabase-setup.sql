-- =====================================================
-- Growing Together - Complete Supabase Database Setup
-- =====================================================
-- Run this entire script in your Supabase SQL Editor
-- Project: https://supabase.com/dashboard/project/yphxxvjpgmpozbgfrkva
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('admin', 'member', 'guest')),
  plot_number TEXT,
  phone TEXT,
  emergency_contact TEXT,
  join_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 2. PLOTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.plots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER NOT NULL UNIQUE,
  size TEXT NOT NULL,
  holder_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant', 'pending')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. DIARY ENTRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.diary_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plot_id UUID REFERENCES public.plots(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'general',
  plant_id TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  weather TEXT,
  temperature REAL,
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT NOT NULL,
  max_attendees INTEGER,
  bring_list JSONB DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_cancelled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. EVENT RSVPs TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
  bringing_items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- =====================================================
-- 6. POSTS TABLE (Community Feed)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  photos JSONB DEFAULT '[]'::jsonb,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_announcement BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 7. COMMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CHECK ((post_id IS NOT NULL AND event_id IS NULL) OR (post_id IS NULL AND event_id IS NOT NULL))
);

-- =====================================================
-- 8. REACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'love', 'helpful', 'celebrate')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL)),
  UNIQUE(post_id, user_id, type),
  UNIQUE(comment_id, user_id, type)
);

-- =====================================================
-- 9. TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('personal', 'site')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'accepted', 'in_progress', 'completed', 'overdue')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  proof_photos JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'maintenance', 'planting', 'harvesting', 'cleaning', 'repair', 'inspection', 'community')),
  estimated_duration INTEGER, -- in minutes
  location TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 9.1. TASK ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id) -- Prevent duplicate assignments
);

-- =====================================================
-- 10. ALBUMS TABLE (Gallery)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  cover_photo TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 11. PHOTOS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE,
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 12. INSPECTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plot_id UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  inspection_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  use_status TEXT NOT NULL CHECK (use_status IN ('active', 'inactive', 'partial')),
  upkeep TEXT NOT NULL CHECK (upkeep IN ('excellent', 'good', 'fair', 'poor')),
  issues JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  action TEXT NOT NULL CHECK (action IN ('none', 'advisory', 'notice', 'warning')),
  reinspect_by DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 13. RULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 14. RULE ACKNOWLEDGEMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rule_acknowledgements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.rules(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, rule_id)
);

-- =====================================================
-- 15. DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('insurance', 'lease', 'notice', 'form', 'other')),
  file_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 16. JOIN CODES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.join_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'guest')),
  max_uses INTEGER,
  uses_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 17. CHAT MESSAGES TABLE (Community Chat)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 18. RECIPES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  ingredients JSONB DEFAULT '[]'::jsonb,
  steps JSONB DEFAULT '[]'::jsonb,
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read all profiles, update their own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- PLOTS: Everyone can read, admins can manage
CREATE POLICY "Plots are viewable by everyone" ON public.plots FOR SELECT USING (true);
CREATE POLICY "Admins can manage plots" ON public.plots FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- DIARY ENTRIES: Users can manage their own entries, admins can read all
CREATE POLICY "Users can view their own diary entries" ON public.diary_entries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all diary entries" ON public.diary_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can create their own diary entries" ON public.diary_entries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own diary entries" ON public.diary_entries FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own diary entries" ON public.diary_entries FOR DELETE USING (user_id = auth.uid());

-- EVENTS: Everyone can read, members+ can create, creators can update/delete
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Members can create events" ON public.events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member'))
);
CREATE POLICY "Creators can update their events" ON public.events FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Creators can delete their events" ON public.events FOR DELETE USING (created_by = auth.uid());

-- EVENT RSVPs: Everyone can manage their own RSVPs
CREATE POLICY "Users can view all RSVPs" ON public.event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can create their own RSVPs" ON public.event_rsvps FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own RSVPs" ON public.event_rsvps FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own RSVPs" ON public.event_rsvps FOR DELETE USING (user_id = auth.uid());

-- POSTS: Everyone can read, members+ can create, creators/admins can update/delete
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Members can create posts" ON public.posts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'member'))
);
CREATE POLICY "Creators can update their posts" ON public.posts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can update any post" ON public.posts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Creators can delete their posts" ON public.posts FOR DELETE USING (user_id = auth.uid());

-- COMMENTS: Everyone can read, authenticated can create, creators can update/delete
CREATE POLICY "Comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creators can update their comments" ON public.comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Creators can delete their comments" ON public.comments FOR DELETE USING (user_id = auth.uid());

-- REACTIONS: Everyone can read, authenticated can manage their own
CREATE POLICY "Reactions are viewable by everyone" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Users can create their own reactions" ON public.reactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own reactions" ON public.reactions FOR DELETE USING (user_id = auth.uid());

-- TASKS: Everyone can read, creators/assigned can manage
CREATE POLICY "Tasks are viewable by everyone" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Users can create tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creators and assigned users can update tasks" ON public.tasks FOR UPDATE USING (
  created_by = auth.uid() OR assigned_to = auth.uid()
);
CREATE POLICY "Creators can delete tasks" ON public.tasks FOR DELETE USING (created_by = auth.uid());

-- TASK ASSIGNMENTS: Users can manage their own assignments
CREATE POLICY "Task assignments are viewable by everyone" ON public.task_assignments FOR SELECT USING (true);
CREATE POLICY "Users can create their own assignments" ON public.task_assignments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own assignments" ON public.task_assignments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own assignments" ON public.task_assignments FOR DELETE USING (user_id = auth.uid());

-- ALBUMS: Public albums viewable by all, private only by creator
CREATE POLICY "Public albums are viewable by everyone" ON public.albums FOR SELECT USING (is_private = false OR created_by = auth.uid());
CREATE POLICY "Users can create albums" ON public.albums FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Creators can update their albums" ON public.albums FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Creators can delete their albums" ON public.albums FOR DELETE USING (created_by = auth.uid());

-- PHOTOS: Follow album privacy rules
CREATE POLICY "Photos are viewable based on album privacy" ON public.photos FOR SELECT USING (
  album_id IS NULL OR
  EXISTS (SELECT 1 FROM public.albums WHERE id = album_id AND (is_private = false OR created_by = auth.uid()))
);
CREATE POLICY "Users can upload photos" ON public.photos FOR INSERT WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Uploaders can update their photos" ON public.photos FOR UPDATE USING (uploaded_by = auth.uid());
CREATE POLICY "Uploaders can delete their photos" ON public.photos FOR DELETE USING (uploaded_by = auth.uid());

-- INSPECTIONS: Everyone can read, admins can manage
CREATE POLICY "Inspections are viewable by everyone" ON public.inspections FOR SELECT USING (true);
CREATE POLICY "Admins can create inspections" ON public.inspections FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update inspections" ON public.inspections FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete inspections" ON public.inspections FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RULES: Everyone can read published rules, admins can manage
CREATE POLICY "Published rules are viewable by everyone" ON public.rules FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can view all rules" ON public.rules FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can create rules" ON public.rules FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update rules" ON public.rules FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete rules" ON public.rules FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RULE ACKNOWLEDGEMENTS: Users can manage their own
CREATE POLICY "Users can view their own acknowledgements" ON public.rule_acknowledgements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all acknowledgements" ON public.rule_acknowledgements FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can create their own acknowledgements" ON public.rule_acknowledgements FOR INSERT WITH CHECK (user_id = auth.uid());

-- DOCUMENTS: Everyone can read, admins can manage
CREATE POLICY "Documents are viewable by everyone" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Admins can create documents" ON public.documents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update documents" ON public.documents FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete documents" ON public.documents FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- JOIN CODES: Admins can manage, authenticated can view
CREATE POLICY "Authenticated users can view join codes" ON public.join_codes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can create join codes" ON public.join_codes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- CHAT MESSAGES: Everyone can read, authenticated can create, creators can update/delete
CREATE POLICY "Chat is viewable by everyone" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creators can update their messages" ON public.chat_messages FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Creators can delete their messages" ON public.chat_messages FOR DELETE USING (user_id = auth.uid());

-- RECIPES: Everyone can read, members+ can create, creators can update/delete
CREATE POLICY "Recipes are viewable by everyone" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "Members can create recipes" ON public.recipes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','member'))
);
CREATE POLICY "Creators can update their recipes" ON public.recipes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Creators can delete their recipes" ON public.recipes FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins can update join codes" ON public.join_codes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete join codes" ON public.join_codes FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- STORAGE BUCKETS (for photos and documents)
-- =====================================================
-- Run these separately in the Storage section of Supabase

-- Create 'photos' bucket (public)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Create 'documents' bucket (private)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, is_approved)
  VALUES (NEW.id, NEW.email, 'guest', false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.plots FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.diary_entries FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.event_rsvps FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.albums FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.rules FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =====================================================
-- SUCCESS!
-- =====================================================
-- Your Growing Together database is now set up!
-- Next steps:
-- 1. Create your first admin user in Authentication
-- 2. Set up storage buckets for photos and documents
-- 3. Test the app at http://localhost:8081
-- =====================================================
