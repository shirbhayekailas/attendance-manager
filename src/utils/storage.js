// Corporate LocalStorage & HR Data Persistence (Clean Production Keys)

const STORAGE_KEYS = {
  EMPLOYEES: "staffpulse_employees_v4_clean",
  ATTENDANCE: "staffpulse_attendance_v4_clean",
  CONFIG: "staffpulse_config_v4_clean",
  LEAVE_REQUESTS: "staffpulse_leaves_v4_clean",
  THEME: "staffpulse_theme_v4_clean",
  ADMIN_CREDS: "staffpulse_admin_creds_v4_clean",
  ADVANCES: "staffpulse_advances_v4_clean",
};

export const defaultCompanyConfig = {
  companyName: "Acme Global Technologies Pvt. Ltd.",
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

export function loadStoredData() {
  try {
    const rawEmployees = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    const rawAttendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    const rawConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
    const rawLeaves = localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS);
    const rawTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const rawAdminCreds = localStorage.getItem(STORAGE_KEYS.ADMIN_CREDS);
    const rawAdvances = localStorage.getItem(STORAGE_KEYS.ADVANCES);

    const parsedConfig = rawConfig ? JSON.parse(rawConfig) : {};
    const finalConfig = {
      ...defaultCompanyConfig,
      ...parsedConfig,
      departments: (parsedConfig.departments && parsedConfig.departments.length > 0)
        ? parsedConfig.departments
        : defaultCompanyConfig.departments,
    };

    return {
      employees: rawEmployees ? JSON.parse(rawEmployees) : [],
      attendance: rawAttendance ? JSON.parse(rawAttendance) : {},
      leaves: rawLeaves ? JSON.parse(rawLeaves) : [],
      advances: rawAdvances ? JSON.parse(rawAdvances) : [],
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
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
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

export function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error("Failed to save company config:", err);
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
