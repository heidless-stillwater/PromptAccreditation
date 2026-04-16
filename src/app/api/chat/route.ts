import { NextRequest, NextResponse } from 'next/server';
import { getGemini, MODELS } from '@/lib/gemini';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are the Policy Specialist for the Prompt App Suite — an expert in UK regulatory compliance. You provide actionable, law-grounded guidance based on:

1. **Online Safety Act 2023** — Ofcom regulated. Duties of care, age verification, content moderation for user-to-user services.
2. **Data Protection Act 2018 / UK GDPR** — ICO regulated. Lawful basis, data subject rights, retention, breach notification (72h).
3. **Site Security** — NCSC Cyber Essentials aligned. HTTPS, security headers, Firestore rules, secret management.

When answering:
- Cite specific legislative sections when possible
- Provide actionable remediation steps the developer can follow
- Flag the worst-case penalty for non-compliance
- Mention if an automated fix is available in PromptAccreditation
- Keep answers concise but complete
- Use markdown formatting for structured answers

You do NOT make up legislation. If you are uncertain, say so clearly.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, history = [] } = body;

    if (!question?.trim()) {
      return NextResponse.json({ error: 'No question provided' }, { status: 400 });
    }

    const genai = await getGemini();

    // 1. Context Retrieval (RAG)
    const { KBService } = await import('@/lib/services/kb-service');
    const relevantChunks = await KBService.searchSimilarChunks(question, 5);
    
    const contextText = relevantChunks.length > 0 
      ? `CONTEXT FROM YOUR KNOWLEDGE BASE:\n${relevantChunks.map(c => `[From ${c.docTitle || 'Doc'}]: ${c.content}`).join('\n---\n')}`
      : 'No specific matching documents found in Knowledge Base. Using general regulatory knowledge.';

    // Format history for Gemini SDK
    const formattedHistory = history.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await (genai as any).models.generateContentStream({
            model: MODELS.RAG,
            systemInstruction: {
                role: 'system',
                parts: [{ text: `${SYSTEM_PROMPT}\n\n${contextText}` }]
            },
            contents: [
                ...formattedHistory,
                { role: 'user', parts: [{ text: question }] }
            ],
          });

          const encoder = new TextEncoder();
          for await (const chunk of response) {
            const txt = chunk.text;
            if (txt) {
              controller.enqueue(encoder.encode(txt));
            }
          }
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Gemini error';
          controller.enqueue(new TextEncoder().encode(`\n\n*Error: ${msg}*`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
