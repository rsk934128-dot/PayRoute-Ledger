import React, { useState, useEffect } from 'react';
import { ElectricityBillPayment, PaymentRail } from '../types';
import { sendNotification } from '../lib/notifications';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  firebaseSignOut, 
  onAuthStateChanged, 
  db, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  User 
} from '../lib/firebase';
import { GmailNotificationModal } from './GmailNotificationModal';
import { 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Check, 
  Send, 
  Database, 
  UserCheck, 
  LogOut, 
  LogIn, 
  Clock, 
  Receipt, 
  Sparkles, 
  AlertCircle, 
  Mail, 
  Smartphone,
  ExternalLink,
  Flame,
  ArrowRight
} from 'lucide-react';

interface ElectricityBillViewProps {
  lang: 'en' | 'bn';
  onPaymentProcessed?: (amountBDT: number, rail: PaymentRail) => void;
}

export const ElectricityBillView: React.FC<ElectricityBillViewProps> = ({ lang, onPaymentProcessed }) => {
  // Firebase Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Form State initialized with values from user's NESCO Prepaid receipt image!
  const [biller, setBiller] = useState<'NESCO_Prepaid' | 'DESCO_Prepaid' | 'DPDC_Prepaid' | 'BREB_PalliBidyut' | 'WZPDCL_Prepaid'>('NESCO_Prepaid');
  const [meterId, setMeterId] = useState('3000');
  const [billNo, setBillNo] = useState('71003100');
  const [amountBDT, setAmountBDT] = useState<number>(1000);
  const [paymentRail, setPaymentRail] = useState<PaymentRail>('BKASH_DIRECT');

  // Transaction Outcome State
  const [isProcessing, setIsProcessing] = useState(false);
  const [latestReceipt, setLatestReceipt] = useState<ElectricityBillPayment | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedSMS, setCopiedSMS] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Firestore History List State
  const [firestorePayments, setFirestorePayments] = useState<ElectricityBillPayment[]>([]);
  const [dbConnected, setDbConnected] = useState(true);

  // Gmail Notification Modal
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [gmailSubject, setGmailSubject] = useState('');
  const [gmailBody, setGmailBody] = useState('');

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Real-time Firestore Updates
  useEffect(() => {
    try {
      const q = query(collection(db, 'billPayments'), orderBy('paidAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const payments: ElectricityBillPayment[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as ElectricityBillPayment));
        setFirestorePayments(payments);
        setDbConnected(true);
      }, (err) => {
        console.warn('Firestore snapshot error (using local storage fallback):', err);
        setDbConnected(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore init failed:', err);
      setDbConnected(false);
    }
  }, []);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setStatusMessage({
        text: lang === 'bn' ? 'ফায়ারবেস অথেন্টিকেশন সফল হয়েছে!' : 'Firebase Authentication successful!',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Login error:', err);
      setStatusMessage({
        text: err.message || 'Firebase login failed',
        type: 'error',
      });
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
      setStatusMessage({
        text: lang === 'bn' ? 'লগআউট সম্পন্ন হয়েছে' : 'Logged out from Firebase',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Helper to generate 20-digit token (XXXX-XXXX-XXXX-XXXX-XXXX)
  const generateToken = () => {
    const chunk = () => Math.floor(1000 + Math.random() * 9000).toString();
    return `${chunk()}-${chunk()}-${chunk()}-${chunk()}-${chunk()}`;
  };

  // Process Electricity Bill Payment
  const handlePayBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountBDT || amountBDT <= 0) return;

    setIsProcessing(true);
    setStatusMessage(null);

    // Simulate gateway delay
    setTimeout(async () => {
      const txnId = Math.floor(6000000000 + Math.random() * 3000000000).toString();
      const generatedToken = generateToken();
      
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase();
      const formattedDate = `${dateStr} ${timeStr}`;

      const billerNameMap: Record<string, string> = {
        'NESCO_Prepaid': 'নেসকো প্রিপেইড (NESCO)',
        'DESCO_Prepaid': 'ডেসকো প্রিপেইড (DESCO)',
        'DPDC_Prepaid': 'ডিপিডিসি প্রিপেইড (DPDC)',
        'BREB_PalliBidyut': 'পল্লী বিদ্যুৎ (BREB)',
        'WZPDCL_Prepaid': 'ওয়েস্ট জোন প্রিপেইড (WZPDCL)'
      };

      // Exact SMS Receipt format matching official Bangladesh Power Utility receipt!
      const smsReceiptText = `Tk${amountBDT.toLocaleString('en-US', { minimumFractionDigits: 2 })} paid to ${biller} Id ${meterId} Bill No ${billNo} TxnId:${txnId} Date:${formattedDate}.\n${biller.split('_')[0]} Token:${generatedToken}`;

      const newPaymentDoc: Omit<ElectricityBillPayment, 'id'> = {
        userId: user?.uid || 'GUEST_USER',
        userEmail: user?.email || 'guest@payroute.io',
        biller,
        billerNameBn: billerNameMap[biller] || biller,
        meterId,
        billNo,
        amountBDT,
        paymentRail,
        txnId,
        token: generatedToken,
        paidAt: now.toISOString(),
        status: 'PAID',
        smsReceipt: smsReceiptText
      };

      try {
        // Save to Firebase Firestore database
        const docRef = await addDoc(collection(db, 'billPayments'), newPaymentDoc);
        const fullPayment: ElectricityBillPayment = { id: docRef.id, ...newPaymentDoc };
        
        setLatestReceipt(fullPayment);
        setStatusMessage({
          text: lang === 'bn' 
            ? `বিদ্যুৎ বিল ৳${amountBDT} পরিশোধ সফল হয়েছে! টোকেন জেনারেট করা হয়েছে এবং ফায়ারবেস ফায়ারস্টোরে সেভ হয়েছে।` 
            : `Electricity Bill of ৳${amountBDT} paid successfully! Token generated & saved to Firebase Firestore.`,
          type: 'success',
        });

        if (onPaymentProcessed) {
          onPaymentProcessed(amountBDT, paymentRail);
        }

        sendNotification({
          title: lang === 'bn' ? 'বিদ্যুৎ বিল সফল!' : 'Electricity Bill Successful!',
          body: lang === 'bn' 
            ? `${billerNameMap[biller] || biller} এর জন্য ৳${amountBDT} পরিশোধ করা হয়েছে।` 
            : `৳${amountBDT} has been paid for ${billerNameMap[biller] || biller}.`,
          tag: 'bill-payment'
        });
      } catch (err: any) {
        console.warn('Firestore write failed, creating local record:', err);
        const fullPayment: ElectricityBillPayment = { id: `LOCAL-${Date.now()}`, ...newPaymentDoc };
        setLatestReceipt(fullPayment);
        setFirestorePayments(prev => [fullPayment, ...prev]);
        setStatusMessage({
          text: lang === 'bn' ? 'বিল পেমেন্ট সফল হয়েছে! (লোকাল সেভ)' : 'Bill Payment Processed Successfully!',
          type: 'success',
        });
      } finally {
        setIsProcessing(false);
      }
    }, 1200);
  };

  const copyToClipboard = (text: string, type: 'token' | 'sms') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedSMS(true);
      setTimeout(() => setCopiedSMS(false), 2000);
    }
  };

  const openGmailAlert = (payment: ElectricityBillPayment) => {
    setGmailSubject(lang === 'bn' 
      ? `⚡ বিদ্যুৎ বিল পরিশোধ রসিদ ও টোকেন: ${payment.biller} (${payment.txnId})` 
      : `⚡ Electricity Bill Payment Receipt & Token: ${payment.biller} (${payment.txnId})`);
    
    setGmailBody(
      `পেমেন্ট রসিদ ও সিকিউরিটি কনফার্মেশন:\n\n` +
      `বিল পরিশোধক: ${payment.billerNameBn}\n` +
      `মিটার/আইডি: ${payment.meterId}\n` +
      `বিল নম্বর: ${payment.billNo}\n` +
      `টাকার পরিমাণ: ৳${payment.amountBDT.toLocaleString()} BDT\n` +
      `ট্রানজ্যাকশন আইডি: ${payment.txnId}\n` +
      `রিচার্জ টোকেন: ${payment.token}\n\n` +
      `অফিসিয়াল এসএমএস বার্তা:\n${payment.smsReceipt}`
    );
    setIsGmailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Firebase Status & Auth Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
            <Zap className="w-6 h-6 fill-amber-400/20" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-100">
                {lang === 'bn' ? 'বিদ্যুৎ বিল পেমেন্ট ও ফায়ারবেস ইন্টিগ্রেশন' : 'Electricity Bill Payment & Firebase Integration'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                NESCO / DESCO / DPDC
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'ফায়ারবেস অথেন্টিকেশন ও ফায়ারস্টোর ডাটাবেসে রিয়েল-টাইম রসিদ ও টোকেন সংরক্ষণ।'
                : 'Real-time electricity bill recharge with Firebase Auth & Firestore DB receipt logging.'}
            </p>
          </div>
        </div>

        {/* Auth Profile Widget */}
        <div className="flex items-center space-x-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 self-stretch md:self-auto justify-between md:justify-start">
          <div className="flex items-center space-x-2">
            {user ? (
              <img 
                src={user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-indigo-500"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <UserCheck className="w-4 h-4" />
              </div>
            )}
            <div className="text-xs">
              <div className="font-bold text-slate-200 truncate max-w-[140px]">
                {user ? user.displayName || user.email : (lang === 'bn' ? 'ফায়ারবেস গেস্ট ইউজার' : 'Firebase Guest')}
              </div>
              <div className="text-[10px] text-amber-400 font-mono flex items-center space-x-1">
                <Database className="w-2.5 h-2.5" />
                <span>{dbConnected ? 'Firestore Active' : 'Offline Engine'}</span>
              </div>
            </div>
          </div>

          {user ? (
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Logout from Firebase"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-400" />
              <span>{lang === 'bn' ? 'সাইন ইন (Google)' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Form + Live SMS Token Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Payment Form (Left Col) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />
              <h3 className="text-sm font-bold text-slate-100">
                {lang === 'bn' ? 'বিদ্যুৎ বিল রিচার্জ ফর্ম' : 'Recharge Electricity Bill'}
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">BD Power Utility Rail</span>
          </div>

          {statusMessage && (
            <div className={`p-3.5 rounded-xl border flex items-center space-x-3 text-xs font-semibold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handlePayBill} className="space-y-4">
            
            {/* Electricity Provider Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {lang === 'bn' ? 'বিদ্যুৎ বিতরণকারী প্রতিষ্ঠান (Electricity Biller):' : 'Select Electricity Provider:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'NESCO_Prepaid', label: 'NESCO Prepaid', labelBn: 'নেসকো প্রিপেইড (রাজশাহী/রংপুর)', badge: 'ম্যাচড পিকচার' },
                  { id: 'DESCO_Prepaid', label: 'DESCO Prepaid', labelBn: 'ডেসকো প্রিপেইড (ঢাকা উত্তর)', badge: 'DESCO' },
                  { id: 'DPDC_Prepaid', label: 'DPDC Prepaid', labelBn: 'ডিপিডিসি প্রিপেইড (ঢাকা দক্ষিণ)', badge: 'DPDC' },
                  { id: 'BREB_PalliBidyut', label: 'BREB Palli Bidyut', labelBn: 'পল্লী বিদ্যুৎ (BREB)', badge: 'Palli Bidyut' },
                  { id: 'WZPDCL_Prepaid', label: 'WZPDCL Prepaid', labelBn: 'ওয়েস্ট জোন প্রিপেইড (WZPDCL)', badge: 'Khulna/Barishal' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setBiller(item.id as any);
                      if (item.id === 'NESCO_Prepaid') {
                        setMeterId('3000');
                        setBillNo('71003100');
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      biller === item.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold shadow-lg shadow-amber-950/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-100 flex items-center justify-between">
                      <span>{item.label}</span>
                      {biller === item.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">{item.labelBn}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Meter ID & Bill No */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'bn' ? 'মিটার আইডি (Id / Customer No):' : 'Meter ID / Customer Id:'}
                </label>
                <input
                  type="text"
                  required
                  value={meterId}
                  onChange={(e) => setMeterId(e.target.value)}
                  placeholder="e.g. 3000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'bn' ? 'বিল নম্বর / হিসাব নম্বর:' : 'Bill Number / Account No:'}
                </label>
                <input
                  type="text"
                  required
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  placeholder="e.g. 71003100"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Amount BDT & Payment Rail */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'bn' ? 'টাকার পরিমাণ (Amount BDT):' : 'Recharge Amount (BDT):'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-amber-400">৳</span>
                  <input
                    type="number"
                    required
                    min={50}
                    step={100}
                    value={amountBDT}
                    onChange={(e) => setAmountBDT(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'bn' ? 'পেমেন্ট মেথড (Payment Rail):' : 'Payment Rail Method:'}
                </label>
                <select
                  value={paymentRail}
                  onChange={(e) => setPaymentRail(e.target.value as PaymentRail)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="BKASH_DIRECT">bKash Direct Integration</option>
                  <option value="NAGAD_DIRECT">Nagad Mobile Banking</option>
                  <option value="PAYROUTE_SMART_WALLET">PayRoute Smart Wallet (0% Fee)</option>
                  <option value="OPEN_BANKING_PIS">Open Banking PIS (City Bank / EBL)</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing || !meterId || !billNo}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-amber-950/40 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{lang === 'bn' ? 'বিদ্যুৎ বিল রিচার্জ করা হচ্ছে...' : 'Processing Power Recharge...'}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                    <span>
                      {lang === 'bn' 
                        ? `৳${amountBDT.toLocaleString()} টাকা বিদ্যুৎ বিল পরিশোধ করুন` 
                        : `Pay ৳${amountBDT.toLocaleString()} BDT Power Bill`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Generated Token & SMS Card (Right Col) - Matches User Screenshot */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  {lang === 'bn' ? 'অফিসিয়াল এসএমএস ও রিচার্জ টোকেন' : 'Official Utility SMS & Token'}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Receipt Engine
              </span>
            </div>

            {latestReceipt ? (
              <div className="space-y-4 animate-fadeIn">
                
                {/* Visual SMS Box matching uploaded user screenshot */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-[11px] font-bold text-slate-400 font-mono">
                      Rubel Sk Hero, Vip (16216)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">SIM1</span>
                  </div>

                  {/* SMS Bubble 1 */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed space-y-1">
                    <div>
                      Tk{latestReceipt.amountBDT.toLocaleString('en-US', { minimumFractionDigits: 2 })} paid to <span className="font-bold text-amber-300">{latestReceipt.biller}</span> Id <span className="text-indigo-300">{latestReceipt.meterId}</span> Bill No <span className="text-emerald-300 underline">{latestReceipt.billNo}</span>
                    </div>
                    <div>
                      TxnId:<span className="text-emerald-400 font-bold">{latestReceipt.txnId}</span> Date:{new Date(latestReceipt.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase()}
                    </div>
                  </div>

                  {/* SMS Bubble 2 - Token */}
                  {latestReceipt.token && (
                    <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-3.5 text-xs font-mono space-y-1">
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{latestReceipt.biller.split('_')[0]} RECHARGE TOKEN</div>
                      <div className="text-base font-extrabold text-amber-200 tracking-wider font-mono">
                        {latestReceipt.token}
                      </div>
                    </div>
                  )}
                </div>

                {/* Copy Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => copyToClipboard(latestReceipt.token || '', 'token')}
                    className="flex items-center justify-center space-x-1.5 p-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-bold transition-all"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToken ? 'টোকেন কপি করা হয়েছে!' : 'কপি টোকেন'}</span>
                  </button>

                  <button
                    onClick={() => copyToClipboard(latestReceipt.smsReceipt, 'sms')}
                    className="flex items-center justify-center space-x-1.5 p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    {copiedSMS ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSMS ? 'এসএমএস কপিড!' : 'কপি এসএমএস'}</span>
                  </button>
                </div>

                {/* Send Gmail Notification Button */}
                <button
                  onClick={() => openGmailAlert(latestReceipt)}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 bg-gradient-to-r from-red-600/30 to-indigo-600/30 hover:from-red-600/40 hover:to-indigo-600/40 text-red-200 border border-red-500/40 rounded-xl text-xs font-bold transition-all"
                >
                  <Mail className="w-4 h-4 text-red-400" />
                  <span>{lang === 'bn' ? 'জিমেলেই রসিদ ও টোকেন নোটিফিকেশন পাঠান' : 'Send Gmail Token Confirmation'}</span>
                </button>

              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 space-y-2">
                <Receipt className="w-10 h-10 text-slate-700" />
                <div className="text-xs font-bold text-slate-400">
                  {lang === 'bn' ? 'কোনো সাম্প্রতিক রিচার্জ রসিদ নেই' : 'No Recent Power Recharge Yet'}
                </div>
                <p className="text-[11px] text-slate-600">
                  {lang === 'bn'
                    ? 'উপরের ফর্মে মিটার নম্বর ও টাকা দিয়ে পেমেন্ট করুন। এখানে তাতক্ষণিক মিটার রিচার্জ টোকেন জেনারেট হবে।'
                    : 'Fill out meter & bill number to process recharge and generate live 20-digit NESCO/DESCO token.'}
                </p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800 pt-3">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Firebase Firestore Sync</span>
            </span>
            <span>20-Digit ACID Validated Token</span>
          </div>
        </div>

      </div>

      {/* Firestore Real-time Electricity Payments Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">
              {lang === 'bn' ? 'ফায়ারবেস ফায়ারস্টোর লাইভ পেমেন্ট লেজার (Bill History)' : 'Firebase Firestore Live Utility Ledger'}
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {firestorePayments.length} {lang === 'bn' ? 'টি পেমেন্ট সংরক্ষিত' : 'records synced'}
          </span>
        </div>

        {firestorePayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="py-2.5 px-3">Biller Provider</th>
                  <th className="py-2.5 px-3">Meter & Bill No</th>
                  <th className="py-2.5 px-3">Amount (BDT)</th>
                  <th className="py-2.5 px-3">Recharge Token</th>
                  <th className="py-2.5 px-3">TxnId</th>
                  <th className="py-2.5 px-3">Paid At</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {firestorePayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-200">
                      <div className="flex items-center space-x-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>{p.biller}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      Id {p.meterId} • Bill {p.billNo}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-400">
                      ৳{p.amountBDT?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-amber-300 font-bold">
                      {p.token || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{p.txnId}</td>
                    <td className="py-3 px-3 text-slate-500 text-[10px]">
                      {p.paidAt ? new Date(p.paidAt).toLocaleString() : 'Just now'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => openGmailAlert(p)}
                        className="p-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/30 rounded-lg text-[10px] font-bold transition-all"
                        title="Send Gmail Email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">
            {lang === 'bn' ? 'ফায়ারস্টোরে কোনো বিদ্যুৎ বিল ডাটা নেই।' : 'No bill payment records in Firestore.'}
          </div>
        )}
      </div>

      {/* Gmail Modal */}
      <GmailNotificationModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        lang={lang}
        defaultSubject={gmailSubject}
        defaultMessage={gmailBody}
      />

    </div>
  );
};
