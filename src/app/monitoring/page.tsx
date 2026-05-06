import React from 'react';
import { Globe, ShieldCheck, Terminal, Copy, CheckCircle2 } from 'lucide-react';
import { PolicyService } from '@/lib/services/policy-service';

import { monitoringDb } from '@/lib/firebase-admin';
import { SUITE_APPS } from '@/lib/constants';
import { ComplianceBadge } from '@/components/shared/compliance-badge';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Suite Monitoring | Seal Registry',
  description: 'Manage compliance badges and real-time app verification',
};

export default async function MonitoringPage() {
  // Fetch status for all apps in parallel
  const appStatuses = await Promise.all(
    SUITE_APPS.map(async (app) => {
      const status = await PolicyService.getAppComplianceStatus(app.id);
      return { ...app, ...status };
    })
  );

  return (
    <main className="max-w-7xl mx-auto p-8 animate-fade-in space-y-12">
      <header className="flex justify-between items-end border-b border-teal-500/10 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Globe size={24} className="text-teal-500" />
            <h1 className="text-3xl font-bold font-outfit">Seal Registry</h1>
          </div>
          <p className="text-sm font-medium text-slate-400 max-w-2xl">
            Manage your suite-wide compliance badges. These seals are cryptographically linked to your active governance policies and will automatically revoke if compliance drift is detected.
          </p>
        </div>
      </header>

      {/* Grid of Badges */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {appStatuses.map((app) => (
          <div key={app.id} className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black font-mono tracking-[0.2em] text-slate-500 uppercase">
                {app.name} Authority
              </h3>
              {app.passed && (
                <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                  <CheckCircle2 size={10} /> Secure Link
                </div>
              )}
            </div>
            
            <div className="glass-card p-6 border-teal-500/10">
              <ComplianceBadge 
                appId={app.id}
                verified={app.passed}
                score={app.score}
                lastAudit={app.lastScan || new Date()}
              />
            </div>

            {/* Integration Snippet */}
            <div className="glass-card overflow-hidden !p-0">
              <div className="px-5 py-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <span className="text-[10px] font-black font-mono text-slate-500 uppercase tracking-widest">Integration Snippet</span>
                <button className="text-[10px] font-black font-mono text-teal-400 hover:text-teal-300 flex items-center gap-2 transition-colors">
                  <Copy size={12} /> Copy
                </button>
              </div>
              <pre className="p-5 text-[11px] font-mono text-slate-400 bg-black/40 overflow-x-auto leading-relaxed">
                <code>{`<ComplianceBadge \n  appId="${app.id}" \n  verified={status.verified} \n  score={status.score} \n/>`}</code>
              </pre>
            </div>
          </div>
        ))}
      </section>

      {/* API Reference */}
      <section className="glass-card p-10 border-teal-500/10">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
          <Terminal size={22} className="text-teal-400" />
          <h2 className="text-xl font-bold font-outfit text-white">Real-time Verification API</h2>
        </div>
        
        <div className="space-y-8">
          <div>
            <p className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Endpoint Definition</p>
            <div className="p-4 bg-black/40 rounded-xl font-mono text-sm text-teal-400 border border-teal-500/10 flex items-center gap-3">
               <span className="px-2 py-0.5 rounded bg-teal-500/10 text-xs font-bold uppercase">Get</span>
               <span>/api/verify/[appId]</span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Sample Verification Payload</p>
            <div className="p-6 bg-black/40 rounded-xl font-mono text-[12px] text-slate-400 border border-white/5 leading-relaxed">
              <pre>
{`{
  "success": true,
  "appId": "promptmaster",
  "verified": true,
  "complianceScore": 92,
  "sealUrl": "https://stillwater-accreditation.web.app/seals/verified.svg",
  "message": "This application is compliant with all mandatory suite-wide policies."
}`}
              </pre>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-xl bg-teal-500/5 border border-teal-500/10">
            <ShieldCheck size={20} className="text-teal-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs leading-relaxed text-slate-400">
              <strong className="text-white">Security Protocol:</strong> Access-Control-Allow-Origin is set to '*' by default to support cross-app verification. For production, we recommend restricting this to your specific suite domains in the Cloud Console to maintain sovereign integrity.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

