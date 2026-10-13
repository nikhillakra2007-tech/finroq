'use client';

import React, { useState, useEffect } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { apiClient } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';
import { Target, Calendar, CheckCircle2, ArrowRight, Wallet, Shuffle, Layers, Plus, Sparkles } from 'lucide-react';

interface Goal {
  id: number;
  name: string;
  nameHi?: string;
  category: string;
  categoryHi?: string;
  targetAmount: number;
  currentAmount: number;
  priority: number;
}

const INITIAL_GOALS: Goal[] = [
  { id: 1, name: '6-Month Emergency Cushion', nameHi: '6-महीने का आपातकालीन फंड', category: 'Safety Net', categoryHi: 'सुरक्षा कवच', targetAmount: 300000, currentAmount: 180000, priority: 1 },
  { id: 2, name: 'Flat Down Payment & Registry', nameHi: 'मकान डाउन पेमेंट व रजिस्ट्री', category: 'Real Estate', categoryHi: 'अचल संपत्ति', targetAmount: 1500000, currentAmount: 420000, priority: 2 },
  { id: 3, name: 'Annual Family Vacation Fund', nameHi: 'वार्षिक पारिवारिक यात्रा फंड', category: 'Lifestyle', categoryHi: 'जीवनशैली', targetAmount: 200000, currentAmount: 60000, priority: 3 },
  { id: 4, name: 'New Car Fund', nameHi: 'नई कार बचत फंड', category: 'Lifestyle', categoryHi: 'जीवनशैली', targetAmount: 800000, currentAmount: 150000, priority: 4 },
  { id: 5, name: 'Child Education Fund', nameHi: 'बच्चों की उच्च शिक्षा फंड', category: 'Future', categoryHi: 'भविष्य निधि', targetAmount: 2000000, currentAmount: 100000, priority: 5 },
];

