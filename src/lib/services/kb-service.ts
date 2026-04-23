import { accreditationDb } from '../firebase-admin';
import { KBDocument, KBChunk, PolicyCategory } from '../types';
import { Timestamp } from 'firebase-admin/firestore';
import { getGemini, MODELS } from '../gemini';

/**
 * Sanitize Firestore data for RSC.
 */
function sanitize<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (data instanceof Timestamp) return (data.toDate().toISOString() as unknown) as T;
  if (data instanceof Date) return (data.toISOString() as unknown) as T;
  if (Array.isArray(data)) return data.map(sanitize) as unknown as T;
  if (typeof data === 'object') {
    const obj = { ...data } as any;
    for (const key in obj) {
      obj[key] = sanitize(obj[key]);
    }
    return obj;
  }
  return data;
}

/**
 * Simple Cosine Similarity implementation.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const KBService = {
  /** 
   * Chunk, Embed, and Store.
   */
  async chunkAndEmbed(title: string, content: string, category: PolicyCategory, uploadedBy: string): Promise<string> {
    const CHUNK_SIZE = 1200; 
    const chunks: string[] = [];
    
    // Split into chunks suitable for embedding
    for (let i = 0; i < content.length; i += CHUNK_SIZE) {
      chunks.push(content.slice(i, i + CHUNK_SIZE));
    }

    const docId = accreditationDb.collection('kb_documents').doc().id;
    const genai = await getGemini();

    const kbDoc: KBDocument = {
      id: docId,
      title,
      source: 'Uploaded Document',
      category,
      content,
      uploadedBy,
      uploadedAt: new Date(),
      updatedAt: new Date(),
      chunkCount: chunks.length
    };

    await accreditationDb.collection('kb_documents').doc(docId).set(kbDoc);

    const chunkPromises = chunks.map(async (chunk, idx) => {
      const result = await genai.models.embedContent({
        model: MODELS.EMBEDDING,
        contents: [chunk]
      });
      const embedding = result.embeddings?.[0]?.values;

      const chunkData: KBChunk = {
        id: `${docId}_chunk_${idx}`,
        documentId: docId,
        content: chunk,
        pageRef: `p${idx + 1}`,
        embedding, // Store the vector for retrieval
      };

      return accreditationDb
        .collection('kb_documents')
        .doc(docId)
        .collection('chunks')
        .doc(chunkData.id)
        .set(chunkData);
    });

    await Promise.all(chunkPromises);
    return docId;
  },

  /**
   * Semantic Search using Cosine Similarity.
   */
  async searchSimilarChunks(query: string, limit = 5): Promise<KBChunk[]> {
    const genai = await getGemini();
    
    // 1. Embed the user query
    const queryResult = await genai.models.embedContent({
      model: MODELS.EMBEDDING,
      contents: [query]
    });
    const queryVector = queryResult.embeddings?.[0]?.values;

    if (!queryVector) {
      console.error('[KBService] Failed to generate query embedding');
      return [];
    }

    // 2. Fetch recent chunks (Limited set for local compute)
    const docsSnap = await accreditationDb
      .collection('kb_documents')
      .orderBy('uploadedAt', 'desc')
      .limit(10)
      .get();

    if (docsSnap.empty) return [];

    const chunkFetchPromises = docsSnap.docs.map(async (doc) => {
      const chunksSnap = await doc.ref.collection('chunks').get();
      return chunksSnap.docs.map(d => ({ ...d.data(), docTitle: doc.data().title } as KBChunk));
    });

    const chunkResults = await Promise.all(chunkFetchPromises);
    const flatChunks = chunkResults.flat();

    // 3. Rank by Vector Similarity
    const scoredList = flatChunks
      .filter(chunk => chunk.embedding && Array.isArray(chunk.embedding))
      .map(chunk => {
        const similarity = cosineSimilarity(queryVector, chunk.embedding!);
        return { ...chunk, score: similarity };
      });

    // 4. Return top hits
    return sanitize(scoredList
      .sort((a, b) => b.score - a.score)
      .slice(0, limit) as KBChunk[]);
  },

  /**
   * Fetch a document and its associated chunks by ID.
   */
  async getDocumentWithChunks(id: string): Promise<{ doc: KBDocument | null; chunks: KBChunk[] }> {
    const docRef = accreditationDb.collection('kb_documents').doc(id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return { doc: null, chunks: [] };
    }
    
    const docData = { id: docSnap.id, ...docSnap.data() } as KBDocument;
    
    const chunksSnap = await docRef.collection('chunks').get();
    const chunks = chunksSnap.docs.map(d => ({ id: d.id, ...d.data() } as KBChunk));
    
    return sanitize({ doc: docData, chunks });
  }
};
