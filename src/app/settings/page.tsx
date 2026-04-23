export const dynamic = 'force-dynamic';
import { Settings, Shield, CreditCard, User, Bell, LogOut, ChevronRight, Zap } from 'lucide-react';
import { getSessionUser } from '@/lib/auth';
import { EntitlementService } from '@/lib/services/entitlements';
import { UpgradeButton } from '@/components/shared/upgrade-button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your accreditation tier and account preferences.',
};

export default async function SettingsPage() {
  const user = await getSessionUser();
  const userData = user ? await EntitlementService.getUserData(user.uid) : null;
  const tier = userData?.tier || 'free';

  return (
    <main className="p-8 max-w-4xl mx-auto animate-fade-in">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Settings size={22} style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-3xl font-bold">Control Room Settings</h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--secondary)' }}>
          Manage your organizational compliance profile and subscription tier.
        </p>
      </header>

      <div className="space-y-6">
        {/* Tier Section */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Shield className="text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Subscription Plan</h2>
                <p className="text-xs text-slate-500">Currently on the <span className="text-amber-400 font-bold uppercase">{tier}</span> tier.</p>
              </div>
            </div>
            <div className="flex gap-2">
              {tier === 'free' && (
                <UpgradeButton 
                  priceId="price_professional" 
                  label="Upgrade to Pro" 
                  className="btn-primary text-[10px] flex items-center gap-2"
                />
              )}
              {tier !== 'enterprise' && (
                <UpgradeButton 
                  priceId="price_enterprise" 
                  label="Upgrade to Enterprise" 
                  className="btn-primary text-[10px] flex items-center gap-2"
                  style={{ background: 'var(--color-warning)' }}
                />
              )}
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/[0.01]">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Auto-Remediation</p>
              <p className="text-xs font-bold">{tier === 'enterprise' ? 'Active' : 'Locked'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">AI Policy Chat</p>
              <p className="text-xs font-bold">Unlimited</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Multi-DB Probes</p>
              <p className="text-xs font-bold">{tier === 'free' ? '3 / App' : 'Unlimited'}</p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <User size={30} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.displayName || 'Administrator'}</h2>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-1">
            <button className="sidebar-nav-item w-full group">
              <span className="flex items-center gap-3">
                <Bell size={18} />
                Notification Preferences
              </span>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button className="sidebar-nav-item w-full group">
              <span className="flex items-center gap-3">
                <CreditCard size={18} />
                Billing History
              </span>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <div className="pt-4 mt-4 border-t border-white/5">
              <button className="flex items-center gap-3 p-3 text-red-400 hover:text-red-300 text-sm font-bold transition-colors w-full">
                <LogOut size={18} />
                Sign Out / Disconnect Engine
              </button>
            </div>
          </div>
        </div>

        {/* Technical Data */}
        <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Zap size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-400">Compliance Engine Status</p>
              <p className="text-xs text-blue-500/60 font-mono tracking-tight">V2.0.0-PROD // DISTRIBUTED_REPLICATION_ACTIVE</p>
            </div>
          </div>
          <div className="status-dot status-green" />
        </div>
      </div>
    </main>
  );
}
