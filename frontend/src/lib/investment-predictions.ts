/**
 * FINROQ Youth Investment & IPO Prediction Engine
 * Curated for students, early career professionals, and young wealth builders.
 * All figures calibrated in Indian Rupees (₹).
 */

export type UserPersona = 'student' | 'first_job' | 'wealth_builder';

export interface MutualFundPick {
  id: string;
  name: string;
  amc: string;
  category: 'Index' | 'Flexi-Cap' | 'Mid-Cap' | 'ELSS (Tax Saving)' | 'Liquid';
  cagr3Yr: number; // e.g. 16.4 for 16.4%
  cagr5Yr: number;
  minSip: number; // in INR (e.g. 100 or 500)
  riskLevel: 'Low' | 'Moderate' | 'High';
  idealFor: string;
  predictionVerdict: string;
  rating: number; // 1 to 5
}

export interface IpoPrediction {
  id: string;
  companyName: string;
  symbol: string;
  sector: string;
  priceBand: string;
  issueSizeInrCr: number; // in Crores
  gmpInr: number; // Grey Market Premium in ₹
  gmpPercent: number; // GMP %
  expectedListingDate: string;
  subscriptionDemand: 'Massive' | 'High' | 'Moderate' | 'Subdued';
  predictionSignal: 'STRONG APPLY' | 'APPLY FOR LISTING' | 'LONG-TERM HOLD' | 'AVOID';
  signalColor: string; // hex
  shortReason: string;
}

export interface PersonaGuide {
  id: UserPersona;
  badge: string;
  title: string;
  subtitle: string;
  suggestedBudgetMonthly: string;
  recommendedSplit: {
    label: string;
    percentage: number;
    description: string;
  }[];
  quickAdvice: string[];
}

export const PERSONA_GUIDES: Record<UserPersona, PersonaGuide> = {
  student: {
    id: 'student',
    badge: '🎓 Student / Pocket Money',
    title: 'Zero-Stress Pocket Money Compounder',
    subtitle: 'Start with just ₹500 - ₹2,000/month. You have the ultimate superpower: 35+ years of time.',
    suggestedBudgetMonthly: '₹500 - ₹2,500/month',
    recommendedSplit: [
      { label: 'Nifty 50 Index Fund', percentage: 70, description: 'Top 50 Indian companies. Zero stock picking headache.' },
      { label: 'High-Growth Midcap', percentage: 20, description: 'Small allocation to emerging tech & retail leaders.' },
      { label: 'Liquid Emergency Cash', percentage: 10, description: 'Bank/Liquid fund for college projects & travel.' },
    ],
    quickAdvice: [
      'Do not try day trading or F&O options. 93% of retail options traders lose capital.',
      'A ₹1,500/month SIP started at age 20 compounds to over ₹1.05 Crore by age 50 at 14% CAGR.',
      'Pick funds with direct plans and expense ratio under 0.40%.',
    ],
  },
  first_job: {
    id: 'first_job',
    badge: '💼 First Job / Early Salary',
    title: 'First Salary Wealth Foundation',
    subtitle: 'Automate investing on salary day before lifestyle inflation creeps in.',
    suggestedBudgetMonthly: '₹5,000 - ₹20,000/month',
    recommendedSplit: [
      { label: 'Large & Flexi-Cap Funds', percentage: 50, description: 'Stable blue-chip core for compounding.' },
      { label: 'Mid & Small-Cap SIP', percentage: 25, description: 'Aggressive alpha generation for long-term.' },
      { label: 'Tax Saving ELSS / 80C', percentage: 15, description: 'Save income tax while compounding.' },
      { label: 'IPO Listing Gains Buffer', percentage: 10, description: 'Cash parked in liquid funds ready for high GMP IPOs.' },
    ],
    quickAdvice: [
      'Follow 50:30:20 rule (50% essentials, 30% lifestyle, 20%+ automated SIPs).',
      'Build 3 months of emergency expenses before taking high equity risks.',
      'Apply to high-GMP IPOs through retail category for quick listing gains.',
    ],
  },
  wealth_builder: {
    id: 'wealth_builder',
    badge: '🚀 Young Professional / Pro',
    title: 'Aggressive Wealth Acceleration',
    subtitle: 'High savings capacity, multi-asset diversification, and calculated IPO allocations.',
    suggestedBudgetMonthly: '₹25,000 - ₹1,00,000+/month',
    recommendedSplit: [
      { label: 'Multi-Cap & Flexi-Cap SIP', percentage: 40, description: 'Core engine across large, mid, and small.' },
      { label: 'Small-Cap & Momentum', percentage: 25, description: 'High-beta emerging industry leaders.' },
      { label: 'Selective High-GMP IPOs', percentage: 15, description: 'Rotating capital for 25%+ listing gain pops.' },
      { label: 'International / Tech ETF', percentage: 10, description: 'Global diversification.' },
      { label: 'Liquid Gold / Debt Buffer', percentage: 10, description: 'Dry powder to buy market dips.' },
    ],
    quickAdvice: [
      'Step up your SIP by 10% every time you get a salary hike or promotion.',
      'Avoid selling during market corrections — that is when unit compounding accelerates.',
      'Check institutional QIB demand before bidding on any mainline IPO.',
    ],
  },
};

