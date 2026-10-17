import React from 'react';
import type { Language } from './i18n-context';

export interface PreSpendLabels {
  moduleTitle: string;
  moduleCategory: string;
  moduleDesc: string;
  simulatorTitle: string;
  hypotheticalBadge: string;
  itemLabel: string;
  itemPlaceholder: string;
  priceLabel: string;
  categoryLabel: string;
  illustrativeCapNote: string;
  verdictTitle: string;
  deficitRisk: string;
  safeToSpend: string;
  categoryAllocation: string;
  spentSoFar: string;
  availableCushionBefore: string;
  remainingCushionAfter: string;
  overrunWarningTitle: string;
  approvedCushionTitle: string;
  chargeAccountLabel: string;
  committing: string;
}

export const PRESPEND_I18N: Record<Language, PreSpendLabels> = {
  en: {
    moduleTitle: 'Pre-Spend Check',
    moduleCategory: 'Decide Before Spending',
    moduleDesc: 'Simulate potential purchases against your active category caps to preview budget impact before spending a single rupee.',
    simulatorTitle: 'Purchase Simulator',
    hypotheticalBadge: 'Hypothetical Simulation',
    itemLabel: 'Item / Expense Description',
    itemPlaceholder: 'e.g. Flight Tickets, Dinner, Headphones',
    priceLabel: 'Estimated Price (₹)',
    categoryLabel: 'Impacted Budget Category',
    illustrativeCapNote: 'Using illustrative category cap (₹10,000.00). Create active budgets in Module 2 for live syncing.',
    verdictTitle: 'Budget Impact Verdict',
    deficitRisk: 'Deficit Risk',
    safeToSpend: 'Safe to Spend',
    categoryAllocation: 'Category Allocation:',
    spentSoFar: 'Spent So Far:',
    availableCushionBefore: 'Available Cushion Before:',
    remainingCushionAfter: 'Remaining Cushion After:',
    overrunWarningTitle: 'Overrun Warning:',
    approvedCushionTitle: 'Approved Cushion:',
    chargeAccountLabel: 'Charge Account',
    committing: 'Committing...',
  },
  es: {
    moduleTitle: 'Verificación Pre-Gasto',
    moduleCategory: 'Decidir Antes de Gastar',
    moduleDesc: 'Simule compras potenciales contra sus límites presupuestarios para evaluar el impacto antes de gastar.',
    simulatorTitle: 'Simulador de Compra',
    hypotheticalBadge: 'Simulación Hipotética',
    itemLabel: 'Descripción del Artículo / Gasto',
    itemPlaceholder: 'p. ej. Billetes de avión, Cena, Auriculares',
    priceLabel: 'Precio Estimado (₹)',
    categoryLabel: 'Categoría de Presupuesto Afectada',
    illustrativeCapNote: 'Usando límite de categoría ilustrativo (₹10,000.00). Cree presupuestos activos en el Módulo 2.',
    verdictTitle: 'Veredicto de Impacto en Presupuesto',
    deficitRisk: 'Riesgo de Déficit',
    safeToSpend: 'Seguro para Gastar',
    categoryAllocation: 'Asignación de Categoría:',
    spentSoFar: 'Gastado Hasta Ahora:',
    availableCushionBefore: 'Margen Disponible Antes:',
    remainingCushionAfter: 'Margen Restante Después:',
    overrunWarningTitle: 'Advertencia de Sobregasto:',
    approvedCushionTitle: 'Margen Aprobado:',
    chargeAccountLabel: 'Cuenta de Cargo',
    committing: 'Registrando...',
  },
  hi: {
    moduleTitle: 'खर्च-पूर्व जांच',
    moduleCategory: 'खर्च करने से पहले निर्णय लें',
    moduleDesc: 'पैसे खर्च करने से पहले देखें कि किसी खरीदारी का आपके श्रेणी बजट और बचत पर क्या प्रभाव पड़ेगा।',
    simulatorTitle: 'खरीदारी सिम्युलेटर',
    hypotheticalBadge: 'काल्पनिक परीक्षण',
    itemLabel: 'वस्तु / खर्च का विवरण',
    itemPlaceholder: 'उदा. फ्लाइट टिकट, डिनर, हेडफ़ोन',
    priceLabel: 'अनुमानित मूल्य (₹)',
    categoryLabel: 'प्रभावित बजट श्रेणी',
    illustrativeCapNote: 'उदाहरण सीमा (₹10,000.00) का उपयोग किया जा रहा है। लाइव सिंक के लिए बजट मॉड्यूल में बजट बनाएं।',
    verdictTitle: 'बजट प्रभाव परिणाम',
    deficitRisk: 'घाटे का जोखिम',
    safeToSpend: 'खर्च करने के लिए सुरक्षित',
    categoryAllocation: 'श्रेणी आवंटन:',
    spentSoFar: 'अब तक का खर्च:',
    availableCushionBefore: 'उपलब्ध शेष राशि (पहले):',
    remainingCushionAfter: 'खरीदारी के बाद शेष राशि:',
    overrunWarningTitle: 'अति-व्यय चेतावनी:',
    approvedCushionTitle: 'स्वीकृत कुशन:',
    chargeAccountLabel: 'भुगतान खाता',
    committing: 'दर्ज हो रहा है...',
  },
  fr: {
    moduleTitle: 'Vérification Pré-Achat',
    moduleCategory: 'Décider Avant de Dépenser',
    moduleDesc: 'Simulez vos achats potentiels pour visualiser l’impact sur vos budgets de catégories avant d’engager la moindre dépense.',
    simulatorTitle: 'Simulateur d’Achat',
    hypotheticalBadge: 'Simulation Hypothétique',
    itemLabel: 'Description de l’Article / Dépense',
    itemPlaceholder: 'ex. Billets d’avion, Dîner, Écouteurs',
    priceLabel: 'Prix Estimé (₹)',
    categoryLabel: 'Catégorie Budgétaire Impactée',
    illustrativeCapNote: 'Plafond indicatif (₹10,000.00). Créez des budgets réels dans le Module 2.',
    verdictTitle: 'Verdict sur l’Impact Budgétaire',
    deficitRisk: 'Risque de Déficit',
    safeToSpend: 'Achat Sécurisé',
    categoryAllocation: 'Allocation de Catégorie :',
    spentSoFar: 'Dépensé Jusqu’ici :',
    availableCushionBefore: 'Marge Disponible Avant :',
    remainingCushionAfter: 'Marge Restante Après :',
    overrunWarningTitle: 'Avertissement de Dépassement :',
    approvedCushionTitle: 'Marge Approuvée :',
    chargeAccountLabel: 'Compte de Débit',
    committing: 'Enregistrement...',
  },
  de: {
    moduleTitle: 'Vorabausgaben-Check',
    moduleCategory: 'Vor der Ausgabe Entscheiden',
    moduleDesc: 'Simulieren Sie geplante Käufe gegen Ihre aktiven Kategorie-Obergrenzen, um Budgetauswirkungen vorab zu prüfen.',
    simulatorTitle: 'Kauf-Simulator',
    hypotheticalBadge: 'Hypothetische Simulation',
    itemLabel: 'Artikel- / Ausgabenbeschreibung',
    itemPlaceholder: 'z.B. Flugtickets, Abendessen, Kopfhörer',
    priceLabel: 'Geschätzter Preis (₹)',
    categoryLabel: 'Betroffene Budgetkategorie',
    illustrativeCapNote: 'Beispiel-Limit (₹10,000.00). Erstellen Sie Budgets in Modul 2 für Live-Abgleich.',
    verdictTitle: 'Ergebnis der Budgetauswirkung',
    deficitRisk: 'Defizitrisiko',
    safeToSpend: 'Sicher Auszugeben',
    categoryAllocation: 'Kategoriezuweisung:',
    spentSoFar: 'Bisher Ausgegeben:',
    availableCushionBefore: 'Verfügbarer Puffer Vorher:',
    remainingCushionAfter: 'Verbleibender Puffer Nachher:',
    overrunWarningTitle: 'Überziehungswarnung:',
    approvedCushionTitle: 'Genehmigter Puffer:',
    chargeAccountLabel: 'Belastungskonto',
    committing: 'Wird verbucht...',
  },
  zh: {
    moduleTitle: '消费前决策评估',
    moduleCategory: '支出前理性决策',
    moduleDesc: '在发生任何实际支出前，模拟计划消费对当期分类预算帽的冲击与影响。',
    simulatorTitle: '购买模拟器',
    hypotheticalBadge: '假设性测算',
    itemLabel: '物品 / 支出描述',
    itemPlaceholder: '例如：机票、晚餐、降噪耳机',
    priceLabel: '预估价格 (₹)',
    categoryLabel: '受影响的预算分类',
    illustrativeCapNote: '当前使用示范额度 (₹10,000.00)。请在模块 2 中创建活跃预算以实时同步。',
    verdictTitle: '预算影响裁定',
    deficitRisk: '超支赤字风险',
    safeToSpend: '安全可支出',
    categoryAllocation: '分类预算额度：',
    spentSoFar: '迄今已支出：',
    availableCushionBefore: '支出前可用缓冲：',
    remainingCushionAfter: '支出后剩余缓冲：',
    overrunWarningTitle: '超支预警：',
    approvedCushionTitle: '预算充裕：',
    chargeAccountLabel: '扣款账户',
    committing: '正在记账...',
  },
  ja: {
    moduleTitle: '事前支出チェック',
    moduleCategory: '支出前の意思決定',
    moduleDesc: '実際に支出する前に、計画中の買い物がカテゴリ予算枠に与える影響をシミュレーションします。',
    simulatorTitle: '購入シミュレーター',
    hypotheticalBadge: '仮想シミュレーション',
    itemLabel: '品目 / 支出の説明',
    itemPlaceholder: '例: 航空券、ディナー、ヘッドホン',
    priceLabel: '見積価格 (₹)',
    categoryLabel: '対象予算カテゴリ',
    illustrativeCapNote: '例示用予算枠 (₹10,000.00) を使用中。ライブ同期にはモジュール2で予算を作成してください。',
    verdictTitle: '予算影響の判定結果',
    deficitRisk: '赤字リスク',
    safeToSpend: '支出安全',
    categoryAllocation: 'カテゴリ割当額:',
    spentSoFar: 'これまでの支出:',
    availableCushionBefore: '支出前の残余クッション:',
    remainingCushionAfter: '支出後の残余クッション:',
    overrunWarningTitle: '予算超過の警告:',
    approvedCushionTitle: '承認された残枠:',
    chargeAccountLabel: '引落口座',
    committing: '記録中...',
  },
  ar: {
    moduleTitle: 'فحص ما قبل الإنفاق',
    moduleCategory: 'اتخاذ القرار قبل الشراء',
    moduleDesc: 'قم بمحاكاة النفقات المحتملة مقابل حدود الميزانية لمعاينة التأثير المالي قبل دفع فلس واحد.',
    simulatorTitle: 'محاكي الشراء',
    hypotheticalBadge: 'محاكاة افتراضية',
    itemLabel: 'وصف السلعة / النفقة',
    itemPlaceholder: 'مثال: تذاكر طيران، عشاء، سماعات رأس',
    priceLabel: 'السعر التقديري (₹)',
    categoryLabel: 'فئة الميزانية المتأثرة',
    illustrativeCapNote: 'استخدام سقف توضيحي (₹10,000.00). أنشئ ميزانيات نشطة في الوحدة 2 للمزامنة المباشرة.',
    verdictTitle: 'نتيجة تأثير الميزانية',
    deficitRisk: 'خطر العجز',
    safeToSpend: 'آمن للإنفاق',
    categoryAllocation: 'تخصيص الفئة:',
    spentSoFar: 'المنفق حتى الآن:',
    availableCushionBefore: 'الرصيد المتاح قبل:',
    remainingCushionAfter: 'الرصيد المتبقي بعد:',
    overrunWarningTitle: 'تحذير من تجاوز الميزانية:',
    approvedCushionTitle: 'رصيد معتمد:',
    chargeAccountLabel: 'حساب الخصم',
    committing: 'جارٍ التسجيل...',
  },
  bn: {
    moduleTitle: 'প্রাক-ব্যয় পরীক্ষা',
    moduleCategory: 'ব্যয় করার আগে সিদ্ধান্ত নিন',
    moduleDesc: 'একটি টাকা খরচ করার আগেই সক্রিয় ক্যাটাগরি বাজেটের ওপর সম্ভাব্য ক্রয়ের প্রভাব পরীক্ষা করুন।',
    simulatorTitle: 'ক্রয় সিমুলেটর',
    hypotheticalBadge: 'কাল্পনিক সিমুলেশন',
    itemLabel: 'আইটেম / ব্যয়ের বিবরণ',
    itemPlaceholder: 'উদাঃ বিমানের টিকিট, ডিনার, হেডফোন',
    priceLabel: 'আনুমানিক মূল্য (₹)',
    categoryLabel: 'প্রভাবিত বাজেট ক্যাটাগরি',
    illustrativeCapNote: 'দৃষ্টান্তমূলক সীমা (₹10,000.00) ব্যবহৃত হচ্ছে। লাইভ সিঙ্কের জন্য মডিউল ২ এ বাজেট তৈরি করুন।',
    verdictTitle: 'বাজেট প্রভাব ফলাফল',
    deficitRisk: 'ঘাটতির ঝুঁকি',
    safeToSpend: 'ব্যয় করা নিরাপদ',
    categoryAllocation: 'ক্যাটাগরি বরাদ্দ:',
    spentSoFar: 'এখনও পর্যন্ত ব্যয়:',
    availableCushionBefore: 'পূর্ববর্তী উপলব্ধ কুশন:',
    remainingCushionAfter: 'পরবর্তী অবশিষ্ট কুশন:',
    overrunWarningTitle: 'বাজেট অতিক্রমের সতর্কতা:',
    approvedCushionTitle: 'অনুমোদিত কুশন:',
    chargeAccountLabel: 'চার্জ অ্যাকাউন্ট',
    committing: 'নথিভুক্ত হচ্ছে...',
  },
  pt: {
    moduleTitle: 'Checagem Pré-Gasto',
    moduleCategory: 'Decidir Antes de Gastar',
    moduleDesc: 'Simule compras potenciais contra seus tetos de categoria para prever o impacto orçamentário antes de gastar.',
    simulatorTitle: 'Simulador de Compras',
    hypotheticalBadge: 'Simulação Hipotética',
    itemLabel: 'Descrição do Item / Despesa',
    itemPlaceholder: 'ex.: Passagens aéreas, Jantar, Fones de ouvido',
    priceLabel: 'Preço Estimado (₹)',
    categoryLabel: 'Categoria de Orçamento Afetada',
    illustrativeCapNote: 'Usando teto ilustrativo (₹10,000.00). Crie orçamentos ativos no Módulo 2 para sincronização.',
    verdictTitle: 'Veredito de Impacto Orçamentário',
    deficitRisk: 'Risco de Déficit',
    safeToSpend: 'Seguro para Gastar',
    categoryAllocation: 'Alocação da Categoria:',
    spentSoFar: 'Gasto Até Agora:',
    availableCushionBefore: 'Margem Disponível Antes:',
    remainingCushionAfter: 'Margem Restante Depois:',
    overrunWarningTitle: 'Aviso de Sobregasto:',
    approvedCushionTitle: 'Margem Aprovada:',
    chargeAccountLabel: 'Conta de Débito',
    committing: 'Registrando...',
  },
  ru: {
    moduleTitle: 'Проверка до покупки',
    moduleCategory: 'Принятие решений до трат',
    moduleDesc: 'Смоделируйте влияние покупки на лимит бюджета категории перед тем, как потратить деньги.',
    simulatorTitle: 'Симулятор покупок',
    hypotheticalBadge: 'Гипотетическая симуляция',
    itemLabel: 'Описание товара / траты',
    itemPlaceholder: 'напр. Авиабилеты, Ужин, Наушники',
    priceLabel: 'Ориентировочная цена (₹)',
    categoryLabel: 'Затрагиваемая категория бюджета',
    illustrativeCapNote: 'Используется примерный лимит (₹10,000.00). Создайте бюджеты в Модуле 2 для синхронизации.',
    verdictTitle: 'Вердикт о влиянии на бюджет',
    deficitRisk: 'Риск дефицита',
    safeToSpend: 'Безопасно для траты',
    categoryAllocation: 'Выделено на категорию:',
    spentSoFar: 'Потрачено на данный момент:',
    availableCushionBefore: 'Доступный запас до:',
    remainingCushionAfter: 'Остаток запаса после:',
    overrunWarningTitle: 'Предупреждение о перерасходе:',
    approvedCushionTitle: 'Одобренный запас:',
    chargeAccountLabel: 'Счет для списания',
    committing: 'Запись...',
  },
  it: {
    moduleTitle: 'Controllo Pre-Acquisto',
    moduleCategory: 'Decidi Prima di Spendere',
    moduleDesc: 'Simula gli acquisti pianificati rispetto ai tuoi tetti di categoria per verificare l’impatto prima di pagare.',
    simulatorTitle: 'Simulatore di Spesa',
    hypotheticalBadge: 'Simulazione Ipotetica',
    itemLabel: 'Descrizione Voce / Spesa',
    itemPlaceholder: 'es. Biglietti aerei, Cena, Cuffie',
    priceLabel: 'Prezzo Stimato (₹)',
    categoryLabel: 'Categoria di Budget Coinvolta',
    illustrativeCapNote: 'Uso del tetto illustrativo (₹10,000.00). Crea budget attivi nel Modulo 2 per sincronizzare.',
    verdictTitle: 'Verdetto Impatto Budget',
    deficitRisk: 'Rischio Disavanzo',
    safeToSpend: 'Sicuro da Spendere',
    categoryAllocation: 'Allocazione Categoria:',
    spentSoFar: 'Speso Finora:',
    availableCushionBefore: 'Margine Disponibile Prima:',
    remainingCushionAfter: 'Margine Rimanente Dopo:',
    overrunWarningTitle: 'Avviso di Superamento:',
    approvedCushionTitle: 'Margine Approvato:',
    chargeAccountLabel: 'Conto di Addebito',
    committing: 'Registrazione...',
  },
  ko: {
    moduleTitle: '지출 전 사전 점검',
    moduleCategory: '지출 전 의사결정',
    moduleDesc: '실제 지출하기 전에 이번 달 카테고리 예산 한도에 미치는 영향을 미리 시뮬레이션합니다.',
    simulatorTitle: '구매 시뮬레이터',
    hypotheticalBadge: '가상 시뮬레이션',
    itemLabel: '항목 / 지출 내역',
    itemPlaceholder: '예: 항공권, 저녁 식사, 헤드폰',
    priceLabel: '예상 금액 (₹)',
    categoryLabel: '영향을 받는 예산 카테고리',
    illustrativeCapNote: '예시 한도(₹10,000.00) 사용 중입니다. 실시간 동기화를 위해 모듈 2에서 예산을 생성하세요.',
    verdictTitle: '예산 영향 진단 결과',
    deficitRisk: '적자 위험',
    safeToSpend: '지출 가능',
    categoryAllocation: '카테고리 할당액:',
    spentSoFar: '현재까지 지출액:',
    availableCushionBefore: '지출 전 가용 쿠션:',
    remainingCushionAfter: '지출 후 잔여 쿠션:',
    overrunWarningTitle: '예산 초과 경고:',
    approvedCushionTitle: '승인된 여유 자금:',
    chargeAccountLabel: '결제 계좌',
    committing: '기록 중...',
  },
  ta: {
    moduleTitle: 'செலவுக்கு முந்தைய சரிபார்ப்பு',
    moduleCategory: 'செலவழிக்கும் முன் முடிவு எடுங்கள்',
    moduleDesc: 'ஒரு ரூபாய் செலவழிக்கும் முன்பே உங்கள் பட்ஜெட் மீது ஒரு வாங்குதலின் தாக்கத்தை உருவகப்படுத்திப் பாருங்கள்.',
    simulatorTitle: 'வாங்குதல் சிமுலேட்டர்',
    hypotheticalBadge: 'கருதுகோள் உருவகப்படுத்துதல்',
    itemLabel: 'பொருள் / செலவு விவரம்',
    itemPlaceholder: 'எ.கா. விமான டிக்கெட், இரவு உணவு, ஹெட்ஃபோன்கள்',
    priceLabel: 'மதிப்பிடப்பட்ட விலை (₹)',
    categoryLabel: 'பாதிக்கப்படும் பட்ஜெட் பிரிவு',
    illustrativeCapNote: 'மாதிரி வரம்பு (₹10,000.00) பயன்படுத்தப்படுகிறது. நேரலை இணைப்பிற்கு தொகுதி 2 இல் பட்ஜெட்டை உருவாக்கவும்.',
    verdictTitle: 'பட்ஜெட் தாக்க தீர்ப்பு',
    deficitRisk: 'பற்றாக்குறை ஆபத்து',
    safeToSpend: 'செலவிட பாதுகாப்பானது',
    categoryAllocation: 'பிரிவு ஒதுக்கீடு:',
    spentSoFar: 'இதுவரை செலவு:',
    availableCushionBefore: 'முந்தைய இருப்பு:',
    remainingCushionAfter: 'வாங்கிய பின் மீதம்:',
    overrunWarningTitle: 'செலவு வரம்பு எச்சரிக்கை:',
    approvedCushionTitle: 'அங்கீகரிக்கப்பட்ட இருப்பு:',
    chargeAccountLabel: 'கட்டணக் கணக்கு',
    committing: 'பதிவாகிறது...',
  },
  te: {
    moduleTitle: 'ఖర్చుకు ముందు తనిఖీ',
    moduleCategory: 'ఖర్చు చేయడానికి ముందే నిర్ణయించండి',
    moduleDesc: 'ఒక్క రూపాయి కూడా ఖర్చు చేయడానికి ముందే మీ వర్గం బడ్జెట్‌పై కొనుగోలు ప్రభావాన్ని అంచనా వేయండి.',
    simulatorTitle: 'కొనుగోలు సిమ్యులేటర్',
    hypotheticalBadge: 'ఊహాత్మక అనుకరణ',
    itemLabel: 'వస్తువు / ఖర్చు వివరణ',
    itemPlaceholder: 'ఉదా: విమాన టిక్కెట్లు, డిన్నర్, హెడ్‌ఫోన్లు',
    priceLabel: 'అంచనా ధర (₹)',
    categoryLabel: 'ప్రభావిత బడ్జెట్ వర్గం',
    illustrativeCapNote: 'ఉదాహరణ పరిమితి (₹10,000.00) ఉపయోగించబడుతోంది. లైవ్ సింక్ కోసం మాడ్యూల్ 2లో బడ్జెట్లను సృష్టించండి.',
    verdictTitle: 'బడ్జెట్ ప్రభావ ఫలితం',
    deficitRisk: 'లోటు ప్రమాదం',
    safeToSpend: 'ఖర్చు చేయడం సురక్షితం',
    categoryAllocation: 'వర్గం కేటాయింపు:',
    spentSoFar: 'ఇప్పటివరకు ఖర్చు:',
    availableCushionBefore: 'ముందు లభ్యమైన బఫర్:',
    remainingCushionAfter: 'తరువాత మిగిలిన బఫర్:',
    overrunWarningTitle: 'ఖర్చు పరిమితి హెచ్చరిక:',
    approvedCushionTitle: 'ఆమోదించబడిన బఫర్:',
    chargeAccountLabel: 'ఛార్జ్ ఖాతా',
    committing: 'నమోదవుతోంది...',
  },
  mr: {
    moduleTitle: 'खर्चापूर्वी तपासणी',
    moduleCategory: 'खर्च करण्यापूर्वी निर्णय घ्या',
    moduleDesc: 'पैसे खर्च करण्यापूर्वी खरेदीचा तुमच्या श्रेणी बजेटवर काय परिणाम होईल ते सिम्युलेट करा.',
    simulatorTitle: 'खरेदी सिम्युलेटर',
    hypotheticalBadge: 'काल्पनिक चाचणी',
    itemLabel: 'वस्तू / खर्चाचा तपशील',
    itemPlaceholder: 'उदा. विमानाचे तिकीट, डिनर, हेडफोन्स',
    priceLabel: 'अंदाजे किंमत (₹)',
    categoryLabel: 'प्रभावित बजेट श्रेणी',
    illustrativeCapNote: 'उदाहरणादाखल मर्यादा (₹10,000.00) वापरली जात आहे. थेट सिंकसाठी मॉड्यूल २ मध्ये बजेट तयार करा.',
    verdictTitle: 'बजेट प्रभाव निकाल',
    deficitRisk: 'तुटवड्याचा धोका',
    safeToSpend: 'खर्चासाठी सुरक्षित',
    categoryAllocation: 'श्रेणी वाटप:',
    spentSoFar: 'आत्तापर्यंतचा खर्च:',
    availableCushionBefore: 'खर्चापूर्वी उपलब्ध शिल्लक:',
    remainingCushionAfter: 'खरेदीनंतर शिल्लक रक्कम:',
    overrunWarningTitle: 'जास्त खर्चाचा इशारा:',
    approvedCushionTitle: 'मंजूर शिल्लक:',
    chargeAccountLabel: 'खर्चाचे खाते',
    committing: 'नोंदवले जात आहे...',
  },
  gu: {
    moduleTitle: 'ખર્ચ પહેલાં તપાસ',
    moduleCategory: 'ખર્ચ કરતાં પહેલાં નિર્ણય લો',
    moduleDesc: 'એક રૂપિયો પણ ખર્ચતા પહેલાં તમારા કેટેગરી બજેટ પર ખરીદીની અસરનું પૂર્વાવલોકન કરો.',
    simulatorTitle: 'ખરીદી સિમ્યુલેટર',
    hypotheticalBadge: 'કાલ્પનિક ચકાસણી',
    itemLabel: 'વસ્તુ / ખર્ચની વિગત',
    itemPlaceholder: 'દા.ત. ફ્લાઇટ ટિકિટ, ડિનર, હેડફોન',
    priceLabel: 'અંદાજિત કિંમત (₹)',
    categoryLabel: 'અસરગ્રસ્ત બજેટ કેટેગરી',
    illustrativeCapNote: 'ઉદાહરણ મર્યાદા (₹10,000.00) નો ઉપયોગ થઈ રહ્યો છે. લાઇવ સિંક માટે મોડ્યુલ 2 માં બજેટ બનાવો.',
    verdictTitle: 'બજેટ અસર પરિણામ',
    deficitRisk: 'ખાધનું જોખમ',
    safeToSpend: 'ખર્ચવા માટે સલામત',
    categoryAllocation: 'કેટેગરી ફાળવણી:',
    spentSoFar: 'અત્યાર સુધીનો ખર્ચ:',
    availableCushionBefore: 'પહેલાં ઉપલબ્ધ કુશન:',
    remainingCushionAfter: 'ખરીદી પછી બાકી કુશન:',
    overrunWarningTitle: 'ઓવરરન ચેતવણી:',
    approvedCushionTitle: 'મંજૂર કુશન:',
    chargeAccountLabel: 'ચાર્જ ખાતું',
    committing: 'નોંધાઈ રહ્યું છે...',
  },
  kn: {
    moduleTitle: 'ಖರ್ಚು ಪೂರ್ವ ಪರಿಶೀಲನೆ',
    moduleCategory: 'ಖರ್ಚು ಮಾಡುವ ಮೊದಲು ನಿರ್ಧರಿಸಿ',
    moduleDesc: 'ಒಂದು ರೂಪಾಯಿ ಖರ್ಚು ಮಾಡುವ ಮೊದಲು ಸಕ್ರಿಯ ಬಜೆಟ್ ಮಿತಿಗಳ ಮೇಲೆ ಖರೀದಿಯ ಪರಿಣಾಮವನ್ನು ಪರೀಕ್ಷಿಸಿ.',
    simulatorTitle: 'ಖರೀದಿ ಸಿಮ್ಯುಲೇಟರ್',
    hypotheticalBadge: 'ಕಾಲ್ಪನಿಕ ಸಿಮ್ಯುಲೇಶನ್',
    itemLabel: 'ವಸ್ತು / ವೆಚ್ಚದ ವಿವರ',
    itemPlaceholder: 'ಉದಾ: ವಿಮಾನ ಟಿಕೆಟ್‌ಗಳು, ಡಿನ್ನರ್, ಹೆಡ್‌ಫೋನ್‌ಗಳು',
    priceLabel: 'ಅಂದಾಜು ಬೆಲೆ (₹)',
    categoryLabel: 'ಬಾಧಿತ ಬಜೆಟ್ ವರ್ಗ',
    illustrativeCapNote: 'ಮಾದರಿ ಮಿತಿ (₹10,000.00) ಬಳಸಲಾಗುತ್ತಿದೆ. ಲೈವ್ ಸಿಂಕ್‌ಗಾಗಿ ಮಾಡ್ಯೂಲ್ 2 ರಲ್ಲಿ ಬಜೆಟ್ ರಚಿಸಿ.',
    verdictTitle: 'ಬಜೆಟ್ ಪ್ರಭಾವ ತೀರ್ಪು',
    deficitRisk: 'ಕೊರತೆಯ ಅಪಾಯ',
    safeToSpend: 'ಖರ್ಚು ಮಾಡಲು ಸುರಕ್ಷಿತ',
    categoryAllocation: 'ವರ್ಗ ಹಂಚಿಕೆ:',
    spentSoFar: 'ಇಲ್ಲಿಯವರೆಗೆ ಖರ್ಚು:',
    availableCushionBefore: 'ಮೊದಲು ಲಭ್ಯವಿರುವ ಬಫರ್:',
    remainingCushionAfter: 'ನಂತರ ಉಳಿದ ಬಫರ್:',
    overrunWarningTitle: 'ಬಜೆಟ್ ಮೀರಿದ ಎಚ್ಚರಿಕೆ:',
    approvedCushionTitle: 'ಅನುಮೋದಿತ ಬಫರ್:',
    chargeAccountLabel: 'ಖರ್ಚು ಖಾತೆ',
    committing: 'ದಾಖಲಾಗುತ್ತಿದೆ...',
  },
};

