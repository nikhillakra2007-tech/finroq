/**
 * FINROQ Quantum Multiverse Engine
 * Pure mathematical simulation core for 30-year parallel life timelines,
 * stochastic macro-shocks, FIRE crossover detection, and wealth divergence telemetry.
 */

export type MacroEnvironment = 'historical' | 'bull' | 'stagflation' | 'black_swan';

export interface TimelineEvent {
  id: string;
  yearOffset: number; // 0 to 30
  label: string;
  type: 'windfall' | 'expense' | 'income_jump' | 'asset_buy' | 'shock';
  amount: number; // cash impact or delta
  description: string;
}

export interface MultiverseBranchConfig {
  id: string;
  name: string;
  codeName: string; // e.g. 'α', 'β', 'γ', 'δ', 'ε', 'ζ'
  tagline: string;
  color: string;
  accentBg: string;
  startingIncome: number;
  incomeGrowthRate: number; // e.g. 0.035 for 3.5%
  livingExpenses: number;
  lifestyleInflationRate: number; // e.g. 0.025
  savingsRate: number; // percentage of surplus saved / invested (0.1 to 0.95)
  investmentReturnRate: number; // e.g. 0.08
  hasRealEstate: boolean;
  realEstateDownPayment?: number;
  realEstateYear?: number;
  realEstateValue?: number;
  realEstateAppreciationRate?: number;
  rentalIncomeAnnual?: number;
  events: TimelineEvent[];
}

export interface YearlySimulationPoint {
  yearIndex: number;
  calendarYear: number;
  age: number;
  netWorth: number;
  liquidAssets: number;
  realEstateEquity: number;
  debt: number;
  annualIncome: number;
  annualExpenses: number;
  annualSavings: number;
  passiveIncome: number;
  isFireAchieved: boolean;
  eventsTriggered: string[];
}

export interface SimulationResult {
  config: MultiverseBranchConfig;
  points: YearlySimulationPoint[];
  terminalNetWorth: number;
  terminalLiquidAssets: number;
  fireCrossoverYear: number | null;
  fireCrossoverAge: number | null;
  wealthDeltaVsBaseline: number;
  resilienceScore: number; // 0 - 100
  regretRiskIndex: number; // 0 - 100
  radar: {
    freedomSpeed: number;
    downsideSafety: number;
    lifestyleLuxury: number;
    generationalWealth: number;
    liquidityFlexibility: number;
  };
  keyActionSteps: string[];
}

export interface GlobalSimInputs {
  startingAge: number;
  currentLiquid: number;
  currentDebt: number;
  macroEnv: MacroEnvironment;
  startYear: number;
}

export const MACRO_PROFILES: Record<
  MacroEnvironment,
  { label: string; description: string; nominalReturn: number; inflation: number; shockYear?: number; shockMagnitude?: number }
> = {
  historical: {
    label: 'Historical Normal',
    description: '7.8% long-term index return, 3.2% persistent inflation based on 50-year median.',
    nominalReturn: 0.078,
    inflation: 0.032,
  },
  bull: {
    label: 'Golden Secular Bull',
    description: 'High technological acceleration, 11.4% real yield, low 2.4% inflation.',
    nominalReturn: 0.114,
    inflation: 0.024,
  },
  stagflation: {
    label: 'Stagflation Crisis',
    description: 'Persistent sticky inflation of 6.5%, sluggish market yields at 3.5%, eroding purchasing power.',
    nominalReturn: 0.035,
    inflation: 0.065,
  },
  black_swan: {
    label: '2008-Style Shock',
    description: '-36% sudden drawdown in Year 3 with 36-month aggressive recovery (+18%/yr).',
    nominalReturn: 0.078,
    inflation: 0.032,
    shockYear: 3,
    shockMagnitude: -0.36,
  },
};

