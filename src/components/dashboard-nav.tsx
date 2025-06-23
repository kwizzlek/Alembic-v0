'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  {
    name: 'Overview',
    href: '/dashboard',
  },
  {
    name: 'Documents',
    href: '/dashboard/documents',
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-4" aria-label="Dashboard navigation">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'px-3 py-2 text-sm font-medium rounded-md',
            pathname === item.href
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}