export function renderOverrunWarning(
  lang: Language,
  itemDescription: string,
  formattedAmount: string,
  formattedOverrun: string
): React.ReactNode {
  switch (lang) {
    case 'hi':
      return (
        <>
          <em>{itemDescription}</em> पर <strong>{formattedAmount}</strong> खर्च करने से इस श्रेणी में{' '}
          <strong>{formattedOverrun}</strong> का घाटा होगा। इसे स्थगित करने या बजट समायोजित करने पर विचार करें।
        </>
      );
    case 'es':
      return (
        <>
          Gastar <strong>{formattedAmount}</strong> en <em>{itemDescription}</em> provocará un déficit de{' '}
          <strong>{formattedOverrun}</strong> en esta categoría. Considere posponer o reajustar el presupuesto.
        </>
      );
    case 'fr':
      return (
        <>
          Dépenser <strong>{formattedAmount}</strong> pour <em>{itemDescription}</em> entraînera un déficit de{' '}
          <strong>{formattedOverrun}</strong> dans cette catégorie. Envisagez de différer ou de rééquilibrer.
        </>
      );
    case 'de':
      return (
        <>
          Eine Ausgabe von <strong>{formattedAmount}</strong> für <em>{itemDescription}</em> führt zu einem Defizit von{' '}
          <strong>{formattedOverrun}</strong> in dieser Kategorie. Ziehen Sie eine Verschiebung in Betracht.
        </>
      );
    case 'zh':
      return (
        <>
          在 <em>{itemDescription}</em> 上支出 <strong>{formattedAmount}</strong> 将导致该分类超支{' '}
          <strong>{formattedOverrun}</strong>。建议延后购买或调整预算。
        </>
      );
    case 'ja':
      return (
        <>
          <em>{itemDescription}</em> に <strong>{formattedAmount}</strong> を支出すると、このカテゴリで{' '}
          <strong>{formattedOverrun}</strong> の赤字が発生します。延期または予算調整をご検討ください。
        </>
      );
    case 'ar':
      return (
        <>
          إنفاق <strong>{formattedAmount}</strong> على <em>{itemDescription}</em> سيؤدي إلى عجز قدره{' '}
          <strong>{formattedOverrun}</strong> في هذه الفئة. يُنصح بتأجيل الشراء أو تعديل الميزانية.
        </>
      );
    case 'bn':
      return (
        <>
          <em>{itemDescription}</em>-এ <strong>{formattedAmount}</strong> ব্যয় করলে এই ক্যাটাগরিতে{' '}
          <strong>{formattedOverrun}</strong> ঘাটতি তৈরি হবে। এটি স্থগিত বা বাজেট সমন্বয় বিবেচনা করুন।
        </>
      );
    case 'pt':
      return (
        <>
          Gastar <strong>{formattedAmount}</strong> em <em>{itemDescription}</em> causará um déficit de{' '}
          <strong>{formattedOverrun}</strong> nesta categoria. Considere adiar ou reajustar o orçamento.
        </>
      );
    case 'ru':
      return (
        <>
          Трата <strong>{formattedAmount}</strong> на <em>{itemDescription}</em> приведет к дефициту в{' '}
          <strong>{formattedOverrun}</strong> в этой категории. Рассмотрите перенос или перераспределение.
        </>
      );
    case 'it':
      return (
        <>
          Spendere <strong>{formattedAmount}</strong> per <em>{itemDescription}</em> causerà un disavanzo di{' '}
          <strong>{formattedOverrun}</strong> in questa categoria. Considera di posticipare o riequilibrare il budget.
        </>
      );
    case 'ko':
      return (
        <>
          <em>{itemDescription}</em>에 <strong>{formattedAmount}</strong>을(를) 지출하면 이 카테고리에서{' '}
          <strong>{formattedOverrun}</strong>의 적자가 발생합니다. 연기하거나 예산 조정을 고려하세요.
        </>
      );
    case 'ta':
      return (
        <>
          <em>{itemDescription}</em> மீது <strong>{formattedAmount}</strong> செலவிடுவது இந்த பிரிவில்{' '}
          <strong>{formattedOverrun}</strong> பற்றாக்குறையை ஏற்படுத்தும். தள்ளிவைக்க அல்லது பட்ஜெட்டை மாற்றியமைக்க பரிசீலிக்கவும்.
        </>
      );
    case 'te':
      return (
        <>
          <em>{itemDescription}</em> పై <strong>{formattedAmount}</strong> ఖర్చు చేయడం వల్ల ఈ వర్గంలో{' '}
          <strong>{formattedOverrun}</strong> లోటు ఏర్పడుతుంది. వాయిదా వేయడం లేదా బడ్జెట్ సర్దుబాటు చేయడం ఆలోచించండి.
        </>
      );
    case 'mr':
      return (
        <>
          <em>{itemDescription}</em> वर <strong>{formattedAmount}</strong> खर्च केल्याने या श्रेणीत{' '}
          <strong>{formattedOverrun}</strong> तुटवडा निर्माण होईल. ही खरेदी पुढे ढकलण्याचा किंवा बजेट जुळवून घेण्याचा विचार करा.
        </>
      );
    case 'gu':
      return (
        <>
          <em>{itemDescription}</em> પર <strong>{formattedAmount}</strong> ખર્ચ કરવાથી આ કેટેગરીમાં{' '}
          <strong>{formattedOverrun}</strong> ની ખોટ થશે. તેને મુલતવી રાખવા અથવા બજેટ એડજસ્ટ કરવા વિચારો.
        </>
      );
    case 'kn':
      return (
        <>
          <em>{itemDescription}</em> ಮೇಲೆ <strong>{formattedAmount}</strong> ಖರ್ಚು ಮಾಡುವುದರಿಂದ ಈ ವರ್ಗದಲ್ಲಿ{' '}
          <strong>{formattedOverrun}</strong> ಕೊರತೆ ಉಂಟಾಗುತ್ತದೆ. ಮುಂದೂಡಲು ಅಥವಾ ಬಜೆಟ್ ಹೊಂದಿಸಲು ಪರಿಶೀಲಿಸಿ.
        </>
      );
    case 'en':
    default:
      return (
        <>
          Spending <strong>{formattedAmount}</strong> on <em>{itemDescription}</em> causes a{' '}
          <strong>{formattedOverrun}</strong> deficit in this category. Consider deferring or rebalancing.
        </>
      );
  }
}