export const DEFAULT_UNIVERSES: MultiverseBranchConfig[] = [
  {
    id: 'universe-alpha',
    name: 'Timeline Alpha',
    codeName: 'α Current Reality',
    tagline: 'Standard corporate track, steady 3.5% increments, balanced index fund DCA.',
    color: '#10B981', // Emerald
    accentBg: 'rgba(16, 185, 129, 0.12)',
    startingIncome: 75000,
    incomeGrowthRate: 0.035,
    livingExpenses: 46000,
    lifestyleInflationRate: 0.03,
    savingsRate: 0.35,
    investmentReturnRate: 0.075,
    hasRealEstate: false,
    events: [
      { id: 'e1', yearOffset: 5, label: 'Promotion to Senior', type: 'income_jump', amount: 15000, description: 'Step function income advancement' },
      { id: 'e2', yearOffset: 12, label: 'Family Major Milestones', type: 'expense', amount: 28000, description: 'Lifestyle & home upgrade' },
    ],
  },
  {
    id: 'universe-beta',
    name: 'Timeline Beta',
    codeName: 'β Silicon Nomad',
    tagline: 'Remote high-leverage contracting + Year 5 geographic arbitrage relocation.',
    color: '#06B6D4', // Cyan
    accentBg: 'rgba(6, 182, 212, 0.12)',
    startingIncome: 110000,
    incomeGrowthRate: 0.06,
    livingExpenses: 58000,
    lifestyleInflationRate: 0.025,
    savingsRate: 0.52,
    investmentReturnRate: 0.088,
    hasRealEstate: false,
    events: [
      { id: 'eb1', yearOffset: 2, label: 'Contractor Rate Spike (+30%)', type: 'income_jump', amount: 32000, description: 'International client retainers' },
      { id: 'eb2', yearOffset: 5, label: 'Geo-Arbitrage Relocation', type: 'windfall', amount: 0, description: 'Cost of living cut by 28%' },
      { id: 'eb3', yearOffset: 7, label: 'Tech Advisory Equity Liquidation', type: 'windfall', amount: 85000, description: 'Secondary equity cashout' },
    ],
  },
  {
    id: 'universe-gamma',
    name: 'Timeline Gamma',
    codeName: 'γ Radical F.I.R.E.',
    tagline: '68% hyper-austere savings rate, low-cost indexing, retirement in under 8 years.',
    color: '#84CC16', // Lime Green
    accentBg: 'rgba(132, 204, 22, 0.12)',
    startingIncome: 80000,
    incomeGrowthRate: 0.04,
    livingExpenses: 28000,
    lifestyleInflationRate: 0.018,
    savingsRate: 0.68,
    investmentReturnRate: 0.085,
    hasRealEstate: false,
    events: [
      { id: 'eg1', yearOffset: 1, label: 'Zero-Waste Vehicle Swap', type: 'windfall', amount: 12000, description: 'Liquidated luxury vehicle for transit' },
      { id: 'eg2', yearOffset: 8, label: 'FIRE Crossover: Full Freedom Mode', type: 'windfall', amount: 0, description: 'Passive dividends outpace living costs' },
    ],
  },
  {
    id: 'universe-delta',
    name: 'Timeline Delta',
    codeName: 'δ Leveraged Asset Mogul',
    tagline: 'Dual real estate acquisitions with rental cashflow yield and mortgage paydown.',
    color: '#F59E0B', // Amber
    accentBg: 'rgba(245, 158, 11, 0.12)',
    startingIncome: 85000,
    incomeGrowthRate: 0.04,
    livingExpenses: 48000,
    lifestyleInflationRate: 0.03,
    savingsRate: 0.40,
    investmentReturnRate: 0.07,
    hasRealEstate: true,
    realEstateDownPayment: 60000,
    realEstateYear: 3,
    realEstateValue: 300000,
    realEstateAppreciationRate: 0.045,
    rentalIncomeAnnual: 21600,
    events: [
      { id: 'ed1', yearOffset: 3, label: 'Duplex Acquisition & Househack', type: 'asset_buy', amount: 60000, description: '$300k asset with $1,800/mo rental yield' },
      { id: 'ed2', yearOffset: 9, label: 'Second Multi-Unit Acquisition', type: 'asset_buy', amount: 75000, description: '$380k property expansion' },
    ],
  },
  {
    id: 'universe-epsilon',
    name: 'Timeline Epsilon',
    codeName: 'ε Founder Venture Mode',
    tagline: '18 months $0 salary burn runway, product monetization, then $500k Year 7 exit.',
    color: '#A855F7', // Purple/Violet
    accentBg: 'rgba(168, 85, 247, 0.12)',
    startingIncome: 20000, // Bootstrapping stipend
    incomeGrowthRate: 0.15,
    livingExpenses: 34000,
    lifestyleInflationRate: 0.02,
    savingsRate: 0.60,
    investmentReturnRate: 0.08,
    hasRealEstate: false,
    events: [
      { id: 'ee1', yearOffset: 2, label: 'Seed Round & Salary Normalization ($120k)', type: 'income_jump', amount: 100000, description: 'Product-market fit attained' },
      { id: 'ee2', yearOffset: 7, label: 'Strategic Acquisition Secondary Cashout', type: 'windfall', amount: 520000, description: 'Partial exit windfall into index funds' },
    ],
  },
];

