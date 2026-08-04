import React, { useState, useEffect } from 'react';
import { 
  Building, 
  ShieldCheck, 
  Key, 
  ArrowRightLeft, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  PlusCircle, 
  Trash2, 
  ExternalLink, 
  Code2, 
  Wallet, 
  Zap, 
  Lock,
  Landmark,
  FileText
} from 'lucide-react';
import { OpenBankProvider, OpenBankingConsent, ExternalBankAccount, Wallet as WalletType } from '../types';

interface OpenBankingViewProps {
  lang: 'en' | 'bn';
  wallets: WalletType[];
  onTransactionSuccess: () => void;
}

export const OpenBankingView: React.FC<OpenBankingViewProps> = ({
  lang,
  wallets,
  onTransactionSuccess
}) => {
  const [providers, setProviders] = useState<OpenBankProvider[]>([]);
  const [consents, setConsents] = useState<OpenBankingConsent[]>([]);
  const [accounts, setAccounts] = useState<ExternalBankAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'banks' | 'accounts' | 'pis' | 'consents' | 'developer'>('banks');

  // New Consent Form Modal State
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [consentPermissions, setConsentPermissions] = useState<string[]>([
    'ReadAccountsDetail', 
    'ReadBalances', 
    'CreatePaymentInitiation'
  ]);
  const [isSubmittingConsent, setIsSubmittingConsent] = useState<boolean>(false);
  const [consentSuccessMsg, setConsentSuccessMsg] = useState<string>('');

  // PIS Payment Form State
  const [pisDebtorAccId, setPisDebtorAccId] = useState<string>('');
  const [pisCreditorWalletId, setPisCreditorWalletId] = useState<string>('');
  const [pisAmount, setPisAmount] = useState<string>('50000');
  const [isSubmittingPis, setIsSubmittingPis] = useState<boolean>(false);
  const [pisResultMsg, setPisResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Syncing state
  const [syncingAccId, setSyncingAccId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resProv, resCons, resAcc] = await Promise.all([
        fetch('/api/open-banking/providers'),
        fetch('/api/open-banking/consents'),
        fetch('/api/open-banking/accounts')
      ]);

      const provData = await resProv.json();
      const consData = await resCons.json();
      const accData = await resAcc.json();

      setProviders(provData.providers || []);
      setConsents(consData.consents || []);
      setAccounts(accData.accounts || []);

      if (accData.accounts?.length > 0 && !pisDebtorAccId) {
        setPisDebtorAccId(accData.accounts[0].accountId);
      }
      if (wallets?.length > 0 && !pisCreditorWalletId) {
        setPisCreditorWalletId(wallets[0].id);
      }
    } catch (err) {
      console.error('Failed to load Open Banking data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBankId) return;

    setIsSubmittingConsent(true);
    setConsentSuccessMsg('');

    try {
      const res = await fetch('/api/open-banking/consents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankId: selectedBankId,
          permissions: consentPermissions,
          expirationDays: 90
        })
      });

      const data = await res.json();
      if (data.success) {
        setConsentSuccessMsg(
          lang === 'bn' 
            ? 'ওপেন ব্যাংকিং কনসেন্ট সফলভাবে অনুমোদন করা হয়েছে!' 
            : 'Open Banking TPP consent successfully authorised!'
        );
        setSelectedBankId('');
        fetchData();
      } else {
        alert(data.error || 'Failed to authorize consent');
      }
    } catch (err: any) {
      alert(err.message || 'Error connecting to bank API');
    } finally {
      setIsSubmittingConsent(false);
    }
  };

  const handleRevokeConsent = async (consentId: string) => {
    if (!confirm(lang === 'bn' ? 'আপনি কি সত্যিই এই কনসেন্ট টি বাতিল করতে চান?' : 'Are you sure you want to revoke this Open Banking consent?')) {
      return;
    }

    try {
      const res = await fetch('/api/open-banking/consents/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentId })
      });

      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Error revoking consent:', err);
    }
  };

  const handleSyncAccount = async (accountId: string) => {
    setSyncingAccId(accountId);
    try {
      const res = await fetch('/api/open-banking/accounts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId })
      });
      const data = await res.json();
      if (data.success) {
        setAccounts(prev => prev.map(a => a.accountId === accountId ? data.account : a));
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncingAccId(null);
    }
  };

  const handleInitiatePisPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pisDebtorAccId || !pisCreditorWalletId || !pisAmount) return;

    setIsSubmittingPis(true);
    setPisResultMsg(null);

    try {
      const res = await fetch('/api/open-banking/pis/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtorAccountId: pisDebtorAccId,
          creditorWalletId: pisCreditorWalletId,
          amount: parseFloat(pisAmount),
          currency: 'BDT',
          idempotencyKey: `PIS-${Date.now()}`
        })
      });

      const data = await res.json();
      if (data.success) {
        setPisResultMsg({
          type: 'success',
          text: lang === 'bn' 
            ? `ওপেন ব্যাংকিং পেমেন্ট সফলভাবে সম্পন্ন হয়েছে! FAPI Ref: ${data.pisPayment.fapiFinancialId}`
            : `Open Banking PIS Payment settled instantly! FAPI Ref: ${data.pisPayment.fapiFinancialId}`
        });
        fetchData();
        onTransactionSuccess();
      } else {
        setPisResultMsg({
          type: 'error',
          text: data.error || 'Payment Initiation Failed'
        });
      }
    } catch (err: any) {
      setPisResultMsg({
        type: 'error',
        text: err.message || 'Server communication error'
      });
    } finally {
      setIsSubmittingPis(false);
    }
  };

  const totalExternalLiquidity = accounts.reduce((acc, curr) => acc + curr.availableBalance, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                {lang === 'bn' ? 'বাংলাদেশ ব্যাংক ও PSD2 ওপেন এপিআই স্ট্যান্ডার্ড' : 'BB Open Banking & PSD2 FAPI 1.0 Compliant'}
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {lang === 'bn' ? 'গেইটওয়ে অনলাইন' : 'Gateway Online'}
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {lang === 'bn' ? 'ওপেন ব্যাংকিং সার্ভিস এপিআই ইন্টিগ্রেশন' : 'Open Banking Service API Integration'}
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              {lang === 'bn'
                ? 'ব্যাংক একাউন্ট এক্রিগেশন (AIS) এবং ডিরেক্ট একাউন্ট-টু-লেজার পেমেন্ট ইনিশিয়েশন (PIS) পরিচালনা করার জন্য সুরক্ষিত TPP এপিআই গেটওয়ে।'
                : 'Third-Party Provider (TPP) integration layer for Account Information Service (AIS) aggregation and direct Payment Initiation Service (PIS) to PayRoute ACID ledgers.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-sm font-medium transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              {lang === 'bn' ? 'রিফ্রেশ করুন' : 'Sync All'}
            </button>
          </div>
        </div>

        {/* Quick Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
            <div className="text-slate-400 text-xs font-medium">{lang === 'bn' ? 'সংযুক্ত ব্যাংক গেটওয়ে' : 'Connected Banks'}</div>
            <div className="text-xl font-bold text-white mt-1">{providers.length}</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
            <div className="text-slate-400 text-xs font-medium">{lang === 'bn' ? 'সক্রিয় কনসেন্ট (TPP)' : 'Active Consents'}</div>
            <div className="text-xl font-bold text-indigo-400 mt-1">
              {consents.filter(c => c.status === 'AUTHORISED').length}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
            <div className="text-slate-400 text-xs font-medium">{lang === 'bn' ? 'সংযুক্ত ব্যাংক একাউন্ট' : 'Linked Accounts'}</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{accounts.length}</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
            <div className="text-slate-400 text-xs font-medium">{lang === 'bn' ? 'মোট এক্সটার্নাল তারল্য' : 'External Liquidity'}</div>
            <div className="text-xl font-bold text-amber-400 mt-1">
              ৳{totalExternalLiquidity.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-1 sm:space-x-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('banks')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'banks'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Landmark className="w-4 h-4" />
          {lang === 'bn' ? '১. ব্যাংক গেটওয়ে সারণী' : '1. Bank API Gateways'}
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'accounts'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Building className="w-4 h-4" />
          {lang === 'bn' ? '২. একাউন্ট ইনফরমেশন (AIS)' : '2. Bank Accounts (AIS)'}
          <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[11px] rounded-full font-bold">
            {accounts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pis')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'pis'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          {lang === 'bn' ? '৩. পেমেন্ট ইনিশিয়েশন (PIS)' : '3. Payment Initiation (PIS)'}
        </button>

        <button
          onClick={() => setActiveTab('consents')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'consents'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Key className="w-4 h-4" />
          {lang === 'bn' ? '৪. কনসেন্ট ম্যানেজমেন্ট' : '4. Consent Management'}
        </button>

        <button
          onClick={() => setActiveTab('developer')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'developer'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Code2 className="w-4 h-4" />
          {lang === 'bn' ? '৫. এপিআই স্পেসিফিকেশন' : '5. API Spec & Headers'}
        </button>
      </div>

      {/* TAB 1: BANK API GATEWAYS */}
      {activeTab === 'banks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((p) => {
              const isConsented = consents.some(c => c.bankId === p.id && c.status === 'AUTHORISED');
              return (
                <div 
                  key={p.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <Landmark className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{p.bankName}</h3>
                          <div className="text-xs text-slate-400 font-mono">SWIFT: {p.swiftCode}</div>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.status === 'ONLINE' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {p.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                        <span className="text-slate-400">{lang === 'bn' ? 'এপিআই মানদণ্ড:' : 'API Spec Standard:'}</span>
                        <span className="font-mono text-indigo-300 font-semibold">{p.apiSpec}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-300">
                        <span className="text-slate-400">{lang === 'bn' ? 'অনুমোদিত স্কোপস:' : 'Supported Scopes:'}</span>
                        <span className="text-slate-300">{p.supportedScopes.length} Scopes (AIS/PIS)</span>
                      </div>
                      <div className="flex justify-between py-1 text-slate-300">
                        <span className="text-slate-400">{lang === 'bn' ? 'স্যান্ডবক্স ইউআরএল:' : 'Sandbox Endpoint:'}</span>
                        <span className="font-mono text-slate-400 truncate max-w-[200px]">{p.sandboxUrl}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                    {isConsented ? (
                      <div className="flex items-center text-emerald-400 text-xs font-semibold gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        {lang === 'bn' ? 'কনসেন্ট অনুমোদিত' : 'TPP Authorised'}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">
                        {lang === 'bn' ? 'অনুমোদন প্রয়োজন' : 'Action required'}
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setSelectedBankId(p.id);
                        setActiveTab('consents');
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      {isConsented 
                        ? (lang === 'bn' ? 'কনসেন্ট আপডেট' : 'Manage Consent') 
                        : (lang === 'bn' ? 'নতুন কনসেন্ট দিন' : 'Connect Open API')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNT INFORMATION SERVICE (AIS) */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {lang === 'bn' ? 'সংযুক্ত ব্যাংক একাউন্টসমূহ (AIS)' : 'Linked External Bank Accounts (AIS)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'bn'
                    ? 'ওপেন ব্যাংকিং AIS এপিআই দ্বারা সরাসরি রিয়েল-টাইম ব্যালেন্স অ্যাগ্রিগেশন।'
                    : 'Real-time aggregated accounts fetched via Open Banking AIS API endpoints.'}
                </p>
              </div>
            </div>

            {accounts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Landmark className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>{lang === 'bn' ? 'কোন সক্রিয় একাউন্ট সংযুক্ত নেই।' : 'No active bank accounts linked yet.'}</p>
                <button
                  onClick={() => setActiveTab('banks')}
                  className="mt-3 text-xs text-indigo-400 hover:underline"
                >
                  {lang === 'bn' ? 'ব্যাংক গেটওয়ে থেকে সংযুক্ত করুন' : 'Connect a bank gateway now'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {accounts.map((acc) => (
                  <div
                    key={acc.accountId}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {acc.accountType}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ID: {acc.accountId}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-white">{acc.bankName}</div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        {lang === 'bn' ? 'হিসাব নম্বর:' : 'Account:'} {acc.accountNumberMasked}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80">
                        <div className="text-xs text-slate-400">{lang === 'bn' ? 'উপলব্ধ তারল্য (AIS Balance)' : 'Available Balance'}</div>
                        <div className="text-2xl font-bold text-emerald-400 mt-1">
                          ৳{acc.availableBalance.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                      <span>{new Date(acc.lastSyncedAt).toLocaleTimeString()}</span>
                      <button
                        onClick={() => handleSyncAccount(acc.accountId)}
                        disabled={syncingAccId === acc.accountId}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        title={lang === 'bn' ? 'ব্যালেন্স সিঙ্ক করুন' : 'Sync Live Balance'}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingAccId === acc.accountId ? 'animate-spin text-indigo-400' : ''}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT INITIATION SERVICE (PIS) */}
      {activeTab === 'pis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PIS Transfer Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {lang === 'bn' ? 'ডাইরেক্ট ওপেন ব্যাংকিং পেমেন্ট ইনিশিয়েশন (PIS)' : 'Direct Open Banking Payment Initiation (PIS)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'bn'
                    ? 'যেকোনো অনুমোদিত ব্যাংক একাউন্ট থেকে সরাসরি PayRoute ACID লেজারে টাকা ট্রান্সফার করুন।'
                    : 'Initiate account-to-ledger fund pull directly from authorized bank account into PayRoute ledger.'}
                </p>
              </div>
            </div>

            {pisResultMsg && (
              <div className={`p-4 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2 ${
                pisResultMsg.type === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {pisResultMsg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
                {pisResultMsg.text}
              </div>
            )}

            <form onSubmit={handleInitiatePisPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {lang === 'bn' ? '১. উৎস ব্যাংক একাউন্ট নির্বাচন করুন (Debtor Bank Account):' : '1. Select Source Debtor Bank Account:'}
                </label>
                <select
                  value={pisDebtorAccId}
                  onChange={(e) => setPisDebtorAccId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {accounts.map((a) => (
                    <option key={a.accountId} value={a.accountId}>
                      {a.bankName} - {a.accountNumberMasked} (Available: ৳{a.availableBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {lang === 'bn' ? '২. গন্তব্য লেজার ওয়ালেট (Creditor Wallet):' : '2. Select Destination Creditor Ledger Wallet:'}
                </label>
                <select
                  value={pisCreditorWalletId}
                  onChange={(e) => setPisCreditorWalletId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.ownerName} ({w.id}) - Balance: ৳{w.balance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {lang === 'bn' ? '৩. টাকার পরিমাণ (BDT):' : '3. Payment Amount (BDT):'}
                </label>
                <input
                  type="number"
                  value={pisAmount}
                  onChange={(e) => setPisAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="50000"
                  min="1"
                />
              </div>

              <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-xs text-indigo-300 flex items-start gap-2">
                <Lock className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? 'PIS ট্রানজ্যাকশনটি অটোমেটেড স্টেট মিউটেক্স দ্বারা সুরক্ষিত এবং রিয়েল-টাইম ডাবল-এন্ট্রি লেজারে সংরক্ষিত হবে।'
                    : 'PIS transaction is secured by Node.js ACID Mutex locks and recorded instantly with double-entry debit/credit ledger entries.'}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmittingPis || accounts.length === 0}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
              >
                {isSubmittingPis ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {lang === 'bn' ? 'ওপেন ব্যাংকিং পেমেন্ট সম্পাদন করুন' : 'Execute Open Banking PIS Payment'}
              </button>
            </form>
          </div>

          {/* Side Explanation Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              {lang === 'bn' ? 'PIS সিকিউরিটি আর্কিটেকচার' : 'PIS Security Specs'}
            </h4>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="font-semibold text-indigo-300 mb-1">FAPI 1.0 Advanced Profile</div>
                <p className="text-slate-400">
                  {lang === 'bn'
                    ? 'MTLS এবং সিকিউর আইডি টোকেন দ্বারা সংরক্ষিত ক্লায়েন্ট সিকিউরিটি।'
                    : 'Encrypted payloads with Mutual TLS and signed JWT access tokens.'}
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="font-semibold text-emerald-300 mb-1">HMAC SHA-256 Webhooks</div>
                <p className="text-slate-400">
                  {lang === 'bn'
                    ? 'পেমেন্ট সেটেল হওয়ার সাথে সাথে সিস্টেম নোটিফিকেশন।'
                    : 'Real-time webhook callback dispatched with signature verification.'}
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <div className="font-semibold text-amber-300 mb-1">ACID Ledger Guarantees</div>
                <p className="text-slate-400">
                  {lang === 'bn'
                    ? 'লেজার ব্যালেন্স কখনো অসংগতিপূর্ণ হবে না।'
                    : 'In-memory isolation mutex ensures zero balance discrepancies.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONSENT MANAGEMENT */}
      {activeTab === 'consents' && (
        <div className="space-y-6">
          {/* Create Consent Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2">
              {lang === 'bn' ? 'নতুন ব্যাংক TPP কনসেন্ট অনুমোদন করুন' : 'Authorize New Bank TPP Consent'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {lang === 'bn'
                ? 'থার্ড-পার্টি প্রোভাইডার (TPP) হিসেবে ব্যাংকের সাথে কনসেন্ট এগ্রিমেন্ট তৈরি করুন।'
                : 'Establish FAPI OAuth 2.0 Consent grant with participating financial institution.'}
            </p>

            {consentSuccessMsg && (
              <div className="p-3 rounded-xl mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                {consentSuccessMsg}
              </div>
            )}

            <form onSubmit={handleCreateConsent} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'ব্যাংক নির্বাচন করুন:' : 'Select Bank Provider:'}
                </label>
                <select
                  value={selectedBankId}
                  onChange={(e) => setSelectedBankId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="">-- Select Bank --</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.bankName} ({p.apiSpec})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {lang === 'bn' ? 'অনুমোদিত স্কোপস (Scopes):' : 'Requested Permissions:'}
                </label>
                <div className="text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                  ReadAccountsDetail, ReadBalances, CreatePIS
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmittingConsent || !selectedBankId}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition shadow flex items-center justify-center gap-2"
                >
                  {isSubmittingConsent ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  {lang === 'bn' ? 'কনসেন্ট গ্রান্ট করুন' : 'Authorize FAPI Consent'}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Consents List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {lang === 'bn' ? 'সক্রিয় কনসেন্ট তালিকা (Active Consents)' : 'Active Open Banking Consents'}
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3">{lang === 'bn' ? 'কনসেন্ট রেফারেন্স' : 'Consent ID'}</th>
                    <th className="pb-3">{lang === 'bn' ? 'ব্যাংকের নাম' : 'Bank'}</th>
                    <th className="pb-3">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                    <th className="pb-3">{lang === 'bn' ? 'মেয়াদ উত্তীর্ণ' : 'Expires At'}</th>
                    <th className="pb-3 text-right">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {consents.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40">
                      <td className="py-3 font-mono text-indigo-300 font-semibold">{c.consentId}</td>
                      <td className="py-3 text-white font-medium">{c.bankName}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'AUTHORISED' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{new Date(c.expirationDateTime).toLocaleDateString()}</td>
                      <td className="py-3 text-right">
                        {c.status === 'AUTHORISED' && (
                          <button
                            onClick={() => handleRevokeConsent(c.consentId)}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] transition flex items-center gap-1 ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                            {lang === 'bn' ? 'বাতিল' : 'Revoke'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DEVELOPER API SPECIFICATION */}
      {activeTab === 'developer' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold">
            <Code2 className="w-5 h-5" />
            <span>{lang === 'bn' ? 'এপিআই ডকুমেন্টেশন ও cURL নির্দেশিকা' : 'Developer API Specifications'}</span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* AIS Sample */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-emerald-400 font-semibold mb-2"># 1. Account Information Service (AIS)</div>
              <pre className="text-slate-300 overflow-x-auto p-2 bg-slate-900 rounded">
{`curl -X GET http://localhost:3000/api/open-banking/accounts \\
  -H "Authorization: Bearer ob_access_token_brac_live_771239" \\
  -H "x-fapi-financial-id: BangladeshBank-OpenAPI-2026"`}
              </pre>
            </div>

            {/* PIS Sample */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-indigo-400 font-semibold mb-2"># 2. Payment Initiation Service (PIS)</div>
              <pre className="text-slate-300 overflow-x-auto p-2 bg-slate-900 rounded">
{`curl -X POST http://localhost:3000/api/open-banking/pis/pay \\
  -H "Content-Type: application/json" \\
  -d '{
    "debtorAccountId": "acc-brac-110293",
    "creditorWalletId": "WAL-1001",
    "amount": 50000,
    "currency": "BDT",
    "idempotencyKey": "PIS-KEY-171203"
  }'`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
