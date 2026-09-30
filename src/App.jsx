import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import MarkAttendanceView from './components/MarkAttendanceView';
import KioskView from './components/KioskView';
import MembersView from './components/MembersView';
import LeaveRequestsView from './components/LeaveRequestsView';
import ReportsView from './components/ReportsView';
import AuditTrailView from './components/AuditTrailView';
import SettingsView from './components/SettingsView';
import MemberProfileModal from './components/MemberProfileModal';
import GlobalSearchModal from './components/GlobalSearchModal';
import LoginView from './components/LoginView';
import EmployeePortalView from './components/EmployeePortalView';
import MonthlyAttendanceView from './components/MonthlyAttendanceView';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import UserAccessModal from './components/UserAccessModal';

import { 
  INITIAL_EMPLOYEES, 
  INITIAL_LEAVE_REQUESTS, 
  INITIAL_NOTIFICATIONS,
  DEMO_SAMPLE_EMPLOYEES,
  generateCorporateHistory 
} from './data/initialData';
import { 
  loadStoredData, 
  saveEmployees, 
  saveAttendance, 
  saveLeaveRequests, 
  saveConfig, 
  saveTheme, 
  saveAdminCreds,
  saveAdvances,
  saveExpenses,
  defaultAdminCreds,
  wipeAllStoredData,
  defaultCompanyConfig 
} from './utils/storage';
import { 
  fetchServerSync, 
  pushServerSync, 
  resetDemoOnServer, 
  wipeCleanOnServer 
} from './utils/apiClient';
import { getCompanyDailyOverview } from './utils/attendanceCalculations';
import { sounds } from './utils/sound';

