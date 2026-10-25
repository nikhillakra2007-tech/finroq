'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ALL_TRANSLATIONS } from './i18n-dictionary';
import { SECTION_TRANSLATIONS } from './i18n-sections';
import { LANDING_TRANSLATIONS } from './i18n-landing';
import { FLAGSHIP_TRANSLATIONS, applyAutomaticLanguageRule } from './i18n-flagship';

export type Language =
  | 'en' // English
  | 'hi' // हिन्दी (Hindi)
  | 'es' // Español (Spanish)
  | 'fr' // Français (French)
  | 'de' // Deutsch (German)
  | 'zh' // 中文 (Mandarin Chinese)
  | 'ja' // 日本語 (Japanese)
  | 'ar' // العربية (Arabic)
  | 'bn' // বাংলা (Bengali)
  | 'pt' // Português (Portuguese)
  | 'ru' // Русский (Russian)
  | 'it' // Italiano (Italian)
  | 'ko' // 한국어 (Korean)
  | 'ta' // தமிழ் (Tamil)
  | 'te' // తెలుగు (Telugu)
  | 'mr' // मराठी (Marathi)
  | 'gu' // ગુજરાતી (Gujarati)
  | 'kn'; // ಕನ್ನಡ (Kannada)

export interface LanguageMeta {
  code: Language;
  badge: string;
  name: string;
  nativeName: string;
  flag?: string;
  speechLocale: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', badge: 'EN', name: 'English', nativeName: 'English', flag: 'EN', speechLocale: 'en-US' },
  { code: 'hi', badge: 'HI', name: 'Hindi', nativeName: 'हिन्दी', flag: 'HI', speechLocale: 'hi-IN' },
  { code: 'es', badge: 'ES', name: 'Spanish', nativeName: 'Español', flag: 'ES', speechLocale: 'es-ES' },
  { code: 'fr', badge: 'FR', name: 'French', nativeName: 'Français', flag: 'FR', speechLocale: 'fr-FR' },
  { code: 'de', badge: 'DE', name: 'German', nativeName: 'Deutsch', flag: 'DE', speechLocale: 'de-DE' },
  { code: 'zh', badge: 'ZH', name: 'Chinese', nativeName: '中文', flag: 'ZH', speechLocale: 'zh-CN' },
  { code: 'ja', badge: 'JA', name: 'Japanese', nativeName: '日本語', flag: 'JA', speechLocale: 'ja-JP' },
  { code: 'ar', badge: 'AR', name: 'Arabic', nativeName: 'العربية', flag: 'AR', speechLocale: 'ar-SA' },
  { code: 'bn', badge: 'BN', name: 'Bengali', nativeName: 'বাংলা', flag: 'BN', speechLocale: 'bn-IN' },
  { code: 'pt', badge: 'PT', name: 'Portuguese', nativeName: 'Português', flag: 'PT', speechLocale: 'pt-BR' },
  { code: 'ru', badge: 'RU', name: 'Russian', nativeName: 'Русский', flag: 'RU', speechLocale: 'ru-RU' },
  { code: 'it', badge: 'IT', name: 'Italian', nativeName: 'Italiano', flag: 'IT', speechLocale: 'it-IT' },
  { code: 'ko', badge: 'KO', name: 'Korean', nativeName: '한국어', flag: 'KO', speechLocale: 'ko-KR' },
  { code: 'ta', badge: 'TA', name: 'Tamil', nativeName: 'தமிழ்', flag: 'TA', speechLocale: 'ta-IN' },
  { code: 'te', badge: 'TE', name: 'Telugu', nativeName: 'తెలుగు', flag: 'TE', speechLocale: 'te-IN' },
  { code: 'mr', badge: 'MR', name: 'Marathi', nativeName: 'मराठी', flag: 'MR', speechLocale: 'mr-IN' },
  { code: 'gu', badge: 'GU', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: 'GU', speechLocale: 'gu-IN' },
  { code: 'kn', badge: 'KN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: 'KN', speechLocale: 'kn-IN' },
];

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  activeLanguageMeta: LanguageMeta;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
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
    'nav.ai_insights': 'Finroq AI',
    'nav.switch_module': 'Select Feature:',

    'mod.ai_assistant': 'Finroq AI',
    'mod.expense_tracking': 'Expense Tracking',
    'mod.expense_tracking.desc': 'Record and categorize transactions, monitor statuses, and review completed cash flow.',
    'mod.daily_budgeting': 'Budgeting',
    'mod.daily_budgeting.desc': 'Set category spending caps, compare plans with actual expenses, and monitor cushions.',
    'mod.splitter': 'Splitter',
    'mod.splitter.desc': 'Divide shared expenses, calculate exact equal or custom shares, and track settlements.',
    'mod.pre_spend_check': 'Pre-Spend Check',
    'mod.pre_spend_check.desc': 'Estimate the effect of a planned purchase on remaining budget before spending.',
    'mod.spend_leak_detector': 'Spend Leak Detector',
    'mod.spend_leak_detector.desc': 'Identify recurring subscriptions, auto-debits, and potential spend leaks from ledger history.',
    'mod.money_guides': 'Money Guides',
    'mod.money_guides.desc': 'Explore practical financial frameworks, emergency ratios, and allocation blueprints.',
    'mod.net_worth': 'Net Worth',
    'mod.net_worth.desc': 'Track assets minus liabilities across checking, savings, and credit accounts.',
    'mod.goal_timeline': 'Goal Simulator',
    'mod.goal_timeline.desc': 'Model savings targets, project milestone completion dates, and simulate simultaneous goals.',
    'mod.emergency_cushion': 'Emergency Cushion',
    'mod.emergency_cushion.desc': 'Dynamically connected to your actual monthly spending burn-rate with adjustable runway cushions.',
    'mod.debt_watchdog': 'Debt Watchdog',
    'mod.debt_watchdog.desc': 'Track credit card obligations, loan repayment schedules, and minimize interest costs.',
    'mod.credit_health': 'Credit Health',
    'mod.credit_health.desc': 'Monitor credit utilization ratios, credit card balances, and payment discipline.',
    'mod.financial_health': 'Financial Health',
    'mod.financial_health.desc': 'Holistic financial score with plain-English insights, actionable diagnostics, and detail expansion.',
    'mod.crash_test': 'Crash-Test / Agentic Run',
    'mod.crash_test.desc': 'Stress-test finances against severe real-world shocks, model compound scenarios, and verify mathematical recovery plans.',
    'mod.multiverse': '30-Year Wealth Forecast',
    'mod.multiverse.desc': 'Simulate parallel life timelines, project 30-year wealth trajectories, and compare financial options.',
    'mod.investments': 'Youth Investments & IPO Predictions',
    'mod.investments.desc': 'Curated mutual funds, live IPO listing gain predictions, and compounding proof for youth.',
    'cat.wealth_planning': 'Wealth & Planning',

    'cat.track_control': 'Track & Control',
    'cat.decide_before': 'Decide Before Spending',
    'cat.build_protect': 'Build & Protect',
    'cat.manage_obligations': 'Manage Obligations',
    'cat.stress_resilience': 'Stress Testing & Resilience',
    'cat.financial_resilience': 'Financial Resilience',
    'cat.autonomous_intelligence': 'Autonomous Intelligence',
    'common.all_features': 'All 17 Financial Engines',
    'common.all_13_features': 'All 17 Financial Engines',
    'common.all_17_features': 'All 17 Financial Engines',
    'footer.authoritative': 'Authoritative Financial Engine',

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

