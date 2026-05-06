import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, FileText, Database, User, Calendar, Bot } from 'lucide-react';
import { KBService } from '@/lib/services/kb-service';
import { format } from 'date-fns';
import type { Metadata } from 'next';
import { KnowledgeViewer } from '@/components/knowledge/knowledge-viewer';

interface Props {
  params: Promise<{ id: string }>;
}

/* 
export async function generateStaticParams() {
  const docs = await KBService.getAllDocuments();
  return docs.map((doc) => ({
    id: doc.id,
  }));
}
*/

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await KBService.getDocumentWithChunks(id);
  return { title: data?.doc?.title || 'Knowledge Detail' };
}

export default async function KBDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await KBService.getDocumentWithChunks(id);
  
  if (!data || !data.doc) notFound();
  
  const { doc, chunks } = data;

  return (
    <main className="p-8 max-w-5xl mx-auto animate-fade-in">
      <Link href="/knowledge" className="flex items-center gap-2 text-sm mb-8 hover:underline" style={{ color: 'var(--secondary)' }}>
        <ChevronLeft size={14} />
        Back to Library
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metadata & Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
              <FileText size={24} className="text-blue-500" />
            </div>
            <h1 className="text-xl font-bold mb-4">{doc.title}</h1>
            
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Database size={14} className="opacity-40" />
                <span className="opacity-60">Category:</span>
                <span className="badge-muted uppercase">{doc.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <User size={14} className="opacity-40" />
                <span className="opacity-60">Uploaded by:</span>
                <span>{doc.uploadedBy || 'System'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar size={14} className="opacity-40" />
                <span className="opacity-60">Ingested:</span>
                <span>{doc.uploadedAt ? format(new Date(doc.uploadedAt), 'MMM dd, yyyy') : 'Unknown'}</span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
              <Link href="/knowledge/chat" className="btn-primary w-full justify-center">
                <Bot size={16} />
                Ask Policy AI
              </Link>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xs font-bold tracking-widest uppercase mb-4 opacity-40">Indexing Data</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="opacity-40">Total Chunks</span>
                <span className="font-mono">{chunks.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="opacity-40">Context Type</span>
                <span className="font-mono">RAG Grounding</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Content Viewer */}
        <div className="lg:col-span-2 space-y-6">
          <KnowledgeViewer content={doc.content} />

          {/* Visualization of chunks */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold tracking-widest uppercase px-2 opacity-40">AI Processing Nodes (Chunks)</h2>
            <div className="grid grid-cols-1 gap-2">
              {chunks.map((chunk, idx) => (
                <div key={chunk.id} className="p-4 rounded-xl bg-white/5 border border-white/5 text-[11px] font-mono leading-relaxed opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between mb-2 pb-2 border-b border-white/5">
                    <span className="text-blue-400">CHUNK_{idx + 1}</span>
                    <span className="opacity-40">{chunk.id}</span>
                  </div>
                  {chunk.content.slice(0, 200)}...
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