export default function AppGoalTimelinePage() {
  const { language } = useI18n();
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const [monthlySurplus, setMonthlySurplus] = useState<number>(45000);
  const [strategy, setStrategy] = useState<'simultaneous' | 'sequential'>('sequential');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        await apiClient.getSummary();
      } catch (err) {
        console.warn('Goal timeline using local data:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const totalRemaining = goals.reduce((sum, g) => sum + Math.max(0, g.targetAmount - g.currentAmount), 0);

  const simultaneousResults = goals.map((g) => {
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);
    const weight = totalRemaining > 0 ? remaining / totalRemaining : 0;
    const allocatedMonthly = Math.round(monthlySurplus * weight);
    const months = allocatedMonthly > 0 ? Math.ceil(remaining / allocatedMonthly) : 0;
    const finishDate = new Date();
    finishDate.setMonth(finishDate.getMonth() + months);
    return { ...g, remaining, allocatedMonthly, months, finishDate };
  });

  let cumulativeMonths = 0;
  const sequentialResults = goals.map((g) => {
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);
    const monthsForThisGoal = monthlySurplus > 0 ? Math.ceil(remaining / monthlySurplus) : 0;
    cumulativeMonths += monthsForThisGoal;
    const finishDate = new Date();
    finishDate.setMonth(finishDate.getMonth() + cumulativeMonths);
    return { ...g, remaining, allocatedMonthly: monthlySurplus, months: cumulativeMonths, finishDate };
  });

  const activeResults = strategy === 'simultaneous' ? simultaneousResults : sequentialResults;

  return (
    <ModuleShell
      title={language === 'hi' ? 'लक्ष्य समयरेखा सिम्युलेटर' : 'Goal Timeline Simulator'}
      category={language === 'hi' ? 'निर्माण और सुरक्षा' : 'Build & Protect'}
      description={
        language === 'hi'
          ? 'समानांतर विभाजन (Parallel Split) और क्रमिक प्राथमिकताओं (Sequential Waterfall) के बीच समयरेखा की तुलना करें।'
          : 'Simulate multiple simultaneous savings targets with deterministic timeline comparisons between Parallel Split and Sequential Waterfall.'
      }
    >
      {isLoading ? (
        <div className="space-y-8">
          <div className="h-80 bg-[var(--soft)] rounded-3xl animate-pulse" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5].map(i => <div key={i} className="h-64 bg-[var(--soft)] rounded-3xl animate-pulse" />)}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-[#FCFDFC] dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE4DC] dark:border-[#2A3D33]">
              <div>
                <h3 className="font-display font-bold text-lg text-[#173F2B] dark:text-emerald-300">
                  {language === 'hi' ? 'आवंटन रणनीति इंजन' : 'Allocation Strategy Engine'}
                </h3>
                <p className="text-xs font-medium text-[#4D5D51] dark:text-slate-400">
                  {language === 'hi' ? 'एक साथ सभी लक्ष्यों पर बचत बनाम क्रमिक प्राथमिकता का प्रभाव देखें' : 'Compare simultaneous multi-tasking versus sequential avalanche focus'}
                </p>
              </div>
              <div className="p-1 rounded-2xl bg-[#EEF3EE] dark:bg-[#1A2C22] border border-[#DCE4DC] dark:border-[#2A3D33] grid grid-cols-2 text-xs font-bold shadow-xs">
                <button type="button" onClick={() => setStrategy('sequential')} className={`px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${strategy === 'sequential' ? 'bg-[#173F2B] text-white shadow-xs' : 'text-[#4D5D51] dark:text-slate-300 hover:text-[#173F2B]'}`}>
                  <Layers className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'क्रमिक फोकस' : 'Sequential Waterfall'}</span>
                </button>
                <button type="button" onClick={() => setStrategy('simultaneous')} className={`px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${strategy === 'simultaneous' ? 'bg-[#173F2B] text-white shadow-xs' : 'text-[#4D5D51] dark:text-slate-300 hover:text-[#173F2B]'}`}>
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'समानांतर विभाजन' : 'Simultaneous Split'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <label className="font-bold text-[#173F2B] dark:text-slate-200">
                  {language === 'hi' ? 'मासिक उपलब्ध बचत पूल (सरप्लस):' : 'Monthly Available Savings Pool (Surplus):'}
                </label>
                <span className="font-mono text-xl font-bold text-[#173F2B] dark:text-slate-100">{formatCurrency(monthlySurplus)}{language === 'hi' ? '/माह' : '/month'}</span>
              </div>
              <input type="range" min={10000} max={150000} step={5000} value={monthlySurplus} onChange={(e) => setMonthlySurplus(Number(e.target.value))} className="w-full accent-[#173F2B] h-2 bg-[#E5EDE5] rounded-lg cursor-pointer" />
              <div className="flex justify-between text-[11px] font-mono text-[#4D5D51] dark:text-slate-400">
                <span>₹10,000/mo</span>
                <span>₹75,000/mo</span>
                <span>₹1,50,000/mo</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-slate-700 dark:text-slate-300">
                {strategy === 'sequential' ? (
                  <>
                    <strong className="text-[#173F2B] dark:text-emerald-300 block">
                      {language === 'hi' ? 'क्रमिक फोकस का लाभ:' : 'Sequential Focus Advantage:'}
                    </strong>
                    {language === 'hi' ? (
                      <>
                        लक्ष्य 1 (आपातकालीन कुशन) को पहले पूरा करने से यह मात्र <strong className="text-[#173F2B] dark:text-emerald-200">{sequentialResults[0].months} महीनों</strong> में पूरा हो जाता है (समानांतर में {simultaneousResults[0].months} महीने लगते), जिससे आपका परिवार संकट से तुरंत सुरक्षित हो जाता है!
                      </>
                    ) : (
                      <>
                        By funding Goal 1 (Emergency Cushion) first, it finishes in just <strong className="text-[#173F2B] dark:text-emerald-200">{sequentialResults[0].months} months</strong> (vs {simultaneousResults[0].months} months under Simultaneous), securing your household rapidly against panic!
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <strong className="text-[#173F2B] dark:text-emerald-300 block">
                      {language === 'hi' ? 'समानांतर विभाजन की स्थिति:' : 'Simultaneous Split Dynamics:'}
                    </strong>
                    {language === 'hi' ? (
                      <>
                        सभी 5 लक्ष्य हर महीने थोड़ी प्रगति करते हैं। हालांकि, आपका महत्वपूर्ण आपातकालीन फंड {sequentialResults[0].months} महीनों के बजाय <strong className="text-[#173F2B] dark:text-emerald-200">{simultaneousResults[0].months} महीनों</strong> में पूरा होता है।
                      </>
                    ) : (
                      <>
                        All 5 goals make progress each month. However, your critical Emergency Cushion takes <strong className="text-[#173F2B] dark:text-emerald-200">{simultaneousResults[0].months} months</strong> to fully fund instead of {sequentialResults[0].months} months.
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeResults.map((g, idx) => {
              const pct = Math.min(100, Math.round((g.currentAmount / (g.targetAmount || 1)) * 100));
              const goalTitle = language === 'hi' && g.nameHi ? g.nameHi : g.name;
              const goalCat = language === 'hi' && g.categoryHi ? g.categoryHi : g.category;
              return (
                <div key={g.id} className="bg-[#FCFDFC] dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33] rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-xs">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#173F2B] dark:text-emerald-300 bg-[#EEF5EE] dark:bg-[#1A2C22] px-2.5 py-0.5 rounded-full border border-[#DCE4DC] dark:border-[#2A3D33]">
                        {language === 'hi' ? `प्राथमिकता #${idx + 1}` : `Priority #${idx + 1}`}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {pct}% {language === 'hi' ? 'पूर्ण' : 'funded'}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-lg text-[#173F2B] dark:text-slate-100">{goalTitle}</h4>
                    <p className="text-xs text-[#4D5D51] dark:text-slate-400 font-medium">{goalCat}</p>
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#4D5D51] dark:text-slate-400">{language === 'hi' ? 'संचित:' : 'Saved:'}</span>
                        <span className="font-bold text-[#173F2B] dark:text-slate-100">{formatCurrency(g.currentAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#4D5D51] dark:text-slate-400">{language === 'hi' ? 'लक्ष्य:' : 'Target:'}</span>
                        <span className="font-bold text-[#173F2B] dark:text-slate-100">{formatCurrency(g.targetAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-mono border-t border-[#DCE4DC] dark:border-[#2A3D33] pt-1">
                        <span className="text-[#4D5D51] dark:text-slate-400">{language === 'hi' ? 'शेष अंतर:' : 'Remaining:'}</span>
                        <span className="font-bold text-[#B43838] dark:text-rose-400">{formatCurrency(g.remaining)}</span>
                      </div>
                      <div className="w-full bg-[#E5EDE5] dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
                        <div className="bg-[#173F2B] dark:bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[#DCE4DC] dark:border-[#2A3D33] space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#4D5D51] dark:text-slate-400 font-medium">{language === 'hi' ? 'अनुमानित पूर्णता:' : 'Estimated Completion:'}</span>
                      <span className="font-mono font-bold text-[#173F2B] dark:text-slate-100">
                        {g.finishDate.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-mono text-[#4D5D51] dark:text-slate-400">
                      <span>{language === 'hi' ? 'समयसीमा:' : 'Timeline:'}</span>
                      <span>{g.months} {language === 'hi' ? 'महीने' : (g.months !== 1 ? 'months' : 'month')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ModuleShell>
  );
}