export function renderApprovedCushion(
  lang: Language,
  formattedRemaining: string
): React.ReactNode {
  switch (lang) {
    case 'hi':
      return (
        <>
          यह योजनाबद्ध खर्च आपके श्रेणी बजट में पूरी तरह फिट बैठता है, और चक्र के लिए{' '}
          <strong>{formattedRemaining}</strong> शेष बचेंगे।
        </>
      );
    case 'es':
      return (
        <>
          Esta compra planificada se ajusta a su presupuesto de categoría, dejando{' '}
          <strong>{formattedRemaining}</strong> de margen para el ciclo.
        </>
      );
    case 'fr':
      return (
        <>
          Cet achat prévu s&apos;intègre parfaitement dans votre budget de catégorie, laissant une marge de{' '}
          <strong>{formattedRemaining}</strong> pour le cycle.
        </>
      );
    case 'de':
      return (
        <>
          Dieser geplante Kauf passt perfekt in Ihr Kategoriebudget und lässt einen Puffer von{' '}
          <strong>{formattedRemaining}</strong> für den Zyklus.
        </>
      );
    case 'zh':
      return (
        <>
          此项计划支出完全符合您的分类预算，本周期仍有{' '}
          <strong>{formattedRemaining}</strong> 的充裕结余。
        </>
      );
    case 'ja':
      return (
        <>
          この計画支出はカテゴリ予算内に収まっており、サイクル中に{' '}
          <strong>{formattedRemaining}</strong> の余裕が残ります。
        </>
      );
    case 'ar':
      return (
        <>
          تتناسب هذه النفقات المخططة تمامًا مع ميزانية الفئة، مع بقاء رصيد قدره{' '}
          <strong>{formattedRemaining}</strong> للدورة.
        </>
      );
    case 'bn':
      return (
        <>
          এই পরিকল্পিত ব্যয়টি আপনার ক্যাটাগরি বাজেটের মধ্যে সম্পূর্ণ মানানসই, সাইকেলের জন্য{' '}
          <strong>{formattedRemaining}</strong> বাফার অবশিষ্ট থাকবে।
        </>
      );
    case 'pt':
      return (
        <>
          Esta compra planejada cabe perfeitamente no seu orçamento, restando{' '}
          <strong>{formattedRemaining}</strong> de margem para o ciclo.
        </>
      );
    case 'ru':
      return (
        <>
          Эта запланированная покупка полностью укладывается в бюджет категории, оставляя запас в{' '}
          <strong>{formattedRemaining}</strong> на этот период.
        </>
      );
    case 'it':
      return (
        <>
          Questo acquisto programmato rientra perfettamente nel budget di categoria, lasciando un margine di{' '}
          <strong>{formattedRemaining}</strong> per il ciclo.
        </>
      );
    case 'ko':
      return (
        <>
          이 계획된 지출은 카테고리 예산에 깔끔하게 맞으며, 이번 주기에{' '}
          <strong>{formattedRemaining}</strong>의 여유가 남습니다.
        </>
      );
    case 'ta':
      return (
        <>
          இந்த திட்டமிட்ட செலவு உங்கள் பட்ஜெட்டுக்குள் பொருந்துகிறது,{' '}
          <strong>{formattedRemaining}</strong> மீதம் இருக்கும்.
        </>
      );
    case 'te':
      return (
        <>
          ఈ ప్రణాళికాబద్ధమైన ఖర్చు మీ కేటగిరీ బడ్జెట్‌కు సరిగ్గా సరిపోతుంది, సైకిల్ కోసం{' '}
          <strong>{formattedRemaining}</strong> బఫర్ మిగులుతుంది.
        </>
      );
    case 'mr':
      return (
        <>
          हा नियोजित खर्च तुमच्या श्रेणी बजेटमध्ये योग्य बसतो आणि चक्रासाठी{' '}
          <strong>{formattedRemaining}</strong> शिल्लक राहतील.
        </>
      );
    case 'gu':
      return (
        <>
          આ આયોજિત ખરીદી તમારા કેટેગરી બજેટમાં યોગ્ય રીતે બંધબેસે છે, સાયકલ માટે{' '}
          <strong>{formattedRemaining}</strong> બચશે.
        </>
      );
    case 'kn':
      return (
        <>
          ಈ ಯೋಜಿತ ಖರೀದಿಯು ನಿಮ್ಮ ವರ್ಗ ಬಜೆಟ್‌ಗೆ ಸಂಪೂರ್ಣ ಹೊಂದಿಕೊಳ್ಳುತ್ತದೆ, ಚಕ್ರಕ್ಕಾಗಿ{' '}
          <strong>{formattedRemaining}</strong> ಉಳಿಯುತ್ತದೆ.
        </>
      );
    case 'en':
    default:
      return (
        <>
          This planned purchase fits cleanly within your category budget, leaving{' '}
          <strong>{formattedRemaining}</strong> cushion for the cycle.
        </>
      );
  }
}

