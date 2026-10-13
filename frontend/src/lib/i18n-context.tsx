'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav & Common
    'nav.home': '12-Module Home',
    'nav.ledger': 'Ledger',
    'nav.budgets': 'Budgets',
    'nav.comparison': 'Comparison',
    'nav.simulator': 'Goal Simulator',
    'nav.faq': 'FAQ',
    'nav.signin': 'Sign in',
    'nav.getstarted': 'Get started',
    'nav.modules': 'Modules',
    'nav.signout': 'Sign out',
    'nav.demo': '1-Click Demo',

    // Modules
    'mod.expense_tracking': 'Expense Tracking',
    'mod.expense_tracking.desc': 'Record and categorize transactions, monitor statuses, and review completed cash flow with exact arithmetic.',
    'mod.daily_budgeting': 'Daily Budgeting',
    'mod.daily_budgeting.desc': 'Set category spending caps, compare plans with actual expenses, and monitor cushions.',
    'mod.splitter': 'Expense Splitter',
    'mod.splitter.desc': 'Divide shared expenses, calculate exact equal or custom shares, and track settlements.',
    'mod.pre_spend_check': 'Pre-Spend Check',
    'mod.pre_spend_check.desc': 'Estimate the effect of a planned purchase on remaining budget before spending.',
    'mod.spend_leak_detector': 'Spend Leak Detector',
    'mod.spend_leak_detector.desc': 'Identify recurring unused app subscriptions, auto-debits, and compute cancellation savings.',
    'mod.money_guides': 'Money Guides',
    'mod.money_guides.desc': 'Explore simple, actionable financial blueprints, scam protections, and wealth habits.',
    'mod.net_worth': 'Net Worth Architecture',
    'mod.net_worth.desc': 'Track assets minus liabilities across checking, savings, and credit accounts.',
    'mod.goal_timeline': 'Goal Timeline Simulator',
    'mod.goal_timeline.desc': 'Model savings targets, project milestone completion dates, and simulate simultaneous goals.',
    'mod.emergency_cushion': 'Emergency Cushion',
    'mod.emergency_cushion.desc': 'Dynamically connected to your actual monthly spending burn-rate with adjustable runway cushions.',
    'mod.debt_watchdog': 'EMI / Debt Watchdog',
    'mod.debt_watchdog.desc': 'Track credit card obligations, loan repayment schedules, and minimize interest costs.',
    'mod.credit_health': 'Credit Health',
    'mod.credit_health.desc': 'Monitor credit utilization ratios, credit card balances, and payment discipline.',
    'mod.financial_health': 'Integrated Financial Health',
    'mod.financial_health.desc': 'Holistic financial score with plain-English insights, actionable diagnostics, and detail expansion.',

    // Actions & Labels
    'action.import_statement': 'Import Statement',
    'action.add_transaction': 'Add Transaction',
    'action.filter_account': 'Filter by Account',
    'action.filter_type': 'Filter by Type',
    'action.all_accounts': 'All Accounts',
    'action.all_types': 'All Types',
    'action.income': 'Income',
    'action.expense': 'Expense',
    'action.transfer': 'Transfer',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.reset': 'Reset',
    'action.close': 'Close',

    // Landing Hero
    'hero.badge': 'Next-Gen Personal Finance Engine',
    'hero.title_part1': 'A financial ledger you can',
    'hero.title_part2': 'finally trust.',
    'hero.desc': 'Every transaction verified, every paisa accounted for, and zero floating-point drift. Complete sovereignty over your money and wealth architecture.',
    'hero.explore_modules': 'Explore All 12 Modules',
    'hero.test_ledger': 'Test Verified Ledger',
  },
  hi: {
    // Nav & Common
    'nav.home': '12-मॉड्यूल होम',
    'nav.ledger': 'खाता बही',
    'nav.budgets': 'बजट',
    'nav.comparison': 'तुलना',
    'nav.simulator': 'लक्ष्य सिम्युलेटर',
    'nav.faq': 'अक्सर पूछे जाने वाले प्रश्न',
    'nav.signin': 'साइन इन',
    'nav.getstarted': 'शुरुआत करें',
    'nav.modules': 'मॉड्यूल',
    'nav.signout': 'साइन आउट',
    'nav.demo': '1-क्लिक डेमो',

    // Modules
    'mod.expense_tracking': 'व्यय ट्रैकिंग (Expense Tracking)',
    'mod.expense_tracking.desc': 'लेन-देन दर्ज करें, सटीक श्रेणियों में बांटें और बिना किसी गलती के अपने कैश फ्लो की निगरानी करें।',
    'mod.daily_budgeting': 'दैनिक बजट (Daily Budgeting)',
    'mod.daily_budgeting.desc': 'हर श्रेणी के लिए खर्च सीमा तय करें, योजना की तुलना वास्तविक खर्च से करें और बचत सुरक्षित रखें।',
    'mod.splitter': 'खर्चा विभाजक (Expense Splitter)',
    'mod.splitter.desc': 'दोस्तों या परिवार के साथ खर्च बांटें, सही हिसाब लगाएं और आसानी से निपटारा ट्रैक करें।',
    'mod.pre_spend_check': 'खर्च पूर्व जांच (Pre-Spend Check)',
    'mod.pre_spend_check.desc': 'कोई भी बड़ा सामान खरीदने से पहले जांचें कि इसका आपके मासिक बजट पर क्या असर पड़ेगा।',
    'mod.spend_leak_detector': 'अवांछित खर्च डिटेक्टर (Spend Leak Detector)',
    'mod.spend_leak_detector.desc': 'बिना इस्तेमाल वाले ऐप्स और सब्सक्रिप्शन को पहचानें और उन्हें रद्द करके तुरंत पैसे बचाएं।',
    'mod.money_guides': 'वित्तीय मार्गदर्शिका (Money Guides)',
    'mod.money_guides.desc': 'सरल और व्यावहारिक नियम सीखें: ऑनलाइन घोटालों से बचाव, 50-30-20 नियम और सुरक्षित बचत।',
    'mod.net_worth': 'कुल संपत्ति (Net Worth Architecture)',
    'mod.net_worth.desc': 'बैंक खातों, बचत और ऋण को जोड़कर अपनी वास्तविक कुल संपत्ति की स्पष्ट स्थिति देखें।',
    'mod.goal_timeline': 'लक्ष्य समयरेखा (Goal Timeline Simulator)',
    'mod.goal_timeline.desc': 'अपने वित्तीय लक्ष्यों को तय करें और देखें कि बचत बढ़ाकर वे कब तक पूरे हो सकते हैं।',
    'mod.emergency_cushion': 'आपातकालीन फंड (Emergency Cushion)',
    'mod.emergency_cushion.desc': 'आपके वास्तविक मासिक खर्च से जुड़ा सुरक्षा फंड, ताकि किसी भी अप्रत्याशित संकट में आप बेफिक्र रहें।',
    'mod.debt_watchdog': 'ईएमआई / ऋण प्रहरी (Debt Watchdog)',
    'mod.debt_watchdog.desc': 'क्रेडिट कार्ड बिल और किश्तों की समय पर अदायगी सुनिश्चित करें और भारी ब्याज से बचें।',
    'mod.credit_health': 'क्रेडिट स्वास्थ्य (Credit Health)',
    'mod.credit_health.desc': 'क्रेडिट कार्ड सीमा का सुरक्षित अनुपात (30% के भीतर) बनाए रखें और अपना वित्तीय स्कोर सुधारें।',
    'mod.financial_health': 'समग्र वित्तीय स्वास्थ्य (Financial Health)',
    'mod.financial_health.desc': 'सरल भाषा में आपके पूरे वित्तीय जीवन का समग्र स्कोर और विस्तृत विश्लेषण।',

    // Actions & Labels
    'action.import_statement': 'स्टेटमेंट आयात करें',
    'action.add_transaction': 'लेन-देन जोड़ें',
    'action.filter_account': 'खाते के अनुसार फिल्टर',
    'action.filter_type': 'प्रकार के अनुसार फिल्टर',
    'action.all_accounts': 'सभी खाते',
    'action.all_types': 'सभी प्रकार',
    'action.income': 'आय (Income)',
    'action.expense': 'खर्च (Expense)',
    'action.transfer': 'स्थानांतरण (Transfer)',
    'action.save': 'सहेजें',
    'action.cancel': 'रद्द करें',
    'action.reset': 'रीसेट',
    'action.close': 'बंद करें',

    // Landing Hero
    'hero.badge': 'अगली पीढ़ी का वित्तीय प्रबंधन इंजन',
    'hero.title_part1': 'एक ऐसा वित्तीय खाता बही जिस पर आप',
    'hero.title_part2': 'पूरी तरह भरोसा कर सकते हैं।',
    'hero.desc': 'पाई-पाई का सटीक हिसाब, हर लेन-देन सुरक्षित, और बिना किसी तकनीकी विसंगति के आपकी कुल संपत्ति का संरक्षण।',
    'hero.explore_modules': 'सभी 12 मॉड्यूल देखें',
    'hero.test_ledger': 'सत्यापित खाता जांचें',
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('finroq_lang') as Language;
      if (saved === 'en' || saved === 'hi') {
        setLanguageState(saved);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('finroq_lang', lang);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const t = (key: string, fallback?: string): string => {
    return translations[language][key] || translations['en'][key] || fallback || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
