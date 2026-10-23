'use client';

import React from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { InvestmentPredictionCenter } from '@/features/investments/InvestmentPredictionCenter';
import { useI18n } from '@/lib/i18n-context';

export default function PredictionsPage() {
  const { t } = useI18n();

  return (
    <ModuleShell
      title={t('mod.investments', 'Youth Investment & IPO Predictions')}
      category={t('cat.wealth_planning', 'Wealth & Planning')}
      description={t(
        'mod.investments.desc',
        'Curated mutual funds, live IPO listing gain predictions, and compounding proof for students & young professionals.'
      )}
    >
      <InvestmentPredictionCenter isStandalonePortal={false} />
    </ModuleShell>
  );
}
