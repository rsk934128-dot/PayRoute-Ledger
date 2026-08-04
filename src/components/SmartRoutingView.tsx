import React from 'react';
import { PaymentRail } from '../types';
import { 
  Zap, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Layers, 
  Server, 
  Sliders 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Cell 
} from 'recharts';

interface SmartRoutingViewProps {
  lang: 'en' | 'bn';
  rails: PaymentRail[];
  onUpdateRailStatus: (railId: string, status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE', latencyMs?: number) => void;
}

export const SmartRoutingView: React.FC<SmartRoutingViewProps> = ({
  lang,
  rails,
  onUpdateRailStatus,
}) => {
  const chartData = rails.map((r) => ({
    name: r.id === 'INTERNAL' ? 'Internal' : r.id === 'BRAC_BANK' ? 'BRAC' : r.id,
    latency: r.latencyMs,
    success: r.successRate,
    status: r.status,
  }));

  return (
    <div className="space-y-8">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>{lang === 'bn' ? 'স্মার্ট পেমেন্ট রাউটিং ও গেটওয়ে ইঞ্জিন' : 'Smart Payment Routing & Failover Engine'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'bn' 
              ? 'একটি পেমেন্ট চ্যানলে স্লো বা ডাউন হলে সিস্টেম স্বয়ংক্রিয়ভাবে বিকল্প অল্টারনেটিভ রেইলে ট্রানজ্যাকশন শিফট করে।' 
              : 'Dynamic smart routing automatically diverts traffic to healthy fallback rails during gateway latency spikes or outages.'}
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-slate-300 font-medium">
            {lang === 'bn' ? 'স্মার্ট রাউটিং সক্রিয়' : 'Health Monitoring Active'}
          </span>
        </div>
      </div>

      {/* GATEWAYS CARDS WITH SIMULATION CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {rails.map((rail) => (
          <div 
            key={rail.id}
            className={`bg-slate-900/90 border rounded-2xl p-5 shadow-xl relative overflow-hidden transition-all ${
              rail.status === 'OUTAGE'
                ? 'border-rose-500/40 bg-rose-950/10'
                : rail.status === 'DEGRADED'
                ? 'border-amber-500/40 bg-amber-950/10'
                : 'border-slate-800'
            }`}
          >
            {/* Top Status Badge */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-200 text-sm">{rail.name}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                rail.status === 'OPERATIONAL'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : rail.status === 'DEGRADED'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {rail.status === 'OPERATIONAL' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                {rail.status === 'DEGRADED' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                {rail.status === 'OUTAGE' && <XCircle className="w-3 h-3 text-rose-400" />}
                {rail.status}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">{rail.type}</p>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 rounded-xl p-3 mb-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">{lang === 'bn' ? 'সফলতার হার:' : 'Success Rate:'}</span>
                <span className="font-bold text-slate-200 font-mono">{rail.successRate}%</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">{lang === 'bn' ? 'রেসপন্স লেটেন্সি:' : 'Response Latency:'}</span>
                <span className={`font-bold font-mono ${rail.latencyMs > 300 ? 'text-amber-400' : 'text-slate-200'}`}>
                  {rail.latencyMs} ms
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">{lang === 'bn' ? 'ফি হারের হিসাব:' : 'Fee Schedule:'}</span>
                <span className="font-medium text-slate-300">{rail.feePercentage}% + ৳{rail.flatFee}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">{lang === 'bn' ? 'ব্যাকআপ অল্টারনেটিভ:' : 'Failover Rail:'}</span>
                <span className="font-semibold text-blue-400">{rail.backupRail || 'N/A'}</span>
              </div>
            </div>

            {/* FAILOVER SIMULATION BUTTONS */}
            <div className="pt-2 border-t border-slate-800">
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-indigo-400" />
                {lang === 'bn' ? 'স্মার্ট ফেলওভার সিমুলেশন কন্টাক্ট' : 'Simulate Gateway Outage / Failover'}
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => onUpdateRailStatus(rail.id, 'OPERATIONAL', 120)}
                  className={`flex-1 py-1 rounded text-[10px] font-medium border transition-colors ${
                    rail.status === 'OPERATIONAL'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Operational
                </button>
                <button
                  onClick={() => onUpdateRailStatus(rail.id, 'DEGRADED', 450)}
                  className={`flex-1 py-1 rounded text-[10px] font-medium border transition-colors ${
                    rail.status === 'DEGRADED'
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Degraded
                </button>
                <button
                  onClick={() => onUpdateRailStatus(rail.id, 'OUTAGE', 999)}
                  className={`flex-1 py-1 rounded text-[10px] font-medium border transition-colors ${
                    rail.status === 'OUTAGE'
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  Outage
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* RECHARTS VISUALIZATION OF RAIL LATENCY */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-slate-100 font-bold text-base mb-1 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          <span>{lang === 'bn' ? 'পেমেন্ট চ্যানল লেটেন্সি ও পারফরম্যান্স মেট্রিক্স' : 'Payment Rail Latency & Performance Comparison'}</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          {lang === 'bn' 
            ? '৪০০ms এর বেশি লেটেন্সি বা আউটজ পরিলক্ষিত হলে স্মার্ট রাউটিং ইঞ্জিন সাথে সাথে বিকল্প চ্যানলে ট্রানজ্যাকশন রি-রুট করে।' 
            : 'Smart routing engine triggers dynamic failover when gateway latency exceeds 400ms threshold.'}
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} unit="ms" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                formatter={(val: any) => [`${val} ms`, 'Response Latency']}
              />
              <Bar dataKey="latency" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.status === 'OUTAGE' ? '#f43f5e' :
                      entry.latency > 300 ? '#f59e0b' :
                      '#3b82f6'
                    } 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
