import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  PaymentRail, 
  Transaction, 
  LedgerEntry, 
  QueueTask, 
  WebhookEvent, 
  AnomalyAlert 
} from './types';
import { Navbar } from './components/Navbar';
import { WalletLedgerView } from './components/WalletLedgerView';
import { SmartRoutingView } from './components/SmartRoutingView';
import { AsyncQueueView } from './components/AsyncQueueView';
import { AiAnomalyView } from './components/AiAnomalyView';
import { WebhookDevView } from './components/WebhookDevView';
import { OpenBankingView } from './components/OpenBankingView';
import { PassportVirtualCardView } from './components/PassportVirtualCardView';
import { ElectricityBillView } from './components/ElectricityBillView';
import { BusinessRoadmapView } from './components/BusinessRoadmapView';
import { MobileAppSimulatorView } from './components/MobileAppSimulatorView';
import { DriveExportModal } from './components/DriveExportModal';
import { GmailNotificationModal } from './components/GmailNotificationModal';
import { 
  Wallet as WalletIcon, 
  Zap, 
  Cpu, 
  Bot, 
  Webhook, 
  RefreshCw, 
  ShieldCheck,
  Landmark,
  Smartphone,
  CreditCard,
  TrendingUp
} from 'lucide-react';

export default function App() {
  const [lang, setLang] = useState<'en' | 'bn'>('bn'); // Default to Bengali as per user prompt!
  const [activeTab, setActiveTab] = useState<'business' | 'electricity' | 'ledger' | 'mobile' | 'routing' | 'queue' | 'ai' | 'webhooks' | 'openbanking' | 'passport-cards'>('business');

  // Ledger & System Data
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [rails, setRails] = useState<PaymentRail[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [queueTasks, setQueueTasks] = useState<QueueTask[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [anomalyAlerts, setAnomalyAlerts] = useState<AnomalyAlert[]>([]);

  // System Administrator User Profile State
  const [adminEmail, setAdminEmail] = useState<string>('rubels1k994@gmail.com');

  // Auto-Sync & Real-Time Sync State
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Google Drive Connection State
  const [driveConnected, setDriveConnected] = useState<boolean>(false);
  const [driveEmail, setDriveEmail] = useState<string>('');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(true);

  // Fetch Overview & Admin Data
  const fetchData = async () => {
    try {
      const res = await fetch('/api/ledger/overview');
      if (res.ok) {
        const data = await res.json();
        setWallets(data.wallets || []);
        setRails(data.rails || []);
        setTransactions(data.transactions || []);
        setLedgerEntries(data.ledgerEntries || []);
        setQueueTasks(data.queueTasks || []);
        setWebhookEvents(data.webhookEvents || []);
        setAnomalyAlerts(data.anomalyAlerts || []);
        setLastSyncedAt(new Date());
      }

      const adminRes = await fetch('/api/admin/profile');
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        if (adminData.admin?.email) {
          setAdminEmail(adminData.admin.email);
        }
      }
    } catch (err) {
      console.error('Failed to fetch ledger overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-Sync 60s Interval Effect to keep Ledger view updated in real-time
  useEffect(() => {
    if (!autoSync) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [autoSync]);

  // Fetch Google OAuth Status
  const checkGoogleDriveStatus = async () => {
    try {
      const res = await fetch('/api/auth/google/status');
      if (res.ok) {
        const data = await res.json();
        setDriveConnected(data.connected);
        setDriveEmail(data.userEmail || '');
      }
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchData();
    checkGoogleDriveStatus();

    // Listen for OAuth message from child popup window if opened
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
        checkGoogleDriveStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Connect Google Drive (OAuth)
  const handleConnectDrive = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          window.open(data.authUrl, 'GoogleDriveOAuth', 'width=550,height=650');
        }
      }
    } catch (e) {
      console.error('Failed to get OAuth URL:', e);
    }
  };

  // Disconnect Drive
  const handleDisconnectDrive = async () => {
    try {
      await fetch('/api/auth/google/disconnect', { method: 'POST' });
      setDriveConnected(false);
      setDriveEmail('');
    } catch (e) {
      console.error(e);
    }
  };

  // Execute Transfer API
  const handleExecuteTransfer = async (transferData: {
    senderWalletId: string;
    receiverWalletId: string;
    amount: number;
    requestedRail: string;
    reference: string;
    idempotencyKey: string;
  }) => {
    const res = await fetch('/api/ledger/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transferData),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      fetchData(); // Refresh state
      return { success: true };
    } else {
      return { success: false, error: data.error || 'Transfer failed.' };
    }
  };

  // Update Gateway Rail Status (for testing failover)
  const handleUpdateRailStatus = async (
    railId: string, 
    status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE', 
    latencyMs?: number
  ) => {
    try {
      await fetch('/api/routing/update-rail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ railId, status, latencyMs }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger Batch Simulation
  const handleTriggerBatchSimulate = async (count: number) => {
    try {
      await fetch('/api/queue/batch-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Export to Google Drive API
  const handleExportToDrive = async (title: string, format: 'TXT' | 'CSV' | 'JSON') => {
    const res = await fetch('/api/drive/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, format }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        webViewLink: data.webViewLink,
        fileName: data.fileName,
      };
    } else {
      return {
        success: false,
        error: data.error || 'Export failed.',
      };
    }
  };

  // Trigger Gemini AI Audit
  const handleTriggerAiAudit = async () => {
    const res = await fetch('/api/ai/audit', { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.auditReport) {
      return { success: true, auditReport: data.auditReport };
    } else {
      return { success: false, error: data.error || 'AI service unavailable.' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        lang={lang}
        setLang={setLang}
        driveConnected={driveConnected}
        driveEmail={driveEmail}
        adminEmail={adminEmail}
        onConnectDrive={handleConnectDrive}
        onDisconnectDrive={handleDisconnectDrive}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenGmailModal={() => setIsGmailModalOpen(true)}
        onRefreshData={fetchData}
        autoSync={autoSync}
        setAutoSync={setAutoSync}
        lastSyncedAt={lastSyncedAt}
      />

      {/* Main Content Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('business')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'business'
                ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-slate-950 shadow-lg shadow-emerald-500/30 font-black'
                : 'bg-slate-900/60 text-emerald-300 hover:text-white hover:bg-slate-800/80 border border-emerald-500/30'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'bn' ? 'ব্যবসা, ভ্যালুয়েশন ও লাইসেন্সিং' : 'Business & Licensing'}</span>
            <span className="px-1.5 py-0.5 bg-emerald-500/30 text-emerald-950 text-[10px] rounded-full font-black border border-emerald-400">
              GUIDE
            </span>
          </button>

          <button
            onClick={() => setActiveTab('electricity')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'electricity'
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 font-black'
                : 'bg-slate-900/60 text-amber-300 hover:text-white hover:bg-slate-800/80 border border-amber-500/30'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <span>{lang === 'bn' ? 'বিদ্যুৎ বিল ও ফায়ারবেস' : 'Electricity Bill & Firebase'}</span>
            <span className="px-1.5 py-0.5 bg-amber-500/30 text-amber-900 text-[10px] rounded-full font-black border border-amber-400">
              FIREBASE
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'mobile'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-indigo-500/30'
            }`}
          >
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span>{lang === 'bn' ? 'মোবাইল অ্যাপস প্রসেসর' : 'Mobile App Simulator'}</span>
            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-full font-extrabold border border-emerald-400/30">
              LIVE
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'ledger'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <WalletIcon className="w-4 h-4" />
            <span>{lang === 'bn' ? '১. ইন্টারনাল লেজার ও ওয়ালেট' : '1. Internal Ledger'}</span>
          </button>

          <button
            onClick={() => setActiveTab('routing')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'routing'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{lang === 'bn' ? '২. স্মার্ট পেমেন্ট রাউটিং' : '2. Smart Routing & Rails'}</span>
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'queue'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{lang === 'bn' ? '৩. অটমেটেড কিউ ও ওয়ার্কার' : '3. Async Queue Worker'}</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'ai'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Bot className="w-4 h-4 text-purple-300" />
            <span>{lang === 'bn' ? 'জেমিলাই এআই অ্যানোমালি' : 'Gemini AI Auditor'}</span>
          </button>

          <button
            onClick={() => setActiveTab('webhooks')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'webhooks'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Webhook className="w-4 h-4" />
            <span>{lang === 'bn' ? 'ওয়েবহুক ও এপিআই' : 'Signed Webhooks'}</span>
          </button>

          <button
            onClick={() => setActiveTab('openbanking')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'openbanking'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'bg-slate-900/60 text-indigo-300 hover:text-white hover:bg-slate-800/80 border border-indigo-500/30'
            }`}
          >
            <Landmark className="w-4 h-4 text-indigo-400" />
            <span>{lang === 'bn' ? 'ওপেন ব্যাংকিং সার্ভিস (PSD2)' : 'Open Banking (PSD2)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('passport-cards')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'passport-cards'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-900/60 text-purple-300 hover:text-white hover:bg-slate-800/80 border border-purple-500/30'
            }`}
          >
            <CreditCard className="w-4 h-4 text-purple-400" />
            <span>{lang === 'bn' ? 'পাসপোর্ট ও ভার্চুয়াল কার্ড' : 'Passport & Virtual Card'}</span>
            <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] rounded-full font-extrabold border border-purple-400/30">
              NEW API
            </span>
          </button>
        </div>

        {/* Tab Content Loading or Render */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-xs font-medium">
              {lang === 'bn' ? 'পেমেন্ট লেজার প্রসেসর লোড হচ্ছে...' : 'Initializing PayRoute ACID Ledger Engine...'}
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'business' && (
              <BusinessRoadmapView lang={lang} />
            )}

            {activeTab === 'electricity' && (
              <ElectricityBillView
                lang={lang}
                onPaymentProcessed={fetchData}
              />
            )}

            {activeTab === 'mobile' && (
              <MobileAppSimulatorView
                lang={lang}
                wallets={wallets}
                transactions={transactions}
                onTransactionSuccess={fetchData}
              />
            )}

            {activeTab === 'ledger' && (
              <WalletLedgerView
                lang={lang}
                wallets={wallets}
                transactions={transactions}
                ledgerEntries={ledgerEntries}
                rails={rails}
                onExecuteTransfer={handleExecuteTransfer}
              />
            )}

            {activeTab === 'routing' && (
              <SmartRoutingView
                lang={lang}
                rails={rails}
                onUpdateRailStatus={handleUpdateRailStatus}
              />
            )}

            {activeTab === 'queue' && (
              <AsyncQueueView
                lang={lang}
                queueTasks={queueTasks}
                recentTransactions={transactions}
                onTriggerBatchSimulate={handleTriggerBatchSimulate}
              />
            )}

            {activeTab === 'ai' && (
              <AiAnomalyView
                lang={lang}
                anomalyAlerts={anomalyAlerts}
                transactions={transactions}
                onTriggerAiAudit={handleTriggerAiAudit}
              />
            )}

            {activeTab === 'webhooks' && (
              <WebhookDevView
                lang={lang}
                webhookEvents={webhookEvents}
                onRefreshData={fetchData}
              />
            )}

            {activeTab === 'openbanking' && (
              <OpenBankingView
                lang={lang}
                wallets={wallets}
                onTransactionSuccess={fetchData}
              />
            )}

            {activeTab === 'passport-cards' && (
              <PassportVirtualCardView
                lang={lang}
                wallets={wallets}
                onRefreshData={fetchData}
              />
            )}
          </>
        )}
      </main>

      {/* Google Drive Export Modal */}
      <DriveExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        lang={lang}
        driveConnected={driveConnected}
        driveEmail={driveEmail}
        onConnectDrive={handleConnectDrive}
        onExportToDrive={handleExportToDrive}
      />

      {/* Gmail Notification Modal */}
      <GmailNotificationModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        lang={lang}
        defaultRecipientEmail={adminEmail}
      />
    </div>
  );
}
