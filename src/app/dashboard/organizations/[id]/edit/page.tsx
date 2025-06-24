'use client';

import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getOrganizations, getOrganizationMembers, type OrganizationMember } from '@/lib/api/organizations';
import EditOrganizationForm from './edit-organization-form';

type InitialData = {
  name: string;
  members: OrganizationMember[];
};

export const dynamic = 'force-dynamic';

export default function EditOrganizationPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<InitialData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { id } = params;
        
        if (!id) {
          console.error('No organization ID provided');
          setError('No organization ID provided');
          return;
        }
    
          // Fetch the specific organization by ID
        const { data: organizations, error: orgsError } = await getOrganizations(id as string);
        
        if (orgsError || !organizations || organizations.length === 0) {
          const errorMsg = orgsError?.message || 'No organization found';
          console.error('Error loading organization:', errorMsg);
          setError(errorMsg);
          return;
        }
        
        // Get the organization (should be the first and only result)
        const organization = organizations[0];
        
        // Fetch organization members
        let members: OrganizationMember[] = [];
        try {
          const membersResponse = await getOrganizationMembers(id as string);
          members = membersResponse.data || [];
        } catch (membersError) {
          console.error('Error loading members:', membersError);
          // Continue rendering the page even if members fail to load
        }
        
        // Prepare initial data for the form
        setInitialData({
          name: organization.name,
          members
        });
      } catch (error) {
        console.error('Error in EditOrganizationPage:', error);
        setError('Failed to load organization data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params]);

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!initialData) {
    return <div className="p-4">No organization data available</div>;
  }
  
  return <EditOrganizationForm organizationId={params.id as string} initialData={initialData} />;

}
