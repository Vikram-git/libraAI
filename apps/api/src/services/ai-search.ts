import { prisma } from "../lib/prisma.js";
import { createEmbedding } from "./openai.js";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Semantic search using stored JSON embeddings (SQLite) or pgvector (Postgres) */
export async function semanticSearch(query: string, limit = 12) {
  const isPostgres = process.env.DATABASE_URL?.startsWith("postgresql");

  if (isPostgres && process.env.OPENAI_API_KEY) {
    const embedding = await createEmbedding(query);
    const vectorStr = `[${embedding.join(",")}]`;
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        title: string;
        author: string;
        description: string | null;
        coverUrl: string | null;
        available: number;
        similarity: number;
      }>
    >(
      `
      SELECT b.id, b.title, b.author, b.description, b."coverUrl", b.available,
             1 - (b.embedding <=> $1::vector) AS similarity
      FROM "Book" b
      WHERE b.embedding IS NOT NULL
      ORDER BY b.embedding <=> $1::vector
      LIMIT $2
      `,
      vectorStr,
      limit,
    );
    return rows;
  }

  if (process.env.OPENAI_API_KEY) {
    const queryEmbedding = await createEmbedding(query);
    const books = await prisma.book.findMany({
      where: { embedding: { not: null } },
      include: { category: true },
    });

    const scored = books
      .map((book) => {
        try {
          const stored = JSON.parse(book.embedding!) as number[];
          return {
            id: book.id,
            title: book.title,
            author: book.author,
            description: book.description,
            coverUrl: book.coverUrl,
            available: book.available,
            similarity: cosineSimilarity(queryEmbedding, stored),
          };
        } catch {
          return null;
        }
      })
      .filter((b): b is NonNullable<typeof b> => b !== null)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    if (scored.length > 0) return scored;
  }

  return keywordSearch(query, limit);
}

/** Fallback keyword search when embeddings unavailable */
export async function keywordSearch(query: string, limit = 12) {
  const q = query.trim();
  if (!q) return [];

  return prisma.book.findMany({
    where: {
      OR: [
        { title: { contains: q } },
        { author: { contains: q } },
        { description: { contains: q } },
      ],
    },
    take: limit,
    include: { category: true },
  });
}