    'hero.badge': 'Next-Gen Personal Finance Engine',
    'hero.title_part1': 'Master your wealth,',
    'hero.title_part2': 'with absolute precision.',
    'hero.desc': 'Finroq is an enterprise-grade financial ledger engineered with exact decimal arithmetic. Gain complete command over cash flow, dynamic category budgets, and net worth trajectory with zero guesswork.',
    'hero.open_ledger': 'Open your ledger',
    'hero.explore_demo': 'Explore interactive demo',

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

    'common.back_home': 'Back to home',
    'common.sign_out': 'Sign out',
    'common.open_module': 'Open module',
    'common.workspace': 'Workspace',
    'common.welcome_back': 'Welcome back',
    'common.choose_today': 'Choose what you want to work on today.',
    'common.financial_workspace': 'Financial Workspace',

    'chat.title': 'Finroq AI',
    'chat.tagline': 'Your finances, understood.',
    'chat.guest_tagline': 'Ask about Finroq features, security, or how our math protects your wealth.',
    'chat.placeholder': 'Type or speak your financial question...',
    'chat.listening': 'Listening... Speak your financial query',
    'chat.new_chat': 'New Chat',
    'chat.minimize': 'Minimize',
    'chat.q1': 'Analyze my spending this month',
    'chat.q2': 'Where can I save more?',
    'chat.q3': 'Can I afford a ₹15,000 purchase?',
    'chat.q4': 'What bills are coming up?',
  },
  hi: {
    'nav.home': '12-मॉड्यूल होम',
    'nav.ledger': 'खाता बही',
    'nav.budgets': 'बजट',
    'nav.comparison': 'तुलना',
    'nav.simulator': 'लक्ष्य सिम्युलेटर',
    'nav.faq': 'सामान्य प्रश्न',
    'nav.signin': 'साइन इन',
    'nav.getstarted': 'शुरुआत करें',
    'nav.modules': 'मॉड्यूल',
    'nav.signout': 'साइन आउट',
    'nav.demo': '1-क्लिक डेमो',
    'nav.ai_insights': 'फिनरॉक एआई',
    'nav.switch_module': 'फीचर चुनें:',

    'mod.ai_assistant': 'फिनरॉक एआई',
    'mod.expense_tracking': 'व्यय ट्रैकिंग',
    'mod.expense_tracking.desc': 'लेन-देन दर्ज करें, सटीक श्रेणियों में बांटें और बिना किसी गलती के अपने कैश फ्लो की निगरानी करें।',
    'mod.daily_budgeting': 'दैनिक बजट',
    'mod.daily_budgeting.desc': 'हर श्रेणी के लिए खर्च सीमा तय करें, योजना की तुलना वास्तविक खर्च से करें और बचत सुरक्षित रखें।',
    'mod.splitter': 'खर्चा विभाजक',
    'mod.splitter.desc': 'दोस्तों या परिवार के साथ खर्च बांटें, सही हिसाब लगाएं और आसानी से निपटारा ट्रैक करें।',
    'mod.pre_spend_check': 'खर्च पूर्व जांच',
    'mod.pre_spend_check.desc': 'कोई भी सामान खरीदने से पहले जांचें कि इसका आपके मासिक बजट पर क्या असर पड़ेगा।',
    'mod.spend_leak_detector': 'अवांछित खर्च डिटेक्टर',
    'mod.spend_leak_detector.desc': 'बिना इस्तेमाल वाले ऐप्स और सब्सक्रिप्शन को पहचानें और उन्हें रद्द करके तुरंत पैसे बचाएं।',
    'mod.money_guides': 'वित्तीय मार्गदर्शिका',
    'mod.money_guides.desc': 'सरल और व्यावहारिक नियम सीखें: 50-30-20 नियम और सुरक्षित बचत आदतें।',
    'mod.net_worth': 'कुल संपत्ति',
    'mod.net_worth.desc': 'बैंक खातों, बचत और ऋण को जोड़कर अपनी वास्तविक कुल संपत्ति की स्पष्ट स्थिति देखें।',
    'mod.goal_timeline': 'लक्ष्य सिम्युलेटर',
    'mod.goal_timeline.desc': 'अपने वित्तीय लक्ष्यों को तय करें और देखें कि बचत बढ़ाकर वे कब तक पूरे हो सकते हैं।',
    'mod.emergency_cushion': 'आपातकालीन फंड',
    'mod.emergency_cushion.desc': 'आपके वास्तविक मासिक खर्च से जुड़ा सुरक्षा फंड, ताकि किसी संकट में आप निश्चिंत रहें।',
    'mod.debt_watchdog': 'ईएमआई / ऋण प्रहरी',
    'mod.debt_watchdog.desc': 'क्रेडिट कार्ड बिल और किश्तों की समय पर अदायगी सुनिश्चित करें और भारी ब्याज से बचें।',
    'mod.credit_health': 'क्रेडिट स्वास्थ्य',
    'mod.credit_health.desc': 'क्रेडिट कार्ड सीमा का सुरक्षित अनुपात बनाए रखें और अपना वित्तीय स्कोर सुधारें।',
    'mod.financial_health': 'वित्तीय स्वास्थ्य',
    'mod.financial_health.desc': 'सरल भाषा में आपके पूरे वित्तीय जीवन का समग्र स्कोर और विस्तृत विश्लेषण।',
    'mod.crash_test': 'क्रैश-टेस्ट / एजेंटिक रन',
    'mod.crash_test.desc': 'प्रतिकूल वित्तीय झटकों के खिलाफ तनाव-परीक्षण, संयुक्त परिदृश्यों का विश्लेषण और सत्यापन।',

    'cat.track_control': 'ट्रैक व नियंत्रण',
    'cat.decide_before': 'खर्च से पूर्व निर्णय',
    'cat.build_protect': 'सृजन व सुरक्षा',
    'cat.manage_obligations': 'देनदारियों का प्रबंधन',
    'cat.stress_resilience': 'तनाव परीक्षण व लचीलापन',
    'cat.financial_resilience': 'वित्तीय लचीलापन',
    'cat.autonomous_intelligence': 'स्वायत्त विश्लेषण',
    'common.all_features': 'सभी 17 वित्तीय इंजन',
    'common.all_13_features': 'सभी 17 वित्तीय इंजन',
    'common.all_17_features': 'सभी 17 वित्तीय इंजन',
    'footer.authoritative': 'प्रामाणिक वित्तीय इंजन',

    'action.import_statement': 'स्टेटमेंट आयात करें',
    'action.add_transaction': 'लेन-देन जोड़ें',
    'action.filter_account': 'खाते के अनुसार',
    'action.filter_type': 'प्रकार के अनुसार',
    'action.all_accounts': 'सभी खाते',
    'action.all_types': 'सभी प्रकार',
    'action.income': 'आय',
    'action.expense': 'खर्च',
    'action.transfer': 'स्थानांतरण',
    'action.save': 'सहेजें',
    'action.cancel': 'रद्द करें',
    'action.reset': 'रीसेट',
    'action.close': 'बंद करें',

    'hero.badge': 'अगली पीढ़ी का वित्तीय इंजन',
    'hero.title_part1': 'अपनी संपत्ति पर नियंत्रण रखें,',
    'hero.title_part2': 'पूर्ण सटीकता के साथ।',
    'hero.desc': 'फिनरॉक सटीक दशमलव अंकगणित के साथ तैयार किया गया वित्तीय बहीखाता है। बिना किसी अनुमान के अपनी संपत्ति और बजट का सही हिसाब पाएं।',
    'hero.open_ledger': 'खाता बही खोलें',
    'hero.explore_demo': 'इंटरैक्टिव डेमो देखें',

    'auth.welcome_back': 'वापसी पर स्वागत है।',
    'auth.start_ledger': 'अपना खाता बही शुरू करें।',
    'auth.signin_subtitle': 'इस महीने अपनी वित्तीय स्थिति देखने के लिए साइन इन करें।',
    'auth.signup_subtitle': 'अपने बजट और लक्ष्यों को एक साथ लाने के लिए खाता बनाएं।',
    'auth.continue_google': 'Google से जारी रखें',
    'auth.or_signin': 'या इससे साइन इन करें',
    'auth.email_password': 'ईमेल और पासवर्ड',
    'auth.mobile_otp': 'मोबाइल नंबर (OTP)',
    'auth.email_label': 'ईमेल पता',
    'auth.password_label': 'पासवर्ड',
    'auth.name_label': 'पूरा नाम',
    'auth.send_otp': 'SMS द्वारा OTP भेजें',
    'auth.verify_continue': 'सत्यापित करें और आगे बढ़ें',
    'auth.sign_in': 'साइन इन करें',
    'auth.create_account': 'खाता बनाएं',
    'auth.demo_account': 'त्वरित डेमो खाता उपयोग करें (demo@finroq.com)',

    'common.back_home': 'होम पर वापस जाएं',
    'common.sign_out': 'साइन आउट',
    'common.open_module': 'मॉड्यूल खोलें',
    'common.workspace': 'कार्यक्षेत्र',
    'common.welcome_back': 'स्वागत है',
    'common.choose_today': 'चुनें कि आज आप किस पर काम करना चाहते हैं।',
    'common.financial_workspace': 'वित्तीय कार्यक्षेत्र',

    'chat.title': 'फिनरॉक एआई',
    'chat.tagline': 'आपका वित्तीय साथी, सरल और सटीक।',
    'chat.guest_tagline': 'फिनरॉक की सुविधाओं, 12 मॉड्यूल या सुरक्षा के बारे में पूछें।',
    'chat.placeholder': 'अपना वित्तीय प्रश्न लिखें या बोलें...',
    'chat.listening': 'सुन रहा हूँ... बोलिए',
    'chat.new_chat': 'नई बातचीत',
    'chat.minimize': 'छोटा करें',
    'chat.q1': 'इस महीने का मेरा खर्च विश्लेषण करें',
    'chat.q2': 'मैं और बचत कहाँ कर सकता हूँ?',
    'chat.q3': 'क्या मैं ₹15,000 की खरीदारी कर सकता हूँ?',
    'chat.q4': 'कौन से बिल आने वाले हैं?',
  },
  es: {
    'nav.home': 'Inicio 12 Módulos',
    'nav.ledger': 'Libro Contable',
    'nav.budgets': 'Presupuestos',
    'nav.amount_lab': 'Lab de Importes',
    'nav.comparison': 'Comparación',
    'nav.simulator': 'Simulador de Metas',
    'nav.faq': 'FAQ',
    'nav.signin': 'Iniciar sesión',
    'nav.getstarted': 'Comenzar',
    'nav.modules': 'Módulos',
    'nav.signout': 'Cerrar sesión',
    'nav.demo': 'Demo en 1 Clic',
    'nav.ai_insights': 'Finroq IA',
    'nav.switch_module': 'Seleccionar función:',

    'mod.ai_assistant': 'Finroq IA',
    'mod.expense_tracking': 'Control de Gastos',
    'mod.daily_budgeting': 'Presupuesto Diario',
    'mod.splitter': 'División de Gastos',
    'mod.pre_spend_check': 'Verificación Pre-Gasto',
    'mod.spend_leak_detector': 'Detector de Fugas',
    'mod.money_guides': 'Guías Financieras',
    'mod.net_worth': 'Patrimonio Neto',
    'mod.goal_timeline': 'Simulador de Metas',
    'mod.emergency_cushion': 'Fondo de Emergencia',
    'mod.debt_watchdog': 'Control de Deudas',
    'mod.credit_health': 'Salud Crediticia',
    'mod.financial_health': 'Salud Financiera',

    'auth.welcome_back': 'Bienvenido de nuevo.',
    'auth.start_ledger': 'Comienza tu libro.',
    'auth.continue_google': 'Continuar con Google',
    'auth.sign_in': 'Iniciar sesión',
    'auth.create_account': 'Crear cuenta',

    'common.back_home': 'Volver al inicio',
    'common.sign_out': 'Cerrar sesión',
    'common.open_module': 'Abrir módulo',
    'common.welcome_back': 'Bienvenido de nuevo',

    'chat.title': 'Finroq IA',
    'chat.tagline': 'Tus finanzas, comprendidas con claridad.',
    'chat.placeholder': 'Escribe o habla tu consulta financiera...',
    'chat.listening': 'Escuchando... Hable ahora',
    'chat.q1': 'Analiza mis gastos de este mes',
    'chat.q2': '¿Dónde puedo ahorrar más?',
    'chat.q3': '¿Puedo permitirme una compra de ₹15,000?',
    'chat.q4': '¿Qué facturas están por vencer?',
  },
  fr: {
    'nav.home': 'Accueil 12 Modules',
    'nav.ledger': 'Grand Livre',
    'nav.budgets': 'Budgets',
    'nav.signin': 'Connexion',
    'nav.getstarted': 'Commencer',
    'nav.signout': 'Déconnexion',
    'nav.demo': 'Démo en 1 Clic',
    'nav.ai_insights': 'Finroq IA',
    'nav.switch_module': 'Choisir une fonction :',

    'mod.ai_assistant': 'Finroq IA',
    'mod.expense_tracking': 'Suivi des Dépenses',
    'mod.daily_budgeting': 'Budget Quotidien',
    'mod.splitter': 'Partage de Dépenses',
    'mod.pre_spend_check': 'Vérification Pré-Achat',
    'mod.spend_leak_detector': 'Détecteur de Fuites',
    'mod.money_guides': 'Guides Financiers',
    'mod.net_worth': 'Patrimoine Net',
    'mod.goal_timeline': 'Simulateur d\'Objectifs',
    'mod.emergency_cushion': 'Coussin d\'Urgence',
    'mod.debt_watchdog': 'Surveillance des Dettes',
    'mod.credit_health': 'Santé du Crédit',
    'mod.financial_health': 'Santé Financière',

    'auth.welcome_back': 'Bon retour parmi nous.',
    'auth.continue_google': 'Continuer avec Google',
    'auth.sign_in': 'Se connecter',
    'auth.create_account': 'Créer un compte',

    'common.back_home': 'Retour à l\'accueil',
    'common.sign_out': 'Se déconnecter',
    'common.open_module': 'Ouvrir le module',
    'common.welcome_back': 'Bienvenue',

    'chat.title': 'Finroq IA',
    'chat.tagline': 'Vos finances, enfin claires et simples.',
    'chat.placeholder': 'Tapez ou énoncez votre question...',
    'chat.listening': 'À l\'écoute... Parlez maintenant',
    'chat.q1': 'Analyser mes dépenses ce mois-ci',
    'chat.q2': 'Où puis-je économiser davantage ?',
    'chat.q3': 'Puis-je m\'offrir un achat de 15 000 ₹ ?',
    'chat.q4': 'Quelles factures arrivent à échéance ?',
  },
  de: {
    'nav.home': '12-Module Startseite',
    'nav.ledger': 'Hauptbuch',
    'nav.budgets': 'Budgets',
    'nav.signin': 'Anmelden',
    'nav.getstarted': 'Loslegen',
    'nav.signout': 'Abmelden',
    'nav.demo': '1-Klick-Demo',
    'nav.ai_insights': 'Finroq KI',
    'nav.switch_module': 'Funktion wählen:',

    'mod.ai_assistant': 'Finroq KI',
    'mod.expense_tracking': 'Ausgabenverfolgung',
    'mod.daily_budgeting': 'Tägliche Budgetierung',
    'mod.splitter': 'Ausgabenteiler',
    'mod.pre_spend_check': 'Vorabausgaben-Check',
    'mod.spend_leak_detector': 'Ausgabenleck-Detektor',
    'mod.money_guides': 'Finanzratgeber',
    'mod.net_worth': 'Nettovermögen',
    'mod.goal_timeline': 'Ziel-Simulator',
    'mod.emergency_cushion': 'Notfallpuffer',
    'mod.debt_watchdog': 'Schulden-Watchdog',
    'mod.credit_health': 'Kreditgesundheit',
    'mod.financial_health': 'Finanzielle Gesundheit',

    'auth.welcome_back': 'Willkommen zurück.',
    'auth.continue_google': 'Mit Google fortfahren',
    'auth.sign_in': 'Anmelden',
    'auth.create_account': 'Konto erstellen',

    'common.back_home': 'Zurück zur Startseite',
    'common.sign_out': 'Abmelden',
    'common.open_module': 'Modul öffnen',
    'common.welcome_back': 'Willkommen',

    'chat.title': 'Finroq KI',
    'chat.tagline': 'Ihre Finanzen, einfach und verständlich.',
    'chat.placeholder': 'Frage tippen oder sprechen...',
    'chat.listening': 'Höre zu... Jetzt sprechen',
    'chat.q1': 'Meine Ausgaben diesen Monat analysieren',
    'chat.q2': 'Wo kann ich mehr sparen?',
    'chat.q3': 'Kann ich mir einen Kauf von 15.000 ₹ leisten?',
    'chat.q4': 'Welche Rechnungen stehen an?',
  },
  zh: {
    'nav.home': '12模块主页',
    'nav.ledger': '账本',
    'nav.budgets': '预算',
    'nav.signin': '登录',
    'nav.getstarted': '立即开始',
    'nav.signout': '退出登录',
    'nav.demo': '一键演示',
    'nav.ai_insights': 'Finroq 智能AI',
    'nav.switch_module': '选择功能：',

    'mod.ai_assistant': 'Finroq 智能AI',
    'mod.expense_tracking': '支出跟踪',
    'mod.daily_budgeting': '每日预算',
    'mod.splitter': '费用分摊',
    'mod.pre_spend_check': '支出前检查',
    'mod.spend_leak_detector': '消费泄漏检测',
    'mod.money_guides': '财务指南',
    'mod.net_worth': '净资产架构',
    'mod.goal_timeline': '目标时间线模拟',
    'mod.emergency_cushion': '应急缓冲金',
    'mod.debt_watchdog': '债务监控',
    'mod.credit_health': '信用健康',
    'mod.financial_health': '综合财务评分',

    'auth.welcome_back': '欢迎回来。',
    'auth.continue_google': '使用 Google 继续',
    'auth.sign_in': '登录',
    'auth.create_account': '创建账户',

    'common.back_home': '返回主页',
    'common.sign_out': '退出',
    'common.open_module': '打开模块',
    'common.welcome_back': '欢迎回来',

    'chat.title': 'Finroq AI',
    'chat.tagline': '简单清晰，洞悉您的财务状况。',
    'chat.placeholder': '输入或语音说出您的财务问题...',
    'chat.listening': '正在聆听... 请讲话',
    'chat.q1': '分析我本月的支出',
    'chat.q2': '我可以在哪些方面省下更多钱？',
    'chat.q3': '我现在能承受 15,000 卢比的消费吗？',
    'chat.q4': '近期有哪些账单即将到期？',
  },
  ja: {
    'nav.home': '12モジュール ホーム',
    'nav.ledger': '元帳',
    'nav.budgets': '予算',
    'nav.signin': 'ログイン',
    'nav.getstarted': '始める',
    'nav.signout': 'ログアウト',
    'nav.demo': '1クリックデモ',
    'nav.ai_insights': 'Finroq AI',
    'nav.switch_module': '機能を選択:',

    'mod.ai_assistant': 'Finroq AI',
    'mod.expense_tracking': '支出追跡',
    'mod.daily_budgeting': '日次予算',
    'mod.splitter': '割り勘計算',
    'mod.pre_spend_check': '支出前チェック',
    'mod.spend_leak_detector': '支出漏れ検出',
    'mod.money_guides': 'マネーガイド',
    'mod.net_worth': '純資産管理',
    'mod.goal_timeline': '目標シミュレーター',
    'mod.emergency_cushion': '緊急クッション',
    'mod.debt_watchdog': '債務管理',
    'mod.credit_health': 'クレジット健全性',
    'mod.financial_health': '総合財務スコア',

    'auth.welcome_back': 'お帰りなさい。',
    'auth.continue_google': 'Googleで続行',
    'auth.sign_in': 'ログイン',
    'auth.create_account': 'アカウント作成',

    'common.back_home': 'ホームに戻る',
    'common.sign_out': 'ログアウト',
    'common.open_module': 'モジュールを開く',

    'chat.title': 'Finroq AI',
    'chat.tagline': 'あなたの資産状況をシンプルに分かりやすく解説。',
    'chat.placeholder': '質問を入力または話してください...',
    'chat.listening': '聞いています... お話しください',
    'chat.q1': '今月の支出を分析して',
    'chat.q2': 'どこでもっと節約できますか？',
    'chat.q3': '15,000円の買い物をしても大丈夫？',
    'chat.q4': '直近の支払いは何がありますか？',
  },
  ar: {
    'nav.home': 'الرئيسية (12 محرك)',
    'nav.ledger': 'دفتر الحسابات',
    'nav.budgets': 'الميزانيات',
    'nav.signin': 'تسجيل الدخول',
    'nav.getstarted': 'ابدأ الآن',
    'nav.signout': 'تسجيل الخروج',
    'nav.demo': 'تجربة بنقرة واحدة',
    'nav.ai_insights': 'فينروك ذكاء اصطناعي',
    'nav.switch_module': 'اختر المحرك:',

    'mod.ai_assistant': 'فينروك ذكاء اصطناعي',
    'mod.expense_tracking': 'تتبع النفقات',
    'mod.daily_budgeting': 'الميزانية اليومية',
    'mod.splitter': 'تقسيم النفقات',
    'mod.pre_spend_check': 'فحص ما قبل الإنفاق',
    'mod.spend_leak_detector': 'كاشف تسرب الأموال',
    'mod.money_guides': 'أدلة الأموال',
    'mod.net_worth': 'صافي الثروة',
    'mod.goal_timeline': 'محاكي الأهداف',
    'mod.emergency_cushion': 'صندوق الطوارئ',
    'mod.debt_watchdog': 'مراقب الديون',
    'mod.credit_health': 'صحة الائتمان',
    'mod.financial_health': 'الصحة المالية',

    'auth.welcome_back': 'مرحباً بعودتك.',
    'auth.continue_google': 'المتابعة باستخدام Google',
    'auth.sign_in': 'تسجيل الدخول',
    'auth.create_account': 'إنشاء حساب',

    'common.back_home': 'العودة للرئيسية',
    'common.sign_out': 'تسجيل الخروج',
    'common.open_module': 'فتح المحرك',

    'chat.title': 'فينروك AI',
    'chat.tagline': 'أموالك.. بسيطة ومفهومة دائماً.',
    'chat.placeholder': 'اكتب أو تحدث بسؤالك المالي...',
    'chat.listening': 'أستمع الآن... تفضل بالكلام',
    'chat.q1': 'حلل نفقاتي لهذا الشهر',
    'chat.q2': 'أين يمكنني التوفير أكثر؟',
    'chat.q3': 'هل يمكنني شراء شيء بقيمة 15,000؟',
    'chat.q4': 'ما هي الفواتير القادمة؟',
  },
  bn: {
    'nav.home': '১২-মডিউল হোম',
    'nav.ledger': 'খতিয়ান',
    'nav.budgets': 'বাজেট',
    'nav.signin': 'সাইন ইন',
    'nav.getstarted': 'শুরু করুন',
    'nav.signout': 'সাইন আউট',
    'nav.demo': '১-ক্লিক ডেমো',
    'nav.ai_insights': 'ফিনরক এআই',
    'nav.switch_module': 'ফিচার নির্বাচন করুন:',

    'mod.ai_assistant': 'ফিনরক এআই',
    'mod.expense_tracking': 'ব্যয় ট্র্যাকিং',
    'mod.daily_budgeting': 'দৈনিক বাজেট',
    'mod.splitter': 'খরচ বিভাজক',
    'mod.pre_spend_check': 'প্রাক-ব্যয় পরীক্ষা',
    'mod.spend_leak_detector': 'লিক ডিটেক্টর',
    'mod.money_guides': 'মানি গাইড',
    'mod.net_worth': 'মোট সম্পদ',
    'mod.goal_timeline': 'লক্ষ্য সিমুলেটর',
    'mod.emergency_cushion': 'জরুরি তহবিল',
    'mod.debt_watchdog': 'ঋণ নজরদারি',
    'mod.credit_health': 'ক্রেডিট স্বাস্থ্য',
    'mod.financial_health': 'আর্থিক স্বাস্থ্য',

    'auth.welcome_back': 'ফিরে আসার জন্য স্বাগতম।',
    'auth.continue_google': 'Google দিয়ে চালিয়ে যান',
    'auth.sign_in': 'সাইন ইন করুন',
    'auth.create_account': 'অ্যাকাউন্ট তৈরি করুন',

    'common.back_home': 'হোমে ফিরে যান',
    'common.sign_out': 'সাইন আউট',
    'common.open_module': 'মডিউল খুলুন',

    'chat.title': 'ফিনরক এআই',
    'chat.tagline': 'আপনার আর্থিক হিসাব, সহজ ও স্পষ্ট।',
    'chat.placeholder': 'আপনার প্রশ্ন টাইপ করুন বা বলুন...',
    'chat.listening': 'শুনছি... বলুন',
    'chat.q1': 'এই মাসের আমার খরচ বিশ্লেষণ করুন',
    'chat.q2': 'আমি কোথায় আরও সঞ্চয় করতে পারি?',
    'chat.q3': 'আমি কি ₹১৫,০০০ খরচ করতে পারি?',
    'chat.q4': 'সামনে কোন কোন বিল বাকি আছে?',
  },
  pt: {
    'nav.home': 'Início 12 Módulos',
    'nav.ledger': 'Livro Razão',
    'nav.budgets': 'Orçamentos',
    'nav.signin': 'Entrar',
    'nav.getstarted': 'Começar',
    'nav.signout': 'Sair',
    'nav.demo': 'Demo em 1 Clique',
    'nav.ai_insights': 'Finroq IA',
    'nav.switch_module': 'Selecionar recurso:',

    'mod.ai_assistant': 'Finroq IA',
    'mod.expense_tracking': 'Controle de Despesas',
    'mod.daily_budgeting': 'Orçamento Diário',
    'mod.splitter': 'Divisão de Contas',
    'mod.pre_spend_check': 'Verificação Pré-Gasto',
    'mod.spend_leak_detector': 'Detector de Fugas',
    'mod.money_guides': 'Guias Financeiros',
    'mod.net_worth': 'Patrimônio Líquido',
    'mod.goal_timeline': 'Simulador de Metas',
    'mod.emergency_cushion': 'Reserva de Emergência',
    'mod.debt_watchdog': 'Monitor de Dívidas',
    'mod.credit_health': 'Saúde do Crédito',
    'mod.financial_health': 'Saúde Financeira',

    'auth.welcome_back': 'Bem-vindo de volta.',
    'auth.continue_google': 'Continuar com o Google',
    'auth.sign_in': 'Entrar',
    'auth.create_account': 'Criar conta',

    'common.back_home': 'Voltar ao início',
    'common.sign_out': 'Sair',
    'common.open_module': 'Abrir módulo',

    'chat.title': 'Finroq IA',
    'chat.tagline': 'Suas finanças de forma simples e direta.',
    'chat.placeholder': 'Digite ou fale sua dúvida financeira...',
    'chat.listening': 'Ouvindo... Fale agora',
    'chat.q1': 'Analise meus gastos deste mês',
    'chat.q2': 'Onde posso economizar mais?',
    'chat.q3': 'Posso arcar com uma compra de ₹ 15.000?',
    'chat.q4': 'Quais contas estão para vencer?',
  },
  ru: {
    'nav.home': 'Главная (12 модулей)',
    'nav.ledger': 'Журнал учета',
    'nav.budgets': 'Бюджеты',
    'nav.signin': 'Войти',
    'nav.getstarted': 'Начать',
    'nav.signout': 'Выйти',
    'nav.demo': 'Демо в 1 клик',
    'nav.ai_insights': 'Finroq ИИ',
    'nav.switch_module': 'Выбрать функцию:',

    'mod.ai_assistant': 'Finroq ИИ',
    'mod.expense_tracking': 'Учет расходов',
    'mod.daily_budgeting': 'Ежедневный бюджет',
    'mod.splitter': 'Разделение расходов',
    'mod.pre_spend_check': 'Проверка перед покупкой',
    'mod.spend_leak_detector': 'Детектор утечек',
    'mod.money_guides': 'Финансовые гиды',
    'mod.net_worth': 'Чистые активы',
    'mod.goal_timeline': 'Симулятор целей',
    'mod.emergency_cushion': 'Подушка безопасности',
    'mod.debt_watchdog': 'Контроль долгов',
    'mod.credit_health': 'Кредитное здоровье',
    'mod.financial_health': 'Финансовое здоровье',

    'auth.welcome_back': 'С возвращением.',
    'auth.continue_google': 'Продолжить с Google',
    'auth.sign_in': 'Войти',
    'auth.create_account': 'Создать аккаунт',

    'common.back_home': 'На главную',
    'common.sign_out': 'Выйти',
    'common.open_module': 'Открыть модуль',

    'chat.title': 'Finroq ИИ',
    'chat.tagline': 'Ваши финансы — просто, наглядно и понятно.',
    'chat.placeholder': 'Напишите или произнесите финансовый вопрос...',
    'chat.listening': 'Слушаю... Говорите',
    'chat.q1': 'Проанализируй мои расходы за этот месяц',
    'chat.q2': 'Где я могу сэкономить больше?',
    'chat.q3': 'Могу ли я позволить себе покупку на ₹15 000?',
    'chat.q4': 'Какие счета предстоит оплатить?',
  },
  it: {
    'nav.home': 'Home 12 Moduli',
    'nav.ledger': 'Libro Mastro',
    'nav.budgets': 'Budget',
    'nav.signin': 'Accedi',
    'nav.getstarted': 'Inizia',
    'nav.signout': 'Esci',
    'nav.demo': 'Demo in 1 Clic',
    'nav.ai_insights': 'Finroq IA',
    'nav.switch_module': 'Seleziona funzione:',

    'mod.ai_assistant': 'Finroq IA',
    'mod.expense_tracking': 'Tracciamento Spese',
    'mod.daily_budgeting': 'Budget Giornaliero',
    'mod.splitter': 'Divisione Spese',
    'mod.pre_spend_check': 'Controllo Pre-Spesa',
    'mod.spend_leak_detector': 'Rilevatore Perdite',
    'mod.money_guides': 'Guide Finanziarie',
    'mod.net_worth': 'Patrimonio Netto',
    'mod.goal_timeline': 'Simulatore Obiettivi',
    'mod.emergency_cushion': 'Fondo Emergenze',
    'mod.debt_watchdog': 'Controllo Debiti',
    'mod.credit_health': 'Salute del Credito',
    'mod.financial_health': 'Salute Finanziaria',

    'auth.welcome_back': 'Bentornato.',
    'auth.continue_google': 'Continua con Google',
    'auth.sign_in': 'Accedi',
    'auth.create_account': 'Crea account',

    'common.back_home': 'Torna alla home',
    'common.sign_out': 'Disconnettiti',
    'common.open_module': 'Apri modulo',

    'chat.title': 'Finroq IA',
    'chat.tagline': 'Le tue finanze, spiegate in modo semplice.',
    'chat.placeholder': 'Digita o pronuncia la tua domanda...',
    'chat.listening': 'In ascolto... Parla ora',
    'chat.q1': 'Analizza le mie spese di questo mese',
    'chat.q2': 'Dove posso risparmiare di più?',
    'chat.q3': 'Posso permettermi un acquisto di ₹15.000?',
    'chat.q4': 'Quali bollette sono in scadenza?',
  },
  ko: {
    'nav.home': '12개 모듈 홈',
    'nav.ledger': '원장',
    'nav.budgets': '예산',
    'nav.signin': '로그인',
    'nav.getstarted': '시작하기',
    'nav.signout': '로그아웃',
    'nav.demo': '1클릭 데모',
    'nav.ai_insights': 'Finroq AI',
    'nav.switch_module': '기능 선택:',

    'mod.ai_assistant': 'Finroq AI',
    'mod.expense_tracking': '지출 추적',
    'mod.daily_budgeting': '일일 예산',
    'mod.splitter': '정산 분할',
    'mod.pre_spend_check': '지출 전 점검',
    'mod.spend_leak_detector': '지출 누수 감지',
    'mod.money_guides': '금융 가이드',
    'mod.net_worth': '순자산 관리',
    'mod.goal_timeline': '목표 시뮬레이터',
    'mod.emergency_cushion': '비상 자금',
    'mod.debt_watchdog': '부채 모니터링',
    'mod.credit_health': '신용 건강',
    'mod.financial_health': '종합 재정 점수',

    'auth.welcome_back': '다시 오신 것을 환영합니다.',
    'auth.continue_google': 'Google로 계속',
    'auth.sign_in': '로그인',
    'auth.create_account': '계정 만들기',

    'common.back_home': '홈으로 돌아가기',
    'common.sign_out': '로그아웃',
    'common.open_module': '모듈 열기',

    'chat.title': 'Finroq AI',
    'chat.tagline': '당신의 금융, 쉽고 명확하게 이해하세요.',
    'chat.placeholder': '금융 질문을 입력하거나 말하세요...',
    'chat.listening': '듣고 있습니다... 말씀하세요',
    'chat.q1': '이번 달 내 지출 분석해줘',
    'chat.q2': '어디서 더 절약할 수 있을까?',
    'chat.q3': '₹15,000 구매를 감당할 수 있을까?',
    'chat.q4': '곧 납부해야 할 청구서는 무엇인가요?',
  },
  ta: {
    'nav.home': '12-தொகுதி முகப்பு',
    'nav.ledger': 'கணக்கு புத்தகம்',
    'nav.budgets': 'பட்ஜெட்',
    'nav.signin': 'உள்நுழைய',
    'nav.getstarted': 'தொடங்குங்கள்',
    'nav.signout': 'வெளியேறு',
    'nav.demo': '1-கிளிக் டெமோ',
    'nav.ai_insights': 'ஃபின்ராக் AI',
    'nav.switch_module': 'அம்சத்தைத் தேர்ந்தெடுக்கவும்:',

    'mod.ai_assistant': 'ஃபின்ராக் AI',
    'mod.expense_tracking': 'செலவு கண்காணிப்பு',
    'mod.daily_budgeting': 'தினசரி பட்ஜெட்',
    'mod.splitter': 'செலவு பிரிப்பான்',
    'mod.pre_spend_check': 'செலவுக்கு முந்தைய சோதனை',
    'mod.spend_leak_detector': 'கசிவு கண்டறிதல்',
    'mod.money_guides': 'பண வழிகாட்டிகள்',
    'mod.net_worth': 'நிகர மதிப்பு',
    'mod.goal_timeline': 'இலக்கு சிமுலேட்டர்',
    'mod.emergency_cushion': 'அவசரகால நிதி',
    'mod.debt_watchdog': 'கடன் கண்காணிப்பு',
    'mod.credit_health': 'கடன் ஆரோக்கியம்',
    'mod.financial_health': 'நிதி ஆரோக்கியம்',

    'auth.welcome_back': 'மீண்டும் வருக.',
    'auth.continue_google': 'Google உடன் தொடரவும்',
    'auth.sign_in': 'உள்நுழைக',
    'auth.create_account': 'கணக்கு உருவாக்கவும்',

    'common.back_home': 'முகப்புக்குத் திரும்பு',
    'common.sign_out': 'வெளியேறு',
    'common.open_module': 'தொகுதியைத் திறக்கவும்',

    'chat.title': 'ஃபின்ராக் AI',
    'chat.tagline': 'உங்கள் நிதி கணக்குகள், மிக எளிதாக.',
    'chat.placeholder': 'உங்கள் கேள்வியை தட்டச்சு செய்யவும் அல்லது பேசவும்...',
    'chat.listening': 'கேட்கிறது... பேசுங்கள்',
    'chat.q1': 'இந்த மாத எனது செலவுகளை பகுப்பாய்வு செய்',
    'chat.q2': 'நான் எங்கு கூடுதல் சேமிக்க முடியும்?',
    'chat.q3': '₹15,000 செலவை என்னால் சமாளிக்க முடியுமா?',
    'chat.q4': 'வரவிருக்கும் பில்கள் என்ன?',
  },
  te: {
    'nav.home': '12-మాడ్యూల్ హోమ్',
    'nav.ledger': 'లెడ్జర్',
    'nav.budgets': 'బడ్జెట్',
    'nav.signin': 'సైన్ ఇన్',
    'nav.getstarted': 'ప్రారంభించండి',
    'nav.signout': 'సైన్ అవుట్',
    'nav.demo': '1-క్లిక్ డెమో',
    'nav.ai_insights': 'ఫిన్‌రాక్ AI',
    'nav.switch_module': 'ఫీచర్‌ను ఎంచుకోండి:',

    'mod.ai_assistant': 'ఫిన్‌రాక్ AI',
    'mod.expense_tracking': 'ఖర్చుల ట్రాకింగ్',
    'mod.daily_budgeting': 'రోజువారీ బడ్జెట్',
    'mod.splitter': 'ఖర్చుల విభజన',
    'mod.pre_spend_check': 'ఖర్చుకు ముందు తనిఖీ',
    'mod.spend_leak_detector': 'ఖర్చు లీక్ డిటెక్టర్',
    'mod.money_guides': 'మనీ గైడ్‌లు',
    'mod.net_worth': 'నికర విలువ',
    'mod.goal_timeline': 'లక్ష్య సిమ్యులేటర్',
    'mod.emergency_cushion': 'అత్యవసర నిధి',
    'mod.debt_watchdog': 'రుణ పర్యవేక్షణ',
    'mod.credit_health': 'క్రెడిట్ ఆరోగ్యం',
    'mod.financial_health': 'ఆర్థిక ఆరోగ్యం',

    'auth.welcome_back': 'తిరిగి స్వాగతం.',
    'auth.continue_google': 'Google తో కొనసాగండి',
    'auth.sign_in': 'సైన్ ఇన్ చేయండి',
    'auth.create_account': 'ఖాతా సృష్టించండి',

    'common.back_home': 'హోమ్‌కు తిరిగి వెళ్ళు',
    'common.sign_out': 'సైన్ అవుట్',
    'common.open_module': 'మాడ్యూల్ తెరవండి',

    'chat.title': 'ఫిన్‌రాక్ AI',
    'chat.tagline': 'మీ ఆర్థిక లెక్కలు, సులభంగా అర్థం చేసుకోండి.',
    'chat.placeholder': 'మీ ఆర్థిక ప్రశ్నను టైప్ చేయండి లేదా మాట్లాడండి...',
    'chat.listening': 'వింటున్నాను... మాట్లాడండి',
    'chat.q1': 'ఈ నెల నా ఖర్చులను విశ్లేషించండి',
    'chat.q2': 'నేను ఎక్కడ ఎక్కువ ఆదా చేయగలను?',
    'chat.q3': 'నేను ₹15,000 కొనుగోలును భరించగలనా?',
    'chat.q4': 'రాబోయే బిల్లులు ఏమిటి?',
  },
  mr: {
    'nav.home': '12-मॉड्यूल मुख्यपृष्ठ',
    'nav.ledger': 'खातावही',
    'nav.budgets': 'बजेट',
    'nav.signin': 'साइन इन',
    'nav.getstarted': 'सुरू करा',
    'nav.signout': 'साइन आउट',
    'nav.demo': '1-क्लिक डेमो',
    'nav.ai_insights': 'फिनरॉक AI',
    'nav.switch_module': 'वैशिष्ट्य निवडा:',

    'mod.ai_assistant': 'फिनरॉक AI',
    'mod.expense_tracking': 'खर्च ट्रॅकिंग',
    'mod.daily_budgeting': 'दैनिक बजेट',
    'mod.splitter': 'खर्च विभाजक',
    'mod.pre_spend_check': 'खर्चापूर्वी तपासणी',
    'mod.spend_leak_detector': 'अनावश्यक खर्च शोधक',
    'mod.money_guides': 'आर्थिक मार्गदर्शक',
    'mod.net_worth': 'एकूण संपत्ती',
    'mod.goal_timeline': 'ध्येय सिम्युलेटर',
    'mod.emergency_cushion': 'आपत्कालीन निधी',
    'mod.debt_watchdog': 'कर्ज पहारेकरी',
    'mod.credit_health': 'क्रेडिट आरोग्य',
    'mod.financial_health': 'आर्थिक आरोग्य',

    'auth.welcome_back': 'पुन्हा स्वागत आहे.',
    'auth.continue_google': 'Google सह सुरू ठेवा',
    'auth.sign_in': 'साइन इन करा',
    'auth.create_account': 'खाते तयार करा',

    'common.back_home': 'मुख्यपृष्ठावर परत जा',
    'common.sign_out': 'साइन आउट',
    'common.open_module': 'मॉड्यूल उघडा',

    'chat.title': 'फिनरॉक AI',
    'chat.tagline': 'तुमचा आर्थिक हिशेब, सोपा आणि स्पष्ट.',
    'chat.placeholder': 'आपला प्रश्न टाइप करा किंवा बोला...',
    'chat.listening': 'ऐकत आहे... बोला',
    'chat.q1': 'या महिन्यातील माझ्या खर्चाचे विश्लेषण करा',
    'chat.q2': 'मी अधिक बचत कुठे करू शकतो?',
    'chat.q3': 'मी ₹15,000 ची खरेदी परवडू शकतो का?',
    'chat.q4': 'कोणते बिल आगामी आहेत?',
  },
  gu: {
    'nav.home': '12-મોડ્યુલ હોમ',
    'nav.ledger': 'ખાતાવહી',
    'nav.budgets': 'બજેટ',
    'nav.signin': 'સાઇન ઇન',
    'nav.getstarted': 'શરૂ કરો',
    'nav.signout': 'સાઇન આઉટ',
    'nav.demo': '1-ક્લિક ડેમો',
    'nav.ai_insights': 'ફિનરોક AI',
    'nav.switch_module': 'સુવિધા પસંદ કરો:',

    'mod.ai_assistant': 'ફિનરોક AI',
    'mod.expense_tracking': 'ખર્ચ ટ્રેકિંગ',
    'mod.daily_budgeting': 'દૈનિક બજેટિંગ',
    'mod.splitter': 'ખર્ચ વિભાજક',
    'mod.pre_spend_check': 'ખર્ચ પૂર્વે તપાસ',
    'mod.spend_leak_detector': 'બિનજરૂરી ખર્ચ શોધક',
    'mod.money_guides': 'નાણાકીય માર્ગદર્શિકા',
    'mod.net_worth': 'નેટવર્થ',
    'mod.goal_timeline': 'ધ્યેય સિમ્યુલેટર',
    'mod.emergency_cushion': 'ઇમરજન્સી ફંડ',
    'mod.debt_watchdog': 'દેવું વોચડોગ',
    'mod.credit_health': 'ક્રેડિટ હેલ્થ',
    'mod.financial_health': 'નાણાકીય આરોગ્ય',

    'auth.welcome_back': 'ફરી સ્વાગત છે.',
    'auth.continue_google': 'Google સાથે ચાલુ રાખો',
    'auth.sign_in': 'સાઇન ઇન કરો',
    'auth.create_account': 'ખાતું બનાવો',

    'common.back_home': 'હોમ પર પાછા જાઓ',
    'common.sign_out': 'સાઇન આઉટ',
    'common.open_module': 'મોડ્યુલ ખોલો',

    'chat.title': 'ફિનરોક AI',
    'chat.tagline': 'તમારા નાણાકીય હિસાબો, સરળ અને સ્પષ્ટ.',
    'chat.placeholder': 'તમારો પ્રશ્ન લખો અથવા બોલો...',
    'chat.listening': 'સાંભળી રહ્યો છું... બોલો',
    'chat.q1': 'આ મહિનાના મારા ખર્ચનું વિશ્લેષણ કરો',
    'chat.q2': 'હું ક્યાં વધુ બચત કરી શકું?',
    'chat.q3': 'શું હું ₹15,000 નો ખર્ચ પોસાય તેમ છું?',
    'chat.q4': 'કયા બિલો આવવાના બાકી છે?',
  },
  kn: {
    'nav.home': '12-ಮಾಡ್ಯೂಲ್ ಮುಖಪುಟ',
    'nav.ledger': 'ಖಾತೆ ಪುಸ್ತಕ',
    'nav.budgets': 'ಬಜೆಟ್',
    'nav.signin': 'ಸೈನ್ ಇನ್',
    'nav.getstarted': 'ಪ್ರಾರಂಭಿಸಿ',
    'nav.signout': 'ಸೈನ್ ಔಟ್',
    'nav.demo': '1-ಕ್ಲಿಕ್ ಡೆಮೊ',
    'nav.ai_insights': 'ಫಿನ್‌ರಾಕ್ AI',
    'nav.switch_module': 'ವೈಶಿಷ್ಟ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ:',

    'mod.ai_assistant': 'ಫಿನ್‌ರಾಕ್ AI',
    'mod.expense_tracking': 'ಖರ್ಚು ಟ್ರ್ಯಾಕಿಂಗ್',
    'mod.daily_budgeting': 'ದೈನಂದಿನ ಬಜೆಟ್',
    'mod.splitter': 'ಖರ್ಚು ವಿಭಜಕ',
    'mod.pre_spend_check': 'ಖರ್ಚು ಪೂರ್ವ ತಪಾಸಣೆ',
    'mod.spend_leak_detector': 'ಸೋರಿಕೆ ಡಿಟೆಕ್ಟರ್',
    'mod.money_guides': 'ಹಣಕಾಸು ಮಾರ್ಗದರ್ಶಿ',
    'mod.net_worth': 'ನಿವ್ವಳ ಮೌಲ್ಯ',
    'mod.goal_timeline': 'ಗುರಿ ಸಿಮ್ಯುಲೇಟರ್',
    'mod.emergency_cushion': 'ತುರ್ತು ನಿಧಿ',
    'mod.debt_watchdog': 'ಸಾಲ ಕಾವಲುಗಾರ',
    'mod.credit_health': 'ಕ್ರೆಡಿಟ್ ಆರೋಗ್ಯ',
    'mod.financial_health': 'ಹಣಕಾಸು ಆರೋಗ್ಯ',

    'auth.welcome_back': 'ಮರಳಿ ಸ್ವಾಗತ.',
    'auth.continue_google': 'Google ನೊಂದಿಗೆ ಮುಂದುವರಿಯಿರಿ',
    'auth.sign_in': 'ಸೈನ್ ಇನ್ ಮಾಡಿ',
    'auth.create_account': 'ಖಾತೆ ರಚಿಸಿ',

    'common.back_home': 'ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ',
    'common.sign_out': 'ಸೈನ್ ಔಟ್',
    'common.open_module': 'ಮಾಡ್ಯೂಲ್ ತೆರೆಯಿರಿ',

    'chat.title': 'ಫಿನ್‌ರಾಕ್ AI',
    'chat.tagline': 'ನಿಮ್ಮ ಹಣಕಾಸು ಲೆಕ್ಕಾಚಾರ, ಸರಳ ಮತ್ತು ನಿಖರ.',
    'chat.placeholder': 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಿ...',
    'chat.listening': 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ... ಮಾತನಾಡಿ',
    'chat.q1': 'ಈ ತಿಂಗಳ ನನ್ನ ಖರ್ಚುಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ',
    'chat.q2': 'ನಾನು ಎಲ್ಲಿ ಹೆಚ್ಚು ಉಳಿಸಬಹುದು?',
    'chat.q3': 'ನಾನು ₹15,000 ಖರೀದಿಯನ್ನು ಭರಿಸಬಹುದೇ?',
    'chat.q4': 'ಯಾವ ಬಿಲ್‌ಗಳು ಬರಲಿವೆ?',
  },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('finroq_lang') as Language;
        if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
          setLanguageState(saved);
        }
      } catch {}
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
    // 0. Check flagship & feature translations for active language
    const flagLang = FLAGSHIP_TRANSLATIONS[language];
    if (flagLang && flagLang[key]) {
      return flagLang[key];
    }
    // 1. Check landing page 18-language dictionary
    const landLang = LANDING_TRANSLATIONS[language];
    if (landLang && landLang[key]) {
      return landLang[key];
    }
    // 2. Check comprehensive 18-language section dictionary
    const secLang = SECTION_TRANSLATIONS[language];
    if (secLang && secLang[key]) {
      return secLang[key];
    }
    // 3. Check comprehensive 18-language dictionary
    const fullLang = ALL_TRANSLATIONS[language];
    if (fullLang && fullLang[key]) {
      return fullLang[key];
    }
    // 4. Check local context dictionary
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // 5. Automatic phrase and dynamic rule for non-English languages
    if (language !== 'en') {
      const autoTranslated = applyAutomaticLanguageRule(language, key, fallback);
      if (autoTranslated) {
        return autoTranslated;
      }
    }
    // 6. Fallback to English flagship dictionary
    const flagEn = FLAGSHIP_TRANSLATIONS['en'];
    if (flagEn && flagEn[key]) {
      return flagEn[key];
    }
    // 7. Fallback to English sections dictionary
    const secEn = SECTION_TRANSLATIONS['en'];
    if (secEn && secEn[key]) {
      return secEn[key];
    }
    // 8. Fallback to English comprehensive dictionary
    const fullEn = ALL_TRANSLATIONS['en'];
    if (fullEn && fullEn[key]) {
      return fullEn[key];
    }
    // 9. Fallback to English local dictionary
    const enDict = translations['en'];
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback || key;
  };

  const activeLanguageMeta =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <I18nContext.Provider value={{ language, setLanguage, toggleLanguage, t, activeLanguageMeta }}>
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