export default function App() {
  const stored = loadStoredData();

  // Clean slate data
  const [employees, setEmployees] = useState(() => stored.employees || []);
  const [attendance, setAttendance] = useState(() => stored.attendance || {});
  const [leaves, setLeaves] = useState(() => stored.leaves || []);
  const [advances, setAdvances] = useState(() => stored.advances || []);
  const [expenses, setExpenses] = useState(() => stored.expenses || []);
  const [adminCreds, setAdminCreds] = useState(() => stored.adminCreds || defaultAdminCreds);

  const [config, setConfig] = useState(() => stored.config || defaultCompanyConfig);
  const [theme, setTheme] = useState(() => stored.theme || 'dark');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [syncStatus, setSyncStatus] = useState('syncing'); // 'synced' | 'syncing' | 'offline'

  const isInitialSyncDone = useRef(false);

  // -------------------------------------------------------------
  // SESSION SECURITY & INACTIVITY AUTO-LOGOUT CONFIG (Blinkit Style)
  // -------------------------------------------------------------
  const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 Minutes Inactivity Auto-Logout
  const WARNING_TIMEOUT_MS = 9 * 60 * 1000; // 9 Minutes (shows 60s countdown warning)

  const [isIdleWarningOpen, setIsIdleWarningOpen] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(60);
  const [isUserAccessOpen, setIsUserAccessOpen] = useState(false);
  const [logoutNotice, setLogoutNotice] = useState(() => {
    try {
      const lastActive = Number(localStorage.getItem('staffpulse_last_active') || 0);
      const hadSession = localStorage.getItem('staffpulse_had_session');
      if (hadSession && lastActive && Date.now() - lastActive >= 10 * 60 * 1000) {
        localStorage.removeItem('staffpulse_had_session');
        return 'inactivity';
      }
    } catch (e) {}
    return null;
  });
  const lastActiveRef = useRef(Date.now());

  // Authentication & RBAC User State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('staffpulse_user_v4') || localStorage.getItem('staffpulse_user_v4');
      const lastActive = Number(sessionStorage.getItem('staffpulse_last_active') || localStorage.getItem('staffpulse_last_active') || 0);

      // If active session exists and last active was within 10 minutes
      if (saved && lastActive && (Date.now() - lastActive < IDLE_TIMEOUT_MS)) {
        return JSON.parse(saved);
      }

      // Purge any stale session
      sessionStorage.removeItem('staffpulse_user_v4');
      sessionStorage.removeItem('staffpulse_last_active');
      localStorage.removeItem('staffpulse_user_v4');
      localStorage.removeItem('staffpulse_last_active');
      return null;
    } catch (e) {
      return null;
    }
  });

  // Master Logout Handler (Inactivity or Manual)
  const handleLogout = (reason = 'manual') => {
    if (reason === 'inactivity') {
      sounds.playWarning();
    } else {
      sounds.playSuccess();
    }
    setCurrentUser(null);
    setIsIdleWarningOpen(false);
    setLogoutNotice(reason);

    try {
      sessionStorage.removeItem('staffpulse_user_v4');
      sessionStorage.removeItem('staffpulse_last_active');
      localStorage.removeItem('staffpulse_user_v4');
      localStorage.removeItem('staffpulse_last_active');
      localStorage.removeItem('staffpulse_had_session');
    } catch (e) {}

    triggerToast(reason === 'inactivity' ? 'Session timed out due to screen inactivity.' : 'Logged out successfully.');
  };

  // Inactivity Auto-Logout Watcher (Screen Idle timer)
  useEffect(() => {
    if (!currentUser) return;

    lastActiveRef.current = Date.now();
    sessionStorage.setItem('staffpulse_last_active', String(Date.now()));
    localStorage.setItem('staffpulse_last_active', String(Date.now()));
    localStorage.setItem('staffpulse_had_session', 'true');

    const resetActivity = () => {
      lastActiveRef.current = Date.now();
      sessionStorage.setItem('staffpulse_last_active', String(Date.now()));
      localStorage.setItem('staffpulse_last_active', String(Date.now()));
      setIsIdleWarningOpen(false);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(evt => {
      window.addEventListener(evt, resetActivity, { passive: true });
    });

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastActiveRef.current;

      if (elapsed >= IDLE_TIMEOUT_MS) {
        handleLogout('inactivity');
      } else if (elapsed >= WARNING_TIMEOUT_MS) {
        setIsIdleWarningOpen(true);
        const remaining = Math.max(1, Math.ceil((IDLE_TIMEOUT_MS - elapsed) / 1000));
        setCountdownSeconds(remaining);
      } else {
        setIsIdleWarningOpen(false);
      }
    }, 1000);

    return () => {
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, resetActivity);
      });
      clearInterval(intervalId);
    };
  }, [currentUser]);

  // Sync theme
  useEffect(() => {
    saveTheme(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync session user
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('staffpulse_user_v4', JSON.stringify(currentUser));
      localStorage.setItem('staffpulse_user_v4', JSON.stringify(currentUser));
      sessionStorage.setItem('staffpulse_last_active', String(Date.now()));
      localStorage.setItem('staffpulse_last_active', String(Date.now()));
      localStorage.setItem('staffpulse_had_session', 'true');
    } else {
      sessionStorage.removeItem('staffpulse_user_v4');
      localStorage.removeItem('staffpulse_user_v4');
    }
  }, [currentUser]);

  // Live Server Database Synchronization (Multi-Device Real-time)
  useEffect(() => {
    let isMounted = true;

    async function syncWithServer(isBackground = false) {
      if (!isBackground) setSyncStatus('syncing');
      const res = await fetchServerSync();
      if (!isMounted) return;

      if (res.success && res.data) {
        const { data } = res;
        if (data.employees) setEmployees(data.employees);
        if (data.attendance) setAttendance(data.attendance);
        if (data.leaves) setLeaves(data.leaves);
        if (data.advances) setAdvances(data.advances);
        if (data.expenses) setExpenses(data.expenses);
        if (data.config) setConfig(prev => ({ ...prev, ...data.config }));
        if (data.adminCreds) setAdminCreds(data.adminCreds);
        setSyncStatus('synced');
        isInitialSyncDone.current = true;
      } else {
        setSyncStatus('offline');
        isInitialSyncDone.current = true;
      }
    }

    syncWithServer();

    // Auto-fetch updates from server every 8 seconds (e.g. mobile punches / admin updates)
    const interval = setInterval(() => {
      syncWithServer(true);
    }, 8000);

    // Immediate sync when user switches back to tab or unlocks phone
    const handleFocus = () => {
      syncWithServer();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Sync state to LocalStorage & Server Cloud Database
  useEffect(() => {
    saveEmployees(employees);
    if (isInitialSyncDone.current) {
      setSyncStatus('syncing');
      pushServerSync({ employees }).then(() => setSyncStatus('synced'));
    }
  }, [employees]);

  useEffect(() => {
    saveAttendance(attendance);
    if (isInitialSyncDone.current) {
      setSyncStatus('syncing');
      pushServerSync({ attendance }).then(() => setSyncStatus('synced'));
    }
  }, [attendance]);

  useEffect(() => {
    saveLeaveRequests(leaves);
    if (isInitialSyncDone.current) {
      setSyncStatus('syncing');
      pushServerSync({ leaves }).then(() => setSyncStatus('synced'));
    }
  }, [leaves]);

  useEffect(() => {
    saveConfig(config);
    if (isInitialSyncDone.current) {
      setSyncStatus('syncing');
      pushServerSync({ config }).then(() => setSyncStatus('synced'));
    }
  }, [config]);

  useEffect(() => {
    saveAdminCreds(adminCreds);
    if (isInitialSyncDone.current) {
      setSyncStatus('syncing');
      pushServerSync({ adminCreds }).then(() => setSyncStatus('synced'));
    }
  }, [adminCreds]);

  useEffect(() => {
    saveAdvances(advances);
    if (isInitialSyncDone.current) {
      setSyncStatus('syncing');
      pushServerSync({ advances }).then(() => setSyncStatus('synced'));
    }
  }, [advances]);

  useEffect(() => {
    saveExpenses(expenses);
    if (isInitialSyncDone.current) {
      setSyncStatus('syncing');
      pushServerSync({ expenses }).then(() => setSyncStatus('synced'));
    }
  }, [expenses]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
  };

  // Wipe All Data cleanly on Local & Cloud Server
  const handleWipeCleanData = async () => {
    wipeAllStoredData();
    setEmployees([]);
    setAttendance({});
    setLeaves([]);
    setAdvances([]);
    setExpenses([]);
    setAdminCreds(defaultAdminCreds);
    await wipeCleanOnServer();
    sounds.playSuccess();
    triggerToast("All data wiped across all devices! Admin password reset to default 1234.");
  };

  // Optional Reload Demo Data on Local & Cloud Server
  const handleResetDemoData = async () => {
    if (window.confirm("Load sample corporate dataset for testing across all devices?")) {
      const freshHistory = generateCorporateHistory(DEMO_SAMPLE_EMPLOYEES);
      setEmployees(DEMO_SAMPLE_EMPLOYEES);
      setAttendance(freshHistory);
      setLeaves(INITIAL_LEAVE_REQUESTS);
      await resetDemoOnServer();
      sounds.playSuccess();
      triggerToast("Sample corporate records loaded on cloud server!");
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayOverview = getCompanyDailyOverview(todayStr, employees, attendance);
  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;

  // 1. UN-AUTHENTICATED: Show Single Unified Login Portal (Dynamic Role Detection)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950">
        <LoginView
          employees={employees}
          adminCreds={adminCreds}
          config={config}
          logoutNotice={logoutNotice}
          onClearLogoutNotice={() => setLogoutNotice(null)}
          theme={theme}
          setTheme={setTheme}
          onLoginSuccess={(auth) => {
            setCurrentUser(auth);
            setLogoutNotice(null);
            if (auth.role === 'admin') {
              triggerToast("Authenticated as HR Administrator");
            } else if (auth.role === 'manager') {
              triggerToast(`Welcome back, Manager ${auth.user?.name || auth.employee?.name || ''}!`);
            } else {
              triggerToast(`Welcome to your station, ${auth.user?.name || auth.employee?.name || ''}!`);
            }
          }}
        />
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage('')}
        />
      </div>
    );
  }

  // 2. EMPLOYEE ROLE: Render Dedicated Self-Service Portal Only (Strict Data Isolation)
  if (currentUser.role === 'employee') {
    const activeEmployee = employees.find(e => e.id === currentUser.employee?.id || e.id === currentUser.user?.id) || currentUser.employee || currentUser.user;

    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {/* Header for Employee */}
        <Navbar
          config={config}
          setConfig={setConfig}
          theme={theme}
          setTheme={setTheme}
          currentUser={currentUser}
          notifications={INITIAL_NOTIFICATIONS}
          syncStatus={syncStatus}
          onLogout={() => handleLogout('manual')}
        />

        {/* Employee Self-Service Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto overflow-y-auto">
          <ErrorBoundary>
            <EmployeePortalView
              employee={activeEmployee}
              attendance={attendance}
              setAttendance={setAttendance}
              leaves={leaves}
              setLeaves={setLeaves}
              advances={advances}
              expenses={expenses}
              config={config}
              onSaveToast={triggerToast}
            />
          </ErrorBoundary>
        </main>

        {/* Screen Inactivity Warning Modal (Exact Blinkit UX) */}
        {isIdleWarningOpen && currentUser && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-400 dark:border-amber-600/80 p-6 space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-2xl shadow-xs animate-pulse">
                ⏰
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Screen Inactivity Alert
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Security ke liye aapka session <strong className="text-rose-600 font-extrabold text-sm">{countdownSeconds}s</strong> mein auto-logout ho jayega.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    lastActiveRef.current = Date.now();
                    sessionStorage.setItem('staffpulse_last_active', String(Date.now()));
                    localStorage.setItem('staffpulse_last_active', String(Date.now()));
                    setIsIdleWarningOpen(false);
                    sounds.playSuccess();
                  }}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition transform active:scale-98"
                >
                  Main Active Hoon (Continue Session)
                </button>
                <button
                  type="button"
                  onClick={() => handleLogout('manual')}
                  className="w-full py-2 text-xs font-bold text-slate-400 hover:text-rose-600 transition"
                >
                  Abhi Logout Karein
                </button>
              </div>
            </div>
          </div>
        )}

        <Toast
          message={toastMessage}
          onClose={() => setToastMessage('')}
        />
      </div>
    );
  }

  // 3. ADMIN & MANAGER ROLES: Render Corporate Workspace (Scoped by Role)
  const isManager = currentUser.role === 'manager';
  const effectiveTab = (isManager && (currentTab === 'settings' || currentTab === 'audit')) 
    ? 'dashboard' 
    : currentTab;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top Executive Navigation */}
      <Navbar
        config={config}
        setConfig={setConfig}
        theme={theme}
        setTheme={setTheme}
        currentUser={currentUser}
        syncStatus={syncStatus}
        onLogout={() => handleLogout('manual')}
        onOpenUserAccess={() => setIsUserAccessOpen(true)}
        onResetDemo={handleResetDemoData}
        notifications={INITIAL_NOTIFICATIONS}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        
        {/* Navigation Sidebar (Scoped by Role) */}
        <Sidebar
          currentTab={effectiveTab}
          setCurrentTab={setCurrentTab}
          config={config}
          role={currentUser.role}
          pendingLeavesCount={pendingLeavesCount}
          todayLateCount={todayOverview.late}
        />

        {/* Tab View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <ErrorBoundary onReset={() => setCurrentTab('dashboard')}>
            {effectiveTab === 'dashboard' && (
            <DashboardView
              employees={employees}
              attendance={attendance}
              config={config}
              onNavigate={setCurrentTab}
              onSelectEmployee={setSelectedEmployee}
            />
          )}

          {effectiveTab === 'mark' && (
            <MarkAttendanceView
              employees={employees}
              attendance={attendance}
              setAttendance={setAttendance}
              config={config}
              onSaveToast={triggerToast}
              onSelectEmployee={setSelectedEmployee}
              onNavigate={setCurrentTab}
            />
          )}

          {effectiveTab === 'monthly' && (
            <MonthlyAttendanceView
              employees={employees}
              attendance={attendance}
              setAttendance={setAttendance}
              config={config}
              onSelectEmployee={setSelectedEmployee}
              onSaveToast={triggerToast}
              onNavigate={setCurrentTab}
            />
          )}

          {effectiveTab === 'kiosk' && (
            <KioskView
              employees={employees}
              attendance={attendance}
              setAttendance={setAttendance}
              config={config}
              onSaveToast={triggerToast}
            />
          )}

          {effectiveTab === 'employees' && (
            <MembersView
              employees={employees}
              setEmployees={setEmployees}
              attendance={attendance}
              advances={advances}
              setAdvances={setAdvances}
              expenses={expenses}
              setExpenses={setExpenses}
              config={config}
              setConfig={setConfig}
              onSelectEmployee={setSelectedEmployee}
              onSaveToast={triggerToast}
              role={currentUser.role}
            />
          )}

          {effectiveTab === 'leaves' && (
            <LeaveRequestsView
              leaves={leaves}
              setLeaves={setLeaves}
              employees={employees}
              setEmployees={setEmployees}
              onSaveToast={triggerToast}
            />
          )}

          {effectiveTab === 'reports' && (
            <ReportsView
              employees={employees}
              attendance={attendance}
              advances={advances}
              setAdvances={setAdvances}
              expenses={expenses}
              setExpenses={setExpenses}
              config={config}
              onSaveToast={triggerToast}
              role={currentUser.role}
            />
          )}

          {effectiveTab === 'audit' && !isManager && (
            <AuditTrailView
              onSaveToast={triggerToast}
            />
          )}

          {effectiveTab === 'settings' && !isManager && (
            <SettingsView
              config={config}
              setConfig={setConfig}
              employees={employees}
              setEmployees={setEmployees}
              attendance={attendance}
              setAttendance={setAttendance}
              leaves={leaves}
              setLeaves={setLeaves}
              adminCreds={adminCreds}
              setAdminCreds={setAdminCreds}
              onResetDemo={handleResetDemoData}
              onWipeCleanData={handleWipeCleanData}
              onSaveToast={triggerToast}
            />
          )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Quick Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={setIsSearchOpen}
        employees={employees}
        onSelectEmployee={setSelectedEmployee}
        onNavigate={setCurrentTab}
      />

      {/* Employee Dossier & Heatmap Modal */}
      {selectedEmployee && (
        <ErrorBoundary>
          <MemberProfileModal
            employee={selectedEmployee}
            attendance={attendance}
            advances={advances}
            setAdvances={setAdvances}
            expenses={expenses}
            config={config}
            onClose={() => setSelectedEmployee(null)}
          />
        </ErrorBoundary>
      )}

      {/* Team Access & Security PIN Manager Modal */}
      {isUserAccessOpen && (
        <UserAccessModal
          isOpen={isUserAccessOpen}
          onClose={() => setIsUserAccessOpen(false)}
          employees={employees}
          setEmployees={setEmployees}
          adminCreds={adminCreds}
          setAdminCreds={setAdminCreds}
          config={config}
          onSaveToast={triggerToast}
        />
      )}

      {/* SCREEN INACTIVITY ALERT MODAL (Exact Blinkit UX) */}
      {isIdleWarningOpen && currentUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-400 dark:border-amber-600/80 p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-2xl shadow-xs animate-pulse">
              ⏰
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Screen Inactivity Alert
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Security ke liye aapka session <strong className="text-rose-600 font-extrabold text-sm">{countdownSeconds}s</strong> mein auto-logout ho jayega.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  lastActiveRef.current = Date.now();
                  sessionStorage.setItem('staffpulse_last_active', String(Date.now()));
                  localStorage.setItem('staffpulse_last_active', String(Date.now()));
                  setIsIdleWarningOpen(false);
                  sounds.playSuccess();
                }}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition transform active:scale-98"
              >
                Main Active Hoon (Continue Session)
              </button>

              <button
                type="button"
                onClick={() => handleLogout('manual')}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-rose-600 transition"
              >
                Abhi Logout Karein
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Animated Toast */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage('')}
      />

    </div>
  );
}
