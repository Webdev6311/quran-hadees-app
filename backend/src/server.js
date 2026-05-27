import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

import quranRoutes from "../routes/quranRoutes.js";
import quranKeywordSearchRoutes from "../routes/quranKeywordSearchRoutes.js";
import pagesRoutes from "../routes/pagesRoutes.js";
import juzRoutes from "../routes/juzRoutes.js";
import hadithRoutes from "../routes/hadithRoutes.js";
import contactRoutes from "../routes/contactRoutes.js";


// Load env from default .env first
dotenv.config();
if (!process.env.MONGO_URI) {
  const cwdFallback = path.resolve(process.cwd(), "dotenv");
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const srcRelativeFallback = path.resolve(__dirname, "../dotenv");

  if (fs.existsSync(cwdFallback)) {
    dotenv.config({ path: cwdFallback });
    console.log("[env] Loaded variables from ./dotenv");
  } else if (fs.existsSync(srcRelativeFallback)) {
    dotenv.config({ path: srcRelativeFallback });
    console.log("[env] Loaded variables from backend/dotenv");
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS middleware
// If `CORS_ORIGINS` is NOT provided, we default to allowing all origins.
// This prevents production CORS breakage when frontend+backend are deployed.
const corsOriginsEnv = (process.env.CORS_ORIGINS || "").trim();
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  ...(corsOriginsEnv
    ? corsOriginsEnv
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean)
    : []),
];
const originSet = new Set(allowedOrigins);
const shouldRestrictCors = Boolean(corsOriginsEnv);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (no origin header).
      if (!origin) {
        return callback(null, true);
      }

      // If we don't have explicit origins configured, allow everything.
      if (!shouldRestrictCors) {
        return callback(null, true);
      }

      if (originSet.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    

  })
);

// ✅ Middleware

app.use(express.json());

// ✅ Validate env variables
if (!process.env.MONGO_URI || typeof process.env.MONGO_URI !== "string") {
  console.error(
    "❌ Missing MONGO_URI. Add it to .env or backend/dotenv (without angle brackets)."
  );
  process.exit(1);
}

const MONGO_URI = String(process.env.MONGO_URI).trim();
if (!MONGO_URI || MONGO_URI.toLowerCase() === "undefined") {
  console.error("❌ MONGO_URI is empty or 'undefined'. Check your env files.");
  process.exit(1);
}
if (MONGO_URI.includes("<") || MONGO_URI.includes(">")) {
  console.error("❌ MONGO_URI contains angle brackets. Replace placeholders with real values.");
  process.exit(1);
}

// ✅ MongoDB connect
const mongoConnectOptions = {
  dbName: process.env.MONGO_DB_NAME || "quran_data",
};

mongoose
  .connect(MONGO_URI, mongoConnectOptions)
  .then(() =>
    console.log(`✅ MongoDB Connected to ${mongoConnectOptions.dbName} database`)
  )
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// ✅ Base route
app.get("/", (req, res) => {
  res.send("Quran-Hadees API is running...");
});

// ✅ API routes
app.use("/api/juz", juzRoutes);
app.use("/api", quranRoutes);
app.use("/api", quranKeywordSearchRoutes);
app.use("/api/pages", pagesRoutes); // ✅ Added route for Pages API
app.use("/api/hadith", hadithRoutes);
app.use("/api/contact", contactRoutes);

// ✅ Local runtime only; Vercel uses exported app as serverless handler.
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;
