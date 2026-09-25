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

export const DEMO_SAMPLE_EMPLOYEES = [
  {
    id: "EMP-101",
    name: "Aarav Sharma",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    role: "Staff Software Engineer",
    department: "Engineering",
    workType: "Hybrid",
    shift: "General (09:30 AM - 06:30 PM)",
    shiftType: "General",
    email: "aarav.sharma@company.com",
    phone: "+91 98765 43210",
    joinDate: "2023-04-15",
    reportsTo: "Divya Nair (Architect)",
    salaryMonthly: 145000,
    salaryBase: "₹1,45,000",
    statutoryType: "pf_esic",
    uanNo: "1014892019101",
    accessLevel: "employee",
    loginId: "EMP-101",
    password: "1234",
    leaveBalance: { cl: 8, sl: 5, pl: 12 },
    status: "Active",
  },
  {
    id: "EMP-102",
    name: "Priya Patel",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    role: "Lead Product Designer",
    department: "Design",
    workType: "Hybrid",
    shift: "Flexible (10:00 AM - 07:00 PM)",
    shiftType: "Flexible",
    email: "priya.patel@company.com",
    phone: "+91 98765 43211",
    joinDate: "2023-06-01",
    reportsTo: "Sneha Reddy (VP Product)",
    salaryMonthly: 135000,
    salaryBase: "₹1,35,000",
    statutoryType: "pf_esic",
    uanNo: "1014892019102",
    accessLevel: "manager",
    loginId: "EMP-102",
    password: "1234",
    leaveBalance: { cl: 6, sl: 4, pl: 10 },
    status: "Active",
  },
  {
    id: "EMP-103",
    name: "Rohan Verma",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    role: "Senior DevOps & SRE",
    department: "Engineering",
    workType: "Remote",
    shift: "US Shift (06:00 PM - 03:00 AM)",
    shiftType: "Night",
    email: "rohan.verma@company.com",
    phone: "+91 98765 43212",
    joinDate: "2023-09-10",
    reportsTo: "Divya Nair (Architect)",
    salaryMonthly: 140000,
    salaryBase: "₹1,40,000",
    statutoryType: "non_pf_esic",
    accessLevel: "employee",
    loginId: "EMP-103",
    password: "1234",
    leaveBalance: { cl: 4, sl: 2, pl: 7 },
    status: "Active",
  },
  {
    id: "EMP-104",
    name: "Ananya Iyer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    role: "Head of People & Culture",
    department: "Human Resources",
    workType: "On-Site",
    shift: "General (09:30 AM - 06:30 PM)",
    shiftType: "General",
    email: "ananya.iyer@company.com",
    phone: "+91 98765 43213",
    joinDate: "2022-11-01",
    reportsTo: "CEO Office",
    salaryMonthly: 120000,
    salaryBase: "₹1,20,000",
    statutoryType: "pf_esic",
    uanNo: "1014892019104",
    accessLevel: "admin",
    loginId: "EMP-104",
    password: "1234",
    leaveBalance: { cl: 9, sl: 6, pl: 14 },
    status: "Active",
  },
  {
    id: "EMP-105",
    name: "Vikram Malhotra",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    role: "Director of Enterprise Sales",
    department: "Sales & Growth",
    workType: "Hybrid",
    shift: "General (09:30 AM - 06:30 PM)",
    shiftType: "General",
    email: "vikram.m@company.com",
    phone: "+91 98765 43214",
    joinDate: "2023-01-15",
    reportsTo: "CEO Office",
    salaryMonthly: 160000,
    salaryBase: "₹1,60,000",
    statutoryType: "non_pf_esic",
    accessLevel: "employee",
    loginId: "EMP-105",
    password: "1234",
    leaveBalance: { cl: 5, sl: 3, pl: 8 },
    status: "Active",
  }
];

export function generateCorporateHistory(emps) {
  const history = {};
  const today = new Date();

  for (let i = 14; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const dateKey = d.toISOString().split("T")[0];
    history[dateKey] = {};

    emps.forEach((emp) => {
      history[dateKey][emp.id] = {
        status: "present",
        clockIn: "09:25 AM",
        clockOut: "06:35 PM",
        workingHours: "9h 10m",
        overtimeHours: 0.5,
        note: "Regular Shift",
      };
    });
  }

  return history;
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
    } else {
      // Default clean slate with pre-seeded demo dataset so app is instantly usable
      inMemoryDB = {
        employees: DEMO_SAMPLE_EMPLOYEES,
        attendance: generateCorporateHistory(DEMO_SAMPLE_EMPLOYEES),
        leaves: [
          {
            id: "LV-1001",
            employeeId: "EMP-101",
            employeeName: "Aarav Sharma",
            department: "Engineering",
            leaveType: "Casual Leave (CL)",
            startDate: new Date().toISOString().split("T")[0],
            endDate: new Date().toISOString().split("T")[0],
            days: 1,
            reason: "Personal urgent work",
            status: "Pending",
            submittedAt: new Date().toISOString(),
          }
        ],
        advances: [
          {
            id: "ADV-INIT-1",
            empId: "EMP-101",
            empName: "Aarav Sharma",
            amount: 5000,
            date: new Date().toISOString().split("T")[0],
            month: new Date().toISOString().slice(0, 7),
            paymentMode: "UPI / Online",
            reason: "Festival Advance",
            status: "active",
            createdAt: new Date().toISOString(),
          }
        ],
        config: defaultCompanyConfig,
        adminCreds: defaultAdminCreds,
        audit: [
          {
            id: `AUD-${Date.now()}`,
            action: "SERVER_DB_INITIALIZED",
            actor: "System",
            detail: "Server database started and verified for multi-device sync.",
            timestamp: new Date().toISOString(),
          }
        ],
        lastUpdated: new Date().toISOString(),
      };

      await saveDatabaseFile(inMemoryDB);
    }
  } catch (err) {
    console.error("Database initialization error:", err);
    inMemoryDB = {
      employees: [],
      attendance: {},
      leaves: [],
      advances: [],
      config: defaultCompanyConfig,
      adminCreds: defaultAdminCreds,
      audit: [],
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

export function getDatabase() {
  if (!inMemoryDB) {
    // Synchronous fallback read if called before async init completes
    if (fs.existsSync(DB_FILE)) {
      try {
        inMemoryDB = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch (e) {
        inMemoryDB = {};
      }
    }
  }
  return inMemoryDB || {};
}

export async function updateDatabase(updaterFn) {
  const current = getDatabase();
  const updated = typeof updaterFn === 'function' ? updaterFn(current) : { ...current, ...updaterFn };
  updated.lastUpdated = new Date().toISOString();
  inMemoryDB = updated;
  await saveDatabaseFile(inMemoryDB);
  return inMemoryDB;
}

export async function resetToDemo() {
  const freshHistory = generateCorporateHistory(DEMO_SAMPLE_EMPLOYEES);
  return await updateDatabase({
    employees: DEMO_SAMPLE_EMPLOYEES,
    attendance: freshHistory,
    leaves: [],
    advances: [],
    adminCreds: defaultAdminCreds,
    config: defaultCompanyConfig,
  });
}

export async function wipeToClean() {
  return await updateDatabase({
    employees: [],
    attendance: {},
    leaves: [],
    advances: [],
    adminCreds: defaultAdminCreds,
    config: defaultCompanyConfig,
  });
}
