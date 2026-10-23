'use client';

import React from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { MultiverseSimulator } from '@/features/multiverse/MultiverseSimulator';
import { useI18n } from '@/lib/i18n-context';

export default function MultiversePage() {
  const { t } = useI18n();

  return (
    <ModuleShell
      title={t('mod.multiverse', 'Quantum Multiverse Simulator')}
      category={t('cat.wealth_planning', 'Wealth & Planning')}
      description={t(
        'mod.multiverse.desc',
        'Simulate parallel life timelines, time-travel across 30-year wealth trajectories, and compare lifestyle forks.'
      )}
    >
      <MultiverseSimulator />
    </ModuleShell>
  );
}
