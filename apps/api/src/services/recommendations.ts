import { prisma } from "../lib/prisma.js";

const INDIAN_SLUGS = ["indian-literature", "history-biography"];
const FOREIGN_SLUGS = ["international-classics", "fiction", "science", "business"];

/** Collaborative filtering: users who borrowed X also borrowed Y */
export async function getAlsoBorrowed(bookId: string, limit = 8) {
  const coBorrowers = await prisma.borrow.findMany({
    where: { bookId },
    select: { userId: true },
    distinct: ["userId"],
  });
  const userIds = coBorrowers.map((b) => b.userId);
  if (userIds.length === 0) return [];

  const related = await prisma.borrow.groupBy({
    by: ["bookId"],
    where: { userId: { in: userIds }, bookId: { not: bookId } },
    _count: { bookId: true },
    orderBy: { _count: { bookId: "desc" } },
    take: limit,
  });

  const books = await prisma.book.findMany({
    where: { id: { in: related.map((r) => r.bookId) } },
    include: { category: true },
  });
  const bookMap = Object.fromEntries(books.map((b) => [b.id, b]));

  return related.map((r) => ({
    ...bookMap[r.bookId],
    count: r._count.bookId,
  }));
}

/** Personalized recommendations from borrow history */
export async function getPersonalizedRecommendations(userId: string, limit = 12) {
  const borrowed = await prisma.borrow.findMany({
    where: { userId },
    include: { book: { include: { category: true } } },
    orderBy: { borrowedAt: "desc" },
    take: 20,
  });

  const borrowedIds = borrowed.map((b) => b.bookId);
  const categoryIds = [
    ...new Set(
      borrowed
        .map((b) => b.book.categoryId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [byCategory, indianPicks, foreignPicks, popular] = await Promise.all([
    categoryIds.length
      ? prisma.book.findMany({
          where: {
            id: { notIn: borrowedIds },
            categoryId: { in: categoryIds },
            available: { gt: 0 },
          },
          take: limit,
          include: { category: true },
        })
      : [],
    prisma.book.findMany({
      where: {
        id: { notIn: borrowedIds },
        category: { slug: { in: INDIAN_SLUGS } },
        available: { gt: 0 },
      },
      take: 4,
      include: { category: true },
    }),
    prisma.book.findMany({
      where: {
        id: { notIn: borrowedIds },
        category: { slug: { in: FOREIGN_SLUGS } },
        available: { gt: 0 },
      },
      take: 4,
      include: { category: true },
    }),
    prisma.book.findMany({
      where: { id: { notIn: borrowedIds }, available: { gt: 0 } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { category: true },
    }),
  ]);

  const merged = [...byCategory, ...indianPicks, ...foreignPicks, ...popular];
  const seen = new Set<string>();
  return merged.filter((b) => {
    if (seen.has(b.id)) return false;
    seen.add(b.id);
    return true;
  }).slice(0, limit);
}

/** Trending / featured for homepage (guests + logged in) */
export async function getTrendingRecommendations(limit = 12) {
  const borrowCounts = await prisma.borrow.groupBy({
    by: ["bookId"],
    _count: { bookId: true },
    orderBy: { _count: { bookId: "desc" } },
    take: 6,
  });

  const popularIds = borrowCounts.map((b) => b.bookId);
  const [popular, indian, foreign, latest] = await Promise.all([
    popularIds.length
      ? prisma.book.findMany({
          where: { id: { in: popularIds } },
          include: { category: true },
        })
      : [],
    prisma.book.findMany({
      where: { category: { slug: "indian-literature" } },
      take: 4,
      include: { category: true },
    }),
    prisma.book.findMany({
      where: { category: { slug: { in: ["international-classics", "fiction"] } } },
      take: 4,
      include: { category: true },
    }),
    prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { category: true },
    }),
  ]);

  const merged = [...popular, ...indian, ...foreign, ...latest];
  const seen = new Set<string>();
  return merged
    .filter((b) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    })
    .slice(0, limit);
}

/** AI-style curated lists without OpenAI */
export async function getCuratedLists() {
  const [indianAuthors, internationalBestsellers, techMustRead, selfHelp] =
    await Promise.all([
      prisma.book.findMany({
        where: { category: { slug: "indian-literature" } },
        take: 8,
        include: { category: true },
      }),
      prisma.book.findMany({
        where: { category: { slug: { in: ["international-classics", "fiction"] } } },
        take: 8,
        include: { category: true },
      }),
      prisma.book.findMany({
        where: { category: { slug: "computer-science" } },
        take: 6,
        include: { category: true },
      }),
      prisma.book.findMany({
        where: { category: { slug: "self-help" } },
        take: 6,
        include: { category: true },
      }),
    ]);

  return {
    indianAuthors: { title: "Indian Authors", subtitle: "From Premchand to Chetan Bhagat", books: indianAuthors },
    internationalBestsellers: {
      title: "International Bestsellers",
      subtitle: "Classics and modern favorites",
      books: internationalBestsellers,
    },
    techMustRead: { title: "Tech & Programming", subtitle: "CS, ML, and software craft", books: techMustRead },
    selfHelp: { title: "Self Improvement", subtitle: "Habits, mindset, and growth", books: selfHelp },
  };
}