export const TOP_MUTUAL_FUNDS: MutualFundPick[] = [
  {
    id: 'mf-1',
    name: 'UTI Nifty 50 Index Fund',
    amc: 'UTI Mutual Fund',
    category: 'Index',
    cagr3Yr: 15.8,
    cagr5Yr: 16.4,
    minSip: 500,
    riskLevel: 'Moderate',
    idealFor: 'Students & First-Time Investors',
    predictionVerdict: 'Zero-effort cornerstone. Predicts steady 12-14% long-term CAGR matching Indian GDP growth.',
    rating: 5,
  },
  {
    id: 'mf-2',
    name: 'Parag Parikh Flexi Cap Fund',
    amc: 'PPFAS Mutual Fund',
    category: 'Flexi-Cap',
    cagr3Yr: 21.2,
    cagr5Yr: 22.8,
    minSip: 1000,
    riskLevel: 'Moderate',
    idealFor: 'Salaried Professionals',
    predictionVerdict: 'Top consistency score. Balanced mix of Indian cash-rich giants + international tech.',
    rating: 5,
  },
  {
    id: 'mf-3',
    name: 'Nippon India Small Cap Fund',
    amc: 'Nippon Life India',
    category: 'Mid-Cap',
    cagr3Yr: 28.4,
    cagr5Yr: 27.6,
    minSip: 100, // Accessible to students with ₹100!
    riskLevel: 'High',
    idealFor: 'Aggressive Youth Investors (10+ Yr Horizon)',
    predictionVerdict: 'High volatility, high alpha. Outstanding track record across 15+ years of market cycles.',
    rating: 5,
  },
  {
    id: 'mf-4',
    name: 'Mirae Asset Large & Midcap Fund',
    amc: 'Mirae Asset',
    category: 'Flexi-Cap',
    cagr3Yr: 19.5,
    cagr5Yr: 20.1,
    minSip: 500,
    riskLevel: 'Moderate',
    idealFor: 'Balanced Growth Seekers',
    predictionVerdict: 'Stable wealth multiplier capturing India manufacturing and digital consumption.',
    rating: 4,
  },
  {
    id: 'mf-5',
    name: 'Quant ELSS Tax Saver Fund',
    amc: 'Quant Mutual Fund',
    category: 'ELSS (Tax Saving)',
    cagr3Yr: 26.2,
    cagr5Yr: 29.4,
    minSip: 500,
    riskLevel: 'High',
    idealFor: 'Tax Payers Needing 80C Deductions',
    predictionVerdict: 'Lowest lock-in (3 years) with highest historical compounding in ELSS category.',
    rating: 4,
  },
];

