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
  X
} from 'lucide-react';
import { exportCorporateBackup, saveAdminCreds } from '../utils/storage';
import { sounds } from '../utils/sound';

export default function SettingsView({ 
  config, 
  setConfig, 
  employees, 
  setEmployees, 
  attendance, 
  setAttendance, 
  leaves, 
  setLeaves, 
  adminCreds = { id: 'admin', email: 'admin@company.com', password: '1234' },
  setAdminCreds,
  onResetDemo, 
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
    exportCorporateBackup(employees, attendance, leaves, config);
    onSaveToast("Corporate HR backup JSON exported successfully!");
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.employees && parsed.attendance) {
          setEmployees(parsed.employees);
          setAttendance(parsed.attendance);
          if (parsed.leaves) setLeaves(parsed.leaves);
          if (parsed.config) setConfig(parsed.config);
          onSaveToast("Company data restored successfully!");
        } else {
          alert("Invalid backup file structure!");
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
            value={config.companyName}
            onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
            className="w-full p-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
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

      {/* Shift Timing & Grace Rules */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500" />
          <span>Shift Timings & Punctuality Policy</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Shift Start Time
            </label>
            <input
              type="text"
              value={config.shiftStart}
              onChange={(e) => setConfig({ ...config, shiftStart: e.target.value })}
              className="w-full p-2.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Shift End Time
            </label>
            <input
              type="text"
              value={config.shiftEnd}
              onChange={(e) => setConfig({ ...config, shiftEnd: e.target.value })}
              className="w-full p-2.5 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Grace Period (Minutes)
            </label>
            <input
              type="number"
              value={config.graceMinutes}
              onChange={(e) => setConfig({ ...config, graceMinutes: parseInt(e.target.value, 10) || 0 })}
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          * Clock-ins past {config.shiftStart} + {config.graceMinutes}m grace period are automatically flagged as "Late" check-ins.
        </p>
      </div>

      {/* Data Backup & Demo Data */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-500" />
          <span>Corporate Database & Backups</span>
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Employee attendance, shift punches, and leave logs are preserved offline in browser LocalStorage. 
          You can download a complete JSON backup for company archival.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Export JSON */}
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-2 p-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span>Export Corporate JSON Backup</span>
          </button>

          {/* Import JSON */}
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
              className="w-full flex items-center justify-center gap-2 p-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>Import & Restore Backup</span>
            </button>
          </div>

          {/* Reload Demo Data */}
          <button
            onClick={onResetDemo}
            className="flex items-center justify-center gap-2 p-3 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 transition-colors border border-amber-200 dark:border-amber-800/60"
          >
            <RotateCcw className="w-4 h-4 text-amber-500" />
            <span>Reload 30-Day Corporate Records</span>
          </button>

          {/* Wipe All Data Clean */}
          <button
            onClick={onWipeCleanData}
            className="col-span-1 sm:col-span-2 flex items-center justify-center gap-2 p-3 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 transition-colors border border-rose-300 dark:border-rose-800"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Wipe All Demo Data & Reset to Clean Slate</span>
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
