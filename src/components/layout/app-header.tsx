'use client';

import { Button } from '@/components/ui/button';
import { User, Bell, Settings } from 'lucide-react';
import Link from 'next/link';
import { UserAccountMenu } from './user-account-menu';

// A simple SVG pony icon.
const PonyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9.5 14.5A2.5 2.5 0 0 1 12 12h0a2.5 2.5 0 0 1 2.5 2.5v5.5h-5v-5.5Z" />
    <path d="M12 12V6.5a2.5 2.5 0 0 1 5 0V9" />
    <path d="m7 14 2-2" />
    <path d="M14 14h1a2 2 0 0 1 2 2v2h-3v-3.5a2.5 2.5 0 0 0-5 0V20H6v-2a2 2 0 0 1 2-2h1" />
    <path d="M12 9.5a2.5 2.5 0 1 1 5 0V12" />
  </svg>
);

export function AppHeader() {
  return (
    <div className="relative w-full">
      {/* Beautiful gradient background with glass effect */}
      <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-r from-background via-background/95 to-primary/5 backdrop-blur-xl">
        {/* Animated gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10"></div>
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-primary/20 via-accent/10 to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-96 h-full bg-gradient-to-r from-secondary/20 via-purple-500/10 to-transparent opacity-50"></div>
        
        {/* Subtle animated elements */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/3 w-24 h-24 bg-gradient-to-br from-accent/30 to-transparent rounded-full blur-2xl animate-pulse delay-1000"></div>
        
        {/* Main header content */}
        <div className="relative flex items-center justify-between px-6 py-4 h-20">
          {/* Left side - Logo and App Name */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              {/* Logo with beautiful effects */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl opacity-30 blur-lg animate-pulse group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-3 border-2 border-primary/40 backdrop-blur-sm group-hover:border-primary/60 transition-all duration-300 group-hover:scale-105">
                  <PonyIcon className="h-8 w-8 text-primary drop-shadow-lg group-hover:text-accent transition-colors duration-300" />
                </div>
              </div>
              
              {/* App name with gradient text */}
              <div className="flex flex-col">
                <h1 className="text-2xl xl:text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-accent bg-clip-text text-transparent group-hover:from-accent group-hover:via-primary group-hover:to-purple-600 transition-all duration-500">
                  PonyClub Events
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  Event Management System
                </p>
              </div>
            </Link>
          </div>

          {/* Right side - Status indicators and user info */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-to-br from-red-400 to-pink-500 rounded-full border-2 border-background animate-pulse"></div>
            </Button>

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:scale-105"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>

            {/* User account menu */}
            <UserAccountMenu />
          </div>
        </div>
      </div>
    </div>
  );
}
