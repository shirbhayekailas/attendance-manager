// Corporate LocalStorage & HR Data Persistence (Clean Production Keys)

const STORAGE_KEYS = {
  EMPLOYEES: "staffpulse_employees_v4_clean",
  ATTENDANCE: "staffpulse_attendance_v4_clean",
  CONFIG: "staffpulse_config_v4_clean",
  LEAVE_REQUESTS: "staffpulse_leaves_v4_clean",
  THEME: "staffpulse_theme_v4_clean",
  ADMIN_CREDS: "staffpulse_admin_creds_v4_clean",
  ADVANCES: "staffpulse_advances_v4_clean",
  EXPENSES: "staffpulse_expenses_v4_clean",
  HOLIDAYS: "staffpulse_holidays_v4_clean",
  ASSETS: "staffpulse_assets_v4_clean",
  PERFORMANCE: "staffpulse_performance_v4_clean",
  HELPDESK: "staffpulse_helpdesk_v4_clean",
  REGULARIZATIONS: "staffpulse_regularizations_v4_clean",
};

export const defaultHolidays = [
  { id: 'HOL-01', name: 'Republic Day', date: '2026-01-26', type: 'national', isPaid: true },
  { id: 'HOL-02', name: 'Maha Shivratri', date: '2026-02-16', type: 'festival', isPaid: true },
  { id: 'HOL-03', name: 'Holi (Dhulivandan)', date: '2026-03-04', type: 'festival', isPaid: true },
  { id: 'HOL-04', name: 'Gudi Padwa', date: '2026-03-20', type: 'regional', isPaid: true },
  { id: 'HOL-05', name: 'Eid-ul-Fitr (Ramzan Eid)', date: '2026-03-21', type: 'festival', isPaid: true },
  { id: 'HOL-06', name: 'Dr. B.R. Ambedkar Jayanti', date: '2026-04-14', type: 'gazetted', isPaid: true },
  { id: 'HOL-07', name: 'Maharashtra Day / May Day', date: '2026-05-01', type: 'state', isPaid: true },
  { id: 'HOL-08', name: 'Bakri Eid (Eid-ul-Adha)', date: '2026-05-28', type: 'festival', isPaid: true },
  { id: 'HOL-09', name: 'Independence Day', date: '2026-08-15', type: 'national', isPaid: true },
  { id: 'HOL-10', name: 'Ganesh Chaturthi', date: '2026-09-14', type: 'festival', isPaid: true },
  { id: 'HOL-11', name: 'Mahatma Gandhi Jayanti', date: '2026-10-02', type: 'national', isPaid: true },
  { id: 'HOL-12', name: 'Dussehra (Vijayadashami)', date: '2026-10-20', type: 'festival', isPaid: true },
  { id: 'HOL-13', name: 'Diwali (Laxmi Pujan)', date: '2026-11-09', type: 'festival', isPaid: true },
  { id: 'HOL-14', name: 'Diwali (Balipratipada)', date: '2026-11-10', type: 'festival', isPaid: true },
  { id: 'HOL-15', name: 'Christmas Day', date: '2026-12-25', type: 'festival', isPaid: true },
];

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
  password: "1234", // DEFAULT ADMIN PASSWORD AS REQUESTED: 1234
};

// Signature filter to detect legacy dummy demo accounts
export function isDemoEmployee(emp) {
  if (!emp) return false;
  const demoIds = ["EMP-101", "EMP-102", "EMP-103", "EMP-104", "EMP-105"];
  const demoNames = ["Aarav Sharma", "Priya Patel", "Rohan Verma", "Ananya Iyer", "Vikram Malhotra"];
  const idMatch = demoIds.includes(String(emp.id || '').toUpperCase());
  const nameMatch = demoNames.includes(String(emp.name || '').trim());
  return idMatch && nameMatch;
}

