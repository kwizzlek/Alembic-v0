'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/auth-provider';
import { getOrganizations } from '@/lib/api/organizations';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

type UserProfile = {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
};

export default function DashboardPage() {
  const { user, session, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  if (loading || !session || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userProfile = {
    id: user.id,
    email: user.email,
    ...user.user_metadata,
  } as UserProfile;

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const [organizations, setOrganizations] = useState<Array<{id: string, name: string, role: string}>>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchOrganizations = async () => {
      try {
        const { data, error } = await getOrganizations();
        
        if (error) throw error;
        
        setOrganizations(data);
      } catch (error) {
        console.error('Error fetching organizations:', error);
        toast.error('Failed to load organizations');
      } finally {
        setIsLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Manage Organizations</h2>
              <Button asChild>
                <Link href="/dashboard/organizations/new">
                  Create new Organization
                </Link>
              </Button>
            </div>
            {isLoadingOrgs ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : organizations.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">You're not a member of any organizations yet.</p>
                  <Button className="mt-4" asChild>
                    <Link href="/dashboard/organizations">
                      Create an organization
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {organizations.slice(0, 3).map((org) => (
                  <Link key={org.id} href={`/dashboard/organizations/${org.id}`} className="block">
                    <Card className="hover:shadow-md transition-shadow h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">{org.name}</CardTitle>
                        <CardDescription>
                          <Badge variant="outline" className="capitalize">
                            {org.role}
                          </Badge>
                        </CardDescription>
                      </CardHeader>
                      <CardFooter>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href={`/dashboard/organizations/${org.id}`}>
                            View Organization
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
                {organizations.length > 3 && (
                  <Card className="flex items-center justify-center hover:shadow-md transition-colors">
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">
                        +{organizations.length - 3} more organizations
                      </p>
                      <Button variant="ghost" className="mt-2" asChild>
                        <Link href="/dashboard/organizations">
                          View All
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
