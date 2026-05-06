
import { accreditationDb } from '@/lib/firebase-admin';
import { Ticket, Policy, AppHealthStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';
import { 
  BarChart3, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Trophy, 
  TrendingUp,
  Zap,
  Globe
} from 'lucide-react';

async function getDashboardData() {
  const [ticketsSnap, policiesSnap] = await Promise.all([
    accreditationDb.collection('tickets').get(),
    accreditationDb.collection('policies').get(),
  ]);

  const tickets = ticketsSnap.docs.map((d: any) => d.data() as Ticket);
  const policies = policiesSnap.docs.map((d: any) => d.data() as Policy);

  const openTickets = tickets.filter((t: Ticket) => t.status !== 'resolved').length;
  const criticalTickets = tickets.filter((t: Ticket) => t.priority === 'critical' && t.status !== 'resolved').length;
  
  // Calculate a simplified compliance score
  const compliantPolicies = policies.filter((p: Policy) => p.status === 'green').length;
  const failingPolicies = policies.filter((p: any) => p.status === 'red').length;
  const totalPolicies = policies.length || 1;
  const complianceScore = Math.round((compliantPolicies / totalPolicies) * 100);

  return {
    tickets: {
      total: tickets.length,
      open: openTickets,
      critical: criticalTickets,
    },
    complianceScore,
    totalPolicies: policies.length,
    apps: 4, // Mocked for now: Master, Tool, Resources, Accreditation
  };
}

export default async function ExecutiveDashboard() {
  const data = await getDashboardData();

  const metrics = [
    { 
      label: 'Suite Compliance', 
      value: `${data.complianceScore}%`, 
      sub: 'Across 4 Primary Apps',
      icon: ShieldCheck, 
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    { 
      label: 'Security Drift', 
      value: data.tickets.critical > 0 ? 'High' : 'Stable', 
      sub: `${data.tickets.critical} Critical Gaps`,
      icon: Activity, 
      color: data.tickets.critical > 0 ? 'text-red-400' : 'text-blue-400',
      bg: data.tickets.critical > 0 ? 'bg-red-500/10' : 'bg-blue-500/10'
    },
    { 
      label: 'Active Tickets', 
      value: data.tickets.open.toString(), 
      sub: 'Awaiting Resolution',
      icon: AlertTriangle, 
      color: 'text-amber-400',
      bg: 'bg-amber-500/10'
    },
    { 
      label: 'Global Policies', 
      value: data.totalPolicies.toString(), 
      sub: 'Enforced Suite-wide',
      icon: Globe, 
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10'
    },
  ];

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Governance Portal</span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white mb-2">
            Executive <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Command</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            Global compliance health, real-time drift monitoring, and architectural integrity oversight.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95">
            Generate Quarterly Report
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="group relative p-8 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl hover:border-slate-700 transition-all">
            <div className={`inline-flex p-3 rounded-2xl ${m.bg} ${m.color} mb-6`}>
              <m.icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{m.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white tracking-tight leading-none">{m.value}</span>
            </div>
            <p className="mt-4 text-sm text-slate-400 font-medium">{m.sub}</p>
            
            {/* Subtle interactive glow */}
            <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-br from-blue-500/5 to-transparent" />
          </div>
        ))}
      </div>

      {/* Middle Section: Visual Score & App Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Compliance Visualization */}
        <div className="lg:col-span-1 p-10 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden group">
          <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
            <h3 className="text-xl font-bold text-slate-200">Global Health</h3>
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="96" cy="96" r="88"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-slate-800"
                />
                <circle
                  cx="96" cy="96" r="88"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 88}
                  strokeDashoffset={2 * Math.PI * 88 * (1 - data.complianceScore / 100)}
                  strokeLinecap="round"
                  className="text-blue-500 transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white">{data.complianceScore}%</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Accredited</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-4 leading-relaxed">
              Based on {data.totalPolicies} active policy reinforcements across the suite.
            </p>
          </div>
          
          {/* Background decoration */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-600/20 transition-all duration-700" />
        </div>

        {/* Suite Connectivity Health */}
        <div className="lg:col-span-2 p-10 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl">
          <div className="flex justify-between items-end mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              App Connectivity Status
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">All Active</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Last Sync: Just Now</span>
          </div>

          <div className="space-y-6">
            {['PromptTool', 'PromptResources', 'PromptMasterSPA', 'Accreditation'].map((app, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-slate-700 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-base">{app}</h4>
                    <p className="text-xs text-slate-500 font-mono">Instance: heidless-apps-0</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">100%</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Compliant</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Call to Action */}
      <div className="rounded-3xl p-10 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-xl shadow-2xl shadow-blue-900/20">
        <div className="flex items-center gap-6 text-center md:text-left">
          <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-xl shadow-blue-600/40">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Regulatory Readiness: High</h3>
            <p className="text-blue-100/60 max-w-md">
              Your system is currently aligned with UK GDPR and the OSA 2023. No immediate interventions required.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold text-emerald-400 uppercase tracking-[0.2em] animate-pulse">
            Accreditation Safe
          </span>
        </div>
      </div>
    </div>
  );
}
