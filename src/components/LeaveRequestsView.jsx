import React, { useState } from 'react';
import { 
  CalendarDays, 
  Check, 
  X, 
  Plus, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  Sparkles,
  ShieldCheck,
  Fingerprint,
  RotateCcw,
  CheckSquare2,
  FileSpreadsheet
} from 'lucide-react';
import { sounds } from '../utils/sound';

export default function LeaveRequestsView({ 
  leaves = [], 
  setLeaves, 
  employees = [], 
  setEmployees,
  onSaveToast,
  attendance = {},
  setAttendance,
  regularizations = [],
  setRegularizations
}) {
  const [activeTab, setActiveTab] = useState('leaves'); // 'leaves' | 'regularization'
  const [activeFilter, setActiveFilter] = useState('All');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);

  // Leave Form
  const [formData, setFormData] = useState({
    empId: employees[0]?.id || '',
    leaveType: 'Casual Leave (CL)',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    days: 1,
    reason: '',
  });

  // Regularization Form
  const [regForm, setRegForm] = useState({
    empId: employees[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    clockIn: '09:30 AM',
    clockOut: '06:30 PM',
    hours: 9.0,
    reason: 'Biometric device scanner glitch during morning muster',
  });

  const filteredLeaves = leaves.filter((l) => {
    if (activeFilter === 'All') return true;
    return l.status === activeFilter;
  });

  const pendingLeavesCount = leaves.filter(l => l.status === 'Pending').length;
  const pendingRegsCount = regularizations.filter(r => r.status === 'Pending').length;

  // LEAVE STATUS CHANGE
  const handleStatusChange = (id, newStatus) => {
    sounds.playSuccess();
    const targetLeave = leaves.find(l => l.id === id);
    if (!targetLeave) return;

    if (newStatus === 'Approved' && targetLeave.status !== 'Approved') {
      const typeKey = targetLeave.leaveType.includes('Casual') ? 'cl' : targetLeave.leaveType.includes('Sick') ? 'sl' : 'pl';
      if (setEmployees) {
        setEmployees(employees.map(emp => {
          if (emp.id === targetLeave.empId && emp.leaveBalance) {
            const currentVal = emp.leaveBalance[typeKey] || 0;
            return {
              ...emp,
              leaveBalance: {
                ...emp.leaveBalance,
                [typeKey]: Math.max(0, currentVal - targetLeave.days),
              }
            };
          }
          return emp;
        }));
      }
    }

    const updated = leaves.map(l => l.id === id ? { ...l, status: newStatus } : l);
    setLeaves(updated);
    onSaveToast(`Leave application #${id} marked as ${newStatus.toUpperCase()}!`);
  };

  const handleApproveAllPending = () => {
    sounds.playSuccess();
    const updated = leaves.map(l => l.status === 'Pending' ? { ...l, status: 'Approved' } : l);
    setLeaves(updated);
    onSaveToast(`All pending leave requests approved!`);
  };

  const handleApplyLeave = (e) => {
    e.preventDefault();
    sounds.playSuccess();
    const emp = employees.find(emp => emp.id === formData.empId);
    if (!emp) return;

    const newRequest = {
      id: `LR-${Math.floor(500 + Math.random() * 500)}`,
      empId: emp.id,
      empName: emp.name,
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      days: parseInt(formData.days, 10) || 1,
      reason: formData.reason,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0],
    };

    setLeaves([newRequest, ...leaves]);
    setIsApplyModalOpen(false);
    onSaveToast(`Leave request submitted for ${emp.name}!`);
  };

  // REGULARIZATION ACTIONS
  const handleRegStatusChange = (id, newStatus) => {
    sounds.playSuccess();
    const targetReg = regularizations.find(r => r.id === id);
    if (!targetReg) return;

    if (newStatus === 'Approved') {
      // Update attendance record immediately!
      if (setAttendance) {
        setAttendance(prev => {
          const dateStr = targetReg.date;
          const empId = targetReg.empId;
          const dayRecords = prev[dateStr] || {};
          const currentRec = dayRecords[empId] || {};

          return {
            ...prev,
            [dateStr]: {
              ...dayRecords,
              [empId]: {
                ...currentRec,
                status: 'present',
                clockIn: targetReg.requestedClockIn || targetReg.clockIn || '09:30 AM',
                clockOut: targetReg.requestedClockOut || targetReg.clockOut || '06:30 PM',
                workingHours: Number(targetReg.workingHours || targetReg.hours || 9.0),
                note: `Regularized: ${targetReg.reason}`,
                isRegularized: true,
                regularizedAt: new Date().toISOString()
              }
            }
          };
        });
      }
      onSaveToast(`Missed punch regularized for ${targetReg.empName} on ${targetReg.date}! Attendance marked Present.`);
    } else {
      sounds.playWarning();
      onSaveToast(`Regularization request #${id} marked as REJECTED.`);
    }

    if (setRegularizations) {
      setRegularizations(regularizations.map(r => r.id === id ? { ...r, status: newStatus } : r));
    }
  };

  const handleApplyRegularization = (e) => {
    e.preventDefault();
    sounds.playSuccess();
    const emp = employees.find(e => e.id === regForm.empId);
    if (!emp) return;

    const newReg = {
      id: `REG-${Math.floor(100 + Math.random() * 900)}`,
      empId: emp.id,
      empName: emp.name,
      date: regForm.date,
      requestedClockIn: regForm.clockIn,
      requestedClockOut: regForm.clockOut,
      workingHours: Number(regForm.hours) || 9.0,
      reason: regForm.reason,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0]
    };

    if (setRegularizations) {
      setRegularizations([newReg, ...regularizations]);
    }
    setIsRegModalOpen(false);
    onSaveToast(`Regularization request submitted for ${emp.name}!`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Sub-Tab Switcher */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-500" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Enterprise Leave & Attendance Regularization Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage formal leave quotas (CL/SL/PL), approve missed punches, and reconcile employee biometric anomalies.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/60">
          <button
            onClick={() => {
              sounds.playSuccess();
              setActiveTab('leaves');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'leaves'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Leave Requests</span>
            {pendingLeavesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-extrabold">
                {pendingLeavesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playSuccess();
              setActiveTab('regularization');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'regularization'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Missed Punch Regularization</span>
            {pendingRegsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-extrabold">
                {pendingRegsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SUBTAB 1: LEAVE APPLICATIONS & QUOTA POLICY */}
      {/* ============================================================ */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          
          {/* Action Row for Leaves */}
          <div className="flex items-center justify-between gap-3 flex-wrap bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Filter By Status:</span>
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      sounds.playSuccess();
                      setActiveFilter(status);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      activeFilter === status
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {leaves.some(l => l.status === 'Pending') && (
                <button
                  onClick={handleApproveAllPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all active:scale-95"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve All Pending</span>
                </button>
              )}

              <button
                onClick={() => {
                  sounds.playSuccess();
                  setIsApplyModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Apply Time-Off</span>
              </button>
            </div>
          </div>

          {/* Quota Policy Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Casual Leave (CL)</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900 dark:text-white">12 Days / Year</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Full Pay</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Short personal emergencies</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Sick Leave (SL)</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900 dark:text-white">8 Days / Year</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Medical Pay</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Health & sickness certificate</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Privilege Leave (PL)</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900 dark:text-white">15 Days / Year</span>
                <span className="text-[10px] text-indigo-500 font-bold">Carry Forward</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Annual vacations & travel</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Comp-Off / On-Duty</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-black text-slate-900 dark:text-white">Flexible</span>
                <span className="text-[10px] text-blue-500 font-bold">Manager Grant</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Weekend releases or site duty</p>
            </div>
          </div>

          {/* Leave Requests Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Dates & Duration</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">HR Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {filteredLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-500" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">No leave requests found</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">All staff attendance is currently reconciled</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLeaves.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{req.empName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({req.empId})</span>
                          </div>
                          <span className="text-[10px] text-slate-400">Applied on {req.appliedOn || 'Recent'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900/60">
                            {req.leaveType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {req.startDate} {req.startDate !== req.endDate ? `to ${req.endDate}` : ''}
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold">{req.days} Day{req.days > 1 ? 's' : ''} duration</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-400">
                          {req.reason || 'Personal leave'}
                        </td>
                        <td className="py-3 px-4">
                          {req.status === 'Approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Approved
                            </span>
                          ) : req.status === 'Rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              Pending Approval
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {req.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleStatusChange(req.id, 'Approved')}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition"
                                title="Approve Leave"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(req.id, 'Rejected')}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition"
                                title="Reject Leave"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Closed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUBTAB 2: MISSED PUNCH REGULARIZATION */}
      {/* ============================================================ */}
      {activeTab === 'regularization' && (
        <div className="space-y-6">
          
          {/* Action Row for Regularization */}
          <div className="flex items-center justify-between gap-3 flex-wrap bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Attendance Audit & Biometric Reconciliation</span>
              <p className="text-[11px] text-slate-400">Approving a regularization immediately overwrites the muster punch and grants full payable day credit.</p>
            </div>

            <button
              onClick={() => {
                sounds.playSuccess();
                setIsRegModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Raise Missed Punch Request</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending Review</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {pendingRegsCount} Requests
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Awaiting HR manager sign-off</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Approved & Reconciled</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {regularizations.filter(r => r.status === 'Approved').length} Requests
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Attendance records updated to Present</p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Auto-Credit Policy</span>
              <div className="text-sm font-black text-slate-900 dark:text-white mt-1">
                Full 1.0 Day Paid
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Overtime & standard shift hours preserved</p>
            </div>
          </div>

          {/* Regularizations Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Missed Punch Date</th>
                    <th className="py-3 px-4">Requested Timings</th>
                    <th className="py-3 px-4">Audit Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Manager Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {regularizations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Fingerprint className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-500" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">No Missed Punch Regularization Requests</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Raise Missed Punch Request" to submit an attendance adjustment.</p>
                      </td>
                    </tr>
                  ) : (
                    regularizations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{reg.empName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({reg.empId})</span>
                          </div>
                          <span className="text-[10px] text-slate-400">Ref: {reg.id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            <span>{reg.date}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {reg.requestedClockIn || reg.clockIn || '09:30 AM'} → {reg.requestedClockOut || reg.clockOut || '06:30 PM'}
                          </div>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            {reg.workingHours || reg.hours || 9.0} hrs credit
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs text-slate-600 dark:text-slate-300">
                          <p className="truncate font-medium">{reg.reason}</p>
                        </td>
                        <td className="py-3 px-4">
                          {reg.status === 'Approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Reconciled / Present
                            </span>
                          ) : reg.status === 'Rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {reg.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleRegStatusChange(reg.id, 'Approved')}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition active:scale-95"
                                title="Approve & Mark Present"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleRegStatusChange(reg.id, 'Rejected')}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold text-[11px] transition active:scale-95"
                                title="Reject Request"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Reconciled</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: APPLY LEAVE */}
      {/* ============================================================ */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Apply For Time-Off</h3>
                <p className="text-xs text-slate-400">Formal company leave application</p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Select Employee
                </label>
                <select
                  value={formData.empId}
                  onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.id}) • {emp.department}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Leave Category
                </label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                  <option value="Sick Leave (SL)">Sick Leave (SL)</option>
                  <option value="Privilege Leave (PL)">Privilege / Annual Leave (PL)</option>
                  <option value="Unpaid Leave (LWP)">Leave Without Pay (LWP)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Reason for Time-Off
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g. Medical illness, urgent personal affairs, family event..."
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/30"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: RAISE MISSED PUNCH REGULARIZATION */}
      {/* ============================================================ */}
      {isRegModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-blue-500" />
                  <span>Raise Missed Punch Regularization</span>
                </h3>
                <p className="text-xs text-slate-400">Request attendance reconciliation for missed biometric punch</p>
              </div>
              <button
                onClick={() => setIsRegModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyRegularization} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Select Employee
                </label>
                <select
                  value={regForm.empId}
                  onChange={(e) => setRegForm({ ...regForm, empId: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.id}) • {emp.department}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Missed Punch Date
                </label>
                <input
                  type="date"
                  required
                  value={regForm.date}
                  onChange={(e) => setRegForm({ ...regForm, date: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Requested In-Time
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.clockIn}
                    onChange={(e) => setRegForm({ ...regForm, clockIn: e.target.value })}
                    placeholder="09:30 AM"
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Requested Out-Time
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.clockOut}
                    onChange={(e) => setRegForm({ ...regForm, clockOut: e.target.value })}
                    placeholder="06:30 PM"
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Reason for Missed Punch / OD
                </label>
                <select
                  value={regForm.reason}
                  onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold mb-2"
                >
                  <option value="Biometric device scanner glitch during morning muster">Biometric device scanner glitch</option>
                  <option value="On-Duty (OD) Client Site Inspection & Setup">On-Duty (OD) Client Site Visit</option>
                  <option value="Forgot biometric punch during shift change">Forgot biometric punch</option>
                  <option value="Public transit disruption / Severe weather transit delay">Severe transit / traffic delay</option>
                  <option value="Working from remote client branch office">Remote client branch duty</option>
                </select>
                <textarea
                  rows={2}
                  value={regForm.reason}
                  onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
                  placeholder="Or enter custom reason..."
                  className="w-full p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/30"
                >
                  Submit Regularization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
