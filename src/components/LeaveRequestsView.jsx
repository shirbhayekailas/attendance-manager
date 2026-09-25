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
  ShieldCheck
} from 'lucide-react';
import { sounds } from '../utils/sound';

export default function LeaveRequestsView({ 
  leaves, 
  setLeaves, 
  employees, 
  setEmployees,
  onSaveToast 
}) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    empId: employees[0]?.id || '',
    leaveType: 'Casual Leave (CL)',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    days: 1,
    reason: '',
  });

  const filteredLeaves = leaves.filter((l) => {
    if (activeFilter === 'All') return true;
    return l.status === activeFilter;
  });

  const handleStatusChange = (id, newStatus) => {
    sounds.playSuccess();
    const targetLeave = leaves.find(l => l.id === id);
    if (!targetLeave) return;

    // If approving, deduct balance from employee profile
    if (newStatus === 'Approved' && targetLeave.status !== 'Approved') {
      const typeKey = targetLeave.leaveType.includes('Casual') ? 'cl' : targetLeave.leaveType.includes('Sick') ? 'sl' : 'pl';
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

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-500" />
            <span>Enterprise Leave & Time-Off Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit employee leave applications, enforce company quota accruals, and approve time-off requests.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {leaves.some(l => l.status === 'Pending') && (
            <button
              onClick={handleApproveAllPending}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve All Pending</span>
            </button>
          )}

          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
            {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  sounds.playSuccess();
                  setActiveFilter(status);
                }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeFilter === status
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              sounds.playSuccess();
              setIsApplyModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
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
          <p className="text-[10px] text-slate-400 mt-1">Weekend releases or client visits</p>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Leave Category</th>
                <th className="py-3.5 px-4">Dates & Duration</th>
                <th className="py-3.5 px-4">Reason / Notes</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">HR Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 text-xs">
                    No leave requests found in this filter view.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{l.empName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{l.empId}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                        {l.leaveType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {l.startDate} {l.startDate !== l.endDate ? `to ${l.endDate}` : ''}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {l.days} day(s) requested
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      "{l.reason}"
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        l.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : l.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {l.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {l.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStatusChange(l.id, 'Approved')}
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 transition-colors shadow-2xs font-bold text-xs flex items-center gap-1"
                            title="Approve leave"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleStatusChange(l.id, 'Rejected')}
                            className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 transition-colors shadow-2xs font-bold text-xs flex items-center gap-1"
                            title="Reject leave"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-semibold">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Submit Employee Time-Off Request
              </h3>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
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
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
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
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
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

    </div>
  );
}
