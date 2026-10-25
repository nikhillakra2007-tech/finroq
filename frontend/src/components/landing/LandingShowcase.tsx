'use client';

import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { getStoredTheme, applyTheme } from '@/lib/theme';
import { CinematicDemoIntro } from './CinematicDemoIntro';
import { LandingHeader } from './LandingHeader';
import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { LandingSimulator } from './LandingSimulator';
import { LandingFaq } from './LandingFaq';
import { LandingCta } from './LandingCta';
import { LandingFooter } from './LandingFooter';

export function LandingShowcase({ onEnterApp }: { onEnterApp?: () => void }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [demoIntroActive, setDemoIntroActive] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  // Plays once when user enters the site before the landing page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('skipIntro') === '1') return;

      const hasPlayed = sessionStorage.getItem('finroq_intro_played');
      if (!hasPlayed) {
        setDemoIntroActive(true);
        sessionStorage.setItem('finroq_intro_played', 'true');
      }
    }
  }, []);

  // Theme setup
  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
  };

  // Lenis smooth scrolling setup & progress tracking
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
    });

    const updateScrollMetrics = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress(Math.min(1, Math.max(0, scrollY / docHeight)));
      }
    };

    lenis.on('scroll', updateScrollMetrics);

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] selection:bg-[#173F2B] selection:text-white relative font-sans overflow-x-hidden">
      {/* 0. Cinematic Demo Video Intro (Plays once on site entry before landing page) */}
      {demoIntroActive && (
        <CinematicDemoIntro onComplete={() => setDemoIntroActive(false)} />
      )}

      {/* 1. Dynamic Top Scroll Progress Indicator */}
      <div
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 via-[#173F2B] to-teal-400 z-[100] origin-left pointer-events-none transition-transform duration-75 shadow-xs"
        style={{ transform: `scaleX(${scrollProgress})` }}
      />

      {/* 2. Top Header Navigation */}
      <LandingHeader
        isScrolled={isScrolled}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenDemo={() => setDemoIntroActive(true)}
      />

      {/* 3. Hero Section */}
      <LandingHero onOpenDemo={() => setDemoIntroActive(true)} />

      {/* 4. Core Features Grid (4 Flagship Systems) */}
      <LandingFeatures />

      {/* 5. Interactive Solvency, Goal & Crash-Test Simulators */}
      <LandingSimulator />

      {/* 6. Frequently Asked Questions */}
      <LandingFaq />

      {/* 7. Grand Finale Call to Action */}
      <LandingCta />

      {/* 8. Minimal Fintech Footer */}
      <LandingFooter />
    </div>
  );
}
