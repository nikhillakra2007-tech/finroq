'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Coffee,
  CreditCard,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  DollarSign,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';
import { formatCurrency } from '@/lib/utils';
import { formatInrCompact } from '@/lib/multiverse-engine';

export function VisualTipsSection() {
  const { language } = useI18n();
  const isHi = language === 'hi';

  const [activeTab, setActiveTab] = useState<
    'impulse' | 'chai' | 'cibil' | 'upi' | 'autosip' | 'split50'
  >('impulse');

  // 1. Impulse Rule State
  const [impulseAmount, setImpulseAmount] = useState<number>(4500);

  // 2. Chai Compounding State
  const [dailyChaiSpend, setDailyChaiSpend] = useState<number>(60); // ₹60/day

  // 3. Credit Card Limit State
  const [cardLimit, setCardLimit] = useState<number>(100000);
  const [cardSpend, setCardSpend] = useState<number>(28000);

  // 4. Salary Split State
  const [monthlySalary, setMonthlySalary] = useState<number>(60000);

  // Derived Calculations
  // Chai Math: monthly = spend * 30. Compounded over 20 yrs at 13.5%
  const monthlySipChai = dailyChaiSpend * 30;
  const calculateChaiCorpus = (years: number) => {
    const r = 0.135 / 12;
    const n = years * 12;
    const fv = monthlySipChai * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    return Math.round(fv);
  };

  const chai5yr = calculateChaiCorpus(5);
  const chai10yr = calculateChaiCorpus(10);
  const chai20yr = calculateChaiCorpus(20);

  // CIBIL Ratio
  const cardRatio = Math.round((cardSpend / cardLimit) * 100);

  // 50/30/20 Split
  const needs50 = monthlySalary * 0.5;
  const wants30 = monthlySalary * 0.3;
  const savings20 = monthlySalary * 0.2;

  return (
    <section className="bg-white dark:bg-[#16251E] border border-[#CBD5CB] dark:border-[#2A3D33] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#CBD5CB]/60 dark:border-[#2A3D33]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isHi ? 'दृश्य सुझाव और तकनीकें' : 'Visual Tips & Techniques'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#173F2B] dark:text-[#E6EEE9]">
            {isHi
              ? 'युवाओं और नए पेशेवरों के लिए 6 सुनहरे दृश्य नियम'
              : '6 Core Visual Wealth & Safety Rules for Youth'}
          </h2>
          <p className="text-xs sm:text-sm text-[#4D5D51] dark:text-slate-300 max-w-2xl">
            {isHi
              ? 'जटिल वित्तीय सिद्धांतों को सरल आरेखों, वास्तविक गणनाओं और व्यावहारिक युक्तियों के साथ समझें।'
              : 'Master foundational personal finance with interactive diagrams, real Indian Rupee math, and psychological shields.'}
          </p>
        </div>

        {/* Quick Nav Pill Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setActiveTab('impulse')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'impulse'
                ? 'bg-[#173F2B] text-white dark:bg-[#5ECB9C] dark:text-[#0B1A13] shadow-xs'
                : 'bg-[#F7F7F0] dark:bg-[#0D1411] text-gray-600 dark:text-gray-300 hover:text-[#173F2B]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isHi ? '24-घंटे नियम' : '24-Hr Rule'}</span>
          </button>

          <button
            onClick={() => setActiveTab('chai')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chai'
                ? 'bg-[#173F2B] text-white dark:bg-[#5ECB9C] dark:text-[#0B1A13] shadow-xs'
                : 'bg-[#F7F7F0] dark:bg-[#0D1411] text-gray-600 dark:text-gray-300 hover:text-[#173F2B]'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>{isHi ? 'चाय कम्पाउंडिंग' : 'Chai Compounding'}</span>
          </button>

          <button
            onClick={() => setActiveTab('cibil')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cibil'
                ? 'bg-[#173F2B] text-white dark:bg-[#5ECB9C] dark:text-[#0B1A13] shadow-xs'
                : 'bg-[#F7F7F0] dark:bg-[#0D1411] text-gray-600 dark:text-gray-300 hover:text-[#173F2B]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{isHi ? '30% क्रेडिट अनुपात' : '30% Credit Rule'}</span>
          </button>

          <button
            onClick={() => setActiveTab('upi')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'upi'
                ? 'bg-[#173F2B] text-white dark:bg-[#5ECB9C] dark:text-[#0B1A13] shadow-xs'
                : 'bg-[#F7F7F0] dark:bg-[#0D1411] text-gray-600 dark:text-gray-300 hover:text-[#173F2B]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isHi ? 'UPI ज़ीरो-पिन' : 'UPI Zero-PIN'}</span>
          </button>

          <button
            onClick={() => setActiveTab('autosip')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'autosip'
                ? 'bg-[#173F2B] text-white dark:bg-[#5ECB9C] dark:text-[#0B1A13] shadow-xs'
                : 'bg-[#F7F7F0] dark:bg-[#0D1411] text-gray-600 dark:text-gray-300 hover:text-[#173F2B]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isHi ? 'डे-1 ऑटो SIP' : 'Day 1 Auto-SIP'}</span>
          </button>

          <button
            onClick={() => setActiveTab('split50')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'split50'
                ? 'bg-[#173F2B] text-white dark:bg-[#5ECB9C] dark:text-[#0B1A13] shadow-xs'
                : 'bg-[#F7F7F0] dark:bg-[#0D1411] text-gray-600 dark:text-gray-300 hover:text-[#173F2B]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isHi ? '50/30/20 विभाजन' : '50/30/20 Split'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: 24-HOUR IMPULSE PAUSE CLOCK */}
      {activeTab === 'impulse' && (
        <div className="grid lg:grid-cols-12 gap-6 items-center animate-in fade-in duration-200">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
              <Clock className="w-4 h-4" />
              <span>THE 24-HOUR ANTI-IMPULSE PROTOCOL</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#173F2B] dark:text-emerald-300">
              {isHi
                ? 'खरीदने से पहले 24 घंटे का विराम नियम'
                : 'The 24-Hour Impulse Pause Clock'}
            </h3>
            <p className="text-xs sm:text-sm text-[#4D5D51] dark:text-slate-300 leading-relaxed">
              {isHi
                ? 'जब भी कोई गैर-ज़रूरी वस्तु ₹2,000 से अधिक की दिखे, तुरंत खरीदने के बजाय उसे कार्ट में डालकर 24 घंटे का अलार्म लगाएं। 78% मामलों में डोपामाइन का नशा उतर जाता है और पैसे बच जाते हैं।'
                : 'Whenever an impulsive urge strikes for anything exceeding ₹2,000, place it in a cart waiting room for exactly 24 hours. Behavioral science proves that 78% of impulse urges completely evaporate once dopamine normalizes.'}
            </p>

            {/* Price Slider */}
            <div className="p-4 rounded-2xl bg-[#F7F7F0] dark:bg-[#0D1411] border border-[#CBD5CB]/60 dark:border-[#2A3D33] space-y-2.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-gray-500 font-medium">
                  {isHi ? 'आइटम का मूल्य (स्लाइडर हिलाएं):' : 'Item Price Tag (Slide to test):'}
                </span>
                <span className="text-base font-bold text-[#173F2B] dark:text-emerald-400">
                  {formatCurrency(impulseAmount)}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="30000"
                step="500"
                value={impulseAmount}
                onChange={(e) => setImpulseAmount(Number(e.target.value))}
                className="w-full accent-emerald-600 dark:accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-400">
                <span>₹500</span>
                <span>₹15,000</span>
                <span>₹30,000</span>
              </div>
            </div>

            {/* Pro Tip */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-[#173F2B] dark:text-emerald-300 flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>{isHi ? 'गोल्डन टिप:' : 'Golden Rule:'}</strong>{' '}
                {isHi
                  ? 'अगर 24 घंटे बाद भी आपको इसकी वास्तविक आवश्यकता महसूस हो, तभी खरीदें। अन्यथा बचा हुआ पैसा सीधे अपने SIP में डालें!'
                  : 'If you still genuinely need it after 24 hours, buy it guilt-free. If not, route the saved cash straight into an index fund SIP!'}
              </span>
            </div>
          </div>

          {/* Visual Diagram Column */}
          <div className="lg:col-span-6 bg-[#F7F7F0] dark:bg-[#0D1411] rounded-2xl p-6 border border-[#CBD5CB]/60 dark:border-[#2A3D33] space-y-5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-gray-500 font-semibold uppercase">Psychological State Over 24 Hours</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold ${
                  impulseAmount > 2000
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {impulseAmount > 2000 ? 'PAUSE CLOCK TRIGGERED' : 'GREEN LIGHT'}
              </span>
            </div>

            {/* Graphic Comparison */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Hour 0: Dopamine Surge (Impulse)
                  </span>
                  <span className="font-mono text-rose-600 font-bold">100% Urge</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full w-full" />
                </div>
                <span className="text-[10px] text-gray-500 block">
                  &ldquo;I must buy this right now, this will change my life!&rdquo;
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Hour 24: Rational Cold-State Logic
                  </span>
                  <span className="font-mono text-emerald-600 font-bold">22% Real Need</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[22%]" />
                </div>
                <span className="text-[10px] text-gray-500 block">
                  Urge collapsed. ₹{impulseAmount.toLocaleString()} saved effortlessly.
                </span>
              </div>
            </div>

            {/* Verdict Box */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#16251E] border border-[#CBD5CB]/60 dark:border-[#2A3D33] flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-500 block text-[11px]">Recommended Action</span>
                <span className="font-bold text-[#173F2B] dark:text-emerald-300">
                  {impulseAmount > 2000
                    ? 'Wait 24 Hours. Add to wishlist, close tab.'
                    : 'Small expense below threshold. Proceed safely.'}
                </span>
              </div>
              <span className="text-xl font-bold font-mono">
                {impulseAmount > 2000 ? '⏳ 24h' : '✅ OK'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHAI VS COMPOUNDING (MICRO-INVESTING) */}
      {activeTab === 'chai' && (
        <div className="grid lg:grid-cols-12 gap-6 items-center animate-in fade-in duration-200">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
              <Coffee className="w-4 h-4" />
              <span>THE CHAI & SNACK COMPOUNDING MULTIPLIER</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#173F2B] dark:text-emerald-300">
              {isHi
                ? 'दैनिक चाय बनाम ₹18.5 लाख का कोष'
                : 'Daily Chai vs ₹18.5 Lakhs Wealth'}
            </h3>
            <p className="text-xs sm:text-sm text-[#4D5D51] dark:text-slate-300 leading-relaxed">
              {isHi
                ? 'प्रतिदिन ₹50-₹60 की चाय या बाहर का स्नैक महीने में ₹1,500 से ₹1,800 बन जाता है। यदि इसे 13.5% निफ्टी इंडेक्स फंड में निवेश किया जाए, तो समय के साथ यह आपके घर के डाउन पेमेंट में बदल सकता है।'
                : 'A daily ₹50-₹60 tea or takeout coffee seems negligible, but totals ₹1,500 - ₹1,800 monthly. Re-routed into a Nifty 50 Index Fund at historical 13.5% CAGR, it turns into real financial freedom.'}
            </p>

            {/* Slider */}
            <div className="p-4 rounded-2xl bg-[#F7F7F0] dark:bg-[#0D1411] border border-[#CBD5CB]/60 dark:border-[#2A3D33] space-y-2.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-gray-500 font-medium">
                  {isHi ? 'दैनिक स्नैक/चाय खर्च:' : 'Daily Casual Spend / Cup:'}
                </span>
                <span className="text-base font-bold text-[#173F2B] dark:text-emerald-400">
                  ₹{dailyChaiSpend}/day (₹{monthlySipChai.toLocaleString()}/mo)
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="250"
                step="10"
                value={dailyChaiSpend}
                onChange={(e) => setDailyChaiSpend(Number(e.target.value))}
                className="w-full accent-emerald-600 dark:accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-400">
                <span>₹20/day</span>
                <span>₹100/day</span>
                <span>₹250/day</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-[#173F2B] dark:text-amber-300 flex items-start gap-2.5">
              <Coffee className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>{isHi ? 'दृष्टिकोण:' : 'Mindset Shift:'}</strong>{' '}
                {isHi
                  ? 'हम यह नहीं कहते कि चाय पीना बंद करें! बस महीने में 15 कप का पैसा बचाकर अपने पहले म्यूचुअल फंड SIP में लगाएं।'
                  : 'You do not have to give up life pleasures. Simply redirect 15 cups worth of cash into your auto-SIP each month!'}
              </span>
            </div>
          </div>

          {/* Visual Compounding Columns */}
          <div className="lg:col-span-6 bg-[#F7F7F0] dark:bg-[#0D1411] rounded-2xl p-6 border border-[#CBD5CB]/60 dark:border-[#2A3D33] space-y-5">
            <span className="text-xs font-mono font-semibold text-gray-500 block uppercase">
              Trajectory of ₹{monthlySipChai.toLocaleString()}/month at 13.5% CAGR
            </span>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#16251E] border border-[#CBD5CB]/60 dark:border-[#2A3D33] text-center space-y-1">
                <span className="text-[10px] font-mono text-gray-400 uppercase">5 Years</span>
                <span className="text-base font-bold font-mono text-[#173F2B] dark:text-emerald-400 block">
                  {formatInrCompact(chai5yr)}
                </span>
                <span className="text-[9px] text-gray-500 block">Invested: ₹{(monthlySipChai * 60).toLocaleString()}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-[#16251E] border border-[#CBD5CB]/60 dark:border-[#2A3D33] text-center space-y-1">
                <span className="text-[10px] font-mono text-gray-400 uppercase">10 Years</span>
                <span className="text-base font-bold font-mono text-[#173F2B] dark:text-emerald-400 block">
                  {formatInrCompact(chai10yr)}
                </span>
                <span className="text-[9px] text-gray-500 block">Invested: ₹{(monthlySipChai * 120).toLocaleString()}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-center space-y-1">
                <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 font-bold uppercase">20 Years</span>
                <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300 block">
                  {formatInrCompact(chai20yr)}
                </span>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block font-semibold">
                  {Math.round(chai20yr / (monthlySipChai * 240))}x Compounded!
                </span>
              </div>
            </div>

            {/* Visual Bar Graph */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span>Total Wealth vs Paper Cups</span>
                <span className="text-emerald-600 font-bold">{formatInrCompact(chai20yr)} in 20 Yrs</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 h-6 rounded-xl overflow-hidden flex">
                <div
                  className="bg-gray-400 text-[10px] font-mono text-white flex items-center justify-center font-bold px-1"
                  style={{ width: '25%' }}
                  title="Principal Invested"
                >
                  Principal
                </div>
                <div
                  className="bg-emerald-500 text-[10px] font-mono text-slate-950 flex items-center justify-center font-black px-1"
                  style={{ width: '75%' }}
                  title="Compounded Wealth Gain"
                >
                  Compounded Interest (75%)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 30% CREDIT CARD CIBIL SHIELD */}
      {activeTab === 'cibil' && (
        <div className="grid lg:grid-cols-12 gap-6 items-center animate-in fade-in duration-200">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-blue-700 dark:text-blue-400">
              <CreditCard className="w-4 h-4" />
              <span>THE 30% CREDIT UTILIZATION CIBIL SHIELD</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#173F2B] dark:text-emerald-300">
              {isHi
                ? 'क्रेडिट कार्ड की 30% सीमा नियम'
                : 'The 30% Credit Card Utilization Rule'}
            </h3>
            <p className="text-xs sm:text-sm text-[#4D5D51] dark:text-slate-300 leading-relaxed">
              {isHi
                ? 'चाहे आप पूरा बिल समय पर भरते हों, यदि आप कार्ड की कुल लिमिट का 30% से अधिक खर्च करते हैं, तो CIBIL और Experian आपको "क्रेडिट का भूखा" मानते हैं और आपका स्कोर गिरा देते हैं।'
                : 'Even if you pay your bill 100% on time, utilizing over 30% of your credit card limit flags you as &ldquo;credit hungry&rdquo; in CIBIL algorithms, quietly shaving 20 to 50 points off your credit score.'}
            </p>

            {/* Sliders */}
            <div className="p-4 rounded-2xl bg-[#F7F7F0] dark:bg-[#0D1411] border border-[#CBD5CB]/60 dark:border-[#2A3D33] space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-500">Your Credit Limit:</span>
                  <span className="font-bold text-[#173F2B] dark:text-emerald-400">
                    {formatCurrency(cardLimit)}
                  </span>
                </div>
                <input
                  type="range"
                  min="25000"
                  max="300000"
                  step="25000"
                  value={cardLimit}
                  onChange={(e) => setCardLimit(Number(e.target.value))}
                  className="w-full accent-emerald-600 dark:accent-emerald-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1 pt-2 border-t border-gray-200 dark:border-gray-800">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-500">Monthly Spend on Card:</span>
                  <span className="font-bold text-[#173F2B] dark:text-emerald-400">
                    {formatCurrency(cardSpend)} ({cardRatio}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max={cardLimit}
                  step="2000"
                  value={cardSpend}
                  onChange={(e) => setCardSpend(Number(e.target.value))}
                  className="w-full accent-emerald-600 dark:accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Visual Gauge Column */}
          <div className="lg:col-span-6 bg-[#F7F7F0] dark:bg-[#0D1411] rounded-2xl p-6 border border-[#CBD5CB]/60 dark:border-[#2A3D33] space-y-5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-gray-500 font-semibold uppercase">CIBIL Health Status</span>
              <span
                className={`px-3 py-1 rounded-full font-bold text-xs ${
                  cardRatio <= 30
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : cardRatio <= 50
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {cardRatio <= 30 ? '🟢 OPTIMAL (780+ CIBIL)' : cardRatio <= 50 ? '🟡 WARNING ZONE' : '🔴 DANGER (CIBIL DROP)'}
              </span>
            </div>

            {/* Gauge Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden flex relative">
                <div className="bg-emerald-500 h-full w-[30%]" title="Safe Zone (< 30%)" />
                <div className="bg-amber-500 h-full w-[20%]" title="Caution Zone (30-50%)" />
                <div className="bg-rose-500 h-full w-[50%]" title="Danger Zone (> 50%)" />

                {/* Marker */}
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-black dark:bg-white shadow-md transition-all duration-150"
                  style={{ left: `${Math.min(100, Math.max(0, cardRatio))}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-gray-500">
                <span className="text-emerald-600 font-bold">0-30% Safe Cap ({formatCurrency(cardLimit * 0.3)})</span>
                <span className="text-amber-500">50% Threshold</span>
                <span className="text-rose-600">100% Limit</span>
              </div>
            </div>

            {/* Recommendation Box */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#16251E] border border-[#CBD5CB]/60 dark:border-[#2A3D33] text-xs space-y-1">
              <span className="font-bold text-[#173F2B] dark:text-emerald-300 block">
                {cardRatio <= 30
                  ? '✅ Excellent Discipline! Your CIBIL profile stays pristine and banks will offer pre-approved home/car loans at lowest rates.'
                  : `⚠️ Warning: You are using ${cardRatio}% of your limit. Consider paying off ₹${(cardSpend - cardLimit * 0.3).toLocaleString()} before statement generation date to stay in the green zone!`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: UPI ZERO-PIN SCAM SHIELD */}
      {activeTab === 'upi' && (
        <div className="grid lg:grid-cols-12 gap-6 items-center animate-in fade-in duration-200">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-rose-700 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
              <span>THE ZERO-PIN UPI SCAM DEFENSE SHIELD</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#173F2B] dark:text-emerald-300">
              {isHi
                ? 'UPI पिन केवल पैसे भेजने के लिए होता है'
                : 'The UPI Zero-PIN Rule: Never Get Scammed'}
            </h3>
            <p className="text-xs sm:text-sm text-[#4D5D51] dark:text-slate-300 leading-relaxed">
              {isHi
                ? 'भारत में हर दिन हज़ारों छात्र और युवा OLX, कैशबैक और जॉब स्कैम में पैसे गंवाते हैं। एक ही नियम याद रखें: पैसे प्राप्त करने के लिए कभी भी पिन डालने या QR कोड स्कैन करने की आवश्यकता नहीं होती!'
                : 'Thousands of young Indians lose money to refund frauds, OLX buyer scams, and fake lottery rewards. Memorize this immutable rule: entering a PIN ALWAYS deducts money from your bank account.'}
            </p>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Classic Scam Tricks Exposed:</span>
              </div>
              <ul className="space-y-1.5 list-disc pl-4 text-xs">
                <li>&ldquo;Scan this QR code on Google Pay to receive ₹5,000 refund/cashback&rdquo; ➔ <strong>100% FRAUD</strong></li>
                <li>&ldquo;Enter your 4-digit PIN to verify your bank account for joining bonus&rdquo; ➔ <strong>100% FRAUD</strong></li>
                <li>&ldquo;Install AnyDesk or QuickSupport to complete KYC verification&rdquo; ➔ <strong>100% FRAUD</strong></li>
              </ul>
            </div>
          </div>

          {/* Visual Red vs Green Shield */}
          <div className="lg:col-span-6 grid sm:grid-cols-2 gap-4">
            {/* GREEN CARD */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>RECEIVING MONEY (+₹)</span>
              </div>
              <p className="text-xs text-[#173F2B] dark:text-emerald-200 leading-relaxed">
                Money arrives in your bank account automatically.
              </p>
              <div className="p-3 bg-white dark:bg-[#16251E] rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-[10px] uppercase font-mono text-gray-400 block">Required PIN:</span>
                <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                  ZERO (0 PIN)
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">Never touch the keypad!</span>
              </div>
            </div>

            {/* RED CARD */}
            <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>SENDING MONEY (−₹)</span>
              </div>
              <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
                Only enter your secret PIN when YOU are paying someone.
              </p>
              <div className="p-3 bg-white dark:bg-[#16251E] rounded-xl border border-rose-200 dark:border-rose-800 text-center">
                <span className="text-[10px] uppercase font-mono text-gray-400 block">Entered PIN:</span>
                <span className="text-lg font-black font-mono text-rose-600 dark:text-rose-400">
                  DEBITS CASH (−₹)
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">Money leaves instantly!</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DAY 1 AUTO-SIP (PAY YOURSELF FIRST) */}
      {activeTab === 'autosip' && (
        <div className="grid lg:grid-cols-12 gap-6 items-center animate-in fade-in duration-200">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-purple-700 dark:text-purple-400">
              <Zap className="w-4 h-4" />
              <span>THE SALARY-DAY AUTO-SIP BLUEPRINT</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#173F2B] dark:text-emerald-300">
              {isHi
                ? 'सैलरी के पहले दिन ऑटो-डेबिट का कमाल'
                : 'Pay Yourself First on Day 1'}
            </h3>
            <p className="text-xs sm:text-sm text-[#4D5D51] dark:text-slate-300 leading-relaxed">
              {isHi
                ? '90% लोग महीने भर खर्च करने के बाद बचा हुआ पैसा बचाने की कोशिश करते हैं और अंत में ₹0 बचता है। वेतन आते ही पहले दिन ऑटो-डेबिट SIP लगाने से आपकी बचत की गारंटी हो जाती है और बाकी पैसे बिना अपराधबोध के खर्च किए जा सकते हैं।'
                : 'Saving &ldquo;whatever is left at the end of the month&rdquo; mathematically fails for 90% of earners because lifestyle expands to swallow cash. Auto-debiting your SIP on salary day guarantees wealth creation, while allowing 100% guilt-free spending for the remaining 29 days.'}
            </p>

            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>
                <strong>Action Rule:</strong> Set your Mutual Fund SIP date between the <strong>2nd and 5th</strong> of the month (right after your salary credits).
              </span>
            </div>
          </div>

          {/* Visual Workflow Comparison */}
          <div className="lg:col-span-6 space-y-4">
            {/* The Loser Flow */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#16251E] border border-rose-300 dark:border-rose-900/50 space-y-2">
              <span className="text-[11px] font-mono font-bold text-rose-600 uppercase flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" /> The Old Trap (Spend First, Save Later)
              </span>
              <div className="flex items-center gap-2 text-xs font-mono overflow-x-auto pb-1">
                <span className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">Salary (1st)</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">Shopping & Spends</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="p-2 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-950/60 font-bold shrink-0">
                  Leftover: ₹0 ❌
                </span>
              </div>
            </div>

            {/* The Winner Flow */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#16251E] border-2 border-emerald-500 space-y-2">
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> The Finroq Pro Flow (Auto-SIP on Day 1)
              </span>
              <div className="flex items-center gap-2 text-xs font-mono overflow-x-auto pb-1">
                <span className="p-2 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 font-semibold">
                  Salary (1st)
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="p-2 rounded-lg bg-emerald-100 text-emerald-900 dark:bg-emerald-900/80 font-bold shrink-0">
                  Auto-SIP 20% (2nd) ⚡
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 shrink-0">
                  Guilt-Free Life
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: 50/30/20 SALARY SPLITTER */}
      {activeTab === 'split50' && (
        <div className="grid lg:grid-cols-12 gap-6 items-center animate-in fade-in duration-200">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
              <Sliders className="w-4 h-4" />
              <span>THE 50/30/20 SALARY DAY ALLOCATOR</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#173F2B] dark:text-emerald-300">
              {isHi
                ? '50/30/20 दृश्य वेतन विभाजक'
                : '50/30/20 Visual Salary Splitter'}
            </h3>
            <p className="text-xs sm:text-sm text-[#4D5D51] dark:text-slate-300 leading-relaxed">
              {isHi
                ? 'अपने इन-हैंड मासिक वेतन को 3 सरल डिब्बों में विभाजित करें: 50% आवश्यकताएं (किराया, भोजन), 30% इच्छाएं (मनोरंजन), और 20% भविष्य का कोष।'
                : 'Partition your take-home monthly salary into three bulletproof buckets: 50% Needs, 30% Wants, and 20% Future You.'}
            </p>

            {/* Salary Slider */}
            <div className="p-4 rounded-2xl bg-[#F7F7F0] dark:bg-[#0D1411] border border-[#CBD5CB]/60 dark:border-[#2A3D33] space-y-2.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-gray-500 font-medium">Monthly Take-Home Salary:</span>
                <span className="text-base font-bold text-[#173F2B] dark:text-emerald-400">
                  {formatCurrency(monthlySalary)}
                </span>
              </div>
              <input
                type="range"
                min="20000"
                max="250000"
                step="5000"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(Number(e.target.value))}
                className="w-full accent-emerald-600 dark:accent-emerald-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-400">
                <span>₹20k</span>
                <span>₹1.25L</span>
                <span>₹2.5L</span>
              </div>
            </div>
          </div>

          {/* 3 Split Cards & Bar */}
          <div className="lg:col-span-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center space-y-1">
                <span className="text-[10px] font-mono text-blue-700 dark:text-blue-300 font-bold block uppercase">
                  50% Needs
                </span>
                <span className="text-base font-bold font-mono text-blue-900 dark:text-blue-100 block">
                  {formatCurrency(needs50)}
                </span>
                <span className="text-[9px] text-gray-500 block">Rent, Groceries, Bills</span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center space-y-1">
                <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 font-bold block uppercase">
                  30% Wants
                </span>
                <span className="text-base font-bold font-mono text-amber-900 dark:text-amber-100 block">
                  {formatCurrency(wants30)}
                </span>
                <span className="text-[9px] text-gray-500 block">Dining, Movies, Trips</span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-1">
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-bold block uppercase">
                  20% Future You
                </span>
                <span className="text-base font-bold font-mono text-emerald-900 dark:text-emerald-100 block">
                  {formatCurrency(savings20)}
                </span>
                <span className="text-[9px] text-gray-500 block">SIP, Emergency, PPF</span>
              </div>
            </div>

            {/* Split Visual Bar */}
            <div className="w-full h-5 rounded-full overflow-hidden flex text-[10px] font-mono font-bold text-white shadow-xs">
              <div className="bg-blue-500 h-full flex items-center justify-center" style={{ width: '50%' }}>
                50%
              </div>
              <div className="bg-amber-500 h-full flex items-center justify-center text-slate-900" style={{ width: '30%' }}>
                30%
              </div>
              <div className="bg-emerald-500 h-full flex items-center justify-center text-slate-900" style={{ width: '20%' }}>
                20%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cross-Link Bar to Predictions and Multiverse */}
      <div className="pt-4 border-t border-[#CBD5CB]/60 dark:border-[#2A3D33] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-gray-600 dark:text-gray-300 font-medium">
            Ready to apply these techniques to real wealth compounding?
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/investments"
            className="px-3 py-1.5 rounded-lg bg-[#EAF3E7] dark:bg-[#1A2C22] text-[#173F2B] dark:text-emerald-300 font-semibold hover:bg-[#DCE7D9] transition-colors"
          >
            Start Low-Cost SIPs (₹100) →
          </Link>
          <Link
            href="/app/multiverse"
            className="px-3 py-1.5 rounded-lg bg-[#173F2B] text-white hover:bg-[#102F21] dark:bg-[#5ECB9C] dark:text-[#0B1A13] font-semibold transition-colors"
          >
            Simulate 30-Yr Timeline →
          </Link>
        </div>
      </div>
    </section>
  );
}
