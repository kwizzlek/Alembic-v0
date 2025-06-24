-- Enable Row Level Security
ALTER TABLE IF EXISTS public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;

-- Create tables
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON public.tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON public.tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON public.documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

-- Create RLS policies
-- Tenants policies
CREATE POLICY "Users can view their tenants"
  ON public.tenants
  FOR SELECT
  USING (
    id IN (
      SELECT tenant_id 
      FROM public.tenant_members 
      WHERE user_id = auth.uid()
    )
  );

-- Tenant members policies
CREATE POLICY "Users can view their tenant memberships"
  ON public.tenant_members
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Tenant members can view other members"
  ON public.tenant_members
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_members 
      WHERE user_id = auth.uid()
    )
  );

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

-- Documents policies
CREATE POLICY "Users can view documents in their tenant"
  ON public.documents
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents in their tenant"
  ON public.documents
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM public.tenant_members 
      WHERE user_id = auth.uid()
    )
  );

-- Create update trigger function
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to all tables with updated_at
CREATE TRIGGER update_tenants_modtime
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_tenant_members_modtime
  BEFORE UPDATE ON public.tenant_members
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_profiles_modtime
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_documents_modtime
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- Create function to check tenant membership
CREATE OR REPLACE FUNCTION public.is_tenant_member(tenant_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_members.tenant_id = $1
    AND tenant_members.user_id = $2
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Create function to check tenant owner
CREATE OR REPLACE FUNCTION public.is_tenant_owner(tenant_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_members.tenant_id = $1
    AND tenant_members.user_id = $2
    AND tenant_members.role = 'owner'
  );
$$ LANGUAGE SQL SECURITY DEFINER;
