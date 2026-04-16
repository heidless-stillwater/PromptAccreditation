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
  Globe,
  Zap,
  MessageSquare,
  ShieldAlert,
  BarChart3,
} from 'lucide-react';

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
            style={{
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.3)',
            }}
          >
            <Globe className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight" style={{ color: 'var(--foreground)' }}>
              Accredit<span style={{ color: 'var(--color-primary)' }}>.</span>
            </span>
            <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              Controller v2
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p
          className="text-[9px] font-bold uppercase tracking-widest px-3 py-2"
          style={{ color: 'var(--muted)' }}
        >
          Governance
        </p>
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-nav-item"
              style={
                active
                  ? { background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.15)' }
                  : {}
              }
            >
              <div className="flex items-center gap-3">
                <item.icon
                  size={15}
                  style={{ color: active ? '#60a5fa' : 'var(--secondary)', flexShrink: 0 }}
                />
                <span className="text-[13px]">{item.name}</span>
              </div>
              {active && (
                <ChevronRight size={12} style={{ color: '#60a5fa' }} />
              )}
            </Link>
          );
        })}

        <div className="pt-4 pb-1">
          <p
            className="text-[9px] font-bold uppercase tracking-widest px-3 py-2"
            style={{ color: 'var(--muted)' }}
          >
            System Integrity
          </p>
        </div>

        {adminItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-nav-item"
              style={
                active
                  ? { background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.15)' }
                  : {}
              }
            >
              <div className="flex items-center gap-3">
                <item.icon
                  size={15}
                  style={{ color: active ? '#60a5fa' : 'var(--secondary)', flexShrink: 0 }}
                />
                <span className="text-[13px]">{item.name}</span>
              </div>
              {active && (
                <ChevronRight size={12} style={{ color: '#60a5fa' }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--color-border)' }}>
        {/* Status indicator */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}
        >
          <span className="status-dot status-green" style={{ width: 7, height: 7 }} />
          <span className="text-[11px] font-mono" style={{ color: '#34d399' }}>
            CONTROLLER ACTIVE
          </span>
        </div>

        {/* Tier chip */}
        <div
          className="rounded-xl px-3 py-2"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              Plan
            </span>
            <div className="flex items-center gap-1">
              <Zap size={10} style={{ color: 'var(--color-primary)' }} />
              <span className="text-[10px] font-bold" style={{ color: 'var(--color-primary)' }}>
                COMMUNITY
              </span>
            </div>
          </div>
          <Link
            href="/settings"
            className="text-[11px] font-medium hover:underline"
            style={{ color: 'var(--secondary)' }}
          >
            Upgrade for AI &amp; Active Fix →
          </Link>
        </div>

        {/* Settings */}
        <Link
          href="/settings"
          className="sidebar-nav-item"
          style={pathname === '/settings' ? { color: '#60a5fa' } : {}}
        >
          <div className="flex items-center gap-3">
            <Settings size={15} style={{ color: 'var(--secondary)' }} />
            <span className="text-[13px]">Settings</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
