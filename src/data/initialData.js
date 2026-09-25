// Production Database Defaults (Clean Slate - No Demo Data)

export const INITIAL_EMPLOYEES = [];
export const INITIAL_LEAVE_REQUESTS = [];
export const INITIAL_NOTIFICATIONS = [
  {
    id: "NOTIF-0",
    title: "System Ready",
    desc: "StaffPulse PRO database initialized with a clean production slate.",
    time: "Just now",
    unread: true,
    type: "payroll",
  }
];
export const INITIAL_AUDIT_LOGS = [
  {
    id: "AUD-INIT",
    action: "SYSTEM_INITIALIZED",
    actor: "HR Administrator",
    target: "Corporate Database",
    detail: "System started with clean slate. Ready for employee onboarding.",
    timestamp: new Date().toLocaleString(),
  }
];

// Optional Demo Dataset (Only loaded if user explicitly clicks 'Reload Demo Data' in Settings)
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
    statutoryType: "pf_esic",
    uanNo: "1014892019101",
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
    statutoryType: "pf_esic",
    uanNo: "1014892019102",
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
    statutoryType: "non_pf_esic",
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
    statutoryType: "pf_esic",
    uanNo: "1014892019104",
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
    statutoryType: "non_pf_esic",
    leaveBalance: { cl: 5, sl: 3, pl: 8 },
    status: "Active",
  }
];

export function generateCorporateHistory(employees) {
  const history = {};
  const today = new Date();

  for (let i = 14; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const dateKey = d.toISOString().split("T")[0];
    history[dateKey] = {};

    employees.forEach((emp) => {
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
