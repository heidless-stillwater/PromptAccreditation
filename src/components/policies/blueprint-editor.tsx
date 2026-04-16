'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Save, Loader2, Edit3, Shield, Info, CheckCircle2 } from 'lucide-react';
import { updateChecklistAction } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface Props {
  policyId: string;
  stepId: string;
  initialContent: string;
  compact?: boolean;
}

export function BlueprintEditor({ policyId, stepId, initialContent, compact = false }: Props) {
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setContent(initialContent);
    setHasChanges(false);
  }, [initialContent]);

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateChecklistAction(policyId, stepId, content);
      if (result.success) {
        setHasChanges(false);
        router.refresh();
      }
    });
  };

  const handleChange = (newVal: string) => {
    setContent(newVal);
    setHasChanges(newVal !== initialContent);
  };

  // Simple priority highlighter for the raw view
  const getPriorityStyle = (line: string) => {
    if (line.includes('[P0]')) return 'text-red-400 font-black';
    if (line.includes('[P1]')) return 'text-amber-400 font-bold';
    if (line.includes('[P2]')) return 'text-blue-400';
    return 'text-white/60';
  };

  return (
    <div className={`flex flex-col gap-3 ${compact ? '' : 'p-6 bg-white/[0.03] border border-white/5 rounded-2xl'}`}>
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-amber-400">
          <Edit3 size={16} />
          <h4 className={`font-black uppercase tracking-widest ${compact ? 'text-[9px]' : 'text-[10px]'}`}>Technical Blueprint Editor</h4>
        </div>
        {hasChanges && (
          <button 
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[9px] font-bold text-amber-400 border border-amber-500/30 transition-all animate-pulse"
          >
            {isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Commit Blueprint
          </button>
        )}
      </header>

      <div className="relative group">
        <textarea 
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          className={`w-full ${compact ? 'h-48' : 'h-64'} bg-black/40 border border-white/5 rounded-xl p-4 text-[11px] font-mono leading-relaxed text-white/80 focus:outline-none focus:border-amber-500/30 transition-all thin-scrollbar resize-none`}
          placeholder="Draft technical implementation instructions here..."
        />
        
        <div className="absolute top-4 right-4 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
           <Shield size={24} className="text-amber-500" />
        </div>
      </div>

      <footer className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-[9px] font-bold text-white/40 uppercase">P0 Critical</span>
           </div>
           <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="text-[9px] font-bold text-white/40 uppercase">P1 High</span>
           </div>
           <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
              <span className="text-[9px] font-bold text-white/40 uppercase">P2 Routine</span>
           </div>
        </div>
        
        <p className="text-[9px] text-white/20 italic">
           * Use [P0], [P1], or [P2] for risk-based todo generation.
        </p>
      </footer>

      {hasChanges && (
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-center gap-2">
           <Info size={12} className="text-amber-500/60" />
           <p className="text-[9px] text-amber-500/60 font-bold uppercase tracking-widest">
              Unsaved refinements detected in the blueprint registry.
           </p>
        </div>
      )}
    </div>
  );
}
