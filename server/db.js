import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory for persistent storage
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export const defaultCompanyConfig = {
  companyName: "SK ENTERPRISES",
  companyAddress: "303, Panchsheel chs ltd, plot no 07, sec -02, taloja phase -01, navi mumbai -410208",
  shiftStart: "09:30 AM",
  shiftEnd: "06:30 PM",
  graceMinutes: 15,
  minHoursFullDay: 8,
  minHoursHalfDay: 4,
  payableDaysInMonth: 22,
  departments: [
    "Engineering",
    "Design",
    "Human Resources",
    "Sales & Growth",
    "Finance",
    "Operations",
    "Marketing",
    "Product"
  ],
};

export const defaultAdminCreds = {
  id: "admin",
  email: "admin@company.com",
  password: "1234",
};

// Signature filter to detect legacy dummy demo accounts
export function isDemoEmployee(emp) {
  if (!emp) return false;
  const demoIds = ["EMP-101", "EMP-102", "EMP-103", "EMP-104", "EMP-105"];
  const demoNames = ["Aarav Sharma", "Priya Patel", "Rohan Verma", "Ananya Iyer", "Vikram Malhotra"];
  return demoIds.includes(emp.id) && demoNames.includes(emp.name);
}

export function normalizeOrgId(rawOrgId) {
  if (!rawOrgId) return 'sk_enterprises';
  const clean = String(rawOrgId).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  if (!clean || clean === 'default' || clean === 'sk-ent' || clean === 'sk_ent') return 'sk_enterprises';
  return clean;
}

// In-memory cache for fast response times
let inMemoryDB = null;

// Initialize directory and database file
export async function initDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryDB = JSON.parse(raw);
      // Clean any demo records from DB file, keeping real user entries 100% intact
      if (Array.isArray(inMemoryDB.employees)) {
        inMemoryDB.employees = inMemoryDB.employees.filter(e => !isDemoEmployee(e));
      }
      if (inMemoryDB.tenants?.['sk_enterprises']?.employees) {
        inMemoryDB.tenants['sk_enterprises'].employees = inMemoryDB.tenants['sk_enterprises'].employees.filter(e => !isDemoEmployee(e));
      }
    } else {
      // Default clean slate with zero demo dataset
      inMemoryDB = {
        employees: [],
        attendance: {},
        leaves: [],
        advances: [],
        expenses: [],
        config: defaultCompanyConfig,
        adminCreds: defaultAdminCreds,
        audit: [
          {
            id: `AUD-${Date.now()}`,
            action: "SERVER_DB_INITIALIZED",
            actor: "System",
            detail: "Server database started clean slate. Ready for live employee records.",
            timestamp: new Date().toISOString(),
          }
        ],
        lastUpdated: new Date().toISOString(),
      };
    }

    // Ensure tenants partition exists
    if (!inMemoryDB.tenants) {
      inMemoryDB.tenants = {};
    }
    if (!inMemoryDB.tenants['sk_enterprises']) {
      inMemoryDB.tenants['sk_enterprises'] = {
        id: 'sk_enterprises',
        name: inMemoryDB.config?.companyName || defaultCompanyConfig.companyName,
        employees: (inMemoryDB.employees || []).filter(e => !isDemoEmployee(e)),
        attendance: inMemoryDB.attendance || {},
        leaves: inMemoryDB.leaves || [],
        advances: inMemoryDB.advances || [],
        expenses: inMemoryDB.expenses || [],
        config: inMemoryDB.config || defaultCompanyConfig,
        adminCreds: inMemoryDB.adminCreds || defaultAdminCreds,
        lastUpdated: inMemoryDB.lastUpdated || new Date().toISOString(),
      };
    }

    await saveDatabaseFile(inMemoryDB);
  } catch (err) {
    console.error("Database initialization error:", err);
    inMemoryDB = {
      employees: [],
      attendance: {},
      leaves: [],
      advances: [],
      expenses: [],
      config: defaultCompanyConfig,
      adminCreds: defaultAdminCreds,
      audit: [],
      tenants: {
        sk_enterprises: {
          id: 'sk_enterprises',
          name: defaultCompanyConfig.companyName,
          employees: [],
          attendance: {},
          leaves: [],
          advances: [],
          expenses: [],
          config: defaultCompanyConfig,
          adminCreds: defaultAdminCreds,
          lastUpdated: new Date().toISOString(),
        }
      },
      lastUpdated: new Date().toISOString(),
    };
  }
  return inMemoryDB;
}

