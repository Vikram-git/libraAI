import { Router } from "express";
import { z } from "zod";
import { authenticate, type AuthRequest } from "../lib/auth.js";
import { librarianChat } from "../services/chatbot.js";

const router = Router();

router.post("/chat", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { message } = z.object({ message: z.string().min(1) }).parse(req.body);
    const result = await librarianChat(req.user!.userId, message);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/chat/guest", async (req, res, next) => {
  try {
    const { message } = z.object({ message: z.string().min(1) }).parse(req.body);
    const result = await librarianChat(null, message);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
