const SYNC_ID_STORAGE_KEY = "cracked-progress-sync-id";
const LOCAL_UPDATED_AT_KEY = "cracked-progress-local-updated-at";

const PROGRESS_SYNC_URL = import.meta.env.VITE_PROGRESS_SYNC_URL || import.meta.env.VITE_VERTEX_PROXY_URL || "";
const PROGRESS_SYNC_SECRET = import.meta.env.VITE_PROGRESS_SYNC_SECRET || import.meta.env.VITE_VERTEX_PROXY_SECRET || "";
const CONFIGURED_SYNC_ID = import.meta.env.VITE_PROGRESS_SYNC_ID || "";

function browserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function getLocalProgressUpdatedAt() {
  return browserStorage()?.getItem(LOCAL_UPDATED_AT_KEY) || "";
}

export function markLocalProgressUpdated(at = new Date().toISOString()) {
  browserStorage()?.setItem(LOCAL_UPDATED_AT_KEY, at);
  return at;
}

function randomChunk() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = new Uint8Array(4);

  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function normalizeProgressSyncId(syncId) {
  return String(syncId || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
}

export function createProgressSyncId() {
  return ["CRK", randomChunk(), randomChunk()].join("-");
}

export function getProgressSyncId() {
  const configured = normalizeProgressSyncId(CONFIGURED_SYNC_ID);

  const storage = browserStorage();
  if (!storage) return configured || createProgressSyncId();

  const saved = storage.getItem(SYNC_ID_STORAGE_KEY);
  if (saved) return normalizeProgressSyncId(saved);

  const syncId = configured || createProgressSyncId();
  storage.setItem(SYNC_ID_STORAGE_KEY, syncId);
  return syncId;
}

export function setProgressSyncId(syncId) {
  const normalized = normalizeProgressSyncId(syncId);
  if (!normalized) {
    throw new Error("Enter a sync ID first.");
  }

  browserStorage()?.setItem(SYNC_ID_STORAGE_KEY, normalized);
  return normalized;
}

export function isProgressSyncConfigured() {
  return Boolean(PROGRESS_SYNC_URL && PROGRESS_SYNC_SECRET);
}

export function progressSyncDescription() {
  if (!PROGRESS_SYNC_URL) return "Add VITE_PROGRESS_SYNC_URL to enable cloud sync.";
  if (!PROGRESS_SYNC_SECRET) return "Add VITE_PROGRESS_SYNC_SECRET to enable cloud sync.";
  return `Sync ID: ${getProgressSyncId()}`;
}

function progressEndpoint(syncId = getProgressSyncId()) {
  const baseUrl = PROGRESS_SYNC_URL.replace(/\/$/, "");
  return `${baseUrl}/progress/${encodeURIComponent(syncId)}`;
}

async function parseError(response) {
  try {
    const data = await response.json();
    return data.error || `sync failed (${response.status})`;
  } catch {
    return `sync failed (${response.status})`;
  }
}

export async function loadRemoteProgress(syncId = getProgressSyncId()) {
  if (!isProgressSyncConfigured()) return null;

  const response = await fetch(progressEndpoint(normalizeProgressSyncId(syncId)), {
    method: "GET",
    headers: {
      "x-app-secret": PROGRESS_SYNC_SECRET,
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await parseError(response));

  return response.json();
}

export async function saveRemoteProgress(state, syncId = getProgressSyncId()) {
  if (!isProgressSyncConfigured()) return null;

  const updatedAt = new Date().toISOString();
  const response = await fetch(progressEndpoint(normalizeProgressSyncId(syncId)), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-app-secret": PROGRESS_SYNC_SECRET,
    },
    body: JSON.stringify({
      state,
      updatedAt,
    }),
  });

  if (!response.ok) throw new Error(await parseError(response));

  markLocalProgressUpdated(updatedAt);
  return response.json();
}
