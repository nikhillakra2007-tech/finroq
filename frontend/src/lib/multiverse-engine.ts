/**
 * FINROQ Quantum Multiverse Engine
 * Pure mathematical simulation core for 30-year parallel life timelines,
 * calibrated in Indian Rupees (₹), FIRE crossover detection, and wealth divergence.
 */

export type MacroEnvironment = 'historical' | 'bull' | 'stagflation' | 'black_swan';

export interface TimelineEvent {
  id: string;
  yearOffset: number; // 0 to 30
  label: string;
  type: 'windfall' | 'expense' | 'income_jump' | 'asset_buy' | 'shock';
  amount: number; // cash impact in INR
  description: string;
}

export interface MultiverseBranchConfig {
  id: string;
  name: string;
  codeName: string; // e.g. 'α', 'β', 'γ', 'δ', 'ε', 'ζ'
  tagline: string;
  color: string;
  accentBg: string;
  startingIncome: number; // annual INR
  incomeGrowthRate: number; // e.g. 0.05 for 5%
  livingExpenses: number; // annual INR
  lifestyleInflationRate: number; // e.g. 0.04
  savingsRate: number; // percentage of surplus saved / invested (0.1 to 0.95)
  investmentReturnRate: number; // e.g. 0.12 (Indian equity index historical)
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

export function formatInrCompact(val: number): string {
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)} L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${Math.round(abs / 1000)}k`;
  }
  return `${sign}₹${Math.round(abs)}`;
}

export const MACRO_PROFILES: Record<
  MacroEnvironment,
  { label: string; description: string; nominalReturn: number; inflation: number; shockYear?: number; shockMagnitude?: number }
> = {
  historical: {
    label: 'Indian Historical Average',
    description: '12.5% Nifty 50 long-term CAGR, 5.5% average CPI inflation.',
    nominalReturn: 0.125,
    inflation: 0.055,
  },
  bull: {
    label: 'India Tech & GDP Boom',
    description: '15.8% equity surge, steady 4.2% inflation driven by digital expansion.',
    nominalReturn: 0.158,
    inflation: 0.042,
  },
  stagflation: {
    label: 'High Inflation Squeeze',
    description: 'High 8.2% inflation, muted 6.0% equity returns.',
    nominalReturn: 0.06,
    inflation: 0.082,
  },
  black_swan: {
    label: 'Market Shock & Rebound',
    description: '-32% sharp market dip in Year 3 with 3-year swift recovery (+22%/yr).',
    nominalReturn: 0.125,
    inflation: 0.055,
    shockYear: 3,
    shockMagnitude: -0.32,
  },
};

export const DEFAULT_UNIVERSES: MultiverseBranchConfig[] = [
  {
    id: 'universe-alpha',
    name: 'Timeline Alpha',
    codeName: 'α Current Track',
    tagline: 'Standard salaried role, 6% annual hike, disciplined 30% mutual fund SIP.',
    color: '#10B981', // Emerald
    accentBg: 'rgba(16, 185, 129, 0.12)',
    startingIncome: 850000, // ₹8.5L/yr
    incomeGrowthRate: 0.06,
    livingExpenses: 480000, // ₹40k/mo
    lifestyleInflationRate: 0.05,
    savingsRate: 0.35,
    investmentReturnRate: 0.12,
    hasRealEstate: false,
    events: [
      { id: 'e1', yearOffset: 4, label: 'Promotion to Lead', type: 'income_jump', amount: 350000, description: 'Promotion salary hike' },
      { id: 'e2', yearOffset: 10, label: 'Family Celebration', type: 'expense', amount: 400000, description: 'Lifestyle milestone' },
    ],
  },
  {
    id: 'universe-beta',
    name: 'Timeline Beta',
    codeName: 'β High-Growth Career',
    tagline: 'Fast job transitions, global remote consulting, moving from ₹14L to ₹35L+.',
    color: '#06B6D4', // Cyan
    accentBg: 'rgba(6, 182, 212, 0.12)',
    startingIncome: 1400000, // ₹14L/yr
    incomeGrowthRate: 0.09,
    livingExpenses: 650000,
    lifestyleInflationRate: 0.045,
    savingsRate: 0.52,
    investmentReturnRate: 0.135,
    hasRealEstate: false,
    events: [
      { id: 'eb1', yearOffset: 2, label: 'Remote Contract Hike (+35%)', type: 'income_jump', amount: 500000, description: 'International clients' },
      { id: 'eb2', yearOffset: 6, label: 'ESOP / Stock Vesting', type: 'windfall', amount: 1500000, description: '₹15L ESOP liquidation' },
    ],
  },
  {
    id: 'universe-gamma',
    name: 'Timeline Gamma',
    codeName: 'γ Radical F.I.R.E.',
    tagline: 'Ruthless 65% savings rate into Nifty index funds. Freedom crossover before Age 35.',
    color: '#84CC16', // Lime
    accentBg: 'rgba(132, 204, 22, 0.12)',
    startingIncome: 950000,
    incomeGrowthRate: 0.07,
    livingExpenses: 330000, // ₹27.5k/mo frugal
    lifestyleInflationRate: 0.035,
    savingsRate: 0.65,
    investmentReturnRate: 0.13,
    hasRealEstate: false,
    events: [
      { id: 'eg1', yearOffset: 1, label: 'Bike Swap & Zero EMI', type: 'windfall', amount: 120000, description: 'Sold depreciating vehicle' },
      { id: 'eg2', yearOffset: 8, label: 'FIRE Freedom Day Achieved', type: 'windfall', amount: 0, description: 'Passive dividends exceed living burn' },
    ],
  },
  {
    id: 'universe-delta',
    name: 'Timeline Delta',
    codeName: 'δ Real Estate Mogul',
    tagline: 'Flat down payment at Year 3, rental income yield + long-term land appreciation.',
    color: '#F59E0B', // Amber
    accentBg: 'rgba(245, 158, 11, 0.12)',
    startingIncome: 1100000,
    incomeGrowthRate: 0.06,
    livingExpenses: 540000,
    lifestyleInflationRate: 0.05,
    savingsRate: 0.40,
    investmentReturnRate: 0.11,
    hasRealEstate: true,
    realEstateDownPayment: 1200000, // ₹12L down
    realEstateYear: 3,
    realEstateValue: 5500000, // ₹55L flat
    realEstateAppreciationRate: 0.07,
    rentalIncomeAnnual: 240000, // ₹20k/mo rent
    events: [
      { id: 'ed1', yearOffset: 3, label: 'Flat Purchase (₹55L)', type: 'asset_buy', amount: 1200000, description: '20% down payment' },
    ],
  },
  {
    id: 'universe-epsilon',
    name: 'Timeline Epsilon',
    codeName: 'ε Founder Journey',
    tagline: '18 months bootstrapping, product monetization, scaling to high profit distributions.',
    color: '#A855F7', // Violet
    accentBg: 'rgba(168, 85, 247, 0.12)',
    startingIncome: 300000, // ₹25k/mo stipend
    incomeGrowthRate: 0.18,
    livingExpenses: 360000,
    lifestyleInflationRate: 0.04,
    savingsRate: 0.55,
    investmentReturnRate: 0.12,
    hasRealEstate: false,
    events: [
      { id: 'ee1', yearOffset: 2, label: 'Product Breakeven (₹18L Salary)', type: 'income_jump', amount: 1500000, description: 'Profitable SaaS/agency' },
      { id: 'ee2', yearOffset: 7, label: 'Angel Investment Liquidation', type: 'windfall', amount: 3500000, description: '₹35L secondary buyout' },
    ],
  },
];

export function runMultiverseSimulation(
  universes: MultiverseBranchConfig[],
  inputs: GlobalSimInputs
): SimulationResult[] {
  const macro = MACRO_PROFILES[inputs.macroEnv];
  const horizonYears = 30;

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

      // Real estate acquisition event
      if (cfg.hasRealEstate && cfg.realEstateYear === yr && cfg.realEstateValue && cfg.realEstateDownPayment) {
        const down = cfg.realEstateDownPayment;
        if (currentLiquid >= down) {
          currentLiquid -= down;
          propertyValue = cfg.realEstateValue;
          realEstateEquity = down;
          realEstateDebt = propertyValue - down;
          eventsThisYear.push(`Bought Flat (${formatInrCompact(propertyValue)})`);
        }
      }

      // Macro return & shock calculation
      let marketRate = macro.nominalReturn;
      if (macro.shockYear === yr && macro.shockMagnitude) {
        marketRate = macro.shockMagnitude;
        eventsThisYear.push('Macro Dip (-32%)');
      } else if (macro.shockYear && yr > macro.shockYear && yr <= macro.shockYear + 3) {
        marketRate = 0.22; // Post-shock rebound
      }

      // Compound liquid investments
      const investmentGrowth = currentLiquid * marketRate;
      currentLiquid += investmentGrowth;

      // Real estate appreciation and mortgage paydown
      if (propertyValue > 0) {
        propertyValue *= 1 + (cfg.realEstateAppreciationRate || 0.06);
        const mortgagePayment = realEstateDebt * 0.085;
        const principalPaid = mortgagePayment * 0.4;
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
        if (currentDebt > 0) {
          const debtPay = Math.min(currentDebt, annualSavings * 0.3);
          currentDebt -= debtPay;
          currentLiquid -= debtPay;
        }
      } else {
        if (currentLiquid >= Math.abs(annualSavings)) {
          currentLiquid -= Math.abs(annualSavings);
        } else {
          currentDebt += Math.abs(annualSavings) - currentLiquid;
          currentLiquid = 0;
        }
      }

      const netWorth = Math.round(currentLiquid + realEstateEquity - currentDebt);
      const passiveIncome = Math.round(currentLiquid * 0.05); // 5% Safe Withdrawal Rate for India
      const isFire = passiveIncome >= expenses && netWorth > 0;

      if (isFire && fireCrossoverYear === null) {
        fireCrossoverYear = calendarYear;
        fireCrossoverAge = age;
        eventsThisYear.push('🔥 FIRE Achieved');
      }

      points.push({
        yearIndex: yr,
        calendarYear,
        age,
        netWorth: Math.max(-500000, netWorth),
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

      income = Math.round(income * (1 + cfg.incomeGrowthRate));
      expenses = Math.round(expenses * (1 + (macro.inflation || cfg.lifestyleInflationRate)));
    }

    const terminalNetWorth = points[points.length - 1].netWorth;
    const terminalLiquid = points[points.length - 1].liquidAssets;

    const burnRunwayMonths = points[0].annualExpenses > 0 ? (points[0].liquidAssets / (points[0].annualExpenses / 12)) : 0;
    const debtRatio = points[points.length - 1].debt / Math.max(1, terminalNetWorth);
    const resilienceScore = Math.min(99, Math.max(25, Math.round(
      Math.min(30, burnRunwayMonths * 2.5) + (1 - Math.min(1, debtRatio)) * 40 + (fireCrossoverYear ? 30 : 15)
    )));
    const regretRiskIndex = Math.min(95, Math.max(10, Math.round(
      100 - resilienceScore + (cfg.savingsRate > 0.65 ? 15 : 0)
    )));

    const freedomSpeed = fireCrossoverAge
      ? Math.min(100, Math.max(20, Math.round(100 - (fireCrossoverAge - inputs.startingAge) * 3)))
      : 30;
    const downsideSafety = Math.min(100, Math.max(25, resilienceScore));
    const lifestyleLuxury = Math.min(100, Math.max(20, Math.round((cfg.livingExpenses / 600000) * 80)));
    const generationalWealth = Math.min(100, Math.max(20, Math.round((terminalNetWorth / 50000000) * 100)));
    const liquidityFlexibility = Math.min(100, Math.max(15, Math.round((terminalLiquid / Math.max(1, terminalNetWorth)) * 100)));

    // Short, punchy action steps
    const keyActionSteps: string[] = [];
    if (cfg.savingsRate > 0.5) {
      keyActionSteps.push(`Automate SIP of ${Math.round(cfg.savingsRate * 100)}% monthly surplus on salary day.`);
    } else {
      keyActionSteps.push(`Maintain regular ₹${Math.round((cfg.startingIncome * cfg.savingsRate) / 12).toLocaleString()}/mo index SIP.`);
    }
    keyActionSteps.push(`Cap living expenses at ₹${Math.round(cfg.livingExpenses / 12).toLocaleString()}/month.`);
    if (cfg.hasRealEstate) {
      keyActionSteps.push(`Build ${formatInrCompact(cfg.realEstateDownPayment || 1200000)} liquid capital before Year ${cfg.realEstateYear} property closing.`);
    }

    results.push({
      config: cfg,
      points,
      terminalNetWorth,
      terminalLiquidAssets: terminalLiquid,
      fireCrossoverYear,
      fireCrossoverAge,
      wealthDeltaVsBaseline: 0,
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

  const alphaTerminal = results[0]?.terminalNetWorth || 1;
  results.forEach((res) => {
    res.wealthDeltaVsBaseline = res.terminalNetWorth - alphaTerminal;
  });

  return results;
}