export const UPCOMING_IPOS: IpoPrediction[] = [
  {
    id: 'ipo-1',
    companyName: 'Swiggy Limited',
    symbol: 'SWIGGY',
    sector: 'Consumer Tech & Quick Commerce',
    priceBand: '₹371 – ₹390',
    issueSizeInrCr: 11327,
    gmpInr: 42,
    gmpPercent: 10.8,
    expectedListingDate: 'Active / Nov 2024',
    subscriptionDemand: 'High',
    predictionSignal: 'APPLY FOR LISTING',
    signalColor: '#10B981',
    shortReason: 'Instamart quick-commerce market share turnaround; expect 10-15% initial listing pop.',
  },
  {
    id: 'ipo-2',
    companyName: 'NTPC Green Energy',
    symbol: 'NTPCGREEN',
    sector: 'Renewable Power & Clean Energy',
    priceBand: '₹102 – ₹108',
    issueSizeInrCr: 10000,
    gmpInr: 28,
    gmpPercent: 25.9,
    expectedListingDate: 'Upcoming Nov',
    subscriptionDemand: 'Massive',
    predictionSignal: 'STRONG APPLY',
    signalColor: '#059669',
    shortReason: 'PSU giant backing + high institutional anchor book. Strong listing gain predicted.',
  },
  {
    id: 'ipo-3',
    companyName: 'Mobikwik Systems',
    symbol: 'MOBIKWIK',
    sector: 'Fintech & Digital Credit',
    priceBand: '₹260 – ₹279',
    issueSizeInrCr: 700,
    gmpInr: 15,
    gmpPercent: 5.4,
    expectedListingDate: 'Q4 2024',
    subscriptionDemand: 'Moderate',
    predictionSignal: 'LONG-TERM HOLD',
    signalColor: '#F59E0B',
    shortReason: 'Small issue size, lending margins improving, but valuation leaves limited day-1 buffer.',
  },
  {
    id: 'ipo-4',
    companyName: 'Hyundai Motor India',
    symbol: 'HYUNDAI',
    sector: 'Automobile OEM',
    priceBand: '₹1,865 – ₹1,960',
    issueSizeInrCr: 27870,
    gmpInr: -12,
    gmpPercent: -0.6,
    expectedListingDate: 'Listed Recent',
    subscriptionDemand: 'Subdued',
    predictionSignal: 'LONG-TERM HOLD',
    signalColor: '#6B7280',
    shortReason: 'Oversized OFS issue led to flat listing; fundamentally solid for 5-year auto compounding.',
  },
  {
    id: 'ipo-5',
    companyName: 'Acme Solar Holdings',
    symbol: 'ACMESOLAR',
    sector: 'Solar & Renewable Utilities',
    priceBand: '₹275 – ₹289',
    issueSizeInrCr: 2900,
    gmpInr: 35,
    gmpPercent: 12.1,
    expectedListingDate: 'Upcoming',
    subscriptionDemand: 'High',
    predictionSignal: 'APPLY FOR LISTING',
    signalColor: '#10B981',
    shortReason: 'Capacity expansion under green energy corridors, favorable bidding pipeline.',
  },
];

/**
 * Predicts SIP compound growth in ₹ INR.
 */
export function calculateSipPrediction(
  monthlyInr: number,
  expectedAnnualReturnPct: number,
  years: number
): {
  totalInvested: number;
  expectedWealth: number;
  wealthGain: number;
  fdComparison: number;
  savingsAccountComparison: number;
} {
  const months = years * 12;
  const monthlyRate = expectedAnnualReturnPct / 100 / 12;

  // SIP formula: P * [( (1 + r)^n - 1 ) / r] * (1 + r)
  let expectedWealth = 0;
  if (monthlyRate > 0) {
    expectedWealth = monthlyInr * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  } else {
    expectedWealth = monthlyInr * months;
  }

  const totalInvested = monthlyInr * months;
  const wealthGain = Math.max(0, expectedWealth - totalInvested);

  // Compare with 7% FD
  const fdMonthlyRate = 0.07 / 12;
  const fdComparison = monthlyInr * ((Math.pow(1 + fdMonthlyRate, months) - 1) / fdMonthlyRate) * (1 + fdMonthlyRate);

  // Compare with 3.5% Savings Account
  const savingsMonthlyRate = 0.035 / 12;
  const savingsAccountComparison = monthlyInr * ((Math.pow(1 + savingsMonthlyRate, months) - 1) / savingsMonthlyRate) * (1 + savingsMonthlyRate);

  return {
    totalInvested: Math.round(totalInvested),
    expectedWealth: Math.round(expectedWealth),
    wealthGain: Math.round(wealthGain),
    fdComparison: Math.round(fdComparison),
    savingsAccountComparison: Math.round(savingsAccountComparison),
  };
}

/**
 * Calculates the "Youngster Edge" — starting at age 20 vs starting at age 30.
 */
export function calculateYoungsterAdvantage(monthlyInr: number = 2000): {
  starter20WealthAt50: number;
  starter30WealthAt50: number;
  multiplier: number;
} {
  const at20 = calculateSipPrediction(monthlyInr, 14, 30); // 30 years
  const at30 = calculateSipPrediction(monthlyInr, 14, 20); // 20 years
  const multiplier = Number((at20.expectedWealth / Math.max(1, at30.expectedWealth)).toFixed(1));

  return {
    starter20WealthAt50: at20.expectedWealth,
    starter30WealthAt50: at30.expectedWealth,
    multiplier,
  };
}