// Atomic file write to avoid corruption during server restarts
async function saveDatabaseFile(data) {
  const tmpFile = path.join(DATA_DIR, `database.${Date.now()}.tmp`);
  await fs.promises.writeFile(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  await fs.promises.rename(tmpFile, DB_FILE);
}

export function getDatabase(orgId) {
  const normId = normalizeOrgId(orgId);
  if (!inMemoryDB) {
    if (fs.existsSync(DB_FILE)) {
      try {
        inMemoryDB = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch (e) {
        inMemoryDB = {};
      }
    } else {
      inMemoryDB = {};
    }
  }

  if (!inMemoryDB.tenants) {
    inMemoryDB.tenants = {};
  }

  if (!inMemoryDB.tenants['sk_enterprises']) {
    inMemoryDB.tenants['sk_enterprises'] = {
      id: 'sk_enterprises',
      name: inMemoryDB.config?.companyName || defaultCompanyConfig.companyName,
      employees: (inMemoryDB.employees || []).filter(e => !isDemoEmployee(e)),
      attendance: inMemoryDB.attendance || {},
      leaves: inMemoryDB.leaves || [],
      advances: inMemoryDB.advances || [],
      expenses: inMemoryDB.expenses || [],
      config: inMemoryDB.config || defaultCompanyConfig,
      adminCreds: inMemoryDB.adminCreds || defaultAdminCreds,
      lastUpdated: inMemoryDB.lastUpdated || new Date().toISOString(),
    };
  }

  if (!inMemoryDB.tenants[normId]) {
    inMemoryDB.tenants[normId] = {
      id: normId,
      name: normId.toUpperCase(),
      employees: [],
      attendance: {},
      leaves: [],
      advances: [],
      expenses: [],
      config: { ...defaultCompanyConfig, companyName: normId.toUpperCase() },
      adminCreds: defaultAdminCreds,
      lastUpdated: new Date().toISOString(),
    };
  }

  return inMemoryDB.tenants[normId];
}

export async function updateDatabase(updaterFn, orgId) {
  const normId = normalizeOrgId(orgId);
  const currentTenant = getDatabase(normId);
  const updatedTenant = typeof updaterFn === 'function' ? updaterFn(currentTenant) : { ...currentTenant, ...updaterFn };
  updatedTenant.lastUpdated = new Date().toISOString();

  if (!inMemoryDB.tenants) {
    inMemoryDB.tenants = {};
  }
  inMemoryDB.tenants[normId] = updatedTenant;
  inMemoryDB.lastUpdated = updatedTenant.lastUpdated;

  if (normId === 'sk_enterprises') {
    inMemoryDB.employees = updatedTenant.employees;
    inMemoryDB.attendance = updatedTenant.attendance;
    inMemoryDB.leaves = updatedTenant.leaves;
    inMemoryDB.advances = updatedTenant.advances;
    inMemoryDB.expenses = updatedTenant.expenses;
    inMemoryDB.config = updatedTenant.config;
    inMemoryDB.adminCreds = updatedTenant.adminCreds;
  }

  await saveDatabaseFile(inMemoryDB);
  return updatedTenant;
}

export async function resetToDemo(orgId) {
  // Demo data is permanently disabled; returns clean slate
  return await wipeToClean(orgId);
}

export async function wipeToClean(orgId) {
  return await updateDatabase({
    employees: [],
    attendance: {},
    leaves: [],
    advances: [],
    expenses: [],
    adminCreds: defaultAdminCreds,
    config: defaultCompanyConfig,
  }, orgId);
}
