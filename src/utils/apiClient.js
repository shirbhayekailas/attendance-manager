// Multi-Device API Client for AttendFlow Cloud Server Database

// Automatically resolves API base URL:
// - In production (Render): uses relative origin (e.g. https://your-app.onrender.com)
// - In development: uses Vite proxy or fallback to http://localhost:5000
const API_BASE = (typeof window !== 'undefined' && window.location.origin) ? '' : 'http://localhost:5000';

let isSyncing = false;
let syncQueue = null;
let lastServerTimestamp = null;

// Fetch entire database state from server
export async function fetchServerSync() {
  try {
    const res = await fetch(`${API_BASE}/api/sync`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (data.success) {
      lastServerTimestamp = data.lastUpdated;
      return { success: true, data };
    }
    return { success: false, error: data.error };
  } catch (err) {
    console.warn("⚠️ Server sync unreachable, running in local cached mode:", err.message);
    return { success: false, error: err.message };
  }
}

// Push local state updates to server database
export async function pushServerSync(payload) {
  if (isSyncing) {
    // Queue up the latest payload to avoid race conditions
    syncQueue = payload;
    return;
  }

  isSyncing = true;
  try {
    const res = await fetch(`${API_BASE}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const result = await res.json();
      lastServerTimestamp = result.lastUpdated;
    }
  } catch (err) {
    console.warn("⚠️ Failed to sync changes to server:", err.message);
  } finally {
    isSyncing = false;
    if (syncQueue) {
      const nextPayload = syncQueue;
      syncQueue = null;
      await pushServerSync(nextPayload);
    }
  }
}

// Server Health Check & Last Updated Check
export async function checkServerHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) return { connected: false };
    const json = await res.json();
    return {
      connected: true,
      lastUpdated: json.lastUpdated,
      serverTime: json.serverTime,
    };
  } catch (err) {
    return { connected: false };
  }
}

// Reload sample demo corporate dataset on server
export async function resetDemoOnServer() {
  try {
    const res = await fetch(`${API_BASE}/api/reset-demo`, { method: 'POST' });
    if (!res.ok) throw new Error("Failed to reset demo on server");
    return await res.json();
  } catch (err) {
    console.error("Reset demo failed:", err);
    return null;
  }
}

// Wipe all data cleanly on server
export async function wipeCleanOnServer() {
  try {
    const res = await fetch(`${API_BASE}/api/wipe-clean`, { method: 'POST' });
    if (!res.ok) throw new Error("Failed to wipe server database");
    return await res.json();
  } catch (err) {
    console.error("Wipe database failed:", err);
    return null;
  }
}

export function getLastServerTimestamp() {
  return lastServerTimestamp;
}
