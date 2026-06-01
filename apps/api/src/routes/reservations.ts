import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { authenticate, type AuthRequest } from "../lib/auth.js";
import { createNotification } from "../services/notifications.js";

const router = Router();

router.use(authenticate);

router.get("/my", async (req: AuthRequest, res, next) => {
  try {
    const reservations = await prisma.reservation.findMany({
      where: { userId: req.user!.userId, fulfilled: false },
      include: { book: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(reservations);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const { bookId } = z.object({ bookId: z.string() }).parse(req.body);
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) throw new AppError(404, "Book not found");
    if (book.available > 0) {
      throw new AppError(400, "Book is available — borrow it directly");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const reservation = await prisma.reservation.create({
      data: { userId: req.user!.userId, bookId, expiresAt },
      include: { book: true },
    });

    await createNotification(
      req.user!.userId,
      "RESERVATION",
      "Reservation confirmed",
      `You reserved "${book.title}". We'll notify you when it's available.`,
    );

    res.status(201).json(reservation);
  } catch (e) {
    next(e);
  }
});

export default router;
