import React, { useState, useEffect } from 'react';
import { SMSNotificationLog } from '../types';
import { 
  MessageSquare, 
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
  Zap,
  Phone
} from 'lucide-react';

interface SMSNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'bn';
  defaultRecipientPhone?: string;
  defaultMessage?: string;
}

export const SMSNotificationModal: React.FC<SMSNotificationModalProps> = ({
  isOpen,
  onClose,
  lang,
  defaultRecipientPhone = '+8801700000000',
  defaultMessage = '⚡ PayRoute Security: A transaction of ৳45,000.00 was processed. Txn ID: TXN-908122. If not you, contact support.',
}) => {
  const [recipient, setRecipient] = useState(defaultRecipientPhone);
  const [message, setMessage] = useState(defaultMessage);
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState<SMSNotificationLog[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/sms/logs');
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch SMS logs:', err);
    }
  };

  const applyPreset = (type: 'OTP' | 'TX_ALERT' | 'SYSTEM') => {
    if (type === 'OTP') {
      setMessage(
        lang === 'bn'
          ? 'পে-রুট ভেরিফিকেশন কোড: ৭৭১২০৯। এই কোডটি ৫ মিনিটের জন্য কার্যকর। কারো সাথে শেয়ার করবেন না।'
          : 'PayRoute Verification Code: 771209. Valid for 5 minutes. Do not share this code with anyone.'
      );
    } else if (type === 'TX_ALERT') {
      setMessage(
        lang === 'bn'
          ? '⚠️ পে-রুট অ্যালার্ট: আপনার ওয়ালেট থেকে ৳১২,৫০০.০০ ডেবিট হয়েছে। মার্চেন্ট: Daraz. ব্যালেন্স: ৳৪৫,২০০.০০।'
          : '⚠️ PayRoute Alert: ৳12,500.00 debited from your wallet. Merchant: Daraz. Current Balance: ৳45,200.00.'
      );
    } else if (type === 'SYSTEM') {
      setMessage(
        lang === 'bn'
          ? '🚨 সিস্টেম অ্যালার্ট: পে-রুট গেটওয়ে ২ (বিকাশ) সাময়িকভাবে ডাউন। সকল পেমেন্ট গেটওয়ে ১ (নগদ) এ রি-রাউট করা হয়েছে।'
          : '🚨 System Alert: PayRoute Gateway 2 (bKash) is temporarily down. All payments rerouted to Gateway 1 (Nagad).'
      );
    }
  };

  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !message.trim()) return;

    setIsSending(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipient, message }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatusMessage({
          text: lang === 'bn' ? 'এসএমএস সফলভাবে পাঠানো হয়েছে!' : 'SMS sent successfully!',
          type: 'success',
        });
        fetchLogs();
      } else {
        throw new Error(data.details || data.error || 'Failed to send SMS');
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message,
        type: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-bottom border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
                {lang === 'bn' ? 'এসএমএস গেটওয়ে ডিসপ্যাচার' : 'SMS Gateway Dispatcher'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">Twilio API Integration • Production Mode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {/* Main Form */}
          <form onSubmit={handleSendSMS} className="space-y-6 bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'bn' ? 'প্রাপকের ফোন নম্বর' : 'Recipient Phone Number'}</span>
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="+88017XXXXXXXX"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'bn' ? 'বার্তার বিষয়বস্তু' : 'Message Content'}</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
                />
                <div className="flex justify-end">
                  <span className={`text-[10px] font-mono ${message.length > 160 ? 'text-amber-400' : 'text-slate-500'}`}>
                    Characters: {message.length} | Segments: {Math.ceil(message.length / 160)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'bn' ? 'কুইক প্রিসেট' : 'Quick Presets'}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('OTP')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-300 transition-colors border border-slate-700"
                >
                  Verification OTP
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('TX_ALERT')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-300 transition-colors border border-slate-700"
                >
                  Transaction Alert
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('SYSTEM')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-300 transition-colors border border-slate-700"
                >
                  System Failover
                </button>
              </div>
            </div>

            {statusMessage && (
              <div className={`p-4 rounded-xl flex items-start gap-3 border ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                <p className="text-xs font-medium leading-relaxed">{statusMessage.text}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSending}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                isSending 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 active:scale-[0.98]'
              }`}
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {lang === 'bn' ? 'পাঠানো হচ্ছে...' : 'Dispatching SMS...'}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {lang === 'bn' ? 'এসএমএস পাঠান' : 'Send SMS Now'}
                </>
              )}
            </button>
          </form>

          {/* Logs Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {lang === 'bn' ? 'এসএমএস ডিসপ্যাচ লগ' : 'SMS Dispatch Logs'}
              </h3>
              <button 
                onClick={fetchLogs}
                className="text-[10px] font-bold text-emerald-400 hover:underline"
              >
                {lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
              </button>
            </div>

            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                  <p className="text-xs text-slate-500">
                    {lang === 'bn' ? 'কোনো লগ পাওয়া যায়নি' : 'No SMS logs available yet.'}
                  </p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex items-start justify-between group hover:border-slate-700 transition-all">
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        log.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {log.status === 'SENT' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{log.recipientPhone}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                            log.status === 'SENT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 italic">"{log.message}"</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] text-slate-500 font-mono">{new Date(log.sentAt).toLocaleString()}</span>
                          {log.sid && (
                            <span className="text-[9px] text-slate-600 font-mono">SID: {log.sid.slice(0, 12)}...</span>
                          )}
                        </div>
                        {log.error && (
                          <p className="text-[9px] text-rose-400 font-medium">Error: {log.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[10px] text-slate-500 font-medium">
            {lang === 'bn' 
              ? 'নিরাপদ গেটওয়ে: সকল বার্তা এন্ড-টু-এন্ড এনক্রিপ্টেড এবং আর্কিভ করা হয়।' 
              : 'Secure Gateway: All messages are end-to-end encrypted and archived for compliance.'}
          </span>
        </div>
      </div>
    </div>
  );
};
