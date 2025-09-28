-- Database schema for Plot Inspections and Rules & Documents
-- Run this SQL in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Plots table
CREATE TABLE IF NOT EXISTS plots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number VARCHAR(10) NOT NULL UNIQUE,
    holder_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    size VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inspections table
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    assessor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    use_status VARCHAR(20) NOT NULL CHECK (use_status IN ('active', 'partial', 'not_used')),
    upkeep VARCHAR(20) NOT NULL CHECK (upkeep IN ('good', 'fair', 'poor')),
    issues TEXT[] DEFAULT '{}', -- Array of issue tags
    notes TEXT,
    photos TEXT[] DEFAULT '{}', -- Array of photo URLs
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    action VARCHAR(30) NOT NULL DEFAULT 'none' CHECK (action IN ('none', 'advisory', 'warning', 'final_warning', 'recommend_removal')),
    reinspect_by DATE,
    shared_with_member BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member notices table
CREATE TABLE IF NOT EXISTS member_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rules table (versioned rules system)
CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(50) NOT NULL UNIQUE,
    markdown TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    summary TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rule acknowledgements table
CREATE TABLE IF NOT EXISTS rule_acknowledgements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rule_id, user_id) -- One acknowledgement per user per rule version
);

-- User documents table
CREATE TABLE IF NOT EXISTS user_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('contract', 'id', 'other')),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_plots_number ON plots(number);
CREATE INDEX IF NOT EXISTS idx_plots_holder ON plots(holder_user_id);
CREATE INDEX IF NOT EXISTS idx_inspections_plot ON inspections(plot_id);
CREATE INDEX IF NOT EXISTS idx_inspections_assessor ON inspections(assessor_user_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(date DESC);
CREATE INDEX IF NOT EXISTS idx_inspections_action ON inspections(action);
CREATE INDEX IF NOT EXISTS idx_inspections_reinspect ON inspections(reinspect_by);
CREATE INDEX IF NOT EXISTS idx_member_notices_user ON member_notices(user_id);
CREATE INDEX IF NOT EXISTS idx_member_notices_status ON member_notices(status);
CREATE INDEX IF NOT EXISTS idx_rules_version ON rules(version);
CREATE INDEX IF NOT EXISTS idx_rules_active ON rules(is_active);
CREATE INDEX IF NOT EXISTS idx_rule_acks_user ON rule_acknowledgements(user_id);
CREATE INDEX IF NOT EXISTS idx_rule_acks_rule ON rule_acknowledgements(rule_id);
CREATE INDEX IF NOT EXISTS idx_user_docs_user ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_docs_type ON user_documents(type);
CREATE INDEX IF NOT EXISTS idx_user_docs_expires ON user_documents(expires_at);

-- Row Level Security (RLS) policies
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

-- Plots policies
CREATE POLICY "Plots are viewable by everyone" ON plots FOR SELECT USING (true);
CREATE POLICY "Only admins can manage plots" ON plots FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Inspections policies
CREATE POLICY "Inspections viewable by admins and plot holders" ON inspections FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    OR
    EXISTS (SELECT 1 FROM plots WHERE plots.id = inspections.plot_id AND plots.holder_user_id = auth.uid())
);

CREATE POLICY "Only admins can create/update inspections" ON inspections FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Member notices policies
CREATE POLICY "Users can view their own notices" ON member_notices FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all notices" ON member_notices FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Only admins can create notices" ON member_notices FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Users can update their notice status" ON member_notices FOR UPDATE USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Rules policies (everyone can read active rules)
CREATE POLICY "Active rules are viewable by everyone" ON rules FOR SELECT USING (is_active = true);
CREATE POLICY "Only admins can manage rules" ON rules FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Rule acknowledgements policies
CREATE POLICY "Users can view their own acknowledgements" ON rule_acknowledgements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all acknowledgements" ON rule_acknowledgements FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Users can create their own acknowledgements" ON rule_acknowledgements FOR INSERT WITH CHECK (user_id = auth.uid());

