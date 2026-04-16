'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileCode, Layout } from 'lucide-react';

interface Props {
  content: string;
}

export function KnowledgeViewer({ content }: Props) {
  const [view, setView] = useState<'compiled' | 'raw'>('compiled');

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
        <h2 className="text-xs font-bold tracking-widest uppercase opacity-40 flex items-center gap-2">
          {view === 'compiled' ? <Layout size={14} /> : <FileCode size={14} />}
          {view === 'compiled' ? 'Compiled View' : 'Raw Markdown'}
        </h2>
        
        <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setView('compiled')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
              view === 'compiled' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            COMPILED
          </button>
          <button
            onClick={() => setView('raw')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
              view === 'raw' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            RAW
          </button>
        </div>
      </div>

      <div className="p-8">
        {view === 'compiled' ? (
          <div className="prose prose-invert prose-sm max-w-none 
            prose-headings:text-blue-400 prose-headings:font-bold prose-headings:mb-4 prose-headings:mt-8
            prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4
            prose-li:text-slate-300 prose-strong:text-white prose-strong:font-bold
            prose-code:text-blue-300 prose-code:bg-blue-900/20 prose-code:px-1 prose-code:rounded
            prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5
            prose-table:border prose-table:border-white/10 prose-th:bg-white/5 prose-th:p-2 prose-td:p-2
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap text-slate-400 bg-black/20 p-4 rounded-xl border border-white/5">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}
