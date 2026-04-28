'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShieldCheck,
  TicketCheck,
  Activity,
  BookOpen,
  Settings,
  ChevronRight,
  Zap,
  MessageSquare,
  ShieldAlert,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

const navItems = [
  { name: 'Command Centre', href: '/',           icon: LayoutDashboard },
  { name: 'Policy Hub',     href: '/policies',   icon: ShieldCheck },
  { name: 'Resolution',     href: '/tickets',    icon: TicketCheck },
  { name: 'Monitoring',     href: '/monitoring', icon: Activity },
  { name: 'Knowledge Base', href: '/knowledge',  icon: BookOpen },
  { name: 'Policy AI',      href: '/knowledge/chat', icon: MessageSquare },
];

const adminItems = [
  { name: 'Executive Command', href: '/admin/dashboard', icon: BarChart3 },
  { name: 'Audit Trail',      href: '/admin/audit',     icon: ShieldAlert },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Resolve tier and label
  const tier = (user as any)?.tier || 'free';
  const tierLabels: Record<string, string> = {
    free: 'Community',
    professional: 'Pro',
    pro: 'Pro',
    enterprise: 'Pro'
  };
  const currentPlan = tierLabels[tier] || 'Community';

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col h-full border-r"
      style={{
        background: 'var(--glass-overlay)',
        backdropFilter: 'blur(var(--glass-blur-lg))',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20"
            style={{ background: 'var(--gradient-accent)' }}
          >
            <ShieldCheck className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white font-outfit">PromptAccreditation</h1>
            <p className="text-[10px] text-teal-500/80 font-mono tracking-tighter font-bold uppercase">Sovereign Governance</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-white transition-colors'} />
              <span className="text-sm font-semibold">{item.name}</span>
              {isActive && <div className="ml-auto w-1 h-4 bg-teal-500 rounded-full" />}
            </Link>
          );
        })}

        {/* Admin Section */}
        <div className="pt-6 pb-2">
          <p className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Governance</p>
          {adminItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-white transition-colors'} />
                <span className="text-sm font-semibold">{item.name}</span>
                {isActive && <div className="ml-auto w-1 h-4 bg-teal-500 rounded-full" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer / User / Plan Section */}
      <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 px-3">
          <div className="w-9 h-9 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center p-0.5">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center">
              <span className="text-[11px] font-black text-white">
                {(user?.email?.[0] || 'U').toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white truncate">{user?.email || 'Guest User'}</span>
            <span className="text-[9px] text-teal-500 font-mono font-black tracking-widest uppercase">
              Controller Active
            </span>
          </div>
        </div>

        {/* Tier chip */}
        <div
          className="rounded-xl px-4 py-3 bg-teal-500/5 border border-teal-500/10"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Access Tier
            </span>
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
              <Zap size={10} className="text-teal-400 fill-teal-400" />
              <span className="text-[10px] font-black text-teal-400 uppercase tracking-tighter">
                {currentPlan}
              </span>
            </div>
          </div>
          {tier === 'free' && (
            <Link
              href="/settings"
              className="text-[11px] font-bold text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1"
            >
              Upgrade Suite <ChevronRight size={10} />
            </Link>
          )}
          {tier !== 'free' && (
            <div className="text-[10px] text-teal-500/60 font-bold italic">
              Sovereign Analytics Enabled
            </div>
          )}
        </div>

        {/* Settings */}
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
            pathname === '/settings' ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings size={18} />
          <span className="text-sm font-semibold">Settings</span>
        </Link>
      </div>
    </aside>
  );
}

