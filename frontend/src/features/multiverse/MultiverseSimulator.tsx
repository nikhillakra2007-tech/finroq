'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Flame,
  ShieldCheck,
  Zap,
  Plus,
  Sliders,
  Calendar,
  ChevronRight,
  Eye,
  EyeOff,
  Compass,
} from 'lucide-react';
import {
  MultiverseBranchConfig,
  GlobalSimInputs,
  MacroEnvironment,
  SimulationResult,
  MACRO_PROFILES,
  DEFAULT_UNIVERSES,
  runMultiverseSimulation,
  formatInrCompact,
} from '@/lib/multiverse-engine';
import { useI18n } from '@/lib/i18n-context';

export function MultiverseSimulator() {
  const { t } = useI18n();

  // Starting inputs in INR
  const [inputs, setInputs] = useState<GlobalSimInputs>({
    startingAge: 25,
    currentLiquid: 250000, // ₹2.5L
    currentDebt: 50000,    // ₹50k
    macroEnv: 'historical',
    startYear: 2024,
  });

  const [branches, setBranches] = useState<MultiverseBranchConfig[]>(DEFAULT_UNIVERSES);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>('universe-gamma');
  const [hiddenUniverseIds, setHiddenUniverseIds] = useState<Set<string>>(new Set());

  // Time Scrubber (0 to 30)
  const [scrubYear, setScrubYear] = useState<number>(8);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const animIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Custom branch state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customBranchName, setCustomBranchName] = useState('My Custom Plan');
  const [customSalary, setCustomSalary] = useState(1200000); // ₹12L
  const [customSavingsRate, setCustomSavingsRate] = useState(50);
  const [customLivingCost, setCustomLivingCost] = useState(480000); // ₹40k/mo

  const simResults: SimulationResult[] = useMemo(() => {
    return runMultiverseSimulation(branches, inputs);
  }, [branches, inputs]);

  const activeResult = useMemo(() => {
    return (
      simResults.find((r) => r.config.id === selectedUniverseId) ||
      simResults[0] ||
      null
    );
  }, [simResults, selectedUniverseId]);

  // Animation controller
  useEffect(() => {
    if (isPlaying) {
      const delay = Math.round(400 / playbackSpeed);
      animIntervalRef.current = setInterval(() => {
        setScrubYear((prev) => {
          if (prev >= 30) {
            setIsPlaying(false);
            return 30;
          }
          return prev + 1;
        });
      }, delay);
    } else {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    }
    return () => {
      if (animIntervalRef.current) clearInterval(animIntervalRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  const toggleUniverseVisibility = (id: string) => {
    setHiddenUniverseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCustomBranch = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `universe-custom-${Date.now()}`;
    const newConfig: MultiverseBranchConfig = {
      id: newId,
      name: customBranchName,
      codeName: 'ζ Custom',
      tagline: `Custom plan: ${formatInrCompact(customSalary)}/yr, ${customSavingsRate}% SIP.`,
      color: '#EC4899',
      accentBg: 'rgba(236, 72, 153, 0.12)',
      startingIncome: customSalary,
      incomeGrowthRate: 0.07,
      livingExpenses: customLivingCost,
      lifestyleInflationRate: 0.05,
      savingsRate: customSavingsRate / 100,
      investmentReturnRate: 0.125,
      hasRealEstate: false,
      events: [],
    };

    setBranches((prev) => [...prev, newConfig]);
    setSelectedUniverseId(newId);
    setIsModalOpen(false);
  };

  const maxNetWorth = useMemo(() => {
    let max = 10000000;
    simResults.forEach((r) => {
      r.points.forEach((p) => {
        if (p.netWorth > max) max = p.netWorth;
      });
    });
    return Math.ceil(max / 10000000) * 10000000;
  }, [simResults]);

  const chartWidth = 860;
  const chartHeight = 320;
  const padding = { top: 25, right: 35, bottom: 40, left: 70 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const scaleX = (yr: number) => padding.left + (yr / 30) * innerWidth;
  const scaleY = (val: number) => {
    const clamped = Math.max(-500000, Math.min(maxNetWorth, val));
    return padding.top + innerHeight - (clamped / maxNetWorth) * innerHeight;
  };

  const currentScrubbedYear = inputs.startYear + scrubYear;
  const currentScrubbedAge = inputs.startingAge + scrubYear;

  return (
    <div className="space-y-6">
      {/* Header & Quick Climate Controls */}
      <div className="bg-white dark:bg-[#16251E] rounded-2xl p-5 border border-[#CAD5CA] dark:border-[#2A3D33] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>30-Year Wealth Timeline</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#173F2B] dark:text-[#E6EEE9]">
              What-If Life & Wealth Simulator
            </h1>
            <p className="text-xs text-[#2E4035]/80 dark:text-[#A3B5AC] mt-0.5">
              Compare 5 life paths (Normal, Career Jump, Early Freedom, Real Estate, Startup) in ₹ INR.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[#F7F7F0] dark:bg-[#0D1411] p-1 rounded-xl border border-[#CAD5CA] dark:border-[#2A3D33] flex gap-1 text-xs">
              {(Object.keys(MACRO_PROFILES) as MacroEnvironment[]).map((env) => (
                <button
                  key={env}
                  onClick={() => setInputs((prev) => ({ ...prev, macroEnv: env }))}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    inputs.macroEnv === env
                      ? 'bg-[#173F2B] text-white dark:bg-[#5ECB9C] dark:text-[#0B1A13]'
                      : 'text-[#2E4035]/70 dark:text-[#A3B5AC] hover:text-[#173F2B]'
                  }`}
                >
                  {env === 'historical' ? 'Normal' : env === 'bull' ? 'Boom' : env === 'stagflation' ? 'Inflation' : 'Dip'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#173F2B] text-white hover:bg-[#102F21] dark:bg-[#5ECB9C] dark:text-[#0B1A13]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Custom Path</span>
            </button>
          </div>
        </div>

        {/* Starting Numbers Pill Bar */}
        <div className="mt-4 pt-3 border-t border-[#CAD5CA]/60 dark:border-[#2A3D33] flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-[#2E4035] dark:text-[#A3B5AC]">
            <span>Starting Age:</span>
            <span className="font-bold text-[#173F2B] dark:text-[#E6EEE9]">{inputs.startingAge} yrs</span>
            <button
              onClick={() => setInputs((p) => ({ ...p, startingAge: Math.max(18, p.startingAge - 1) }))}
              className="px-1.5 py-0.2 rounded bg-[#F7F7F0] dark:bg-[#0D1411] font-bold border border-[#CAD5CA] dark:border-[#2A3D33]"
            >
              -
            </button>
            <button
              onClick={() => setInputs((p) => ({ ...p, startingAge: Math.min(60, p.startingAge + 1) }))}
              className="px-1.5 py-0.2 rounded bg-[#F7F7F0] dark:bg-[#0D1411] font-bold border border-[#CAD5CA] dark:border-[#2A3D33]"
            >
              +
            </button>
          </div>

          <div className="text-[#2E4035] dark:text-[#A3B5AC]">
            Liquid Savings: <span className="font-bold text-[#173F2B] dark:text-[#E6EEE9]">{formatInrCompact(inputs.currentLiquid)}</span>
          </div>

          <div className="text-[#2E4035] dark:text-[#A3B5AC]">
            Debt: <span className="font-bold text-[#B74747] dark:text-[#F28B7F]">{formatInrCompact(inputs.currentDebt)}</span>
          </div>

          <div className="ml-auto text-[11px] text-[#2E4035]/70 dark:text-[#A3B5AC]">
            {MACRO_PROFILES[inputs.macroEnv].description}
          </div>
        </div>
      </div>

      {/* Interactive Graph & Scrubber */}
      <div className="bg-white dark:bg-[#16251E] rounded-2xl p-5 border border-[#CAD5CA] dark:border-[#2A3D33] shadow-xs space-y-4">
        {/* Play & Time Position Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#173F2B] text-white dark:bg-[#5ECB9C] dark:text-[#0B1A13]"
              title={isPlaying ? 'Pause' : 'Play Timeline'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setScrubYear(0);
              }}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#F7F7F0] dark:bg-[#0D1411] text-[#2E4035] dark:text-[#A3B5AC] border border-[#CAD5CA] dark:border-[#2A3D33]"
              title="Reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="flex gap-1 text-[11px] font-mono bg-[#F7F7F0] dark:bg-[#0D1411] p-0.5 rounded-lg border border-[#CAD5CA] dark:border-[#2A3D33]">
              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-0.5 rounded ${
                    playbackSpeed === spd ? 'bg-white dark:bg-[#16251E] font-bold text-[#173F2B] dark:text-[#5ECB9C]' : 'text-gray-500'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          <div className="px-3 py-1 rounded-lg bg-[#EAF3E7] dark:bg-[#1A2C22] border border-[#CAD5CA] dark:border-[#2A3D33] text-xs font-mono font-bold text-[#173F2B] dark:text-[#5ECB9C]">
            Year {currentScrubbedYear} (Age {currentScrubbedAge}) · +{scrubYear} Years
          </div>
        </div>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={30}
          value={scrubYear}
          onChange={(e) => setScrubYear(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-[#CAD5CA]/60 dark:bg-[#2A3D33] rounded-lg appearance-none cursor-pointer accent-[#173F2B] dark:accent-[#5ECB9C]"
        />

        {/* SVG Canvas */}
        <div className="overflow-x-auto rounded-xl border border-[#CAD5CA] dark:border-[#2A3D33] bg-[#F7F7F0]/40 dark:bg-[#0D1411]/50 p-1">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[650px] select-none">
            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const val = maxNetWorth * pct;
              const yPos = scaleY(val);
              return (
                <g key={pct}>
                  <line x1={padding.left} y1={yPos} x2={chartWidth - padding.right} y2={yPos} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                  <text x={padding.left - 8} y={yPos + 4} textAnchor="end" className="text-[10px] fill-[#2E4035]/60 dark:fill-[#A3B5AC]/60 font-mono">
                    {formatInrCompact(val)}
                  </text>
                </g>
              );
            })}

            {[0, 5, 10, 15, 20, 25, 30].map((yr) => {
              const xPos = scaleX(yr);
              return (
                <g key={yr}>
                  <line x1={xPos} y1={padding.top} x2={xPos} y2={padding.top + innerHeight} stroke="currentColor" strokeOpacity="0.05" />
                  <text x={xPos} y={chartHeight - 12} textAnchor="middle" className="text-[10px] fill-[#2E4035]/60 dark:fill-[#A3B5AC]/60 font-mono">
                    {inputs.startYear + yr}
                  </text>
                </g>
              );
            })}

            {/* Zero line */}
            <line x1={padding.left} y1={scaleY(0)} x2={chartWidth - padding.right} y2={scaleY(0)} stroke="currentColor" strokeOpacity="0.2" />

            {/* Trajectories */}
            {simResults.map((result) => {
              if (hiddenUniverseIds.has(result.config.id)) return null;
              const isSelected = result.config.id === selectedUniverseId;
              const points = result.points;
              let pathD = `M ${scaleX(0)} ${scaleY(points[0].netWorth)}`;
              for (let i = 1; i < points.length; i++) {
                pathD += ` L ${scaleX(i)} ${scaleY(points[i].netWorth)}`;
              }

              return (
                <g key={result.config.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={result.config.color}
                    strokeWidth={isSelected ? '3.5' : '2'}
                    strokeOpacity={isSelected ? '1' : '0.45'}
                    strokeLinecap="round"
                    className="cursor-pointer"
                    onClick={() => setSelectedUniverseId(result.config.id)}
                  />

                  {/* Terminal badge */}
                  <text x={scaleX(30) + 4} y={scaleY(points[30].netWorth) + 3} className="text-[9px] font-mono font-bold" fill={result.config.color}>
                    {formatInrCompact(points[30].netWorth)}
                  </text>
                </g>
              );
            })}

            {/* Cursor */}
            <line x1={scaleX(scrubYear)} y1={padding.top} x2={scaleX(scrubYear)} y2={padding.top + innerHeight} stroke="#10B981" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx={scaleX(scrubYear)} cy={padding.top} r="4" fill="#10B981" />
          </svg>
        </div>

        {/* Snapshot at Selected Year */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {simResults.map((result) => {
            if (hiddenUniverseIds.has(result.config.id)) return null;
            const pt = result.points[scrubYear];
            const isSelected = result.config.id === selectedUniverseId;

            return (
              <div
                key={result.config.id}
                onClick={() => setSelectedUniverseId(result.config.id)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#173F2B] dark:border-[#5ECB9C] bg-[#EAF3E7] dark:bg-[#1A2C22]'
                    : 'border-[#CAD5CA]/60 dark:border-[#2A3D33] bg-[#F7F7F0]/40 dark:bg-[#0D1411]/40'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold font-mono" style={{ color: result.config.color }}>
                  <span>{result.config.codeName}</span>
                  {pt.isFireAchieved && <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded">FREE</span>}
                </div>
                <div className="text-sm font-bold font-mono text-[#173F2B] dark:text-[#E6EEE9] mt-0.5">
                  {formatInrCompact(pt.netWorth)}
                </div>
                <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                  Passive: {formatInrCompact(pt.passiveIncome)}/yr
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Focused Path Card - Clean, To-the-Point */}
      {activeResult && (
        <div className="bg-white dark:bg-[#16251E] rounded-2xl p-5 border border-[#CAD5CA] dark:border-[#2A3D33] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#CAD5CA]/60 dark:border-[#2A3D33]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeResult.config.color }} />
              <h2 className="text-lg font-bold text-[#173F2B] dark:text-[#E6EEE9]">
                {activeResult.config.name} ({activeResult.config.codeName})
              </h2>
            </div>
            <div className="text-right font-mono">
              <span className="text-xs text-gray-500">Year 30 Wealth: </span>
              <span className="text-base font-bold text-[#173F2B] dark:text-[#5ECB9C]">
                {formatInrCompact(activeResult.terminalNetWorth)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3">
            <div className="p-3 bg-[#F7F7F0] dark:bg-[#0D1411] rounded-xl border border-[#CAD5CA]/60 dark:border-[#2A3D33]">
              <span className="text-[11px] text-gray-500 block">Freedom Age (F.I.R.E.)</span>
              <span className="text-sm font-bold font-mono text-[#173F2B] dark:text-[#E6EEE9]">
                {activeResult.fireCrossoverAge ? `Age ${activeResult.fireCrossoverAge} (${activeResult.fireCrossoverYear})` : 'Age 55+'}
              </span>
            </div>

            <div className="p-3 bg-[#F7F7F0] dark:bg-[#0D1411] rounded-xl border border-[#CAD5CA]/60 dark:border-[#2A3D33]">
              <span className="text-[11px] text-gray-500 block">Delta vs Normal Track</span>
              <span className={`text-sm font-bold font-mono ${activeResult.wealthDeltaVsBaseline >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {activeResult.wealthDeltaVsBaseline >= 0 ? '+' : ''}{formatInrCompact(activeResult.wealthDeltaVsBaseline)}
              </span>
            </div>

            <div className="p-3 bg-[#F7F7F0] dark:bg-[#0D1411] rounded-xl border border-[#CAD5CA]/60 dark:border-[#2A3D33] col-span-2 sm:col-span-1">
              <span className="text-[11px] text-gray-500 block">Required Monthly Action</span>
              <span className="text-xs font-semibold text-[#173F2B] dark:text-[#5ECB9C] line-clamp-2">
                {activeResult.keyActionSteps[0]}
              </span>
            </div>
          </div>

          {/* Quick link to Investment Prediction Center */}
          <div className="pt-3 border-t border-[#CAD5CA]/60 dark:border-[#2A3D33] flex items-center justify-between">
            <span className="text-xs text-gray-500">Want to invest to reach this faster?</span>
            <Link
              href="/app/investments"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#173F2B] dark:text-[#5ECB9C] hover:underline"
            >
              <span>Explore Youth Mutual Funds & IPO Predictions</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Modal: Custom Path */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#16251E] rounded-2xl max-w-sm w-full p-5 border border-[#CAD5CA] dark:border-[#2A3D33] shadow-xl space-y-3">
            <h3 className="text-base font-bold text-[#173F2B] dark:text-[#E6EEE9]">Add Custom Life Path</h3>
            <form onSubmit={handleAddCustomBranch} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Path Name</label>
                <input
                  type="text"
                  value={customBranchName}
                  onChange={(e) => setCustomBranchName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border bg-[#F7F7F0] dark:bg-[#0D1411]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Starting Salary (₹/yr)</label>
                <input
                  type="number"
                  value={customSalary}
                  onChange={(e) => setCustomSalary(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border bg-[#F7F7F0] dark:bg-[#0D1411]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Savings / SIP Rate (% of surplus)</label>
                <input
                  type="number"
                  min={10}
                  max={90}
                  value={customSavingsRate}
                  onChange={(e) => setCustomSavingsRate(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border bg-[#F7F7F0] dark:bg-[#0D1411]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 text-gray-500">
                  Cancel
                </button>
                <button type="submit" className="px-3 py-1.5 bg-[#173F2B] text-white dark:bg-[#5ECB9C] dark:text-[#0B1A13] rounded-lg font-semibold">
                  Add Path
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
