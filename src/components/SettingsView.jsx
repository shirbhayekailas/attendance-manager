import React, { useRef, useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Building2, 
  Clock, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Info, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Building, 
  Plus, 
  X,
  Zap,
  Users,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { 
  exportCorporateBackup, 
  saveAdminCreds, 
  saveEmployees, 
  saveAttendance, 
  saveLeaveRequests, 
  saveAdvances, 
  saveExpenses, 
  saveHolidays, 
  saveAssets, 
  savePerformance, 
  saveHelpdesk, 
  saveRegularizations, 
  saveConfig 
} from '../utils/storage';
import { sounds } from '../utils/sound';

export default function SettingsView({ 
  config, 
  setConfig, 
  employees, 
  setEmployees, 
  attendance, 
  setAttendance, 
  leaves = [], 
  setLeaves, 
  advances = [],
  setAdvances,
  expenses = [],
  setExpenses,
  holidays = [],
  setHolidays,
  assets = [],
  setAssets,
  performance = [],
  setPerformance,
  helpdesk = [],
  setHelpdesk,
  regularizations = [],
  setRegularizations,
  adminCreds = { id: 'admin', email: 'admin@company.com', password: '1234' },
  setAdminCreds,
  onWipeCleanData, 
  onSaveToast 
}) {
  const fileInputRef = useRef(null);

  // Admin Password Management state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState(null);

  // Department Management state
  const [newDeptName, setNewDeptName] = useState('');
  const currentDepts = config.departments || [
    'Engineering', 
    'Design', 
    'Human Resources', 
    'Sales & Growth', 
    'Finance', 
    'Operations', 
    'Marketing', 
    'Product'
  ];

  // Shift Management state
  const currentShifts = config.shifts || [
    { id: 'S1', name: 'General Shift', startTime: '09:30 AM', endTime: '06:30 PM', workHours: 9, minHoursFullDay: 8, minHoursHalfDay: 4, graceMinutes: 15, otRateMultiplier: 1.5, isDefault: true },
    { id: 'S2', name: 'Morning Shift', startTime: '06:00 AM', endTime: '02:00 PM', workHours: 8, minHoursFullDay: 8, minHoursHalfDay: 4, graceMinutes: 10, otRateMultiplier: 1.5, isDefault: false },
    { id: 'S3', name: 'Evening / Night Shift', startTime: '02:00 PM', endTime: '10:00 PM', workHours: 8, minHoursFullDay: 8, minHoursHalfDay: 4, graceMinutes: 10, otRateMultiplier: 2.0, isDefault: false },
    { id: 'S4', name: 'Factory 12H Shift', startTime: '08:00 AM', endTime: '08:00 PM', workHours: 12, minHoursFullDay: 11, minHoursHalfDay: 6, graceMinutes: 15, otRateMultiplier: 2.0, isDefault: false }
  ];

  const currentOtRules = config.overtimeRules || {
    enabled: true,
    minOvertimeMinutes: 30,
    otMultiplierNormal: 1.5,
    otMultiplierSunday: 2.0,
    otMultiplierHoliday: 2.0
  };

  const [isAddingShift, setIsAddingShift] = useState(false);
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftStart, setNewShiftStart] = useState('09:00 AM');
  const [newShiftEnd, setNewShiftEnd] = useState('06:00 PM');
  const [newShiftGrace, setNewShiftGrace] = useState(15);
  const [newShiftHours, setNewShiftHours] = useState(9);
  const [newShiftOtRate, setNewShiftOtRate] = useState(1.5);

  const handleAddShift = (e) => {
    e.preventDefault();
    if (!newShiftName.trim()) return;
    const newShiftObj = {
      id: `S${Date.now()}`,
      name: newShiftName.trim(),
      startTime: newShiftStart,
      endTime: newShiftEnd,
      workHours: Number(newShiftHours) || 8,
      minHoursFullDay: Number(newShiftHours) >= 12 ? 11 : 8,
      minHoursHalfDay: 4,
      graceMinutes: Number(newShiftGrace) || 15,
      otRateMultiplier: Number(newShiftOtRate) || 1.5,
      isDefault: false
    };
    const updatedShifts = [...currentShifts, newShiftObj];
    const updatedConfig = { ...config, shifts: updatedShifts };
    setConfig(updatedConfig);
    saveConfig(updatedConfig);
    setNewShiftName('');
    setIsAddingShift(false);
    sounds.playSuccess();
    onSaveToast(`Added new shift: "${newShiftObj.name}"`);
  };

  const handleRemoveShift = (shiftId, shiftName) => {
    if (currentShifts.length <= 1) {
      alert("At least one shift must remain active.");
      return;
    }
    const assignedCount = employees.filter(e => e.shift?.includes(shiftName) || e.shiftType === shiftName).length;
    if (assignedCount > 0) {
      alert(`Cannot delete shift "${shiftName}" because ${assignedCount} employee(s) are assigned to it.`);
      return;
    }
    if (window.confirm(`Are you sure you want to remove the shift "${shiftName}"?`)) {
      const updatedShifts = currentShifts.filter(s => s.id !== shiftId);
      const updatedConfig = { ...config, shifts: updatedShifts };
      setConfig(updatedConfig);
      saveConfig(updatedConfig);
      sounds.playSuccess();
      onSaveToast(`Removed shift "${shiftName}"`);
    }
  };

  const handleUpdateOtRuleField = (field, val) => {
    const updatedOt = { ...currentOtRules, [field]: val };
    const updatedConfig = { ...config, overtimeRules: updatedOt };
    setConfig(updatedConfig);
    saveConfig(updatedConfig);
    onSaveToast(`Overtime setting updated!`);
  };

  const handleAddDepartment = (e) => {
    e.preventDefault();
    const trimmed = newDeptName.trim();
    if (!trimmed) return;
    if (currentDepts.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      alert("This department already exists!");
      return;
    }
    const updated = [...currentDepts, trimmed];
    setConfig({ ...config, departments: updated });
    saveConfig({ ...config, departments: updated });
    setNewDeptName('');
    sounds.playSuccess();
    onSaveToast(`Added new department: "${trimmed}"`);
  };

  const handleRemoveDepartment = (deptToRemove) => {
    const count = employees.filter(e => e.department === deptToRemove).length;
    if (count > 0) {
      alert(`Cannot delete "${deptToRemove}" because ${count} employee(s) are currently assigned to it. Please reassign them first.`);
      return;
    }
    if (window.confirm(`Are you sure you want to remove the "${deptToRemove}" department?`)) {
      const updated = currentDepts.filter(d => d !== deptToRemove);
      setConfig({ ...config, departments: updated });
      saveConfig({ ...config, departments: updated });
      sounds.playSuccess();
      onSaveToast(`Removed department "${deptToRemove}"`);
    }
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    setPassMsg(null);

    const actualCurrent = adminCreds?.password || '1234';
    if (currentPass !== actualCurrent) {
      sounds.playWarning();
      setPassMsg({ type: 'error', text: 'Current password does not match!' });
      return;
    }

    if (!newPass || newPass.trim().length < 3) {
      sounds.playWarning();
      setPassMsg({ type: 'error', text: 'New password must be at least 3 characters long.' });
      return;
    }

    if (newPass !== confirmPass) {
      sounds.playWarning();
      setPassMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    const updated = {
      ...adminCreds,
      password: newPass.trim(),
    };

    setAdminCreds(updated);
    saveAdminCreds(updated);
    sounds.playSuccess();
    setPassMsg({ type: 'success', text: 'Admin password updated successfully!' });
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    onSaveToast('Admin master password updated successfully!');
  };

  const handleExportBackup = () => {
    sounds.playSuccess();
    exportCorporateBackup({
      employees,
      attendance,
      leaves,
      advances,
      expenses,
      holidays,
      assets,
      performance,
      helpdesk,
      regularizations,
      config,
      adminCreds
    });
    onSaveToast("Complete System Backup JSON generated & downloaded!");
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.employees && parsed.attendance) {
          const empList = parsed.employees || [];
          const attDict = parsed.attendance || {};
          
          setEmployees(empList);
          saveEmployees(empList);
          
          setAttendance(attDict);
          saveAttendance(attDict);

          if (parsed.leaves && setLeaves) {
            setLeaves(parsed.leaves);
            saveLeaveRequests(parsed.leaves);
          }
          if (parsed.advances && setAdvances) {
            setAdvances(parsed.advances);
            saveAdvances(parsed.advances);
          }
          if (parsed.expenses && setExpenses) {
            setExpenses(parsed.expenses);
            saveExpenses(parsed.expenses);
          }
          if (parsed.holidays && setHolidays) {
            setHolidays(parsed.holidays);
            saveHolidays(parsed.holidays);
          }
          if (parsed.assets && setAssets) {
            setAssets(parsed.assets);
            saveAssets(parsed.assets);
          }
          if (parsed.performance && setPerformance) {
            setPerformance(parsed.performance);
            savePerformance(parsed.performance);
          }
          if (parsed.helpdesk && setHelpdesk) {
            setHelpdesk(parsed.helpdesk);
            saveHelpdesk(parsed.helpdesk);
          }
          if (parsed.regularizations && setRegularizations) {
            setRegularizations(parsed.regularizations);
            saveRegularizations(parsed.regularizations);
          }
          if (parsed.config && setConfig) {
            setConfig(parsed.config);
            saveConfig(parsed.config);
          }
          if (parsed.adminCreds && setAdminCreds) {
            setAdminCreds(parsed.adminCreds);
            saveAdminCreds(parsed.adminCreds);
          }

          sounds.playSuccess();
          onSaveToast(`Database Restored! ${empList.length} employees, ${Object.keys(attDict).length} attendance dates restored.`);
        } else {
          alert("Invalid backup file: Must contain employees and attendance data.");
        }
      } catch (err) {
        alert("Failed to parse backup file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-500" />
            <span>Company Policies & Security Settings</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure HR credentials, company branding, shift rules, and database backups.
          </p>
        </div>
      </div>

      {/* 🔐 Admin Password & Security Settings */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Admin Master Password & Access
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Default password is <span className="font-mono font-bold text-blue-500">1234</span>. Change it anytime to secure your portal.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Active
          </span>
        </div>

        {passMsg && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            passMsg.type === 'error'
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
          }`}>
            {passMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{passMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Current (default: 1234)"
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Enter new password"
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Repeat new password"
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Update Admin Password</span>
            </button>
          </div>
        </form>
      </div>

      {/* Company Profile Settings */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-500" />
          <span>Company Identity</span>
        </h3>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Company / Business Legal Name
          </label>
          <input
            type="text"
            value={config.companyName || ''}
            onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
            className="w-full p-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Official Registered Address (Printed on Letterhead &amp; Salary Slips)
          </label>
          <textarea
            rows={2}
            value={config.companyAddress || ''}
            onChange={(e) => setConfig({ ...config, companyAddress: e.target.value })}
            placeholder="e.g. 303, Panchsheel chs ltd, plot no 07, sec -02, taloja phase -01, navi mumbai -410208"
            className="w-full p-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>
      </div>

      {/* 🏢 Department & Business Units Manager */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Company Departments &amp; Business Units
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Add, customize, or remove departments for staff grouping, attendance filters, and payroll.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            {currentDepts.length} Units Active
          </span>
        </div>

        {/* Existing Department Badges */}
        <div className="flex flex-wrap gap-2 pt-1">
          {currentDepts.map((d) => {
            const count = employees.filter(e => e.department === d).length;
            return (
              <div 
                key={d}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
              >
                <span>{d}</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {count} staff
                </span>
                {count === 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDepartment(d)}
                    className="p-0.5 text-slate-400 hover:text-rose-500 transition-colors ml-0.5 rounded"
                    title={`Remove unused department "${d}"`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New Department Form */}
        <form onSubmit={handleAddDepartment} className="flex gap-2 pt-2">
          <input
            type="text"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            placeholder="Type new department name (e.g. Accounts, Legal, Logistics, QA)..."
            className="flex-1 p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md shadow-blue-600/25 transition-all whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Department</span>
          </button>
        </form>
      </div>

      {/* ⏱️ Shift Roster Management & Dynamic Overtime Rules */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Shift Roster Management &amp; Punctuality Policy
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Configure standard 8h, 9h, and 12h shifts, grace periods, and late penalty parameters.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddingShift(!isAddingShift)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingShift ? 'Close' : 'Add New Shift'}</span>
          </button>
        </div>

        {/* Add New Shift Form */}
        {isAddingShift && (
          <form onSubmit={handleAddShift} className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/60 space-y-3 animate-fade-in">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">Create New Operating Shift</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Shift Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Night Shift / 12H Plant"
                  value={newShiftName}
                  onChange={(e) => setNewShiftName(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Start Time *</label>
                <input
                  type="text"
                  required
                  placeholder="08:00 AM"
                  value={newShiftStart}
                  onChange={(e) => setNewShiftStart(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">End Time *</label>
                <input
                  type="text"
                  required
                  placeholder="08:00 PM"
                  value={newShiftEnd}
                  onChange={(e) => setNewShiftEnd(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Duration (Hours)</label>
                <input
                  type="number"
                  min="4"
                  max="16"
                  value={newShiftHours}
                  onChange={(e) => setNewShiftHours(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Grace Period (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={newShiftGrace}
                  onChange={(e) => setNewShiftGrace(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">OT Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="3"
                  value={newShiftOtRate}
                  onChange={(e) => setNewShiftOtRate(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingShift(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25"
              >
                Save Shift
              </button>
            </div>
          </form>
        )}

        {/* Configured Shifts Roster Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentShifts.map((s) => {
            const assignedCount = employees.filter(e => e.shift?.includes(s.name) || e.shift?.includes(s.startTime) || (s.isDefault && !e.shift)).length;
            return (
              <div 
                key={s.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{s.name}</span>
                    {s.isDefault && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {assignedCount} Staff
                    </span>
                    {!s.isDefault && assignedCount === 0 && (
                      <button
                        onClick={() => handleRemoveShift(s.id, s.name)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                        title="Delete Shift"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Timings</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{s.startTime} - {s.endTime}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Duration / Grace</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{s.workHours || 9}h • {s.graceMinutes || 15}m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">OT Multiplier</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">{s.otRateMultiplier || 1.5}x Pay</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Overtime Calculation Rules */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Dynamic Overtime (OT) Pay Rules &amp; Multipliers
              </h4>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={currentOtRules.enabled} 
                onChange={(e) => handleUpdateOtRuleField('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              <span className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                {currentOtRules.enabled ? 'Active' : 'Disabled'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Min. OT Trigger (Minutes)
              </label>
              <input
                type="number"
                min="15"
                max="120"
                step="15"
                value={currentOtRules.minOvertimeMinutes}
                onChange={(e) => handleUpdateOtRuleField('minOvertimeMinutes', parseInt(e.target.value, 10) || 30)}
                className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Minimum extra work before OT counts</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Normal Day OT Multiplier
              </label>
              <input
                type="number"
                min="1.0"
                max="3.0"
                step="0.25"
                value={currentOtRules.otMultiplierNormal}
                onChange={(e) => handleUpdateOtRuleField('otMultiplierNormal', parseFloat(e.target.value) || 1.5)}
                className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Default 1.5x regular hourly wage</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sunday / Week-Off Duty Multiplier
              </label>
              <input
                type="number"
                min="1.0"
                max="3.0"
                step="0.25"
                value={currentOtRules.otMultiplierSunday}
                onChange={(e) => handleUpdateOtRuleField('otMultiplierSunday', parseFloat(e.target.value) || 2.0)}
                className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Default 2.0x (Double Pay for Sunday Duty)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 💾 1-Click Complete System Backup & Instant Restore */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                1-Click Complete Corporate Backup &amp; Instant Recovery
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Safely export and restore all staff records, biometric logs, advances, holidays, and settings.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Auto Synced
          </span>
        </div>

        {/* Live Database Inventory Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Staff Members</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">{employees.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attendance Days</span>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400">{Object.keys(attendance).length}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Salary Advances</span>
            <span className="text-lg font-black text-purple-600 dark:text-purple-400">{advances.length}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Leave Records</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{leaves.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Export JSON Button */}
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/25 active:scale-98 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download 1-Click Complete Backup (.json)</span>
          </button>

          {/* Import JSON Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportBackup}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/25 active:scale-98 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Restore Backup from JSON File</span>
            </button>
          </div>

          {/* Wipe All Data Clean Button */}
          <button
            onClick={onWipeCleanData}
            className="col-span-1 sm:col-span-2 flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 transition-colors border border-rose-300 dark:border-rose-800 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Wipe Database &amp; Reset to Clean Slate</span>
          </button>
        </div>
      </div>

      {/* System Information */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          <span>StaffPulse PRO Enterprise HR Suite • Production Ready</span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">ISO 27001 Security Standard</span>
      </div>

    </div>
  );
}
