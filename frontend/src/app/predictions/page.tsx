'use client';

import React from 'react';
import { PredictionPortal } from '@/features/predictions/PredictionPortal';

export default function PredictionsStandaloneSitePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] antialiased font-sans p-4 sm:p-6 lg:p-8">
      <PredictionPortal />
    </div>
  );
}
