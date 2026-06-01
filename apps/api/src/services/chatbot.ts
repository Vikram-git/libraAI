import { prisma } from "../lib/prisma.js";
import { openai } from "./openai.js";
import { semanticSearch, keywordSearch } from "./ai-search.js";
import type { Book } from "@prisma/client";

const SYSTEM_PROMPT = `You are LibraAI, a friendly and knowledgeable library assistant for an Indian and international book catalog.
Answer concisely. Recommend specific books from the catalog when relevant. Mention availability when known.`;

type BookResult = Awaited<ReturnType<typeof keywordSearch>>[number];

function smartFallbackReply(
  message: string,
  books: BookResult[],
  borrows: Array<{ book: Book; dueDate: Date }>,
): string {
  const lower = message.toLowerCase();

  if (lower.includes("borrowed") || lower.includes("my book")) {
    if (borrows.length === 0) {
      return "You don't have any active borrows right now. Browse our catalog — we have Indian classics, international bestsellers, and tech books!";
    }
    return `You currently have ${borrows.length} book(s) borrowed:\n${borrows
      .map((b) => `• **${b.book.title}** by ${b.book.author} (due ${b.dueDate.toLocaleDateString()})`)
      .join("\n")}`;
  }

  if (lower.includes("python") || lower.includes("programming") || lower.includes("coding")) {
    const tech = books.filter((b) =>
      /python|code|program|algorithm|pragmatic|machine learning/i.test(`${b.title} ${b.author}`),
    );
    if (tech.length) {
      return `For programming, I'd recommend:\n${tech
        .slice(0, 4)
        .map((b) => `• **${b.title}** by ${b.author}${b.available ? ` (${b.available} available)` : ""}`)
        .join("\n")}\n\nThese are great for beginners to advanced learners.`;
    }
  }

  if (
    lower.includes("indian") ||
    lower.includes("india") ||
    lower.includes("hindi") ||
    lower.includes("narayan") ||
    lower.includes("bhagat")
  ) {
    const indian = books.filter((b) =>
      /narayan|rushdie|roy|seth|bhagat|tripathi|bond|premchand|singh|adiga|kalam/i.test(
        `${b.title} ${b.author}`,
      ),
    );
    if (indian.length) {
      return `Our Indian literature collection includes:\n${indian
        .slice(0, 5)
        .map((b) => `• **${b.title}** by ${b.author}`)
        .join("\n")}\n\nFrom R.K. Narayan to Chetan Bhagat — explore the full Indian Literature category!`;
    }
  }

  if (lower.includes("fiction") || lower.includes("novel") || lower.includes("story")) {
    return `We have amazing fiction! Try:\n${books
      .slice(0, 5)
      .map((b) => `• **${b.title}** by ${b.author}`)
      .join("\n")}\n\nUse semantic search for queries like "novels similar to Harry Potter".`;
  }

  if (lower.includes("data science") || lower.includes("machine learning") || lower.includes("ai")) {
    const ml = books.find((b) => /machine learning|algorithm|python/i.test(b.title));
    if (ml) {
      return `For Data Science & AI, start with **${ml.title}** by ${ml.author}. Also check our Computer Science section for Python and algorithms.`;
    }
  }

  if (lower.includes("beginner") || lower.includes("start")) {
    return `Great picks for beginners:\n${books
      .slice(0, 4)
      .map((b) => `• **${b.title}** by ${b.author} — ${b.description?.slice(0, 80) ?? ""}...`)
      .join("\n")}`;
  }

  if (books.length > 0) {
    return `Based on your question, here are some books I'd suggest:\n${books
      .slice(0, 5)
      .map((b) => `• **${b.title}** by ${b.author}${b.available ? ` ✓ ${b.available} copies` : ""}`)
      .join(
        "\n",
      )}\n\nAsk me about Indian authors, programming, fiction, or your borrowed books anytime!`;
  }

  return "Welcome to LibraAI! I can help you find books by Indian and international authors, check your borrows, or suggest reads. Try: 'Suggest a Python book' or 'Indian classic novels'.";
}

export async function librarianChat(userId: string | null, message: string) {
  let borrows: Array<{ book: Book; dueDate: Date }> = [];

  if (userId) {
    borrows = await prisma.borrow.findMany({
      where: { userId, status: { in: ["ACTIVE", "OVERDUE"] } },
      include: { book: true },
      take: 10,
    });
  }

  let books: BookResult[] = [];
  try {
    books = await semanticSearch(message, 8);
  } catch {
    books = await keywordSearch(message, 8);
  }

  let context = "";
  if (borrows.length) {
    context += `\nUser's active borrows: ${borrows.map((b) => `"${b.book.title}" (due ${b.dueDate.toISOString().slice(0, 10)})`).join(", ")}`;
  }
  if (books.length) {
    context += `\nRelevant catalog books:\n${books
      .map((b) => `- ${b.title} by ${b.author} (${b.available} available)`)
      .join("\n")}`;
  }

  if (openai && process.env.OPENAI_API_KEY) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + context },
          { role: "user", content: message },
        ],
        max_tokens: 600,
      });
      return {
        reply:
          completion.choices[0]?.message?.content ??
          smartFallbackReply(message, books, borrows),
        suggestedBooks: books.slice(0, 6),
        mode: "openai" as const,
      };
    } catch {
      // fall through to smart fallback
    }
  }

  return {
    reply: smartFallbackReply(message, books, borrows),
    suggestedBooks: books.slice(0, 6),
    mode: "smart" as const,
  };
}
