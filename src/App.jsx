import React, { useState, useEffect } from 'react';
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
  defaultAdminCreds,
  wipeAllStoredData,
  defaultCompanyConfig 
} from './utils/storage';
import { getCompanyDailyOverview } from './utils/attendanceCalculations';
import { sounds } from './utils/sound';

export default function App() {
  const stored = loadStoredData();

  // Clean slate data
  const [employees, setEmployees] = useState(() => stored.employees || []);
  const [attendance, setAttendance] = useState(() => stored.attendance || {});
  const [leaves, setLeaves] = useState(() => stored.leaves || []);
  const [advances, setAdvances] = useState(() => stored.advances || []);
  const [adminCreds, setAdminCreds] = useState(() => stored.adminCreds || defaultAdminCreds);

  const [config, setConfig] = useState(() => stored.config || defaultCompanyConfig);
  const [theme, setTheme] = useState(() => stored.theme || 'dark');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Authentication & RBAC User State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('staffpulse_user_v4');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null; // Prompt login by default
  });

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
      localStorage.setItem('staffpulse_user_v4', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('staffpulse_user_v4');
    }
  }, [currentUser]);

  // Sync state to LocalStorage
  useEffect(() => {
    saveEmployees(employees);
  }, [employees]);

  useEffect(() => {
    saveAttendance(attendance);
  }, [attendance]);

  useEffect(() => {
    saveLeaveRequests(leaves);
  }, [leaves]);

  useEffect(() => {
    saveConfig(config);
  }, [config]);

  useEffect(() => {
    saveAdminCreds(adminCreds);
  }, [adminCreds]);

  useEffect(() => {
    saveAdvances(advances);
  }, [advances]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
  };

  // Wipe All Data cleanly
  const handleWipeCleanData = () => {
    wipeAllStoredData();
    setEmployees([]);
    setAttendance({});
    setLeaves([]);
    setAdminCreds(defaultAdminCreds);
    sounds.playSuccess();
    triggerToast("All data wiped! Admin password reset to default 1234.");
  };

  // Optional Reload Demo Data (in Settings only)
  const handleResetDemoData = () => {
    if (window.confirm("Load sample corporate dataset for testing?")) {
      const freshHistory = generateCorporateHistory(DEMO_SAMPLE_EMPLOYEES);
      setEmployees(DEMO_SAMPLE_EMPLOYEES);
      setAttendance(freshHistory);
      setLeaves(INITIAL_LEAVE_REQUESTS);
      sounds.playSuccess();
      triggerToast("Sample corporate records loaded!");
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
          onLoginSuccess={(auth) => {
            setCurrentUser(auth);
            if (auth.role === 'admin') {
              triggerToast("Authenticated as HR Administrator");
            } else if (auth.role === 'manager') {
              triggerToast(`Welcome back, Manager ${auth.employee.name}!`);
            } else {
              triggerToast(`Welcome to your station, ${auth.employee.name}!`);
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

  // 2. EMPLOYEE ROLE: Render Dedicated Self-Service Portal Only
  if (currentUser.role === 'employee') {
    const activeEmployee = employees.find(e => e.id === currentUser.employee?.id) || currentUser.employee;

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
          onLogout={() => {
            setCurrentUser(null);
            triggerToast("Logged out of Employee Portal");
          }}
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
              config={config}
              onSaveToast={triggerToast}
            />
          </ErrorBoundary>
        </main>

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
        onLogout={() => {
          setCurrentUser(null);
          triggerToast("Logged out successfully.");
        }}
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
              config={config}
              setConfig={setConfig}
              onSelectEmployee={setSelectedEmployee}
              onSaveToast={triggerToast}
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
              config={config}
              onSaveToast={triggerToast}
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
        <MemberProfileModal
          employee={selectedEmployee}
          attendance={attendance}
          advances={advances}
          setAdvances={setAdvances}
          config={config}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

      {/* Floating Animated Toast */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage('')}
      />

    </div>
  );
}
