'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Upload, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/upload', icon: Upload, label: 'Upload' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-bottom md:hidden z-40 shadow-2xl">
      <div className="flex justify-around items-center h-16">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative',
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-primary to-accent rounded-full" />
              )}
              
              {/* Icon with glow effect when active */}
              <div className={cn(
                "transition-all",
                isActive && "scale-110"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-all",
                  isActive && "drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                )} />
              </div>
              
              <span className={cn(
                "text-xs font-medium transition-all",
                isActive && "font-semibold"
              )}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}