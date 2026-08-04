import React, { useState, useEffect, useMemo } from 'react';
import { WebhookEvent, WebhookDeliveryLog } from '../types';
import { GmailNotificationModal } from './GmailNotificationModal';
import { 
  Webhook, 
  Send, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  RotateCw, 
  Clock, 
  Terminal, 
  ShieldCheck,
  Filter,
  Search,
  Zap,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Activity,
  Flame,
  ExternalLink,
  RefreshCw,
  Play,
  Mail
} from 'lucide-react';

interface WebhookDevViewProps {
  lang: 'en' | 'bn';
  webhookEvents: WebhookEvent[];
  onRefreshData?: () => void;
}

export const WebhookDevView: React.FC<WebhookDevViewProps> = ({
  lang,
  webhookEvents,
  onRefreshData,
}) => {
  const [events, setEvents] = useState<WebhookEvent[]>(webhookEvents);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [isRetryingAll, setIsRetryingAll] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [forceSuccess, setForceSuccess] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FAILED' | 'DELIVERED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [gmailSubject, setGmailSubject] = useState('');
  const [gmailMessage, setGmailMessage] = useState('');

  const handleOpenGmailAlert = (ev?: WebhookEvent) => {
    if (ev) {
      setGmailSubject(lang === 'bn' 
        ? `🚨 ওয়েবহুক ডিসপ্যাচ ব্যর্থতা অ্যালার্ট: ${ev.id}` 
        : `🚨 Webhook Dispatch Failure Alert: ${ev.id}`);
      setGmailMessage(
        lang === 'bn'
          ? `ওয়েবহুক ইভেন্ট ${ev.id} (ট্রানজ্যাকশন: ${ev.transactionId}) এন্ডপয়েন্টে (${ev.endpointUrl || 'Merchant API'}) ডেলিভারি হতে ব্যর্থ হয়েছে।\nস্ট্যাটাস কোড: HTTP ${ev.statusCode || 500}\nব্যর্থতার কারণ: ${ev.failureReason || 'Gateway Timeout / Connection Error'}`
          : `Webhook Event ${ev.id} (Transaction: ${ev.transactionId}) failed delivery to endpoint (${ev.endpointUrl || 'Merchant API'}).\nStatus Code: HTTP ${ev.statusCode || 500}\nFailure Reason: ${ev.failureReason || 'Gateway Timeout / Socket Error'}`
      );
    } else {
      setGmailSubject(lang === 'bn' ? '⚡ পে-রুট সিকিউরিটি ও ওয়েবহুক নোটিফিকেশন' : '⚡ PayRoute Webhook & Security Notification');
      setGmailMessage(lang === 'bn' ? 'পে-রুট সিস্টেমের সকল ওয়েবহুক এবং পেমেন্ট রাউটিং স্টেট স্বাভাবিক রয়েছে।' : 'PayRoute payment rails and webhook delivery systems operating smoothly.');
    }
    setIsGmailModalOpen(true);
  };

  useEffect(() => {
    setEvents(webhookEvents);
  }, [webhookEvents]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered Webhook Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesFilter =
        statusFilter === 'ALL' ||
        (statusFilter === 'FAILED' && ev.status === 'FAILED') ||
        (statusFilter === 'DELIVERED' && ev.status === 'DELIVERED');

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        ev.id.toLowerCase().includes(query) ||
        ev.transactionId.toLowerCase().includes(query) ||
        ev.eventType.toLowerCase().includes(query) ||
        (ev.endpointUrl && ev.endpointUrl.toLowerCase().includes(query)) ||
        (ev.failureReason && ev.failureReason.toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });
  }, [events, statusFilter, searchQuery]);

  // Statistics
  const totalCount = events.length;
  const deliveredCount = events.filter(e => e.status === 'DELIVERED').length;
  const failedCount = events.filter(e => e.status === 'FAILED').length;
  const healthRate = totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 100;

  // Single Manual Re-trigger Handler with Exponential Backoff
  const handleSingleRetry = async (webhookId: string) => {
    setRetryingIds(prev => new Set(prev).add(webhookId));

    try {
      const res = await fetch('/api/webhooks/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookId, forceSuccess }),
      });

      const data = await res.json();

      if (data.success && data.webhookEvent) {
        setEvents(prev => prev.map(e => e.id === webhookId ? data.webhookEvent : e));
        showToast(
          data.webhookEvent.status === 'DELIVERED'
            ? lang === 'bn' 
              ? `ওয়েবহুক ${webhookId} সফলভাবে আবার পাঠানো হয়েছে (200 OK)!`
              : `Webhook ${webhookId} re-delivered successfully (200 OK)!`
            : lang === 'bn'
              ? `ওয়েবহুক ${webhookId} পুনরায় ব্যর্থ হয়েছে (HTTP ${data.webhookEvent.statusCode})`
              : `Webhook ${webhookId} retry attempt failed (HTTP ${data.webhookEvent.statusCode})`,
          data.webhookEvent.status === 'DELIVERED' ? 'success' : 'error'
        );

        if (onRefreshData) onRefreshData();
      } else {
        showToast(data.error || 'Retry failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error executing retry', 'error');
    } finally {
      setRetryingIds(prev => {
        const next = new Set(prev);
        next.delete(webhookId);
        return next;
      });
    }
  };

  // Bulk Retry All Failed Handler
  const handleRetryAllFailed = async () => {
    if (failedCount === 0) {
      showToast(lang === 'bn' ? 'কোন ব্যর্থ ওয়েবহুক পাওয়া যায়নি' : 'No failed webhooks to retry', 'info');
      return;
    }

    setIsRetryingAll(true);
    try {
      const res = await fetch('/api/webhooks/retry-all-failed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (data.success && data.webhookEvents) {
        setEvents(data.webhookEvents);
        showToast(
          lang === 'bn'
            ? `${data.succeededCount} টি ওয়েবহুক সফলভাবে রিট্রাই করা হয়েছে, ${data.failedCount} টি ব্যর্থ হয়েছে।`
            : `Batch retry complete: ${data.succeededCount} delivered, ${data.failedCount} still pending.`,
          'success'
        );

        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to trigger batch retry', 'error');
    } finally {
      setIsRetryingAll(false);
    }
  };

  // Simulate Failed Webhook Event (For testing retry mechanism)
  const handleSimulateFailure = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/webhooks/simulate-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (data.success && data.webhookEvent) {
        setEvents(prev => [data.webhookEvent, ...prev]);
        showToast(
          lang === 'bn'
            ? `নতুন টেস্ট ফেইল্ড ওয়েবহুক ইভেন্ট ${data.webhookEvent.id} তৈরি করা হয়েছে।`
            : `Simulated failed webhook ${data.webhookEvent.id} dispatched for testing.`,
          'info'
        );
        if (onRefreshData) onRefreshData();
      }
    } catch (err: any) {
      showToast(err.message || 'Simulation error', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-semibold transition-all ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200' 
            : toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : 'bg-indigo-950/90 border-indigo-500/40 text-indigo-200'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toastMessage.type === 'error' && <XCircle className="w-4 h-4 text-rose-400" />}
          {toastMessage.type === 'info' && <Zap className="w-4 h-4 text-indigo-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <Webhook className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-100">
                  {lang === 'bn' ? 'অটোমেটেড ওয়েবহুক ও ম্যানুয়াল রিট্রাই ইঞ্জাইন' : 'Signed Webhook Dispatcher & Retry Engine'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  HMAC SHA-256
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'bn' 
                  ? 'মার্চেন্ট ব্যাকএন্ডে ডিসপ্যাচকৃত ওয়েবহুকের জন্য ম্যানুয়াল রিট্রাই ও এক্সপোনেনশিয়াল ব্যাকঅফ ট্র্যাকিং সিস্টেম।' 
                  : 'Automated cryptographic event delivery with manual re-triggering and exponential backoff telemetry.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenGmailAlert()}
              className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-red-600/30 to-rose-600/30 hover:from-red-600/40 hover:to-rose-600/40 text-red-200 border border-red-500/40 rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <Mail className="w-3.5 h-3.5 text-red-400" />
              <span>{lang === 'bn' ? 'জিমেইল নোটিফিকেশন' : 'Gmail Notification'}</span>
            </button>

            <button
              onClick={handleSimulateFailure}
              disabled={isSimulating}
              className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-md disabled:opacity-50"
            >
              {isSimulating ? (
                <RotateCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              ) : (
                <Flame className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{lang === 'bn' ? 'টেস্ট ফেইল্ড ইভেন্ট সিমুলেট' : 'Simulate Failed Event'}</span>
            </button>

            <button
              onClick={handleRetryAllFailed}
              disabled={isRetryingAll || failedCount === 0}
              className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRetryingAll ? 'animate-spin' : ''}`} />
              <span>
                {lang === 'bn'
                  ? `সকল ফেইল্ড ওয়েবহুক রিট্রাই (${failedCount})`
                  : `Retry All Failed (${failedCount})`}
              </span>
            </button>
          </div>
        </div>

        {/* Dashboard Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 shadow-inner">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>{lang === 'bn' ? 'মোট ডিসপ্যাচ ইভেন্ট:' : 'Total Webhook Dispatches:'}</span>
              <Terminal className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-extrabold text-slate-100 font-mono">{totalCount}</div>
            <span className="text-[10px] text-slate-500">{lang === 'bn' ? 'সকল রেকর্ডকৃত ইভেন্ট' : 'All logged event dispatches'}</span>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 shadow-inner">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>{lang === 'bn' ? 'সফলভাবে ডেলিভার্ড:' : 'Successfully Delivered:'}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-extrabold text-emerald-400 font-mono">{deliveredCount}</div>
            <span className="text-[10px] text-emerald-500/80">{lang === 'bn' ? 'HTTP 200 OK রেসপন্স' : 'HTTP 200 OK acknowledged'}</span>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 shadow-inner">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>{lang === 'bn' ? 'ব্যর্থ / রিট্রাই পেন্ডিং:' : 'Failed / Retry Pending:'}</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-extrabold text-rose-400 font-mono">{failedCount}</div>
            <span className="text-[10px] text-rose-400/80">{lang === 'bn' ? 'রিট্রাই দরকার' : 'Requires manual or auto retry'}</span>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 shadow-inner">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>{lang === 'bn' ? 'ব্যাকঅফ পলিসি:' : 'Exponential Backoff Formula:'}</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-sm font-bold text-slate-200 font-mono">T<sub>delay</sub> = 2<sup>attempt-1</sup> × 2s</div>
            <span className="text-[10px] text-amber-400/80">{lang === 'bn' ? 'সর্বোচ্চ ৫ টি চেষ্টা (Max 32s)' : 'Max 5 attempts (Delays: 2s, 4s, 8s, 16s, 32s)'}</span>
          </div>
        </div>
      </div>

      {/* Control Bar & Filter Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {lang === 'bn' ? `সব (${totalCount})` : `All (${totalCount})`}
          </button>
          <button
            onClick={() => setStatusFilter('FAILED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              statusFilter === 'FAILED'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>{lang === 'bn' ? `ব্যর্থ (${failedCount})` : `Failed (${failedCount})`}</span>
            {failedCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setStatusFilter('DELIVERED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'DELIVERED'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {lang === 'bn' ? `ডেলিভার্ড (${deliveredCount})` : `Delivered (${deliveredCount})`}
          </button>
        </div>

        {/* Search Bar & Force Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'bn' ? 'ইভেন্ট আইডি, ট্রানজ্যাকশন আইডি দিয়ে খুঁজুন...' : 'Search by Event ID, Tx ID, URL...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <label className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={forceSuccess}
              onChange={(e) => setForceSuccess(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500/20 w-3.5 h-3.5"
            />
            <span className="text-[11px] font-semibold text-slate-300">
              {lang === 'bn' ? 'ম্যানুয়াল রিট্রাই-এ 200 OK ফোর্স করুন' : 'Force 200 OK on Retry'}
            </span>
          </label>
        </div>
      </div>

      {/* Webhook Events Log Cards List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-slate-100 font-bold text-base flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <span>{lang === 'bn' ? 'ওয়েবহুক ডিসপ্যাচ ও এক্সপোনেনশিয়াল ব্যাকঅফ স্টেট' : 'Webhook Dispatch & Exponential Backoff Logs'}</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {lang === 'bn' ? `${filteredEvents.length} টি ফলাফল प्रदर्शित` : `Showing ${filteredEvents.length} events`}
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/50 rounded-xl border border-slate-800/80">
            <Webhook className="w-10 h-10 text-slate-600 mx-auto mb-3 animate-pulse" />
            <p className="text-sm font-semibold text-slate-400">
              {lang === 'bn' ? 'কোন ওয়েবহুক ইভেন্ট পাওয়া যায়নি' : 'No webhook events found'}
            </p>
            <p className="text-xs text-slate-600 mt-1">
              {lang === 'bn' 
                ? 'ফিল্টার পরিবর্তন করুন অথবা নতুন টেস্ট ইভেন্ট সিমুলেট করুন।' 
                : 'Try adjusting your filters or click "Simulate Failed Event".'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const isRetrying = retryingIds.has(event.id);
              const isFailed = event.status === 'FAILED';
              const isExpanded = expandedLogId === event.id;
              const attempts = event.attemptCount || 1;
              const maxAttempts = event.maxAttempts || 5;

              // Calculate delay time for display: 2^(attempt-1) * 2s
              const backoffDelay = event.nextRetryDelaySeconds ?? (Math.pow(2, attempts) * 2);

              return (
                <div 
                  key={event.id} 
                  className={`p-5 rounded-2xl border transition-all ${
                    isFailed
                      ? 'bg-gradient-to-r from-rose-950/30 via-slate-950 to-slate-950 border-rose-500/30 shadow-lg shadow-rose-950/10'
                      : 'bg-slate-950 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  {/* Top Bar: Badges, Event Type, Status & Actions */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center space-x-1 ${
                        isFailed 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {isFailed ? (
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>{event.statusCode ? `${event.statusCode} ${isFailed ? 'FAILED' : 'OK'}` : event.status}</span>
                      </span>

                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-bold">
                        {event.eventType}
                      </span>

                      <span className="text-slate-400 font-mono text-xs font-semibold">
                        ID: {event.id}
                      </span>

                      <span className="text-slate-500 font-mono text-[11px]">
                        Tx: {event.transactionId}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>

                      {/* Gmail Alert Button for Webhook Event */}
                      <button
                        onClick={() => handleOpenGmailAlert(event)}
                        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 transition-all shadow-sm"
                        title="Send Gmail Email Alert for this event"
                      >
                        <Mail className="w-3.5 h-3.5 text-red-400" />
                        <span>{lang === 'bn' ? 'জিমেলেই অ্যালার্ট' : 'Gmail Alert'}</span>
                      </button>

                      {/* Re-Trigger Button for FAILED or ANY webhook */}
                      <button
                        onClick={() => handleSingleRetry(event.id)}
                        disabled={isRetrying}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                          isFailed
                            ? 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-amber-900/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        }`}
                        title="Manually re-trigger webhook dispatch"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                        <span>
                          {isRetrying 
                            ? (lang === 'bn' ? 'ডিসপ্যাচিং...' : 'Retrying...') 
                            : (lang === 'bn' ? 'ম্যানুয়াল রিট্রাই' : 'Re-trigger Now')}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Endpoint URL */}
                  {event.endpointUrl && (
                    <div className="text-slate-400 text-xs font-mono flex items-center space-x-1.5 mb-3 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800/80">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{event.endpointUrl}</span>
                    </div>
                  )}

                  {/* Exponential Backoff Banner for Failed Webhooks */}
                  {isFailed && (
                    <div className="mb-4 bg-rose-950/40 border border-rose-500/30 rounded-xl p-3.5 text-xs font-mono space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center space-x-2 text-rose-300 font-bold">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                          <span>
                            {lang === 'bn' ? 'ডেলিভারি ব্যর্থতা:' : 'Delivery Error:'} {event.failureReason || 'Merchant endpoint timeout or failure.'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-amber-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-amber-500/20 text-[11px] font-bold">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {lang === 'bn'
                              ? `চেষ্টা ${attempts}/${maxAttempts} • পরবর্তী রিট্রাই ব্যাকঅফ ডিলে: ${backoffDelay}s`
                              : `Attempt ${attempts}/${maxAttempts} • Next Backoff Delay: ${backoffDelay}s`}
                          </span>
                        </div>
                      </div>

                      {/* Exponential Backoff Curve Stepper Visualization */}
                      <div className="mt-2 pt-2 border-t border-rose-900/40">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span>Exponential Backoff Progression Formula:</span>
                          <span className="text-amber-400 font-bold">2<sup>attempt-1</sup> × 2 seconds</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[1, 2, 3, 4, 5].map((step) => {
                            const stepDelay = Math.pow(2, step - 1) * 2;
                            const isPast = step <= attempts;
                            const isCurrent = step === attempts;

                            return (
                              <div 
                                key={step}
                                className={`px-2 py-1.5 rounded text-center border transition-all ${
                                  isCurrent
                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-extrabold ring-1 ring-amber-500/30'
                                    : isPast
                                      ? 'bg-rose-950/60 border-rose-800/60 text-rose-400'
                                      : 'bg-slate-900 border-slate-800 text-slate-600'
                                }`}
                              >
                                <div className="text-[9px] uppercase tracking-wider">Attempt {step}</div>
                                <div className="text-[11px] font-bold font-mono">{stepDelay}s delay</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* HMAC Signature & Copy */}
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono mb-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
                    <div className="flex items-center space-x-2 truncate pr-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">HMAC-SHA256: {event.signature}</span>
                    </div>

                    <button
                      onClick={() => copyToClipboard(event.signature, `sig-${event.id}`)}
                      className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                      title="Copy HMAC Signature"
                    >
                      {copiedId === `sig-${event.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* JSON Payload Display */}
                  <div className="relative group">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1 px-1">
                      <span>PAYLOAD DATA (JSON):</span>
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(event.payload, null, 2), `payload-${event.id}`)}
                        className="text-slate-400 hover:text-slate-200 transition-colors flex items-center space-x-1"
                      >
                        {copiedId === `payload-${event.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="bg-slate-900/90 p-3 rounded-xl text-slate-300 font-mono text-[11px] overflow-x-auto border border-slate-800/80 leading-relaxed">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </div>

                  {/* Delivery History Log Accordion Toggle */}
                  {event.deliveryLogs && event.deliveryLogs.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : event.id)}
                        className="flex items-center space-x-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors focus:outline-none"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'bn'
                            ? `ডেলিভারি হিস্টোরি ও ট্রাই লগ (${event.deliveryLogs.length})`
                            : `View Delivery Attempts History (${event.deliveryLogs.length})`}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-2 font-mono text-xs animate-fadeIn">
                          {event.deliveryLogs.map((log: WebhookDeliveryLog, idx: number) => (
                            <div 
                              key={idx}
                              className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    log.status === 'DELIVERED' 
                                      ? 'bg-emerald-500/20 text-emerald-300' 
                                      : 'bg-rose-500/20 text-rose-300'
                                  }`}>
                                    Attempt #{log.attempt} ({log.statusCode})
                                  </span>
                                  <span className="text-slate-400">
                                    Delay: {log.delaySeconds}s
                                  </span>
                                </div>

                                <span className="text-slate-500 text-[10px]">
                                  {new Date(log.timestamp).toLocaleString()}
                                </span>
                              </div>

                              {log.responseBody && (
                                <div className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800/60 overflow-x-auto">
                                  Response Body: {log.responseBody}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gmail Notification Modal */}
      <GmailNotificationModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        lang={lang}
        defaultSubject={gmailSubject}
        defaultMessage={gmailMessage}
      />
    </div>
  );
};
