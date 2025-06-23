import { createClient } from '@/lib/supabase/client';

type User = {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
};

export type OrganizationMember = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
};

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


  const formattedData = data.map((item: any) => ({
    id: item.tenant?.id || '',
    name: item.tenant?.name || 'Unnamed Organization',
    role: item.role || 'member',
    created_at: item.tenant?.created_at || new Date().toISOString(),
  }));

  return { data: formattedData, error: null };
};

export const createOrganization = async (name: string): Promise<{
  data: Organization | null;
  error: Error | null;
}> => {
  const supabase = createClient();
  
  try {
    // Start a transaction
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }
    
    // Create the tenant/organization
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert([{ name }])
      .select('id, name, created_at')
      .single();
      
    if (tenantError) throw tenantError;
    
    // Add the creating user as an admin
    const { error: memberError } = await supabase
      .from('tenant_members')
      .insert([{
        tenant_id: tenant.id,
        user_id: user.id,
        role: 'admin'
      }]);
      
    if (memberError) throw memberError;
    
    return { 
      data: {
        id: tenant.id,
        name: tenant.name,
        role: 'admin',
        created_at: tenant.created_at
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error creating organization:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to create organization') 
    };
  }
};

export const updateOrganization = async (id: string, updates: { name: string }): Promise<{
  data: Organization | null;
  error: Error | null;
}> => {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('tenants')
      .update({ name: updates.name })
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) throw error;
    
    return { 
      data: {
        id: data.id,
        name: data.name,
        role: 'admin', // Assuming the user has permission to update
        created_at: data.created_at
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error updating organization:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to update organization') 
    };
  }
};

export const getOrganizationMembers = async (organizationId: string): Promise<{
  data: OrganizationMember[];
  error: Error | null;
}> => {
  const supabase = createClient();
  
  try {
    // First, get all member user IDs for this organization
    const { data: membersData, error: membersError } = await supabase
      .from('tenant_members')
      .select('user_id, role, created_at')
      .eq('tenant_id', organizationId);
      
    if (membersError) throw membersError;
    
    if (!membersData || membersData.length === 0) {
      return { data: [], error: null };
    }
    
    // Get user details for all member IDs
    const userIds = membersData.map(member => member.user_id);
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, user_metadata')
      .in('id', userIds);
      
    if (usersError) throw usersError;
    
    // Combine the data
    const members = membersData.map(member => {
      const user = usersData?.find(u => u.id === member.user_id);
      return {
        id: member.user_id,
        email: user?.email || 'Unknown',
        full_name: user?.user_metadata?.full_name || null,
        avatar_url: user?.user_metadata?.avatar_url || null,
        role: member.role,
        created_at: member.created_at
      };
    });
    
    return { data: members, error: null };
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error('Failed to fetch organization members') 
    };
  }
};

export const inviteMember = async (organizationId: string, email: string, role: string = 'member'): Promise<{
  success: boolean;
  error: Error | null;
}> => {
  const supabase = createClient();
  
  try {
    // First, get the user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
      
    if (userError || !userData) {
      // In a real app, you might want to send an invitation email here
      return { 
        success: false, 
        error: new Error('User not found. Please make sure the user has an account.') 
      };
    }
    
    // Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('tenant_members')
      .select('id')
      .eq('tenant_id', organizationId)
      .eq('user_id', userData.id)
      .single();
      
    if (existingMember) {
      return { 
        success: false, 
        error: new Error('User is already a member of this organization') 
      };
    }
    
    // Add user as a member
    const { error: addMemberError } = await supabase
      .from('tenant_members')
      .insert([{
        tenant_id: organizationId,
        user_id: userData.id,
        role: role
      }]);
      
    if (addMemberError) throw addMemberError;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error inviting member:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Failed to invite member') 
    };
  }
};

export const removeMember = async (organizationId: string, userId: string): Promise<{
  success: boolean;
  error: Error | null;
}> => {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('tenant_members')
      .delete()
      .eq('tenant_id', organizationId)
      .eq('user_id', userId);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error removing member:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Failed to remove member') 
    };
  }
};

export const deleteOrganization = async (id: string): Promise<{
  success: boolean;
  error: Error | null;
}> => {
  const supabase = createClient();
  
  try {
    // First, delete all memberships for this organization
    const { error: membersError } = await supabase
      .from('tenant_members')
      .delete()
      .eq('tenant_id', id);
      
    if (membersError) throw membersError;
    
    // Then delete the organization
    const { error: tenantError } = await supabase
      .from('tenants')
      .delete()
      .eq('id', id);
      
    if (tenantError) throw tenantError;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting organization:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Failed to delete organization') 
    };
  }
};
