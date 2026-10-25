'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CinematicDemoIntro } from '@/components/landing/CinematicDemoIntro';

export default function DemoPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#030705] text-white">
      <CinematicDemoIntro
        standalone={true}
        onComplete={() => router.push('/')}
      />
    </div>
  );
}
