import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  LogIn, 
  LogOut, 
  Building, 
  Home, 
  CalendarDays, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  DollarSign, 
  FileText, 
  Printer, 
  Plus, 
  X,
  CreditCard,
  Briefcase,
  Flame,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { calculateEmployeeStats, calculateWorkDuration } from '../utils/attendanceCalculations';
import { sounds } from '../utils/sound';
import { getEmployeeTotalAdvance } from '../utils/storage';
import SalarySlipModal from './SalarySlipModal';

export default function EmployeePortalView({ 
  employee, 
  attendance, 
  setAttendance, 
  leaves, 
  setLeaves, 
  advances = [],
  config, 
  onSaveToast 
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [punchMode, setPunchMode] = useState('office'); // 'office' | 'wfh'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'monthly' | 'leaves' | 'payslip'
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [isSalarySlipModalOpen, setIsSalarySlipModalOpen] = useState(false);

  // Monthly Timesheet State
  const todayDate = new Date();
  const [selectedYear, setSelectedYear] = useState(todayDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(todayDate.getMonth());
  const [sheetViewMode, setSheetViewMode] = useState('calendar'); // 'calendar' | 'table'
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Casual Leave (CL)',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    days: 1,
    reason: '',
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendance[todayStr]?.[employee.id] || null;
  const isClockedIn = Boolean(todayRecord?.clockIn && todayRecord.clockIn !== '--');
  const isClockedOut = Boolean(todayRecord?.clockOut && todayRecord.clockOut !== '--');

  // Stats for this employee only
  const stats = calculateEmployeeStats(employee.id, attendance, employee.salaryMonthly || 100000, 22);

  // My leaves only
  const myLeaves = leaves.filter(l => l.empId === employee.id);

  // Punch In Handler
  const handlePunchIn = () => {
    const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const hour = currentTime.getHours();
    const min = currentTime.getMinutes();
    const isLate = (hour > 9) || (hour === 9 && min > 45);
    const status = isLate && punchMode === 'office' ? 'late' : punchMode === 'wfh' ? 'wfh' : 'present';

    const dayRecords = attendance[todayStr] || {};
    const updated = {
      ...attendance,
      [todayStr]: {
        ...dayRecords,
        [employee.id]: {
          ...(dayRecords[employee.id] || {}),
          status,
          clockIn: timeStr,
          clockOut: "--",
          workingHours: "Active Shift",
          overtimeHours: 0,
          note: isLate ? "Punch-in delayed" : punchMode === 'wfh' ? "Remote Clock-In" : "Regular Shift",
        }
      }
    };

    setAttendance(updated);
    sounds.playSuccess();
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (e) {}
    onSaveToast(`Good morning, ${employee.name}! Punch-in confirmed at ${timeStr}`);
  };

  // Punch Out Handler
  const handlePunchOut = () => {
    const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dayRecords = attendance[todayStr] || {};
    const currentRec = dayRecords[employee.id] || { status: 'present', clockIn: '09:30 AM' };
    const duration = calculateWorkDuration(currentRec.clockIn || timeStr, timeStr);

    const updated = {
      ...attendance,
      [todayStr]: {
        ...dayRecords,
        [employee.id]: {
          ...currentRec,
          clockOut: timeStr,
          workingHours: duration.workingHours,
          overtimeHours: duration.overtimeHours,
        }
      }
    };

    setAttendance(updated);
    sounds.playSuccess();
    onSaveToast(`Shift Completed (${duration.workingHours})! Punch-out logged at ${timeStr}`);
  };

  // Submit Leave Request
  const handleApplyLeave = (e) => {
    e.preventDefault();
    sounds.playSuccess();

    const newRequest = {
      id: `LR-${Math.floor(500 + Math.random() * 500)}`,
      empId: employee.id,
      empName: employee.name,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      days: parseInt(leaveForm.days, 10) || 1,
      reason: leaveForm.reason,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0],
    };

    setLeaves([newRequest, ...leaves]);
    setIsApplyLeaveOpen(false);
    onSaveToast("Your leave request has been submitted to HR!");
  };

  // 12-week heatmap
  const heatmapDays = [];
  const today = new Date();
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
      case 'weekend': return 'bg-slate-200/50 dark:bg-slate-800/40 opacity-40';
      default: return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Main Portal Screen UI - Hidden completely during modal print */}
      <div className={`space-y-6 ${isSalarySlipModalOpen ? 'no-print' : ''}`}>
        
        {/* Employee Identity Hero Banner */}
        <div className="no-print bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-7 rounded-3xl border border-indigo-900/50 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 z-10">
          <img 
            src={employee.avatar} 
            alt={employee.name} 
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover border-2 border-indigo-400/50 shadow-lg"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-white">{employee.name}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {employee.id}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-indigo-200 font-semibold">
              {employee.role} • <strong className="text-white">{employee.department}</strong>
            </p>
            <p className="text-[11px] text-slate-300">
              Shift: {employee.shift} • Reports to: {employee.reportsTo || "Team Lead"}
            </p>
          </div>
        </div>

        {/* Portal Subtabs */}
        <div className="flex p-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 self-start md:self-center z-10 flex-wrap gap-1">
          <button
            onClick={() => {
              sounds.playSuccess();
              setActiveTab('overview');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            My Station
          </button>
          <button
            onClick={() => {
              sounds.playSuccess();
              setActiveTab('monthly');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'monthly' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Monthly Sheet</span>
          </button>
          <button
            onClick={() => {
              sounds.playSuccess();
              setActiveTab('leaves');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'leaves' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            Leaves ({myLeaves.length})
          </button>
          <button
            onClick={() => {
              sounds.playSuccess();
              setActiveTab('payslip');
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'payslip' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            My Payslip
          </button>
        </div>
      </div>

      {/* TAB 1: MY OVERVIEW & PUNCH STATION */}
      {activeTab === 'overview' && (
        <div className="no-print space-y-6">
          
          {/* Realtime Punch In / Out Card */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Today's Work Session • {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900 dark:text-white">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2 pt-1 text-xs">
                <span className="font-bold text-slate-500">Status:</span>
                {!isClockedIn ? (
                  <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Not Checked In Yet
                  </span>
                ) : isClockedOut ? (
                  <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Shift Completed ({(todayRecord.clockIn && todayRecord.clockOut) ? calculateWorkDuration(todayRecord.clockIn, todayRecord.clockOut).workingHours : todayRecord.workingHours})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 animate-pulse">
                    Active Shift (Clocked in: {todayRecord.clockIn})
                  </span>
                )}
              </div>
            </div>

            {/* Punch Action Controls */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Mode Selector */}
              {!isClockedIn && (
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700 text-xs font-bold">
                  <button
                    onClick={() => setPunchMode('office')}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      punchMode === 'office' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Office</span>
                  </button>
                  <button
                    onClick={() => setPunchMode('wfh')}
                    className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      punchMode === 'wfh' ? 'bg-white dark:bg-slate-700 text-indigo-500 dark:text-white shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>WFH</span>
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              {!isClockedIn ? (
                <button
                  onClick={handlePunchIn}
                  className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Punch IN Now</span>
                </button>
              ) : !isClockedOut ? (
                <button
                  onClick={handlePunchOut}
                  className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Punch OUT (End Shift)</span>
                </button>
              ) : (
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                  ✓ Attendance Recorded for Today
                </div>
              )}
            </div>
          </div>

          {/* Key Personal Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400">Payable Days</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.payableDays}</span>
                <span className="text-xs font-bold text-slate-400">/ {stats.totalWorkingDays || 22}</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">Salary base earned</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400">Presence Ratio</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.inOffice} Office</span>
              </div>
              <span className="text-[10px] text-indigo-400 font-bold block mt-1">+ {stats.wfh} WFH Sessions</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400">Punctuality Score</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={`text-2xl font-black ${stats.punctualityRate >= 90 ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {stats.punctualityRate}%
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">{stats.late} delayed check-in(s)</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-400">Leave Balance</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  {(employee.leaveBalance?.cl || 0) + (employee.leaveBalance?.sl || 0)}
                </span>
                <span className="text-xs text-slate-400">days left</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">CL: {employee.leaveBalance?.cl || 0} | SL: {employee.leaveBalance?.sl || 0}</span>
            </div>
          </div>

          {/* Personal Activity Heatmap */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>My Attendance Activity (Past 12 Weeks)</span>
              </h4>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Office</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-indigo-500"></span> WFH</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-400"></span> Late</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-purple-500"></span> Leave</span>
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

          {/* Chronological Punch History Table */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>My Recent Check-In / Check-Out Timesheet</span>
            </h4>

            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
              {stats.historyList.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  No attendance logged yet. Click "Punch IN Now" above to log your first work session!
                </div>
              ) : (
                stats.historyList.slice(0, 10).map((entry) => (
                  <div key={entry.date} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 dark:text-white">{entry.date}</span>
                      <span className="text-slate-400 font-mono">{entry.clockIn} - {entry.clockOut}</span>
                      {entry.workingHours && entry.workingHours !== '--' && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 text-[10px]">
                          {entry.workingHours}
                        </span>
                      )}
                    </div>

                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      entry.status === 'present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                      entry.status === 'wfh' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' :
                      entry.status === 'late' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                      entry.status === 'leave' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                      'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {entry.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB: MY MONTHLY ATTENDANCE REGISTER */}
      {activeTab === 'monthly' && (() => {
        const daysInSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const daysInMonth = daysInSelectedMonth;
        const selectedMonthName = new Date(selectedYear, selectedMonth, 1).toLocaleString('default', { month: 'long' });
        
        // Offset so Monday is 0
        const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();
        const startOffset = (firstDayOfWeek + 6) % 7;

        const monthlyDayList = [];
        let mOffice = 0;
        let mWfh = 0;
        let mLate = 0;
        let mHalfDay = 0;
        let mLeave = 0;
        let mAbsent = 0;

        for (let d = 1; d <= daysInSelectedMonth; d++) {
          const dObj = new Date(selectedYear, selectedMonth, d);
          const dayOfWeek = dObj.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const rec = attendance[dateStr]?.[employee.id];

          let status = rec?.status || (isWeekend ? 'weekend' : 'none');
          if (status === 'present') mOffice++;
          else if (status === 'wfh') mWfh++;
          else if (status === 'late') { mOffice++; mLate++; }
          else if (status === 'half_day') mHalfDay++;
          else if (status === 'leave') mLeave++;
          else if (status === 'absent') mAbsent++;

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
            note: rec?.note || '',
          });
        }

        const mPayable = mOffice + mWfh + mLeave + (0.5 * mHalfDay);

        return (
          <div className="space-y-6">
            
            {/* Portrait print setup for Employee Monthly Timesheet */}
            <style>{`
              @media print {
                @page {
                  size: A4 portrait !important;
                  margin: 8mm 10mm !important;
                }
              }
            `}</style>

            {/* Monthly Header & Navigation Card */}
            <div className="no-print bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>My Monthly Attendance Sheet</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete day-by-day record of punches, sessions, and time-off for {selectedMonthName} {selectedYear}
                </p>
              </div>

              {/* Month Switcher & Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200/80 dark:border-slate-700/80">
                  <button
                    onClick={() => {
                      sounds.playSuccess();
                      if (selectedMonth === 0) {
                        setSelectedMonth(11);
                        setSelectedYear(selectedYear - 1);
                      } else {
                        setSelectedMonth(selectedMonth - 1);
                      }
                    }}
                    className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-xs font-bold text-slate-900 dark:text-white min-w-[120px] text-center">
                    {selectedMonthName} {selectedYear}
                  </span>
                  <button
                    onClick={() => {
                      sounds.playSuccess();
                      if (selectedMonth === 11) {
                        setSelectedMonth(0);
                        setSelectedYear(selectedYear + 1);
                      } else {
                        setSelectedMonth(selectedMonth + 1);
                      }
                    }}
                    className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                  <button
                    onClick={() => {
                      sounds.playSuccess();
                      setSheetViewMode('calendar');
                    }}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      sheetViewMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Calendar Grid
                  </button>
                  <button
                    onClick={() => {
                      sounds.playSuccess();
                      setSheetViewMode('table');
                    }}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      sheetViewMode === 'table' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Daily Table
                  </button>
                </div>

                <button
                  onClick={() => {
                    sounds.playSuccess();
                    window.print();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
              </div>
            </div>

            {/* Official Corporate Print Header */}
            <div className="print-only hidden p-5 mb-4 border-b-2 border-slate-900 bg-white text-slate-900">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight">
                    {config?.companyName || 'AttendFlow Enterprise Solutions Ltd.'}
                  </h1>
                  <p className="text-xs font-bold text-slate-800">
                    EMPLOYEE MONTHLY ATTENDANCE STATEMENT &amp; TIMESHEET
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Pay Period: <span className="font-bold text-slate-900 uppercase">{selectedMonthName} {selectedYear}</span> • Calendar Days: {daysInMonth}
                  </p>
                </div>
                <div className="text-right text-xs space-y-0.5">
                  <p className="font-bold text-slate-900 text-sm">{employee.name} ({employee.id})</p>
                  <p className="text-[11px] text-slate-600">{employee.role} • {employee.department}</p>
                  <p className="text-[10px] text-slate-500">Generated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Monthly KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
                <span className="text-[10px] font-black uppercase text-slate-400">Total Payable</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{mPayable}d</div>
                <span className="text-[10px] text-slate-400">earned base</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
                <span className="text-[10px] font-black uppercase text-slate-400">Office Check-ins</span>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{mOffice}d</div>
                <span className="text-[10px] text-slate-400">in-person</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
                <span className="text-[10px] font-black uppercase text-slate-400">WFH Sessions</span>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{mWfh}d</div>
                <span className="text-[10px] text-slate-400">remote log</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
                <span className="text-[10px] font-black uppercase text-slate-400">Late Check-ins</span>
                <div className="text-2xl font-black text-amber-500 mt-0.5">{mLate}</div>
                <span className="text-[10px] text-slate-400">delayed punch</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Paid Leaves</span>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">{mLeave}d</div>
                <span className="text-[10px] text-slate-400">approved leaves</span>
              </div>
            </div>

            {/* View 1: Calendar Grid View */}
            {sheetViewMode === 'calendar' && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                {/* Weekday Labels (Mon - Sun) */}
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span className="text-slate-300 dark:text-slate-600">Sat</span>
                  <span className="text-slate-300 dark:text-slate-600">Sun</span>
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Empty offset padding */}
                  {Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`pad-${i}`} className="min-h-[85px] rounded-2xl bg-slate-50/40 dark:bg-slate-800/20 opacity-40"></div>
                  ))}

                  {monthlyDayList.map((d) => (
                    <div
                      key={d.dateStr}
                      className={`min-h-[85px] p-2.5 rounded-2xl border flex flex-col justify-between transition-all ${
                        d.status === 'present' ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60' :
                        d.status === 'wfh' ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/60' :
                        d.status === 'late' ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60' :
                        d.status === 'half_day' ? 'bg-yellow-50/60 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/60' :
                        d.status === 'leave' ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60' :
                        d.status === 'absent' ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60' :
                        d.isWeekend ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800 text-slate-400' :
                        'bg-slate-50/40 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">{d.dayNum}</span>
                        {d.status !== 'none' && d.status !== 'weekend' && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                            d.status === 'present' ? 'bg-emerald-500 text-white' :
                            d.status === 'wfh' ? 'bg-indigo-500 text-white' :
                            d.status === 'late' ? 'bg-amber-400 text-slate-900' :
                            d.status === 'leave' ? 'bg-purple-500 text-white' :
                            'bg-rose-500 text-white'
                          }`}>
                            {d.status === 'present' ? 'Office' : d.status.toUpperCase()}
                          </span>
                        )}
                        {d.isWeekend && (
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Off</span>
                        )}
                      </div>

                      {/* Timestamps */}
                      {d.clockIn && d.clockIn !== '--' ? (
                        <div className="text-[10px] space-y-0.5 pt-1">
                          <div className="font-mono text-slate-600 dark:text-slate-300 font-bold truncate">
                            {d.clockIn.split(' ')[0]} - {d.clockOut ? d.clockOut.split(' ')[0] : '--'}
                          </div>
                          {d.workingHours && d.workingHours !== '--' && (
                            <span className="text-[9px] text-slate-400 block truncate">{d.workingHours}</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic">--</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* View 2: Daily Table View */}
            {sheetViewMode === 'table' && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                      <tr>
                        <th className="p-3.5">Date & Day</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Punch IN</th>
                        <th className="p-3.5">Punch OUT</th>
                        <th className="p-3.5">Working Duration</th>
                        <th className="p-3.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {monthlyDayList.map((d) => (
                        <tr key={d.dateStr} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 ${
                          d.isWeekend ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''
                        }`}>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                            {d.dateStr} <span className="text-slate-400 font-normal">({d.weekday})</span>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              d.status === 'present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                              d.status === 'wfh' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' :
                              d.status === 'late' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                              d.status === 'half_day' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' :
                              d.status === 'leave' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                              d.status === 'absent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                              d.isWeekend ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
                              'text-slate-400'
                            }`}>
                              {d.status === 'present' ? 'Office' : d.status === 'none' ? 'No Log' : d.status}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{d.clockIn}</td>
                          <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{d.clockOut}</td>
                          <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">{d.workingHours}</td>
                          <td className="p-3.5 text-slate-400 italic">{d.note || '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Official Signatures for Printed Monthly Sheet */}
            <div className="print-only hidden pt-12 grid grid-cols-3 gap-6 text-center text-xs text-slate-900 bg-white">
              <div className="border-t-2 border-slate-900 pt-2 font-bold">
                <p>Employee Signature</p>
                <p className="text-[10px] text-slate-500 font-normal">Date: ____________</p>
              </div>
              <div className="border-t-2 border-slate-900 pt-2 font-bold">
                <p>Reporting Supervisor / Manager</p>
                <p className="text-[10px] text-slate-500 font-normal">Signature &amp; Approval</p>
              </div>
              <div className="border-t-2 border-slate-900 pt-2 font-bold">
                <p>HR Records &amp; Payroll</p>
                <p className="text-[10px] text-slate-500 font-normal">Attendance Verified</p>
              </div>
            </div>

          </div>
        );
      })()}

      {/* TAB 2: MY LEAVES & APPLY LEAVE */}
      {activeTab === 'leaves' && (
        <div className="no-print space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">My Time-Off & Leaves</h3>
              <p className="text-xs text-slate-400">Apply for time-off and track HR approval status</p>
            </div>
            <button
              onClick={() => setIsApplyLeaveOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
          </div>

          {/* Leave History List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase text-slate-400">
              Submitted Requests
            </div>

            {myLeaves.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                You haven't submitted any leave requests yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {myLeaves.map((l) => (
                  <div key={l.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{l.leaveType}</span>
                        <span className="text-[10px] text-slate-400">({l.days} days)</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">{l.startDate} to {l.endDate}</p>
                      <p className="text-[11px] text-slate-400 italic">"{l.reason}"</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                      l.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                      l.status === 'Rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MY PAYSLIP */}
      {activeTab === 'payslip' && (
        <div className="no-print space-y-6 max-w-3xl mx-auto">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <span className="text-[11px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                  Compensation &amp; Payroll
                </span>
                <h3 className="font-black text-slate-900 dark:text-white text-xl mt-0.5">
                  My Official Salary Statement
                </h3>
                <p className="text-xs text-slate-400">
                  {config?.companyName || 'AttendFlow Enterprise Solutions Ltd.'} • September 2026
                </p>
              </div>

              <button
                onClick={() => {
                  sounds.playSuccess();
                  setIsSalarySlipModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Open &amp; Print Full Payslip</span>
              </button>
            </div>

            {/* Quick Metrics Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Basic Monthly Salary:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  ₹{employee.salaryMonthly?.toLocaleString('en-IN') || '1,00,000'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Attended / Payable Sessions:</span>
                <span className="font-bold text-emerald-600">
                  {stats.payableDays} / 22 Working Days Base
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Overtime Earnings ({stats.totalOvertimeHours}h @ 1.5x):</span>
                <span className="font-mono font-bold text-blue-600">
                  +₹{stats.overtimePay?.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Loss of Pay Deduction ({stats.unpaidAbsent}d LWP):</span>
                <span className="font-mono font-bold text-rose-500">
                  -₹{stats.lossOfPayDeduction?.toLocaleString('en-IN')}
                </span>
              </div>
              {(() => {
                const empAdvance = getEmployeeTotalAdvance(employee?.id, advances, '2026-09');
                return empAdvance > 0 ? (
                  <div className="flex justify-between items-center bg-amber-50/70 dark:bg-amber-950/30 p-2 rounded-xl border border-amber-200 dark:border-amber-900/50">
                    <span className="text-amber-800 dark:text-amber-300 font-bold">Salary Advance Received:</span>
                    <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                      -₹{empAdvance.toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : null;
              })()}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-base">
                <span className="font-black text-slate-900 dark:text-white">Estimated Net Take-Home:</span>
                <span className="font-mono font-black text-emerald-600 text-lg">
                  ₹{Math.max(0, (stats.netEstimatedSalary || 0) - getEmployeeTotalAdvance(employee?.id, advances, '2026-09')).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Detailed Salary Structure Preview */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
              <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 font-bold text-slate-700 dark:text-slate-300 flex justify-between uppercase text-[10px] tracking-wide">
                <span>Monthly Salary Structure Preview</span>
                <span>Breakdown (INR)</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
                <div className="p-2.5 flex justify-between">
                  <span className="text-slate-500">Basic Salary</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    ₹{(employee.salaryMonthly || 100000).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2.5 flex justify-between">
                  <span className="text-slate-500">
                    Statutory Scheme
                  </span>
                  <span className={`font-semibold ${employee.statutoryType === 'non_pf_esic' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`}>
                    {employee.statutoryType === 'non_pf_esic' ? 'Non-PF & Non-ESIC (Exempt)' : 'PF & ESIC Applicable'}
                  </span>
                </div>
                <div className="p-2.5 flex justify-between">
                  <span className="text-slate-500">
                    Statutory Deductions ({employee.statutoryType === 'non_pf_esic' ? 'PT, TDS' : 'EPF (12%), PT, TDS'})
                  </span>
                  <span className="font-mono font-semibold text-rose-500">
                    -₹{((employee.statutoryType === 'non_pf_esic' ? 0 : Math.min(Math.round((employee.salaryMonthly || 100000) * 0.12), 1800)) + 200 + (stats.lossOfPayDeduction || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
                {getEmployeeTotalAdvance(employee?.id, advances, '2026-09') > 0 && (
                  <div className="p-2.5 flex justify-between bg-amber-50/50 dark:bg-amber-950/20">
                    <span className="text-amber-800 dark:text-amber-300 font-medium">Salary Advance Deduction</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      -₹{getEmployeeTotalAdvance(employee?.id, advances, '2026-09').toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  sounds.playSuccess();
                  setIsSalarySlipModalOpen(true);
                }}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
              >
                <span>View Full Corporate Form with Bank &amp; Tax Credentials →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {isApplyLeaveOpen && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Apply for Time-Off
              </h3>
              <button onClick={() => setIsApplyLeaveOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Leave Type
                </label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="Casual Leave (CL)">Casual Leave (CL) - Balance: {employee.leaveBalance?.cl || 0}d</option>
                  <option value="Sick Leave (SL)">Sick Leave (SL) - Balance: {employee.leaveBalance?.sl || 0}d</option>
                  <option value="Privilege Leave (PL)">Privilege Leave (PL) - Balance: {employee.leaveBalance?.pl || 0}d</option>
                  <option value="Unpaid Leave (LWP)">Leave Without Pay (LWP)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Reason</label>
                <textarea
                  required
                  rows={3}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="e.g. Doctor appointment, family function..."
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApplyLeaveOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>

      {/* Official Executive Salary Payslip Modal */}
      {isSalarySlipModalOpen && (
        <SalarySlipModal
          employee={employee}
          attendance={attendance}
          advances={advances}
          config={config}
          monthYear="September 2026"
          onClose={() => setIsSalarySlipModalOpen(false)}
        />
      )}

    </div>
  );
}
