import React, { useState, useEffect } from 'react';
import { PassportEndorsement, VirtualCard, Wallet } from '../types';
import { 
  CreditCard, 
  FileText, 
  PlusCircle, 
  Eye, 
  EyeOff, 
  Snowflake, 
  Play, 
  ShieldCheck, 
  Globe, 
  Lock, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Terminal, 
  Copy, 
  Check, 
  Code, 
  Plane, 
  KeyRound, 
  Building2, 
  ShoppingBag,
  Zap,
  X
} from 'lucide-react';

interface PassportVirtualCardViewProps {
  lang: 'en' | 'bn';
  wallets: Wallet[];
  onRefreshData?: () => void;
}

export const PassportVirtualCardView: React.FC<PassportVirtualCardViewProps> = ({
  lang,
  wallets,
  onRefreshData
}) => {
  const [passport, setPassport] = useState<PassportEndorsement | null>(null);
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Passport Endorsement Modal
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [passportNum, setPassportNum] = useState('');
  const [holderName, setHolderName] = useState('');
  const [nidNum, setNidNum] = useState('');
  const [isSubmittingPassport, setIsSubmittingPassport] = useState(false);

  // Issue Card Modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [cardType, setCardType] = useState<'VIRTUAL_VISA' | 'VIRTUAL_MASTERCARD'>('VIRTUAL_VISA');
  const [cardLimitUSD, setCardLimitUSD] = useState('1000');
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || 'WAL-1001');
  const [isIssuingCard, setIsIssuingCard] = useState(false);
  const [issueError, setIssueError] = useState<string | null>(null);

  // Reveal Credentials Modal (2FA)
  const [revealingCard, setRevealingCard] = useState<VirtualCard | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedDetails, setRevealedDetails] = useState<{ fullCardNumber: string; cvv: string } | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);

  // Charge / Simulate International Payment Modal
  const [chargingCard, setChargingCard] = useState<VirtualCard | null>(null);
  const [merchantName, setMerchantName] = useState('AWS Cloud Services');
  const [chargeAmountUSD, setChargeAmountUSD] = useState('50');
  const [isCharging, setIsCharging] = useState(false);
  const [chargeMessage, setChargeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // API Docs Tab
  const [apiDocLanguage, setApiDocLanguage] = useState<'curl' | 'js' | 'python'>('curl');
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchVirtualCardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/virtual-cards');
      const data = await res.json();
      if (data.passport) setPassport(data.passport);
      if (data.virtualCards) setCards(data.virtualCards);
    } catch (err) {
      console.error('Failed to fetch virtual cards data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVirtualCardData();
  }, []);

  // Submit Passport Endorsement
  const handlePassportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPassport(true);
    try {
      const res = await fetch('/api/passport/endorse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passportNumber: passportNum,
          holderName,
          nidNumber: nidNum
        })
      });
      const data = await res.json();
      if (data.success) {
        setPassport(data.endorsement);
        setShowPassportModal(false);
        setPassportNum('');
        setHolderName('');
        setNidNum('');
        fetchVirtualCardData();
      }
    } catch (err) {
      console.error('Passport endorsement error:', err);
    } finally {
      setIsSubmittingPassport(false);
    }
  };

  // Issue Virtual Card
  const handleIssueCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuingCard(true);
    setIssueError(null);

    try {
      const res = await fetch('/api/virtual-cards/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: selectedWalletId,
          cardType,
          currency: 'USD',
          cardLimitUSD: parseFloat(cardLimitUSD)
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowIssueModal(false);
        fetchVirtualCardData();
        if (onRefreshData) onRefreshData();
      } else {
        setIssueError(data.error || 'Failed to issue virtual card');
      }
    } catch (err: any) {
      setIssueError(err.message || 'An error occurred during card issuance');
    } finally {
      setIsIssuingCard(false);
    }
  };

  // Toggle Freeze Status
  const handleToggleFreeze = async (cardId: string) => {
    try {
      const res = await fetch('/api/virtual-cards/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId })
      });
      const data = await res.json();
      if (data.success) {
        setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: data.status } : c));
      }
    } catch (err) {
      console.error('Failed to toggle card freeze status:', err);
    }
  };

  // Reveal Credentials with 2FA
  const handleRevealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revealingCard) return;

    setIsRevealing(true);
    setRevealError(null);

    try {
      const res = await fetch('/api/virtual-cards/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: revealingCard.id,
          otpCode
        })
      });
      const data = await res.json();
      if (data.success) {
        setRevealedDetails({
          fullCardNumber: data.fullCardNumber,
          cvv: data.cvv
        });
      } else {
        setRevealError(data.error || 'Invalid 2FA Verification Code');
      }
    } catch (err: any) {
      setRevealError(err.message || '2FA authentication failed');
    } finally {
      setIsRevealing(false);
    }
  };

  // Charge Virtual Card (International Payment)
  const handleChargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargingCard) return;

    setIsCharging(true);
    setChargeMessage(null);

    try {
      const res = await fetch('/api/virtual-cards/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: chargingCard.id,
          merchantName,
          amountUSD: parseFloat(chargeAmountUSD)
        })
      });
      const data = await res.json();
      if (data.success) {
        setChargeMessage({ type: 'success', text: data.message });
        fetchVirtualCardData();
        if (onRefreshData) onRefreshData();
      } else {
        setChargeMessage({ type: 'error', text: data.error || 'Card transaction failed' });
      }
    } catch (err: any) {
      setChargeMessage({ type: 'error', text: err.message || 'Error processing card charge' });
    } finally {
      setIsCharging(false);
    }
  };

  const getApiSnippet = () => {
    if (apiDocLanguage === 'curl') {
      return `curl -X POST https://payroute.api/v1/virtual-cards/issue \\
  -H "Authorization: Bearer pr_live_key_9948" \\
  -H "Content-Type: application/json" \\
  -d '{
    "passportNumber": "${passport?.passportNumber || 'A09876543'}",
    "cardType": "VIRTUAL_VISA",
    "currency": "USD",
    "cardLimitUSD": 1000
  }'`;
    } else if (apiDocLanguage === 'js') {
      return `import { PayRouteClient } from '@payroute/sdk';

const payroute = new PayRouteClient({ apiKey: process.env.PAYROUTE_KEY });

// Issue Virtual Card linked to Passport Travel Quota
const card = await payroute.virtualCards.issue({
  passportNumber: '${passport?.passportNumber || 'A09876543'}',
  cardType: 'VIRTUAL_VISA',
  currency: 'USD',
  cardLimitUSD: 1000
});

console.log('Issued Virtual Card:', card.cardNumberMasked);`;
    } else {
      return `import requests

url = "https://payroute.api/v1/virtual-cards/issue"
headers = {
    "Authorization": "Bearer pr_live_key_9948",
    "Content-Type": "application/json"
}
payload = {
    "passportNumber": "${passport?.passportNumber || 'A09876543'}",
    "cardType": "VIRTUAL_VISA",
    "currency": "USD",
    "cardLimitUSD": 1000
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getApiSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* SECTION 1: PASSPORT ENDORSEMENT & BANGLADESH BANK TRAVEL QUOTA */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Plane className="w-64 h-64 text-blue-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">
                  {lang === 'bn' ? 'বাংলাদেশ ব্যাংক পাসপোর্ট এনডোর্সমেন্ট ও ট্রাভেল কোটা' : 'Passport Endorsement & Annual Travel Quota'}
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  BB FX SYNCED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'bn'
                  ? 'বাংলাদেশ ব্যাংকের ফরেইন এক্সচেঞ্জ গাইডলাইনস অনুযায়ী প্রতি নাগরিক বছরে $১২,০০০ ইউএসডি আন্তর্জাতিক ট্রাভেল কোটা ব্যবহার করতে পারবেন।'
                  : 'Compliance with Bangladesh Bank Foreign Exchange Regulations: $12,000 USD Annual Travel Quota allowance per verified citizen passport.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (passport) {
                setPassportNum(passport.passportNumber);
                setHolderName(passport.holderName);
                setNidNum(passport.nidNumber);
              }
              setShowPassportModal(true);
            }}
            className="self-start lg:self-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 transition flex items-center gap-2"
          >
            <Plane className="w-4 h-4" />
            {passport 
              ? (lang === 'bn' ? 'পাসপোর্ট এনডোর্সমেন্ট আপডেট' : 'Update Passport Clearance') 
              : (lang === 'bn' ? 'নতুন পাসপোর্ট এনডোর্স করুন' : 'Endorse Passport Now')}
          </button>
        </div>

        {/* Passport Status Details */}
        {passport ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Passport Info Card */}
            <div className="md:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-inner relative">
              <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
                <span className="text-slate-400 font-semibold">{lang === 'bn' ? 'পাসপোর্ট নম্বর:' : 'Passport No:'}</span>
                <span className="font-mono font-bold text-indigo-400 text-sm tracking-wider">{passport.passportNumber}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">{lang === 'bn' ? 'পাসপোর্ট ধারক:' : 'Cardholder / Holder:'}</span>
                <span className="font-bold text-white">{passport.holderName}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">{lang === 'bn' ? 'এনআইডি নম্বর:' : 'NID No:'}</span>
                <span className="font-mono text-slate-300">{passport.nidNumber}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">{lang === 'bn' ? 'মেয়াদ উত্তীর্ণ তারিখ:' : 'Expiry Date:'}</span>
                <span className="font-mono text-slate-300">{passport.expiryDate}</span>
              </div>

              <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Ref: {passport.verificationHash.slice(0, 22)}...</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  VERIFIED
                </span>
              </div>
            </div>

            {/* Right Annual Quota Progress Bar */}
            <div className="md:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {lang === 'bn' ? 'বার্ষিক ফরেইন এক্সচেঞ্জ কোটা (বাংলাদেশ ব্যাংক)' : 'Annual FX Travel Allowance (Bangladesh Bank)'}
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono mt-0.5">
                    ${passport.remainingQuotaUSD.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-normal">USD Remaining</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">{lang === 'bn' ? 'মোট বার্ষিক বরাদ্দ:' : 'Total Allowance:'}</span>
                  <span className="text-sm font-bold text-indigo-400 font-mono">${passport.annualTravelQuotaUSD.toLocaleString()} USD</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 shadow-md"
                    style={{ width: `${Math.min(100, Math.round((passport.usedTravelQuotaUSD / passport.annualTravelQuotaUSD) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Used: ${passport.usedTravelQuotaUSD.toLocaleString()} USD ({Math.round((passport.usedTravelQuotaUSD / passport.annualTravelQuotaUSD) * 100)}%)</span>
                  <span>Quota Limit: ${passport.annualTravelQuotaUSD.toLocaleString()} USD</span>
                </div>
              </div>

              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center space-x-2 text-[11px] text-indigo-300">
                <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  {lang === 'bn' 
                    ? 'আপনার পাসপোর্ট এনডোর্সমেন্টের আন্ডারে ব্যবহৃত কোটা ভার্চুয়াল কার্ড ইউএসডি লিংকে স্বয়ংক্রিয়ভাবে সিঙ্ক থাকবে।' 
                    : 'Virtual Visa/Mastercards issued under this passport are backed directly by your verified Bangladesh Bank FX quota.'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 bg-slate-950/80 border border-dashed border-slate-800 rounded-2xl text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">
              {lang === 'bn' ? 'কোনো পাসপোর্ট এনডোর্সমেন্ট পাওয়া যায়নি' : 'No Passport Endorsement Found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {lang === 'bn'
                ? 'আন্তর্জাতিক ভার্চুয়াল কার্ড তৈরি করতে প্রথমে আপনার পাসপোর্ট ও এনআইডি দিয়ে বাংলাদেশ ব্যাংক ফরেইন এক্সচেঞ্জ এনডোর্সমেন্ট সম্পন্ন করুন।'
                : 'Please complete your Bangladesh Bank Passport Endorsement to unlock $12,000 USD travel quota and issue virtual cards.'}
            </p>
            <button
              onClick={() => setShowPassportModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition"
            >
              {lang === 'bn' ? 'এনডোর্সমেন্ট শুরু করুন' : 'Begin Passport Endorsement'}
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: OPEN VIRTUAL CARDS MANAGEMENT & ISSUANCE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">
                {lang === 'bn' ? 'ইস্যুকৃত ওপেন ভার্চুয়াল কার্ডসমূহ' : 'Issued Multi-Currency Virtual Cards'}
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                {cards.length} ACTIVE CARDS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'bn'
                ? 'আন্তর্জাতিক ই-কমার্স, অ্যাডভান্সড সাশ টুলস (AWS, Google, OpenAI) পেমেন্টের জন্য ইন্সট্যান্ট ভার্চুয়াল কার্ড ইউআই ও এপিআই।'
                : 'Instant Virtual Visa/Mastercard provisioning for international SaaS subscriptions, cloud billing, and online payments.'}
            </p>
          </div>

          <button
            onClick={() => {
              setIssueError(null);
              setShowIssueModal(true);
            }}
            disabled={!passport}
            className="self-start md:self-auto px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/20 transition flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            {lang === 'bn' ? 'নতুন ভার্চুয়াল কার্ড তৈরি করুন' : 'Issue New Virtual Card'}
          </button>
        </div>

        {/* Virtual Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => {
            const isFrozen = card.status === 'FROZEN';
            const isVisa = card.cardType === 'VIRTUAL_VISA';

            return (
              <div 
                key={card.id}
                className={`relative rounded-3xl p-6 text-white shadow-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between h-[230px] border ${
                  isFrozen 
                    ? 'bg-slate-950 border-slate-800 opacity-70 grayscale-[50%]' 
                    : isVisa
                    ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border-indigo-500/40 shadow-indigo-950/50'
                    : 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-950 border-purple-500/40 shadow-purple-950/50'
                }`}
              >
                {/* Metallic Top Shimmer Lines */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl pointer-events-none" />

                {/* Top Row: Brand & Status */}
                <div className="flex items-start justify-between z-10">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 font-mono">PAYROUTE VIRTUAL</span>
                      {isFrozen && (
                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-rose-500/20 text-rose-300 rounded border border-rose-500/30">
                          FROZEN
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-200 mt-0.5">
                      Limit: <strong className="font-mono text-emerald-400">${card.cardLimitUSD} USD</strong>
                    </div>
                  </div>

                  {/* Card Brand Badge */}
                  <div className="font-extrabold italic tracking-wider text-sm text-right">
                    {isVisa ? (
                      <span className="text-blue-400 font-serif tracking-widest text-lg">VISA</span>
                    ) : (
                      <span className="text-orange-400 font-sans tracking-wide text-sm font-black">mastercard</span>
                    )}
                  </div>
                </div>

                {/* Middle Row: Chip & Masked Card Number */}
                <div className="z-10 space-y-2 my-2">
                  <div className="flex items-center space-x-3">
                    {/* Metallic Chip Visual */}
                    <div className="w-10 h-7 bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-200 rounded-md border border-amber-500/50 shadow-inner flex flex-col justify-between p-1">
                      <div className="w-full h-0.5 bg-amber-600/40" />
                      <div className="w-full h-0.5 bg-amber-600/40" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono tracking-wider">USD DEBIT</span>
                  </div>

                  <div className="text-lg font-mono tracking-[0.2em] font-extrabold text-slate-100 drop-shadow">
                    {card.cardNumberMasked}
                  </div>
                </div>

                {/* Bottom Row: Holder Name & Expiry */}
                <div className="flex items-end justify-between text-xs z-10 pt-2 border-t border-white/10">
                  <div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider">Cardholder</div>
                    <div className="font-bold text-slate-200 uppercase truncate max-w-[150px] font-mono">{card.cardholderName}</div>
                  </div>

                  <div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider text-right">Expires</div>
                    <div className="font-bold text-slate-200 font-mono text-right">{card.expiryDate}</div>
                  </div>
                </div>

                {/* Action Controls Bar */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 z-20 text-[11px]">
                  <button
                    onClick={() => {
                      setRevealingCard(card);
                      setOtpCode('');
                      setRevealedDetails(null);
                      setRevealError(null);
                    }}
                    className="text-indigo-300 hover:text-white font-bold flex items-center gap-1 hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    {lang === 'bn' ? 'নম্বর ও CVV দেখুন' : 'Show CVV (2FA)'}
                  </button>

                  <button
                    onClick={() => handleToggleFreeze(card.id)}
                    className={`font-semibold flex items-center gap-1 transition ${
                      isFrozen ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'
                    }`}
                  >
                    <Snowflake className="w-3.5 h-3.5" />
                    {isFrozen ? (lang === 'bn' ? 'আনফ্রিজ' : 'Unfreeze') : (lang === 'bn' ? 'ফ্রিজ করুন' : 'Freeze Card')}
                  </button>

                  <button
                    onClick={() => {
                      setChargingCard(card);
                      setChargeMessage(null);
                      setChargeAmountUSD('50');
                    }}
                    disabled={isFrozen}
                    className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 disabled:opacity-40"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                    {lang === 'bn' ? 'পেমেন্ট টেস্ট' : 'Pay Test'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: OPEN VIRTUAL CARD REST API DOCS & CODE EXAMPLES */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-slate-100 font-bold text-base">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3>{lang === 'bn' ? 'ওপেন ভার্চুয়াল কার্ড REST API ইন্টিগ্রেশন' : 'Open Virtual Card REST API Documentation'}</h3>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setApiDocLanguage('curl')}
              className={`px-3 py-1 rounded-lg font-mono font-bold transition ${
                apiDocLanguage === 'curl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setApiDocLanguage('js')}
              className={`px-3 py-1 rounded-lg font-mono font-bold transition ${
                apiDocLanguage === 'js' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Node.js SDK
            </button>
            <button
              onClick={() => setApiDocLanguage('python')}
              className={`px-3 py-1 rounded-lg font-mono font-bold transition ${
                apiDocLanguage === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Python
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
            {getApiSnippet()}
          </pre>
          <button
            onClick={handleCopyCode}
            className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700 flex items-center gap-1.5 text-xs"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* MODAL 1: PASSPORT ENDORSEMENT FORM */}
      {showPassportModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-slate-100 relative">
            <button
              onClick={() => setShowPassportModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 text-blue-400 font-bold border-b border-slate-800 pb-3">
              <Plane className="w-5 h-5 text-blue-400" />
              <h3>{lang === 'bn' ? 'বাংলাদেশ ব্যাংক পাসপোর্ট এনডোর্সমেন্ট' : 'Passport Clearance Verification'}</h3>
            </div>

            <form onSubmit={handlePassportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'পাসপোর্ট নম্বর:' : 'Passport Number:'}
                </label>
                <input
                  type="text"
                  value={passportNum}
                  onChange={(e) => setPassportNum(e.target.value.toUpperCase())}
                  placeholder="A09876543"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'পাসপোর্ট অনুযায়ী নাম:' : 'Cardholder Name (As in Passport):'}
                </label>
                <input
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                  placeholder="RAHIM AHMED"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'জাতীয় পরিচয়পত্র (NID) নম্বর:' : 'National ID (NID) Number:'}
                </label>
                <input
                  type="text"
                  value={nidNum}
                  onChange={(e) => setNidNum(e.target.value)}
                  placeholder="1992269123450098"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPassportModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassport}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  {isSubmittingPassport ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  Verify with BB FX API
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ISSUE VIRTUAL CARD */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-slate-100 relative">
            <button
              onClick={() => setShowIssueModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 text-purple-400 font-bold border-b border-slate-800 pb-3">
              <PlusCircle className="w-5 h-5 text-purple-400" />
              <h3>{lang === 'bn' ? 'নতুন ভার্চুয়াল কার্ড ইস্যু' : 'Issue New Virtual Card'}</h3>
            </div>

            {issueError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{issueError}</span>
              </div>
            )}

            <form onSubmit={handleIssueCardSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'কার্ড নেটওয়ার্ক টাইপ:' : 'Card Network / Type:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCardType('VIRTUAL_VISA')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      cardType === 'VIRTUAL_VISA'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>VISA Virtual</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCardType('VIRTUAL_MASTERCARD')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      cardType === 'VIRTUAL_MASTERCARD'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span>Mastercard Virtual</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'কার্ড ইউএসডি বরাদ্দ লিমিট ($ USD):' : 'Card USD Limit ($ USD):'}
                </label>
                <input
                  type="number"
                  min="50"
                  max={passport?.remainingQuotaUSD || 12000}
                  step="50"
                  value={cardLimitUSD}
                  onChange={(e) => setCardLimitUSD(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Available Passport Quota: <strong className="text-emerald-400 font-mono">${passport?.remainingQuotaUSD} USD</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'সংযুক্ত ওয়ালেট অ্যাকাউন্ট:' : 'Linked Wallet Account:'}
                </label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.ownerName} ({w.id}) - ৳{w.balance.toLocaleString()} BDT
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isIssuingCard}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  {isIssuingCard ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                  Issue Virtual Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REVEAL CARD CREDENTIALS WITH 2FA */}
      {revealingCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-slate-100 relative">
            <button
              onClick={() => setRevealingCard(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 text-indigo-400 font-bold border-b border-slate-800 pb-3">
              <KeyRound className="w-5 h-5 text-indigo-400" />
              <h3>{lang === 'bn' ? '২এফএ ভেরিফিকেশন দিয়ে কার্ড নম্বর দেখুন' : '2FA Reveal Credentials'}</h3>
            </div>

            {revealError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{revealError}</span>
              </div>
            )}

            {revealedDetails ? (
              <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Credentials Decrypted via 2FA Token
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">16-Digit Full Card Number</span>
                  <div className="text-lg font-mono font-extrabold text-white tracking-widest">{revealedDetails.fullCardNumber}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-900">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Expiry</span>
                    <span className="font-mono font-bold text-white">{revealingCard.expiryDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">CVV Code</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">{revealedDetails.cvv}</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRevealSubmit} className="space-y-3">
                <p className="text-xs text-slate-400">
                  Enter your 2FA OTP security code to view sensitive 16-digit card number and CVV.
                </p>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      {lang === 'bn' ? '৬-ডিজিট সিকিউরিটি ওটিপি:' : '6-Digit Security OTP:'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setOtpCode('884921')}
                      className="text-[10px] text-indigo-400 hover:underline"
                    >
                      Fill Demo OTP (884921)
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="884921"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-lg font-mono tracking-widest text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setRevealingCard(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRevealing}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    {isRevealing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                    Reveal Card Credentials
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: CHARGE CARD (PAYMENT TEST) */}
      {chargingCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-slate-100 relative">
            <button
              onClick={() => setChargingCard(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 text-emerald-400 font-bold border-b border-slate-800 pb-3">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h3>{lang === 'bn' ? 'আন্তর্জাতিক ই-কমার্স পেমেন্ট টেস্ট' : 'Simulate International Card Charge'}</h3>
            </div>

            {chargeMessage && (
              <div className={`p-3 text-xs font-semibold rounded-xl flex items-center gap-2 border ${
                chargeMessage.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                {chargeMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                <span>{chargeMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChargeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'মার্চেন্ট / গ্লোবাল সার্ভিস নাম:' : 'Merchant / Global Service:'}
                </label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="AWS, OpenAI, Netflix"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'চার্জ পরিমাণ ($ USD):' : 'Transaction Amount ($ USD):'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={chargingCard.cardLimitUSD - chargingCard.spentUSD}
                  value={chargeAmountUSD}
                  onChange={(e) => setChargeAmountUSD(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  FX Rate: 1 USD = 120 BDT (Est. ৳{(parseFloat(chargeAmountUSD || '0') * 120).toLocaleString()} BDT deducted from wallet)
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setChargingCard(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCharging}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  {isCharging ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Execute Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