export function loadStoredData() {
  try {
    // 1. Scan current and all legacy keys to recover any real user employee entries
    const empKeysToScan = [
      STORAGE_KEYS.EMPLOYEES,
      "staffpulse_user_entries_vault",
      "staffpulse_employees_v4_clean",
      "staffpulse_employees_v3",
      "staffpulse_employees_v2",
      "staffpulse_employees",
      "attendflow_members_v1",
      "attendflow_employees",
      "attendflow_members"
    ];

    const recoveredEmployeesMap = new Map();
    empKeysToScan.forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            list.forEach(emp => {
              if (emp && emp.id && !isDemoEmployee(emp)) {
                // If not already in map or richer data, keep user's actual employee
                if (!recoveredEmployeesMap.has(emp.id)) {
                  recoveredEmployeesMap.set(emp.id, emp);
                }
              }
            });
          }
        }
      } catch (e) {}
    });

    const realEmployees = Array.from(recoveredEmployeesMap.values());

    // 2. Scan current and legacy keys to recover real attendance entries
    const attKeysToScan = [
      STORAGE_KEYS.ATTENDANCE,
      "staffpulse_attendance_v4_clean",
      "staffpulse_attendance_v3",
      "staffpulse_attendance_v2",
      "staffpulse_attendance",
      "attendflow_attendance_v1",
      "attendflow_attendance"
    ];

    const recoveredAttendance = {};
    attKeysToScan.forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const attObj = JSON.parse(raw);
          if (attObj && typeof attObj === 'object') {
            Object.entries(attObj).forEach(([dateStr, dayRecords]) => {
              if (dayRecords && typeof dayRecords === 'object') {
                if (!recoveredAttendance[dateStr]) recoveredAttendance[dateStr] = {};
                Object.entries(dayRecords).forEach(([empId, rec]) => {
                  if (!rec) return;
                  const isDemoPunches = (
                    ["EMP-101", "EMP-102", "EMP-103", "EMP-104", "EMP-105"].includes(empId) &&
                    rec.note === "Regular Shift" &&
                    rec.clockIn === "09:25 AM" &&
                    rec.clockOut === "06:35 PM" &&
                    !rec.isWeekOffDuty &&
                    rec.status === 'present'
                  );
                  // If it's a real user punch, or user's custom employee, or edited status: PRESERVE!
                  if (!isDemoPunches) {
                    recoveredAttendance[dateStr][empId] = rec;
                  }
                });
                if (Object.keys(recoveredAttendance[dateStr]).length === 0) {
                  delete recoveredAttendance[dateStr];
                }
              }
            });
          }
        }
      } catch (e) {}
    });

    // Save recovered real entries back to clean keys & vault for permanent safety
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(realEmployees));
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(recoveredAttendance));
      localStorage.setItem("staffpulse_user_entries_vault", JSON.stringify(realEmployees));
    } catch (e) {}

    const rawConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
    const rawLeaves = localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS);
    const rawTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const rawAdminCreds = localStorage.getItem(STORAGE_KEYS.ADMIN_CREDS);
    const rawAdvances = localStorage.getItem(STORAGE_KEYS.ADVANCES);
    const rawExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const rawHolidays = localStorage.getItem(STORAGE_KEYS.HOLIDAYS);
    const rawAssets = localStorage.getItem(STORAGE_KEYS.ASSETS);
    const rawPerformance = localStorage.getItem(STORAGE_KEYS.PERFORMANCE);
    const rawHelpdesk = localStorage.getItem(STORAGE_KEYS.HELPDESK);
    const rawRegularizations = localStorage.getItem(STORAGE_KEYS.REGULARIZATIONS);

    const parsedConfig = rawConfig ? JSON.parse(rawConfig) : {};
    const finalConfig = {
      ...defaultCompanyConfig,
      ...parsedConfig,
      departments: (parsedConfig.departments && parsedConfig.departments.length > 0)
        ? parsedConfig.departments
        : defaultCompanyConfig.departments,
    };

    return {
      employees: realEmployees,
      attendance: recoveredAttendance,
      leaves: rawLeaves ? JSON.parse(rawLeaves) : [],
      advances: rawAdvances ? JSON.parse(rawAdvances) : [],
      expenses: rawExpenses ? JSON.parse(rawExpenses) : [],
      holidays: rawHolidays ? JSON.parse(rawHolidays) : defaultHolidays,
      assets: rawAssets ? JSON.parse(rawAssets) : [],
      performance: rawPerformance ? JSON.parse(rawPerformance) : [],
      helpdesk: rawHelpdesk ? JSON.parse(rawHelpdesk) : [],
      regularizations: rawRegularizations ? JSON.parse(rawRegularizations) : [],
      config: finalConfig,
      theme: rawTheme || "dark",
      adminCreds: rawAdminCreds ? JSON.parse(rawAdminCreds) : defaultAdminCreds,
    };
  } catch (err) {
    console.error("Failed to load local storage data:", err);
    return {
      employees: [],
      attendance: {},
      leaves: [],
      advances: [],
      expenses: [],
      holidays: defaultHolidays,
      assets: [],
      performance: [],
      helpdesk: [],
      regularizations: [],
      config: defaultCompanyConfig,
      theme: "dark",
      adminCreds: defaultAdminCreds,
    };
  }
}

