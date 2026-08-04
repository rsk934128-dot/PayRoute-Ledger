import React, { useState } from 'react';
import { QueueTask, Transaction } from '../types';
import { 
  Layers, 
  Play, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Clock, 
  AlertOctagon, 
  Cpu, 
  BarChart3 
} from 'lucide-react';

interface AsyncQueueViewProps {
  lang: 'en' | 'bn';
  queueTasks: QueueTask[];
  recentTransactions: Transaction[];
  onTriggerBatchSimulate: (count: number) => Promise<void>;
}

export const AsyncQueueView: React.FC<AsyncQueueViewProps> = ({
  lang,
  queueTasks,
  recentTransactions,
  onTriggerBatchSimulate,
}) => {
  const [batchSize, setBatchSize] = useState<number>(15);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  const handleSimulate = async () => {
    setIsProcessingBatch(true);
    try {
      await onTriggerBatchSimulate(batchSize);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const completedCount = queueTasks.filter((t) => t.status === 'COMPLETED').length;
  const failedCount = queueTasks.filter((t) => t.status === 'FAILED').length;
  const processingCount = queueTasks.filter((t) => t.status === 'PROCESSING').length;

  return (
    <div className="space-y-8">
      {/* SECTION HEADER & BATCH TRIGGER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <span>{lang === 'bn' ? 'অ্যাসিঙ্ক্রোনাস কিউ ও ওয়ার্কার প্রসেসিং' : 'Async Transaction Queue & Worker Engine'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {lang === 'bn' 
                ? 'একসাথে হাজার হাজার পে-রোল বা মার্চেন্ট পে-আউট আসলে সার্ভার ক্র্যাশ এড়াতে BullMQ/Redis কিউ স্টাইলে সিকোয়েন্সিয়ালি ব্যাকগ্রাউন্ডে প্রসেস করা হয়।' 
                : 'High-throughput transactions queued asynchronously in sequences to prevent race conditions and system backpressure.'}
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                {lang === 'bn' ? 'ব্যাচ ট্রান্সফার সংখ্যা:' : 'Batch Transfer Size:'}
              </label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="bg-slate-900 text-slate-200 text-xs border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value={10}>10 Transfers</option>
                <option value={25}>25 Transfers</option>
                <option value={50}>50 Transfers (High Load)</option>
              </select>
            </div>

            <button
              onClick={handleSimulate}
              disabled={isProcessingBatch}
              className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {isProcessingBatch ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>{lang === 'bn' ? 'প্রসেসিং হচ্ছে...' : 'Worker Processing...'}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-white" />
                  <span>{lang === 'bn' ? 'অটো পে-রোল রান করুন' : 'Run Automated Payroll Batch'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* WORKER COUNTERS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
            <span className="text-slate-400 text-xs block">{lang === 'bn' ? 'মোট প্রসেসড:' : 'Total Processed:'}</span>
            <span className="text-xl font-bold text-slate-100 font-mono">{queueTasks.length}</span>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-3 border border-emerald-500/20">
            <span className="text-emerald-400 text-xs block">{lang === 'bn' ? 'সফল (Success):' : 'Completed:'}</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">{completedCount}</span>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-3 border border-blue-500/20">
            <span className="text-blue-400 text-xs block">{lang === 'bn' ? 'ইন-প্রসেস:' : 'Processing:'}</span>
            <span className="text-xl font-bold text-blue-400 font-mono">{processingCount}</span>
          </div>
          <div className="bg-slate-950/60 rounded-xl p-3 border border-rose-500/20">
            <span className="text-rose-400 text-xs block">{lang === 'bn' ? 'ব্যর্থ / DLQ:' : 'Failed / DLQ:'}</span>
            <span className="text-xl font-bold text-rose-400 font-mono">{failedCount}</span>
          </div>
        </div>
      </div>

      {/* QUEUE LOG & TASKS TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-slate-100 font-bold text-base mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>{lang === 'bn' ? 'লাইভ কিউ জব ও ওয়ার্কার ইভেন্ট লগ' : 'Live Worker Jobs & Queue Logs'}</span>
        </h3>

        {queueTasks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
            <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-xs">
              {lang === 'bn' 
                ? 'এখনো কোনো কিউ জব চালু করা হয়নি। ওপরের "অটো পে-রোল রান করুন" বাটনে ক্লিক করে ব্যাচ সিমুলেট করুন।' 
                : 'No queued worker tasks yet. Click "Run Automated Payroll Batch" above to start async execution.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="p-3">Task ID</th>
                  <th className="p-3">Transaction ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Attempts</th>
                  <th className="p-3">Queued At</th>
                  <th className="p-3">Processed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {queueTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-300">{task.id}</td>
                    <td className="p-3 text-slate-400">{task.transactionId}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        task.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300' :
                        task.status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-rose-500/20 text-rose-300'
                      }`}>
                        {task.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />}
                        {task.status === 'PROCESSING' && <RefreshCw className="w-3 h-3 mr-1 text-blue-400 animate-spin" />}
                        {task.status === 'FAILED' && <XCircle className="w-3 h-3 mr-1 text-rose-400" />}
                        {task.status}
                      </span>
                    </td>
                    <td className="p-3 text-center text-slate-400">{task.attempts}/{task.maxAttempts}</td>
                    <td className="p-3 text-slate-400 text-[11px]">{new Date(task.createdAt).toLocaleTimeString()}</td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {task.processedAt ? new Date(task.processedAt).toLocaleTimeString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
