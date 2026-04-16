'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Upload, FileText, CheckCircle2, Loader2, Bot } from 'lucide-react';
import Link from 'next/link';
import { uploadKBDocument } from '@/lib/actions';

export default function KBUploadPage() {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const router = useRouter();

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileContent(text);
    };
    reader.readAsText(file);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const category = formData.get('category') as any;
    const content = formData.get('content') as string;

    try {
      const result = await uploadKBDocument(title, category, content);
      if (result.success) {
        setCompleted(true);
        setTimeout(() => router.push('/knowledge'), 1500);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (completed) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8 bg-[#07080a]">
        <div className="glass-card p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Ingestion Complete</h1>
          <p className="text-sm text-slate-400 mb-6">
            Legislative document has been chunked and added to the Policy Specialist's context.
          </p>
          <div className="flex items-center justify-center gap-2 text-[10px] text-blue-400 font-mono animate-pulse">
            <Bot size={12} />
            AI INDEXING IN PROGRESS...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-4xl mx-auto animate-fade-in">
      <Link href="/knowledge" className="flex items-center gap-2 text-sm mb-8 hover:underline" style={{ color: 'var(--secondary)' }}>
        <ChevronLeft size={14} />
        Back to Library
      </Link>

      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2 text-gradient">Ingest Knowledge</h1>
        <p className="text-sm" style={{ color: 'var(--secondary)' }}>
          Ground the Policy Specialist AI in your specific legislative context.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="glass-card p-8 space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Document Title</label>
              <input
                required
                name="title"
                type="text"
                placeholder="e.g. Online Safety Act 2023 - Part 3"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                style={{ color: 'var(--foreground)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Policy Domain</label>
              <div className="relative">
                <select
                  name="category"
                  className="w-full bg-[#12141a] border border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer pr-10"
                  style={{ color: 'var(--foreground)', backgroundColor: '#12141a' }}
                >
                  <option value="safety" style={{ backgroundColor: '#12141a', color: 'white' }}>Online Safety (OSA)</option>
                  <option value="data" style={{ backgroundColor: '#12141a', color: 'white' }}>Data Protection (GDPR)</option>
                  <option value="security" style={{ backgroundColor: '#12141a', color: 'white' }}>Site Security (NCSC)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Upload File (.md, .txt)</label>
              <div 
                className="relative group border-2 border-dashed border-white/5 rounded-xl p-8 transition-colors hover:border-blue-500/30 hover:bg-blue-500/5 cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFile(file);
                }}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input 
                  id="file-upload"
                  type="file" 
                  accept=".md,.txt" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                <div className="flex flex-col items-center gap-3">
                  <Upload size={24} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-400">Click to upload or drag and drop</p>
                    <p className="text-[10px] text-slate-500 mt-1">Markdown or Plain Text supported</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col h-full">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Document Content</label>
            <textarea
              required
              name="content"
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="Paste content or upload a file above..."
              className="flex-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 font-mono transition-colors min-h-[300px]"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-8 border-t border-white/5">
          <Link href="/knowledge" className="btn-ghost">Cancel</Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary min-w-[160px] justify-center"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Chunking...
              </>
            ) : (
              <>
                <Upload size={16} />
                Ingest Content
              </>
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
