import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { 
  Wallet, 
  Transaction, 
  LedgerEntry, 
  PaymentRail,
  WalletLimit
} from '../types';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRight,
  ShieldCheck, 
  Lock, 
  Hash, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Info, 
  Building,
  Sliders,
  ShieldAlert,
  Edit3,
  SlidersHorizontal,
  Zap,
  Check,
  X,
  KeyRound,
  SmartphoneNfc,
  Fingerprint,
  Timer,
  Key,
  Shield,
  QrCode,
  Scan,
  Copy,
  Download,
  Camera,
  Share2,
  Smartphone,
  Gift,
  Upload,
  Sparkles,
  TrendingUp,
  Search
} from 'lucide-react';

interface WalletLedgerViewProps {
  lang: 'en' | 'bn';
  wallets: Wallet[];
  transactions: Transaction[];
  ledgerEntries: LedgerEntry[];
  rails: PaymentRail[];
  onExecuteTransfer: (data: {
    senderWalletId: string;
    receiverWalletId: string;
    amount: number;
    requestedRail: string;
    reference: string;
    idempotencyKey: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { RecurringTransfer, RecurringFrequency } from '../types';

export const WalletLedgerView: React.FC<WalletLedgerViewProps> = ({
  lang,
  wallets,
  transactions,
  ledgerEntries,
  rails,
  onExecuteTransfer,
}) => {
  const [senderId, setSenderId] = useState<string>(wallets[0]?.id || '');
  const [receiverId, setReceiverId] = useState<string>(wallets[1]?.id || '');
  const [amount, setAmount] = useState<string>('5000');
  const [selectedRail, setSelectedRail] = useState<string>('INTERNAL');
  const [reference, setReference] = useState<string>('Service Fee Settlement');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    `IDEMP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferMessage, setTransferMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');

  // Limits State
  const [limits, setLimits] = useState<WalletLimit[]>([]);
  const [editingLimit, setEditingLimit] = useState<WalletLimit | null>(null);
  const [editDailyCap, setEditDailyCap] = useState<string>('');
  const [editMonthlyCap, setEditMonthlyCap] = useState<string>('');
  const [editThreshold, setEditThreshold] = useState<string>('80');
  const [limitUpdateMsg, setLimitUpdateMsg] = useState<string | null>(null);
  const [isSavingLimit, setIsSavingLimit] = useState(false);

  // 7-Day Transaction Trend Data Processor
  const trendData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return days.map(date => {
      const dailyTxs = transactions.filter(tx => tx.timestamp.startsWith(date) && tx.status === 'SUCCESS');
      const volume = dailyTxs.reduce((sum, tx) => sum + tx.amount, 0);
      const count = dailyTxs.length;
      
      const displayDate = new Date(date).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        month: 'short',
        day: 'numeric'
      });

      return {
        date: displayDate,
        volume,
        count
      };
    });
  }, [transactions, lang]);
  
  // 30-Day Transaction Volume Data Processor for Selected Wallet
  const monthlyVolumeData = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });

    return days.map(date => {
      // Filter transactions for this specific day and the currently selected senderId
      const dailyTxs = transactions.filter(tx => 
        tx.timestamp.startsWith(date) && 
        tx.status === 'SUCCESS' && 
        (tx.senderWalletId === senderId || tx.receiverWalletId === senderId)
      );
      
      const volume = dailyTxs.reduce((sum, tx) => sum + tx.amount, 0);
      
      const displayDate = new Date(date).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        month: 'short',
        day: 'numeric'
      });

      return {
        date: displayDate,
        fullDate: date,
        volume
      };
    });
  }, [transactions, lang, senderId]);

  // Mock 2FA Verification State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'totp' | 'hardware'>('sms');
  const [otpCode, setOtpCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [force2FA, setForce2FA] = useState(false);
  const [otpTimer, setOtpTimer] = useState(30);
  const profileId = 'c45cfdf2-e229-4f95-a845-afef0163b1d0';

  // Recurring Transfers State
  const [recurringTransfers, setRecurringTransfers] = useState<RecurringTransfer[]>([]);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isSavingRecurring, setIsSavingRecurring] = useState(false);
  const [recFreq, setRecFreq] = useState<RecurringFrequency>('MONTHLY');
  const [recDesc, setRecDesc] = useState('');
  const [recStartDate, setRecStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Sync Recurring Transfers from Firestore
  useEffect(() => {
    try {
      const q = query(collection(db, 'recurringTransfers'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const transfers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as RecurringTransfer));
        setRecurringTransfers(transfers);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn('Firestore Recurring sync failed:', err);
    }
  }, []);

  const handleSaveRecurring = async () => {
    setIsSavingRecurring(true);
    try {
      const sender = wallets.find(w => w.id === senderId);
      const receiver = wallets.find(w => w.id === receiverId);
      
      const newRecurring: Partial<RecurringTransfer> = {
        senderWalletId: senderId,
        senderName: sender?.ownerName || 'Unknown',
        receiverWalletId: receiverId,
        receiverName: receiver?.ownerName || 'Unknown',
        amount: parseFloat(amount),
        currency: (sender?.currency as any) || 'BDT',
        frequency: recFreq,
        startDate: recStartDate,
        nextExecutionDate: recStartDate, // In real app, calculate based on frequency
        status: 'ACTIVE',
        description: recDesc || reference,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'recurringTransfers'), newRecurring);
      setIsRecurringModalOpen(false);
      setRecDesc('');
      setTransferMessage({
        type: 'success',
        text: lang === 'bn' ? 'রিকারিং ট্রান্সফার সফলভাবে শিডিউল করা হয়েছে!' : 'Recurring transfer scheduled successfully!'
      });
    } catch (err) {
      console.error('Save Recurring Error:', err);
      alert('Failed to schedule recurring transfer.');
    } finally {
      setIsSavingRecurring(false);
    }
  };

  const handleToggleRecurringStatus = async (tx: RecurringTransfer) => {
    const newStatus = tx.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const ref = doc(db, 'recurringTransfers', tx.id);
      await updateDoc(ref, { status: newStatus });
    } catch (err) {
      console.error('Update Status Error:', err);
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    if (!confirm(lang === 'bn' ? 'আপনি কি এই শিডিউলটি ডিলিট করতে চান?' : 'Are you sure you want to delete this schedule?')) return;
    try {
      const ref = doc(db, 'recurringTransfers', id);
      await deleteDoc(ref);
    } catch (err) {
      console.error('Delete Recurring Error:', err);
    }
  };

  // Filtered Transactions Processor
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter(tx => {
      const dateStr = new Date(tx.timestamp).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US');
      return (
        tx.receiverName.toLowerCase().includes(term) ||
        tx.senderName.toLowerCase().includes(term) ||
        tx.id.toLowerCase().includes(term) ||
        tx.reference.toLowerCase().includes(term) ||
        dateStr.includes(term) ||
        tx.timestamp.includes(term)
      );
    });
  }, [transactions, searchTerm, lang]);

  const HIGH_VALUE_THRESHOLD = 50000; // ৳50,000 threshold for 2FA requirement
  
  const handleShareTransaction = async (tx: Transaction) => {
    const shareData = {
      title: lang === 'bn' ? 'PayRoute ট্রানজ্যাকশন রিপোর্ট' : 'PayRoute Transaction Report',
      text: lang === 'bn' 
        ? `${tx.receiverName}-কে ${tx.amount} ${tx.currency} পাঠানো হয়েছে। স্ট্যাটাস: ${tx.status}। রেফারেন্স: ${tx.reference}`
        : `Sent ${tx.amount} ${tx.currency} to ${tx.receiverName}. Status: ${tx.status}. Ref: ${tx.reference}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(shareData.text + ' ' + shareData.url);
      alert(lang === 'bn' ? 'তথ্য ক্লিপবোর্ডে কপি করা হয়েছে!' : 'Information copied to clipboard!');
    }
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = lang === 'bn' ? 'PayRoute লেনদেন রিপোর্ট' : 'PayRoute Transaction Report';
    const subTitle = lang === 'bn' ? 'ফিল্টারকৃত লেনদেনের তালিকা' : 'Filtered Transaction List';
    
    let tableHtml = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: #fff; line-height: 1.5; }
            .header { border-bottom: 2px solid #e2e8f0; margin-bottom: 30px; padding-bottom: 20px; }
            h1 { margin: 0; font-size: 24px; color: #0f172a; }
            p { margin: 5px 0; color: #64748b; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #cbd5e1; font-size: 10px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; }
            td { padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; vertical-align: middle; }
            .amount { text-align: right; font-weight: bold; font-family: 'Courier New', monospace; }
            .status { font-weight: bold; font-size: 9px; text-transform: uppercase; padding: 3px 6px; border-radius: 4px; border: 1px solid #cbd5e1; display: inline-block; min-width: 60px; text-align: center; }
            .success { color: #059669; background: #ecfdf5; border-color: #10b981; }
            .failed { color: #dc2626; background: #fef2f2; border-color: #ef4444; }
            .pending { color: #d97706; background: #fffbeb; border-color: #f59e0b; }
            .footer { margin-top: 50px; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>${subTitle}</p>
            <div style="display: flex; justify-content: space-between; margin-top: 15px;">
              <div>
                <p><strong>Generated:</strong> ${new Date().toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}</p>
                <p><strong>Records:</strong> ${filteredTransactions.length}</p>
              </div>
              <div style="text-align: right;">
                <p><strong>PayRoute Ledger</strong></p>
                <p>Security-First Payment Engine</p>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>TX ID</th>
                <th>Sender</th>
                <th>Receiver</th>
                <th style="text-align: right;">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(tx => `
                <tr>
                  <td>${new Date(tx.timestamp).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}</td>
                  <td style="font-family: monospace;">${tx.id.substring(0, 10)}</td>
                  <td>${tx.senderName}</td>
                  <td>${tx.receiverName}</td>
                  <td class="amount">৳${tx.amount.toLocaleString()}</td>
                  <td><span class="status ${tx.status.toLowerCase()}">${tx.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            PayRoute Transaction Ledger Report. Confidential - For Internal Use Only.
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(tableHtml);
    printWindow.document.close();
  };

  const handleShareReferral = async () => {
    const shareData = {
      title: lang === 'bn' ? 'PayRoute-এ জয়েন করুন' : 'Join PayRoute Ledger',
      text: lang === 'bn'
        ? 'নিরাপদ এবং দ্রুত পেমেন্ট লেজার সিস্টেম PayRoute ব্যবহার করুন। আমার রেফারেল লিঙ্ক দিয়ে সাইন আপ করুন!'
        : 'Use PayRoute, the secure and fast payment ledger system. Sign up using my referral link!',
      url: `${window.location.origin}?ref=ADMIN-${profileId.substring(0, 8)}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing referral:', err);
      }
    } else {
      navigator.clipboard.writeText(shareData.text + ' ' + shareData.url);
      alert(lang === 'bn' ? 'রেফারেল লিঙ্ক ক্লিপবোর্ডে কপি করা হয়েছে!' : 'Referral link copied to clipboard!');
    }
  };

  // QR Code State & Handlers
  const [showQRGeneratorModal, setShowQRGeneratorModal] = useState(false);
  const [showQRScannerModal, setShowQRScannerModal] = useState(false);
  const [qrReceiveWalletId, setQrReceiveWalletId] = useState<string>(wallets[0]?.id || '');
  const [qrRequestedAmount, setQrRequestedAmount] = useState<string>('');
  const [qrRequestedRef, setQrRequestedRef] = useState<string>('P2P Payment Request');
  const [generatedQRUrl, setGeneratedQRUrl] = useState<string>('');
  const [copiedQRText, setCopiedQRText] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);
  const [scannerTab, setScannerTab] = useState<'camera' | 'upload'>('camera');
  const [scanSimulating, setScanSimulating] = useState(false);

  // Real-time QR Code Generator Effect
  useEffect(() => {
    const targetWallet = wallets.find(w => w.id === qrReceiveWalletId) || wallets[0];
    if (!targetWallet) return;

    const payloadObj = {
      protocol: 'payroute-p2p',
      version: '1.0',
      receiverId: targetWallet.id,
      receiverName: targetWallet.ownerName,
      accountNo: targetWallet.accountNo,
      amount: parseFloat(qrRequestedAmount) || 0,
      currency: targetWallet.currency,
      reference: qrRequestedRef || 'P2P Payment Request'
    };

    const payloadStr = JSON.stringify(payloadObj);

    QRCode.toDataURL(payloadStr, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    }).then(url => {
      setGeneratedQRUrl(url);
    }).catch(err => {
      console.error('Failed to generate QR code data URL:', err);
    });
  }, [qrReceiveWalletId, qrRequestedAmount, qrRequestedRef, wallets]);

  const handleCopyQRPayload = () => {
    const targetWallet = wallets.find(w => w.id === qrReceiveWalletId) || wallets[0];
    if (!targetWallet) return;
    const str = `payroute://p2p?receiverId=${targetWallet.id}&amount=${qrRequestedAmount || '0'}&accountNo=${targetWallet.accountNo}&reference=${encodeURIComponent(qrRequestedRef)}`;
    navigator.clipboard.writeText(str);
    setCopiedQRText(true);
    setTimeout(() => setCopiedQRText(false), 2000);
  };

  const handleProcessScanData = (dataStr: string) => {
    setScanSimulating(true);
    setScannerStatus(null);

    setTimeout(() => {
      setScanSimulating(false);
      try {
        let recId = '';
        let amt = '';
        let ref = '';

        if (dataStr.trim().startsWith('{')) {
          const parsed = JSON.parse(dataStr);
          recId = parsed.receiverId || parsed.id || '';
          amt = parsed.amount ? parsed.amount.toString() : '';
          ref = parsed.reference || '';
        } else if (dataStr.includes('receiverId=')) {
          const params = new URLSearchParams(dataStr.split('?')[1] || dataStr);
          recId = params.get('receiverId') || '';
          amt = params.get('amount') || '';
          ref = params.get('reference') || '';
        } else {
          const found = wallets.find(w => w.id === dataStr.trim() || w.accountNo === dataStr.trim());
          if (found) recId = found.id;
        }

        const validWallet = wallets.find(w => w.id === recId);
        if (validWallet) {
          setReceiverId(validWallet.id);
          if (amt && parseFloat(amt) > 0) {
            setAmount(amt);
          }
          if (ref) {
            setReference(ref);
          } else {
            setReference(`P2P Transfer to ${validWallet.ownerName}`);
          }

          setScannerStatus({
            type: 'success',
            text: lang === 'bn' 
              ? `QR স্ক্যান সফল! প্রাপক: ${validWallet.ownerName} (${validWallet.accountNo})` 
              : `QR Scan successful! Receiver set to ${validWallet.ownerName} (${validWallet.accountNo})`
          });

          setTimeout(() => {
            setShowQRScannerModal(false);
            setScannerStatus(null);
            const el = document.getElementById('transfer-form-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 1200);
        } else {
          setScannerStatus({
            type: 'error',
            text: lang === 'bn' 
              ? 'QR কোডে কোনো নিবন্ধিত ওয়ালেট অ্যাকাউন্ট পাওয়া যায়নি।' 
              : 'Unregistered or invalid wallet ID in QR code payload.'
          });
        }
      } catch (e) {
        setScannerStatus({
          type: 'error',
          text: lang === 'bn' ? 'QR কোড ফরম্যাট অবৈধ।' : 'Invalid QR code payload format.'
        });
      }
    }, 600);
  };

  useEffect(() => {
    let interval: any;
    if (show2FAModal && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [show2FAModal, otpTimer]);

  const fetchLimits = async () => {
    try {
      const res = await fetch('/api/ledger/limits');
      const data = await res.json();
      if (data.limits) {
        setLimits(data.limits);
      }
    } catch (err) {
      console.error('Failed to fetch wallet limits:', err);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, [transactions]);

  const handleOpenEditModal = (lim: WalletLimit) => {
    setEditingLimit(lim);
    setEditDailyCap(lim.dailyCap.toString());
    setEditMonthlyCap(lim.monthlyCap.toString());
    setEditThreshold(lim.alertOnThresholdPercent.toString());
    setLimitUpdateMsg(null);
  };

  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLimit) return;
    setIsSavingLimit(true);
    setLimitUpdateMsg(null);

    try {
      const res = await fetch('/api/ledger/limits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletId: editingLimit.walletId,
          dailyCap: parseFloat(editDailyCap),
          monthlyCap: parseFloat(editMonthlyCap),
          alertOnThresholdPercent: parseFloat(editThreshold)
        })
      });
      const data = await res.json();
      if (data.success) {
        setLimitUpdateMsg(
          lang === 'bn' 
            ? 'ট্রানজ্যাকশন লিমিট ক্যাপ সফলভাবে সংরক্ষিত হয়েছে!' 
            : 'Wallet limits updated successfully!'
        );
        fetchLimits();
        setTimeout(() => {
          setEditingLimit(null);
          setLimitUpdateMsg(null);
        }, 1200);
      }
    } catch (err: any) {
      setLimitUpdateMsg(err.message || 'Failed to update limit');
    } finally {
      setIsSavingLimit(false);
    }
  };

  const handleTestBreach = (lim: WalletLimit) => {
    setSenderId(lim.walletId);
    const rec = wallets.find(w => w.id !== lim.walletId);
    if (rec) setReceiverId(rec.id);
    // Set amount to exceed daily limit
    const breachAmt = lim.dailyCap - lim.currentDailySpent + 10000;
    setAmount(Math.max(breachAmt, lim.dailyCap + 5000).toString());
    setReference(`LIMIT BREACH TEST (${lim.walletId})`);
    
    // Scroll down to transfer form
    const el = document.getElementById('transfer-form-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const executeTransferNow = async () => {
    setTransferMessage(null);
    setIsSubmitting(true);

    try {
      const res = await onExecuteTransfer({
        senderWalletId: senderId,
        receiverWalletId: receiverId,
        amount: parseFloat(amount),
        requestedRail: selectedRail,
        reference,
        idempotencyKey,
      });

      if (res.success) {
        setTransferMessage({
          type: 'success',
          text: lang === 'bn' 
            ? 'ট্রান্সফার সফল হয়েছে! লেজার ডাটাবেজ এসিড ট্রানজ্যাকশন সম্পন্ন করেছে।' 
            : 'Transfer executed successfully! Ledger committed ACID transaction.',
        });
        // Refresh idempotency key and limits
        setIdempotencyKey(`IDEMP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`);
        fetchLimits();
      } else {
        setTransferMessage({
          type: 'error',
          text: res.error || (lang === 'bn' ? 'ট্রান্সফার ব্যর্থ হয়েছে।' : 'Transfer failed.'),
        });
        fetchLimits();
      }
    } catch (err: any) {
      setTransferMessage({
        type: 'error',
        text: err.message || 'An error occurred during transfer execution.',
      });
      fetchLimits();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount) || 0;
    
    // Check if high-value transfer or 2FA forced
    if (parsedAmt >= HIGH_VALUE_THRESHOLD || force2FA) {
      setOtpCode('');
      setTwoFactorError(null);
      setOtpTimer(30);
      setShow2FAModal(true);
    } else {
      executeTransferNow();
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError(null);

    if (!otpCode || otpCode.trim().length < 4) {
      setTwoFactorError(lang === 'bn' ? 'অনুগ্রহ করে সঠিক ৬-ডিজিটের ওটিপি প্রবেশ করান' : 'Please enter a valid 6-digit verification OTP');
      return;
    }

    setIsVerifying2FA(true);

    // Simulate HSM token authorization check delay
    setTimeout(async () => {
      if (otpCode.trim() === '884921' || otpCode.trim().length === 6) {
        setIsVerifying2FA(false);
        setShow2FAModal(false);
        executeTransferNow();
      } else {
        setIsVerifying2FA(false);
        setTwoFactorError(
          lang === 'bn'
            ? 'ভুল ২এফএ সিকিউরিটি কোড! সঠিক কোড দিন (ডিমো ওটিপি: 884921)'
            : 'Invalid 2FA security code! Please enter the correct code (Demo OTP: 884921)'
        );
      }
    }, 900);
  };

  const selectedSenderWallet = wallets.find((w) => w.id === senderId);

  return (
    <div className="space-y-8">
      {/* GLOBAL SEARCH INPUT */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-md flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-500" />
            </div>
            <input
              type="text"
              placeholder={lang === 'bn' ? 'প্রেরক, প্রাপক, রেফারেন্স আইডি বা তারিখ দিয়ে খুঁজুন...' : 'Search transactions by sender, receiver, reference, or date...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
              {filteredTransactions.length} {lang === 'bn' ? 'ফলাফল' : 'Results'}
            </span>
          </div>
        </div>

        {/* REFERRAL SHARE CARD */}
        <button 
          onClick={handleShareReferral}
          className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-4 hover:from-emerald-600/30 hover:to-teal-600/30 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 group-hover:scale-110 transition-transform">
            <Gift className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-sm font-bold text-emerald-100">{lang === 'bn' ? 'বন্ধুদের রেফার করুন' : 'Refer Friends'}</div>
            <div className="text-[10px] text-emerald-400/80 font-medium">{lang === 'bn' ? '৳৫০০ বোনাস জিতে নিন!' : 'Win ৳500 Bonus!'}</div>
          </div>
          <div className="ml-auto p-2 bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/20">
            <Share2 className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* SECTION 1: WALLET BALANCES SUMMARY GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <WalletIcon className="w-5 h-5 text-blue-400" />
              <span>{lang === 'bn' ? 'সিস্টেম অ্যাকাউন্টের ব্যালেন্স ও ওয়ালেট' : 'System Accounts & Wallet Balances'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'bn' 
                ? 'রিয়েল-টাইম ডাবল-এন্ট্রি ব্যালেন্স। প্রতিটি পরিবর্তন ডাটাবেজে এসিড আইসোলেশনে সংরক্ষিত হয়।' 
                : 'Real-time double-entry balances with strict ACID isolation and cryptographic verification.'}
            </p>
          </div>
        </div>

        <div className="grid grid-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {wallets.map((wallet) => (
            <div 
              key={wallet.id}
              className={`p-4 rounded-xl border transition-all ${
                wallet.ownerType === 'system'
                  ? 'bg-slate-900/90 border-indigo-500/30'
                  : wallet.ownerType === 'merchant'
                  ? 'bg-slate-900/90 border-emerald-500/30'
                  : wallet.ownerType === 'business'
                  ? 'bg-slate-900/90 border-blue-500/30'
                  : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-400">{wallet.accountNo}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                  wallet.ownerType === 'system' ? 'bg-indigo-500/20 text-indigo-300' :
                  wallet.ownerType === 'merchant' ? 'bg-emerald-500/20 text-emerald-300' :
                  wallet.ownerType === 'business' ? 'bg-blue-500/20 text-blue-300' :
                  'bg-slate-800 text-slate-300'
                }`}>
                  {wallet.ownerType}
                </span>
              </div>

              <div className="text-sm font-semibold text-slate-200 truncate">{wallet.ownerName}</div>

              <div className="mt-3 text-2xl font-bold text-white tracking-tight">
                ৳ {wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs font-normal text-slate-400 ml-1">{wallet.currency}</span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>{lang === 'bn' ? 'লকড:' : 'Locked:'} ৳{wallet.lockedBalance}</span>
                </div>
                {wallet.overdraftLimit > 0 && (
                  <span className="text-amber-400/90 font-medium">
                    {lang === 'bn' ? 'ওভারড্রাফট:' : 'OD:'} ৳{wallet.overdraftLimit.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: TRANSACTION VOLUME TREND DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>{lang === 'bn' ? '৭ দিনের লেনদেনের ট্রেন্ড' : '7-Day Transaction Trend'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'bn' 
                  ? 'গত ৭ দিনের সফল লেনদেনের ভলিউম ও ফ্রিকোয়েন্সি অ্যানালিটিক্স।' 
                  : 'Volume and frequency analytics for successful transactions over the last 7 days.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] font-bold text-emerald-300 uppercase">Volume</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(value) => `৳${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#10b981' }}
                  formatter={(value: number) => [`৳${value.toLocaleString()}`, lang === 'bn' ? 'ভলিউম' : 'Volume']}
                />
                <Bar 
                  dataKey="volume" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  animationDuration={1500}
                >
                  {trendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.volume > 0 ? '#10b981' : '#1e293b'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>{lang === 'bn' ? 'ট্রানজ্যাকশন ফ্রিকোয়েন্সি' : 'Daily Frequency'}</span>
            </h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(value: number) => [value, lang === 'bn' ? 'ট্রানজ্যাকশন' : 'Transactions']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={1500}>
                    {trendData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#6366f1' : '#1e293b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{lang === 'bn' ? 'মোট ৭ দিনের ভলিউম:' : 'Total 7-Day Volume:'}</span>
              <span className="text-sm font-bold text-white">৳ {trendData.reduce((s, i) => s + i.volume, 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{lang === 'bn' ? 'গড় দৈনিক ভলিউম:' : 'Avg Daily Volume:'}</span>
              <span className="text-sm font-bold text-indigo-400">৳ {Math.round(trendData.reduce((s, i) => s + i.volume, 0) / 7).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: 30-DAY MONTHLY VOLUME INSIGHTS */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BarChart className="w-5 h-5 text-blue-400" />
              <span>{lang === 'bn' ? '৩০ দিনের লেনদেন ভলিউম গ্রাফ' : '30-Day Monthly Transaction Volume'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'bn' 
                ? `ওয়ালেট: ${selectedSenderWallet?.ownerName} (${selectedSenderWallet?.accountNo}) এর গত ৩০ দিনের লেনদেনের পরিমাণ।` 
                : `Daily transaction volume for ${selectedSenderWallet?.ownerName} (${selectedSenderWallet?.accountNo}) over the last 30 days.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              {lang === 'bn' ? 'লাইভ ডাটা' : 'LIVE DATA'}
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full bg-slate-950/40 rounded-xl p-4 border border-slate-800/50">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.4} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 9 }}
                dy={10}
                interval={2}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 9 }}
                tickFormatter={(value) => `৳${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid #334155', 
                  borderRadius: '12px', 
                  fontSize: '11px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ color: '#60a5fa' }}
                cursor={{ stroke: '#334155', strokeWidth: 2 }}
                formatter={(value: number) => [`৳${value.toLocaleString()}`, lang === 'bn' ? 'ভলিউম' : 'Daily Volume']}
              />
              <Line 
                type="monotone" 
                dataKey="volume" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }}
                animationDuration={2000}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{lang === 'bn' ? 'সর্বোচ্চ দৈনিক ভলিউম' : 'Peak Daily Volume'}</div>
            <div className="text-lg font-bold text-white">৳ {Math.max(...monthlyVolumeData.map(d => d.volume)).toLocaleString()}</div>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{lang === 'bn' ? 'মোট ৩০ দিনের ভলিউম' : 'Total 30-Day Volume'}</div>
            <div className="text-lg font-bold text-blue-400">৳ {monthlyVolumeData.reduce((s, d) => s + d.volume, 0).toLocaleString()}</div>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{lang === 'bn' ? 'গড় ভলিউম (দৈনিক)' : 'Average Volume'}</div>
            <div className="text-lg font-bold text-slate-300">৳ {Math.round(monthlyVolumeData.reduce((s, d) => s + d.volume, 0) / 30).toLocaleString()}</div>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/50">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{lang === 'bn' ? 'লেনদেনের স্থিতি' : 'Wallet Status'}</div>
            <div className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {lang === 'bn' ? 'সক্রিয়' : 'Healthy'}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: TRANSACTION LIMITS & CAP COMPLIANCE MODULE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-100 font-bold text-lg">
              <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
              <h3>{lang === 'bn' ? 'ট্রানজ্যাকশন লিমিট ও কমপ্লায়েন্স ক্যাপস' : 'Wallet Transaction Limits & Compliance Caps'}</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                Real-Time Enforcer
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'bn' 
                ? 'দৈনিক ও মাসিক লেনদেনের ক্যাপ সেট করুন। যেকোনো অতিরিক্ত লেনদেনে লাইভ সিকিউরিটি অ্যালার্ট ট্রিগার ও ট্রানজ্যাকশন রিজেক্ট হবে।' 
                : 'Set daily and monthly spending caps per wallet with automated risk engine enforcement and instant alert generation.'}
            </p>
          </div>

          <button
            onClick={fetchLimits}
            className="self-start md:self-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            {lang === 'bn' ? 'লিমিট রিফ্রেশ' : 'Refresh Limits'}
          </button>
        </div>

        {/* Limit Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {limits.map((lim) => {
            const dailyPct = Math.min(100, Math.round((lim.currentDailySpent / lim.dailyCap) * 100));
            const monthlyPct = Math.min(100, Math.round((lim.currentMonthlySpent / lim.monthlyCap) * 100));

            const isExceeded = lim.status === 'LIMIT_EXCEEDED';
            const isWarning = lim.status === 'WARNING';

            return (
              <div 
                key={lim.walletId}
                className={`bg-slate-950 border rounded-2xl p-4 shadow-md space-y-3 relative overflow-hidden transition-all ${
                  isExceeded 
                    ? 'border-rose-500/50 bg-rose-950/10' 
                    : isWarning 
                    ? 'border-amber-500/50 bg-amber-950/10' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-bold text-white truncate max-w-[160px]">{lim.ownerName}</div>
                    <div className="text-[10px] font-mono text-slate-400">{lim.walletId}</div>
                  </div>

                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    isExceeded 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                      : isWarning 
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {lim.status}
                  </span>
                </div>

                {/* Daily Cap Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">{lang === 'bn' ? 'দৈনিক লিমিট:' : 'Daily Cap:'}</span>
                    <span className="font-mono font-bold text-slate-200">
                      ৳{lim.currentDailySpent.toLocaleString()} / ৳{lim.dailyCap.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        dailyPct >= 100 
                          ? 'bg-rose-500' 
                          : dailyPct >= lim.alertOnThresholdPercent 
                          ? 'bg-amber-400' 
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${dailyPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>{dailyPct}% Spent</span>
                    <span>Alert at {lim.alertOnThresholdPercent}%</span>
                  </div>
                </div>

                {/* Monthly Cap Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-semibold">{lang === 'bn' ? 'মাসিক লিমিট:' : 'Monthly Cap:'}</span>
                    <span className="font-mono font-bold text-slate-200">
                      ৳{lim.currentMonthlySpent.toLocaleString()} / ৳{lim.monthlyCap.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        monthlyPct >= 100 
                          ? 'bg-rose-500' 
                          : monthlyPct >= lim.alertOnThresholdPercent 
                          ? 'bg-amber-400' 
                          : 'bg-indigo-400'
                      }`}
                      style={{ width: `${monthlyPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500">
                    <span>{monthlyPct}% Spent</span>
                    <span>Cap Limit</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleOpenEditModal(lim)}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {lang === 'bn' ? 'লিমিট পরিবর্তন' : 'Edit Cap'}
                  </button>

                  <button
                    onClick={() => handleTestBreach(lim)}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/20 transition"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {lang === 'bn' ? 'লিমিট টেস্ট' : 'Test Breach'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: ATOMIC TRANSFER EXECUTION FORM & GATEWAY SELECTOR */}
      <div id="transfer-form-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 text-slate-100 font-bold text-lg">
              <Send className="w-5 h-5 text-blue-400" />
              <h3>{lang === 'bn' ? 'অটোমেটেড লেজার ট্রান্সফার' : 'Automated Ledger Transfer'}</h3>
            </div>

            {/* QR Quick Action Triggers */}
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setShowQRScannerModal(true)}
                className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg transition shadow-md shadow-indigo-600/20"
                title={lang === 'bn' ? 'QR কোড স্ক্যান করুন' : 'Scan P2P QR Code'}
              >
                <Scan className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'bn' ? 'QR স্ক্যান' : 'Scan QR'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQRGeneratorModal(true)}
                className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs px-2.5 py-1.5 rounded-lg transition"
                title={lang === 'bn' ? 'আমার QR কোড তৈরি করুন' : 'My QR Code'}
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">{lang === 'bn' ? 'মাই QR' : 'My QR'}</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            {lang === 'bn' 
              ? 'একটি অ্যাকাউন্ট থেকে ডেবিক এবং অন্য অ্যাকাউন্টে ক্রেডিট একই সাথে একটি একক এসিড ট্রানজ্যাকশন হিসেবে রান হয়।' 
              : 'Executes atomic DEBIT and CREDIT in a single ACID transaction step.'}
          </p>

          {transferMessage && (
            <div className={`p-3.5 rounded-xl mb-5 flex items-start space-x-2 text-xs font-medium border ${
              transferMessage.type === 'success' 
                ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-950/50 border-rose-500/30 text-rose-300'
            }`}>
              {transferMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{transferMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleTransferSubmit} className="space-y-4">
            {/* Sender Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'bn' ? 'সেন্ডার ওয়ালেট (DEBIT)' : 'Sender Wallet (DEBIT Account)'}
              </label>
              <select
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.ownerName} ({w.accountNo}) - ৳{w.balance.toLocaleString()} {w.currency}
                  </option>
                ))}
              </select>
            </div>

            {/* Receiver Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'bn' ? 'রিসিভার ওয়ালেট (CREDIT)' : 'Receiver Wallet (CREDIT Account)'}
              </label>
              <select
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id} disabled={w.id === senderId}>
                    {w.ownerName} ({w.accountNo}) - ৳{w.balance.toLocaleString()} {w.currency}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount & Rail */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'পরিমাণ (BDT)' : 'Amount (BDT)'}
                </label>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'পেমেন্ট চ্যানেল / রেইল' : 'Payment Rail'}
                </label>
                <select
                  value={selectedRail}
                  onChange={(e) => setSelectedRail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {rails.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reference */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'bn' ? 'ট্রানজ্যাকশন বিবরণ / রেফারেন্স' : 'Transaction Reference'}
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Idempotency Key */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  {lang === 'bn' ? 'আইডেমপোটেন্সি কি (ডুপ্লিকেট প্রতিরোধ)' : 'Idempotency Key (Conflict Safety)'}
                </label>
                <button
                  type="button"
                  onClick={() => setIdempotencyKey(`IDEMP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`)}
                  className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
              </div>
              <input
                type="text"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 2FA High-Value Indicator & Toggle */}
            {parseFloat(amount || '0') >= HIGH_VALUE_THRESHOLD ? (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-[11px] text-amber-300">
                <div className="flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    {lang === 'bn' 
                      ? 'উচ্চমানের ট্রানজ্যাকশন (≥ ৳৫০,০০০): ২এফএ ভেরিফিকেশন বাধ্যতামূলক' 
                      : 'High-Value Transfer (≥ ৳50,000): 2FA Verification Required'}
                  </span>
                </div>
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                  2FA MANDATORY
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between px-1 text-xs text-slate-400">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={force2FA}
                    onChange={(e) => setForce2FA(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-0"
                  />
                  <span>{lang === 'bn' ? 'সবসময় ২এফএ নিরাপত্তা ব্যবহার করুন' : 'Always require 2FA for this transfer'}</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">≥ ৳50k Auto-2FA</span>
              </div>
            )}

            <div className="flex items-center gap-3 mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{lang === 'bn' ? 'এসিড ট্রানজ্যাকশন রান হচ্ছে...' : 'Executing ACID Transaction...'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'ট্রান্সফার নিশ্চিত করুন' : 'Confirm Transfer'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsRecurringModalOpen(true)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{lang === 'bn' ? 'শিডিউল' : 'Schedule'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* SECTION: RECURRING TRANSFERS LIST */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-400" />
              <span>{lang === 'bn' ? 'সক্রিয় রিকারিং ট্রান্সফার' : 'Active Recurring Transfers'}</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {lang === 'bn' ? 'স্বয়ংক্রিয়ভাবে নির্ধারিত সময়ে পেমেন্ট প্রসেস করার তালিকা।' : 'List of payments scheduled for automated execution at set intervals.'}
            </p>
          </div>
          <div className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
            {recurringTransfers.length} ACTIVE
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
          {recurringTransfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10 opacity-40">
              <Timer className="w-10 h-10 mb-2" />
              <p className="text-xs">{lang === 'bn' ? 'কোনো শিডিউল পাওয়া যায়নি' : 'No scheduled transfers yet'}</p>
            </div>
          ) : (
            recurringTransfers.map(rt => (
              <div key={rt.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                    rt.status === 'ACTIVE' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100">৳{rt.amount.toLocaleString()}</span>
                      <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 text-[9px] rounded font-bold uppercase tracking-tighter">{rt.frequency}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{rt.description}</div>
                    <div className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                      <ArrowRight className="w-2 h-2" />
                      <span>{rt.receiverName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRecurringStatus(rt)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      rt.status === 'ACTIVE' 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' 
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    }`}
                    title={rt.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                  >
                    {rt.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDeleteRecurring(rt.id)}
                    className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>

        {/* Recurring Transfer Modal */}
      {isRecurringModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{lang === 'bn' ? 'রিকারিং ট্রান্সফার সেটআপ' : 'Recurring Transfer Setup'}</h3>
                  <p className="text-xs text-slate-400">{lang === 'bn' ? 'স্বয়ংক্রিয় পেমেন্ট শিডিউল করুন' : 'Configure automated payment schedule'}</p>
                </div>
              </div>
              <button onClick={() => setIsRecurringModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lang === 'bn' ? 'ট্রান্সফার ডিটেইলস' : 'Transfer Details'}</div>
                <div className="text-sm font-bold text-white">৳{amount} BDT</div>
                <div className="text-xs text-slate-400 truncate flex items-center gap-2">
                  <ArrowRight className="w-3 h-3" />
                  {wallets.find(w => w.id === receiverId)?.ownerName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">{lang === 'bn' ? 'ফ্রিকোয়েন্সি (কত সময় পর পর)' : 'Frequency'}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['DAILY', 'WEEKLY', 'MONTHLY'] as RecurringFrequency[]).map(freq => (
                    <button
                      key={freq}
                      onClick={() => setRecFreq(freq)}
                      className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                        recFreq === freq 
                          ? 'bg-indigo-600 text-white border-indigo-500' 
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">{lang === 'bn' ? 'শুরুর তারিখ' : 'Start Date'}</label>
                <input
                  type="date"
                  value={recStartDate}
                  onChange={(e) => setRecStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">{lang === 'bn' ? 'বিবরণ (ঐচ্ছিক)' : 'Description (Optional)'}</label>
                <textarea
                  value={recDesc}
                  onChange={(e) => setRecDesc(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: মাসিক অফিসের ভাড়া' : 'e.g., Monthly Office Rent'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsRecurringModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveRecurring}
                disabled={isSavingRecurring}
                className="flex-[2] py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSavingRecurring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {lang === 'bn' ? 'শিডিউল নিশ্চিত করুন' : 'Confirm Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: TRANSACTION HISTORY TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>{lang === 'bn' ? 'লেনদেনের বিস্তারিত ইতিহাস' : 'Detailed Transaction History'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {lang === 'bn' 
                ? 'সিস্টেমের সকল সফল ও ব্যর্থ লেনদেনের রিয়েল-টাইম তালিকা।' 
                : 'Real-time record of all successful and failed transactions across the network.'}
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-2 border border-slate-700 shadow-lg active:scale-95"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            {lang === 'bn' ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-semibold sticky top-0 border-b border-slate-800">
              <tr>
                <th className="p-3">{lang === 'bn' ? 'আইডি' : 'TX ID'}</th>
                <th className="p-3">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th className="p-3">{lang === 'bn' ? 'প্রেরক' : 'Sender'}</th>
                <th className="p-3">{lang === 'bn' ? 'প্রাপক / মার্চেন্ট' : 'Receiver / Merchant'}</th>
                <th className="p-3 text-right">{lang === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                <th className="p-3">{lang === 'bn' ? 'অবস্থা' : 'Status'}</th>
                <th className="p-3 text-center">{lang === 'bn' ? 'শেয়ার' : 'Share'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono text-[10px] text-slate-400">
                      {tx.id}
                    </td>
                    <td className="p-3 text-slate-300">
                      <div>{new Date(tx.timestamp).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-500">{new Date(tx.timestamp).toLocaleTimeString()}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-200">{tx.senderName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{tx.senderWalletId}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-200">{tx.receiverName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{tx.receiverWalletId}</div>
                    </td>
                    <td className="p-3 text-right font-bold text-white">
                      ৳{tx.amount.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center w-fit gap-1 ${
                        tx.status === 'SUCCESS' 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                          : tx.status === 'FAILED' 
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          : tx.status === 'ROLLED_BACK'
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          tx.status === 'SUCCESS' ? 'bg-emerald-400' :
                          tx.status === 'FAILED' ? 'bg-rose-400' :
                          tx.status === 'ROLLED_BACK' ? 'bg-slate-500' :
                          'bg-amber-400 animate-pulse'
                        }`} />
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleShareTransaction(tx)}
                        className="p-1.5 bg-slate-800 hover:bg-indigo-600/30 text-slate-400 hover:text-indigo-400 rounded-lg transition-all border border-slate-700 hover:border-indigo-500/30"
                        title={lang === 'bn' ? 'ট্রানজ্যাকশন শেয়ার করুন' : 'Share Transaction'}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {lang === 'bn' ? 'কোনো লেনদেন পাওয়া যায়নি।' : 'No transactions found matching your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: DOUBLE-ENTRY IMMUTABLE LEDGER ENTRIES */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-slate-100 font-bold text-lg flex items-center gap-2">
                <Hash className="w-5 h-5 text-indigo-400" />
                <span>{lang === 'bn' ? 'অপরিবর্তনীয় ডাবল-এন্ট্রি লেজার' : 'Immutable Double-Entry Ledger'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'bn' 
                  ? 'প্রতিটি লেনদেনের জন্য ডেবিক এবং ক্রেডিট এন্টি জোড়ায় জোড়ায় ক্রিপ্টোগ্রাফিক হ্যাশ সহ সংরক্ষিত হয়।' 
                  : 'Paired DEBIT & CREDIT entries secured with cryptographic SHA-256 hashes.'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {ledgerEntries.length} Entries
            </span>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto flex-1 max-h-[460px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-semibold sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="p-3">{lang === 'bn' ? 'টাইপ' : 'Type'}</th>
                  <th className="p-3">{lang === 'bn' ? 'অ্যাকাউন্ট / হোল্ডার' : 'Account Owner'}</th>
                  <th className="p-3 text-right">{lang === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                  <th className="p-3 text-right">{lang === 'bn' ? 'ব্যালেন্স পর' : 'Balance After'}</th>
                  <th className="p-3">{lang === 'bn' ? 'টাইমস্ট্যাম্প' : 'Timestamp'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        entry.type === 'DEBIT' 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {entry.type === 'DEBIT' ? (
                          <ArrowUpRight className="w-3 h-3 mr-1 text-rose-400" />
                        ) : (
                          <ArrowDownLeft className="w-3 h-3 mr-1 text-emerald-400" />
                        )}
                        {entry.type}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-slate-200">
                      <div className="font-medium truncate max-w-[150px]">{entry.walletOwner}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{entry.walletId}</div>
                    </td>
                    <td className={`p-3 text-right font-bold ${
                      entry.type === 'DEBIT' ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {entry.type === 'DEBIT' ? '-' : '+'}৳{entry.amount.toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-slate-300">
                      ৳{entry.balanceAfter.toLocaleString()}
                    </td>
                    <td className="p-3 text-[10px] text-slate-400 font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* MODAL: EDIT TRANSACTION LIMITS */}
      {editingLimit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 text-slate-100 relative">
            <button
              onClick={() => setEditingLimit(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2 text-indigo-400 font-bold border-b border-slate-800 pb-3">
              <Sliders className="w-5 h-5" />
              <h3>{lang === 'bn' ? 'ওয়ালেট ট্রানজ্যাকশন লিমিট সেট করুন' : 'Configure Wallet Caps'}</h3>
            </div>

            <div className="text-xs text-slate-400">
              Account: <span className="text-white font-bold">{editingLimit.ownerName}</span> ({editingLimit.walletId})
            </div>

            {limitUpdateMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                {limitUpdateMsg}
              </div>
            )}

            <form onSubmit={handleSaveLimits} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'দৈনিক খরচের ক্যাপ (BDT):' : 'Daily Cap (BDT):'}
                </label>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  value={editDailyCap}
                  onChange={(e) => setEditDailyCap(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'মাসিক খরচের ক্যাপ (BDT):' : 'Monthly Cap (BDT):'}
                </label>
                <input
                  type="number"
                  min="5000"
                  step="10000"
                  value={editMonthlyCap}
                  onChange={(e) => setEditMonthlyCap(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'সতর্কতা ট্রিগার শতাংশ (%):' : 'Alert Threshold (%):'}
                </label>
                <input
                  type="number"
                  min="50"
                  max="99"
                  value={editThreshold}
                  onChange={(e) => setEditThreshold(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingLimit(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingLimit}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                >
                  {isSavingLimit ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Limits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: 2FA VERIFICATION DIALOG */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 text-slate-100 relative overflow-hidden">
            {/* Top Security Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-emerald-400 to-purple-500" />

            <button
              onClick={() => setShow2FAModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">
                    {lang === 'bn' ? 'দ্বি-স্তর বিশিষ্ট নিরাপত্তা ভেরিফিকেশন (2FA)' : 'Two-Factor Security Verification'}
                  </h3>
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                    2FA GUARD
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lang === 'bn'
                    ? 'উচ্চমানের ট্রানজ্যাকশন সুরক্ষায় ২এফএ ভেরিফিকেশন সম্পন্ন করুন।'
                    : 'Authorize high-value transfer with second-factor security token.'}
                </p>
              </div>
            </div>

            {/* Transfer Summary Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span>{lang === 'bn' ? 'ট্রানজ্যাকশন সামারি' : 'Transaction Summary'}</span>
                <span className="font-mono text-indigo-400 font-bold">HIGH-VALUE</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-500 text-[10px] block">{lang === 'bn' ? 'সেন্ডার:' : 'From:'}</span>
                  <span className="font-bold text-slate-200">
                    {wallets.find((w) => w.id === senderId)?.ownerName || senderId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">{lang === 'bn' ? 'রিসিভার:' : 'To:'}</span>
                  <span className="font-bold text-slate-200">
                    {wallets.find((w) => w.id === receiverId)?.ownerName || receiverId}
                  </span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-900 flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">{lang === 'bn' ? 'মোট পরিমাণ:' : 'Transfer Amount:'}</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono">
                    ৳{parseFloat(amount || '0').toLocaleString()} BDT
                  </span>
                </div>
              </div>
            </div>

            {/* Method Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                {lang === 'bn' ? 'ভেরিফিকেশন মেথড নির্বাচন করুন:' : 'Select Verification Method:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTwoFactorMethod('sms')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                    twoFactorMethod === 'sms'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <SmartphoneNfc className="w-4 h-4 text-indigo-400" />
                  <span>SMS OTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTwoFactorMethod('totp')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                    twoFactorMethod === 'totp'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  <span>Authenticator</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTwoFactorMethod('hardware')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                    twoFactorMethod === 'hardware'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                  <span>Security Key</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {twoFactorError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{twoFactorError}</span>
              </div>
            )}

            {/* 2FA Form */}
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    {twoFactorMethod === 'sms' && (lang === 'bn' ? '৬-ডিজিট এসএমএস ওটিপি' : '6-Digit SMS Security OTP')}
                    {twoFactorMethod === 'totp' && (lang === 'bn' ? 'অথেনটিকেটর অ্যাপ কোড' : 'Authenticator TOTP Code')}
                    {twoFactorMethod === 'hardware' && (lang === 'bn' ? 'হার্ডওয়্যার সিকিউরিটি পিন' : 'Hardware Token PIN')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setOtpCode('884921')}
                    className="text-[10px] text-emerald-400 font-bold hover:underline flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                  >
                    <Key className="w-3 h-3 text-emerald-400" />
                    Fill Demo OTP (884921)
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="884921"
                    className="w-full bg-slate-950 border-2 border-indigo-500/50 rounded-2xl px-4 py-3 text-center text-xl font-mono tracking-[0.5em] text-white focus:outline-none focus:border-indigo-400 shadow-inner"
                    autoFocus
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                    {otpCode.length}/6
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                  <span className="flex items-center gap-1">
                    <Timer className="w-3 h-3 text-indigo-400" />
                    OTP expires in <strong className="text-indigo-300 font-mono">{otpTimer}s</strong>
                  </span>

                  <button
                    type="button"
                    disabled={otpTimer > 0}
                    onClick={() => {
                      setOtpTimer(30);
                      setTwoFactorError(null);
                    }}
                    className={`hover:underline font-semibold ${
                      otpTimer > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-indigo-400 cursor-pointer'
                    }`}
                  >
                    {lang === 'bn' ? 'পুনরায় ওটিপি পাঠান' : 'Resend OTP'}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying2FA || otpCode.length < 4}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isVerifying2FA ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Verifying HSM Token...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-300" />
                      <span>{lang === 'bn' ? 'ভেরিফাই ও ট্রান্সফার সম্পন্ন করুন' : 'Verify & Authorize Transfer'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: QR CODE GENERATOR */}
      {showQRGeneratorModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {lang === 'bn' ? 'P2P অর্থ গ্রহণের কিউআর কোড' : 'P2P Receive QR Code'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'bn' ? 'পেমেন্ট রিকোয়েস্ট তৈরি করতে QR ডায়নামিকালি জেনারেট করুন' : 'Generate dynamic QR code to receive wallet transfers'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQRGeneratorModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inputs Form */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {lang === 'bn' ? 'প্রাপক অ্যাকাউন্ট নির্বাচন করুন' : 'Select Receive Wallet'}
                </label>
                <select
                  value={qrReceiveWalletId}
                  onChange={(e) => setQrReceiveWalletId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.ownerName} ({w.accountNo}) - {w.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'অনুরোধকৃত পরিমাণ (ঐচ্ছিক)' : 'Requested Amount (Optional)'}
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 2500"
                    value={qrRequestedAmount}
                    onChange={(e) => setQrRequestedAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {lang === 'bn' ? 'রেফারেন্স নোট' : 'Reference / Note'}
                  </label>
                  <input
                    type="text"
                    value={qrRequestedRef}
                    onChange={(e) => setQrRequestedRef(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* QR Visual Canvas Frame */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/20 flex flex-col items-center justify-center space-y-3">
              <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-200 flex items-center justify-center">
                {generatedQRUrl ? (
                  <img
                    src={generatedQRUrl}
                    alt="P2P Receive QR Code"
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>

              <div className="text-center space-y-0.5">
                <span className="text-xs font-bold text-slate-200 block">
                  {wallets.find(w => w.id === qrReceiveWalletId)?.ownerName || 'Wallet Holder'}
                </span>
                <span className="text-[11px] font-mono text-indigo-400 block">
                  Account: {wallets.find(w => w.id === qrReceiveWalletId)?.accountNo || ''}
                </span>
                {parseFloat(qrRequestedAmount) > 0 && (
                  <span className="text-xs font-bold font-mono text-emerald-400 block">
                    Requested Amount: ৳{parseFloat(qrRequestedAmount).toLocaleString()} BDT
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyQRPayload}
                className="flex items-center justify-center space-x-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition border border-slate-700"
              >
                {copiedQRText ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">{lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>{lang === 'bn' ? 'লিঙ্ক কপি করুন' : 'Copy PayRoute URL'}</span>
                  </>
                )}
              </button>

              {generatedQRUrl && (
                <a
                  href={generatedQRUrl}
                  download={`payroute-p2p-qr-${qrReceiveWalletId}.png`}
                  className="flex items-center justify-center space-x-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'ছবি ডাউনলোড' : 'Download QR'}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QR CODE SCANNER */}
      {showQRScannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Scan className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {lang === 'bn' ? 'P2P কিউআর কোড স্ক্যানার' : 'P2P Wallet QR Scanner'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'bn' ? 'ক্যামেরা অথবা ছবি আপলোড করে প্রাপকের তথ্য সরাসরি সিলেক্ট করুন' : 'Scan live camera view or upload QR image to transfer instantly'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowQRScannerModal(false);
                  setScannerStatus(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  setScannerTab('camera');
                  setScannerStatus(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition ${
                  scannerTab === 'camera' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ক্যামেরা ভিউ' : 'Live Camera View'}</span>
              </button>

              <button
                onClick={() => {
                  setScannerTab('upload');
                  setScannerStatus(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition ${
                  scannerTab === 'upload' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ছবি আপলোড' : 'Upload QR Image'}</span>
              </button>
            </div>

            {/* Status Alert */}
            {scannerStatus && (
              <div className={`p-3 rounded-xl flex items-center space-x-2 text-xs font-medium border animate-fadeIn ${
                scannerStatus.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}>
                {scannerStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{scannerStatus.text}</span>
              </div>
            )}

            {/* Tab 1: Live Camera Viewport Simulation */}
            {scannerTab === 'camera' && (
              <div className="space-y-4">
                <div className="relative bg-slate-950 rounded-2xl border-2 border-dashed border-indigo-500/40 p-6 flex flex-col items-center justify-center overflow-hidden min-h-[220px]">
                  
                  {/* Scanner Laser Animation */}
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-pulse top-1/2" />

                  {/* Corner Targets */}
                  <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                  <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br" />

                  {scanSimulating ? (
                    <div className="flex flex-col items-center space-y-2 z-10 text-emerald-400">
                      <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                      <span className="text-xs font-bold font-mono">
                        {lang === 'bn' ? 'QR পে-লোড ডিকোড হচ্ছে...' : 'Decoding QR Payload...'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 z-10">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-slate-300 font-semibold">
                        {lang === 'bn' ? 'ক্যামেরায় কিউআর কোডটি সরাসরি ধরুন' : 'Align QR Code within the target frame'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {lang === 'bn' ? 'অথবা নিচে যেকোনো ডেমো ওয়ালেটে ক্লিক করে স্ক্যান সিমুলেট করুন:' : 'Or tap any demo wallet below to simulate scan:'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Scan Sample Wallets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {lang === 'bn' ? 'ডাইরেক্ট সিমুলেশন ওয়ালেট নির্বাচন (Quick Scan):' : 'Direct Quick Scan Profiles:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {wallets.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          const mockPayload = JSON.stringify({
                            protocol: 'payroute-p2p',
                            receiverId: w.id,
                            receiverName: w.ownerName,
                            accountNo: w.accountNo,
                            amount: 2500,
                            reference: `P2P QR Transfer to ${w.ownerName}`
                          });
                          handleProcessScanData(mockPayload);
                        }}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition text-left flex items-center justify-between group"
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 block">
                            {w.ownerName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 block">
                            {w.id} • {w.accountNo}
                          </span>
                        </div>
                        <span className="px-2 py-1 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition">
                          Scan 📷
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Upload QR Image */}
            {scannerTab === 'upload' && (
              <div className="space-y-4">
                <label className="border-2 border-dashed border-indigo-500/30 hover:border-indigo-500 bg-slate-950 p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">
                      {lang === 'bn' ? 'QR কোড ছবি আপলোড করুন' : 'Drop or select QR Code Image file'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {lang === 'bn' ? 'PNG, JPG, SVG সাপোর্ট করে' : 'Supports PNG, JPG, WebP format'}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Pick a wallet from the available list as the decoded payload
                        const sampleW = wallets[1] || wallets[0];
                        const mockPayload = JSON.stringify({
                          protocol: 'payroute-p2p',
                          receiverId: sampleW.id,
                          receiverName: sampleW.ownerName,
                          accountNo: sampleW.accountNo,
                          amount: 3500,
                          reference: `Uploaded QR Transfer (${file.name})`
                        });
                        handleProcessScanData(mockPayload);
                      }
                    }}
                    className="hidden"
                  />
                </label>

                {/* Direct Manual Code Input */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    {lang === 'bn' ? 'অথবা পে-লোড কোড টেক্সট টাইপ করুন:' : 'Or Paste Raw QR Payload Text:'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder='e.g. {"receiverId":"WLT-002","amount":1500}'
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleProcessScanData((e.target as HTMLInputElement).value);
                        }
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const inputEl = (e.currentTarget.previousElementSibling as HTMLInputElement);
                        if (inputEl?.value) {
                          handleProcessScanData(inputEl.value);
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition"
                    >
                      {lang === 'bn' ? 'প্রসেস' : 'Process'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowQRScannerModal(false);
                  setScannerStatus(null);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close Scanner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
