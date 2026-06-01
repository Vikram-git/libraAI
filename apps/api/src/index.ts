import "dotenv/config";
import app from "./app.js";

const PORT = Number(process.env.PORT) || 4000;

// Vercel sets VERCEL=1 — export app only, no listen()
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`LibraAI API running on http://localhost:${PORT}`);
  });
}

export default app;
