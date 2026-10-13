'use client';

import React, { useState } from 'react';
import { ModuleShell } from '@/components/layout/ModuleShell';
import { Modal } from '@/components/ui/Modal';
import { BookOpen, CheckCircle2, ShieldCheck, ArrowRight, ShieldAlert, Zap, HelpCircle } from 'lucide-react';

interface Guide {
  id: string;
  title: string;
  tag: string;
  readTime: string;
  summary: string;
  fullBody: {
    coreConcept: string;
    whyItMatters: string;
    actionSteps: string[];
    proTip: string;
  };
}

const GUIDES: Guide[] = [
  {
    id: '50-30-20',
    title: 'The 50/30/20 Rule — Simple Money Split',
    tag: 'Budgeting',
    readTime: '2 min read',
    summary: 'Split your salary into 3 parts: 50% for needs (rent, food), 30% for wants (movies, eating out), 20% for savings.',
    fullBody: {
      coreConcept: 'Divide your take-home salary into three simple buckets. Needs first, savings second, wants last.',
      whyItMatters: 'Most people spend first and save later. By saving first, you guarantee your future self is taken care of.',
      actionSteps: [
        'Check your salary after PF and tax.',
        'Keep rent, food, bills under 50%.',
        'Move 20% to savings on salary day.',
        'Spend the rest on fun without guilt.',
      ],
      proTip: 'If rent is too high in big cities, cut wants to 20% instead of touching savings.',
    },
  },
  {
    id: 'emergency-fund',
    title: 'Emergency Fund: Your Safety Net',
    tag: 'Safety',
    readTime: '2 min read',
    summary: 'Save 3-6 months of expenses in a separate bank account. Only use it for real emergencies.',
    fullBody: {
      coreConcept: 'An emergency fund is not for investment. It is protection against life surprises.',
      whyItMatters: 'If you lose your job or face a medical emergency, this fund stops you from going into debt.',
      actionSteps: [
        'Add up your monthly must-pay expenses (rent, food, bills).',
        'Multiply by 3 (if family support) or 6 (if single).',
        'Keep this money in a separate savings account.',
        'Do NOT use this for shopping or trips.',
      ],
      proTip: 'A credit card is NOT an emergency fund. Its interest rate is 42% per year!',
    },
  },
  {
    id: 'upi-scams',
    title: 'UPI Scams: How to Stay Safe',
    tag: 'Scam Protection',
    readTime: '2 min read',
    summary: 'You NEVER need to enter your UPI PIN to receive money. Scammers trick you into sending them money.',
    fullBody: {
      coreConcept: 'Your UPI PIN is only for sending money. Never enter it to receive anything.',
      whyItMatters: 'Thousands of Indians lose money daily to UPI scams. One mistake can empty your account.',
      actionSteps: [
        'Never scan QR codes to receive money — it is always a scam.',
        'Never share OTP or CVV with anyone, even bank staff.',
        'Set a daily UPI limit of ₹25,000 in your bank app.',
        'If scammed, call 1930 (Cyber Crime Helpline) immediately.',
      ],
      proTip: 'Real banks will NEVER ask you to install AnyDesk or TeamViewer. If someone does, it is a scam.',
    },
  },
  {
    id: 'debt-snowball',
    title: 'Kill Debt Fast: Snowball Method',
    tag: 'Debt Freedom',
    readTime: '2 min read',
    summary: 'Pay off smallest loan first while paying minimum on others. Build momentum to become debt-free.',
    fullBody: {
      coreConcept: 'Start with the smallest loan. Pay it off fast. Then move to the next one.',
      whyItMatters: 'Winning small keeps you motivated. Each loan you kill gives you confidence.',
      actionSteps: [
        'Write down all your loans from smallest to biggest.',
        'Pay minimum on all loans.',
        'Put all extra money into the smallest loan.',
        'Once it is paid off, roll that payment into the next loan.',
      ],
      proTip: 'After paying off a credit card, reduce its limit so you do not fall back into debt.',
    },
  },
  {
    id: 'sip-investing',
    title: 'SIP: Build Wealth Slowly & Steadily',
    tag: 'Investing',
    readTime: '2 min read',
    summary: 'Invest a fixed amount every month in mutual funds. Even ₹500/month can grow into lakhs over time.',
    fullBody: {
      coreConcept: 'SIP means investing a fixed amount every month, regardless of market ups and downs.',
      whyItMatters: 'You do not need lakhs to start investing. Small regular amounts compound into big wealth.',
      actionSteps: [
        'Start with just ₹500-₹1000 per month in a good index fund.',
        'Increase your SIP amount every year as your salary grows.',
        'Do NOT stop your SIP during market crashes — that is when you buy cheap.',
        'Think in decades, not days.',
      ],
      proTip: 'A ₹5,000 monthly SIP at 12% return for 20 years becomes over ₹50 lakh.',
    },
  },
  {
    id: 'credit-score',
    title: 'Credit Score: Keep It Above 750',
    tag: 'Credit Health',
    readTime: '2 min read',
    summary: 'Pay all bills on time and keep credit card usage under 30% for a strong CIBIL score.',
    fullBody: {
      coreConcept: 'Your credit score (CIBIL) is like a financial report card. Banks use it to decide if you are trustworthy.',
      whyItMatters: 'A score above 750 gets you lower interest rates on loans and higher credit card limits.',
      actionSteps: [
        'Pay your credit card bill in full every month.',
        'Keep your credit card spending under 30% of your limit.',
        'Do not apply for too many loans or cards at once.',
        'Check your free CIBIL score once every 3 months.',
      ],
      proTip: 'Even one late payment can drop your score by 50-100 points. Set payment reminders!',
    },
  },
  {
    id: 'insurance-basics',
    title: 'Insurance: Protect Before You Invest',
    tag: 'Protection',
    readTime: '2 min read',
    summary: 'Buy term life insurance and health insurance BEFORE investing. One accident can wipe out savings.',
    fullBody: {
      coreConcept: 'Insurance is not an investment. It is a safety net for your family.',
      whyItMatters: 'One hospitalization can cost ₹3-5 lakh. Without insurance, you will either go into debt or sell investments.',
      actionSteps: [
        'Buy health insurance of ₹10 lakh for your family.',
        'Get term life insurance (NOT endowment) of 10x your annual income.',
        'Do NOT mix insurance and investment — they serve different purposes.',
        'Review your insurance needs every 2 years.',
      ],
      proTip: 'ULIPs and endowment plans are terrible. Buy pure term insurance + invest the rest in mutual funds.',
    },
  },
  {
    id: 'scam-awareness',
    title: 'Common Indian Financial Scams to Avoid',
    tag: 'Scam Protection',
    readTime: '3 min read',
    summary: 'Learn about OTP scams, KYC fraud, fake loan apps, and Ponzi schemes targeting Indians.',
    fullBody: {
      coreConcept: 'Scammers use fear, greed, and urgency to make you act without thinking.',
      whyItMatters: 'Indians lose over ₹10,000 crore to financial fraud every year. Awareness is your best defense.',
      actionSteps: [
        'OTP Scam: Never share OTP. Banks never ask for it.',
        'KYC Fraud: Never send documents to unknown numbers. Update KYC only through official bank branches.',
        'Fake Loan Apps: Never pay "processing fee" before loan disbursement. Real loans deduct fees from the loan amount.',
        'Ponzi Schemes: If returns are guaranteed and too high (20%+), it is always a scam.',
      ],
      proTip: 'If someone promises risk-free high returns, assume it is a scam. There is no such thing.',
    },
  },
  {
    id: 'index-funds',
    title: 'Index Funds: Best for Beginners',
    tag: 'Investing',
    readTime: '2 min read',
    summary: 'Index funds track the whole market. Low fees, no need to pick stocks. Perfect for first-time investors.',
    fullBody: {
      coreConcept: 'An index fund buys all stocks in an index like Nifty 50. You own a tiny piece of India\'s top 50 companies.',
      whyItMatters: 'Most stock pickers fail to beat the index over 10+ years. Index funds give you market returns with minimal fees.',
      actionSteps: [
        'Start with a Nifty 50 or Sensex index fund.',
        'Choose direct plans (lower fees) over regular plans.',
        'Invest via SIP — same amount every month, regardless of market level.',
        'Stay invested for 10+ years. Time in the market beats timing the market.',
      ],
      proTip: 'A ₹10,000 monthly SIP in a Nifty 50 index fund for 30 years can grow to over ₹10 crore at 12% average returns.',
    },
  },
  {
    id: 'epf-vs-ppf',
    title: 'EPF vs PPF: Which is Better?',
    tag: 'Investing',
    readTime: '2 min read',
    summary: 'Both are government-backed savings. EPF is for salaried, PPF is open to everyone. Know the difference.',
    fullBody: {
      coreConcept: 'EPF is automatic for salaried employees. PPF is voluntary but open to anyone with a bank account.',
      whyItMatters: 'EPF gives ~8.25% with employer contribution. PPF gives ~7.1% with 15-year lock-in. Both are safe.',
      actionSteps: [
        'If salaried, keep EPF and contribute more through VPF if possible.',
        'If self-employed or want extra savings, open a PPF account.',
        'Both qualify for tax deduction under Section 80C (up to ₹1.5 lakh/year).',
        'Do not withdraw EPF before 5 years unless absolutely necessary.',
      ],
      proTip: 'Max out both EPF and PPF for ₹3 lakh/year in safe, tax-free returns before investing in anything risky.',
    },
  },
  {
    id: 'gold-investment',
    title: 'Gold: Should You Invest?',
    tag: 'Investing',
    readTime: '2 min read',
    summary: 'Gold is a hedge against inflation, not a wealth creator. Keep 5-10% of your portfolio in gold.',
    fullBody: {
      coreConcept: 'Gold protects your money when currencies fail and markets crash. But it does not grow wealth like equities.',
      whyItMatters: 'Gold has given ~8-10% long-term returns, roughly matching inflation. It is insurance, not growth.',
      actionSteps: [
        'Prefer Sovereign Gold Bonds (SGB) over physical gold — you earn 2.5% interest plus gold price gains.',
        'Gold ETFs are the cheapest way to invest in gold.',
        'Keep 5-10% of total portfolio in gold as insurance.',
        'Do not buy gold jewellery as investment — making charges eat 20-30% of value.',
      ],
      proTip: 'Buy gold during emotional market panic. It is your financial fire extinguisher, not your engine.',
    },
  },
  {
    id: 'stock-basics',
    title: 'Stock Market Basics for Beginners',
    tag: 'Investing',
    readTime: '3 min read',
    summary: 'Stocks represent ownership in companies. Learn how to start safely with small amounts.',
    fullBody: {
      coreConcept: 'When you buy a stock, you own a small piece of that company. If the company grows, your stock grows.',
      whyItMatters: 'Equities have given 12-15% annual returns over long periods in India — higher than FD, gold, or real estate.',
      actionSteps: [
        'Open a demat account with Zerodha, Groww, or any SEBI-registered broker.',
        'Start with blue-chip stocks (TCS, HDFC, Infosys) or just stick to index funds.',
        'Never invest emergency fund money in stocks.',
        'Ignore short-term noise. Think in years and decades.',
      ],
      proTip: 'If you do not understand a company, do not buy its stock. Index funds are always the safe default.',
    },
  },
  {
    id: 'retirement-planning',
    title: 'Retirement Planning: Start Early',
    tag: 'Long-Term',
    readTime: '2 min read',
    summary: 'The earlier you start, the less you need to save each month. Compound interest is the 8th wonder.',
    fullBody: {
      coreConcept: 'Starting at 25 vs 35 can mean saving ₹5,000/month vs ₹15,000/month for the same retirement corpus.',
      whyItMatters: 'Compounding needs time. 30 years at 12% turns ₹1 lakh into ₹30 lakh. 20 years turns it into only ₹10 lakh.',
      actionSteps: [
        'Target a retirement corpus of 25x your annual expenses (the 4% rule).',
        'Invest in equity for growth, then shift to debt as retirement approaches.',
        'Increase SIP amount by 10% every year as your salary grows.',
        'Do not withdraw retirement money early — let it compound.',
      ],
      proTip: 'A ₹5,000 monthly SIP at 12% for 30 years becomes ₹1.76 crore. Start today, not tomorrow.',
    },
  },
];

