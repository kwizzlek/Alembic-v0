'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { getOrganizations } from '@/lib/api/organizations';
import { toast } from 'sonner';

type Organization = {
  id: string;
  name: string;
  role: string;
  created_at: string;
};

export default function OrganizationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const { data: organizations, error } = await getOrganizations();
        
        if (error) throw error;
        
        const org = organizations.find(org => org.id === params.id);
        
        if (!org) {
          toast.error('Organization not found');
          router.push('/dashboard');
          return;
        }
        
        setOrganization(org);
      } catch (error) {
        console.error('Error loading organization:', error);
        toast.error('Failed to load organization');
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrganization();
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!organization) {
    return null; // Will be redirected by the effect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Button 
            variant="ghost" 
            className="mb-6" 
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">
                {organization.name} Dashboard
              </h1>
              <Badge variant="outline" className="capitalize">
                {organization.role}
              </Badge>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Details</CardTitle>
                  <CardDescription>
                    View and manage your organization settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Organization ID</p>
                    <p className="font-mono text-sm">{organization.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p>{new Date(organization.created_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/organizations/${params.id}/edit`}>
                      Manage Organization
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