export function saveAdminCreds(creds) {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_CREDS, JSON.stringify(creds));
  } catch (err) {
    console.error("Failed to save admin credentials:", err);
  }
}

export function saveEmployees(employees) {
  try {
    const cleanList = (employees || []).filter(e => !isDemoEmployee(e));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(cleanList));
    localStorage.setItem("staffpulse_user_entries_vault", JSON.stringify(cleanList));
  } catch (err) {
    console.error("Failed to save employees:", err);
  }
}

export function saveAttendance(attendance) {
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  } catch (err) {
    console.error("Failed to save attendance:", err);
  }
}

export function saveLeaveRequests(leaves) {
  try {
    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(leaves));
  } catch (err) {
    console.error("Failed to save leaves:", err);
  }
}

export function saveAdvances(advances) {
  try {
    localStorage.setItem(STORAGE_KEYS.ADVANCES, JSON.stringify(advances));
  } catch (err) {
    console.error("Failed to save employee advances:", err);
  }
}

export function getEmployeeTotalAdvance(empId, advances, monthStr) {
  if (!advances || !Array.isArray(advances)) return 0;
  return advances
    .filter(a => a.empId === empId && (!monthStr || !a.month || a.month === monthStr) && a.status !== 'cancelled')
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
}

export function saveExpenses(expenses) {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  } catch (err) {
    console.error("Failed to save site expenses:", err);
  }
}

export function getEmployeeTotalExpenses(empId, expenses, monthStr) {
  if (!expenses || !Array.isArray(expenses)) return 0;
  return expenses
    .filter(e => e.empId === empId && (!monthStr || !e.date || e.date.startsWith(monthStr)) && e.status !== 'rejected')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
}

export function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error("Failed to save company config:", err);
  }
}

export function saveHolidays(holidays) {
  try {
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS, JSON.stringify(holidays));
  } catch (err) {
    console.error("Failed to save holidays:", err);
  }
}

export function saveAssets(assets) {
  try {
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets));
  } catch (err) {
    console.error("Failed to save assets:", err);
  }
}

export function savePerformance(performance) {
  try {
    localStorage.setItem(STORAGE_KEYS.PERFORMANCE, JSON.stringify(performance));
  } catch (err) {
    console.error("Failed to save performance records:", err);
  }
}

export function saveHelpdesk(tickets) {
  try {
    localStorage.setItem(STORAGE_KEYS.HELPDESK, JSON.stringify(tickets));
  } catch (err) {
    console.error("Failed to save helpdesk tickets:", err);
  }
}

export function saveRegularizations(regularizations) {
  try {
    localStorage.setItem(STORAGE_KEYS.REGULARIZATIONS, JSON.stringify(regularizations));
  } catch (err) {
    console.error("Failed to save regularizations:", err);
  }
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (err) {
    console.error("Failed to save theme:", err);
  }
}

export function wipeAllStoredData() {
  try {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    // Also remove legacy keys
    localStorage.removeItem("staffpulse_employees_v2");
    localStorage.removeItem("staffpulse_attendance_v2");
    localStorage.removeItem("staffpulse_leaves_v2");
    localStorage.removeItem("attendflow_members_v1");
    localStorage.removeItem("attendflow_attendance_v1");
  } catch (err) {}
}

export function exportCorporateBackup(employees, attendance, leaves, config) {
  const data = {
    app: "StaffPulse PRO - Corporate HR Suite",
    exportDate: new Date().toISOString(),
    config,
    employees,
    attendance,
    leaves,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `staffpulse_backup_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