import { useI18n } from '@/lib/i18n-context';

const HINDI_TRANSLATIONS: Record<string, {
  title: string;
  tag: string;
  readTime: string;
  summary: string;
  coreConcept: string;
  whyItMatters: string;
  actionSteps: string[];
  proTip: string;
}> = {
  '50-30-20': {
    title: '50/30/20 नियम — आसान बजट विभाजन',
    tag: 'बजट बनाना',
    readTime: '2 मिनट',
    summary: 'अपनी सैलरी को 3 भागों में बांटें: 50% जरूरतों के लिए (किराया, राशन), 30% इच्छाओं के लिए (घूमना, खाना), और 20% बचत के लिए।',
    coreConcept: 'अपने इन-हैंड वेतन को तीन सरल हिस्सों में बांटें। पहले जरूरतें, फिर बचत, और अंत में इच्छाएं।',
    whyItMatters: 'ज्यादातर लोग पहले खर्च करते हैं और बाद में बचाते हैं। पहले बचत करने से आपका भविष्य हमेशा सुरक्षित रहता है।',
    actionSteps: [
      'पीएफ और टैक्स कटने के बाद अपनी इन-हैंड सैलरी देखें।',
      'किराया, राशन और बिलों को 50% के भीतर रखें।',
      'सैलरी वाले दिन ही 20% सीधे बचत में ट्रांसफर करें।',
      'बाकी पैसे बिना किसी अपराधबोध के मनोरंजन पर खर्च करें।',
    ],
    proTip: 'यदि बड़े शहरों में किराया बहुत अधिक है, तो बचत कम करने के बजाय इच्छाओं का हिस्सा 20% कर दें।',
  },
  'emergency-fund': {
    title: 'आपातकालीन फंड: आपका वित्तीय सुरक्षा कवच',
    tag: 'सुरक्षा',
    readTime: '2 मिनट',
    summary: 'एक अलग बैंक खाते में 3-6 महीने का जरूरी खर्च बचाकर रखें। इसे सिर्फ वास्तविक आपातकाल में ही उपयोग करें।',
    coreConcept: 'आपातकालीन फंड निवेश नहीं है। यह जीवन के अनपेक्षित झटकों से सुरक्षा है।',
    whyItMatters: 'यदि नौकरी चली जाए या मेडिकल इमरजेंसी आ जाए, तो यह फंड आपको कर्ज में डूबने से बचाता है।',
    actionSteps: [
      'अपने सभी मासिक आवश्यक खर्चे (किराया, राशन, बिल) जोड़ें।',
      'पारिवारिक सहायता होने पर 3 से, या अकेले होने पर 6 से गुणा करें।',
      'इस राशि को एक अलग बचत खाते या लिक्विड फंड में रखें।',
      'शॉपिंग या छुट्टियों के लिए इस फंड का कतई उपयोग न करें।',
    ],
    proTip: 'क्रेडिट कार्ड आपातकालीन फंड नहीं होता। इसकी ब्याज दर 42% प्रति वर्ष तक होती है!',
  },
  'upi-scams': {
    title: 'UPI घोटाले: सतर्क और सुरक्षित कैसे रहें',
    tag: 'घोटाला सुरक्षा',
    readTime: '2 मिनट',
    summary: 'पैसे प्राप्त करने के लिए कभी भी UPI पिन दर्ज करने की आवश्यकता नहीं होती। जालसाज आपको धोखा देकर पैसे मंगाते हैं।',
    coreConcept: 'आपका UPI पिन केवल पैसे भेजने के लिए होता है। कभी भी पैसे प्राप्त करने के लिए पिन न डालें।',
    whyItMatters: 'प्रतिदिन हजारों लोग यूपीआई धोखाधड़ी में अपनी मेहनत की कमाई गंवा देते हैं। एक गलती खाता खाली कर सकती है।',
    actionSteps: [
      'पैसे पाने के लिए कभी QR कोड स्कैन न करें — यह हमेशा धोखाधड़ी होती है।',
      'किसी के साथ भी OTP या CVV साझा न करें, बैंक स्टाफ के साथ भी नहीं।',
      'अपने बैंक ऐप में दैनिक UPI सीमा ₹25,000 सेट करें।',
      'धोखाधड़ी होने पर तुरंत 1930 (साइबर क्राइम हेल्पलाइन) पर कॉल करें।',
    ],
    proTip: 'असली बैंक कभी भी AnyDesk या TeamViewer इंस्टॉल करने को नहीं कहेंगे। यदि कोई कहे, तो तुरंत कॉल काटें।',
  },
  'debt-snowball': {
    title: 'कर्ज तेजी से चुकाएं: स्नोबॉल विधि',
    tag: 'कर्ज मुक्ति',
    readTime: '2 मिनट',
    summary: 'बाकियों पर न्यूनतम किस्त देते हुए सबसे छोटे कर्ज को पहले खत्म करें। आत्मविश्वास के साथ कर्ज-मुक्त बनें।',
    coreConcept: 'सबसे छोटे कर्ज से शुरुआत करें। उसे तेजी से खत्म करें और फिर अगले कर्ज की ओर बढ़ें।',
    whyItMatters: 'छोटी जीतें आपका मनोबल बढ़ाती हैं। हर बंद होने वाला कर्ज आपको नया आत्मविश्वास देता है।',
    actionSteps: [
      'अपने सभी कर्जों को सबसे छोटे से सबसे बड़े क्रम में लिखें।',
      'सभी कर्जों पर न्यूनतम मासिक भुगतान जारी रखें।',
      'सारे अतिरिक्त पैसे सबसे छोटे कर्ज को खत्म करने में लगाएं।',
      'एक कर्ज पूरा होते ही उसकी किस्त की राशि अगले कर्ज में जोड़ दें।',
    ],
    proTip: 'क्रेडिट कार्ड का पूरा भुगतान करने के बाद उसकी लिमिट घटा दें ताकि दोबारा कर्ज में न फंसें।',
  },
  'sip-investing': {
    title: 'SIP: निरंतरता से बड़ी संपत्ति का निर्माण',
    tag: 'निवेश',
    readTime: '2 मिनट',
    summary: 'म्यूचुअल फंड में हर महीने एक निश्चित राशि लगाएं। मात्र ₹500/माह भी समय के साथ लाखों बन सकता है।',
    coreConcept: 'एसआईपी का अर्थ है बाजार के उतार-चढ़ाव की चिंता किए बिना हर महीने नियमित निवेश करना।',
    whyItMatters: 'निवेश शुरू करने के लिए लाखों की जरूरत नहीं होती। छोटी नियमित रकम चक्रवर्ती होकर बड़ी संपत्ति बनाती है।',
    actionSteps: [
      'एक अच्छे इंडेक्स फंड में ₹500-₹1000 प्रति माह से शुरुआत करें।',
      'सैलरी बढ़ने के साथ हर साल अपनी एसआईपी राशि में 10% की बढ़ोतरी करें।',
      'बाजार गिरने पर कभी एसआईपी न रोकें — उस समय यूनिट सस्ती मिलती हैं।',
      'दिनों या महीनों में नहीं, दशकों के नजरिए से सोचें।',
    ],
    proTip: '₹5,000 की मासिक SIP 12% औसत रिटर्न पर 20 साल में ₹50 लाख से अधिक बन जाती है।',
  },
  'credit-score': {
    title: 'क्रेडिट स्कोर: 750 से ऊपर कैसे रखें',
    tag: 'क्रेडिट स्वास्थ्य',
    readTime: '2 मिनट',
    summary: 'मजबूत सिबिल स्कोर के लिए सभी बिल समय पर चुकाएं और क्रेडिट कार्ड लिमिट का 30% से कम उपयोग करें।',
    coreConcept: 'क्रेडिट स्कोर (CIBIL) आपकी वित्तीय रिपोर्ट कार्ड है। बैंक इसी से तय करते हैं कि आप भरोसेमंद हैं या नहीं।',
    whyItMatters: '750 से अधिक स्कोर पर लोन पर कम ब्याज दर और बेहतर क्रेडिट कार्ड ऑफर्स मिलते हैं।',
    actionSteps: [
      'हर महीने क्रेडिट कार्ड बिल का पूरा भुगतान करें (सिर्फ मिनिमम ड्यू नहीं)।',
      'क्रेडिट कार्ड का उपयोग अपनी तय लिमिट के 30% से कम रखें।',
      'एक साथ कई लोन या कार्ड के लिए आवेदन न करें।',
      'हर 3 महीने में एक बार अपना मुफ्त सिबिल स्कोर चेक करें।',
    ],
    proTip: 'एक भी लेट पेमेंट आपके स्कोर को 50-100 अंक गिरा सकता है। ऑटो-डेबिट या रिमाइंडर लगाएं!',
  },
  'insurance-basics': {
    title: 'बीमा: निवेश करने से पहले सुरक्षा कवच',
    tag: 'सुरक्षा',
    readTime: '2 मिनट',
    summary: 'निवेश से पहले टर्म लाइफ और हेल्थ इंश्योरेंस लें। एक दुर्घटना पूरी जीवन भर की बचत खत्म कर सकती है।',
    coreConcept: 'बीमा निवेश नहीं है। यह आपके परिवार के लिए सुरक्षा कवच है।',
    whyItMatters: 'अस्पताल में भर्ती होने पर ₹3-5 लाख खर्च हो सकते हैं। बिना बीमा के लोग कर्ज में डूब जाते हैं।',
    actionSteps: [
      'अपने परिवार के लिए कम से कम ₹10 लाख का हेल्थ इंश्योरेंस लें।',
      'अपनी वार्षिक आय का 10 गुना प्योर टर्म इंश्योरेंस लें।',
      'बीमा और निवेश को कभी न मिलाएं — दोनों के अलग उद्देश्य हैं।',
      'हर 2 साल में अपनी बीमा जरूरतों की समीक्षा करें।',
    ],
    proTip: 'यूलिप और एंडोमेंट प्लान महंगे होते हैं। केवल प्योर टर्म इंश्योरेंस लें और बाकी पैसे म्यूचुअल फंड में लगाएं।',
  },
  'scam-awareness': {
    title: 'आम भारतीय वित्तीय घोटाले और बचाव',
    tag: 'घोटाला सुरक्षा',
    readTime: '3 मिनट',
    summary: 'ओटीपी फ्रॉड, फर्जी केवाईसी, फेक लोन ऐप्स और पोंजी स्कीमों से खुद को और परिवार को सुरक्षित रखें।',
    coreConcept: 'धोखेबाज आपको बिना सोचे-समझे कदम उठाने के लिए डर, लालच और जल्दबाजी का सहारा लेते हैं।',
    whyItMatters: 'भारत में हर साल ₹10,000 करोड़ से अधिक की वित्तीय धोखाधड़ी होती है। जागरूकता ही सर्वोत्तम सुरक्षा है।',
    actionSteps: [
      'ओटीपी फ्रॉड: कभी भी ओटीपी शेयर न करें, बैंक कभी फोन पर ओटीपी नहीं मांगते।',
      'केवाईसी फ्रॉड: अज्ञात नंबरों पर दस्तावेज न भेजें। केवल आधिकारिक शाखा या ऐप से अपडेट करें।',
      'फेक लोन ऐप: लोन मिलने से पहले कभी "प्रोसेसिंग फीस" न दें। असली बैंक लोन राशि से शुल्क काटते हैं।',
      'पोंजी स्कीमें: यदि 20%+ गारंटीड रिटर्न का वादा हो, तो वह शत-प्रतिशत घोटाला है।',
    ],
    proTip: 'यदि कोई जोखिम-मुक्त भारी मुनाफे का दावा करे, तो उसे तुरंत फ्रॉड समझें।',
  },
  'index-funds': {
    title: 'इंडेक्स फंड: नए निवेशकों के लिए श्रेष्ठ विकल्प',
    tag: 'निवेश',
    readTime: '2 मिनट',
    summary: 'इंडेक्स फंड पूरे बाजार को ट्रैक करते हैं। न्यूनतम शुल्क और बिना किसी स्टॉक रिसर्च के आसान निवेश।',
    coreConcept: 'इंडेक्स फंड निफ्टी 50 जैसी शीर्ष 50 कंपनियों के शेयरों को अपने आप खरीदता है।',
    whyItMatters: 'अधिकांश फंड मैनेजर 10 वर्षों में इंडेक्स को हराने में असफल रहते हैं। इंडेक्स फंड न्यूनतम लागत में बाजार का रिटर्न देते हैं।',
    actionSteps: [
      'निफ्टी 50 या सेंसेक्स इंडेक्स फंड से शुरुआत करें।',
      'रेगुलर प्लान के बजाय हमेशा डायरेक्ट प्लान चुनें (कम खर्च अनुपात)।',
      'एसआईपी के माध्यम से नियमित निवेश करें।',
      'कम से कम 10 वर्षों तक निवेशित रहें।',
    ],
    proTip: 'निफ्टी 50 में ₹10,000 की मासिक एसआईपी 30 वर्षों में 12% वार्षिक रिटर्न पर ₹10 करोड़ से अधिक बन सकती है।',
  },
  'epf-vs-ppf': {
    title: 'EPF बनाम PPF: आपके लिए कौन सा बेहतर है?',
    tag: 'निवेश',
    readTime: '2 मिनट',
    summary: 'दोनों सरकारी गारंटी वाली बचत योजनाएं हैं। ईपीएफ नौकरीपेशा के लिए है और पीपीएफ सबके लिए खुला है।',
    coreConcept: 'ईपीएफ वेतनभोगी कर्मचारियों के लिए स्वचालित है। पीपीएफ कोई भी व्यक्ति अपने बैंक खाते से खोल सकता है।',
    whyItMatters: 'ईपीएफ ~8.25% ब्याज नियोक्ता अंशदान के साथ देता है। पीपीएफ 15 साल के लॉक-इन के साथ ~7.1% देता है। दोनों पूर्णतः सुरक्षित हैं।',
    actionSteps: [
      'वेतनभोगी हैं तो ईपीएफ जारी रखें और संभव हो तो वीपीएफ के जरिए अंशदान बढ़ाएं।',
      'स्वरोजगार हैं या अतिरिक्त कर-मुक्त बचत चाहते हैं तो पीपीएफ खाता खोलें।',
      'दोनों धारा 80C के तहत ₹1.5 लाख तक कर छूट के पात्र हैं।',
      'जरूरी न हो तो 5 साल से पहले ईपीएफ से निकासी न करें।',
    ],
    proTip: 'जोखिम भरे निवेश से पहले ईपीएफ और पीपीएफ का पूरा उपयोग करें।',
  },
  'gold-investment': {
    title: 'सोना: क्या आपको निवेश करना चाहिए?',
    tag: 'निवेश',
    readTime: '2 मिनट',
    summary: 'सोना महंगाई से बचाव का माध्यम है, धन निर्माता नहीं। अपने पोर्टफोलियो का 5-10% हिस्सा ही सोने में रखें।',
    coreConcept: 'जब मुद्रा कमजोर होती है या बाजार गिरता है तो सोना मूल्य की रक्षा करता है, लेकिन यह इक्विटी की तरह वृद्धि नहीं करता।',
    whyItMatters: 'सोने ने दीर्घकाल में ~8-10% रिटर्न दिया है जो महंगाई के बराबर है। यह बीमा है, इंजन नहीं।',
    actionSteps: [
      'फिजिकल गोल्ड के बजाय सॉवरेन गोल्ड बॉन्ड (SGB) को प्राथमिकता दें — 2.5% अतिरिक्त ब्याज मिलता है।',
      'गोल्ड ईटीएफ सोने में निवेश का सबसे सस्ता और तरल तरीका है।',
      'कुल संपत्ति का केवल 5-10% हिस्सा सोने में रखें।',
      'सोने के गहनों को निवेश न मानें — मेकिंग चार्ज 20-30% मूल्य घटा देते हैं।',
    ],
    proTip: 'बाजार में घबराहट के समय सोना आपके वित्तीय अग्निशामक की तरह काम करता है।',
  },
  'stock-basics': {
    title: 'शुरुआती लोगों के लिए शेयर बाजार के बुनियादी नियम',
    tag: 'निवेश',
    readTime: '3 मिनट',
    summary: 'शेयर कंपनियों के मालिकाना हक का हिस्सा हैं। जानें कि छोटी रकम से सुरक्षित शुरुआत कैसे करें।',
    coreConcept: 'जब आप शेयर खरीदते हैं, तो आप उस कंपनी के छोटे हिस्सेदार बन जाते हैं। कंपनी बढ़ती है तो आपका निवेश बढ़ता है।',
    whyItMatters: 'भारत में इक्विटी ने लंबे समय में 12-15% वार्षिक रिटर्न दिया है जो एफडी, सोने और जमीन से अधिक है।',
    actionSteps: [
      'सेबी पंजीकृत ब्रोकर के साथ डीमैट खाता खोलें।',
      'ब्लूचिप कंपनियों (टीसीएस, एचडीएफसी, इंफोसिस) या इंडेक्स फंड से शुरुआत करें।',
      'आपातकालीन फंड का पैसा कभी शेयरों में न लगाएं।',
      'अल्पकालिक उतार-चढ़ाव को नजरअंदाज करें और सालों के नजरिए से सोचें।',
    ],
    proTip: 'जिस कंपनी का बिजनेस समझ न आए, उसका शेयर कभी न खरीदें। इंडेक्स फंड सबसे सुरक्षित विकल्प है।',
  },
  'retirement-planning': {
    title: 'रिटायरमेंट प्लानिंग: जितना जल्दी हो सके शुरुआत करें',
    tag: 'दीर्घकालिक',
    readTime: '2 मिनट',
    summary: 'जितनी जल्दी शुरुआत करेंगे, हर महीने उतनी ही कम बचत की जरूरत होगी। चक्रवृद्धि ब्याज 8वां अजूबा है।',
    coreConcept: '25 की उम्र में शुरू करने पर उसी फंड के लिए ₹5,000/माह लगते हैं, जबकि 35 पर ₹15,000/माह।',
    whyItMatters: 'चक्रवृद्धि को समय चाहिए। 12% रिटर्न पर 30 साल में ₹1 लाख ₹30 लाख बन जाते हैं, जबकि 20 साल में केवल ₹10 लाख।',
    actionSteps: [
      'अपने वार्षिक खर्च का 25 गुना रिटायरमेंट फंड का लक्ष्य रखें (4% नियम)।',
      'शुरुआत में इक्विटी में निवेश करें और रिटायरमेंट के पास आने पर डेट फंड में शिफ्ट करें।',
      'सैलरी बढ़ने के साथ हर साल एसआईपी 10% बढ़ाएं।',
      'रिटायरमेंट फंड से बीच में पैसे न निकालें।',
    ],
    proTip: '₹5,000 की मासिक एसआईपी 30 साल में 12% पर ₹1.76 करोड़ बन जाती है। आज से ही शुरुआत करें।',
  },
};

