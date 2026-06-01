import { Router } from "express";
import { authenticate, requireRole } from "../lib/auth.js";
import { getAdminAnalytics } from "../services/analytics.js";
import { processDueDateReminders } from "../services/notifications.js";

const router = Router();

router.use(authenticate, requireRole("ADMIN", "LIBRARIAN"));

router.get("/dashboard", async (_req, res, next) => {
  try {
    const data = await getAdminAnalytics();
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post("/process-reminders", async (_req, res, next) => {
  try {
    const result = await processDueDateReminders();
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
