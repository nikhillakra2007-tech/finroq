'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, ShieldCheck, Zap, Lock, Unlock, ArrowRight, RotateCcw, Play } from 'lucide-react';

interface CinematicDemoIntroProps {
  onComplete: () => void;
  standalone?: boolean;
}

// Scrambled cyber glyphs for the hacker decrypt effect
const GLYPHS = '0123456789ABCDEF$#@%&<>~!?/\\{}[]';

export function CinematicDemoIntro({ onComplete, standalone = false }: CinematicDemoIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [sceneIndex, setSceneIndex] = useState(0); // 0: Decrypt, 1: Intercept Leaks, 2: Wealth Rocket, 3: Unlocked
  const [scrambleText, setScrambleText] = useState('ACCESSING SECURE LEDGER');
  const [wealthCounter, setWealthCounter] = useState('₹0');
  const [iteration, setIteration] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Restart storyboard sequence
  const restartDemo = useCallback(() => {
    setIsFinished(false);
    setSceneIndex(0);
    setWealthCounter('₹0');
    setIteration((prev) => prev + 1);
  }, []);

  // Synthesize crisp cyber hacker clicks and vault unlock sound
  const playCyberSound = useCallback((freq = 440, type: OscillatorType = 'sine', duration = 0.06, vol = 0.05) => {
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
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.6, ctx.currentTime + duration);

      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }, [isMuted]);

  // Hacker Text Decrypt Scramble Effect
  const scrambleTo = useCallback((targetText: string, durationMs = 600) => {
    let frame = 0;
    const totalFrames = Math.floor(durationMs / 30);
    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const resolvedChars = Math.floor(progress * targetText.length);

      let result = '';
      for (let i = 0; i < targetText.length; i++) {
        if (targetText[i] === ' ') {
          result += ' ';
        } else if (i < resolvedChars) {
          result += targetText[i];
        } else {
          result += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }
      setScrambleText(result);

      if (frame % 2 === 0) {
        playCyberSound(800 + Math.random() * 600, 'square', 0.03, 0.02);
      }

      if (frame >= totalFrames) {
        clearInterval(interval);
        setScrambleText(targetText);
      }
    }, 30);
  }, [playCyberSound]);

  // 60FPS High-Energy Canvas Cyber Vault & Particle Ray Animation
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

    // Dynamic laser beams & shockwave rings
    let time = 0;
    const rings: Array<{ radius: number; maxRadius: number; color: string; alpha: number }> = [];

    const triggerRing = (color = '#10B981') => {
      rings.push({ radius: 10, maxRadius: Math.max(width, height) * 0.7, color, alpha: 1 });
    };

    const render = () => {
      time += 0.035;
      ctx.fillStyle = 'rgba(3, 7, 5, 0.35)';
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Perspective Cyber Grid Floor
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.lineWidth = 1;
      const horizon = height * 0.65;
      for (let x = -width; x < width * 2; x += 50) {
        ctx.beginPath();
        ctx.moveTo(centerX + (x - centerX) * 0.15, horizon);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = horizon; y < height; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. High-Tech Targeting Reticle
      ctx.save();
      ctx.translate(centerX, centerY - 20);
      ctx.rotate(time * 0.6);

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 15]);
      ctx.beginPath();
      ctx.arc(0, 0, 95, 0, Math.PI * 2);
      ctx.stroke();

      ctx.rotate(-time * 1.2);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.arc(0, 0, 115, 0, Math.PI * 2);
      ctx.stroke();

      // Corner target brackets
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
      const bSize = 135;
      ctx.strokeRect(-bSize / 2, -bSize / 2, bSize, bSize);

      ctx.restore();

      // 3. Shockwave Rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.radius += 18;
        ring.alpha *= 0.94;

        ctx.beginPath();
        ctx.arc(centerX, centerY - 20, ring.radius, 0, Math.PI * 2);
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = ring.alpha;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        if (ring.alpha < 0.02) {
          rings.splice(i, 1);
        }
      }
      ctx.globalAlpha = 1;

      // 4. Laser Scan Sweep Beam
      const scanY = ((time * 250) % (height + 200)) - 100;
      const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      scanGrad.addColorStop(0, 'transparent');
      scanGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.18)');
      scanGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 30, width, 60);

      animId = requestAnimationFrame(render);
    };

    render();

    // Trigger initial shockwave
    triggerRing('#10B981');

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // EXACT 4.9 SECONDS HIGH-OCTANE 4-PHASE STORYBOARD
  useEffect(() => {
    // 0.0s: Phase 0 - Hack / Biometric Vault Decrypt
    scrambleTo('BREACHING WEALTH SECURITY ENCLAVE', 800);
    playCyberSound(440, 'sawtooth', 0.15, 0.06);

    // 1.2s: Phase 1 - Leak Intercept & Money Saved
    const t1 = setTimeout(() => {
      setSceneIndex(1);
      scrambleTo('INTERCEPTING ₹48,600 SPEND LEAKS', 600);
      playCyberSound(659.25, 'triangle', 0.18, 0.07);
    }, 1200);

    // 2.4s: Phase 2 - Wealth Compounding & Goal Achieved
    const t2 = setTimeout(() => {
      setSceneIndex(2);
      scrambleTo('TARGET ACHIEVED: ₹1.24 CRORE (AGE 42)', 600);
      playCyberSound(783.99, 'sine', 0.2, 0.08);

      // Fast money ticker spin
      let val = 0;
      const tickerInterval = setInterval(() => {
        val += 850000;
        if (val >= 12400000) {
          clearInterval(tickerInterval);
          setWealthCounter('₹1,24,00,000');
        } else {
          setWealthCounter(`₹${(val / 100000).toFixed(1)} LAKH`);
        }
      }, 35);
    }, 2400);

    // 3.7s: Phase 3 - Vault Unlocked / Financial Freedom
    const t3 = setTimeout(() => {
      setSceneIndex(3);
      scrambleTo('FINROQ // FINANCIAL CLARITY UNLOCKED', 500);
      playCyberSound(1046.5, 'sine', 0.3, 0.1);
    }, 3700);

    // 4.8s: Complete sequence
    const t4 = setTimeout(() => {
      if (standalone) {
        setIsFinished(true);
      } else {
        onComplete();
      }
    }, 4850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [iteration, onComplete, playCyberSound, scrambleTo, standalone]);

  // Escape to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onComplete();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[200] bg-[#030705] text-white flex flex-col justify-between select-none overflow-hidden animate-in fade-in duration-200">
      {/* 60FPS Cyber Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Cybernetic Scanlines Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(3,7,5,0.92)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

      {/* TOP COMPACT HUD */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono text-xs font-bold tracking-widest text-emerald-400">
            FINROQ // DEMO VIDEO
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={restartDemo}
            className="p-1.5 px-3 rounded-full border border-emerald-500/40 bg-black/60 hover:bg-black/90 text-emerald-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            title="Replay Demo Video"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay</span>
          </button>
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-full border border-emerald-500/40 bg-black/60 hover:bg-black/90 text-emerald-300 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="px-3 py-1 rounded-full border border-emerald-500/40 hover:border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-mono font-semibold text-emerald-300 transition-all cursor-pointer flex items-center gap-1.5 backdrop-blur-md"
          >
            <span>{standalone ? 'Exit to Site' : 'Skip'}</span>
            {!standalone && <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] text-slate-400">ESC</span>}
          </button>
        </div>
      </div>

      {/* CENTER HIGH-OCTANE STAGE */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 flex flex-col items-center text-center space-y-6">
        {/* Holographic Security Lock Icon */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping" />
          <div className="w-18 h-18 rounded-3xl bg-emerald-950/70 border-2 border-emerald-400/80 flex items-center justify-center shadow-2xl shadow-emerald-500/40 backdrop-blur-md">
            {sceneIndex === 0 && <Lock className="w-9 h-9 text-rose-400 animate-pulse" />}
            {sceneIndex === 1 && <Zap className="w-9 h-9 text-amber-400 animate-pulse" />}
            {sceneIndex === 2 && <ShieldCheck className="w-9 h-9 text-emerald-400 animate-pulse" />}
            {sceneIndex === 3 && <Unlock className="w-9 h-9 text-emerald-300 animate-bounce" />}
          </div>
        </div>

        {/* JUMBLED HACKER DECRYPT TEXT (Hero Title) */}
        <div className="space-y-2 max-w-2xl">
          <div className="font-mono text-xs uppercase font-extrabold tracking-widest text-emerald-400/90">
            {sceneIndex === 0 && '⚡ ENCRYPTED VAULT DETECTED'}
            {sceneIndex === 1 && '🛡️ SPEND LEAKS INTERCEPTED'}
            {sceneIndex === 2 && '🚀 WEALTH GOAL ACCELERATING'}
            {sceneIndex === 3 && '✓ ACCESS GRANTED // WELCOME'}
          </div>

          <h1 className="font-mono font-black text-2xl sm:text-4xl md:text-5xl text-white tracking-wider leading-tight min-h-[3.5rem] flex items-center justify-center">
            {scrambleText}
          </h1>
        </div>

        {/* Dynamic Punchy Stat Counter */}
        {sceneIndex === 1 && (
          <div className="p-3 px-6 rounded-2xl bg-black/80 border border-amber-500/50 backdrop-blur-md text-amber-300 font-mono text-xl sm:text-2xl font-black animate-in zoom-in duration-200">
            +₹48,600 / YEAR SAVED
          </div>
        )}

        {sceneIndex === 2 && (
          <div className="p-3 px-6 rounded-2xl bg-black/80 border border-emerald-500/50 backdrop-blur-md text-emerald-300 font-mono text-2xl sm:text-3xl font-black animate-in zoom-in duration-200">
            {wealthCounter}
          </div>
        )}

        {sceneIndex === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3 px-6 rounded-2xl bg-emerald-950/80 border border-emerald-400/60 backdrop-blur-md text-emerald-200 font-mono text-base font-bold">
              COMPLETE FINANCIAL CONTROL IS YOURS
            </div>

            {standalone && isFinished && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3 animate-in zoom-in-95 duration-200">
                <button
                  type="button"
                  onClick={restartDemo}
                  className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Replay Demo</span>
                </button>
                <button
                  type="button"
                  onClick={onComplete}
                  className="px-5 py-2.5 rounded-full border border-emerald-400/60 hover:border-emerald-300 bg-black/70 hover:bg-black text-white font-mono font-medium text-sm flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                >
                  <span>Explore Finroq Platform</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM 5-SECOND HIGH-SPEED TIMER HUD */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 py-6 text-center space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400/70">
          <span>{isFinished ? 'COMPLETED' : 'PLAYING DEMO'}</span>
          <span className="font-bold text-white">{isFinished ? 'FINROQ PROOF' : '5.0s WALKTHROUGH'}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-900 border border-emerald-500/30 overflow-hidden">
          <div
            key={iteration}
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-75 rounded-full animate-pulse"
            style={{
              animation: 'linear fillTimer 4.8s forwards',
            }}
          />
        </div>
      </div>
    </div>
  );
}
