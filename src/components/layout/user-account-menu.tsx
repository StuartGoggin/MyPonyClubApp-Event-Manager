'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings, UserCheck, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { getUserRoles } from '@/lib/access-control';

function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'super_user':
      return 'Super User';
    case 'zone_rep':
      return 'Zone Rep';
    case 'club_manager':
      return 'Club Manager';
    case 'event_secretary':
      return 'Event Secretary';
    case 'standard':
      return 'Member';
    default:
      return 'Member';
  }
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "destructive" | "outline" {
  switch (role) {
    case 'super_user':
      return 'destructive';
    case 'zone_rep':
      return 'default';
    case 'club_manager':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function UserAccountMenu() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-3 pl-4 border-l border-border/40">
        <Link 
          href="/login"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105"
        >
          <div className="relative">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border-2 border-primary/40">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full border-2 border-background"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Public User</span>
            <Badge 
              variant="outline" 
              className="text-xs px-2 py-0 h-4 bg-gradient-to-r from-gray-100/20 to-gray-200/20 border-gray-400/30 text-gray-600 font-medium"
            >
              Guest
            </Badge>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground ml-1" />
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  // Get user roles - support both single and multi-role
  const userRoles = getUserRoles(user);
  const displayRole = userRoles[0] || 'standard'; // Show first role as primary

  return (
    <div className="flex items-center gap-3 pl-4 border-l border-border/40">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="flex items-center gap-2 px-4 py-2 h-auto rounded-full bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105"
          >
            <div className="relative">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border-2 border-primary/40">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-background"></div>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-foreground">
                {user.firstName} {user.lastName}
              </span>
              <div className="flex gap-1 flex-wrap">
                {userRoles.map(role => (
                  <Badge 
                    key={role}
                    variant={getRoleBadgeVariant(role)} 
                    className="text-xs px-2 py-0 h-4 font-medium"
                  >
                    {getRoleDisplayName(role)}
                  </Badge>
                ))}
              </div>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground ml-1" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64 bg-background/95 backdrop-blur-sm border border-border/50">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                ID: {user.ponyClubId}
              </p>
              {user.email && (
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="flex items-center gap-2 text-red-600 focus:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}