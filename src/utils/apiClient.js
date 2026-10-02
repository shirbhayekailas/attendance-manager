// Multi-Device API Client for AttendFlow Cloud Server Database

// Automatically resolves API base URL:
// - In production (Render): uses relative origin (e.g. https://your-app.onrender.com)
// - In development: uses Vite proxy or fallback to http://localhost:5000
const API_BASE = (typeof window !== 'undefined' && window.location.origin) ? '' : 'http://localhost:5000';

let isSyncing = false;
let syncQueue = null;
let lastServerTimestamp = null;

export function getActiveOrgId() {
  try {
    return localStorage.getItem('staffpulse_org_id_v4') || 'sk_enterprises';
  } catch (e) {
    return 'sk_enterprises';
  }
}

// Fetch entire database state from server
export async function fetchServerSync(customOrgId = null) {
  const orgId = customOrgId || getActiveOrgId();
  try {
    const res = await fetch(`${API_BASE}/api/sync?orgId=${encodeURIComponent(orgId)}`, {
      headers: { 
        'Accept': 'application/json',
        'x-org-id': orgId
      },
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
export async function pushServerSync(payload, customOrgId = null) {
  const orgId = customOrgId || getActiveOrgId();
  if (isSyncing) {
    // Queue up the latest payload to avoid race conditions
    syncQueue = { payload, orgId };
    return;
  }

  isSyncing = true;
  try {
    const res = await fetch(`${API_BASE}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': orgId,
      },
      body: JSON.stringify({ ...payload, orgId }),
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
      const next = syncQueue;
      syncQueue = null;
      await pushServerSync(next.payload, next.orgId);
    }
  }
}

// Remote Authentication against cloud server
export async function loginOnServer({ identifier, password, orgId = 'sk_enterprises' }) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': orgId
      },
      body: JSON.stringify({ identifier, password, orgId })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// Update User PIN on server
export async function updateUserPinOnServer({ empId, newPin, orgId = 'sk_enterprises' }) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': orgId
      },
      body: JSON.stringify({ empId, newPin, orgId })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Update User Role on server (RBAC)
export async function updateUserRoleOnServer({ empId, newRole, orgId = 'sk_enterprises' }) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': orgId
      },
      body: JSON.stringify({ empId, newRole, orgId })
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
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

// Demo reset permanently disabled
export async function resetDemoOnServer() {
  return { success: true, message: "Demo mode disabled" };
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

// -------------------------------------------------------------
// SMART SERVER WAKE-UP (Render Cold-Start detection & handler)
// -------------------------------------------------------------
export async function wakeUpServer(onProgress) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s max for cold start
    const startTime = Date.now();

    if (onProgress) onProgress('waking');
    const res = await fetch(`${API_BASE}/api/health`, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      if (onProgress) onProgress('awake', elapsed);
      return { awake: true, elapsed, data };
    }
    return { awake: false };
  } catch (err) {
    if (onProgress) onProgress('offline');
    return { awake: false, error: err.message };
  }
}

export function getLastServerTimestamp() {
  return lastServerTimestamp;
}
