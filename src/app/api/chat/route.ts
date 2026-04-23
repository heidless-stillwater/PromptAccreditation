import { NextRequest, NextResponse } from 'next/server';
import { getGemini, MODELS } from '@/lib/gemini';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `You are the Sovereign Policy Specialist for the Prompt App Suite — a high-fidelity expert in UK and EU regulatory compliance. You provide actionable, law-grounded guidance based on:

1. **Online Safety Act 2023 (UK)** — Ofcom regulated. Focus on Illegal Content Duties and Highly Effective Age Assurance (HEAA) for restricted content. Penalties up to 10% global turnover.
2. **Data Protection Act 2018 / UK GDPR** — ICO regulated. Emphasis on lawful basis, DPA compliance, and 72h breach notification.
3. **EU AI Act** — Transparency obligations for chatbots (Article 52) and rigorous documentation for GPAI providers (Article 53). Risk classification: High-Risk vs Limited-Risk.
4. **Site Security** — NCSC Cyber Essentials. HTTPS, HSTS, secure Firestore rules, and AES-256-GCM secret management.
5. **IP & Licensing Sovereignty** — Grounded in CDSM Article 4(3) regarding opt-out mechanisms for training data and provenance tracking.
6. **AI Accessibility (WCAG 2.1)** — POUR principles. Specific focus on Success Criteria 4.1.3 (Status Messages) and 2.1.1 (Keyboard Accessibility) for conversational AI.

When answering:
- Cite specific Articles (e.g., "Under EU AI Act Article 52...") when Knowledge Base context allows.
- Provide step-by-step implementation logic for the Prompt Suite.
- Highlight the "Sovereign Remediation" path if an automated fix exists.
- Flag the maximum regulatory penalty for non-compliance.
- Maintain a clinical, professional, and precise tone.

You do NOT hallucinate legislation. If the Knowledge Base does not contain a specific section, provide general guidance based on your internal training but flag it as "General Regulatory Advice".`;

export async function POST(req: NextRequest) {
  try {
    const { getSessionUser } = await import('@/lib/auth');
    const { EntitlementService } = await import('@/lib/services/entitlements');
    
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    
    const tier = await EntitlementService.getAccreditationTier(user.uid);
    if (!EntitlementService.hasFeature(tier, 'aiChat')) {
      return NextResponse.json({ 
        error: 'AI Policy Chat is a Professional feature. Please upgrade in Settings.' 
      }, { status: 403 });
    }

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
          const response = await genai.models.generateContentStream({
            model: MODELS.RAG,
            config: {
              systemInstruction: `${SYSTEM_PROMPT}\n\n${contextText}`,
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