export function getCommitBtnText(lang: Language, formattedAmount: string): string {
  switch (lang) {
    case 'hi': return `लेजर में खर्च दर्ज करें (${formattedAmount})`;
    case 'es': return `Registrar compra en el libro (${formattedAmount})`;
    case 'fr': return `Enregistrer l'achat dans le grand livre (${formattedAmount})`;
    case 'de': return `Kauf im Hauptbuch verbuchen (${formattedAmount})`;
    case 'zh': return `将支出记入账本 (${formattedAmount})`;
    case 'ja': return `台帳に支出を記録 (${formattedAmount})`;
    case 'ar': return `تسجيل الشراء في دفتر الحسابات (${formattedAmount})`;
    case 'bn': return `লেজারে খরচ যোগ করুন (${formattedAmount})`;
    case 'pt': return `Registrar compra no razão (${formattedAmount})`;
    case 'ru': return `Записать покупку в книгу учета (${formattedAmount})`;
    case 'it': return `Registra acquisto nel mastro (${formattedAmount})`;
    case 'ko': return `원장에 지출 기록 (${formattedAmount})`;
    case 'ta': return `பேரேட்டில் செலவை பதிவு செய் (${formattedAmount})`;
    case 'te': return `లెడ్జర్‌లో ఖర్చు నమోదు చేయండి (${formattedAmount})`;
    case 'mr': return `लेजरमध्ये खर्च नोंदवा (${formattedAmount})`;
    case 'gu': return `લેજરમાં ખરીદી નોંધો (${formattedAmount})`;
    case 'kn': return `ಲೆಡ್ಜರ್‌ನಲ್ಲಿ ವೆಚ್ಚ ದಾಖಲಿಸಿ (${formattedAmount})`;
    case 'en':
    default:
      return `Commit Purchase to Ledger (${formattedAmount})`;
  }
}

