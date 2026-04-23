import { BookOpen, FileText, Plus } from 'lucide-react';
export const dynamic = 'force-dynamic';
import { accreditationDb } from '@/lib/firebase-admin';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { KBDocument } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Knowledge Base',
  description: 'Legislative documents for the Policy Specialist AI',
};

async function getDocuments(): Promise<KBDocument[]> {
  try {
    const snap = await accreditationDb
      .collection('kb_documents')
      .orderBy('uploadedAt', 'desc')
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as KBDocument));
  } catch {
    return [];
  }
}

const CATEGORY_COLORS = {
  safety:   { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   text: '#f87171' },
  data:     { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  text: '#fbbf24' },
  security: { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  text: '#34d399' },
};

export default async function KnowledgePage() {
  const docs = await getDocuments();

  return (
    <main className="p-8 max-w-5xl mx-auto animate-fade-in">
      <header className="flex justify-between items-end mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={22} style={{ color: 'var(--color-primary)' }} />
            <h1 className="text-3xl font-bold">Knowledge Base</h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--secondary)' }}>
            Legislative documents that ground the Policy Specialist AI's responses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/knowledge/chat" className="btn-primary text-sm flex items-center gap-2">
            Open Policy AI →
          </Link>
        </div>
      </header>

      {/* Upload prompt */}
      <div
        className="glass-card p-6 mb-8 flex items-center justify-between"
        style={{ border: '1px dashed rgba(255,255,255,0.1)' }}
      >
        <div>
          <p className="text-sm font-bold mb-1">Add Legislative Document</p>
          <p className="text-xs" style={{ color: 'var(--secondary)' }}>
            Upload a markdown/text document (e.g. OSA 2023, DPA 2018). PDF support coming in v2.1.
          </p>
        </div>
        <Link href="/knowledge/upload" className="btn-ghost text-sm flex items-center gap-2">
          <Plus size={14} />
          Upload Document
        </Link>
      </div>

      {/* Documents */}
      {docs.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <FileText size={40} className="mx-auto mb-4" style={{ color: 'var(--muted)' }} />
          <p className="text-sm font-bold mb-2" style={{ color: 'var(--secondary)' }}>No documents yet</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Upload legislative documents to ground the Policy AI's responses in law.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => {
            const colors = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.security;
            return (
              <div key={doc.id} className="glass-card p-5 flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
                >
                  <FileText size={18} style={{ color: colors.text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{doc.title}</p>
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                    >
                      {doc.category}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--secondary)' }}>{doc.source}</p>
                  <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--muted)' }}>
                    {doc.chunks?.length ?? 0} chunks · uploaded by {doc.uploadedBy}
                  </p>
                </div>
                <Link
                  href={`/knowledge/${doc.id}`}
                  className="btn-ghost text-xs flex items-center gap-1 flex-shrink-0"
                >
                  View
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
