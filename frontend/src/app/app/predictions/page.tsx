'use client';

import React from 'react';
import { PredictionPortal } from '@/features/predictions/PredictionPortal';

export default function PredictionsPortalPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] antialiased font-sans p-2 sm:p-4">
      <PredictionPortal />
    </div>
  );
}
