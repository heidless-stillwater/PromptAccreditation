'use client';

import React, { useTransition, useState, useMemo, useEffect } from 'react';
import { Loader2, Shield, AlertTriangle, CheckCircle2, ListChecks, ArrowUpRight, ChevronDown } from 'lucide-react';
import { toggleChecklistItemAction } from '@/lib/actions';

interface Task {
  title: string;
  description: string;
  priority: string | null;
  originalIndex: number;
  isDone: boolean;
}

interface Props {
  policyId: string;
  stepId: string;
  checklistRaw: string;
  initialProgress?: boolean[];
  compact?: boolean;
}

export function InteractiveChecklist({ policyId, stepId, checklistRaw, initialProgress = [], compact = false }: Props) {
  const [isPending, startTransition] = useTransition();
  const [localProgress, setLocalProgress] = useState<boolean[]>(initialProgress);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set()); 
  const [isRoadmapExpanded, setIsRoadmapExpanded] = useState(true);

  useEffect(() => {
    setLocalProgress(initialProgress);
  }, [initialProgress]);

  const toggleTaskExpansion = (index: number) => {
    const next = new Set(expandedTasks);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setExpandedTasks(next);
  };

  // Extract definitive tasks from the blueprint/evidence
  const tasks = useMemo(() => {
    const extracted: Task[] = [];
    if (!checklistRaw || typeof checklistRaw !== 'string') return extracted;
    
    const lines = checklistRaw.split('\n');
    let checkboxCount = 0;

    lines.forEach((line) => {
      const trimmed = line.trim();
      // Improved regex: matches bullets, numbers, and ವಿವಿಧ checkbox styles
      if (trimmed.match(/^([-\d.*]\s*)?\[[ xX]*\]/)) {
        let text = trimmed.replace(/^([-*]\s*)?\[[ xX]*\]\s*/, '').trim();
        
        const priorityMatch = text.match(/\[(P[0-9R])\]/i);
        const priority = priorityMatch ? priorityMatch[1].toUpperCase() : null;
        text = text.replace(/\[P[0-9R]\]/i, '').trim();

        let title = 'Action Item';
        let description = text;

        const boldMatch = text.match(/^\*\*(.*?)\*\*(.*)/);
        if (boldMatch) {
          title = boldMatch[1];
          description = boldMatch[2].replace(/^[:\s-]+/, '').trim();
        } else if (text.includes(':')) {
           const parts = text.split(':');
           title = parts[0].trim();
           description = parts.slice(1).join(':').trim();
        }

        extracted.push({
          title: title.replace(/[:]+$/, '').trim(),
          description,
          priority,
          originalIndex: checkboxCount,
          isDone: localProgress[checkboxCount] || false
        });
        checkboxCount++;
      }
    });

    return extracted;
  }, [checklistRaw, localProgress]);

  const handleToggle = (checkboxIndex: number) => {
    const newVal = !localProgress[checkboxIndex];
    const updated = [...localProgress];
    updated[checkboxIndex] = newVal;
    setLocalProgress(updated);

    startTransition(async () => {
      await toggleChecklistItemAction(policyId, stepId, checkboxIndex, newVal);
    });
  };

  const completedCount = tasks.filter(t => t.isDone).length;
  const totalCount = tasks.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (totalCount === 0) {
    return (
      <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
         <AlertTriangle className="mx-auto mb-3 text-amber-500/50" size={24} />
         <p className="text-xs font-bold text-white/40 uppercase tracking-widest">No interactive tasks found in draft.</p>
         <p className="text-[10px] text-white/20 mt-1 italic">Please generate or refine the technical blueprint first.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${compact ? '' : 'p-6 bg-white/[0.02] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden'}`}>
      <header 
        className="flex items-center justify-between mb-2 cursor-pointer group select-none"
        onClick={() => setIsRoadmapExpanded(!isRoadmapExpanded)}
      >
         <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center transition-all ${isRoadmapExpanded ? 'rotate-0' : '-rotate-90'}`}>
               <ListChecks className="text-blue-400" size={18} />
            </div>
            <div>
               <h4 className="text-xs font-black uppercase tracking-widest text-white group-hover:text-blue-400 transition-colors">Live Implementation Roadmap</h4>
               <p className="text-[10px] font-mono text-emerald-400/60 uppercase">{percent}% Mitigation Complete</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            {isRoadmapExpanded && (
              <button 
                onClick={(e) => { e.stopPropagation(); setExpandedTasks(new Set()); }}
                className="text-[9px] font-black text-white/20 uppercase tracking-widest hover:text-white/40 transition-all border border-white/5 px-2 py-1 rounded"
              >
                Collapse_All
              </button>
            )}
            <div className={`transition-transform duration-500 ${isRoadmapExpanded ? 'rotate-180 text-blue-400' : 'text-white/10'}`}>
               <ChevronDown size={14} />
            </div>
         </div>
      </header>

      {/* Always-Visible Progress Bar */}
      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-2">
         <div 
           className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out" 
           style={{ width: `${percent}%` }} 
         />
      </div>

      <div className={`transition-all duration-700 ease-in-out overflow-hidden ${isRoadmapExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="grid gap-2 pt-2">
          {tasks.map((task) => {
            const isExpanded = expandedTasks.has(task.originalIndex);
            return (
              <div
                key={task.originalIndex}
                className={`w-full group rounded-2xl transition-all border overflow-hidden ${
                  task.isDone 
                    ? 'bg-emerald-500/[0.05] border-emerald-500/10 opacity-60' 
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Checkbox Action */}
                  <button
                    onClick={() => handleToggle(task.originalIndex)}
                    disabled={isPending}
                    className="flex-shrink-0 relative z-10"
                  >
                     <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${
                       task.isDone 
                         ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                         : 'border-white/10 hover:border-white/20'
                     }`}>
                        {task.isDone ? (
                          <ArrowUpRight size={14} className="text-white" strokeWidth={3} />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-white/0 group-hover:bg-white/10 transition-all" />
                        )}
                     </div>
                  </button>

                  {/* Expansion Trigger */}
                  <div 
                    className="flex-1 min-w-0 cursor-pointer py-1"
                    onClick={() => toggleTaskExpansion(task.originalIndex)}
                  >
                     <div className="flex items-center justify-between gap-3">
                        <h4 className={`text-xs font-black uppercase tracking-widest transition-all ${
                          task.isDone ? 'text-emerald-400/40' : 'text-white'
                        }`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-3">
                          {task.priority && !task.isDone && (
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest ${
                              task.priority === 'P0' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              task.priority === 'P1' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              task.priority === 'P2' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                              task.priority === 'P3' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              task.priority === 'P4' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' :
                              task.priority === 'PR' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' :
                              'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            }`}>
                              {task.priority}
                            </span>
                          )}
                          <div className={`transition-transform duration-500 ${isExpanded ? 'rotate-180 text-blue-400' : 'text-white/10'}`}>
                             <ChevronDown size={14} />
                          </div>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Collapsible Content */}
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                   <div className="px-5 pb-5 pl-[60px] border-t border-white/5 pt-4 bg-black/20 text-[11px] leading-relaxed">
                      <p className={`transition-all ${
                        task.isDone ? 'text-emerald-400/20 line-through' : 'text-white/50'
                      }`}>
                        {task.description}
                      </p>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="mt-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Shield size={14} className="text-blue-500/40" />
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Sovereign Audit Sync: Active</span>
         </div>
         {percent === 100 && (
            <div className="flex items-center gap-2 text-emerald-400 animate-pulse">
               <CheckCircle2 size={12} />
               <span className="text-[10px] font-black uppercase tracking-widest">Sign-off Ready</span>
            </div>
         )}
      </footer>
    </div>
  );
}
