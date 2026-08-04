import React, { useState } from 'react';
import { 
  HardDrive, 
  X, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';

interface DriveExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'bn';
  driveConnected: boolean;
  driveEmail?: string;
  onConnectDrive: () => void;
  onExportToDrive: (title: string, format: 'TXT' | 'CSV' | 'JSON') => Promise<{
    success: boolean;
    webViewLink?: string;
    fileName?: string;
    error?: string;
  }>;
}

export const DriveExportModal: React.FC<DriveExportModalProps> = ({
  isOpen,
  onClose,
  lang,
  driveConnected,
  driveEmail,
  onConnectDrive,
  onExportToDrive,
}) => {
  const [reportTitle, setReportTitle] = useState('PayRoute_Ledger_Statement');
  const [format, setFormat] = useState<'TXT' | 'CSV' | 'JSON'>('TXT');
  const [isExporting, setIsExporting] = useState(false);
  const [exportedResult, setExportedResult] = useState<{
    fileName?: string;
    webViewLink?: string;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setExportedResult(null);

    try {
      const res = await onExportToDrive(reportTitle, format);
      if (res.success) {
        setExportedResult({
          fileName: res.fileName,
          webViewLink: res.webViewLink,
        });
      } else {
        setExportedResult({
          error: res.error || 'Failed to upload report to Google Drive.',
        });
      }
    } catch (err: any) {
      setExportedResult({
        error: err.message || 'Export failed.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-lg">
              {lang === 'bn' ? 'গুগল ড্রাইভে স্টেটমেন্ট এক্সপোর্ট' : 'Export Statement to Google Drive'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'bn' ? 'লেজার ডাটা অটোমেটিক্যালি ড্রাইভে সেভ করুন' : 'Export immutable ledger reports to Google Drive'}
            </p>
          </div>
        </div>

        {!driveConnected ? (
          <div className="text-center py-6 space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <p className="text-xs text-slate-300">
              {lang === 'bn' 
                ? 'গুগল ড্রাইভ কানেক্ট করা হয়নি। এক্সপোর্ট করতে ড্রাইভে সাইন-ইন করুন।' 
                : 'Google Drive is not connected. Connect your Google Account to enable direct exports.'}
            </p>
            <button
              onClick={onConnectDrive}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-blue-600/25"
            >
              {lang === 'bn' ? 'গুগল অ্যাকাউন্ট কানেক্ট করুন' : 'Connect Google Drive Account'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleExport} className="space-y-4">
            <div className="bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-300">
              <span className="font-medium truncate">{driveEmail}</span>
              <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">Connected</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'bn' ? 'ফাইল/স্টেটমেন্ট টাইটেল:' : 'Statement Title:'}
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {lang === 'bn' ? 'এক্সপোর্ট ফরম্যাট নির্বাচন করুন:' : 'Select Export Format:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('TXT')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all ${
                    format === 'TXT'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>Text Audit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('CSV')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all ${
                    format === 'CSV'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <span>CSV Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('JSON')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center space-y-1 transition-all ${
                    format === 'JSON'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <FileCode className="w-5 h-5 text-emerald-400" />
                  <span>JSON Audit</span>
                </button>
              </div>
            </div>

            {exportedResult?.error && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{exportedResult.error}</span>
              </div>
            )}

            {exportedResult?.webViewLink && (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'bn' ? 'ফাইল ড্রাইভে সেভ হয়েছে!' : 'Statement Exported to Drive!'}</span>
                </div>
                <p className="text-[11px] text-emerald-200/80">
                  {exportedResult.fileName}
                </p>
                <a
                  href={exportedResult.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors mt-1"
                >
                  <span>{lang === 'bn' ? 'গুগল ড্রাইভে ফাইলটি দেখুন' : 'Open in Google Drive'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={isExporting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{lang === 'bn' ? 'ড্রাইভে আপলোড হচ্ছে...' : 'Uploading to Google Drive...'}</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'ড্রাইভে সেভ করুন' : 'Export & Save to Drive'}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
