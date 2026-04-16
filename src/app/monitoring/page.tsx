import React from 'react';
import { Globe, ShieldCheck, Terminal, Copy, CheckCircle2 } from 'lucide-react';
import { PolicyService } from '@/lib/services/policy-service';
import { SUITE_APPS } from '@/lib/constants';
import { ComplianceBadge } from '@/components/shared/compliance-badge';
import type { Metadata } from 'next';

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
    <main className="p-8 max-w-6xl mx-auto animate-fade-in">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <Globe size={24} style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-3xl font-bold">Seal Registry</h1>
        </div>
        <p className="text-sm max-w-2xl" style={{ color: 'var(--secondary)' }}>
          Manage your suite-wide compliance badges. These seals are cryptographically linked to your active governance policies and will automatically revoke if compliance drift is detected.
        </p>
      </header>

      {/* Grid of Badges */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {appStatuses.map((app) => (
          <div key={app.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold font-mono tracking-widest text-white/40 uppercase">
                {app.name} Authority
              </h3>
              {app.passed && (
                <span className="flex items-center gap-1 text-[10px] text-green-400 font-bold">
                  <CheckCircle2 size={10} /> SECURE LINK
                </span>
              )}
            </div>
            
            <ComplianceBadge 
              appId={app.id}
              verified={app.passed}
              score={app.score}
              lastAudit={app.lastScan || new Date()}
            />

            {/* Integration Snippet */}
            <div className="console-panel !p-0 overflow-hidden">
              <div className="px-4 py-2 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <span className="text-[10px] font-mono text-white/40">EMBED SNIPPET</span>
                <button className="text-[10px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  <Copy size={10} /> Copy
                </button>
              </div>
              <pre className="p-4 text-[10px] font-mono text-white/60 overflow-x-auto">
                <code>{`<ComplianceBadge \n  appId="${app.id}" \n  verified={status.verified} \n  score={status.score} \n/>`}</code>
              </pre>
            </div>
          </div>
        ))}
      </section>

      {/* API Reference */}
      <section className="glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <Terminal size={20} className="text-blue-400" />
          <h2 className="text-lg font-bold">Real-time Verification API</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold text-white/60 mb-2 uppercase tracking-tight">Endpoint</p>
            <div className="p-3 bg-black/40 rounded-xl font-mono text-xs text-blue-400 border border-white/5">
              GET /api/verify/[appId]
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-white/60 mb-2 uppercase tracking-tight">Sample Response</p>
            <div className="p-4 bg-black/40 rounded-xl font-mono text-[11px] text-white/50 border border-white/5">
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

          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <ShieldCheck size={16} className="text-blue-400 mt-0.5" />
            <p className="text-xs leading-relaxed text-blue-100/70">
              <strong>Security Protocol:</strong> Access-Control-Allow-Origin is set to '*' by default to support cross-app verification. For production, we recommend restricting this to your specific suite domains in the Cloud Console.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
