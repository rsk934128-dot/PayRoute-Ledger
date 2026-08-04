import React, { useState } from 'react';
import { AnomalyAlert, Transaction } from '../types';
import { 
  Bot, 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  FileSearch, 
  ChevronRight 
} from 'lucide-react';

interface AiAnomalyViewProps {
  lang: 'en' | 'bn';
  anomalyAlerts: AnomalyAlert[];
  transactions: Transaction[];
  onTriggerAiAudit: () => Promise<{ success: boolean; auditReport?: string; error?: string }>;
}

export const AiAnomalyView: React.FC<AiAnomalyViewProps> = ({
  lang,
  anomalyAlerts,
  transactions,
  onTriggerAiAudit,
}) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleAudit = async () => {
    setIsAuditing(true);
    setReportError(null);
    try {
      const res = await onTriggerAiAudit();
      if (res.success && res.auditReport) {
        setAiReport(res.auditReport);
      } else {
        setReportError(res.error || 'Failed to generate AI Audit Report.');
      }
    } catch (e: any) {
      setReportError(e.message || 'AI Service Error');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER & AI AUDIT TRIGGER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20 shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>{lang === 'bn' ? 'জেমিলাই এআই ট্রানজ্যাকশন অ্যানোমালি ও অডিট' : 'Gemini AI Anomaly & Financial Auditor'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Gemini 2.5 Flash
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {lang === 'bn' 
                  ? 'রিয়েল-টাইম ট্রানজ্যাকশন প্যাটার্ন বিশ্লেষণ করে উচ্চমাত্রার মাইক্রো-ট্রান্সফার বা সন্দেহজনক অ্যাক্টিভিটি শনাক্ত করে।' 
                  : 'Analyzes real-time transaction velocities and gateway routes to detect high-value anomalies and fraud patterns.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleAudit}
            disabled={isAuditing}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-purple-600/25 transition-all flex items-center space-x-2 shrink-0 disabled:opacity-50"
          >
            {isAuditing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{lang === 'bn' ? 'এআই অডিট রান হচ্ছে...' : 'Running Gemini AI Audit...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{lang === 'bn' ? 'এআই দিয়ে ট্রানজ্যাকশন অডিট করুন' : 'Run Gemini AI Ledger Audit'}</span>
              </>
            )}
          </button>
        </div>

        {/* AI REPORT DISPLAY BOX */}
        {reportError && (
          <div className="mt-6 p-4 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs">
            {reportError}
          </div>
        )}

        {aiReport && (
          <div className="mt-6 p-6 rounded-xl bg-slate-950 border border-purple-500/30 space-y-4">
            <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>{lang === 'bn' ? 'জেমিলাই এআই অডিট রিপোর্ট' : 'Gemini AI Executive Audit Report'}</span>
            </div>
            <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              {aiReport}
            </div>
          </div>
        )}
      </div>

      {/* ANOMALY ALERTS LIST */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-slate-100 font-bold text-base mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <span>{lang === 'bn' ? 'সন্দেহজনক ট্রানজ্যাকশন অ্যানোমালি অ্যালার্ট' : 'Flagged Anomaly Alerts'}</span>
        </h3>

        {anomalyAlerts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">
              {lang === 'bn' ? 'কোনো অ্যানোমালি ঝুঁকি পাওয়া যায়নি। লেজার সম্পূর্ণ নিরাপদ।' : 'No active anomaly flags. All ledger transfers within normal parameters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalyAlerts.map((alert) => (
              <div 
                key={alert.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      alert.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {alert.severity} Risk ({alert.score}/100)
                    </span>
                    <span className="text-xs font-mono text-slate-400">{alert.transactionId}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-200">
                    {alert.senderName} ➔ {alert.receiverName} (৳{alert.amount.toLocaleString()} {alert.currency})
                  </p>
                  <p className="text-xs text-slate-400">{alert.reason}</p>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-right text-xs shrink-0 max-w-xs">
                  <span className="block text-[10px] font-semibold text-slate-500 uppercase">{lang === 'bn' ? 'পরামর্শ:' : 'Recommendation:'}</span>
                  <span className="text-indigo-300 font-medium">{alert.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
