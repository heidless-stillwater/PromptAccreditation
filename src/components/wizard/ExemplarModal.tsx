'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Code, CheckCircle2, Shield } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export function ExemplarModal({ isOpen, onClose, title, content }: Props) {
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 overflow-hidden bg-black/40 backdrop-blur-md">
          {/* Backdrop Click-Target */}
          <div 
            onClick={onClose}
            className="absolute inset-0 cursor-pointer"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="relative w-full max-w-4xl max-h-full bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden pointer-events-auto border-t-white/20"
          >
            {/* Header Hub */}
            <div className="px-8 py-6 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-5">
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-inner">
                  <Shield className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[9px] uppercase font-black tracking-[0.2em] bg-indigo-500/20 px-2.5 py-1 rounded text-indigo-300">SYSTEM_REFERENCE</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">v2.4 Gold Blueprint</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex p-1 bg-black/60 rounded-xl border border-white/5">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'preview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <FileText size={14} />
                    Preview
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'raw' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <Code size={14} />
                    Source
                  </button>
                </div>

                <button 
                  onClick={onClose}
                  className="p-3 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white hover:rotate-90"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Content Core */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#080c16]">
              {viewMode === 'raw' ? (
                <div className="w-full bg-black/30 rounded-2xl border border-white/5 p-8 font-mono text-xs leading-loose text-indigo-200/70">
                  <pre className="whitespace-pre-wrap">{content}</pre>
                </div>
              ) : (
                <div className="prose prose-invert prose-indigo max-w-none prose-base">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-white/5 bg-slate-900/80 backdrop-blur-xl flex justify-between items-center text-[10px] shrink-0">
               <div className="flex items-center gap-3">
                 <CheckCircle2 size={14} className="text-emerald-500" />
                 <span className="text-white/40 font-medium italic">Verified Regulatory Exemplar</span>
               </div>
               <span className="font-mono text-indigo-500/40 uppercase tracking-[0.3em] font-black">v4_Locked</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
