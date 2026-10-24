'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  Sparkles,
  Volume2,
  VolumeX,
  Layers,
  ArrowRight,
  Activity,
  DollarSign,
  PieChart,
  Target,
  Flame,
} from 'lucide-react';

interface CinematicDemoIntroProps {
  onComplete: () => void;
}

export function CinematicDemoIntro({ onComplete }: CinematicDemoIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [actIndex, setActIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Synthesize rich harmonic sci-fi / financial audio chimes using Web Audio API
  const playFinancialChime = useCallback(
    (baseFreq = 523.25, type: OscillatorType = 'sine', duration = 0.12) => {
      if (isMuted) return;
      try {
        if (!audioCtxRef.current) {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          audioCtxRef.current = new AudioCtx();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.33, ctx.currentTime + duration);

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch {
        // Fallback if audio policy requires user gesture
      }
    },
    [isMuted]
  );

  // FINROQ 4-Act Cinematic Narrative
  const ACTS = [
    {
      actNumber: '01',
      tag: 'ACT I // SPEND LEAK INTERCEPTOR',
      title: 'Stop Hidden Outflows & Stealth Price Hikes',
      subtitle:
        'FINROQ scans your ledger for silent recurring creep, 48-hour duplicate charges, and sneaky subscription inflation without altering transactions.',
      tagColor: 'text-amber-400 bg-amber-950/60 border-amber-500/40',
      badgeBorder: 'border-amber-500/30',
      accentColor: '#F59E0B',
      heroMetric: '+₹28,500/yr',
      heroLabel: 'AVERAGE CASH FLOW LEAK INTERCEPTED',
      icon: Activity,
      subSignals: [
        '✓ Netflix ₹1,499 → ₹1,799 (+20% Price Hike Intercepted)',
        '✓ AWS Cloud 48h Duplicate Debit Flagged',
        '✓ 5-Year Compound SIP Yield: ₹2,35,400',
      ],
    },
    {
      actNumber: '02',
      tag: 'ACT II // 30-YEAR QUANTUM MULTIVERSE',
      title: 'Simulate Parallel Lifepaths & Macro Shocks',
      subtitle:
        'Time-travel across 3 decades. Test early startup equity vs safe index compounding through macroeconomic recession shocks.',
      tagColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
      badgeBorder: 'border-emerald-500/30',
      accentColor: '#10B981',
      heroMetric: '₹4.28 CRORE',
      heroLabel: 'RETIRE AT AGE 42 PARALLEL REALITY',
      icon: Layers,
      subSignals: [
        '✓ Path Alpha: Steady 9-5 (Retire Age 58)',
        '✓ Path Omega: Disciplined SIP + Equity (Retire Age 42)',
        '✓ 2029 Climate Shock Stress-Test: 99.4% Survival',
      ],
    },
    {
      actNumber: '03',
      tag: 'ACT III // YOUTH INVESTMENTS & IPO RADAR',
      title: 'Real-Time AMFI Mutual Funds & Live GMP Telemetry',
      subtitle:
        'Live Grey Market Premiums for upcoming Indian IPOs paired with zero-commission student index funds starting at just ₹100/month.',
      tagColor: 'text-teal-400 bg-teal-950/60 border-teal-500/40',
      badgeBorder: 'border-teal-500/30',
      accentColor: '#14B8A6',
      heroMetric: '+38.5% GMP',
      heroLabel: 'LIVE IPO LISTING GAIN TELEMETRY',
      icon: TrendingUp,
      subSignals: [
        '✓ Swiggy IPO: ₹390 Issue • Est. Listing ₹540 (+38%)',
        '✓ Nifty 50 Direct Index SIP from ₹100/month',
        '✓ Zero Commission • Live AMFI NAV Ingestion',
      ],
    },
    {
      actNumber: '04',
      tag: 'ACT IV // ATOMIC DECIMAL INTEGRITY',
      title: 'Welcome to Sovereign Financial Control',
      subtitle:
        'Zero IEEE-754 floating-point drift. Bank statement OCR ingestion. 17 integrated financial engines synchronized and ready.',
      tagColor: 'text-emerald-300 bg-emerald-900/60 border-emerald-400/50',
      badgeBorder: 'border-emerald-400/40',
      accentColor: '#34D399',
      heroMetric: '0.00% DRIFT',
      heroLabel: 'NUMERIC(14,2) FIXED-POINT SOVEREIGN LEDGER',
      icon: ShieldCheck,
      subSignals: [
        '✓ Argon2id Tenant Enclave Encryption',
        '✓ Exact Double-Entry Balance Verification',
        '✓ 17 Unified Financial Intelligence Engines Ready',
      ],
    },
  ];

  // Dynamic 60FPS High-Tech Financial Chart & Constellation Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Floating financial symbols and price points
    const glyphs = ['₹', 'NIFTY', 'SIP', '12%', 'LEAK', 'IPO', 'AMFI', '4.2Cr', '0.00%'];
    const nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      text: string;
      size: number;
      alpha: number;
    }> = [];

    for (let i = 0; i < 35; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        text: glyphs[Math.floor(Math.random() * glyphs.length)],
        size: Math.floor(Math.random() * 4) + 11,
        alpha: Math.random() * 0.4 + 0.15,
      });
    }

    let t = 0;

    const render = () => {
      t += 0.025;
      ctx.fillStyle = 'rgba(5, 12, 8, 0.28)';
      ctx.fillRect(0, 0, width, height);

      // Financial Wealth Compounding Arc (Dynamic Sine & Exponential Curve)
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      const gradient = ctx.createLinearGradient(0, height, width, 0);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.05)');
      gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.35)');
      gradient.addColorStop(1, 'rgba(52, 211, 153, 0.8)');
      ctx.strokeStyle = gradient;

      const baseline = height * 0.72;
      ctx.moveTo(0, baseline);
      for (let x = 0; x < width; x += 15) {
        const progressFactor = x / width;
        // Exponential compounding arc with dynamic sine ripples
        const y =
          baseline -
          Math.pow(progressFactor, 1.8) * (height * 0.45) +
          Math.sin(x * 0.015 + t * 2) * 12;
        ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Laser Scan Sweep Vertical Line
      const scanX = ((t * 120) % (width + 200)) - 100;
      const scanGrad = ctx.createLinearGradient(scanX - 50, 0, scanX + 50, 0);
      scanGrad.addColorStop(0, 'transparent');
      scanGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.15)');
      scanGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(scanX - 50, 0, 100, height);

      // Render Floating Financial Nodes
      ctx.font = 'bold 12px monospace';
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        ctx.fillStyle = `rgba(16, 185, 129, ${node.alpha})`;
        ctx.fillText(node.text, node.x, node.y);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 4-Act Progression Sequence (~5.6 seconds duration)
  useEffect(() => {
    const startTime = Date.now();
    const duration = 5600;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 25) {
        setActIndex(0);
      } else if (pct < 55) {
        if (actIndex !== 1) playFinancialChime(587.33, 'triangle', 0.12);
        setActIndex(1);
      } else if (pct < 85) {
        if (actIndex !== 2) playFinancialChime(659.25, 'sine', 0.14);
        setActIndex(2);
      } else {
        if (actIndex !== 3) playFinancialChime(783.99, 'sine', 0.18);
        setActIndex(3);
      }

      if (pct >= 100) {
        clearInterval(interval);
        playFinancialChime(1046.5, 'sine', 0.28);
        setTimeout(() => {
          onComplete();
        }, 400);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [actIndex, onComplete, playFinancialChime]);

  // Escape to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onComplete();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  const currentAct = ACTS[actIndex] || ACTS[0];
  const IconComponent = currentAct.icon;

  return (
    <div className="fixed inset-0 z-[200] bg-[#050C08] text-slate-100 flex flex-col justify-between select-none overflow-hidden animate-in fade-in duration-300">
      {/* 60FPS Financial Chart & Pulse Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Cybernetic Lens Vignette & Scanlines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(5,12,8,0.92)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.22)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />

      {/* TOP LIVE FINANCIAL TICKER & HUD */}
      <div className="relative z-10 w-full border-b border-emerald-500/20 bg-black/60 backdrop-blur-md">
        <div className="w-full max-w-7xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          {/* Live Market Telemetry Ticker Ribbon */}
          <div className="flex items-center gap-3 overflow-hidden text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-[11px] text-rose-300 font-bold shrink-0">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>DEMO CINEMATIC</span>
            </div>
            <div className="flex items-center gap-4 text-slate-300 shrink-0 truncate">
              <span className="text-emerald-400 font-bold">NIFTY 50 25,410.20 ▲ +0.82%</span>
              <span className="text-emerald-400">HDFC BANK ₹1,780.40 ▲</span>
              <span className="text-amber-400">GOLD/10G ₹78,450</span>
              <span className="text-teal-400 font-bold">SWIGGY GMP +38.5%</span>
              <span className="text-emerald-300 font-mono">IEEE-754: 0.00% DRIFT</span>
            </div>
          </div>

          {/* Audio & Skip Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setIsMuted((prev) => !prev);
                if (isMuted) playFinancialChime(523.25, 'sine', 0.1);
              }}
              className="p-1.5 rounded-full border border-emerald-500/30 bg-black/50 hover:bg-black/80 text-emerald-300 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onComplete}
              className="px-3.5 py-1.5 rounded-full border border-emerald-500/40 hover:border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-mono font-semibold text-emerald-300 transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-md"
            >
              <span>Skip Demo</span>
              <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] text-slate-300">ESC</span>
            </button>
          </div>
        </div>
      </div>

      {/* CENTER CINEMATIC THEATER (FINROQ TOPIC & THEME) */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-6 flex flex-col items-center text-center space-y-6">
        {/* Pulsing Core Radar Emblem */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-emerald-400/40 animate-spin" style={{ animationDuration: '9s' }} />
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-600/35 to-teal-950/80 border border-emerald-400/70 flex items-center justify-center shadow-2xl shadow-emerald-500/30 backdrop-blur-md">
            <IconComponent className="w-9 h-9 text-emerald-300 animate-pulse" />
          </div>
        </div>

        {/* Narrative Headlines */}
        <div className="space-y-3 max-w-2xl">
          <span
            className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border shadow-xs transition-all duration-300 ${currentAct.tagColor}`}
          >
            {currentAct.tag}
          </span>
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            {currentAct.title}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            {currentAct.subtitle}
          </p>
        </div>

        {/* Live Financial Telemetry Capsule */}
        <div className={`p-4 sm:p-5 rounded-3xl bg-black/75 border ${currentAct.badgeBorder} backdrop-blur-md max-w-lg w-full space-y-2.5 shadow-2xl transition-all duration-300`}>
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
              {currentAct.heroLabel}
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black text-emerald-300">
              {currentAct.heroMetric}
            </span>
          </div>

          {/* Sub-signals checklist */}
          <div className="space-y-1 text-left font-mono text-[11px] text-slate-300">
            {currentAct.subSignals.map((signal, sIdx) => (
              <div key={sIdx} className="flex items-center gap-1.5 text-emerald-300/90 truncate">
                <span>{signal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM CHROME & PROGRESS SCRUBBER */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-emerald-400/80">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>FINROQ KERNEL v2.0 // DEPLOYING WEALTH SUITE</span>
          </div>
          <span className="font-bold text-white">{progress}%</span>
        </div>

        {/* Progress Timeline Bar */}
        <div className="w-full h-2 rounded-full bg-slate-900/90 border border-emerald-500/30 overflow-hidden relative shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 via-teal-400 to-emerald-300 transition-all duration-75 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 4 Acts Navigation Indicators */}
        <div className="grid grid-cols-4 gap-2 pt-1 text-[10px] font-mono uppercase text-center">
          {ACTS.map((act, idx) => (
            <div
              key={idx}
              className={`py-1 rounded-lg transition-colors truncate px-1 ${
                actIndex === idx
                  ? 'text-emerald-300 font-bold bg-emerald-500/15 border border-emerald-500/40 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              {`0${idx + 1} // ${act.tag.split('//')[1]?.trim() || ''}`}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
