import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../lib/errors.js";
import { authenticate, type AuthRequest } from "../lib/auth.js";
import { param } from "../lib/params.js";

const router = Router();

router.use(authenticate);

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const wishlists = await prisma.wishlist.findMany({
      where: { userId: req.user!.userId },
      include: { items: { include: { book: { include: { category: true } } } } },
    });
    res.json(wishlists);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const { name } = z.object({ name: z.string().min(1) }).parse(req.body);
    const wishlist = await prisma.wishlist.create({
      data: { userId: req.user!.userId, name },
    });
    res.status(201).json(wishlist);
  } catch (e) {
    next(e);
  }
});

router.post("/:id/items", async (req: AuthRequest, res, next) => {
  try {
    const { bookId } = z.object({ bookId: z.string() }).parse(req.body);
    const wishlist = await prisma.wishlist.findFirst({
      where: { id: param(req, "id"), userId: req.user!.userId },
    });
    if (!wishlist) throw new AppError(404, "Wishlist not found");

    const item = await prisma.wishlistItem.create({
      data: { wishlistId: wishlist.id, bookId },
      include: { book: true },
    });
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

router.delete("/:wishlistId/items/:itemId", async (req: AuthRequest, res, next) => {
  try {
    const wishlist = await prisma.wishlist.findFirst({
      where: { id: param(req, "wishlistId"), userId: req.user!.userId },
    });
    if (!wishlist) throw new AppError(404, "Wishlist not found");

    await prisma.wishlistItem.delete({ where: { id: param(req, "itemId") } });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
