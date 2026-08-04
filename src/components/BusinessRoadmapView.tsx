import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Building2, 
  Globe, 
  Award, 
  BarChart3, 
  PieChart, 
  Briefcase, 
  Key, 
  Layers, 
  FileText, 
  Sparkles, 
  Rocket, 
  Coins, 
  ArrowRight,
  HelpCircle,
  Users,
  Target,
  BadgeCheck,
  Smartphone,
  Mail,
  Scale
} from 'lucide-react';

interface BusinessRoadmapViewProps {
  lang: 'en' | 'bn';
}

export const BusinessRoadmapView: React.FC<BusinessRoadmapViewProps> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'valuation' | 'monetization' | 'licensing' | 'market'>('overview');

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-indigo-500/20 to-amber-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-100">
                  {lang === 'bn' 
                    ? 'পে-রুট বিজনেস রোডম্যাপ, ভ্যালুয়েশন ও লাইসেন্সিং গাইড' 
                    : 'PayRoute Business Roadmap, Valuation & Licensing Guide'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  FINTECH COMMERCIAL RESEARCH
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {lang === 'bn'
                  ? 'আমাদের পে-রুট (PayRoute) সফটওয়্যারটির বাণিজ্যিক সম্ভাবনা, বাজারে বর্তমান মূল্য, উপার্জনের মডেল, ওয়ান-টাইম সোর্স কোড লাইসেন্সিং এবং বিক্রয়ের সম্পূর্ণ গাইডলাইন।'
                  : 'Commercial viability, market valuation, revenue models, white-label SaaS, and one-time enterprise source code licensing strategy.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950/80 p-3 rounded-xl border border-indigo-500/30">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                {lang === 'bn' ? 'আনুমানিক প্রারম্ভিক বাজার মূল্য:' : 'ESTIMATED MVP VALUATION:'}
              </div>
              <div className="text-base font-black text-emerald-400 font-mono">
                ৳৩৫,০০,০০০ - ৳১.৫ কোটি BDT
              </div>
              <div className="text-[10px] text-indigo-300 font-mono">$30,000 - $125,000 USD</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { id: 'overview', labelBn: '১. অ্যাপের সুবিধা ও সমস্যা সমাধান', labelEn: '1. Features & Problem Solved', icon: Layers },
          { id: 'monetization', labelBn: '২. কিভাবে টাকা ইনকাম করবেন', labelEn: '2. Revenue Models & Income', icon: Coins },
          { id: 'valuation', labelBn: '৩. অ্যাপের বর্তমান বাজার মূল্য', labelEn: '3. Market Valuation Research', icon: BarChart3 },
          { id: 'licensing', labelBn: '৪. এককালীন বিক্রি ও লাইসেন্সিং', labelEn: '4. Licensing & White-Label Sale', icon: Key },
          { id: 'market', labelBn: '৫. বাজারের চাহিদা ও ভবিষ্যৎ', labelEn: '5. Market Demand & Growth', icon: Target },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 text-indigo-400" />
              <span>{lang === 'bn' ? tab.labelBn : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & PROBLEMS SOLVED */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* What Can Our App Do? Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-slate-100">
                {lang === 'bn' ? 'আমাদের অ্যাপটি কি কি করতে পারে? (Core Capabilities)' : 'What Can Our Application Do?'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  titleBn: '⚡ বিদ্যুৎ বিল ও ইউটিলিটি রিচার্জ',
                  titleEn: '⚡ Utility & Electricity Billing',
                  descBn: 'NESCO, DESCO, DPDC, Palli Bidyut প্রিপেইড মিটারের তাতক্ষণিক বিল পেমেন্ট এবং ২০-ডিজিটের টোকেন জেনারেট করে এসএমএস রসিদ তৈরি।',
                  descEn: 'Instant recharge for NESCO, DESCO, DPDC, BREB prepaid meters with live 20-digit token generation and SMS receipt formatting.',
                  badge: 'Firebase DB'
                },
                {
                  titleBn: '🏦 ওপেন ব্যাংকিং ও ট্রানজ্যাকশন লেজার',
                  titleEn: '🏦 Open Banking & ACID Ledger',
                  descBn: 'ডাবল-এন্ট্রি বুককিপিং এবং ব্যাংকিং API (City Bank, EBL, bKash) এর সাথে ডাইরেক্ট ইন্টিগ্রেশন। জিরো-ব্যালেন্স মিসম্যাচ গ্যারান্টি।',
                  descEn: 'Double-entry ACID ledger consistency guaranteeing 0% balance drift with Open Banking API integration.',
                  badge: 'ACID Engine'
                },
                {
                  titleBn: '💳 পাসপোর্টেবল ভার্চুয়াল কার্ড ও ফরেন কারেন্সি',
                  titleEn: '💳 Passport Virtual Card & Multi-Currency',
                  descBn: 'আন্তর্জাতিক কেনাকাটার জন্য বিডিটি, ইউএসডি এবং ইউরো ওয়ালেট রাউটিং এবং আন্তর্জাতিক পাসপোর্টের সাথে ভার্চুয়াল মাস্টারকার্ড যুক্তকরণ।',
                  descEn: 'Multi-currency wallets (BDT, USD, EUR) with virtual Mastercard creation tied to official passport endorsements.',
                  badge: 'Multi-Currency'
                },
                {
                  titleBn: '🤖 জেমিনি এআই ফ্রড অ্যান্ড অ্যানোমালি ডিটেকশন',
                  titleEn: '🤖 Gemini AI Fraud & Anomaly Audit',
                  descBn: 'আর্টিফিশিয়াল ইন্টেলিজেন্স ব্যবহার করে সন্দেহজনক লেনদেন, অ্যাকাউন্ট হ্যাকিং চেষ্টা বা অতিরিক্ত ক্যাশআউট তাতক্ষণিক সনাক্তকরণ।',
                  descEn: 'Real-time Gemini AI audit scanning transaction patterns for high velocity, unauthorized limits, and fraud anomalies.',
                  badge: 'AI Powered'
                },
                {
                  titleBn: '🔔 জিমেলেই ও ব্যাকএন্ড ওয়েবহুক অটোমেশন',
                  titleEn: '🔔 Gmail API & Webhook Automation',
                  descBn: 'মার্চেন্ট এবং গ্রাহকদের ইমেইলে সিকিউরিটি সতর্কবার্তা পাঠাতে গুগল জিমেলেই API এবং স্বয়ংক্রিয় রিট্রাই ওয়েবহুক কিউ ইঞ্জিন।',
                  descEn: 'Google Gmail API integration for instant security emails and exponential backoff webhook dispatch queue.',
                  badge: 'Google Workspace'
                },
                {
                  titleBn: '📱 মোবাইল ও মার্চেন্ট সিমুলেটর',
                  titleEn: '📱 Mobile App & Merchant Gateway',
                  descBn: 'একটি পূর্ণাঙ্গ কিউআর কোড স্ক্যানার, সেন্ড মানি, পেমেন্ট গেটওয়ে চেকআউট এবং রিয়েল-টাইম ডাটাবেস সিঙ্কসহ মোবাইল ইন্টারফেস।',
                  descEn: 'Full mobile app UI with QR code scanning, send money, checkout gateway, and live offline fallback mode.',
                  badge: 'Mobile First'
                },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-indigo-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {item.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">{lang === 'bn' ? item.titleBn : item.titleEn}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{lang === 'bn' ? item.descBn : item.descEn}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Problem-Solution Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-slate-100">
                {lang === 'bn' ? 'এটি কি কি সমস্যা সমাধান করে? (Problems Solved)' : 'What Financial & Technical Problems Does It Solve?'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  probBn: '❌ সমস্যা: বিদ্যুৎ বিল পেমেন্টের পর টোকেন পেতে দেরি হওয়া বা সিস্টেম ডাউন থাকা।',
                  solBn: '✅ সমাধান: আমাদের অ্যাপ স্বয়ংক্রিয়ভাবে প্রিপেইড বিদ্যুৎ বিলের ২০-ডিজিটের টোকেন জেনারেট করে SMS ও Gmail এ পাঠায়।',
                  probEn: '❌ Problem: Delayed electricity meter tokens during peak bill payment hours.',
                  solEn: '✅ Solution: Instant 20-digit token generation engine with real-time SMS formatting & Gmail dispatch.'
                },
                {
                  probBn: '❌ সমস্যা: ব্যাংক ও মোবাইল ব্যাংকিংয়ের মধ্যে টাকা ট্রান্সফারে ডাটাবেস মিসম্যাচ বা টাকা আটকে যাওয়া।',
                  solBn: '✅ সমাধান: ডাবল-এন্ট্রি ACID লেজার স্টেট নিশ্চিত করে যে প্রতিটা জমা এবং খরচের হিসেব ১০০% নিখুঁত থাকবে।',
                  probEn: '❌ Problem: Money stuck during inter-bank transfers due to non-atomic database logs.',
                  solEn: '✅ Solution: Double-entry ACID ledger engine that locks transaction states preventing money loss.'
                },
                {
                  probBn: '❌ সমস্যা: মার্চেন্ট ওয়েবহুক ড্রপ হওয়া বা নোটিফিকেশন না পাওয়া।',
                  solBn: '✅ সমাধান: এক্সপোনেনশিয়াল ব্যাকঅফ ডিলে রিট্রাই সিস্টেম (Async Queue) নিশ্চিত করে ওয়েবহুক মিস হবে না।',
                  probEn: '❌ Problem: Dropped merchant webhooks causing unpaid order statuses.',
                  solEn: '✅ Solution: Asynchronous retry queue with exponential backoff & dead-letter queue auditing.'
                },
                {
                  probBn: '❌ সমস্যা: ফ্রড বা ভুয়া লেনদেন সনাক্ত করতে ব্যর্থ হওয়া।',
                  solBn: '✅ সমাধান: জেমিনী এআই (Gemini AI) ইঞ্জিনের মাধ্যমে রিয়েল-টাইমে অস্বাভাবিক লেনদেন ব্লক করা।',
                  probEn: '❌ Problem: Manual fraud detection failing to detect automated micro-transaction attacks.',
                  solEn: '✅ Solution: Real-time Gemini AI anomaly detection scoring transaction velocities automatically.'
                },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-rose-400 font-mono">{lang === 'bn' ? item.probBn : item.probEn}</div>
                  <div className="text-xs font-bold text-emerald-400 font-mono pt-1 border-t border-slate-800">{lang === 'bn' ? item.solBn : item.solEn}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: REVENUE MODELS */}
      {activeTab === 'monetization' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <Coins className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {lang === 'bn' ? 'কিভাবে টাকা ইনকাম করা যাবে? (Monetization & Revenue Streams)' : 'How Does This App Generate Revenue?'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'bn' ? 'এই সফটওয়্যারটি থেকে ৫টি লাভজনক ইনকাম স্ট্রিম তৈরি করা সম্ভব:' : '5 Proven Revenue Streams for Fintech & Software Owners:'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              
              {/* Stream 1 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                  ১
                </div>
                <h4 className="text-sm font-bold text-slate-100">
                  {lang === 'bn' ? 'বিল পেমেন্ট কমিশন (Utility Commission Fee)' : 'Utility Recharge Commission'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'bn' 
                    ? 'নেসকো, ডেসকো বা পল্লী বিদ্যুতের প্রতিটি বিল পেমেন্টে গ্রাহক বা ব্যাংক থেকে ৳৫ - ৳১৫ টাকা সার্ভিস চার্জ অথবা ১% - ১.৫% কমিশন।' 
                    : 'Charge ৳5 - ৳15 flat fee per electricity bill recharge or negotiate 1% - 1.5% bulk commission with power distribution companies.'}
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-amber-300 font-bold">
                  {lang === 'bn' ? 'আনুমানিক আয়: প্রতি মাসে ৳৫০,০০০ - ৳৩,০০,০০০' : 'Est. Income: ৳50,000 - ৳3,00,000/mo'}
                </div>
              </div>

              {/* Stream 2 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                  ২
                </div>
                <h4 className="text-sm font-bold text-slate-100">
                  {lang === 'bn' ? 'মার্চেন্ট গেটওয়ে ফি (Payment Gateway MDR)' : 'Merchant Payment Gateway MDR Fee'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'bn' 
                    ? 'ই-কমার্স ও মার্চেন্টদের পেমেন্ট গেটওয়ে সার্ভিস দিয়ে প্রতি লেনদেনে ১.৫% থেকে ২.৫% মার্চেন্ট ডিসকাউন্ট রেট (MDR) সাবস্ক্রিপশন ফি।' 
                    : 'Charge e-commerce merchants 1.5% to 2.5% MDR fee on checkout transactions processed through our webhook gateway.'}
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-indigo-300 font-bold">
                  {lang === 'bn' ? 'আনুমানিক আয়: প্রতি মাসে ৳১,০০,০০০ - ৳৫,০০,০০০' : 'Est. Income: ৳1,00,000 - ৳5,00,000/mo'}
                </div>
              </div>

              {/* Stream 3 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  ৩
                </div>
                <h4 className="text-sm font-bold text-slate-100">
                  {lang === 'bn' ? 'হোয়াইট-লেবেল SaaS সাবস্ক্রিপশন' : 'White-Label SaaS Subscription'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'bn' 
                    ? 'ছোট ও মাঝারি ফিনটেক বা আইটি কোম্পানিকে এই প্ল্যাটফর্মটি মাসিক ৳২৫,০০০ - ৳৫০,০০০ টাকার ভাড়ায় ক্লাউড সার্ভিস হিসেবে প্রদান।' 
                    : 'Offer this complete fintech engine to startups as a cloud SaaS platform for $250 - $500/month recurring subscription.'}
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-300 font-bold">
                  {lang === 'bn' ? '১০ গ্রাহকে: মাসে ৳২,৫০,০০০ - ৳৫,০০,০০০' : '10 Clients: $2,500 - $5,000/mo'}
                </div>
              </div>

              {/* Stream 4 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
                  ৪
                </div>
                <h4 className="text-sm font-bold text-slate-100">
                  {lang === 'bn' ? 'এককালীন সোর্স কোড লাইসেন্স বিক্রি' : 'One-Time Enterprise Source Code Sale'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'bn' 
                    ? 'ব্যাংক, ফিনটেক বা পেমেন্ট এগ্রিগেটর কোম্পানির কাছে সোর্স কোড ও ডকুমেন্টেশন এককালীন ৳১৫ লাখ থেকে ৳৫০ লাখ টাকায় বিক্রি।' 
                    : 'Sell non-exclusive enterprise source code licenses to banks, MFS operators, or payment processors for $15,000 - $50,000.'}
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-rose-300 font-bold">
                  {lang === 'bn' ? 'এককালীন আয়: ৳১৫,০০,০০০ - ৳৫০,০০,০০০' : 'One-Time Sale: $15,000 - $50,000'}
                </div>
              </div>

              {/* Stream 5 */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-sm">
                  ৫
                </div>
                <h4 className="text-sm font-bold text-slate-100">
                  {lang === 'bn' ? 'কার্ড ইস্যুয়েন্স ও এক্সচেঞ্জ মার্জিন' : 'Virtual Card Issuance & FX Margin'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'bn' 
                    ? 'ভার্চুয়াল মাস্টকার্ড ইস্যু ফি (৳৫০০/কার্ড) এবং বিডিটি থেকে ইউএসডি কারেন্সি কনভার্সনে ১%-২% ফরেক্স মার্জিন।' 
                    : 'Charge $5 per virtual card issuance and retain 1%-2% foreign exchange spread on multi-currency USD/BDT conversions.'}
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-purple-300 font-bold">
                  {lang === 'bn' ? 'আনুমানিক আয়: প্রতি মাসে ৳৫০,০০০+' : 'Est. Income: $500+/mo'}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 3: MARKET VALUATION RESEARCH */}
      {activeTab === 'valuation' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {lang === 'bn' ? 'বর্তমান অবস্থায় অ্যাপটির মূল্যায়ন/দাম কত হতে পারে?' : 'Current State Valuation Research & Appraisal'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'bn' ? 'সফটওয়্যার আর্কিটেকচার, ইন্টিগ্রেশন এবং ফিনটেক কোডের ওপর ভিত্তি করে মূল্যায়ন:' : 'Valuation estimate based on code complexity, integrations, and Bangladeshi/Global market rates:'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    MVP / Code Only
                  </span>
                  <span className="text-xs font-bold text-slate-400">Level 1</span>
                </div>
                <h4 className="text-sm font-bold text-slate-100">
                  {lang === 'bn' ? 'এমভিপি / টেকনোলজি সোর্স কোড' : 'MVP & Tech Source Code'}
                </h4>
                <div className="text-xl font-black text-amber-400 font-mono">
                  ৳২৫,০০,০০০ - ৳৩৫,০০,০০০
                </div>
                <div className="text-xs text-slate-400 font-mono">($20,000 - $30,000 USD)</div>
                <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
                  {lang === 'bn'
                    ? 'কোনো ব্যাংক চুক্তি ছাড়া শুধু অ্যাপ, ব্যাকএন্ড API, ফায়ারবেস, জেমিনী এআই এবং ওপেন ব্যাংকিং সোর্স কোডের মূল্য।'
                    : 'Valuation for the source code, React UI, Express backend, Firebase, and Gemini AI integration without active clients.'}
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/40 space-y-3 shadow-lg shadow-emerald-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Ready Enterprise Solution
                  </span>
                  <span className="text-xs font-bold text-emerald-400">Recommended</span>
                </div>
                <h4 className="text-sm font-bold text-slate-100">
                  {lang === 'bn' ? 'ইন্টিগ্রেটেড ফিনটেক সলিউশন' : 'Integrated Fintech Solution'}
                </h4>
                <div className="text-xl font-black text-emerald-400 font-mono">
                  ৳৫০,০০,০০০ - ৳১,০০,০০,০০০
                </div>
                <div className="text-xs text-slate-400 font-mono">($40,000 - $80,000 USD)</div>
                <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800 pt-3">
                  {lang === 'bn'
                    ? 'কোনো ফিনটেক স্টার্টআপ বা পেমেন্ট সার্ভিস প্রোভাইডার (PSP) লাইসেন্সপ্রাপ্ত কোম্পানির নিকট বিক্রির উপযুক্ত মূল্য।'
                    : 'Commercial valuation when packaged with documentation, security audit tests, and white-label customization.'}
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                    Full Commercial Platform
                  </span>
                  <span className="text-xs font-bold text-indigo-400">Level 3</span>
                </div>
                <h4 className="text-sm font-bold text-slate-100">
                  {lang === 'bn' ? 'চলতি ব্যবসা ও লাইভ ক্লায়েন্টসহ' : 'Live Business with Active Users'}
                </h4>
                <div className="text-xl font-black text-indigo-400 font-mono">
                  ৳১.৫ কোটি - ৳৩.০ কোটি
                </div>
                <div className="text-xs text-slate-400 font-mono">($120,000 - $250,000 USD)</div>
                <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
                  {lang === 'bn'
                    ? 'নেসকো/ডেসকো এবং মার্চেন্টদের থেকে নিয়মিত ট্রানজ্যাকশন ও রাজস্ব চালু থাকলে কোম্পানির সামগ্রিক বাজার মূল্য।'
                    : 'Valuation when processing live monthly transaction volume with recurring utility revenue stream.'}
                </p>
              </div>

            </div>

            {/* Why Value is High */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                {lang === 'bn' ? '💡 কেন আমাদের অ্যাপের মূল্য এত বেশি?' : '💡 Key Valuation Drivers:'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-slate-300 font-medium">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center space-x-2">
                  <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{lang === 'bn' ? 'ACID ডাবল-এন্ট্রি লেজার' : 'ACID Double-Entry Ledger'}</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center space-x-2">
                  <BadgeCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{lang === 'bn' ? 'বিদ্যুৎ বিল প্রিপেইড টোকেন' : 'NESCO/DESCO Token Engine'}</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center space-x-2">
                  <BadgeCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{lang === 'bn' ? 'ফায়ারবেস ও জিমেলেই API' : 'Firebase Auth & Gmail API'}</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-center space-x-2">
                  <BadgeCheck className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{lang === 'bn' ? 'জেমিনী এআই অ্যানোমালি অডিট' : 'Gemini AI Anomaly Engine'}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 4: LICENSING & SALE STRATEGY */}
      {activeTab === 'licensing' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <Key className="w-6 h-6 text-indigo-400" />
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {lang === 'bn' ? 'সফটওয়্যারটি বিক্রি বা লাইসেন্স দেওয়ার উপায়' : 'How to Sell & License This Application'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'bn' ? 'সবচেয়ে লাভজনক ৩টি বিক্রি কৌশল:' : '3 Proven Enterprise Sales & Licensing Models:'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-100">
                  {lang === 'bn' ? '১. এককালীন সোর্স কোড বিক্রি (Perpetual License)' : '1. Perpetual Source Code License'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'bn'
                    ? 'একটি নির্দিষ্ট কোম্পানি বা ব্যাংকের কাছে সম্পূর্ণ সোর্স কোডের এককালীন স্বত্ব বিক্রি করা। তারা নিজেদের ব্র্যান্ড নামে অ্যাপটি চ্যালাবে।'
                    : 'Sell a one-time non-transferable license to a single institution. They run it on their own servers under their brand name.'}
                </p>
                <div className="p-3 bg-slate-900 rounded-xl text-xs font-mono font-bold text-indigo-300">
                  {lang === 'bn' ? 'বিক্রি মূল্য: ৳২০ - ৳৫০ লাখ টাকা' : 'Price: $18,000 - $45,000 USD'}
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-100">
                  {lang === 'bn' ? '২. হোয়াইট-লেবেল ক্লাউড সার্ভিস (SaaS Model)' : '2. White-Label Managed SaaS'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'bn'
                    ? 'আপনি সোর্স কোড দেবেন না, বরং আপনার ক্লাউডে অ্যাপ হোস্ট করে একাধিক মার্চেন্টকে মাসে মাসে ব্যবহারের জন্য সার্ভিস দেবেন।'
                    : 'Keep the code ownership. Rent the software as a cloud hosted platform to multiple merchants on monthly fees.'}
                </p>
                <div className="p-3 bg-slate-900 rounded-xl text-xs font-mono font-bold text-emerald-300">
                  {lang === 'bn' ? 'মাসিক চার্জ: ৳২০,০০০ - ৳৫০,০০০' : 'Price: $200 - $500/month'}
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-100">
                  {lang === 'bn' ? '৩. জয়েন্ট ভেঞ্চার বা রাজস্ব ভাগাভাগি (Revenue Share)' : '3. Revenue Share Partnership'}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'bn'
                    ? 'একটি ব্যাংক বা পেমেন্ট নেটওয়ার্কের সাথে অংশীদারিত্বে গিয়ে মোট বিদ্যুৎ বিলের লাভ বা গেটওয়ে ফি থেকে ৫০%-৫০% ভাগ নেওয়া।'
                    : 'Partner with a licensed bank or MFS operator where you provide tech and split gross transaction revenue 50/50.'}
                </p>
                <div className="p-3 bg-slate-900 rounded-xl text-xs font-mono font-bold text-purple-300">
                  {lang === 'bn' ? 'দীর্ঘমেয়াদী লাভ: ৫০% ট্রানজ্যাকশন মার্জিন' : 'Profit: 50% Revenue Share'}
                </div>
              </div>

            </div>

            {/* Recommended Action Plan Box */}
            <div className="bg-slate-950 p-5 rounded-xl border border-indigo-500/30 space-y-3">
              <h4 className="text-xs font-bold text-indigo-300 uppercase font-mono flex items-center space-x-2">
                <Rocket className="w-4 h-4 text-indigo-400" />
                <span>{lang === 'bn' ? 'আমাদের পরামর্শ (Recommended Sale Strategy):' : 'Our Recommended Step-by-Step Strategy:'}</span>
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed font-medium">
                <li>{lang === 'bn' ? 'প্রথমে একটি ডেমো ওয়েবসাইট এবং ব্রোশার তৈরি করুন।' : 'Set up a professional product landing page and interactive demo.'}</li>
                <li>{lang === 'bn' ? 'পেমেন্ট সার্ভিস প্রোভাইডার (যেমন SSLCommerz, Foster, Shurjopay), নতুন আইটি কোম্পানি বা এনজিও ব্যাংকগুলোর সাথে কথা বলুন।' : 'Pitch to payment aggregators, local IT firms, MFI organizations, and regional power utilities.'}</li>
                <li>{lang === 'bn' ? 'এককালীন সোর্স কোড বিক্রির জন্য চুক্তিতে ১ বছরের ফ্রি মেইনটেনেন্স এবং সিকিউরিটি সাপোর্ট অন্তর্ভুক্ত রাখুন।' : 'Include 1 year of maintenance support and bug-fixes with any enterprise source code license.'}</li>
              </ol>
            </div>

          </div>

        </div>
      )}

      {/* TAB 5: MARKET DEMAND */}
      {activeTab === 'market' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
              <Target className="w-6 h-6 text-rose-400" />
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {lang === 'bn' ? 'বর্তমান ও ভবিষ্যতে বাজারে চাহিদা কেমন?' : 'Current & Future Market Demand Analysis'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'bn' ? 'বাংলাদেশে ও আন্তর্জাতিক ফিনটেক বাজারে ডিজিটাল পেমেন্ট এবং ইউটিলিটি রিচার্জের চাহিদা:' : 'Fintech and Utility Bill Payment market growth trajectory in Bangladesh & Southeast Asia:'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>{lang === 'bn' ? '১. ডিজিটাল ইউটিলিটি পেমেন্ট চাহিদা' : '1. Digital Utility Billing Boom'}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === 'bn'
                    ? 'বাংলাদেশে প্রায় ৪ কোটির বেশি বিদ্যুতের গ্রাহক রয়েছে। বাংলাদেশ সরকার ২০২৬ সালের মধ্যে ১০০% প্রিপেইড স্মার্ট মিটারিং চালুর নির্দেশ দিয়েছে। ফলে NESCO, DESCO, DPDC রিচার্জ অ্যাপের চাহিদা আগামী ৫ বছরে ১০ গুণ বৃদ্ধি পাবে।'
                    : 'Over 40 million electricity subscribers in Bangladesh transitioning to prepaid smart meters by 2026, driving exponential demand for instant token recharge engines.'}
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                  <Globe className="w-4 h-4" />
                  <span>{lang === 'bn' ? '২. ওপেন ব্যাংকিং ও ইন্টার-অপারেবিলিটি' : '2. Open Banking & Interoperability'}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === 'bn'
                    ? 'বাংলাদেশ ব্যাংক সম্প্রতি ন্যাশনাল পেমেন্ট সুইচ (NPSB) এবং বাংলা কিউআর (Bangla QR) এর উপর জোর দিচ্ছে। আমাদের ওপেন ব্যাংকিং ও লেজার সিস্টেম যে কোনো ব্যাংকের সাথে সংযোগের জন্য প্রস্তুত।'
                    : 'Central bank directives mandating Bangla QR and Interoperable MFS transactions make our open banking API backend immediately relevant.'}
                </p>
              </div>
            </div>

            {/* Final Conclusion Box */}
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-950 to-indigo-950/80 p-5 rounded-xl border border-emerald-500/40 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <Award className="w-5 h-5" />
                <span>{lang === 'bn' ? 'সর্বশেষ মতামত ও সিদ্ধান্ত:' : 'Executive Conclusion & Verdict:'}</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {lang === 'bn'
                  ? 'আমাদের অ্যাপটিতে বিদ্যুৎ বিল রিচার্জ, ফায়ারবেস ডাটাবেস, জেমিনী এআই ফ্রড অডিট, ওপেন ব্যাংকিং এবং জিমেলেই ইমেইল অটোমেশন একসাথে ইন্টিগ্রেটেড রয়েছে। এটি একটি সম্পূর্ণ বাণিজ্যিক-গ্রেড ফিনটেক প্ল্যাটফর্ম। প্রারম্ভিক অবস্থায় এটি বিক্রি করলে ৳৩৫ লাখ থেকে ৳১.৫ কোটি টাকার রেঞ্জে মূল্য নির্ধারণ করা যৌক্তিক।'
                  : 'PayRoute is an enterprise-grade fintech platform combining real-time utility bill recharge, Firebase persistence, Gemini AI fraud audit, Open Banking, and Gmail API dispatch. In its current state, a baseline valuation of $30,000 to $125,000 (৳35 Lac - ৳1.5 Crore BDT) is well-justified for enterprise licensing.'}
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
