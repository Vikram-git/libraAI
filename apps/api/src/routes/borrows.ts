import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { authenticate, requireRole, type AuthRequest } from "../lib/auth.js";
import { createNotification } from "../services/notifications.js";

const router = Router();
const BORROW_DAYS = 14;
const FINE_PER_DAY = 5;

router.use(authenticate);

router.get("/my", async (req: AuthRequest, res, next) => {
  try {
    const borrows = await prisma.borrow.findMany({
      where: { userId: req.user!.userId },
      include: { book: { include: { category: true } }, fine: true },
      orderBy: { borrowedAt: "desc" },
    });
    res.json(borrows);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const { bookId } = z.object({ bookId: z.string() }).parse(req.body);
    const userId = req.user!.userId;

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.available < 1) throw new AppError(400, "Book not available");

    const activeCount = await prisma.borrow.count({
      where: { userId, status: { in: ["ACTIVE", "OVERDUE"] } },
    });
    if (activeCount >= 5) throw new AppError(400, "Maximum 5 active borrows allowed");

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + BORROW_DAYS);

    const [borrow] = await prisma.$transaction([
      prisma.borrow.create({
        data: { userId, bookId, dueDate },
        include: { book: true },
      }),
      prisma.book.update({
        where: { id: bookId },
        data: { available: { decrement: 1 } },
      }),
    ]);

    res.status(201).json(borrow);
  } catch (e) {
    next(e);
  }
});

router.post("/issue", requireRole("LIBRARIAN", "ADMIN"), async (req, res, next) => {
  try {
    const { bookId, userId } = z
      .object({ bookId: z.string(), userId: z.string() })
      .parse(req.body);

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book || book.available < 1) throw new AppError(400, "Book not available");

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + BORROW_DAYS);

    const borrow = await prisma.$transaction(async (tx) => {
      const b = await tx.borrow.create({
        data: { userId, bookId, dueDate },
        include: { book: true, user: { select: { name: true, email: true } } },
      });
      await tx.book.update({
        where: { id: bookId },
        data: { available: { decrement: 1 } },
      });
      return b;
    });

    await createNotification(
      userId,
      "GENERAL",
      "Book issued",
      `"${book.title}" has been issued. Due: ${dueDate.toISOString().slice(0, 10)}.`,
    );

    res.status(201).json(borrow);
  } catch (e) {
    next(e);
  }
});

router.post("/:id/return", requireRole("LIBRARIAN", "ADMIN"), async (req, res, next) => {
  try {
    const borrow = await prisma.borrow.findUnique({
      where: { id: req.params.id },
      include: { book: true },
    });
    if (!borrow || borrow.status === "RETURNED") {
      throw new AppError(400, "Invalid borrow record");
    }

    const returnedAt = new Date();
    let fineAmount = 0;
    if (returnedAt > borrow.dueDate) {
      const daysLate = Math.ceil(
        (returnedAt.getTime() - borrow.dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      fineAmount = daysLate * FINE_PER_DAY;
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.borrow.update({
        where: { id: borrow.id },
        data: { status: "RETURNED", returnedAt },
        include: { book: true },
      });
      await tx.book.update({
        where: { id: borrow.bookId },
        data: { available: { increment: 1 } },
      });
      if (fineAmount > 0) {
        await tx.fine.create({
          data: { userId: borrow.userId, borrowId: borrow.id, amount: fineAmount },
        });
        await createNotification(
          borrow.userId,
          "FINE",
          "Fine applied",
          `A fine of ₹${fineAmount} was applied for late return of "${borrow.book.title}".`,
        );
      }
      return updated;
    });

    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
