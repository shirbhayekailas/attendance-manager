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

// Production Clean Initial State - Zero Demo / Dummy Data

