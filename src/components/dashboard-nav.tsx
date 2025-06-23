'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, ChevronDown, Building2 } from 'lucide-react';
import { getOrganizations } from '@/lib/api/organizations';
import { toast } from 'sonner';

type Organization = {
  id: string;
  name: string;
  role: string;
};


export function DashboardNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth(); // Fixed variable reference

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);
  const [currentOrg, setCurrentOrg] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchOrganizations = async () => {
      try {
        const { data, error } = await getOrganizations();
        
        if (error) throw error;
        
        setOrganizations(data);
        
        // Set the first organization as current by default
        if (data.length > 0) {
          setCurrentOrg({ id: data[0].id, name: data[0].name });
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
        toast.error('Failed to load organizations');
      } finally {
        setIsLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, [user]);
  
  // Update current org when route changes
  useEffect(() => {
    if (!pathname) return;
    
    const pathSegments = pathname.split('/');
    const orgIdIndex = pathSegments.indexOf('organizations');
    
    if (orgIdIndex > -1 && pathSegments.length > orgIdIndex + 1) {
      const orgId = pathSegments[orgIdIndex + 1];
      if (orgId && orgId !== 'new') {
        const org = organizations.find(o => o.id === orgId);
        if (org) {
          setCurrentOrg({ id: org.id, name: org.name });
          return;
        }
      }
    }
    
    // If we're not on an organization page, but have organizations, set the first one as current
    if (organizations.length > 0) {
      setCurrentOrg({ id: organizations[0].id, name: organizations[0].name });
    } else {
      setCurrentOrg(null);
    }
  }, [pathname, organizations]);

  const userInitial = user?.email?.[0]?.toUpperCase() || 'U'; // Fixed variable reference

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex items-center space-x-6">
      <nav className="flex items-center space-x-4" aria-label="Dashboard navigation">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-1 px-3">
              <Building2 className="h-4 w-4" />
              <span className="max-w-[160px] truncate">
                {currentOrg ? currentOrg.name : 'Select Organization'}
              </span>
              <ChevronDown className="ml-1 h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel className="px-2 py-1.5">My Organizations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isLoadingOrgs ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                Loading organizations...
              </div>
            ) : organizations.length > 0 ? (
              organizations.map((org) => (
                <DropdownMenuItem key={org.id} asChild>
                  <Link 
                    href={`/dashboard/organizations/${org.id}`} 
                    className="w-full cursor-pointer"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    <span className="flex-1 truncate">{org.name}</span>
                    {currentOrg?.id === org.id && (
                      <span className="text-xs text-muted-foreground">Current</span>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No organizations found
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="w-full cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Manage Organizations</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
      
      <div className="flex items-center border-l pl-4 ml-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt="User avatar" />
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/account" className="w-full cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="w-full cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
