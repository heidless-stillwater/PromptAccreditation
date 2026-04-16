'use client';

import { useState, useTransition } from 'react';
import { updateCheckStatus } from '@/lib/actions';
import type { AuditCheck } from '@/lib/types';
import { CheckCircle2, XCircle, Clock, Loader2, Bot, FileText, Shield, Activity } from 'lucide-react';

const STATUS_ICONS = {
  green: CheckCircle2,
  amber: Clock,
  red: XCircle,
};
const STATUS_COLORS = {
  green: 'var(--status-green)',
  amber: 'var(--status-amber)',
  red: 'var(--status-red)',
};

import { RepairStatusModal } from './repair-status-modal';

interface Props {
  check: AuditCheck;
  policyId: string;
}

export function CheckRowClient({ check, policyId }: Props) {
  const [status, setStatus] = useState(check.status);
  const [isPending, startTransition] = useTransition();
  const [showEvidence, setShowEvidence] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repairStatus, setRepairStatus] = useState<'success' | 'error'>('success');
  const [repairMsg, setRepairMsg] = useState('');
  
  const Icon = STATUS_ICONS[status];

  function handleToggle() {
    const next = status === 'green' ? 'red' : status === 'red' ? 'amber' : 'green';
    setStatus(next);
    startTransition(async () => {
      await updateCheckStatus(policyId, check.id, next);
    });
  }

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl group"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)' }}
    >
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
        title="Toggle status"
      >
        {isPending ? (
          <Loader2 size={16} className="animate-spin" style={{ color: 'var(--muted)' }} />
        ) : (
          <Icon size={16} style={{ color: STATUS_COLORS[status] }} />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{check.title}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--secondary)' }}>{check.description}</p>
        <div className="flex items-center gap-2 mt-1.5">
          {check.category === 'automated' && (
            <span className="badge-primary" style={{ fontSize: 9 }}>AUTO</span>
          )}
          {check.category === 'hybrid' && (
            <span className="badge-muted" style={{ fontSize: 9 }}>HYBRID</span>
          )}
          {check.targetApp && (
            <span className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>{check.targetApp}</span>
          )}
          {check.probeId && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--color-primary)' }}>
              <Bot size={9} />
              {check.probeId}
            </span>
          )}
          {check.evidenceUrl && (
            <button 
              onClick={() => setShowEvidence(!showEvidence)}
              className="flex items-center gap-1 text-[10px] hover:text-white transition-colors" 
              style={{ color: 'var(--status-green)' }}
            >
              <FileText size={10} />
              View Linked Evidence
            </button>
          )}
        </div>

        {showEvidence && check.evidenceUrl && (
          <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/5 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Linked Accreditation Evidence</span>
              <button onClick={() => setShowEvidence(false)} className="text-[10px] text-white/40 hover:text-white">Close</button>
            </div>
            <div className="prose prose-invert prose-xs max-h-48 overflow-y-auto custom-scrollbar pr-2">
               <pre className="text-[10px] font-mono text-white/70 whitespace-pre-wrap">{check.evidenceUrl}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        <span className={`badge-${status}`}>{status === 'amber' ? 'PENDING SIGN-OFF' : status.toUpperCase()}</span>
        
        {/* Technical Remediation Shortcut */}
        {(check.probeId === 'probe-encryption-enforcement' || check.id === 'probe-encryption-enforcement') && status !== 'green' && (
          <button
            onClick={async () => {
              const { triggerEncryptionRepair } = await import('@/lib/actions');
              startTransition(async () => {
                const res = await triggerEncryptionRepair(policyId);
                if (res.success) {
                   const { updateCheckStatus } = await import('@/lib/actions');
                   await updateCheckStatus(policyId, check.id, 'green');
                   setStatus('green');
                   setRepairMsg('Field-level encryption has been programmatically enforced across the Master Registry database.');
                   setRepairStatus('success');
                   setIsModalOpen(true);
                } else {
                   setRepairMsg(res.message);
                   setRepairStatus('error');
                   setIsModalOpen(true);
                }
              });
            }}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border-2 border-emerald-500/50 text-[10px] font-black text-emerald-400 hover:bg-emerald-500/40 transition-all animate-pulse-slow shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Activity size={10} />
            AUTO-REPAIR SYSTEMS
          </button>
        )}

        {status === 'amber' && (
          <button
            onClick={async () => {
              const { certifyCheckAction } = await import('@/lib/actions');
              startTransition(async () => {
                const res = await certifyCheckAction(policyId, check.id);
                if (res.success) setStatus('green');
              });
            }}
            disabled={isPending}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-lg shadow-emerald-500/5"
          >
            <Shield size={10} />
            Certify & Sign-off
          </button>
        )}
      </div>

      <RepairStatusModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        status={repairStatus}
        message={repairMsg}
        details={repairStatus === 'success' ? {
          action: 'AES-256-GCM Direct Enforcement',
          standard: 'Field-Level Symmetric Encryption',
          impact: 'UK GDPR / DPIA Compliance Alignment'
        } : undefined}
      />
    </div>
  );
}
