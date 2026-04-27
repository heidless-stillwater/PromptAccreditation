'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { MessageSquare, Send, Bot, User, Loader2, BookOpen } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';

function Message({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
        style={{
          background: isUser ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.12)',
          border: `1px solid ${isUser ? 'rgba(59,130,246,0.3)' : 'rgba(16,185,129,0.25)'}`,
        }}
      >
        {isUser
          ? <User size={14} style={{ color: '#60a5fa' }} />
          : <Bot size={14} style={{ color: '#34d399' }} />
        }
      </div>
      <div
        className="max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
        style={{
          background: isUser ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isUser ? 'rgba(59,130,246,0.2)' : 'var(--color-border)'}`,
          color: 'var(--foreground)',
        }}
      >
        <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
        {msg.citations && msg.citations.length > 0 && (
          <div className="mt-3 pt-3 space-y-1" style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>Sources</p>
            {msg.citations.map((c) => (
              <div
                key={c.chunkId}
                className="text-[11px] px-2 py-1 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--secondary)', border: '1px solid var(--color-border)' }}
              >
                <span className="flex items-center gap-1">
                  <BookOpen size={10} style={{ color: 'var(--color-primary)' }} />
                  {c.documentTitle} {c.pageRef ? `· ${c.pageRef}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  'What does the Online Safety Act require for age verification?',
  'What are my data retention obligations under UK GDPR?',
  'What security headers should I implement for compliance?',
  'What is the penalty for non-compliance with the DPA 2018?',
];

export default function PolicyAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello. I\'m your Policy Specialist, grounded in UK regulatory law. I can answer questions about the Online Safety Act 2023, Data Protection Act 2018 (UK GDPR), and Security best practices.\n\nHow can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(text?: string) {
    const question = (text ?? input).trim();
    if (!question || isPending || isStreaming) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setIsStreaming(true);
    startTransition(async () => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, history: messages }),
        });

        if (!response.body) throw new Error('No response body');

        const assistantId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: 'assistant', content: '', timestamp: new Date() },
        ]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: accumulated } : m)
          );
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please check your Gemini API key and try again.',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsStreaming(false);
      }
    });
  }

  return (
    <main className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 px-8 py-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <Bot size={18} style={{ color: '#34d399' }} />
          </div>
          <div>
            <p className="font-bold text-sm">Policy Specialist</p>
            <p className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>
              Powered by Gemini 1.5 Pro · Grounded in UK law
            </p>
          </div>
        </div>
        <span className="badge-green">ONLINE</span>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {messages.map((msg) => <Message key={msg.id} msg={msg} />)}

        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <Bot size={14} style={{ color: '#34d399' }} />
            </div>
            <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--secondary)' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      {messages.length <= 1 && (
        <div className="flex-shrink-0 px-8 pb-3">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-xs px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--secondary)' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="flex-shrink-0 px-8 py-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border-hover)' }}
        >
          <MessageSquare size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask about UK compliance requirements..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--foreground)' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isPending || isStreaming}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: input.trim() ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
              opacity: !input.trim() ? 0.4 : 1,
            }}
          >
            {isStreaming
              ? <Loader2 size={14} className="animate-spin" style={{ color: '#fff' }} />
              : <Send size={14} style={{ color: input.trim() ? '#fff' : 'var(--muted)' }} />
            }
          </button>
        </div>
      </div>
    </main>
  );
}
