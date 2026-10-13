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
    'nav.ai_insights': 'AI Insights',
    'nav.switch_module': 'Switch Module:',

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
    'hero.title_part1': 'Master your wealth,',
    'hero.title_part2': 'with absolute precision.',
    'hero.desc': 'Finroq is an enterprise-grade financial ledger engineered with exact decimal arithmetic. Gain complete command over cash flow, dynamic category budgets, and net worth trajectory with zero guesswork.',
    'hero.open_ledger': 'Open your ledger',
    'hero.explore_demo': 'Explore interactive demo',
    'hero.net_worth': 'Consolidated Net Worth',
    'hero.live_state': 'Live Ledger State',
    'hero.liquid_assets': 'Liquid Assets',
    'hero.active_liabilities': 'Active Liabilities',
    'hero.decimal_note': 'Every calculation is backed by exact fixed-point decimal arithmetic, eliminating IEEE 754 floating-point drift.',

    // Proof Strip
    'proof.numeric': 'NUMERIC(14,2) DECIMAL LEDGER',
    'proof.argon': 'ARGON2ID ENCRYPTION',
    'proof.isolation': 'ZERO-TRUST TENANT ISOLATION',
    'proof.recurrence': 'DETERMINISTIC RECURRENCE ENGINE',

    // Feature 1
    'feat1.badge': 'Feature One',
    'feat1.title': 'A ledger that always balances.',
    'feat1.desc': 'Only completed transactions alter your liquid balance. Pending charges and transfers stay segregated, ensuring income and expenditure metrics are never artificially distorted.',
    'feat1.exact_math': 'Exact Math',
    'feat1.exact_math_desc': 'Decimal arithmetic end to end, ensuring your totals balance with zero rounding drift.',
    'feat1.transfers': 'Transfers',
    'feat1.transfers_desc': 'Transfer funds between accounts neutrally without bloating monthly revenue.',
    'feat1.realtime': 'Real-Time',
    'feat1.realtime_desc': 'True net worth derived continuously across checking, savings, and credit balances.',
    'feat1.oct_records': 'October Ledger Records',
    'feat1.sandbox': 'Interactive sandbox demonstration',
    'feat1.cycle_chip': 'Tap status chip to cycle',
    'feat1.net_cash_flow': 'Net Liquid Cash Flow',
    'feat1.completed_only': 'Calculated exclusively on completed transactions',

    // Feature 2
    'feat2.badge': 'Feature Two',
    'feat2.title': 'Budgets that monitor themselves.',
    'feat2.desc': 'No manual receipt spreadsheets or end-of-month regret. FINROQ watches your spending velocity in real-time, warning you before limits are broken and rebalancing surpluses automatically.',
    'feat2.live_alloc': 'Live Category Allocations',
    'feat2.guardian': 'Autonomous Guardian',
    'feat2.realtime_sync': 'Real-Time Sync',
    'feat2.realtime_sync_desc': 'Every card swipe, UPI transfer, and bank debit categorizes instantly. Zero manual logging.',
    'feat2.burn_alerts': 'Burn Alerts',
    'feat2.burn_alerts_desc': 'Proactive velocity warnings flag categories running hot weeks before the month ends.',
    'feat2.auto_rebalance': 'Auto-Rebalance',
    'feat2.auto_rebalance_desc': 'When you spend more on dining, FINROQ absorbs it from under-budget surplus without denting your savings.',

    // Feature 3
    'feat3.badge': 'Interactive Simulation',
    'feat3.title': 'Dynamic Budget Stress-Testing.',
    'feat3.desc': 'Compare your intended caps with actual expenditures. Adjust the sliders to examine immediate category health responses in real time.',

    // Feature 4
    'feat4.badge': 'Timeline Accelerator',
    'feat4.title': 'Simulate How Spending Shifts Accelerate Wealth.',
    'feat4.desc': 'Model your timeline to critical savings milestones. Adjust monthly contributions and watch how trimming discretionary leaks brings goals forward.',

    // FAQs
    'faq.badge': 'Frequently Asked Questions',
    'faq.title': 'Everything you need to know.',
    'faq.desc': 'Clear answers regarding our double-entry architecture, decimal math precision, privacy, and deterministic intelligence.',

    // Closer CTA
    'cta.title': 'Open your ledger.',
    'cta.desc': 'Start recording transactions, set intelligent category budgets, and understand your financial trajectory with uncompromising certainty.',

    // Auth
    'auth.welcome_back': 'Welcome back.',
    'auth.start_ledger': 'Start your ledger.',
    'auth.signin_subtitle': 'Sign in to see where you stand this month.',
    'auth.signup_subtitle': 'Create an account to bring your budgets and goals together.',
    'auth.continue_google': 'Continue with Google',
    'auth.or_signin': 'Or sign in with',
    'auth.email_password': 'Email & Password',
    'auth.mobile_otp': 'Mobile Number (OTP)',
    'auth.email_label': 'Email Address',
    'auth.password_label': 'Password',
    'auth.name_label': 'Full Name',
    'auth.send_otp': 'Send OTP via SMS',
    'auth.verify_continue': 'Verify & Continue',
    'auth.sign_in': 'Sign in',
    'auth.create_account': 'Create account',
    'auth.demo_account': 'Use the verified instant demo account (demo@finroq.com)',

    // Common
    'common.back_home': 'Back to home',
    'common.sign_out': 'Sign out',
    'common.open_module': 'Open module',
    'common.workspace': 'Workspace',
    'common.welcome_back': 'Welcome back',
    'common.choose_today': 'Choose what you want to work on today.',
    'common.financial_workspace': 'Financial Workspace',
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
    'nav.ai_insights': 'एआई इनसाइट्स',
    'nav.switch_module': 'मॉड्यूल बदलें:',

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
    'hero.title_part1': 'अपनी संपत्ति पर पाएं पूर्ण नियंत्रण,',
    'hero.title_part2': 'पूर्ण सटीकता और विश्वास के साथ।',
    'hero.desc': 'फिनरॉक (Finroq) एक उद्यम-स्तरीय वित्तीय लेजर है जो निश्चित दशमलव अंकगणित के साथ तैयार किया गया है। अपने कैश फ्लो, बजट और कुल संपत्ति पर पूरा नियंत्रण पाएं बिना किसी अनुमान के।',
    'hero.open_ledger': 'अपना खाता बही खोलें',
    'hero.explore_demo': 'इंटरैक्टिव डेमो देखें',
    'hero.net_worth': 'कुल संचित संपत्ति',
    'hero.live_state': 'सत्यापित लेजर स्थिति',
    'hero.liquid_assets': 'तरल संपत्ति',
    'hero.active_liabilities': 'सक्रिय देनदारियां',
    'hero.decimal_note': 'प्रत्येक गणना निश्चित दशमलव अंकगणित पर आधारित है, जिससे फ्लोटिंग-पॉइंट की त्रुटि पूरी तरह समाप्त हो जाती है।',

    // Proof Strip
    'proof.numeric': 'NUMERIC(14,2) दशमलव लेजर',
    'proof.argon': 'ARGON2ID क्रिप्टोग्राफिक सुरक्षा',
    'proof.isolation': 'जीरो-ट्रस्ट व्यक्तिगत डेटा सुरक्षा',
    'proof.recurrence': 'निश्चयात्मक आवर्ती नियम इंजन',

    // Feature 1
    'feat1.badge': 'पहला फीचर',
    'feat1.title': 'एक ऐसा खाता बही जो हमेशा संतुलित रहता है।',
    'feat1.desc': 'केवल पूर्ण लेन-देन ही आपके खाते की शेष राशि को प्रभावित करते हैं। लंबित भुगतान और ट्रांसफर अलग रहते हैं, ताकि आय और व्यय के आंकड़े कभी गलत न दिखें।',
    'feat1.exact_math': 'सटीक गणित',
    'feat1.exact_math_desc': 'शुरुआत से अंत तक दशमलव अंकगणित, जिससे शून्य राउंडिंग अंतर सुनिश्चित होता है।',
    'feat1.transfers': 'स्थानांतरण',
    'feat1.transfers_desc': 'मासिक आय को कृत्रिम रूप से बढ़ाए बिना खातों के बीच तटस्थ रूप से फंड ट्रांसफर करें।',
    'feat1.realtime': 'रियल-टाइम',
    'feat1.realtime_desc': 'बचत, चालू और क्रेडिट शेष राशि के आधार पर वास्तविक कुल संपत्ति की निरंतर गणना।',
    'feat1.oct_records': 'अक्टूबर लेजर रिकॉर्ड्स',
    'feat1.sandbox': 'इंटरैक्टिव सैंडबॉक्स डेमो',
    'feat1.cycle_chip': 'स्थिति बदलने के लिए चिप पर टैप करें',
    'feat1.net_cash_flow': 'शुद्ध तरल कैश फ्लो',
    'feat1.completed_only': 'केवल पूर्ण लेन-देन पर गणना की गई',

    // Feature 2
    'feat2.badge': 'दूसरा फीचर',
    'feat2.title': 'बजट जो खुद अपनी निगरानी करते हैं।',
    'feat2.desc': 'रसीदों के स्प्रेडशीट संभालने और महीने के अंत के पछतावे से छुटकारा। फिनरॉक आपके खर्च की गति पर नजर रखता है और सीमा टूटने से पहले चेतावनी देता है।',
    'feat2.live_alloc': 'सक्रिय श्रेणी आवंटन',
    'feat2.guardian': 'स्वायत्त सुरक्षा प्रहरी',
    'feat2.realtime_sync': 'रियल-टाइम सिंक',
    'feat2.realtime_sync_desc': 'हर कार्ड स्वाइप, यूपीआई और बैंक डेबिट तुरंत सही श्रेणी में दर्ज होता है।',
    'feat2.burn_alerts': 'खर्च अलर्ट',
    'feat2.burn_alerts_desc': 'महीना खत्म होने से पहले ही अधिक खर्च वाली श्रेणियों के लिए पूर्व चेतावनी।',
    'feat2.auto_rebalance': 'ऑटो-रीबैलेंस',
    'feat2.auto_rebalance_desc': 'जब आप डाइनिंग पर अधिक खर्च करते हैं, तो फिनरॉक दूसरी श्रेणियों के अतिरिक्त सरप्लस से इसे स्वतः संतुलित कर देता है।',

    // Feature 3
    'feat3.badge': 'इंटरैक्टिव सिमुलेशन',
    'feat3.title': 'डायनामिक बजट स्ट्रेस-टेस्टिंग।',
    'feat3.desc': 'अपने निर्धारित बजट की वास्तविक खर्चों से तुलना करें। स्लाइडर को खिसकाकर वास्तविक समय में श्रेणी स्वास्थ्य जांचें।',

    // Feature 4
    'feat4.badge': 'समयरेखा त्वरक',
    'feat4.title': 'देखें कि खर्च में सुधार से बचत का लक्ष्य कैसे जल्दी पूरा होता है।',
    'feat4.desc': 'अपने वित्तीय लक्ष्यों की समयरेखा तैयार करें। मासिक योगदान बढ़ाएं और देखें कि अवांछित खर्चों को रोककर लक्ष्य कितने महीने पहले हासिल हो सकता है।',

    // FAQs
    'faq.badge': 'अक्सर पूछे जाने वाले प्रश्न',
    'faq.title': 'सब कुछ जो आपको जानना आवश्यक है।',
    'faq.desc': 'हमारे डबल-एंट्री लेजर, दशमलव गणितीय सटीकता, गोपनीयता और स्वायत्त वित्तीय प्रणाली से जुड़े स्पष्ट उत्तर।',

    // Closer CTA
    'cta.title': 'अपना खाता बही खोलें।',
    'cta.desc': 'लेन-देन दर्ज करना शुरू करें, बुद्धिमत्तापूर्ण बजट बनाएं और पूर्ण विश्वास के साथ अपनी संपत्ति का निर्माण करें।',

    // Auth
    'auth.welcome_back': 'वापसी पर स्वागत है।',
    'auth.start_ledger': 'अपना खाता बही शुरू करें।',
    'auth.signin_subtitle': 'इस महीने अपनी स्थिति देखने के लिए साइन इन करें।',
    'auth.signup_subtitle': 'अपने बजट और लक्ष्यों को एक साथ लाने के लिए खाता बनाएं।',
    'auth.continue_google': 'Google से जारी रखें',
    'auth.or_signin': 'या इससे साइन इन करें',
    'auth.email_password': 'ईमेल और पासवर्ड',
    'auth.mobile_otp': 'मोबाइल नंबर (OTP)',
    'auth.email_label': 'ईमेल पता',
    'auth.password_label': 'पासवर्ड',
    'auth.name_label': 'पूरा नाम',
    'auth.send_otp': 'SMS से OTP भेजें',
    'auth.verify_continue': 'सत्यापित करें और जारी रखें',
    'auth.sign_in': 'साइन इन करें',
    'auth.create_account': 'खाता बनाएं',
    'auth.demo_account': 'सत्यापित डेमो खाता उपयोग करें (demo@finroq.com)',

    // Common
    'common.back_home': 'होम पर वापस जाएं',
    'common.sign_out': 'साइन आउट',
    'common.open_module': 'मॉड्यूल खोलें',
    'common.workspace': 'वर्कस्पेस',
    'common.welcome_back': 'वापसी पर स्वागत है',
    'common.choose_today': 'आज क्या करना चाहते हैं, चुनें।',
    'common.financial_workspace': 'वित्तीय कार्यक्षेत्र',
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
      try {
        localStorage.setItem('finroq_lang', lang);
      } catch {}
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || fallback || key;
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