export function getCommitSuccessMessage(lang: Language, formattedAmount: string, categoryName: string): string {
  switch (lang) {
    case 'hi': return `${formattedAmount} को ${categoryName} बजट में दर्ज कर दिया गया है।`;
    case 'es': return `Se registraron ${formattedAmount} en el presupuesto de ${categoryName}.`;
    case 'fr': return `${formattedAmount} imputés au budget ${categoryName}.`;
    case 'de': return `${formattedAmount} in das Budget ${categoryName} gebucht.`;
    case 'zh': return `已将 ${formattedAmount} 记入 ${categoryName} 预算。`;
    case 'ja': return `${formattedAmount} を ${categoryName} 予算に計上しました。`;
    case 'ar': return `تم تسجيل ${formattedAmount} في ميزانية ${categoryName}.`;
    case 'bn': return `${categoryName} বাজেটে ${formattedAmount} সফলভাবে নথিভুক্ত হয়েছে।`;
    case 'pt': return `${formattedAmount} registrados no orçamento de ${categoryName}.`;
    case 'ru': return `Записано ${formattedAmount} в бюджет «${categoryName}».`;
    case 'it': return `Registrati ${formattedAmount} nel budget ${categoryName}.`;
    case 'ko': return `${categoryName} 예산에 ${formattedAmount}을(를) 기록했습니다.`;
    case 'ta': return `${categoryName} பட்ஜெட்டில் ${formattedAmount} பதிவு செய்யப்பட்டது.`;
    case 'te': return `${categoryName} బడ్జెట్‌లో ${formattedAmount} నమోదు చేయబడింది.`;
    case 'mr': return `${categoryName} बजेटमध्ये ${formattedAmount} नोंदवले गेले.`;
    case 'gu': return `${categoryName} બજેટમાં ${formattedAmount} નોંધાયા.`;
    case 'kn': return `${categoryName} ಬಜೆಟ್‌ಗೆ ${formattedAmount} ದಾಖಲಿಸಲಾಗಿದೆ.`;
    case 'en':
    default:
      return `Committed ${formattedAmount} to ${categoryName} budget.`;
  }
}