export default function AppMoneyGuidesPage() {
  const { language, t } = useI18n();
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  const getGuideData = (g: Guide) => {
    if (language === 'hi' && HINDI_TRANSLATIONS[g.id]) {
      const h = HINDI_TRANSLATIONS[g.id];
      return {
        ...g,
        title: h.title,
        tag: h.tag,
        readTime: h.readTime,
        summary: h.summary,
        fullBody: {
          coreConcept: h.coreConcept,
          whyItMatters: h.whyItMatters,
          actionSteps: h.actionSteps,
          proTip: h.proTip,
        },
      };
    }
    return g;
  };

  const activeGuide = selectedGuide ? getGuideData(selectedGuide) : null;

  return (
    <ModuleShell
      title={language === 'hi' ? 'धन मार्गदर्शिका (मनी गाइड्स)' : 'Money Guides'}
      category={language === 'hi' ? 'खर्च से पहले निर्णय' : 'Decide Before Spending'}
      description={
        language === 'hi'
          ? 'सरल वित्तीय नियम, आवंटन ब्लूप्रिंट, और भारतीय परिवारों के लिए विशेष रूप से डिज़ाइन किए गए साइबर-सुरक्षा प्रोटोकॉल।'
          : 'Jargon-free financial rules, allocation blueprints, and cyber-safety protocols designed for everyday Indian households.'
      }
    >
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {GUIDES.map((rawGuide) => {
            const g = getGuideData(rawGuide);
            return (
              <div
                key={g.id}
                className="bg-white dark:bg-[#16251E] border border-[#DCE4DC] dark:border-[#2A3D33] rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#173F2B] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      {g.tag}
                    </span>
                    <span className="text-xs font-mono font-medium text-[#4D5D51] dark:text-slate-400">
                      {g.readTime}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#173F2B] dark:text-emerald-300">
                    {g.title}
                  </h3>
                  <p className="text-xs font-medium text-[#2A4736] dark:text-slate-300 leading-relaxed">
                    {g.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#DCE4DC] dark:border-[var(--line)]">
                  <button
                    onClick={() => { setSelectedGuide(rawGuide); document.body.style.overflow = 'hidden'; }}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#EAF3E7] dark:bg-[#1A2C22] text-[#173F2B] dark:text-emerald-300 text-xs font-bold hover:bg-[#DCE7D9] transition-colors"
                  >
                    <span>{language === 'hi' ? 'पूर्ण एक्शन गाइड खोलें' : 'Open Full Action Guide'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail On Click Modal Dialog with Scroll Lock & Blur */}
      {activeGuide && (
        <Modal
          isOpen={!!selectedGuide}
          onClose={() => setSelectedGuide(null)}
          title={activeGuide.title}
        >
          <div className="space-y-5 text-sm">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#173F2B] dark:text-emerald-300 block mb-1">
                {language === 'hi' ? 'मुख्य सिद्धांत' : 'Core Principle'}
              </span>
              <p className="text-xs font-medium text-[#2A4736] dark:text-slate-200">
                {activeGuide.fullBody.coreConcept}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-sm text-[#173F2B] dark:text-slate-100 mb-1">
                {language === 'hi' ? 'यह आपकी संपत्ति की रक्षा क्यों करता है:' : 'Why this protects your wealth:'}
              </h4>
              <p className="text-xs text-[#2A4736] dark:text-slate-300 leading-relaxed">
                {activeGuide.fullBody.whyItMatters}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-sm text-[#173F2B] dark:text-slate-100">
                {language === 'hi' ? 'कार्रवाई के चरण:' : 'Action Steps:'}
              </h4>
              <ul className="space-y-2">
                {activeGuide.fullBody.actionSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-[#2A4736] dark:text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-2xl bg-[#F7FAF7] dark:bg-[#14231B] border border-[#DCE4DC] dark:border-[#2A3D33] text-xs">
              <span className="font-bold text-[#173F2B] dark:text-emerald-300 block mb-0.5">
                {language === 'hi' ? 'विशेष सलाह (प्रो-टिप):' : 'Pro-Tip:'}
              </span>
              <p className="text-[#2A4736] dark:text-slate-300">
                {activeGuide.fullBody.proTip}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => { setSelectedGuide(null); document.body.style.overflow = ''; }}
                className="px-5 py-2 rounded-xl bg-[#173F2B] text-white text-xs font-bold hover:bg-[#102F21] transition-colors"
              >
                {language === 'hi' ? 'गाइड बंद करें' : 'Close Guide'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ModuleShell>
  );
}

