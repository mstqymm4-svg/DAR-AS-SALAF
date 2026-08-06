import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { env } from "./config/env";
import { apiRateLimiter } from "./middleware/rateLimit";
import { errorHandler, notFound } from "./middleware/error";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import { logger } from "./utils/logger";

const app = express();

// ── Security ───────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      // allow same-origin / no-origin (curl, server-to-server) and whitelisted origins
      if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ── Body parsing ────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ─────────────────────────────────────────────
app.use(morgan(env.isProd ? "combined" : "dev", { stream: { write: (m) => logger.info(m.trim()) } }));

// ── Static uploads (local storage) ──────────────────────
app.use("/uploads", express.static(path.resolve(env.storage.uploadDir)));

// ── Rate limiting (global) ───────────────────────────────
app.use("/api", apiRateLimiter);

// ── Routes ───────────────────────────────────────────────
app.get("/", (_req, res) => res.json({ name: "DAR AL ULOOM API", status: "running" }));
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);

// ── 404 + error handler (must be last) ──────────────────
app.use(notFound);
app.use(errorHandler);

export default app;