import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Send, 
  ArrowDownLeft, 
  PlusCircle, 
  CreditCard, 
  QrCode, 
  Zap, 
  Building, 
  Gift, 
  PhoneCall, 
  Receipt, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Search, 
  History, 
  User, 
  Bell, 
  RefreshCw, 
  ChevronRight, 
  ArrowUpRight, 
  Camera, 
  Sparkles, 
  Landmark, 
  Wifi, 
  Battery, 
  Signal,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Wallet, Transaction } from '../types';
import { sendNotification } from '../lib/notifications';

interface MobileAppSimulatorViewProps {
  lang: 'en' | 'bn';
  wallets: Wallet[];
  transactions: Transaction[];
  onTransactionSuccess: () => void;
}

export const MobileAppSimulatorView: React.FC<MobileAppSimulatorViewProps> = ({
  lang,
  wallets,
  transactions,
  onTransactionSuccess
}) => {
  // Simulator frame settings
  const [frameMode, setFrameMode] = useState<'phone' | 'fluid'>('phone');
  const [deviceTheme, setDeviceTheme] = useState<'dark' | 'light'>('dark');

  // Mobile App Internal States
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'qr' | 'offers' | 'profile'>('home');
  const [showBalance, setShowBalance] = useState<boolean>(false);
  const [isTappingBalance, setIsTappingBalance] = useState<boolean>(false);

  // Active Selected User Wallet (Default first wallet or Merchant)
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || '');

  // Action Modals
  const [activeActionModal, setActiveActionModal] = useState<'send' | 'add' | 'recharge' | 'bill' | 'cashout' | null>(null);

  // Form Inputs for Actions
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('1500');
  const [pin, setPin] = useState<string>('1234');
  const [operator, setOperator] = useState<string>('Grameenphone');
  const [billType, setBillType] = useState<string>('DESCO Electricity');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // QR Camera simulator state
  const [isScanning, setIsScanning] = useState<boolean>(false);

  useEffect(() => {
    if (wallets.length > 0 && !selectedWalletId) {
      setSelectedWalletId(wallets[0].id);
    }
  }, [wallets]);

  const currentWallet = wallets.find(w => w.id === selectedWalletId) || wallets[0] || {
    id: 'WAL-1001',
    ownerName: 'Kamrul Hasan',
    balance: 245000,
    currency: 'BDT'
  };

  const handleTapBalance = () => {
    setIsTappingBalance(true);
    setShowBalance(true);
    setTimeout(() => {
      setIsTappingBalance(false);
    }, 4000);
  };

  const handleExecuteSendMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount || parseFloat(amount) <= 0) return;

    setIsProcessing(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);

    try {
      const res = await fetch('/api/transactions/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderWalletId: currentWallet.id,
          receiverWalletId: recipient,
          amount: parseFloat(amount),
          currency: currentWallet.currency || 'BDT',
          requestedRail: 'BKASH',
          idempotencyKey: `MOB-${Date.now()}`
        })
      });

      const data = await res.json();
      if (data.success) {
        const msg = lang === 'bn' 
          ? `৳${amount} সফলভাবে ${recipient} কে পাঠানো হয়েছে!` 
          : `৳${amount} successfully transferred to ${recipient}!`;
        
        setActionSuccessMsg(msg);
        onTransactionSuccess();

        sendNotification({
          title: lang === 'bn' ? 'টাকা পাঠানো হয়েছে!' : 'Money Sent!',
          body: msg,
          tag: 'mobile-transfer'
        });

        setTimeout(() => {
          setActiveActionModal(null);
          setActionSuccessMsg(null);
        }, 2200);
      } else {
        setActionErrorMsg(data.error || 'Transaction failed');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Network error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;

    setIsProcessing(true);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);

    try {
      const res = await fetch('/api/transactions/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderWalletId: currentWallet.id,
          receiverWalletId: 'WAL-MERCHANT-01',
          amount: parseFloat(amount),
          currency: 'BDT',
          requestedRail: 'ROBI',
          idempotencyKey: `RCH-${Date.now()}`
        })
      });

      const data = await res.json();
      if (data.success) {
        const msg = lang === 'bn'
          ? `${operator} নম্বর ${recipient} এ ৳${amount} রিচার্জ সফল!`
          : `${operator} Mobile recharge of ৳${amount} to ${recipient} successful!`;

        setActionSuccessMsg(msg);
        onTransactionSuccess();

        sendNotification({
          title: lang === 'bn' ? 'রিচার্জ সফল!' : 'Recharge Successful!',
          body: msg,
          tag: 'mobile-recharge'
        });

        setTimeout(() => {
          setActiveActionModal(null);
          setActionSuccessMsg(null);
        }, 2200);
      } else {
        setActionErrorMsg(data.error || 'Recharge failed');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulator Control Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">
              {lang === 'bn' ? 'স্মার্ট পে-রুট মোবাইল অ্যাপস প্রিভিউ' : 'PayRoute Mobile App Simulator'}
            </h2>
            <span className="px-2 py-0.5 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-full">
              Live Interactive
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'bn'
              ? 'বাস্তব মোবাইল ফিনটেক ও ওপেন ব্যাংকিং অ্যাপের স্বজ্ঞাত ইন্টারফেস ও এসিড রিয়েল-টাইম ট্রানজ্যাকশন টেস্ট।'
              : 'Test PayRoute mobile fintech UI, quick services, instant balance tap, and live ACID backend processing.'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          {/* Frame Toggle */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
            <button
              onClick={() => setFrameMode('phone')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                frameMode === 'phone'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              {lang === 'bn' ? 'ফোন ফ্রেম' : 'Phone Frame'}
            </button>
            <button
              onClick={() => setFrameMode('fluid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                frameMode === 'fluid'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              {lang === 'bn' ? 'ফুল স্ক্রিন' : 'Fluid Screen'}
            </button>
          </div>

          {/* Active Wallet Selector */}
          <select
            value={selectedWalletId}
            onChange={(e) => setSelectedWalletId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                📱 {w.ownerName} ({w.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Container - Responsive Phone Simulator vs Full Screen */}
      <div className="flex justify-center items-start min-h-[680px]">
        <div className={`transition-all duration-300 w-full ${
          frameMode === 'phone' 
            ? 'max-w-[390px] border-[10px] border-slate-900 rounded-[48px] shadow-2xl shadow-indigo-950/50 relative bg-slate-950 overflow-hidden ring-1 ring-slate-800' 
            : 'max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-2'
        }`}>

          {/* Phone Status Bar (Phone frame mode) */}
          {frameMode === 'phone' && (
            <div className="bg-slate-900 text-slate-300 px-6 py-2.5 flex items-center justify-between text-[11px] font-semibold border-b border-slate-800/60 select-none">
              <span>9:41</span>
              {/* Dynamic Island / Notch */}
              <div className="w-24 h-4 bg-black rounded-full mx-auto" />
              <div className="flex items-center space-x-1.5">
                <Signal className="w-3 h-3 text-slate-200" />
                <Wifi className="w-3 h-3 text-slate-200" />
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          )}

          {/* App Header Bar inside Mobile App */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-4 border-b border-indigo-900/40">
            <div className="flex items-center justify-between">
              {/* User Avatar, Logo & Info */}
              <div className="flex items-center space-x-3">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-indigo-500/40 bg-slate-950 shadow">
                    <img 
                      src="/src/assets/images/payroute_app_logo_1785432931316.jpg" 
                      alt="PayRoute Logo"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
                </div>
                <div>
                  <div className="text-white text-xs font-extrabold flex items-center gap-1">
                    {currentWallet.ownerName}
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="text-[10px] text-indigo-300/80 font-mono flex items-center gap-1">
                    <span className="text-emerald-400 font-bold">PayRoute</span> • {currentWallet.id}
                  </div>
                </div>
              </div>

              {/* Notification Bell & Language */}
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-full bg-indigo-950/80 border border-indigo-800/50 text-indigo-300 hover:text-white relative cursor-pointer">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                </div>
              </div>
            </div>

            {/* Interactive Tap-to-Reveal Balance Bar */}
            <div className="mt-4 bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-3 shadow-inner flex items-center justify-between backdrop-blur">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    {lang === 'bn' ? 'ব্যালেন্স স্টেট' : 'Main Ledger Balance'}
                  </span>
                  
                  {showBalance ? (
                    <motion.span 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-base font-extrabold text-emerald-400 font-mono block"
                    >
                      ৳{currentWallet.balance.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')} BDT
                    </motion.span>
                  ) : (
                    <span className="text-xs text-indigo-300 font-semibold block">
                      {lang === 'bn' ? 'ট্যাপ করে ব্যালেন্স দেখুন' : 'Tap to show balance'}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleTapBalance}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isTappingBalance 
                    ? 'bg-emerald-500 text-slate-950 scale-95' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                }`}
              >
                {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showBalance ? (lang === 'bn' ? 'আড়াল করুন' : 'Hide') : (lang === 'bn' ? 'ব্যালেন্স' : 'Tap')}
              </button>
            </div>
          </div>

          {/* App Body Content */}
          <div className="p-4 space-y-5 bg-slate-950 min-h-[460px]">
            
            {/* Quick Services 4x2 Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {lang === 'bn' ? 'কুইক সার্ভিসসমূহ' : 'Quick Services'}
                </span>
                <span className="text-[10px] text-indigo-400 font-medium">
                  {lang === 'bn' ? 'রিয়েল-টাইম এসিড' : 'Instant 24/7'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {/* 1. Send Money */}
                <button
                  onClick={() => setActiveActionModal('send')}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition group hover:bg-indigo-950/40"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition">
                    <Send className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200 mt-2 leading-tight">
                    {lang === 'bn' ? 'সেন্ড মানি' : 'Send Money'}
                  </span>
                </button>

                {/* 2. Add Money / Open Banking */}
                <button
                  onClick={() => setActiveActionModal('add')}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition group hover:bg-emerald-950/40"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200 mt-2 leading-tight">
                    {lang === 'bn' ? 'অ্যাড মানি' : 'Add Money'}
                  </span>
                </button>

                {/* 3. Mobile Recharge */}
                <button
                  onClick={() => setActiveActionModal('recharge')}
                  className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition group hover:bg-blue-950/40"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200 mt-2 leading-tight">
                    {lang === 'bn' ? 'রিচার্জ' : 'Recharge'}
                  </span>
                </button>

                {/* 4. Cash Out */}
                <button
                  onClick={() => setActiveActionModal('cashout')}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition group hover:bg-amber-950/40"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition">
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200 mt-2 leading-tight">
                    {lang === 'bn' ? 'ক্যাশ আউট' : 'Cash Out'}
                  </span>
                </button>

                {/* 5. Utility Bill Pay */}
                <button
                  onClick={() => setActiveActionModal('bill')}
                  className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition group hover:bg-purple-950/40"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200 mt-2 leading-tight">
                    {lang === 'bn' ? 'বিল পে' : 'Bill Pay'}
                  </span>
                </button>

                {/* 6. Bank Transfer / Open Banking PIS */}
                <button
                  onClick={() => setActiveActionModal('add')}
                  className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition group hover:bg-sky-950/40"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center group-hover:scale-110 transition">
                    <Building className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200 mt-2 leading-tight">
                    {lang === 'bn' ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer'}
                  </span>
                </button>

                {/* 7. Scan QR */}
                <button
                  onClick={() => setIsScanning(true)}
                  className="bg-slate-900 border border-slate-800 hover:border-rose-500/50 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition group hover:bg-rose-950/40"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center group-hover:scale-110 transition">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200 mt-2 leading-tight">
                    {lang === 'bn' ? 'কিউআর স্ক্যান' : 'Scan QR'}
                  </span>
                </button>

                {/* 8. Offers & Cashback */}
                <button
                  onClick={() => setActiveTab('offers')}
                  className="bg-slate-900 border border-slate-800 hover:border-pink-500/50 p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition group hover:bg-pink-950/40"
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center group-hover:scale-110 transition">
                    <Gift className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200 mt-2 leading-tight">
                    {lang === 'bn' ? 'অফার' : 'Offers'}
                  </span>
                </button>
              </div>
            </div>

            {/* Linked Cards & Open Banking Gateways Carousel */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">
                  {lang === 'bn' ? 'সংযুক্ত ব্যাংক ও ওয়ালেটসমূহ' : 'Linked Gateways & Cards'}
                </span>
                <span className="text-[10px] text-slate-400">PSD2 / BB OpenAPI</span>
              </div>

              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-none">
                {/* BRAC Bank Card */}
                <div className="min-w-[200px] bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-700/40 rounded-xl p-3 shadow-lg">
                  <div className="flex items-center justify-between text-[10px] text-indigo-300 font-bold mb-3">
                    <span>BRAC Bank</span>
                    <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">CONNECTED</span>
                  </div>
                  <div className="text-sm font-bold text-white font-mono">1501****2094</div>
                  <div className="text-[10px] text-slate-400 mt-1">Available: ৳4,500,000</div>
                </div>

                {/* City Bank Card */}
                <div className="min-w-[200px] bg-gradient-to-br from-slate-900 to-blue-950 border border-blue-700/40 rounded-xl p-3 shadow-lg">
                  <div className="flex items-center justify-between text-[10px] text-blue-300 font-bold mb-3">
                    <span>City Bank</span>
                    <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">CONNECTED</span>
                  </div>
                  <div className="text-sm font-bold text-white font-mono">3109****4412</div>
                  <div className="text-[10px] text-slate-400 mt-1">Available: ৳12,500,000</div>
                </div>

                {/* Visa Debit Card */}
                <div className="min-w-[200px] bg-gradient-to-br from-purple-900 to-slate-900 border border-purple-700/40 rounded-xl p-3 shadow-lg">
                  <div className="flex items-center justify-between text-[10px] text-purple-300 font-bold mb-3">
                    <span>PayRoute Visa Platinum</span>
                    <CreditCard className="w-3.5 h-3.5 text-purple-300" />
                  </div>
                  <div className="text-sm font-bold text-white font-mono">4532 **** **** 8810</div>
                  <div className="text-[10px] text-slate-400 mt-1">International Debit</div>
                </div>
              </div>
            </div>

            {/* Recent Mobile Transactions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">
                  {lang === 'bn' ? 'সাম্প্রতিক মোবাইল লেনদেন' : 'Recent Mobile History'}
                </span>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  {lang === 'bn' ? 'সব দেখুন' : 'View all'} <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {transactions.slice(0, 4).map((tx) => {
                  const isDebit = tx.senderWalletId === currentWallet.id;
                  return (
                    <div
                      key={tx.id}
                      className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                          isDebit ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {isDebit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-semibold text-white truncate max-w-[140px]">
                            {tx.reference || tx.receiverName || tx.senderName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {tx.executedRail || tx.requestedRail} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-bold font-mono ${isDebit ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isDebit ? '-' : '+'}৳{tx.amount.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                        </div>
                        <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1 rounded">
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Bottom Phone Bar Navigation */}
          <div className="bg-slate-900 border-t border-slate-800/80 px-4 py-2 flex items-center justify-around select-none">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center text-[10px] font-semibold transition ${
                activeTab === 'home' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4 mb-0.5" />
              {lang === 'bn' ? 'হোম' : 'Home'}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center text-[10px] font-semibold transition ${
                activeTab === 'history' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-4 h-4 mb-0.5" />
              {lang === 'bn' ? 'লেনদেন' : 'History'}
            </button>

            {/* Floating Scan Button */}
            <button
              onClick={() => setIsScanning(true)}
              className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center -mt-5 shadow-lg shadow-indigo-600/50 ring-4 ring-slate-950 hover:scale-105 transition"
            >
              <QrCode className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('offers')}
              className={`flex flex-col items-center text-[10px] font-semibold transition ${
                activeTab === 'offers' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gift className="w-4 h-4 mb-0.5" />
              {lang === 'bn' ? 'অফার' : 'Offers'}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center text-[10px] font-semibold transition ${
                activeTab === 'profile' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4 mb-0.5" />
              {lang === 'bn' ? 'প্রোফাইল' : 'Profile'}
            </button>
          </div>

          {/* Bottom Home Indicator Bar (iOS style) */}
          {frameMode === 'phone' && (
            <div className="bg-slate-950 py-1 flex justify-center">
              <div className="w-32 h-1 bg-slate-700 rounded-full" />
            </div>
          )}

        </div>
      </div>

      {/* ACTION MODAL OVERLAYS */}
      <AnimatePresence>
        {activeActionModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4 text-slate-100 relative"
            >
              <button
                onClick={() => setActiveActionModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Send className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  {activeActionModal === 'send' && (lang === 'bn' ? 'সেন্ড মানি (Send Money)' : 'Send Money')}
                  {activeActionModal === 'add' && (lang === 'bn' ? 'অ্যাড মানি / ব্যাংক পুল' : 'Add Money / Open Banking')}
                  {activeActionModal === 'recharge' && (lang === 'bn' ? 'মোবাইল রিচার্জ' : 'Mobile Recharge')}
                  {activeActionModal === 'bill' && (lang === 'bn' ? 'ইউটিলিটি বিল পে' : 'Utility Bill Pay')}
                  {activeActionModal === 'cashout' && (lang === 'bn' ? 'এজেন্ট ক্যাশ আউট' : 'Agent Cash Out')}
                </h3>
              </div>

              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {actionSuccessMsg}
                </div>
              )}

              {actionErrorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  {actionErrorMsg}
                </div>
              )}

              {/* Form Logic */}
              <form onSubmit={activeActionModal === 'recharge' ? handleExecuteRecharge : handleExecuteSendMoney} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    {activeActionModal === 'send' && (lang === 'bn' ? 'প্রাপকের ওয়ালেট নম্বর / ID:' : 'Recipient Wallet ID:')}
                    {activeActionModal === 'recharge' && (lang === 'bn' ? 'মোবাইল নম্বর:' : 'Mobile Number:')}
                    {activeActionModal === 'add' && (lang === 'bn' ? 'উৎস ব্যাংক একাউন্ট:' : 'Source Bank Account:')}
                    {activeActionModal === 'bill' && (lang === 'bn' ? 'বিল একাউন্ট নম্বর:' : 'Bill Account Number:')}
                    {activeActionModal === 'cashout' && (lang === 'bn' ? 'এজেন্ট নম্বর:' : 'Agent Number:')}
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={activeActionModal === 'recharge' ? '01712345678' : 'WAL-1002'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {activeActionModal === 'recharge' && (
                  <div>
                    <label className="block text-xs text-slate-300 mb-1 font-medium">
                      {lang === 'bn' ? 'মোবাইল অপারেটর:' : 'Operator:'}
                    </label>
                    <select
                      value={operator}
                      onChange={(e) => setOperator(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Grameenphone">Grameenphone</option>
                      <option value="Robi">Robi</option>
                      <option value="Banglalink">Banglalink</option>
                      <option value="Teletalk">Teletalk</option>
                      <option value="Airtel">Airtel</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    {lang === 'bn' ? 'পরিমাণ (৳ BDT):' : 'Amount (৳ BDT):'}
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    min="10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">
                    {lang === 'bn' ? 'সিকিউরিটি পিন (PIN):' : 'Security PIN:'}
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="****"
                    maxLength={4}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-2"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {lang === 'bn' ? 'ট্রানজ্যাকশন সম্পন্ন করুন' : 'Confirm Mobile Transaction'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR CAMERA SCANNER SIMULATOR OVERLAY */}
      <AnimatePresence>
        {isScanning && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl text-center text-slate-100 relative space-y-4"
            >
              <button
                onClick={() => setIsScanning(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center space-x-2 text-indigo-400 font-bold">
                <QrCode className="w-5 h-5" />
                <span>{lang === 'bn' ? 'স্মার্ট কিউআর স্ক্যানার' : 'PayRoute Smart QR Scanner'}</span>
              </div>

              {/* Viewfinder simulation */}
              <div className="relative w-64 h-64 mx-auto bg-black border-2 border-indigo-500/50 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                {/* Laser animation */}
                <motion.div
                  animate={{ y: [-100, 100, -100] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="absolute w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-lg shadow-indigo-400"
                />
                
                <Camera className="w-12 h-12 text-slate-700" />
                
                <div className="absolute bottom-3 text-[10px] text-slate-400 font-mono bg-slate-900/80 px-2 py-1 rounded">
                  {lang === 'bn' ? 'মার্চেন্ট QR এর সামনাসামনি রাখুন' : 'Point camera at Merchant QR Code'}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsScanning(false);
                    setRecipient('WAL-MERCHANT-01');
                    setActiveActionModal('send');
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  {lang === 'bn' ? 'ডেমো মার্চেন্ট QR টেস্ট করুন' : 'Simulate Scan Merchant QR'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
