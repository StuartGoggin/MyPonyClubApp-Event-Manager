'use client';

import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Users2, Building, Calendar } from 'lucide-react';

export function NominateCommitteeHeader() {
  return (
    <Card className="mb-8 overflow-hidden border-2 border-primary/20 shadow-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)] pointer-events-none" />
      <div className="relative p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Logo */}
          <div className="relative bg-white/20 backdrop-blur-sm rounded-xl overflow-hidden h-24 w-auto aspect-[16/10] flex items-center justify-center p-3 shadow-xl">
            <Image
              src="/myponyclub-logo-club-manager.png"
              alt="MyPonyClub Logo"
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>

          {/* Header Content */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center justify-center sm:justify-start gap-3 mb-2">
              <Users2 className="h-8 w-8" />
              Committee Nomination
            </h1>
            <p className="text-blue-100 text-lg">
              Submit your club's committee after the Annual General Meeting
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-3 text-white">
              <Building className="h-5 w-5 text-blue-200" />
              <div>
                <p className="text-xs text-blue-200">Step 1</p>
                <p className="font-semibold">Select Your Club</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-3 text-white">
              <Calendar className="h-5 w-5 text-purple-200" />
              <div>
                <p className="text-xs text-purple-200">Step 2</p>
                <p className="font-semibold">Enter AGM Details</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-3 text-white">
              <Users2 className="h-5 w-5 text-indigo-200" />
              <div>
                <p className="text-xs text-indigo-200">Step 3</p>
                <p className="font-semibold">Nominate Committee</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
