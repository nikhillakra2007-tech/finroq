'use client';

import React from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { MultiverseSimulator } from '@/features/multiverse/MultiverseSimulator';
import { useI18n } from '@/lib/i18n-context';

export default function MultiversePage() {
  const { t } = useI18n();

  return (
    <ModuleShell
      title={t('mod.multiverse', '30-Year Wealth Forecast')}
      category={t('cat.wealth_planning', 'Wealth & Planning')}
      description={t(
        'mod.multiverse.desc',
        'Simulate parallel life timelines, project 30-year wealth trajectories, and compare financial options.'
      )}
    >
      <MultiverseSimulator />
    </ModuleShell>
  );
}
