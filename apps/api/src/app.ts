import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import bookRoutes from "./routes/books.js";
import borrowRoutes from "./routes/borrows.js";
import recommendationRoutes from "./routes/recommendations.js";
import aiRoutes from "./routes/ai.js";
import analyticsRoutes from "./routes/analytics.js";
import notificationRoutes from "./routes/notifications.js";
import wishlistRoutes from "./routes/wishlists.js";
import reservationRoutes from "./routes/reservations.js";
import categoryRoutes from "./routes/categories.js";
import isbnRoutes from "./routes/isbn-lookup.js";
import itemRoutes from "./routes/items.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) ?? [
  "http://localhost:5173",
  "https://libra-ai.vercel.app",
  "https://libraai.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else if (process.env.VERCEL === "1" && origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(null, allowedOrigins[0]);
      }
    },
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok", name: "LibraAI API", docs: "/health" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", name: "LibraAI API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrows", borrowRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/wishlists", wishlistRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/isbn", isbnRoutes);
app.use("/items", itemRoutes);
app.use("/api/items", itemRoutes);

app.use(errorHandler);

export default app;
