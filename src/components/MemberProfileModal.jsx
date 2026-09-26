import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  Flame, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Building, 
  Home, 
  Briefcase, 
  CreditCard,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Printer,
  IndianRupee
} from 'lucide-react';
import { calculateEmployeeStats, calculateWorkDuration } from '../utils/attendanceCalculations';
import { getEmployeeTotalAdvance } from '../utils/storage';
import { sounds } from '../utils/sound';
import SalaryAdvanceModal from './SalaryAdvanceModal';

export default function MemberProfileModal({ 
  employee, 
  attendance, 
  advances = [],
  setAdvances,
  config, 
  onClose 
}) {
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  useEffect(() => {
    document.body.classList.add('modal-print-active');
    return () => {
      document.body.classList.remove('modal-print-active');
    };
  }, []);

  if (!employee) return null;

  const [activeProfileTab, setActiveProfileTab] = useState('monthly'); // 'monthly' | 'heatmap' | 'history'
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());

  const stats = calculateEmployeeStats(employee.id, attendance);

  // Month navigation
  const handlePrevMonth = () => {
    sounds.playSuccess();
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    sounds.playSuccess();
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Generate days for selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleString('default', { month: 'long' });

  const monthlyDayList = [];
  let mOffice = 0;
  let mWfh = 0;
  let mLate = 0;
  let mLeave = 0;
  let mAbsent = 0;
  let mWeekOff = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dObj = new Date(selectedYear, selectedMonth, d);
    const dayOfWeek = dObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const rec = attendance[dateStr]?.[employee.id];

    let status = rec?.status || (isWeekend ? 'weekend' : 'none');
    if (status === 'present') mOffice++;
    else if (status === 'wfh') mWfh++;
    else if (status === 'late') { mOffice++; mLate++; }
    else if (status === 'leave') mLeave++;
    else if (status === 'absent') mAbsent++;
    else if (status === 'week_off' || status === 'wo') mWeekOff++;

    const otHours = (rec?.overtimeHours !== undefined && rec?.overtimeHours !== null && rec?.overtimeHours !== '')
      ? Number(rec.overtimeHours)
      : 0;

    monthlyDayList.push({
      dayNum: d,
      dateStr,
      weekday: dObj.toLocaleDateString(undefined, { weekday: 'short' }),
      isWeekend,
      status,
      clockIn: rec?.clockIn || '--',
      clockOut: rec?.clockOut || '--',
      workingHours: (rec?.clockIn && rec?.clockOut && rec.clockIn !== '--' && rec.clockOut !== '--')
        ? calculateWorkDuration(rec.clockIn, rec.clockOut).workingHours
        : (rec?.workingHours || '--'),
      overtimeHours: otHours,
      note: rec?.note || '',
    });
  }

  // Generate 12-week heatmap grid representation (84 days)
  const heatmapDays = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const rec = attendance[dateStr]?.[employee.id];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;

    heatmapDays.push({
      date: dateStr,
      status: rec?.status || (isWeekend ? 'weekend' : 'no_data'),
      clockIn: rec?.clockIn || '',
      clockOut: rec?.clockOut || '',
      note: rec?.note || '',
    });
  }

  const getHeatmapColor = (status) => {
    switch (status) {
      case 'present': return 'bg-emerald-500 hover:bg-emerald-400';
      case 'wfh': return 'bg-indigo-500 hover:bg-indigo-400';
      case 'late': return 'bg-amber-400 hover:bg-amber-300';
      case 'half_day': return 'bg-amber-500 hover:bg-amber-400';
      case 'leave': return 'bg-purple-500 hover:bg-purple-400';
      case 'absent': return 'bg-rose-500 hover:bg-rose-400';
      case 'week_off':
      case 'wo': return 'bg-sky-500 hover:bg-sky-400';
      case 'weekend': return 'bg-slate-200/50 dark:bg-slate-800/40 opacity-40';
      default: return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  return (
    <div className="print-modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="print-modal-body bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Official Print Header - SK ENTERPRISES LETTERHEAD */}
        <div className="print-only hidden p-6 border-b-2 border-slate-900 mb-2 text-black bg-white">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-xs shrink-0">
                  SK
                </div>
                <h1 className="text-xl font-black uppercase text-slate-950">{config?.companyName || 'SK ENTERPRISES'}</h1>
              </div>
              <p className="text-[10px] text-slate-700 font-medium max-w-xl">
                {config?.companyAddress || '303, Panchsheel chs ltd, plot no 07, sec -02, taloja phase -01, navi mumbai -410208'}
              </p>
              <p className="text-xs text-slate-900 font-bold mt-1">Employee Confidential Dossier &amp; Attendance Audit Record</p>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <p className="font-bold text-slate-900">Generated on: {new Date().toLocaleDateString()}</p>
              <p className="text-slate-600">Staff Code: {employee.id}</p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white relative border-b border-blue-900/50">
          <div className="absolute top-5 right-5 flex items-center gap-2 no-print">
            <button
              onClick={() => {
                sounds.playSuccess();
                window.print();
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Print Employee Dossier"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-16">
            <div className="flex items-center gap-4">
              <img 
                src={employee.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'} 
                alt={employee.name || 'Employee'} 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md bg-slate-800"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150';
                }}
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {employee.name || 'Unnamed Employee'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    {employee.id || 'N/A'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    employee.accessLevel === 'admin' ? 'bg-purple-500/30 text-purple-200 border border-purple-400/30' :
                    employee.accessLevel === 'manager' ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30' :
                    'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                  }`}>
                    {employee.accessLevel === 'admin' ? 'Admin' : employee.accessLevel === 'manager' ? 'Manager' : 'Employee'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    employee.statutoryType === 'non_pf_esic'
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
                      : 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
                  }`}>
                    {employee.statutoryType === 'non_pf_esic' ? 'Non-PF & Non-ESIC' : 'PF & ESIC'}
                  </span>
                </div>
                <p className="text-xs text-blue-200 font-semibold">
                  {employee.role || 'Staff'} • <span className="text-white font-bold">{employee.department || 'Operations'}</span>
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-0.5">
                  {employee.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      {employee.email}
                    </span>
                  )}
                  {employee.shift && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      Shift: {employee.shift}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dossier Tabs */}
            <div className="flex p-1 bg-white/10 rounded-2xl border border-white/10 self-start sm:self-center text-xs font-bold">
              <button
                onClick={() => {
                  sounds.playSuccess();
                  setActiveProfileTab('monthly');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeProfileTab === 'monthly' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Monthly View</span>
              </button>
              <button
                onClick={() => {
                  sounds.playSuccess();
                  setActiveProfileTab('heatmap');
                }}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeProfileTab === 'heatmap' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>12-Wk Heatmap</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Key Quick Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Payable</span>
              <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.payableDays} <span className="text-xs font-normal text-slate-400">/ 22d</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase text-slate-400">Presence</span>
              <div className="mt-1 text-xl font-black text-blue-600 dark:text-blue-400">
                {stats.inOffice} <span className="text-xs font-semibold text-slate-400">Office</span>
              </div>
              <span className="text-[10px] text-indigo-400 font-bold block mt-0.5">+{stats.wfh} WFH</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase text-slate-400">Punctuality</span>
              <div className="mt-1 text-2xl font-black text-amber-500">
                {stats.punctualityRate}%
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">{stats.late} delayed check-in</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase text-slate-400">Leaves Balance</span>
              <div className="mt-1 text-2xl font-black text-purple-600 dark:text-purple-400">
                {(employee.leaveBalance?.cl || 6) + (employee.leaveBalance?.sl || 4)}d
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">CL: {employee.leaveBalance?.cl || 6} | SL: {employee.leaveBalance?.sl || 4}</span>
            </div>

            {/* Overtime Card */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-400">Overtime Logged</span>
                <div className="mt-1 text-2xl font-black font-mono text-amber-700 dark:text-amber-300">
                  {stats.totalOvertimeHours} <span className="text-xs font-normal text-amber-600 dark:text-amber-400">hrs</span>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10.5px]">
                <span className="font-bold text-slate-500 dark:text-slate-400">OT Pay:</span>
                <span className="font-black text-amber-700 dark:text-amber-300 font-mono">₹{(stats.overtimePay || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Advance Received Card */}
            {(() => {
              const empAdv = getEmployeeTotalAdvance(employee.id, advances);
              return (
                <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-400">Advance Taken</span>
                    <div className="mt-1 text-xl font-black font-mono text-amber-700 dark:text-amber-300">
                      ₹{empAdv.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAdvanceModalOpen(true)}
                    className="no-print mt-1 text-[10.5px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <IndianRupee className="w-3 h-3" />
                    <span>Manage / Add</span>
                  </button>
                </div>
              );
            })()}
          </div>

          {/* TAB 1: FULL MONTHLY ATTENDANCE SHEET */}
          {activeProfileTab === 'monthly' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-xs text-slate-900 dark:text-white px-2">
                    {monthName} {selectedYear}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="text-emerald-600">{mOffice} Office</span>
                  <span>•</span>
                  <span className="text-indigo-600">{mWfh} WFH</span>
                  <span>•</span>
                  <span className="text-sky-600">{mWeekOff} Week Off</span>
                  <span>•</span>
                  <span className="text-amber-500">{mLate} Late</span>
                  <span>•</span>
                  <span className="text-purple-600">{mLeave} Leave</span>
                </div>
              </div>

              {/* Monthly Day List Table */}
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {monthlyDayList.map((d) => (
                  <div key={d.dateStr} className={`p-2.5 flex items-center justify-between ${
                    d.isWeekend ? 'bg-slate-50/50 dark:bg-slate-800/30 text-slate-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{d.dateStr}</span>
                      <span className="text-slate-400">({d.weekday})</span>
                      {d.clockIn && d.clockIn !== '--' && (
                         <span className="font-mono text-slate-500 text-[11px]">
                          {d.clockIn} - {d.clockOut}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {d.workingHours && d.workingHours !== '--' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {d.workingHours}
                        </span>
                      )}
                      {d.overtimeHours > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60">
                          +{d.overtimeHours}h OT
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        d.status === 'present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                        d.status === 'wfh' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' :
                        (d.status === 'week_off' || d.status === 'wo') ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' :
                        d.status === 'late' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                        d.status === 'leave' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                        d.status === 'absent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                        d.isWeekend ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
                        'text-slate-400'
                      }`}>
                        {d.status === 'present' ? 'Office' : (d.status === 'week_off' || d.status === 'wo') ? 'Week Off' : d.status === 'none' ? 'No Log' : d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: 12-WEEK HEATMAP */}
          {activeProfileTab === 'heatmap' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Attendance Activity Heatmap (Recent 12 Weeks)</span>
                </h4>
                <div className="flex items-center gap-2.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"></span> Office</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-500"></span> WFH</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400"></span> Late</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-500"></span> Leave</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500"></span> LWP</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto pb-1">
                  {heatmapDays.map((d) => (
                    <div
                      key={d.date}
                      className={`w-3.5 h-3.5 rounded-sm transition-transform hover:scale-125 cursor-pointer relative ${getHeatmapColor(d.status)}`}
                      title={`${d.date}: ${d.status.toUpperCase()}${d.clockIn ? ` (In: ${d.clockIn})` : ''}`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Salary Advance Modal */}
      {isAdvanceModalOpen && (
        <SalaryAdvanceModal
          isOpen={isAdvanceModalOpen}
          onClose={() => setIsAdvanceModalOpen(false)}
          employees={[employee]}
          initialEmployee={employee}
          advances={advances}
          setAdvances={setAdvances}
        />
      )}

    </div>
  );
}
