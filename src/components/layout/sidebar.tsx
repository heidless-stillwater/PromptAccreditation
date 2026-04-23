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
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(20px)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-primary)' }}
          >
            <ShieldCheck className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">PromptAccreditation</h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-tighter">SOVEREIGN GOVERNANCE</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-500/10 text-blue-400' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'} />
              <span className="text-sm font-medium">{item.name}</span>
              {isActive && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}

        {/* Admin Section */}
        <div className="pt-4 pb-2">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Governance</p>
          {adminItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-500/10 text-blue-400' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'} />
                <span className="text-sm font-medium">{item.name}</span>
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer / User / Plan Section */}
      <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-400">
              {(user?.email?.[0] || 'U').toUpperCase()}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-white truncate">{user?.email || 'Guest'}</span>
            <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">
              CONTROLLER ACTIVE
            </span>
          </div>
        </div>

        {/* Tier chip */}
        <div
          className="rounded-xl px-3 py-2"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Plan
            </span>
            <div className="flex items-center gap-1">
              <Zap size={10} className="text-blue-500" />
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">
                {currentPlan}
              </span>
            </div>
          </div>
          {tier === 'free' && (
            <Link
              href="/settings"
              className="text-[11px] font-medium text-blue-400 hover:underline"
            >
              Upgrade for AI &amp; Active Fix →
            </Link>
          )}
          {tier !== 'free' && (
            <div className="text-[10px] text-slate-500 font-medium italic">
              Sovereign Access Enabled
            </div>
          )}
        </div>

        {/* Settings */}
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
        >
          <Settings size={18} />
          <span className="text-sm font-medium">Settings</span>
        </Link>
      </div>
    </aside>
  );
}
