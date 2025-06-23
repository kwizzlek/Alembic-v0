import { createClient } from '@/lib/supabase/client';

type Organization = {
  id: string;
  name: string;
  role: string;
  created_at: string;
};

type TenantMember = {
  role: string;
  created_at: string;
  tenant: {
    id: string;
    name: string;
    created_at: string;
  };
};

export const getOrganizations = async (): Promise<{
  data: Organization[];
  error: Error | null;
}> => {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tenant_members')
    .select(`
      role,
      created_at,
      tenant:tenant_id (id, name, created_at)
    `)
    .not('tenant_id', 'is', null);

  if (error) {
    return { data: [], error };
  }

  if (!data) {
    return { data: [], error: new Error('No data returned') };
  }


  const formattedData = data.map(item => ({
    id: item.tenant.id,
    name: item.tenant.name,
    role: item.role,
    created_at: item.tenant.created_at,
  }));

  return { data: formattedData, error: null };
};

export const createOrganization = async (name: string): Promise<{
  data: Organization | null;
  error: Error | null;
}> => {
  const supabase = createClient();
  const user = (await supabase.auth.getUser()).data.user;
  
  if (!user) {
    return { data: null, error: new Error('User not authenticated') };
  }
  
  // Start a transaction
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .insert([{ name }])
    .select()
    .single();

  if (tenantError || !tenantData) {
    return { data: null, error: tenantError || new Error('Failed to create tenant') };
  }

  // Add current user as owner of the new organization
  const { error: memberError } = await supabase
    .from('tenant_members')
    .insert([
      { 
        tenant_id: tenantData.id,
        user_id: user.id,
        role: 'owner' 
      }
    ]);

  if (memberError) {
    // Clean up the tenant if member creation fails
    await supabase.from('tenants').delete().eq('id', tenantData.id);
    return { data: null, error: memberError };
  }

  return { 
    data: {
      id: tenantData.id,
      name: tenantData.name,
      role: 'owner',
      created_at: tenantData.created_at
    }, 
    error: null 
  };
};
