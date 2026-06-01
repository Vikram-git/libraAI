import { prisma } from "../lib/prisma.js";

async function getBorrowTrends() {
  const since = new Date();
  since.setMonth(since.getMonth() - 12);

  const borrows = await prisma.borrow.findMany({
    where: { borrowedAt: { gte: since } },
    select: { borrowedAt: true },
  });

  const counts = new Map<string, number>();
  for (const b of borrows) {
    const month = b.borrowedAt.toISOString().slice(0, 7);
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
}

export async function getAdminAnalytics() {
  const [
    totalBooks,
    totalMembers,
    activeBorrows,
    overdueBorrows,
    totalFinesCollected,
    pendingFines,
    mostBorrowed,
    categoryPopularity,
    borrowTrends,
    activeMembers,
  ] = await Promise.all([
    prisma.book.count(),
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.borrow.count({ where: { status: "ACTIVE" } }),
    prisma.borrow.count({ where: { status: "OVERDUE" } }),
    prisma.fine.aggregate({ where: { paid: true }, _sum: { amount: true } }),
    prisma.fine.aggregate({ where: { paid: false }, _sum: { amount: true } }),
    prisma.borrow.groupBy({
      by: ["bookId"],
      _count: { bookId: true },
      orderBy: { _count: { bookId: "desc" } },
      take: 10,
    }),
    prisma.book.groupBy({
      by: ["categoryId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    getBorrowTrends(),
    prisma.borrow.groupBy({
      by: ["userId"],
      where: { status: "ACTIVE" },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }),
  ]);

  const bookIds = mostBorrowed.map((b) => b.bookId);
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: { id: true, title: true, author: true, coverUrl: true },
  });
  const bookMap = Object.fromEntries(books.map((b) => [b.id, b]));

  const categoryIds = categoryPopularity
    .map((c) => c.categoryId)
    .filter((id): id is string => Boolean(id));
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const memberIds = activeMembers.map((m) => m.userId);
  const members = await prisma.user.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true, email: true },
  });
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));

  return {
    overview: {
      totalBooks,
      totalMembers,
      activeBorrows,
      overdueBorrows,
      finesCollected: totalFinesCollected._sum.amount ?? 0,
      pendingFines: pendingFines._sum.amount ?? 0,
    },
    mostBorrowed: mostBorrowed.map((b) => ({
      book: bookMap[b.bookId],
      count: b._count.bookId,
    })),
    categoryPopularity: categoryPopularity.map((c) => ({
      category: c.categoryId ? catMap[c.categoryId] : { name: "Uncategorized" },
      count: c._count.id,
    })),
    borrowTrends,
    activeMembers: activeMembers.map((m) => ({
      user: memberMap[m.userId],
      activeBorrows: m._count.userId,
    })),
  };
}
