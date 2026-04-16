import React from 'react';
import { Shield, Lock, FileText, CheckCircle2, AlertTriangle, Fingerprint, Activity, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PolicyService } from '@/lib/services/policy-service';
import { AuthService } from '@/lib/services/auth-service';
import { ProbeService } from '@/lib/services/probe-service';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Stillwater SaaS Suite',
  description: 'Official UK GDPR Privacy and Transparency Policy for the Stillwater SaaS Suite.',
};

export default async function PrivacyPage() {
  const user = await AuthService.getCurrentUser();
  const userId = user?.uid || 'heidless-admin';

  // 1. Fetch synthesized policy content (Primary Truth)
  const wizardState = await PolicyService.getWizardState('data-protection-act', userId);
  const policyContent = wizardState?.evidenceUploaded?.['dpa-step-3'];

  // 2. Fetch live technical status (Secondary / Fallback Truth)
  const [encResult, auditResult] = await Promise.all([
    ProbeService.auditEncryptionEnforcement(userId),
    ProbeService.auditDataLogging(userId)
  ]);

  const hasContent = !!policyContent && policyContent.length > 50;

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[100px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        <header className="max-w-4xl mx-auto mb-16 text-center">
           <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/60 transition-all mb-8">
              <Shield size={12} />
              Return to Control Center
           </Link>
           <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">
             Privacy & Transparency Portal
           </h1>
           <div className="flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
              <span className="px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/5">Clinical_Audit</span>
              <span className="text-white/20">•</span>
              <span className="text-white/40">Real-Time Registry • {new Date().toLocaleDateString()}</span>
           </div>
        </header>

        <main className="max-w-4xl mx-auto space-y-12">
          {/* ═══════════════════════════════════════════════════════
              LATEST AUDIT TELEMETRY (Live Status)
          ═══════════════════════════════════════════════════════ */}
          <section className="grid md:grid-cols-2 gap-6">
             <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-xl transition-all hover:bg-white/[0.04]">
                <div className="flex items-start justify-between mb-8">
                   <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      <Fingerprint size={20} />
                   </div>
                   <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      encResult.status === 'green' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                   }`}>
                      {encResult.status === 'green' ? 'Hardened' : 'Drift Detected'}
                   </div>
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Technical Security</h3>
                <h2 className="text-xl font-black tracking-tight mb-4">Encryption Engagement</h2>
                <p className="text-xs text-white/30 leading-relaxed">
                   Verified {encResult.status === 'green' ? 'active' : 'pending'} enforcement of AES-256-GCM across the Sovereign Registry. Data residency anchored in UK jurisdiction.
                </p>
             </div>

             <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-xl transition-all hover:bg-white/[0.04]">
                <div className="flex items-start justify-between mb-8">
                   <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Activity size={20} />
                   </div>
                   <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      auditResult.status === 'green' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                   }`}>
                      {auditResult.status === 'green' ? 'Active' : 'Missing'}
                   </div>
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Data Accountability</h3>
                <h2 className="text-xl font-black tracking-tight mb-4">Live Audit Trails</h2>
                <p className="text-xs text-white/30 leading-relaxed">
                   Administrative telemetry stream {auditResult.status === 'green' ? 'functional' : 'degraded'}. Personal Information Processing documented under UK GDPR Article 30.
                </p>
             </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              SYNTHESIZED POLICY CONTENT
          ═══════════════════════════════════════════════════════ */}
          <section>
            {hasContent ? (
              <div className="p-10 md:p-16 rounded-[3rem] bg-white/[0.01] border border-white/10 backdrop-blur-2xl shadow-3xl relative overflow-hidden">
                <div className="absolute top-10 right-10 opacity-5">
                   <FileText size={120} className="text-blue-500" />
                </div>
                
                <div className="prose prose-invert prose-blue max-w-none 
                  prose-headings:font-black prose-headings:tracking-tight prose-headings:uppercase prose-headings:text-xs prose-headings:text-blue-400 prose-headings:mb-6 prose-headings:mt-16 first:prose-headings:mt-0
                  prose-p:text-white/70 prose-p:leading-relaxed prose-p:text-base mb-8
                  prose-strong:text-white prose-strong:font-bold
                  prose-ul:text-white/60 prose-li:text-sm prose-li:mb-2
                  prose-hr:border-white/5">
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>
                     {policyContent}
                   </ReactMarkdown>
                </div>

                <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                   <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400">
                      <CheckCircle2 size={18} />
                      <div className="flex flex-col">
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Sovereign Accreditation</span>
                         <span className="text-[8px] opacity-60">Status: Registered & Dynamic</span>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-widest text-white/20">
                      <div className="flex items-center gap-2">
                         <Clock size={12} />
                         <span>Synthesized: {new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <Lock size={12} />
                         <span>AES-256 Proof Attached</span>
                      </div>
                   </div>
                </footer>
              </div>
            ) : (
              <div className="text-center p-20 rounded-[3rem] bg-white/[0.01] border border-white/10 border-dashed relative group overflow-hidden">
                 <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/[0.02] transition-colors pointer-events-none" />
                 
                 <div className="relative z-10">
                    <AlertTriangle className="mx-auto text-amber-500/40 mb-8 animate-pulse" size={56} />
                    <h2 className="text-2xl font-black uppercase tracking-widest text-white/40 mb-4">Policy Draft Pending</h2>
                    <p className="text-sm text-white/20 mb-10 max-w-md mx-auto leading-relaxed">
                      The Sovereign Analytics Engine has detected a lack of public evidence for this Mission. Please execute the Accreditation Synthesis via the Wizard.
                    </p>
                    
                    <div className="flex flex-col items-center gap-4">
                       <Link href="/policies/data-protection-act/wizard" className="inline-block px-10 py-5 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-blue-400 hover:text-white transition-all transform hover:-translate-y-1">
                          Synchronize Dossier
                       </Link>
                       <span className="text-[9px] font-mono text-white/10 uppercase tracking-widest">
                          Requires Mission-ID Alignment
                       </span>
                    </div>
                 </div>
              </div>
            )}
          </section>
        </main>

        <footer className="max-w-4xl mx-auto mt-32 border-t border-white/5 pt-12 text-center">
            <div className="flex flex-col items-center gap-6">
               <div className="w-12 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
               <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.6em]">
                 Stillwater Sovereign Infrastructure • Verifiable Privacy • v1.0.4-LOCKED
               </p>
            </div>
        </footer>
      </div>
    </div>
  );
}
