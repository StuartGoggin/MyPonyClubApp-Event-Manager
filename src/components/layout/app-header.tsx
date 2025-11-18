'use client';

import Link from 'next/link';
import Image from 'next/image';
import { HelpCircle } from 'lucide-react';
import { UserAccountMenu } from './user-account-menu';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
        <div className="relative flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 h-16 sm:h-20">
          {/* Left side - Logo and App Name */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 flex-1">
              {/* Logo with beautiful effects */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-lg sm:rounded-xl opacity-30 blur-lg animate-pulse group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/40 backdrop-blur-sm group-hover:border-primary/60 transition-all duration-300 group-hover:scale-105 overflow-hidden h-7 sm:h-8 md:h-9 w-14 sm:w-16 md:w-18">
                  <Image
                    src="/Logo.png"
                    alt="MyPonyClub Logo"
                    fill
                    className="object-cover drop-shadow-lg transition-transform duration-300"
                    priority
                  />
                </div>
              </div>
              
              {/* App name with gradient text */}
              <div className="flex flex-col min-w-0 flex-1">
                <h1 className="text-base sm:text-lg md:text-xl xl:text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-600 to-accent bg-clip-text text-transparent group-hover:from-accent group-hover:via-primary group-hover:to-purple-600 transition-all duration-500 truncate">
                  <span className="hidden sm:inline">MyPonyClub - Events</span>
                  <span className="sm:hidden">Events</span>
                </h1>
              </div>
            </Link>
          </div>

          {/* Right side - User info */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {/* Help Guide Icon */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-8 w-8 rounded-full hover:bg-white/20 transition-all duration-300"
                  >
                    <Link href="/user-guide.html" target="_blank">
                      <HelpCircle className="h-5 w-5 text-white/80 hover:text-white transition-colors" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>User Guide</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* User account menu */}
            <UserAccountMenu />
          </div>
        </div>
      </div>
    </div>
  );
}
