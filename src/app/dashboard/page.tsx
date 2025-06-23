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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="relative h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  {userProfile.avatar_url ? (
                    <img
                      src={userProfile.avatar_url}
                      alt={userProfile.full_name || userProfile.email}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                      {userProfile.email?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">
                    {userProfile.full_name || userProfile.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userProfile.email}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Account Created
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Date(session.user.created_at || '').toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      User ID
                    </CardTitle>
<div className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-mono truncate" title={userProfile.id}>
                      {userProfile.id.substring(0, 8)}...
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/settings">
                  <div className="mr-2 h-4 w-4" />
                  Account Settings
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* My Organizations Section */}
        <div className="col-span-full mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Organizations</h2>
            <Button variant="outline" asChild>
              <Link href="/dashboard/organizations">
                Manage Organizations
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
                <Card key={org.id} className="hover:shadow-md transition-shadow">
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
      </main>
    </div>
  );
}
