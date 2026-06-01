import { Router } from "express";
import { authenticate, type AuthRequest } from "../lib/auth.js";
import {
  getPersonalizedRecommendations,
  getTrendingRecommendations,
  getCuratedLists,
} from "../services/recommendations.js";

const router = Router();

router.get("/trending", async (_req, res, next) => {
  try {
    const books = await getTrendingRecommendations(12);
    res.json(books);
  } catch (e) {
    next(e);
  }
});

router.get("/curated", async (_req, res, next) => {
  try {
    const lists = await getCuratedLists();
    res.json(lists);
  } catch (e) {
    next(e);
  }
});

router.get("/for-you", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const books = await getPersonalizedRecommendations(req.user!.userId, 12);
    res.json(books);
  } catch (e) {
    next(e);
  }
});

export default router;
