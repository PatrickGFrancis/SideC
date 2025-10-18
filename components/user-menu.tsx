'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';

export function UserMenu() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-secondary/50 hover:text-primary transition-all hover:scale-105 active:scale-95 ring-1 ring-border/50 hover:ring-primary/30"
        >
          <User className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-card/95 backdrop-blur-xl border-border/50 shadow-xl"
      >
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">My Account</span>
            <span className="text-xs text-muted-foreground truncate mt-1">
              {userEmail}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem 
          onClick={() => router.push('/settings')}
          className="cursor-pointer hover:bg-secondary/50 focus:bg-secondary/50 transition-colors"
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem 
          onClick={handleLogout} 
          className="text-destructive cursor-pointer hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive transition-colors"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}