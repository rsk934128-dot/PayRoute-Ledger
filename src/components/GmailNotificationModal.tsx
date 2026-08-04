import React, { useState, useEffect } from 'react';
import { GmailNotificationLog } from '../types';
import { 
  Mail, 
  X, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  RefreshCw, 
  Sparkles,
  Terminal,
  ExternalLink,
  Zap
} from 'lucide-react';

interface GmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'bn';
  defaultRecipientEmail?: string;
  defaultSubject?: string;
  defaultMessage?: string;
}

export const GmailNotificationModal: React.FC<GmailNotificationModalProps> = ({
  isOpen,
  onClose,
  lang,
  defaultRecipientEmail = 'khokumoni30@gmail.com',
  defaultSubject = '⚡ PayRoute Financial Security Alert',
  defaultMessage = 'Important notification regarding your transaction ledger state and gateway routing.',
}) => {
  const [recipient, setRecipient] = useState(defaultRecipientEmail);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [notificationType, setNotificationType] = useState<'TRANSACTION_ALERT' | 'WEBHOOK_FAILURE' | 'SYSTEM_AUDIT' | 'CUSTOM'>('TRANSACTION_ALERT');
  
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState<GmailNotificationLog[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/gmail/logs');
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch Gmail logs:', err);
    }
  };

  const applyPreset = (type: 'TRANSACTION_ALERT' | 'WEBHOOK_FAILURE' | 'SYSTEM_AUDIT' | 'CUSTOM') => {
    setNotificationType(type);
    if (type === 'TRANSACTION_ALERT') {
      setSubject(lang === 'bn' ? '⚠️ পে-রুট সিকিউরিটি অ্যালার্ট: বড় অংকের লেনদেন সম্পন্ন' : '⚠️ PayRoute Security Alert: High-Value Transaction Processed');
      setMessage(
        lang === 'bn'
          ? 'আপনার অ্যাকাউন্টে ৳৪৫,০০০.০০ বিডিটি লেনদেন সম্পন্ন হয়েছে। লেনদেন আইডি: TXN-908122-881। এসিআইডি (ACID) ট্রানজ্যাকশন কনসিস্টেন্সি ভ্যালিডেটেড।'
          : 'High-value transaction of ৳45,000.00 BDT processed successfully. Transaction ID: TXN-908122-881. Ledger state updated with double-entry ACID integrity.'
      );
    } else if (type === 'WEBHOOK_FAILURE') {
      setSubject(lang === 'bn' ? '🚨 ওয়েবহুক ডিসপ্যাচ অ্যালার্ট: মার্চেন্ট ব্যাকএন্ড ৫০৪ এরর' : '🚨 Webhook Dispatch Failure: Merchant API Gateway Timeout 504');
      setMessage(
        lang === 'bn'
          ? 'মার্চেন্ট ওয়েবহুক অ্যান্ডপয়েন্ট (https://api.daraz.com.bd/v1/payroute/webhook) রেসপন্স করতে ব্যর্থ হয়েছে (HTTP 504)। অটোমেটেড এক্সপোনেনশিয়াল ব্যাকঅফ ডিলে ৮ সেকেন্ডে সেট করা হয়েছে।'
          : 'Merchant webhook endpoint (https://api.daraz.com.bd/v1/payroute/webhook) timed out. Exponential backoff retry scheduled in 8 seconds (Attempt #2/5).'
      );
    } else if (type === 'SYSTEM_AUDIT') {
      setSubject(lang === 'bn' ? '📊 পে-রুট জেমিনি এআই কমপ্লায়েন্স ও ফিনান্সিয়াল অডিট রিপোর্ট' : '📊 PayRoute Gemini AI Compliance & Ledger Financial Audit');
      setMessage(
        lang === 'bn'
          ? 'জেমিনি এআই অডিট ইঞ্জিনের তথ্য অনুযায়ী সকল ওয়ালেট ব্যালেন্স এবং লেজার ট্রানজ্যাকশন সম্পূর্ণ কনসিস্টেন্ট। কোনো সিকিউরিটি অ্যানোমালি পাওয়া যায়নি।'
          : 'Gemini AI Ledger Auditor verified 100% ACID consistency across 4 multi-currency wallets and payment rails. No zero-day fraud anomalies detected.'
      );
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !subject.trim() || !message.trim()) return;

    setIsSending(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient.trim(),
          subject: subject.trim(),
          body: message.trim(),
          notificationType,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMessage({
          text: lang === 'bn' 
            ? `জিমেলেই নোটিফিকেশন ইমেইল সফলভাবে পাঠানো হয়েছে (${recipient})!` 
            : `Gmail notification email delivered to ${recipient} successfully!`,
          type: 'success',
        });
        fetchLogs();
      } else {
        setStatusMessage({
          text: data.error || 'Failed to send Gmail notification email',
          type: 'error',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Error communicating with Gmail API',
        type: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-rose-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100">
                  {lang === 'bn' ? 'জিমেইল নোটিফিকেশন ডিসপ্যাচার' : 'Gmail Notification Dispatcher'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-red-400" />
                  <span>Gmail API</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lang === 'bn'
                  ? 'গুগল ওয়ার্কস্পেস জিমেলেই সার্ভিস ব্যবহার করে ইমেইল নোটিফিকেশন পাঠান।'
                  : 'Dispatch financial security and transaction notifications using Google Gmail API.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Status Message */}
          {statusMessage && (
            <div className={`p-4 rounded-xl border flex items-center space-x-3 text-xs font-semibold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'bn' ? 'দ্রুত প্রিসেট নোটিফিকেশন নির্বাচন:' : 'Quick Notification Presets:'}</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('TRANSACTION_ALERT')}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                  notificationType === 'TRANSACTION_ALERT'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 font-bold shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <div className="font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{lang === 'bn' ? 'লেনদেন সিকিউরিটি' : 'Transaction Alert'}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{lang === 'bn' ? '৳৪৫,০০০ বিডিটি অ্যালার্ট' : '৳45,000 Payment Alert'}</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('WEBHOOK_FAILURE')}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                  notificationType === 'WEBHOOK_FAILURE'
                    ? 'bg-rose-600/30 border-rose-500 text-rose-200 font-bold shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <div className="font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{lang === 'bn' ? 'ওয়েবহুক এরর' : 'Webhook Failure'}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{lang === 'bn' ? '৫০৪ গেটওয়ে টাইমআউট' : 'HTTP 504 Retry Alert'}</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('SYSTEM_AUDIT')}
                className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                  notificationType === 'SYSTEM_AUDIT'
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 font-bold shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <div className="font-bold flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'bn' ? 'এআই অডিট রিপোর্ট' : 'Gemini AI Audit'}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{lang === 'bn' ? 'এসিআইডি অডিট সামারি' : 'ACID Consistency Status'}</div>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {lang === 'bn' ? 'প্রাপকের জিমেইল এড্রেস (Recipient Email):' : 'Recipient Email Address:'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. user@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {lang === 'bn' ? 'বিষয় (Email Subject):' : 'Email Subject Line:'}
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {lang === 'bn' ? 'বার্তা (Notification Body):' : 'Notification Content Body:'}
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write message details..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
              />
            </div>

            {/* Live HTML Email Preview Card */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800/80 pb-2">
                <span>{lang === 'bn' ? 'ইমেইল ডিসপ্যাচ লাইভ প্রিভিউ' : 'Live Gmail Template Preview'}</span>
                <span className="text-indigo-400 font-mono text-[10px]">Gmail API v1 (HTML)</span>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-indigo-300">⚡ PayRoute Financial Engine</div>
                <div className="text-xs font-semibold text-slate-200">{subject || 'No Subject'}</div>
                <p className="text-[11px] text-slate-400 line-clamp-3 whitespace-pre-wrap mt-1">{message || 'No Message'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSending || !recipient.trim()}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-900/30 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    <span>{lang === 'bn' ? 'জিমেইলে পাঠাচ্ছ...' : 'Sending via Gmail...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'জিমেইলে নোটিফিকেশন পাঠান' : 'Dispatch Gmail Notification'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Session Email History Logs */}
          {logs.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>{lang === 'bn' ? 'সম্প্রতি প্রেরিত ইমেইল লগ' : 'Recent Gmail Dispatch Logs'}</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{logs.length} logged</span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono"
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${log.status === 'SENT' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span className="font-bold text-slate-200 truncate">{log.subject}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        To: {log.recipientEmail} • ID: {log.messageId || log.id}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {new Date(log.sentAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
