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
            <Button variant="ghost" className="gap-1 px-2 hover:bg-accent/50">
              <Building2 className="h-4 w-4" />
              <span className="max-w-[160px] truncate">
                {currentOrg ? currentOrg.name : 'Select Organization'}
              </span>
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold">My Organizations</DropdownMenuLabel>
            <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-border" />
            {isLoadingOrgs ? (
              <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none">
                <span className="text-muted-foreground">Loading organizations...</span>
              </div>
            ) : organizations.length > 0 ? (
              organizations.map((org) => (
                <DropdownMenuItem 
                  key={org.id} 
                  asChild
                  className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${
                    currentOrg?.id === org.id ? 'bg-accent text-accent-foreground' : ''
                  }`}
                >
                  <Link href={`/dashboard/organizations/${org.id}`} className="flex w-full items-center">
                    <Building2 className="mr-2 h-4 w-4" />
                    <span className="flex-1 truncate">{org.name}</span>
                    {currentOrg?.id === org.id && (
                      <span className="ml-2 text-xs text-muted-foreground">Current</span>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none">
                <span className="text-muted-foreground">No organizations found</span>
              </div>
            )}
            <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-border" />
            <DropdownMenuItem className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
              <Link href="/dashboard" className="flex w-full items-center">
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
            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 hover:bg-accent/50">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt="User avatar" />
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md" align="end" sideOffset={8}>
            <DropdownMenuLabel className="px-2 py-1.5">
              <div className="flex flex-col">
                <p className="text-sm font-medium leading-none">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-border" />
            <DropdownMenuItem className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
              <Link href="/dashboard/account" className="flex w-full items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
              <Link href="/dashboard/settings" className="flex w-full items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-border" />
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors focus:bg-destructive/10 focus:text-destructive data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
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
