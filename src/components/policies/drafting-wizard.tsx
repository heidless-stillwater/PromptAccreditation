'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, FileText, Download, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  policyId: string;
  stepId: string;
  onComplete: (evidenceUrl: string) => void;
  onCancel: () => void;
}

export function DraftingWizard({ policyId, stepId, onComplete, onCancel }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hello! I'm the Policy Specialist. I'll guide you through your Online Safety Risk Assessment. \n\nBefore we generate your official PDF, I need to ask a few questions. \n\n**First: Can you describe which user journeys on your platform might be accessible to children?**" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  async function handleSend() {
    if (!input.trim() || isTyping) return;
    
    const userMsg = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: input,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No reader");

      let assistantOutput = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        assistantOutput += text;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content = assistantOutput;
          return newMsgs;
        });
      }
    } catch (err) {
      console.error("Drafting error:", err);
    } finally {
      setIsTyping(false);
    }
  }

  async function handleFinalize() {
    setIsGenerating(true);
    // Extract Q&A pairs from history
    const responses = [];
    for (let i = 0; i < messages.length; i += 2) {
      if (messages[i+1]) {
        responses.push({
          question: messages[i].content,
          answer: messages[i+1].content
        });
      }
    }

    try {
      // Use the new drafting action/api
      const res = await fetch('/api/admin/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'risk_assessment',
          policyId,
          stepId,
          responses
        })
      });
      const data = await res.json();
      if (data.docId) {
        setDocId(data.docId);
        // Link to the check automatically if needed
      }
    } catch (err) {
      console.error("Failed to generate document:", err);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-slate-900/40 rounded-3xl border border-slate-800 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in duration-500">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Drafting Interview</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Ofcom Risk Assessment Mode</p>
          </div>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors">
          <ChevronRight className="w-5 h-5 rotate-90" />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/10' 
                  : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700/50'
              }`}>
                {msg.content || (
                  <div className="flex gap-1 py-1">
                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary / Finalize Action */}
      {messages.length >= 6 && !docId && (
        <div className="px-6 py-4 bg-emerald-500/5 border-t border-emerald-500/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Enough data gathered for RA Document</span>
            </div>
            <button 
                onClick={handleFinalize}
                disabled={isGenerating}
                className="btn-success text-[11px] py-1.5 px-3 rounded-lg flex items-center gap-2"
            >
                {isGenerating ? 'Synthesizing...' : 'Draft Risk Assessment'}
                {!isGenerating && <Sparkles className="w-3.5 h-3.5" />}
            </button>
        </div>
      )}

      {docId && (
        <div className="px-6 py-6 border-t border-slate-800 bg-emerald-500/10 text-center space-y-4">
             <div className="inline-flex p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                <FileText className="w-7 h-7" />
             </div>
             <div>
                <h4 className="font-bold text-white mb-1">Document Drafted Successfully!</h4>
                <p className="text-xs text-slate-400">ID: {docId} · Online Safety Act 2023 Compliant</p>
             </div>
             <div className="flex gap-3 justify-center pt-2">
                <button 
                  onClick={() => onComplete(docId)}
                  className="px-6 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-all"
                >
                    Link to Compliance Check
                </button>
                <button className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700">
                    <Download className="w-4 h-4" />
                </button>
             </div>
        </div>
      )}

      {/* Input */}
      {!docId && (
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your response..."
              className="w-full bg-slate-800 border-none rounded-2xl py-3 pl-4 pr-12 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/20 text-sm"
            />
            <button 
              onClick={handleSend}
              className="absolute right-2 top-1.5 p-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
              disabled={!input.trim() || isTyping}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
