'use client';

import React from 'react';
import { InvestmentPredictionCenter } from '@/features/investments/InvestmentPredictionCenter';

export function PredictionPortal() {
  return <InvestmentPredictionCenter isStandalonePortal={false} />;
}
