import { accreditationDb } from '@/lib/firebase-admin';
import { AuditLogEntry } from '@/lib/types';
import { format } from 'date-fns';
import { Search, ShieldAlert, FileText, User, Tag, Clock } from 'lucide-react';

async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const snap = await accreditationDb
    .collection('audit_log')
    .orderBy('timestamp', 'desc')
    .limit(100)
    .get();

  return snap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
    } as AuditLogEntry;
  });
}

export default async function AuditPage() {
  const logs = await getAuditLogs();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Audit Trail Explorer
          </h1>
          <p className="text-slate-400 mt-2">
            Immutable system activity and compliance tracking for the Prompt Suite.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2 flex items-center gap-2 backdrop-blur-sm">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-300">Hub Health: Optimal</span>
          </div>
        </div>
      </div>

      {/* Advanced Filter Bar (Placeholder for future client logic) */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Filter logs by actor, action, or target ID..."
          className="w-full bg-slate-900/40 border border-slate-800 rounded-xl py-4 pl-12 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all backdrop-blur-md"
        />
      </div>

      {/* Audit Log Table */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/50 bg-slate-800/30">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actor</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Target</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {logs.map((log) => (
                <tr key={log.id} className="group hover:bg-white/5 transition-colors cursor-pointer">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        log.action.includes('error') ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-slate-200 group-hover:text-blue-300 transition-colors">
                        {log.action}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-300">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-mono truncate max-w-[150px]">{log.actor}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-tight bg-indigo-500/10 text-indigo-300">
                        {log.targetType}
                      </span>
                      <span className="text-xs text-slate-500 font-mono truncate max-w-[100px]">
                        {log.targetId}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-sm">{format(log.timestamp as Date, 'MMM d, HH:mm:ss')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-[10px] text-slate-600 font-mono select-all">
                      {log.id.slice(0, 8)}...
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <div className="inline-flex p-4 rounded-full bg-slate-800/50 text-slate-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <p className="text-slate-400">No audit events recorded in the current window.</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Events</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{logs.length}</span>
            <span className="text-emerald-400 text-sm font-medium">Synced</span>
          </div>
        </div>
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Actors</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {new Set(logs.map(l => l.actor)).size}
            </span>
            <span className="text-slate-500 text-sm font-medium font-mono">Verified IPs</span>
          </div>
        </div>
        <div className="p-6 rounded-2xl border border-slate-800 bg-blue-500/5">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Retention Period</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">90d</span>
            <span className="text-slate-500 text-sm font-medium">Standard Fix</span>
          </div>
        </div>
      </div>
    </div>
  );
}
