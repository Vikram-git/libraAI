import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticate, type AuthRequest } from "../lib/auth.js";
import { param } from "../lib/params.js";

const router = Router();

router.use(authenticate);

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(notifications);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/read", async (req: AuthRequest, res, next) => {
  try {
    const notification = await prisma.notification.updateMany({
      where: { id: param(req, "id"), userId: req.user!.userId },
      data: { read: true },
    });
    res.json({ updated: notification.count });
  } catch (e) {
    next(e);
  }
});

router.post("/read-all", async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
