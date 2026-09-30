import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  EyeOff, 
  UserCheck, 
  Building2, 
  Edit3, 
  RotateCcw, 
  Share2, 
  Search, 
  Check, 
  Lock, 
  Phone, 
  AlertTriangle, 
  Sparkles, 
  Users, 
  Shield, 
  CheckCircle2,
  Briefcase,
  MessageCircle
} from 'lucide-react';
import { updateUserPinOnServer, updateUserRoleOnServer } from '../utils/apiClient';
import { sounds } from '../utils/sound';

export default function UserAccessModal({
  isOpen,
  onClose,
  employees = [],
  setEmployees,
  adminCreds,
  setAdminCreds,
  config,
  onSaveToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'admin' | 'manager' | 'employee' | 'master_pass'
  const [visiblePins, setVisiblePins] = useState({}); // { [empId]: boolean }
  const [editingPinEmpId, setEditingPinEmpId] = useState(null);
  const [tempPin, setTempPin] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Master Admin Password Change state
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminCurrentInput, setAdminCurrentInput] = useState('');
  const [adminNewInput, setAdminNewInput] = useState('');
  const [adminConfirmInput, setAdminConfirmInput] = useState('');
  const [adminError, setAdminError] = useState('');

  if (!isOpen) return null;

  const togglePinVisibility = (id) => {
    setVisiblePins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStartEditPin = (emp) => {
    setEditingPinEmpId(emp.id);
    setTempPin(emp.password || emp.pin || '1234');
  };

  const handleSavePin = async (empId) => {
    const clean = tempPin.trim();
    if (!clean || clean.length < 4) {
      alert('PIN kam se kam 4 characters ka hona chahiye.');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await updateUserPinOnServer({ empId, newPin: clean });
      if (res && res.employees) {
        setEmployees(res.employees);
      } else {
        // Fallback local update
        setEmployees(prev => prev.map(e => e.id === empId ? { ...e, password: clean, pin: clean } : e));
      }
      setEditingPinEmpId(null);
      sounds.playSuccess();
      onSaveToast(`PIN updated successfully for ${empId}!`);
    } catch (err) {
      alert('Failed to update PIN: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetPin = async (emp) => {
    if (window.confirm(`${emp.name} (${emp.id}) ka PIN reset karke default '1234' karna chahte hain?`)) {
      setIsUpdating(true);
      try {
        const res = await updateUserPinOnServer({ empId: emp.id, newPin: '1234' });
        if (res && res.employees) {
          setEmployees(res.employees);
        } else {
          setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, password: '1234', pin: '1234' } : e));
        }
        sounds.playSuccess();
        onSaveToast(`${emp.name} ka PIN '1234' par reset ho gaya!`);
      } catch (err) {
        alert('Failed to reset PIN: ' + err.message);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleChangeRole = async (empId, newRole) => {
    setIsUpdating(true);
    try {
      const res = await updateUserRoleOnServer({ empId, newRole });
      if (res && res.employees) {
        setEmployees(res.employees);
      } else {
        setEmployees(prev => prev.map(e => e.id === empId ? { ...e, accessLevel: newRole } : e));
      }
      sounds.playSuccess();
      onSaveToast(`Role changed to ${newRole.toUpperCase()} for ${empId}!`);
    } catch (err) {
      alert('Failed to change role: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShareCredentialsWhatsApp = (emp) => {
    const pin = emp.password || emp.pin || '1234';
    const roleTitle = emp.accessLevel === 'manager' ? 'Site Supervisor / Manager' : 'Staff Employee';
    const msg = `*${config?.companyName || 'SK ENTERPRISES'} - Attendance Portal Access*\n` +
      `-----------------------------------------\n` +
      `Namaste *${emp.name}*,\n` +
      `Aapke Attendance & Payroll Portal login details:\n\n` +
      `🌐 *Portal Link:* https://attendance-manager-pro-02o2.onrender.com\n` +
      `👤 *Login ID / Emp ID:* ${emp.id}\n` +
      `🔑 *Your PIN / Password:* ${pin}\n` +
      `🏷️ *Assigned Role:* ${roleTitle}\n\n` +
      `_Note: Suraksha ke liye apna PIN kisi se share na karein._`;

    const cleanPhone = String(emp.phone || '').replace(/[^0-9]/g, '');
    const phoneParam = cleanPhone.length >= 10 ? `&phone=91${cleanPhone.slice(-10)}` : '';
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}${phoneParam}`;
    window.open(url, '_blank');
  };

  const handleUpdateAdminPassword = (e) => {
    e.preventDefault();
    setAdminError('');

    if (adminCurrentInput !== (adminCreds.password || '1234')) {
      setAdminError('Current Admin password incorrect hai.');
      sounds.playWarning();
      return;
    }

    if (!adminNewInput || adminNewInput.trim().length < 4) {
      setAdminError('New Password kam se kam 4 characters ka hona chahiye.');
      sounds.playWarning();
      return;
    }

    if (adminNewInput !== adminConfirmInput) {
      setAdminError('New Password aur Confirm Password match nahi ho rahe hain.');
      sounds.playWarning();
      return;
    }

    const updated = {
      ...adminCreds,
      password: adminNewInput.trim(),
    };
    setAdminCreds(updated);
    sounds.playSuccess();
    onSaveToast('Admin Master Password successfully update ho gaya!');
    setAdminCurrentInput('');
    setAdminNewInput('');
    setAdminConfirmInput('');
    setActiveTab('all');
  };

  // User counts
  const totalEmployees = employees.length;
  const managersCount = employees.filter(e => e.accessLevel === 'manager').length;
  const employeesCount = employees.filter(e => !e.accessLevel || e.accessLevel === 'employee').length;

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = 
      (e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.department || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'manager') return e.accessLevel === 'manager';
    if (activeTab === 'employee') return !e.accessLevel || e.accessLevel === 'employee';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">Team Access & PIN Manager</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase tracking-wide">
                  RBAC Security
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium mt-0.5">
                {config?.companyName || 'SK ENTERPRISES'} • Control User Credentials, Roles & Permissions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Quick Counter Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <Users className="w-4 h-4 text-blue-500" />
            <div>
              <span className="text-[10px] text-slate-400 block font-normal">Total Accounts</span>
              <strong className="text-sm font-bold text-slate-800 dark:text-slate-100">{totalEmployees + 1}</strong>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-amber-500" />
            <div>
              <span className="text-[10px] text-slate-400 block font-normal">👑 Admins</span>
              <strong className="text-sm font-bold text-slate-800 dark:text-slate-100">1 Master</strong>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-indigo-500" />
            <div>
              <span className="text-[10px] text-slate-400 block font-normal">👔 Supervisors</span>
              <strong className="text-sm font-bold text-slate-800 dark:text-slate-100">{managersCount}</strong>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
            <Users className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="text-[10px] text-slate-400 block font-normal">👤 Staff Members</span>
              <strong className="text-sm font-bold text-slate-800 dark:text-slate-100">{employeesCount}</strong>
            </div>
          </div>
        </div>

        {/* Tab Filter & Search Header */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Users ({totalEmployees})
            </button>
            <button
              onClick={() => setActiveTab('manager')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'manager'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>👔 Supervisors</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-bold">{managersCount}</span>
            </button>
            <button
              onClick={() => setActiveTab('employee')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'employee'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>👤 Staff</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-bold">{employeesCount}</span>
            </button>
            <button
              onClick={() => setActiveTab('master_pass')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'master_pass'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Password</span>
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== 'master_pass' && (
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, ID, phone..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: MASTER ADMIN PASSWORD CHANGE */}
          {activeTab === 'master_pass' && (
            <div className="max-w-md mx-auto py-6 space-y-6">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Admin Master Password</strong>
                  Yeh password SK ENTERPRISES ke HR Admin account ka master password hai. Isse aap saare modules aur payroll unlock kar sakte hain.
                </div>
              </div>

              {adminError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateAdminPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Current Admin Password
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminPass ? "text" : "password"}
                      required
                      value={adminCurrentInput}
                      onChange={(e) => setAdminCurrentInput(e.target.value)}
                      placeholder="Enter current password (default 1234)"
                      className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    New Admin Password
                  </label>
                  <input
                    type="password"
                    required
                    value={adminNewInput}
                    onChange={(e) => setAdminNewInput(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={adminConfirmInput}
                    onChange={(e) => setAdminConfirmInput(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md transition active:scale-98"
                >
                  Update Admin Master Password
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: USER CARDS & ROLES */}
          {activeTab !== 'master_pass' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filteredEmployees.map((emp) => {
                const isManager = emp.accessLevel === 'manager';
                const currentPin = emp.password || emp.pin || '1234';
                const isPinVisible = visiblePins[emp.id];
                const isEditingThisPin = editingPinEmpId === emp.id;

                return (
                  <div
                    key={emp.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-xs hover:border-blue-500/40 transition-all space-y-3"
                  >
                    {/* Top Row: Avatar, Name, Role Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=3b82f6&color=fff`}
                          alt={emp.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{emp.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal">
                              {emp.id}
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {emp.role || 'Staff'} • {emp.department || 'Operations'}
                          </p>
                        </div>
                      </div>

                      {/* Role Selector Dropdown */}
                      <select
                        value={emp.accessLevel || 'employee'}
                        onChange={(e) => handleChangeRole(emp.id, e.target.value)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none transition cursor-pointer ${
                          isManager
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        <option value="employee">👤 Staff Employee</option>
                        <option value="manager">👔 Site Supervisor</option>
                        <option value="admin">👑 HR Administrator</option>
                      </select>
                    </div>

                    {/* Contact & Phone */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{emp.phone || 'No Phone'}</span>
                      </span>
                      <button
                        onClick={() => handleShareCredentialsWhatsApp(emp)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline"
                        title="Send login details to employee via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Share on WhatsApp</span>
                      </button>
                    </div>

                    {/* PIN Security Section */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">PIN:</span>
                        
                        {isEditingThisPin ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              autoFocus
                              maxLength={8}
                              value={tempPin}
                              onChange={(e) => setTempPin(e.target.value)}
                              className="w-20 px-2 py-0.5 text-xs font-mono font-bold rounded bg-white dark:bg-slate-800 border border-blue-500 text-slate-900 dark:text-white focus:outline-none"
                            />
                            <button
                              onClick={() => handleSavePin(emp.id)}
                              disabled={isUpdating}
                              className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPinEmpId(null)}
                              className="px-1.5 py-0.5 rounded text-slate-400 text-[10px] hover:text-slate-600"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-extrabold text-slate-800 dark:text-slate-100 tracking-wider">
                              {isPinVisible ? currentPin : '••••'}
                            </span>
                            <button
                              onClick={() => togglePinVisibility(emp.id)}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                              title={isPinVisible ? "Hide PIN" : "Show PIN"}
                            >
                              {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Action buttons: Change / Reset */}
                      {!isEditingThisPin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEditPin(emp)}
                            className="px-2 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold transition"
                          >
                            Change
                          </button>
                          <button
                            onClick={() => handleResetPin(emp)}
                            disabled={isUpdating}
                            className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold transition flex items-center gap-1"
                            title="Reset PIN to 1234"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Reset (1234)</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}

              {filteredEmployees.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                  Koi user account match nahi hua. Search query check karein.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Note */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Har user apne assigned PIN se kisi bhi phone ya browser se login kar sakta hai.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 font-bold text-xs"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
}
