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

export function getProgressSyncId() {
  if (CONFIGURED_SYNC_ID.trim()) return CONFIGURED_SYNC_ID.trim();

  const storage = browserStorage();
  if (!storage) return "default";

  const saved = storage.getItem(SYNC_ID_STORAGE_KEY);
  if (saved) return saved;

  storage.setItem(SYNC_ID_STORAGE_KEY, "default");
  return "default";
}

export function isProgressSyncConfigured() {
  return Boolean(PROGRESS_SYNC_URL && PROGRESS_SYNC_SECRET);
}

export function progressSyncDescription() {
  if (!PROGRESS_SYNC_URL) return "Add VITE_PROGRESS_SYNC_URL to enable cloud sync.";
  if (!PROGRESS_SYNC_SECRET) return "Add VITE_PROGRESS_SYNC_SECRET to enable cloud sync.";
  return `Sync ID: ${getProgressSyncId()}`;
}

function progressEndpoint() {
  const baseUrl = PROGRESS_SYNC_URL.replace(/\/$/, "");
  return `${baseUrl}/progress/${encodeURIComponent(getProgressSyncId())}`;
}

async function parseError(response) {
  try {
    const data = await response.json();
    return data.error || `sync failed (${response.status})`;
  } catch {
    return `sync failed (${response.status})`;
  }
}

export async function loadRemoteProgress() {
  if (!isProgressSyncConfigured()) return null;

  const response = await fetch(progressEndpoint(), {
    method: "GET",
    headers: {
      "x-app-secret": PROGRESS_SYNC_SECRET,
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await parseError(response));

  return response.json();
}

export async function saveRemoteProgress(state) {
  if (!isProgressSyncConfigured()) return null;

  const updatedAt = new Date().toISOString();
  const response = await fetch(progressEndpoint(), {
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