export function runMultiverseSimulation(
  universes: MultiverseBranchConfig[],
  inputs: GlobalSimInputs
): SimulationResult[] {
  const macro = MACRO_PROFILES[inputs.macroEnv];
  const horizonYears = 30;

  // First run Alpha to get baseline for delta calculation
  const results: SimulationResult[] = [];

  universes.forEach((cfg) => {
    let currentLiquid = Math.max(0, inputs.currentLiquid);
    let currentDebt = Math.max(0, inputs.currentDebt);
    let realEstateEquity = 0;
    let realEstateDebt = 0;
    let propertyValue = 0;

    let income = cfg.startingIncome;
    let expenses = cfg.livingExpenses;

    const points: YearlySimulationPoint[] = [];
    let fireCrossoverYear: number | null = null;
    let fireCrossoverAge: number | null = null;

    for (let yr = 0; yr <= horizonYears; yr++) {
      const calendarYear = inputs.startYear + yr;
      const age = inputs.startingAge + yr;
      const eventsThisYear: string[] = [];

      // Check configured life events
      cfg.events.forEach((ev) => {
        if (ev.yearOffset === yr) {
          eventsThisYear.push(ev.label);
          if (ev.type === 'windfall') {
            currentLiquid += ev.amount;
          } else if (ev.type === 'expense') {
            currentLiquid = Math.max(0, currentLiquid - ev.amount);
          } else if (ev.type === 'income_jump') {
            income += ev.amount;
          }
        }
      });

      // Special handling for Beta geo-arbitrage at year 5
      if (cfg.id === 'universe-beta' && yr >= 5) {
        expenses = Math.round(expenses * 0.98); // Cost of living savings
      }

      // Real estate acquisition event
      if (cfg.hasRealEstate && cfg.realEstateYear === yr && cfg.realEstateValue && cfg.realEstateDownPayment) {
        const down = cfg.realEstateDownPayment;
        if (currentLiquid >= down) {
          currentLiquid -= down;
          propertyValue = cfg.realEstateValue;
          realEstateEquity = down;
          realEstateDebt = propertyValue - down;
          eventsThisYear.push(`Acquired Property worth $${propertyValue.toLocaleString()}`);
        }
      }

      // Macro return & shock calculation
      let marketRate = macro.nominalReturn;
      if (macro.shockYear === yr && macro.shockMagnitude) {
        marketRate = macro.shockMagnitude;
        eventsThisYear.push('Macro Shock (-36% Market Drawdown)');
      } else if (macro.shockYear && yr > macro.shockYear && yr <= macro.shockYear + 3) {
        marketRate = 0.18; // Post-shock rebound
      }

      // Compound liquid investments
      const investmentGrowth = currentLiquid * marketRate;
      currentLiquid += investmentGrowth;

      // Real estate appreciation and mortgage paydown
      if (propertyValue > 0) {
        propertyValue *= 1 + (cfg.realEstateAppreciationRate || 0.04);
        const mortgagePayment = realEstateDebt * 0.065;
        const principalPaid = mortgagePayment * 0.45;
        realEstateDebt = Math.max(0, realEstateDebt - principalPaid);
        realEstateEquity = propertyValue - realEstateDebt;
        if (cfg.rentalIncomeAnnual) {
          income += cfg.rentalIncomeAnnual;
        }
      }

      // Cash flow this year
      const grossSurplus = income - expenses;
      const annualSavings = grossSurplus > 0 ? grossSurplus * cfg.savingsRate : grossSurplus;

      if (annualSavings > 0) {
        currentLiquid += annualSavings;
        // Pay down baseline debt first if any
        if (currentDebt > 0) {
          const debtPay = Math.min(currentDebt, annualSavings * 0.3);
          currentDebt -= debtPay;
          currentLiquid -= debtPay;
        }
      } else {
        // Deficit: burn liquid or accumulate debt
        if (currentLiquid >= Math.abs(annualSavings)) {
          currentLiquid -= Math.abs(annualSavings);
        } else {
          currentDebt += Math.abs(annualSavings) - currentLiquid;
          currentLiquid = 0;
        }
      }

      const netWorth = Math.round(currentLiquid + realEstateEquity - currentDebt);
      const passiveIncome = Math.round(currentLiquid * 0.04); // 4% SWR
      const isFire = passiveIncome >= expenses && netWorth > 0;

      if (isFire && fireCrossoverYear === null) {
        fireCrossoverYear = calendarYear;
        fireCrossoverAge = age;
        eventsThisYear.push('🔥 FIRE Crossover: Passive Income > Living Burn');
      }

      points.push({
        yearIndex: yr,
        calendarYear,
        age,
        netWorth: Math.max(-50000, netWorth),
        liquidAssets: Math.round(currentLiquid),
        realEstateEquity: Math.round(realEstateEquity),
        debt: Math.round(currentDebt),
        annualIncome: Math.round(income),
        annualExpenses: Math.round(expenses),
        annualSavings: Math.round(annualSavings),
        passiveIncome,
        isFireAchieved: isFire,
        eventsTriggered: eventsThisYear,
      });

      // Inflate income & expenses for next year
      income = Math.round(income * (1 + cfg.incomeGrowthRate));
      expenses = Math.round(expenses * (1 + (macro.inflation || cfg.lifestyleInflationRate)));
    }

    const terminalNetWorth = points[points.length - 1].netWorth;
    const terminalLiquid = points[points.length - 1].liquidAssets;

    // Resilience & Regret Risk Scoring
    const burnRunwayMonths = points[0].annualExpenses > 0 ? (points[0].liquidAssets / (points[0].annualExpenses / 12)) : 0;
    const debtRatio = points[points.length - 1].debt / Math.max(1, terminalNetWorth);
    const resilienceScore = Math.min(99, Math.max(25, Math.round(
      Math.min(30, burnRunwayMonths * 2.5) + (1 - Math.min(1, debtRatio)) * 40 + (fireCrossoverYear ? 30 : 15)
    )));
    const regretRiskIndex = Math.min(95, Math.max(10, Math.round(
      100 - resilienceScore + (cfg.savingsRate > 0.65 ? 20 : 0) // Over-frugality regret penalty
    )));

    // Radar scoring (0 to 100)
    const freedomSpeed = fireCrossoverAge
      ? Math.min(100, Math.max(20, Math.round(100 - (fireCrossoverAge - inputs.startingAge) * 3)))
      : 30;
    const downsideSafety = Math.min(100, Math.max(25, resilienceScore));
    const lifestyleLuxury = Math.min(100, Math.max(20, Math.round((cfg.livingExpenses / 60000) * 80)));
    const generationalWealth = Math.min(100, Math.max(20, Math.round((terminalNetWorth / 3000000) * 100)));
    const liquidityFlexibility = Math.min(100, Math.max(15, Math.round((terminalLiquid / Math.max(1, terminalNetWorth)) * 100)));

    // Action steps to materialize this universe
    const keyActionSteps: string[] = [];
    if (cfg.savingsRate > 0.45) {
      keyActionSteps.push(`Allocate minimum ${Math.round(cfg.savingsRate * 100)}% of monthly surplus directly into automated broad-market equity SIPs.`);
    }
    if (cfg.livingExpenses < 35000) {
      keyActionSteps.push(`Strictly ceiling discretionary lifestyle burn to $${Math.round(cfg.livingExpenses / 12).toLocaleString()}/month.`);
    } else {
      keyActionSteps.push(`Maintain core lifestyle budget near $${Math.round(cfg.livingExpenses / 12).toLocaleString()}/month without unvetted micro-leaks.`);
    }
    if (cfg.hasRealEstate) {
      keyActionSteps.push(`Accumulate $${cfg.realEstateDownPayment?.toLocaleString()} in a liquid arbitrage fund before Year ${cfg.realEstateYear} property closing.`);
    }
    if (cfg.id === 'universe-beta') {
      keyActionSteps.push('Pivot skills toward cross-border high-ticket client retainers to force early +30% income velocity.');
    } else if (cfg.id === 'universe-epsilon') {
      keyActionSteps.push('Maintain 14 months of absolute living runway in high-yield reserves before terminating corporate salary.');
    } else {
      keyActionSteps.push('Reinvest all dividends deterministically with zero cash drag.');
    }

    results.push({
      config: cfg,
      points,
      terminalNetWorth,
      terminalLiquidAssets: terminalLiquid,
      fireCrossoverYear,
      fireCrossoverAge,
      wealthDeltaVsBaseline: 0, // calculated in second pass
      resilienceScore,
      regretRiskIndex,
      radar: {
        freedomSpeed,
        downsideSafety,
        lifestyleLuxury,
        generationalWealth,
        liquidityFlexibility,
      },
      keyActionSteps,
    });
  });

  // Second pass: Calculate delta vs Baseline (Alpha)
  const alphaTerminal = results[0]?.terminalNetWorth || 1;
  results.forEach((res) => {
    res.wealthDeltaVsBaseline = res.terminalNetWorth - alphaTerminal;
  });

  return results;
}
