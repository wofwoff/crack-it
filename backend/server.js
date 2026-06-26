import express from "express";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { VertexAI } from "@google-cloud/vertexai";
import { Storage } from "@google-cloud/storage";

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || "us-central1";
const MODEL = process.env.VERTEX_MODEL || "gemini-2.5-flash";
const QUESTION_GENERATOR_MODEL = process.env.VERTEX_QUESTION_GENERATOR_MODEL || "gemini-2.5-pro";
const APP_SHARED_SECRET = process.env.APP_SHARED_SECRET;
const PROGRESS_DB_PATH = process.env.PROGRESS_DB_PATH || path.join(process.cwd(), "data", "cracked-progress.sqlite");
const BUCKET_NAME = process.env.GCS_BUCKET_NAME;

const storage = BUCKET_NAME ? new Storage() : null;

fs.mkdirSync(path.dirname(PROGRESS_DB_PATH), { recursive: true });

if (storage) {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file("cracked-progress.sqlite");
    const [exists] = await file.exists();
    if (exists) {
      console.log(`Downloading database from GCS bucket: ${BUCKET_NAME}...`);
      await file.download({ destination: PROGRESS_DB_PATH });
      console.log("Database downloaded successfully.");
    } else {
      console.log("No existing database found in GCS bucket. Starting fresh.");
    }
  } catch (err) {
    console.error("Failed to download database from GCS on startup:", err);
  }
}

const db = new DatabaseSync(PROGRESS_DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS progress_snapshots (
    sync_id TEXT PRIMARY KEY,
    state_json TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const getProgressSnapshot = db.prepare(`
  SELECT state_json, updated_at
  FROM progress_snapshots
  WHERE sync_id = ?
`);

const upsertProgressSnapshot = db.prepare(`
  INSERT INTO progress_snapshots (sync_id, state_json, updated_at)
  VALUES (?, ?, ?)
  ON CONFLICT(sync_id) DO UPDATE SET
    state_json = excluded.state_json,
    updated_at = excluded.updated_at
`);

const app = express();
app.use(express.json({ limit: "2mb" }));

function getModel(modelName = MODEL) {
  if (!PROJECT_ID) {
    throw new Error("GCP_PROJECT_ID is required for AI generation");
  }

  const vertexAI = new VertexAI({ project: PROJECT_ID, location: LOCATION });
  return vertexAI.getGenerativeModel({ model: modelName });
}

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-app-secret");
  res.header("Access-Control-Allow-Private-Network", "true");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use((req, res, next) => {
  if (req.path === "/health") return next();
  if (req.path.startsWith("/progress/")) return next();
  if (req.header("x-app-secret") !== APP_SHARED_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/progress/:syncId", (req, res) => {
  const syncId = String(req.params.syncId || "").trim();
  if (!syncId) {
    return res.status(400).json({ error: "syncId is required" });
  }

  const row = getProgressSnapshot.get(syncId);
  if (!row) {
    return res.status(404).json({ error: "progress not found" });
  }

  try {
    res.json({
      state: JSON.parse(row.state_json),
      updatedAt: row.updated_at,
    });
  } catch (err) {
    console.error("Progress snapshot parse error:", err);
    res.status(500).json({ error: "stored progress is invalid" });
  }
});

async function uploadDbToGcs() {
  if (!storage) return;
  try {
    console.log(`Uploading database to GCS bucket: ${BUCKET_NAME}...`);
    const bucket = storage.bucket(BUCKET_NAME);
    await bucket.upload(PROGRESS_DB_PATH, {
      destination: "cracked-progress.sqlite",
    });
    console.log("Database uploaded successfully.");
  } catch (err) {
    console.error("Failed to upload database to GCS:", err);
  }
}

app.put("/progress/:syncId", (req, res) => {
  const syncId = String(req.params.syncId || "").trim();
  const { state, updatedAt } = req.body ?? {};

  if (!syncId) {
    return res.status(400).json({ error: "syncId is required" });
  }

  if (!state || typeof state !== "object" || Array.isArray(state)) {
    return res.status(400).json({ error: "state object is required" });
  }

  const savedAt = typeof updatedAt === "string" && updatedAt.trim() ? updatedAt : new Date().toISOString();
  upsertProgressSnapshot.run(syncId, JSON.stringify(state), savedAt);

  if (storage) {
    uploadDbToGcs().catch((err) => console.error("Async GCS upload error:", err));
  }

  res.json({ ok: true, updatedAt: savedAt });
});

app.post("/generate", async (req, res) => {
  const { prompt } = req.body ?? {};
  if (typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "prompt is required" });
  }

  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
    res.json({ text });
  } catch (err) {
    console.error("Vertex AI error:", err);
    res.status(502).json({ error: "generation failed" });
  }
});

app.post("/generate-question-set", async (req, res) => {
  const { prompt } = req.body ?? {};
  if (typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "prompt is required" });
  }

  try {
    const model = getModel(QUESTION_GENERATOR_MODEL);
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 8192,
      },
    });
    const text = result.response.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
    res.json({ text, model: QUESTION_GENERATOR_MODEL });
  } catch (err) {
    console.error("Vertex AI question generation error:", err);
    res.status(502).json({ error: "question generation failed" });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`cracked-vertex-proxy listening on ${port}`));