-- User documents policies
CREATE POLICY "Users can view their own documents" ON user_documents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all documents" ON user_documents FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Users and admins can upload documents" ON user_documents FOR INSERT WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Users can update their own documents" ON user_documents FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can update any documents" ON user_documents FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Users can delete their own documents" ON user_documents FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins can delete any documents" ON user_documents FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Updated_at triggers
CREATE TRIGGER update_plots_updated_at BEFORE UPDATE ON plots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_notices_updated_at BEFORE UPDATE ON member_notices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rules_updated_at BEFORE UPDATE ON rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_documents_updated_at BEFORE UPDATE ON user_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON plots TO authenticated;
GRANT ALL ON inspections TO authenticated;
GRANT ALL ON member_notices TO authenticated;
GRANT ALL ON rules TO authenticated;
GRANT ALL ON rule_acknowledgements TO authenticated;
GRANT ALL ON user_documents TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert seed data for development
-- Create some sample plots
INSERT INTO plots (number, holder_user_id, size, notes) VALUES
('1', NULL, '10m x 5m', 'Corner plot with good drainage'),
('2', NULL, '10m x 5m', 'Full sun exposure'),
('3', NULL, '8m x 6m', 'Partial shade, good for leafy greens'),
('4', NULL, '12m x 4m', 'Long narrow plot'),
('5', NULL, '10m x 5m', 'Near water point')
ON CONFLICT (number) DO NOTHING;

-- Insert additional plots (6-60) for a full site
DO $$
BEGIN
    FOR i IN 6..60 LOOP
        INSERT INTO plots (number, holder_user_id, size, notes) 
        VALUES (i::text, NULL, '10m x 5m', 'Standard plot')
        ON CONFLICT (number) DO NOTHING;
    END LOOP;
END $$;

-- Insert initial rules version
INSERT INTO rules (version, markdown, published_at, summary, created_by, is_active) 
SELECT 
    '1.0',
    '# Growing Together Allotment Community Rules

## 1. Plot Use
- Plots must be actively cultivated for growing food or flowers
- No subletting or commercial use of plots
- Keep paths and communal areas clear and accessible
- Notify the secretary if you will be away for extended periods

## 2. Structures and Buildings
- All structures require committee approval before construction
- Maximum shed size: 8ft x 6ft
- Greenhouses and polytunnels must be appropriately sited
- Use appropriate materials - no corrugated iron or unsightly materials

## 3. Compost and Waste
- Green waste only in designated compost areas
- No household rubbish or non-compostable materials
- Dispose of diseased plants appropriately
- Keep compost areas tidy and well-maintained

## 4. Water Usage
- Use water butts and collection systems where possible
- No hoses left running unattended
- Report any leaks or water system issues immediately
- Be considerate of water usage during dry periods

## 5. Fires and BBQs
- Fires only permitted in designated areas
- Follow all fire safety notices and guidelines
- No burning during dry weather warnings
- Ensure fires are completely extinguished before leaving

## 6. Health and Safety
- Store tools and equipment safely
- Children must be supervised at all times
- No glass containers in growing areas
- Report any hazards or safety concerns immediately

## 7. Pets and Animals
- Dogs must be kept on leads at all times
- Clean up after pets immediately
- Pets must not damage other plots or communal areas
- Notify others of any aggressive or problematic animals

## 8. Community and Respect
- Respect your neighbors and their plots
- Quiet hours: 8 PM - 8 AM on weekdays, 8 PM - 9 AM on weekends
- Resolve disputes through committee mediation
- Participate in community events and work days when possible

## 9. Inspections and Plot Removal
- Regular inspections will be conducted by committee members
- Warnings will be issued for non-compliance
- Procedure: Advisory → Warning → Final Warning → Removal
- Appeals process available through committee

## 10. Contact and Emergencies
- Secretary: [Contact details]
- Emergency services: 999
- Report urgent issues to committee members immediately
- Use the community noticeboard for non-urgent communications

---

*These rules are designed to ensure our allotment community remains a pleasant, productive, and safe environment for all members.*',
    NOW(),
    'Initial rules version',
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
    true
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'admin')
ON CONFLICT (version) DO NOTHING;