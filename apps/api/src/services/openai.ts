import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

export const openai = apiKey
  ? new OpenAI({ apiKey })
  : null;

export function requireOpenAI() {
  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return openai;
}

export async function createEmbedding(text: string): Promise<number[]> {
  const client = requireOpenAI();
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

export function bookEmbeddingText(book: {
  title: string;
  author: string;
  description?: string | null;
  category?: { name: string } | null;
}) {
  return [
    book.title,
    book.author,
    book.category?.name,
    book.description,
  ]
    .filter(Boolean)
    .join(" — ");
}
