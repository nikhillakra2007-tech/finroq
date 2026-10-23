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
  ShieldAlert,
  ShieldCheck,
  Zap,
  ArrowRight,
  Plus,
  Sliders,
  DollarSign,
  Calendar,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Shuffle,
  Eye,
  EyeOff,
  Crosshair,
  Award,
} from 'lucide-react';
import {
  MultiverseBranchConfig,
  GlobalSimInputs,
  MacroEnvironment,
  SimulationResult,
  MACRO_PROFILES,
  DEFAULT_UNIVERSES,
  runMultiverseSimulation,
} from '@/lib/multiverse-engine';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';

export function MultiverseSimulator() {
  const { t, language } = useI18n();

  // Simulation Global Inputs
  const [inputs, setInputs] = useState<GlobalSimInputs>({
    startingAge: 28,
    currentLiquid: 45000,
    currentDebt: 8000,
    macroEnv: 'historical',
    startYear: 2024,
  });

  // Multiverse configurations
  const [branches, setBranches] = useState<MultiverseBranchConfig[]>(DEFAULT_UNIVERSES);
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>('universe-gamma');
  const [hiddenUniverseIds, setHiddenUniverseIds] = useState<Set<string>>(new Set());

  // Interactive Time Scrubber (0 to 30)
  const [scrubYear, setScrubYear] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x
  const animIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Custom branch creation state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customBranchName, setCustomBranchName] = useState('My Custom Odyssey');
  const [customSalary, setCustomSalary] = useState(90000);
  const [customSavingsRate, setCustomSavingsRate] = useState(55);
  const [customLivingCost, setCustomLivingCost] = useState(40000);
  const [customEventYear, setCustomEventYear] = useState(5);
  const [customEventAmount, setCustomEventAmount] = useState(50000);
  const [customEventLabel, setCustomEventLabel] = useState('Career Equity Liquidation');

  // Hover state on SVG canvas
  const [hoverYear, setHoverYear] = useState<number | null>(null);

  // Compute simulation results
  const simResults: SimulationResult[] = useMemo(() => {
    return runMultiverseSimulation(branches, inputs);
  }, [branches, inputs]);

  // Selected result
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
      const delay = Math.round(450 / playbackSpeed);
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
      codeName: 'ζ Custom Odyssey',
      tagline: `Custom plan: $${customSalary.toLocaleString()}/yr salary, ${customSavingsRate}% savings rate.`,
      color: '#EC4899', // Hot Pink
      accentBg: 'rgba(236, 72, 153, 0.12)',
      startingIncome: customSalary,
      incomeGrowthRate: 0.045,
      livingExpenses: customLivingCost,
      lifestyleInflationRate: 0.025,
      savingsRate: customSavingsRate / 100,
      investmentReturnRate: 0.082,
      hasRealEstate: false,
      events: [
        {
          id: `ev-${Date.now()}`,
          yearOffset: customEventYear,
          label: customEventLabel,
          type: 'windfall',
          amount: customEventAmount,
          description: 'Custom injected capital event',
        },
      ],
    };

    setBranches((prev) => [...prev, newConfig]);
    setSelectedUniverseId(newId);
    setIsModalOpen(false);
  };

  // SVG Chart Calculation Helpers
  const maxNetWorth = useMemo(() => {
    let max = 1000000;
    simResults.forEach((r) => {
      r.points.forEach((p) => {
        if (p.netWorth > max) max = p.netWorth;
      });
    });
    return Math.ceil(max / 500000) * 500000;
  }, [simResults]);

  const chartWidth = 900;
  const chartHeight = 360;
  const padding = { top: 30, right: 30, bottom: 45, left: 75 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const scaleX = (yr: number) => padding.left + (yr / 30) * innerWidth;
  const scaleY = (val: number) => {
    const clamped = Math.max(-50000, Math.min(maxNetWorth, val));
    return padding.top + innerHeight - (clamped / maxNetWorth) * innerHeight;
  };

  // Active scrubbed data point across all universes
  const currentScrubbedYear = inputs.startYear + scrubYear;
  const currentScrubbedAge = inputs.startingAge + scrubYear;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Telemetry Header */}
      <div className="bg-white/90 dark:bg-[#16251E]/90 backdrop-blur-md rounded-2xl p-6 border border-[#CAD5CA] dark:border-[#2A3D33] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>Deterministic Multi-Timeline Simulation Core</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#173F2B] dark:text-[#E6EEE9] tracking-tight">
              Quantum Financial Multiverse
            </h1>
            <p className="text-sm text-[#2E4035]/80 dark:text-[#A3B5AC] max-w-2xl">
              Fork your current ledger into alternate life trajectories. Compare career leaps,
              extreme F.I.R.E., leveraged real estate, and venture bets across a 30-year horizon with
              instant time-travel scrub controls.
            </p>
          </div>

          {/* Macro Environment Climate Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="bg-[#F7F7F0] dark:bg-[#0D1411] p-1.5 rounded-xl border border-[#CAD5CA] dark:border-[#2A3D33] flex flex-wrap gap-1">
              {(Object.keys(MACRO_PROFILES) as MacroEnvironment[]).map((env) => {
                const isActive = inputs.macroEnv === env;
                return (
                  <button
                    key={env}
                    onClick={() => setInputs((prev) => ({ ...prev, macroEnv: env }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-[#173F2B] text-white dark:bg-[#5ECB9C] dark:text-[#0B1A13] shadow-xs'
                        : 'text-[#2E4035] dark:text-[#A3B5AC] hover:text-[#173F2B] dark:hover:text-white'
                    }`}
                  >
                    {MACRO_PROFILES[env].label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#173F2B] text-white hover:bg-[#102F21] dark:bg-[#5ECB9C] dark:text-[#0B1A13] dark:hover:bg-[#4AB88A] transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Fork Custom Reality</span>
            </button>
          </div>
        </div>

        {/* Global Starting Assumptions Bar */}
        <div className="mt-6 pt-5 border-t border-[#CAD5CA]/60 dark:border-[#2A3D33] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-[#F7F7F0]/80 dark:bg-[#0D1411]/60 p-3 rounded-xl border border-[#CAD5CA]/40 dark:border-[#2A3D33]/60">
            <span className="text-[#2E4035]/70 dark:text-[#A3B5AC]/70 block font-medium">Starting Age</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-base font-bold text-[#173F2B] dark:text-[#E6EEE9]">{inputs.startingAge} yrs</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setInputs((p) => ({ ...p, startingAge: Math.max(18, p.startingAge - 1) }))}
                  className="px-2 py-0.5 rounded bg-white dark:bg-[#16251E] text-xs font-bold border border-[#CAD5CA] dark:border-[#2A3D33]"
                >
                  -
                </button>
                <button
                  onClick={() => setInputs((p) => ({ ...p, startingAge: Math.min(65, p.startingAge + 1) }))}
                  className="px-2 py-0.5 rounded bg-white dark:bg-[#16251E] text-xs font-bold border border-[#CAD5CA] dark:border-[#2A3D33]"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#F7F7F0]/80 dark:bg-[#0D1411]/60 p-3 rounded-xl border border-[#CAD5CA]/40 dark:border-[#2A3D33]/60">
            <span className="text-[#2E4035]/70 dark:text-[#A3B5AC]/70 block font-medium">Liquid Capital Baseline</span>
            <span className="text-base font-bold text-[#173F2B] dark:text-[#E6EEE9] block mt-1">
              ${inputs.currentLiquid.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#F7F7F0]/80 dark:bg-[#0D1411]/60 p-3 rounded-xl border border-[#CAD5CA]/40 dark:border-[#2A3D33]/60">
            <span className="text-[#2E4035]/70 dark:text-[#A3B5AC]/70 block font-medium">Current Debt Obligations</span>
            <span className="text-base font-bold text-[#B74747] dark:text-[#F28B7F] block mt-1">
              ${inputs.currentDebt.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#F7F7F0]/80 dark:bg-[#0D1411]/60 p-3 rounded-xl border border-[#CAD5CA]/40 dark:border-[#2A3D33]/60">
            <span className="text-[#2E4035]/70 dark:text-[#A3B5AC]/70 block font-medium">Active Macro Profile</span>
            <span className="text-xs font-semibold text-[#173F2B] dark:text-[#5ECB9C] block mt-1 line-clamp-1">
              {MACRO_PROFILES[inputs.macroEnv].description}
            </span>
          </div>
        </div>
      </div>

      {/* Main Multiverse Interactive Canvas & Scrubber */}
      <div className="bg-white/90 dark:bg-[#16251E]/90 backdrop-blur-md rounded-2xl p-6 border border-[#CAD5CA] dark:border-[#2A3D33] shadow-sm space-y-6">
        {/* Scrubber Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#CAD5CA]/60 dark:border-[#2A3D33]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#173F2B] text-white hover:bg-[#102F21] dark:bg-[#5ECB9C] dark:text-[#0B1A13] dark:hover:bg-[#4AB88A] transition-all shadow-xs"
              title={isPlaying ? 'Pause Simulation' : 'Play Time-Travel Animation'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setScrubYear(0);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F7F7F0] dark:bg-[#0D1411] text-[#2E4035] dark:text-[#A3B5AC] hover:text-[#173F2B] dark:hover:text-white border border-[#CAD5CA] dark:border-[#2A3D33] transition-all"
              title="Reset Timeline to Year 0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 bg-[#F7F7F0] dark:bg-[#0D1411] p-1 rounded-xl border border-[#CAD5CA] dark:border-[#2A3D33] text-xs">
              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-medium transition-all ${
                    playbackSpeed === spd
                      ? 'bg-white dark:bg-[#16251E] text-[#173F2B] dark:text-[#5ECB9C] shadow-xs'
                      : 'text-[#2E4035]/70 dark:text-[#A3B5AC]/70'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <div className="hidden sm:block text-xs font-mono text-[#2E4035]/80 dark:text-[#A3B5AC]">
              Horizon: <span className="font-bold text-[#173F2B] dark:text-white">{inputs.startYear}</span> →{' '}
              <span className="font-bold text-[#173F2B] dark:text-white">{inputs.startYear + 30}</span>
            </div>
          </div>

          {/* Current Scrubbed Year Telemetry Badge */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-[#EAF3E7] dark:bg-[#1A2C22] border border-[#CAD5CA] dark:border-[#2A3D33] flex items-center gap-3 font-mono">
              <Calendar className="w-4 h-4 text-[#173F2B] dark:text-[#5ECB9C]" />
              <div className="text-right">
                <div className="text-xs text-[#2E4035]/70 dark:text-[#A3B5AC]/70">Time Travel Position</div>
                <div className="text-sm font-bold text-[#173F2B] dark:text-[#5ECB9C]">
                  Year {currentScrubbedYear} · Age {currentScrubbedAge} (+{scrubYear}y)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 30-Year Scrub Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-[#2E4035]/70 dark:text-[#A3B5AC]/70">
            <span>Now ({inputs.startYear} · Age {inputs.startingAge})</span>
            <span className="font-semibold text-[#173F2B] dark:text-[#5ECB9C]">
              Scrub Position: +{scrubYear} Years ({currentScrubbedYear})
            </span>
            <span>Horizon End ({inputs.startYear + 30} · Age {inputs.startingAge + 30})</span>
          </div>
          <input
            type="range"
            min={0}
            max={30}
            value={scrubYear}
            onChange={(e) => setScrubYear(parseInt(e.target.value, 10))}
            className="w-full h-2.5 bg-[#CAD5CA]/50 dark:bg-[#2A3D33] rounded-lg appearance-none cursor-pointer accent-[#173F2B] dark:accent-[#5ECB9C]"
          />
        </div>

        {/* SVG Multiverse Visual Canvas */}
        <div className="relative overflow-hidden rounded-xl border border-[#CAD5CA] dark:border-[#2A3D33] bg-[#F7F7F0]/40 dark:bg-[#0D1411]/40 p-2">
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[700px] select-none"
              onMouseLeave={() => setHoverYear(null)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const xPos = ((e.clientX - rect.left) / rect.width) * chartWidth;
                if (xPos >= padding.left && xPos <= chartWidth - padding.right) {
                  const yr = Math.round(((xPos - padding.left) / innerWidth) * 30);
                  setHoverYear(Math.max(0, Math.min(30, yr)));
                } else {
                  setHoverYear(null);
                }
              }}
              onClick={() => {
                if (hoverYear !== null) setScrubYear(hoverYear);
              }}
            >
              {/* Defs for gradients & filters */}
              <defs>
                <linearGradient id="scrubberLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.1" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Grid Lines (Horizontal) */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                const val = maxNetWorth * pct;
                const yPos = scaleY(val);
                return (
                  <g key={pct}>
                    <line
                      x1={padding.left}
                      y1={yPos}
                      x2={chartWidth - padding.right}
                      y2={yPos}
                      stroke="currentColor"
                      strokeOpacity="0.08"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 10}
                      y={yPos + 4}
                      textAnchor="end"
                      className="text-[10px] fill-[#2E4035]/60 dark:fill-[#A3B5AC]/60 font-mono"
                    >
                      ${val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${Math.round(val / 1000)}k`}
                    </text>
                  </g>
                );
              })}

              {/* Grid Lines (Vertical Years) */}
              {[0, 5, 10, 15, 20, 25, 30].map((yr) => {
                const xPos = scaleX(yr);
                return (
                  <g key={yr}>
                    <line
                      x1={xPos}
                      y1={padding.top}
                      x2={xPos}
                      y2={padding.top + innerHeight}
                      stroke="currentColor"
                      strokeOpacity="0.06"
                    />
                    <text
                      x={xPos}
                      y={chartHeight - 15}
                      textAnchor="middle"
                      className="text-[10px] fill-[#2E4035]/70 dark:fill-[#A3B5AC]/70 font-mono"
                    >
                      {inputs.startYear + yr}
                    </text>
                  </g>
                );
              })}

              {/* Zero Line */}
              <line
                x1={padding.left}
                y1={scaleY(0)}
                x2={chartWidth - padding.right}
                y2={scaleY(0)}
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="1.5"
              />

              {/* Render Each Multiverse Branch Trajectory */}
              {simResults.map((result) => {
                if (hiddenUniverseIds.has(result.config.id)) return null;
                const isSelected = result.config.id === selectedUniverseId;

                // Build path string
                const points = result.points;
                let pathD = `M ${scaleX(0)} ${scaleY(points[0].netWorth)}`;
                for (let i = 1; i < points.length; i++) {
                  const x = scaleX(i);
                  const y = scaleY(points[i].netWorth);
                  pathD += ` L ${x} ${y}`;
                }

                return (
                  <g key={result.config.id}>
                    {/* Glow outline if selected */}
                    {isSelected && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke={result.config.color}
                        strokeWidth="7"
                        strokeOpacity="0.3"
                        filter="url(#glow)"
                      />
                    )}

                    {/* Main trajectory path */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={result.config.color}
                      strokeWidth={isSelected ? '3.5' : '2'}
                      strokeOpacity={isSelected ? '1' : '0.45'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-200 cursor-pointer"
                      onClick={() => setSelectedUniverseId(result.config.id)}
                    />

                    {/* Milestone / Event Nodes */}
                    {points.map((pt) => {
                      if (pt.eventsTriggered.length === 0) return null;
                      const cx = scaleX(pt.yearIndex);
                      const cy = scaleY(pt.netWorth);
                      const isFire = pt.eventsTriggered.some((e) => e.includes('FIRE'));

                      return (
                        <g key={pt.yearIndex} className="cursor-pointer">
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isFire ? 6 : 4}
                            fill={isFire ? '#EF4444' : result.config.color}
                            stroke="#FFFFFF"
                            strokeWidth="1.5"
                            className="transition-transform hover:scale-150"
                          />
                        </g>
                      );
                    })}

                    {/* Terminal Net Worth Badge at Year 30 */}
                    <g transform={`translate(${scaleX(30) + 6}, ${scaleY(points[30].netWorth) + 3})`}>
                      <text
                        className="text-[9px] font-mono font-bold"
                        fill={result.config.color}
                      >
                        {result.config.codeName.split(' ')[0]} ${(points[30].netWorth / 1000000).toFixed(2)}M
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Vertical Scrubber Cursor Line */}
              <g transform={`translate(${scaleX(scrubYear)}, 0)`}>
                <line
                  y1={padding.top - 5}
                  y2={padding.top + innerHeight + 10}
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
                <circle
                  cy={padding.top - 5}
                  r="4"
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              </g>

              {/* Hover Cursor (if hovering at different point) */}
              {hoverYear !== null && hoverYear !== scrubYear && (
                <g transform={`translate(${scaleX(hoverYear)}, 0)`}>
                  <line
                    y1={padding.top}
                    y2={padding.top + innerHeight}
                    stroke="currentColor"
                    strokeOpacity="0.2"
                    strokeWidth="1.5"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Interactive Universe Legend & Visibility Toggles */}
          <div className="mt-3 pt-3 border-t border-[#CAD5CA]/40 dark:border-[#2A3D33]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[#2E4035]/70 dark:text-[#A3B5AC]/70 font-medium">Timelines:</span>
              {simResults.map((r) => {
                const isSelected = r.config.id === selectedUniverseId;
                const isHidden = hiddenUniverseIds.has(r.config.id);
                return (
                  <div
                    key={r.config.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#173F2B] dark:border-[#5ECB9C] bg-[#EAF3E7] dark:bg-[#1A2C22]'
                        : 'border-[#CAD5CA]/60 dark:border-[#2A3D33] hover:bg-white dark:hover:bg-[#16251E]'
                    } ${isHidden ? 'opacity-40' : 'opacity-100'}`}
                  >
                    <span
                      onClick={() => setSelectedUniverseId(r.config.id)}
                      className="flex items-center gap-1.5 font-medium text-[#173F2B] dark:text-[#E6EEE9]"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: r.config.color }}
                      />
                      {r.config.codeName}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleUniverseVisibility(r.config.id);
                      }}
                      className="p-0.5 text-[#2E4035]/60 hover:text-[#173F2B] dark:text-[#A3B5AC]/60 dark:hover:text-white"
                      title={isHidden ? 'Show Timeline' : 'Hide Timeline'}
                    >
                      {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] text-[#2E4035]/60 dark:text-[#A3B5AC]/60 flex items-center gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              <span>Red dots indicate FIRE Crossover / Milestone Shocks</span>
            </div>
          </div>
        </div>

        {/* Real-Time Scrubbed Telemetry Grid for Year [scrubYear] */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {simResults.map((result) => {
            if (hiddenUniverseIds.has(result.config.id)) return null;
            const pt = result.points[scrubYear];
            const isSelected = result.config.id === selectedUniverseId;

            return (
              <div
                key={result.config.id}
                onClick={() => setSelectedUniverseId(result.config.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#173F2B] dark:border-[#5ECB9C] bg-[#EAF3E7]/70 dark:bg-[#1A2C22]/80 shadow-xs ring-1 ring-[#173F2B]/20 dark:ring-[#5ECB9C]/20'
                    : 'border-[#CAD5CA]/60 dark:border-[#2A3D33] bg-[#F7F7F0]/60 dark:bg-[#0D1411]/50 hover:border-[#173F2B]/40'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span
                    className="text-xs font-bold font-mono truncate"
                    style={{ color: result.config.color }}
                  >
                    {result.config.codeName}
                  </span>
                  {pt.isFireAchieved && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      FREE
                    </span>
                  )}
                </div>

                <div className="text-base font-bold font-mono text-[#173F2B] dark:text-[#E6EEE9]">
                  ${pt.netWorth.toLocaleString()}
                </div>

                <div className="mt-1 flex items-center justify-between text-[10px] text-[#2E4035]/70 dark:text-[#A3B5AC]/70 font-mono">
                  <span>Liquid: ${(pt.liquidAssets / 1000).toFixed(0)}k</span>
                  <span>Passv: ${(pt.passiveIncome / 1000).toFixed(1)}k/y</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deep-Dive Analysis for Selected Universe */}
      {activeResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Timeline Overview & Key Milestones */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/90 dark:bg-[#16251E]/90 backdrop-blur-md rounded-2xl p-6 border border-[#CAD5CA] dark:border-[#2A3D33] shadow-sm space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full inline-block"
                      style={{ backgroundColor: activeResult.config.color }}
                    />
                    <h2 className="text-xl font-bold font-serif text-[#173F2B] dark:text-[#E6EEE9]">
                      {activeResult.config.name} ({activeResult.config.codeName})
                    </h2>
                  </div>
                  <p className="text-sm text-[#2E4035]/80 dark:text-[#A3B5AC] mt-1">
                    {activeResult.config.tagline}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[#2E4035]/70 dark:text-[#A3B5AC]/70 block font-mono">
                    Year 30 Net Worth
                  </span>
                  <span className="text-2xl font-bold font-mono text-[#173F2B] dark:text-[#5ECB9C]">
                    ${activeResult.terminalNetWorth.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Core Telemetry Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-[#F7F7F0] dark:bg-[#0D1411] p-3 rounded-xl border border-[#CAD5CA]/60 dark:border-[#2A3D33]">
                  <span className="text-[11px] text-[#2E4035]/70 dark:text-[#A3B5AC]/70 block">
                    F.I.R.E. Freedom Horizon
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-bold font-mono text-[#173F2B] dark:text-[#E6EEE9]">
                      {activeResult.fireCrossoverAge
                        ? `Age ${activeResult.fireCrossoverAge} (${activeResult.fireCrossoverYear})`
                        : 'Year 30+'}
                    </span>
                  </div>
                </div>

                <div className="bg-[#F7F7F0] dark:bg-[#0D1411] p-3 rounded-xl border border-[#CAD5CA]/60 dark:border-[#2A3D33]">
                  <span className="text-[11px] text-[#2E4035]/70 dark:text-[#A3B5AC]/70 block">
                    Delta vs Reality (Alpha)
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span
                      className={`text-sm font-bold font-mono ${
                        activeResult.wealthDeltaVsBaseline >= 0
                          ? 'text-[#247A50] dark:text-[#5ECB9C]'
                          : 'text-[#B74747] dark:text-[#F28B7F]'
                      }`}
                    >
                      {activeResult.wealthDeltaVsBaseline >= 0 ? '+' : ''}$
                      {(activeResult.wealthDeltaVsBaseline / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>

                <div className="bg-[#F7F7F0] dark:bg-[#0D1411] p-3 rounded-xl border border-[#CAD5CA]/60 dark:border-[#2A3D33]">
                  <span className="text-[11px] text-[#2E4035]/70 dark:text-[#A3B5AC]/70 block">
                    Solvency Resilience
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold font-mono text-[#173F2B] dark:text-[#E6EEE9]">
                      {activeResult.resilienceScore}/100
                    </span>
                  </div>
                </div>

                <div className="bg-[#F7F7F0] dark:bg-[#0D1411] p-3 rounded-xl border border-[#CAD5CA]/60 dark:border-[#2A3D33]">
                  <span className="text-[11px] text-[#2E4035]/70 dark:text-[#A3B5AC]/70 block">
                    Regret Risk Index
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold font-mono text-[#173F2B] dark:text-[#E6EEE9]">
                      {activeResult.regretRiskIndex}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Blueprint: How to Jump to this Reality */}
              <div className="space-y-3 pt-3 border-t border-[#CAD5CA]/60 dark:border-[#2A3D33]">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-[#173F2B] dark:text-[#E6EEE9]">
                    Timeline Execution Blueprint (How to Materialize this Universe)
                  </h3>
                </div>

                <div className="space-y-2">
                  {activeResult.keyActionSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#F7F7F0] dark:bg-[#0D1411] border border-[#CAD5CA]/40 dark:border-[#2A3D33]/60 flex items-start gap-3"
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#173F2B] dark:bg-[#5ECB9C] text-white dark:text-[#0B1A13] text-[10px] font-bold font-mono shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-[#2E4035] dark:text-[#A3B5AC] leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline Milestones Progression Table */}
            <div className="bg-white/90 dark:bg-[#16251E]/90 backdrop-blur-md rounded-2xl p-6 border border-[#CAD5CA] dark:border-[#2A3D33] shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#173F2B] dark:text-[#E6EEE9] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#173F2B] dark:text-[#5ECB9C]" />
                <span>30-Year Milestones & Quantum Transition Ledger</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#CAD5CA] dark:border-[#2A3D33] text-[#2E4035]/60 dark:text-[#A3B5AC]/60 font-mono">
                      <th className="pb-2.5">Year</th>
                      <th className="pb-2.5">Age</th>
                      <th className="pb-2.5">Net Worth</th>
                      <th className="pb-2.5">Annual Income</th>
                      <th className="pb-2.5">Living Burn</th>
                      <th className="pb-2.5">Passive Cashflow</th>
                      <th className="pb-2.5">Events & Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CAD5CA]/40 dark:divide-[#2A3D33]/40 font-mono">
                    {activeResult.points
                      .filter((pt) => pt.yearIndex % 3 === 0 || pt.eventsTriggered.length > 0 || pt.yearIndex === scrubYear)
                      .map((pt) => {
                        const isCurrentScrub = pt.yearIndex === scrubYear;
                        return (
                          <tr
                            key={pt.yearIndex}
                            onClick={() => setScrubYear(pt.yearIndex)}
                            className={`cursor-pointer transition-colors ${
                              isCurrentScrub
                                ? 'bg-[#EAF3E7] dark:bg-[#1A2C22] font-bold'
                                : 'hover:bg-[#F7F7F0] dark:hover:bg-[#0D1411]'
                            }`}
                          >
                            <td className="py-2.5 text-[#173F2B] dark:text-[#E6EEE9]">
                              {pt.calendarYear}
                            </td>
                            <td className="py-2.5 text-[#2E4035]/80 dark:text-[#A3B5AC]">{pt.age}</td>
                            <td className="py-2.5 text-[#173F2B] dark:text-[#5ECB9C]">
                              ${pt.netWorth.toLocaleString()}
                            </td>
                            <td className="py-2.5 text-[#2E4035] dark:text-[#E6EEE9]">
                              ${pt.annualIncome.toLocaleString()}
                            </td>
                            <td className="py-2.5 text-[#2E4035]/80 dark:text-[#A3B5AC]">
                              ${pt.annualExpenses.toLocaleString()}
                            </td>
                            <td className="py-2.5 text-[#247A50] dark:text-[#5ECB9C]">
                              ${pt.passiveIncome.toLocaleString()}/yr
                            </td>
                            <td className="py-2.5">
                              {pt.eventsTriggered.length > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  {pt.eventsTriggered[0]}
                                </span>
                              ) : pt.isFireAchieved ? (
                                <span className="text-orange-500 text-[10px]">🔥 Independence</span>
                              ) : (
                                <span className="text-[#2E4035]/40 dark:text-[#A3B5AC]/40">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Opportunity Cost Radar & Quick Actions */}
          <div className="space-y-6">
            {/* Visual 5-Axis Horizon Radar */}
            <div className="bg-white/90 dark:bg-[#16251E]/90 backdrop-blur-md rounded-2xl p-6 border border-[#CAD5CA] dark:border-[#2A3D33] shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#173F2B] dark:text-[#E6EEE9] flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#173F2B] dark:text-[#5ECB9C]" />
                <span>Life Opportunity Cost Radar</span>
              </h3>
              <p className="text-xs text-[#2E4035]/70 dark:text-[#A3B5AC]/70">
                Mathematical multi-axis evaluation of timeline trade-offs.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { label: 'Freedom Speed (F.I.R.E. Velocity)', score: activeResult.radar.freedomSpeed, color: '#10B981' },
                  { label: 'Downside Safety & Solvency', score: activeResult.radar.downsideSafety, color: '#06B6D4' },
                  { label: 'Lifestyle Luxury & Discretionary', score: activeResult.radar.lifestyleLuxury, color: '#F59E0B' },
                  { label: 'Generational Terminal Wealth', score: activeResult.radar.generationalWealth, color: '#8B5CF6' },
                  { label: 'Liquidity & Career Flexibility', score: activeResult.radar.liquidityFlexibility, color: '#EC4899' },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#2E4035] dark:text-[#A3B5AC] truncate">{item.label}</span>
                      <span className="font-bold text-[#173F2B] dark:text-[#E6EEE9]">{item.score}/100</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#CAD5CA]/40 dark:bg-[#2A3D33] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.score}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* In-App Cross-Feature Deep Links */}
            <div className="bg-white/90 dark:bg-[#16251E]/90 backdrop-blur-md rounded-2xl p-6 border border-[#CAD5CA] dark:border-[#2A3D33] shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-[#173F2B] dark:text-[#E6EEE9] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Synchronize with FINROQ Ledger</span>
              </h3>
              <p className="text-xs text-[#2E4035]/70 dark:text-[#A3B5AC]/70">
                Test these timeline parameters directly inside FINROQ's other financial engines:
              </p>

              <div className="space-y-2 pt-1">
                <Link
                  href="/app/crash-test"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F0] dark:bg-[#0D1411] hover:bg-[#EAF3E7] dark:hover:bg-[#1A2C22] border border-[#CAD5CA]/60 dark:border-[#2A3D33] transition-colors text-xs font-medium text-[#173F2B] dark:text-[#E6EEE9]"
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>Run 6-Agent Crash-Test on this Timeline</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#2E4035]/60" />
                </Link>

                <Link
                  href="/app/budgeting"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F0] dark:bg-[#0D1411] hover:bg-[#EAF3E7] dark:hover:bg-[#1A2C22] border border-[#CAD5CA]/60 dark:border-[#2A3D33] transition-colors text-xs font-medium text-[#173F2B] dark:text-[#E6EEE9]"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-500" />
                    <span>Adopt Target Monthly Budget Cap</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#2E4035]/60" />
                </Link>

                <Link
                  href="/app/ai-assistant"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F0] dark:bg-[#0D1411] hover:bg-[#EAF3E7] dark:hover:bg-[#1A2C22] border border-[#CAD5CA]/60 dark:border-[#2A3D33] transition-colors text-xs font-medium text-[#173F2B] dark:text-[#E6EEE9]"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>Ask Finroq AI about Timeline Trade-offs</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#2E4035]/60" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Custom Multiverse Branch */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#16251E] rounded-2xl max-w-lg w-full p-6 border border-[#CAD5CA] dark:border-[#2A3D33] shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#CAD5CA]/60 dark:border-[#2A3D33] pb-3">
              <h3 className="text-lg font-bold font-serif text-[#173F2B] dark:text-[#E6EEE9] flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" />
                <span>Fork Custom Parallel Reality</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#2E4035]/60 hover:text-[#173F2B] dark:text-[#A3B5AC] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomBranch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#173F2B] dark:text-[#E6EEE9] mb-1">
                  Timeline Designation Name
                </label>
                <input
                  type="text"
                  value={customBranchName}
                  onChange={(e) => setCustomBranchName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F7F0] dark:bg-[#0D1411] border border-[#CAD5CA] dark:border-[#2A3D33] text-[#173F2B] dark:text-[#E6EEE9]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#173F2B] dark:text-[#E6EEE9] mb-1">
                    Starting Salary ($/yr)
                  </label>
                  <input
                    type="number"
                    value={customSalary}
                    onChange={(e) => setCustomSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F7F0] dark:bg-[#0D1411] border border-[#CAD5CA] dark:border-[#2A3D33] text-[#173F2B] dark:text-[#E6EEE9]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#173F2B] dark:text-[#E6EEE9] mb-1">
                    Savings Rate (% of surplus)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={95}
                    value={customSavingsRate}
                    onChange={(e) => setCustomSavingsRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F7F0] dark:bg-[#0D1411] border border-[#CAD5CA] dark:border-[#2A3D33] text-[#173F2B] dark:text-[#E6EEE9]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#173F2B] dark:text-[#E6EEE9] mb-1">
                  Annual Living Expenses ($/yr)
                </label>
                <input
                  type="number"
                  value={customLivingCost}
                  onChange={(e) => setCustomLivingCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F7F0] dark:bg-[#0D1411] border border-[#CAD5CA] dark:border-[#2A3D33] text-[#173F2B] dark:text-[#E6EEE9]"
                  required
                />
              </div>

              <div className="p-3 bg-[#F7F7F0] dark:bg-[#0D1411] rounded-xl border border-[#CAD5CA]/60 dark:border-[#2A3D33] space-y-2">
                <span className="font-semibold text-[#173F2B] dark:text-[#E6EEE9] block">
                  Inject Major Timeline Life Event
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-[#2E4035]/70 dark:text-[#A3B5AC]/70">Event Title</label>
                    <input
                      type="text"
                      value={customEventLabel}
                      onChange={(e) => setCustomEventLabel(e.target.value)}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-[#16251E] border border-[#CAD5CA] dark:border-[#2A3D33]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#2E4035]/70 dark:text-[#A3B5AC]/70">In Year (+)</label>
                    <input
                      type="number"
                      min={1}
                      max={25}
                      value={customEventYear}
                      onChange={(e) => setCustomEventYear(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded bg-white dark:bg-[#16251E] border border-[#CAD5CA] dark:border-[#2A3D33]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-[#2E4035]/70 dark:text-[#A3B5AC]/70">Cash Amount ($)</label>
                  <input
                    type="number"
                    value={customEventAmount}
                    onChange={(e) => setCustomEventAmount(Number(e.target.value))}
                    className="w-full px-2 py-1 rounded bg-white dark:bg-[#16251E] border border-[#CAD5CA] dark:border-[#2A3D33]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#2E4035] dark:text-[#A3B5AC] hover:bg-[#F7F7F0] dark:hover:bg-[#0D1411]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#173F2B] text-white hover:bg-[#102F21] dark:bg-[#5ECB9C] dark:text-[#0B1A13] dark:hover:bg-[#4AB88A]"
                >
                  Simulate Alternate Universe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
