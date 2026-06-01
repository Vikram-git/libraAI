import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { authenticate, requireRole, type AuthRequest } from "../lib/auth.js";
import { semanticSearch, keywordSearch } from "../services/ai-search.js";
import { getAlsoBorrowed } from "../services/recommendations.js";
import { createEmbedding, bookEmbeddingText } from "../services/openai.js";

const router = Router();

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  isbn: z.string().optional(),
  description: z.string().optional(),
  coverUrl: z.string().optional().or(z.literal("")),
  priceInr: z.number().min(0).optional(),
  publishedYear: z.number().int().optional(),
  totalCopies: z.number().int().min(1).default(1),
  categoryId: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 24, 100);
    const category = req.query.category as string | undefined;
    const q = req.query.q as string | undefined;
    const region = req.query.region as string | undefined;

    const indianSlugs = ["indian-literature", "history-biography"];
    const foreignSlugs = [
      "international-classics",
      "fiction",
      "science",
      "business",
      "computer-science",
      "self-help",
    ];

    const where = {
      ...(category ? { category: { slug: category } } : {}),
      ...(region === "indian" ? { category: { slug: { in: indianSlugs } } } : {}),
      ...(region === "foreign" ? { category: { slug: { in: foreignSlugs } } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { author: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {}),
    };

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: { category: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { title: "asc" },
      }),
      prisma.book.count({ where }),
    ]);

    res.json({ books, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    next(e);
  }
});

router.get("/search/semantic", async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "");
    if (!q.trim()) throw new AppError(400, "Query is required");

    try {
      const results = await semanticSearch(q);
      res.json({ results, mode: "semantic" });
    } catch {
      const results = await keywordSearch(q);
      res.json({ results, mode: "keyword" });
    }
  } catch (e) {
    next(e);
  }
});

router.get("/isbn/:isbn", async (req, res, next) => {
  try {
    const book = await prisma.book.findUnique({
      where: { isbn: req.params.isbn },
      include: { category: true },
    });
    if (!book) throw new AppError(404, "Book not found");
    res.json(book);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const book = await prisma.book.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });
    if (!book) throw new AppError(404, "Book not found");
    res.json(book);
  } catch (e) {
    next(e);
  }
});

router.get("/:id/also-borrowed", async (req, res, next) => {
  try {
    const related = await getAlsoBorrowed(req.params.id);
    res.json(related);
  } catch (e) {
    next(e);
  }
});

router.post("/", authenticate, requireRole("LIBRARIAN", "ADMIN"), async (req, res, next) => {
  try {
    const data = bookSchema.parse(req.body);
    const book = await prisma.book.create({
      data: {
        ...data,
        coverUrl: data.coverUrl || null,
        available: data.totalCopies,
      },
      include: { category: true },
    });

    try {
      const text = bookEmbeddingText(book);
      const embedding = await createEmbedding(text);
      const isPostgres = process.env.DATABASE_URL?.startsWith("postgresql");
      if (isPostgres) {
        const vectorStr = `[${embedding.join(",")}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE "Book" SET embedding = $1::vector WHERE id = $2`,
          vectorStr,
          book.id,
        );
      } else {
        await prisma.book.update({
          where: { id: book.id },
          data: { embedding: JSON.stringify(embedding) },
        });
      }
    } catch {
      // Embeddings optional without OpenAI
    }

    res.status(201).json(book);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", authenticate, requireRole("LIBRARIAN", "ADMIN"), async (req, res, next) => {
  try {
    const data = bookSchema.partial().parse(req.body);
    const existing = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, "Book not found");

    let available = existing.available;
    if (data.totalCopies !== undefined) {
      const borrowed = existing.totalCopies - existing.available;
      available = Math.max(0, data.totalCopies - borrowed);
    }

    const book = await prisma.book.update({
      where: { id: req.params.id },
      data: {
        ...data,
        coverUrl: data.coverUrl === "" ? null : data.coverUrl ?? undefined,
        available: data.totalCopies !== undefined ? available : undefined,
      },
      include: { category: true },
    });
    res.json(book);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", authenticate, requireRole("LIBRARIAN", "ADMIN"), async (req, res, next) => {
  try {
    const activeBorrows = await prisma.borrow.count({
      where: { bookId: req.params.id, status: { in: ["ACTIVE", "OVERDUE"] } },
    });
    if (activeBorrows > 0) {
      throw new AppError(400, "Cannot delete book with active borrows");
    }
    await prisma.book.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
