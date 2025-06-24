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

export const getOrganizations = async (organizationId?: string): Promise<{
  data: Organization[];
  error: Error | null;
}> => {
  const supabase = createClient();
  
  try {
    let query = supabase
      .from('tenant_members')
      .select(`
        role,
        created_at,
        tenant:tenant_id (id, name, created_at)
      `)
      .not('tenant_id', 'is', null);

    // If an organization ID is provided, filter by that ID
    if (organizationId) {
      query = query.eq('tenant_id', organizationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching organizations:', error);
      return { data: [], error };
    }

    if (!data || data.length === 0) {
      const errorMsg = organizationId 
        ? `No organization found with ID: ${organizationId}` 
        : 'No organizations found';
      return { data: [], error: new Error(errorMsg) };
    }

    const formattedData = data.map((item: any) => ({
      id: item.tenant?.id || '',
      name: item.tenant?.name || 'Unnamed Organization',
      role: item.role || 'member',
      created_at: item.tenant?.created_at || new Date().toISOString(),
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('Unexpected error in getOrganizations:', error);
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error('An unexpected error occurred') 
    };
  }
};

export const createOrganization = async (name: string): Promise<{
  data: Organization | null;
  error: Error | null;
}> => {
  const supabase = createClient();
  
  try {
    // Call the database function that handles organization creation and member assignment
    const { data, error } = await supabase
      .rpc('create_organization_with_owner', {
        org_name: name
      });

    if (error) throw error;
    
    return { 
      data: {
        id: data.id,
        name: data.name,
        role: 'admin',
        created_at: data.created_at
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

type MemberWithProfile = {
  user_id: string;
  role: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    auth_users: {
      email: string;
    }[];
  }[];
};

export const getOrganizationMembers = async (organizationId: string): Promise<{
  data: OrganizationMember[];
  error: Error | null;
}> => {
  const supabase = createClient();
  
  try {
    console.log('Fetching members for organization:', organizationId);
    
    // First, verify the organization exists
    const { data: orgData, error: orgError } = await supabase
      .from('tenants')
      .select('id')
      .eq('id', organizationId)
      .single();
      
    if (orgError || !orgData) {
      console.error('Organization not found:', organizationId, orgError);
      return { data: [], error: new Error('Organization not found') };
    }
    
    // First, log the SQL for the organization verification
    console.log('Verifying organization with ID:', organizationId);
    
    // Get members with their profile information
    console.log('Executing query to get members for organization:', organizationId);
    
    // The actual query we need to run according to the schema:
    // 1. Join tenant_members with profiles on user_id
    // 2. Get the user's email from auth.users
    const sql = `
      SELECT 
        tm.user_id,
        tm.role,
        tm.created_at,
        p.id,
        u.email,
        p.full_name,
        p.avatar_url
      FROM tenant_members tm
      JOIN profiles p ON tm.user_id = p.id
      JOIN auth.users u ON p.id = u.id
      WHERE tm.tenant_id = '${organizationId}'
    `;
    
    console.log('Equivalent SQL Query:');
    console.log(sql);
    
    // Execute the query using Supabase's query builder
    const { data, error, status, statusText } = await supabase
      .from('tenant_members')
      .select(`
        user_id,
        role,
        created_at,
        profiles!inner(
          id,
          full_name,
          avatar_url,
          auth_users:user_id (
            email
          )
        )
      `)
      .eq('tenant_id', organizationId);
      
    console.log('Members query result:', { data, error, status, statusText });
    
    if (error) {
      console.error('Error in members query:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('No members found for organization:', organizationId);
      return { data: [], error: null };
    }
    
    // Transform the data to match the OrganizationMember type
    const members = data.map(member => {
      // Log each member to help with debugging
      console.log('Processing member:', member);
      // Since we used an inner join, there should be exactly one profile per member
      const profile = member.profiles?.[0];
      const email = profile?.auth_users?.[0]?.email || '';
      
      return {
        id: member.user_id,
        email: email,
        full_name: profile?.full_name || null,
        avatar_url: profile?.avatar_url || null,
        role: member.role,
        created_at: member.created_at
      };
    });
    
    console.log('Processed members:', members);
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
