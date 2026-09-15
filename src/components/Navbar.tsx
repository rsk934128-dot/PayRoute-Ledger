import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  HardDrive, 
  CheckCircle2, 
  XCircle, 
  Globe, 
  Zap, 
  ShieldCheck, 
  RefreshCw,
  UserCheck,
  ShieldAlert,
  Mail,
  Copy,
  Check,
  X,
  User,
  Key,
  Database,
  QrCode,
  BadgeCheck,
  Settings,
  Activity,
  Sliders,
  RotateCw,
  Bell,
  BellOff,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  MessageCircle,
  ExternalLink,
  Smartphone,
  Apple,
  Download
} from 'lucide-react';

import { usePWAInstall } from '../lib/pwa';
import { sendNotification } from '../lib/notifications';

interface NavbarProps {
  lang: 'en' | 'bn';
  setLang: (l: 'en' | 'bn') => void;
  driveConnected: boolean;
  driveEmail?: string;
  adminEmail?: string;
  onConnectDrive: () => void;
  onDisconnectDrive: () => void;
  onOpenExportModal: () => void;
  onOpenGmailModal?: () => void;
  onRefreshData: () => void;
  autoSync: boolean;
  setAutoSync: (val: boolean) => void;
  lastSyncedAt?: Date | null;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  setLang,
  driveConnected,
  driveEmail,
  adminEmail = 'khokumoni30@gmail.com',
  onConnectDrive,
  onDisconnectDrive,
  onOpenExportModal,
  onOpenGmailModal,
  onRefreshData,
  autoSync,
  setAutoSync,
  lastSyncedAt,
  notificationsEnabled,
  onToggleNotifications,
}) => {
  const [timeString, setTimeString] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const profileId = 'c45cfdf2-e229-4f95-a845-afef0163b1d0';
  const firestoreDbId = 'ai-studio-payrouteledger-c45cfdf2-e229-4f95-a845-afef0163b1d0';
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US'));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [lang]);

  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareOnFacebook = () => {
    const url = window.location.href;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const url = window.location.href;
    const text = lang === 'bn' ? 'PayRoute ACID লেজার পেমেন্ট সলিউশন চেক আউট করুন!' : 'Check out PayRoute ACID Ledger payment solution!';
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnWhatsApp = () => {
    const url = window.location.href;
    const text = lang === 'bn' ? 'PayRoute ACID লেজার পেমেন্ট সলিউশন চেক আউট করুন!' : 'Check out PayRoute ACID Ledger payment solution!';
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = window.location.href;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleTestNotification = () => {
    sendNotification({
      title: lang === 'bn' ? 'টেস্ট নোটিফিকেশন' : 'Test Notification',
      body: lang === 'bn' 
        ? 'এটি একটি সফল পুশ নোটিফিকেশন টেস্ট!' 
        : 'This is a successful push notification test!',
      icon: '/favicon.jpg',
      tag: 'test-notification'
    });
  };

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/20 bg-slate-950">
              <img 
                src="/src/assets/images/payroute_app_logo_1785432931316.jpg" 
                alt="PayRoute Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                  PayRoute
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                  ACID Ledger
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {lang === 'bn' 
                  ? 'অটোমেটেড লেজার ট্রান্সফার ও স্মার্ট পেমেন্ট রাউটিং ইঞ্জিন' 
                  : 'Automated Ledger Transfer & Smart Payment Routing'}
              </p>
            </div>
          </div>

          {/* Center Live Engine Status */}
          <div className="hidden md:flex items-center space-x-4 bg-slate-800/60 backdrop-blur border border-slate-700/50 px-3 py-1.5 rounded-lg text-xs">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'bn' ? 'এসিড এআইসোলেশন' : 'ACID Isolated'}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center space-x-1.5 text-blue-400">
              <Zap className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'স্মার্ট রাউটিং সক্রিয়' : 'Smart Routing Active'}</span>
            </div>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 font-mono text-[11px]">{timeString}</span>
          </div>

          {/* Right Actions: Profile ID, Settings, Admin User, Google Drive & Language Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Active Profile ID Badge */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center space-x-1.5 bg-indigo-950/80 hover:bg-indigo-900/90 border border-indigo-500/40 text-indigo-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-inner transition-all hover:border-indigo-400"
              title={lang === 'bn' ? 'প্রোফাইল আইডি দেখুন' : 'View Profile ID'}
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="hidden xl:inline truncate max-w-[140px] font-mono">{adminEmail}</span>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/40">
                PRO-ID
              </span>
            </button>

            {/* Settings & Auto-Sync Modal Trigger */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                autoSync || notificationsEnabled
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-inner hover:border-emerald-400' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={lang === 'bn' ? 'সেটিংস ও নোটিফিকেশন' : 'Settings & Notifications'}
            >
              <Settings className={`w-3.5 h-3.5 ${autoSync || notificationsEnabled ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{lang === 'bn' ? 'সেটিংস' : 'Settings'}</span>
              {(autoSync || notificationsEnabled) && (
                <span className="flex items-center space-x-1 text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-500/40 font-mono font-bold">
                  {autoSync && <Activity className="w-2 h-2" />}
                  {notificationsEnabled && <Bell className="w-2 h-2" />}
                </span>
              )}
            </button>

            {/* Gmail Notification Button */}
            {onOpenGmailModal && (
              <button
                onClick={onOpenGmailModal}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-red-600/20 to-indigo-600/20 hover:from-red-600/30 hover:to-indigo-600/30 text-red-200 border border-red-500/30 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
                title={lang === 'bn' ? 'জিমেইল ইমেইল নোটিফিকেশন পাঠান' : 'Send Gmail Notification'}
              >
                <Mail className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden md:inline">{lang === 'bn' ? 'জিমেইল নোটিফিকেশন' : 'Gmail Notification'}</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              onClick={onRefreshData}
              title={lang === 'bn' ? 'ম্যানুয়াল ডাটা রিফ্রেশ' : 'Refresh Data'}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Google Drive Status & Export */}
            {driveConnected ? (
              <div className="flex items-center space-x-1.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 px-2.5 py-1.5 rounded-lg text-xs">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span className="hidden lg:inline truncate max-w-[120px]">{driveEmail}</span>
                <button
                  onClick={onOpenExportModal}
                  className="ml-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2 py-0.5 rounded text-[11px] transition-colors"
                >
                  {lang === 'bn' ? 'ড্রাইভ এক্সপোর্ট' : 'Drive Export'}
                </button>
              </div>
            ) : (
              <button
                onClick={onConnectDrive}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:border-slate-600"
              >
                <HardDrive className="w-4 h-4 text-blue-400" />
                <span>{lang === 'bn' ? 'গুগল ড্রাইভ কানেক্ট' : 'Connect Drive'}</span>
              </button>
            )}

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{lang === 'en' ? 'বাংলা' : 'EN'}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
              title={lang === 'bn' ? 'অ্যাপটি শেয়ার করুন' : 'Share App'}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'bn' ? 'শেয়ার করুন' : 'Share'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {lang === 'bn' ? 'বন্ধুদের সাথে শেয়ার করুন' : 'Share with Friends'}
                  </h3>
                  <p className="text-[11px] text-slate-400">{lang === 'bn' ? 'PayRoute প্ল্যাটফর্মটি বিভিন্ন মিডিয়াতে শেয়ার করুন' : 'Spread the word about PayRoute platform'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={shareOnFacebook}
                className="flex flex-col items-center justify-center p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-[#1877F2]/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Facebook className="w-5 h-5 text-[#1877F2]" />
                </div>
                <span className="text-xs font-medium text-slate-300">Facebook</span>
              </button>
              
              <button
                onClick={shareOnWhatsApp}
                className="flex flex-col items-center justify-center p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                </div>
                <span className="text-xs font-medium text-slate-300">WhatsApp</span>
              </button>

              <button
                onClick={shareOnTwitter}
                className="flex flex-col items-center justify-center p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Twitter className="w-5 h-5 text-slate-100" />
                </div>
                <span className="text-xs font-medium text-slate-300">Twitter (X)</span>
              </button>

              <button
                onClick={shareOnLinkedIn}
                className="flex flex-col items-center justify-center p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-[#0A66C2]/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                </div>
                <span className="text-xs font-medium text-slate-300">LinkedIn</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {lang === 'bn' ? 'ডাইরেক্ট লিঙ্ক:' : 'Direct App Link:'}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-900 border border-slate-800 px-3 py-2 rounded text-[10px] text-slate-400 truncate">
                  {window.location.href}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsShareModalOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors"
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* System Settings & Auto-Sync Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-6 animate-fadeIn">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {lang === 'bn' ? 'সিস্টেম সেটিংস ও অটো-সিঙ্ক' : 'System Settings & Auto-Sync'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'bn' 
                      ? 'রিয়েল-টাইম ডাটা সিঙ্ক ও প্ল্যাটফর্ম কনফিগারেশন' 
                      : 'Real-Time Data Sync & Platform Configurations'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Settings Options */}
            <div className="space-y-4">
              
              {/* Push Notifications Toggle */}
              <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    {notificationsEnabled ? (
                      <Bell className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <BellOff className="w-5 h-5 text-slate-500" />
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">
                        {lang === 'bn' ? 'পুশ নোটিফিকেশন (Push Notifications)' : 'Browser Push Notifications'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {lang === 'bn' 
                          ? 'পেমেন্ট সম্পন্ন বা ব্যর্থ হলে রিয়েল-টাইম ব্রাউজার অ্যালার্ট পান।' 
                          : 'Get real-time browser alerts when transfers are completed or failed.'}
                      </p>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    onClick={onToggleNotifications}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notificationsEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {notificationsEnabled && (
                  <button
                    onClick={handleTestNotification}
                    className="w-full flex items-center justify-center space-x-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold border border-slate-700 transition-all"
                  >
                    <Bell className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'টেস্ট নোটিফিকেশন পাঠান' : 'Send Test Notification'}</span>
                  </button>
                )}
              </div>

              {/* PWA Install Button */}
              {!isInstalled && (isInstallable || isIOS) && (
                <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-blue-300">
                        {lang === 'bn' ? 'অ্যাপ ইন্সটল করুন' : 'Install PayRoute App'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {lang === 'bn' ? 'ভালো অভিজ্ঞতার জন্য অ্যাপটি ইন্সটল করুন' : 'Install for a full-screen standalone experience'}
                      </p>
                    </div>
                    {isInstallable ? (
                      <button
                        onClick={install}
                        className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-600/20"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'ইন্সটল' : 'Install'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowIOSGuide(true)}
                        className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 transition-all"
                      >
                        <Apple className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'আইওএস' : 'iOS'}</span>
                      </button>
                    )}
                  </div>

                  {showIOSGuide && (
                    <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {lang === 'bn' ? 'আইফোন/আইপ্যাড ইন্সটল গাইড' : 'iOS Install Guide'}
                        </span>
                        <button onClick={() => setShowIOSGuide(false)}>
                          <X className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                        </button>
                      </div>
                      <div className="space-y-2 text-[11px] text-slate-400">
                        <p className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold shrink-0 text-blue-400">1</span>
                          <span>{lang === 'bn' ? 'সাফারি টুলবারে "Share" বাটনে ট্যাপ করুন।' : 'Tap the "Share" button in Safari.'}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold shrink-0 text-blue-400">2</span>
                          <span>{lang === 'bn' ? '"Add to Home Screen" বাটনে ট্যাপ করুন।' : 'Tap "Add to Home Screen".'}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Auto-Sync Toggle Control */}
              <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Activity className={`w-5 h-5 ${autoSync ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">
                        {lang === 'bn' ? 'অটো-সিঙ্ক লেজার ডাটা (Auto-Sync)' : 'Auto-Sync Ledger Data'}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {lang === 'bn' 
                          ? "প্রতি ৬০ সেকেন্ড পর পর 'fetchData' রান করে লেজার রিয়েল-টাইমে আপডেট রাখবে।" 
                          : "Triggers 'fetchData' every 60 seconds to keep the Ledger view updated in real-time."}
                      </p>
                    </div>
                  </div>

                  {/* Switch Toggle */}
                  <button
                    type="button"
                    onClick={() => setAutoSync(!autoSync)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      autoSync ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={autoSync}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        autoSync ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Status Indicator Bar */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">{lang === 'bn' ? 'স্ট্যাটাস:' : 'Status:'}</span>
                    {autoSync ? (
                      <span className="flex items-center space-x-1 text-emerald-400 font-bold font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>{lang === 'bn' ? 'সক্রিয় (৬০ সেক ইন্টারভাল)' : 'Active (60s Interval)'}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 font-bold font-mono">
                        {lang === 'bn' ? 'নিষ্ক্রিয় (Disabled)' : 'Disabled'}
                      </span>
                    )}
                  </div>

                  {lastSyncedAt && (
                    <div className="text-[11px] text-slate-400 font-mono">
                      <span>{lang === 'bn' ? 'সর্বশেষ সিঙ্ক:' : 'Last Synced:'} </span>
                      <span className="text-indigo-300 font-bold">
                        {lastSyncedAt.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Sync Button */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">
                    {lang === 'bn' ? 'ম্যানুয়াল ডাটা রিফ্রেশ' : 'Manual Data Refresh'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {lang === 'bn' ? 'এখনই লেজার ডাটা ফেচ করুন' : 'Fetch overview data immediately'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    onRefreshData();
                  }}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'এখনই সিঙ্ক করুন' : 'Sync Now'}</span>
                </button>
              </div>

              {/* Language Switch Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200">
                    {lang === 'bn' ? 'ভাষা নির্বাচন (Language)' : 'Interface Language'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {lang === 'bn' ? 'বাংলা এবং ইংরেজি ভাষা পরিবর্তন' : 'Switch between English and Bengali'}
                  </p>
                </div>
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setLang('bn')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      lang === 'bn' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    বাংলা
                  </button>
                  <button
                    onClick={() => setLang('en')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      lang === 'en' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-2">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors"
              >
                {lang === 'bn' ? 'ঠিক আছে / বন্ধ করুন' : 'Save & Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Profile ID Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {lang === 'bn' ? 'ব্যবহারকারীর প্রোফাইল আইডি' : 'User Profile Identity'}
                  </h3>
                  <p className="text-[11px] text-indigo-300 font-mono">PayRoute Account Details</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="space-y-4">
              
              {/* Account Profile Header */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg border-2 border-indigo-400 shadow-md">
                  K
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-sm text-slate-100">{adminEmail}</span>
                    <BadgeCheck className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                  </div>
                  <div className="text-xs text-indigo-300 font-mono flex items-center space-x-1 mt-0.5">
                    <span>Admin & Developer Profile</span>
                  </div>
                </div>
              </div>

              {/* Profile ID Block */}
              <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    {lang === 'bn' ? 'ইউনিক প্রোফাইল আইডি (Profile ID):' : 'Unique Profile ID:'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    PRIMARY KEY
                  </span>
                </div>
                <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs font-bold text-amber-300">
                  <span className="truncate mr-2">{profileId}</span>
                  <button
                    onClick={() => handleCopyId(profileId)}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] transition-all font-sans font-extrabold shrink-0"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId ? (lang === 'bn' ? 'কপিড!' : 'Copied') : (lang === 'bn' ? 'কপি করুন' : 'Copy')}</span>
                  </button>
                </div>
              </div>

              {/* Firestore DB ID Block */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'bn' ? 'ফায়ারস্টোর ডাটাবেস আইডি:' : 'Firestore Database ID:'}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 bg-slate-900 p-2 rounded border border-slate-800 truncate">
                  {firestoreDbId}
                </div>
              </div>

              {/* Security Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-300 text-[11px]">Level 3 KYC Verified</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center space-x-2">
                  <Key className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-slate-300 text-[11px]">Firebase OAuth Active</span>
                </div>
              </div>

            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close Window'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
