import React, { useState } from 'react';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Search, 
  Filter, 
  Building, 
  Check, 
  Home, 
  Clock, 
  Calendar, 
  FileSpreadsheet, 
  Users, 
  X,
  Sparkles,
  Info,
  Printer
} from 'lucide-react';
import { sounds } from '../utils/sound';

export default function MonthlyAttendanceView({ 
  employees = [], 
  attendance = {}, 
  setAttendance, 
  config = {}, 
  onSelectEmployee, 
  onSaveToast,
  onNavigate
}) {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth()); // 0-indexed
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [editingCell, setEditingCell] = useState(null); // { empId, empName, dateStr, currentStatus }

  const departments = ['All', ...new Set([
    ...(config?.departments || []),
    ...employees.map(e => e.department).filter(Boolean)
  ])];

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

  const handleResetToCurrentMonth = () => {
    sounds.playSuccess();
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
  };

  // Calculate days in the selected month
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleString('default', { month: 'long' });

  // Generate list of day objects
  const monthDays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(selectedYear, selectedMonth, d);
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const weekdayShort = dateObj.toLocaleDateString(undefined, { weekday: 'narrow' });

    monthDays.push({
      dayNum: d,
      dateStr,
      isWeekend,
      dayOfWeek,
      weekdayShort,
    });
  }

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (emp.role && emp.role.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  // Cell status update
  const handleSetStatus = (newStatus, customOt = null) => {
    if (!editingCell) return;
    const { empId, dateStr, currentStatus } = editingCell;

    const dayRecords = attendance[dateStr] || {};
    let updatedDayRecords;

    const resolvedOt = customOt !== null 
      ? Number(customOt) 
      : (editingCell.otHours !== undefined ? Number(editingCell.otHours) : 0);

    if (newStatus === 'clear') {
      const { [empId]: removed, ...rest } = dayRecords;
      updatedDayRecords = rest;
    } else {
      const statusToSet = (newStatus && newStatus !== 'update_only') 
        ? newStatus 
        : (currentStatus !== 'none' && currentStatus !== 'weekend' ? currentStatus : 'present');

      updatedDayRecords = {
        ...dayRecords,
        [empId]: {
          ...(dayRecords[empId] || {}),
          status: statusToSet,
          clockIn: (statusToSet === 'present' || statusToSet === 'late') ? '09:30 AM' : statusToSet === 'wfh' ? '09:30 AM (WFH)' : '--',
          clockOut: (statusToSet === 'present' || statusToSet === 'wfh' || statusToSet === 'late') ? '06:30 PM' : '--',
          workingHours: (statusToSet === 'present' || statusToSet === 'wfh' || statusToSet === 'late') ? '9h 00m' : statusToSet === 'half_day' ? '4h 30m' : (statusToSet === 'week_off' || statusToSet === 'leave' || statusToSet === 'absent') ? '0h 00m' : '--',
          overtimeHours: Math.max(0, resolvedOt),
          note: statusToSet === 'week_off' ? 'Scheduled Week Off (WO)' : (dayRecords[empId]?.note || `Marked via Monthly Matrix`)
        }
      };
    }

    const updated = {
      ...attendance,
      [dateStr]: updatedDayRecords,
    };

    setAttendance(updated);
    sounds.playSuccess();
    setEditingCell(null);
    onSaveToast(`Updated ${editingCell.empName} on ${dateStr} (${newStatus === 'clear' ? 'Cleared' : newStatus === 'week_off' ? 'WEEK OFF' : newStatus.toUpperCase()}${resolvedOt > 0 ? ` +${resolvedOt}h OT` : ''})`);
  };

  // Helper to get status representation
  const getDayStatus = (empId, dateStr, isWeekend) => {
    const rec = attendance[dateStr]?.[empId];
    if (rec && rec.status) {
      return rec.status;
    }
    if (isWeekend) return 'weekend';
    return 'none';
  };

  // Calculate monthly stats for an employee
  const getEmpMonthlyStats = (empId) => {
    let office = 0;
    let wfh = 0;
    let late = 0;
    let halfDay = 0;
    let leave = 0;
    let absent = 0;
    let weekOff = 0;
    let totalOt = 0;

    monthDays.forEach(({ dateStr, isWeekend }) => {
      const rec = attendance[dateStr]?.[empId];
      if (rec?.status) {
        if (rec.status === 'present') office++;
        else if (rec.status === 'wfh') wfh++;
        else if (rec.status === 'late') { office++; late++; }
        else if (rec.status === 'half_day') halfDay++;
        else if (rec.status === 'leave') leave++;
        else if (rec.status === 'absent') absent++;
        else if (rec.status === 'week_off' || rec.status === 'wo') weekOff++;
      }
      if (rec?.overtimeHours) {
        totalOt += Number(rec.overtimeHours) || 0;
      }
    });

    const payable = office + wfh + leave + weekOff + (0.5 * halfDay);

    return {
      office,
      wfh,
      late,
      halfDay,
      leave,
      absent,
      weekOff,
      totalOt: Number(totalOt.toFixed(1)),
      payable,
    };
  };

  // Export Monthly CSV
  const handleExportMonthlyCSV = () => {
    sounds.playSuccess();
    const headers = ['EMP ID', 'Name', 'Department', ...monthDays.map(d => `${d.dayNum}`), 'Office', 'WFH', 'Week Off', 'Late', 'Leaves', 'Absent', 'Payable Days'];
    
    const rows = filteredEmployees.map(emp => {
      const stats = getEmpMonthlyStats(emp.id);
      const dayCodes = monthDays.map(d => {
        const st = getDayStatus(emp.id, d.dateStr, d.isWeekend);
        switch (st) {
          case 'present': return 'P';
          case 'wfh': return 'W';
          case 'late': return 'L';
          case 'half_day': return 'HD';
          case 'leave': return 'LV';
          case 'absent': return 'A';
          case 'week_off':
          case 'wo':
          case 'weekend': return 'WO';
          default: return '-';
        }
      });

      return [
        `"${emp.id}"`,
        `"${emp.name}"`,
        `"${emp.department}"`,
        ...dayCodes,
        stats.office,
        stats.wfh,
        stats.weekOff,
        stats.late,
        stats.leave,
        stats.absent,
        stats.payable,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `monthly_attendance_muster_${monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSaveToast(`Exported ${monthName} ${selectedYear} Muster Roll CSV!`);
  };

  return (
    <div className="space-y-6">
      
      {/* Landscape print style for 30-Day Matrix Muster Roll */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape !important;
            margin: 5mm 6mm !important;
          }
          table {
            font-size: 8.5pt !important;
          }
          th, td {
            padding: 3px 4px !important;
          }
        }
      `}</style>

      {/* Top Header Card */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Monthly Attendance Register & Muster Roll</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              30-DAY MATRIX
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete month-at-a-glance workforce grid. Click any day cell to quickly mark or modify attendance.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Navigator */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200/80 dark:border-slate-700/80">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs font-bold text-slate-900 dark:text-white min-w-[130px] text-center">
              {monthName} {selectedYear}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Daily vs Monthly Switcher */}
          {onNavigate && (
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  sounds.playSuccess();
                  onNavigate('mark');
                }}
                className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all flex items-center gap-1.5"
                title="Switch to Daily Roster"
              >
                <span>Daily</span>
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs flex items-center gap-1.5 font-black"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Monthly Muster</span>
              </button>
            </div>
          )}

          <button
            onClick={handleResetToCurrentMonth}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
          >
            Today
          </button>

          <button
            onClick={() => {
              sounds.playSuccess();
              window.print();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-md transition-all active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Register / PDF</span>
          </button>

          <button
            onClick={handleExportMonthlyCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Muster Roll CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Legend Bar */}
      <div className="no-print flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm text-xs">
        
        {/* Search & Department */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff in month..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold cursor-pointer"
          >
            {departments.map((d) => (
              <option key={d} value={d}>Dept: {d}</option>
            ))}
          </select>
        </div>

        {/* Color Legend */}
        <div className="flex items-center gap-3 flex-wrap text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500 font-bold text-[9px] text-white flex items-center justify-center">P</span>
            <span>Office</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-indigo-500 font-bold text-[9px] text-white flex items-center justify-center">W</span>
            <span>WFH</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-amber-400 font-bold text-[9px] text-slate-950 flex items-center justify-center">L</span>
            <span>Late</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-purple-500 font-bold text-[9px] text-white flex items-center justify-center">LV</span>
            <span>Leave</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-500 font-bold text-[9px] text-white flex items-center justify-center">A</span>
            <span>Absent</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-800 font-bold text-[9px] text-slate-400 flex items-center justify-center">WO</span>
            <span>Off</span>
          </span>
        </div>
      </div>

      {/* Official Corporate Print Header - SK ENTERPRISES LETTERHEAD */}
      <div className="print-only hidden p-4 mb-4 border-b-2 border-slate-900 bg-white text-slate-900">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                SK
              </div>
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">
                {config?.companyName || 'SK ENTERPRISES'}
              </h1>
            </div>
            <p className="text-[10px] text-slate-700 font-medium max-w-xl">
              {config?.companyAddress || '303, Panchsheel chs ltd, plot no 07, sec -02, taloja phase -01, navi mumbai -410208'}
            </p>
            <p className="text-xs font-bold text-slate-900 mt-1">
              OFFICIAL EMPLOYEE MONTHLY ATTENDANCE MUSTER ROLL REGISTER
            </p>
            <p className="text-[10px] text-slate-500">
              Month &amp; Year: <span className="font-bold text-slate-900 uppercase">{monthName} {selectedYear}</span> • Calendar Days: {daysInMonth}
            </p>
          </div>
          <div className="text-right text-[10px] space-y-0.5">
            <p className="font-bold text-slate-900">Generated on: {new Date().toLocaleDateString()}</p>
            <p className="text-slate-600">Department: {selectedDept} • Total Employees: {filteredEmployees.length}</p>
            <p className="text-slate-500">Codes: P (Office) | W (WFH) | WO (Week Off) | L (Late) | LV (Leave) | HD (Half Day) | A (Absent)</p>
          </div>
        </div>
      </div>

      {/* Monthly Attendance Matrix Grid Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden printable-document">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                <th className="p-3.5 sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 min-w-[200px] border-r border-slate-200 dark:border-slate-700">
                  Staff Member
                </th>

                {/* Day Headers (1 to 28/30/31) */}
                {monthDays.map((d) => (
                  <th 
                    key={d.dayNum} 
                    className={`p-1.5 text-center min-w-[34px] border-r border-slate-200/60 dark:border-slate-800/60 ${
                      d.isWeekend ? 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-400' : ''
                    }`}
                  >
                    <div className="font-mono text-xs">{d.dayNum}</div>
                    <div className="text-[9px] font-normal uppercase text-slate-400">{d.weekdayShort}</div>
                  </th>
                ))}

                {/* Monthly Totals Header */}
                <th className="p-2 text-center font-bold text-emerald-600 dark:text-emerald-400 min-w-[38px] bg-emerald-50/50 dark:bg-emerald-950/20" title="Office Present">
                  P
                </th>
                <th className="p-2 text-center font-bold text-indigo-600 dark:text-indigo-400 min-w-[38px] bg-indigo-50/50 dark:bg-indigo-950/20" title="Work From Home">
                  W
                </th>
                <th className="p-2 text-center font-bold text-sky-600 dark:text-sky-400 min-w-[38px] bg-sky-50/50 dark:bg-sky-950/20" title="Week Off (WO)">
                  WO
                </th>
                <th className="p-2 text-center font-bold text-purple-600 dark:text-purple-400 min-w-[38px] bg-purple-50/50 dark:bg-purple-950/20" title="Paid Leave">
                  LV
                </th>
                <th className="p-2 text-center font-bold text-rose-600 dark:text-rose-400 min-w-[38px] bg-rose-50/50 dark:bg-rose-950/20" title="Absent (LWP)">
                  A
                </th>
                <th className="p-2 text-center font-bold text-amber-600 dark:text-amber-400 min-w-[42px] bg-amber-50/50 dark:bg-amber-950/20" title="Total Overtime Hours">
                  OT
                </th>
                <th className="p-2.5 text-center font-black text-slate-900 dark:text-white min-w-[65px] bg-slate-100/70 dark:bg-slate-800/70" title="Total Payable Days">
                  Payable
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={monthDays.length + 7} className="p-12 text-center text-slate-400">
                    No employees found matching filter.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const stats = getEmpMonthlyStats(emp.id);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      
                      {/* Fixed Staff Member Info */}
                      <td className="p-3 sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                          <div className="truncate max-w-[130px]">
                            <button
                              onClick={() => onSelectEmployee(emp)}
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block text-left text-xs"
                            >
                              {emp.name}
                            </button>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {emp.id} • {emp.department}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Days Matrix Cells */}
                      {monthDays.map((d) => {
                        const status = getDayStatus(emp.id, d.dateStr, d.isWeekend);
                        const rec = attendance[d.dateStr]?.[emp.id];
                        const ot = Number(rec?.overtimeHours) || 0;

                        return (
                          <td 
                            key={d.dayNum} 
                            onClick={() => setEditingCell({
                              empId: emp.id,
                              empName: emp.name,
                              dateStr: d.dateStr,
                              currentStatus: status,
                              otHours: ot,
                            })}
                            className={`p-1 text-center cursor-pointer transition-transform hover:scale-110 border-r border-slate-100 dark:border-slate-800/60 ${
                              d.isWeekend ? 'bg-slate-50/60 dark:bg-slate-800/20' : ''
                            }`}
                            title={`${emp.name} on ${d.dateStr}: ${status.toUpperCase()}${ot > 0 ? ` (+${ot}h Overtime)` : ''} (Click to change)`}
                          >
                            <div className="flex flex-col items-center justify-center">
                              {status === 'present' && (
                                <span className="inline-block w-6 h-6 rounded-lg bg-emerald-500 text-white font-bold text-[10px] leading-6 shadow-2xs">
                                  P
                                </span>
                              )}
                              {status === 'wfh' && (
                                <span className="inline-block w-6 h-6 rounded-lg bg-indigo-500 text-white font-bold text-[10px] leading-6 shadow-2xs">
                                  W
                                </span>
                              )}
                              {status === 'late' && (
                                <span className="inline-block w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-[10px] leading-6 shadow-2xs">
                                  L
                                </span>
                              )}
                              {status === 'half_day' && (
                                <span className="inline-block w-6 h-6 rounded-lg bg-amber-500 text-white font-bold text-[9px] leading-6">
                                  HD
                                </span>
                              )}
                              {status === 'leave' && (
                                <span className="inline-block w-6 h-6 rounded-lg bg-purple-500 text-white font-bold text-[9px] leading-6 shadow-2xs">
                                  LV
                                </span>
                              )}
                              {status === 'absent' && (
                                <span className="inline-block w-6 h-6 rounded-lg bg-rose-500 text-white font-bold text-[10px] leading-6 shadow-2xs">
                                  A
                                </span>
                              )}
                              {(status === 'week_off' || status === 'wo') && (
                                <span className="inline-block w-6 h-6 rounded-lg bg-sky-500 text-white font-bold text-[9px] leading-6 shadow-2xs">
                                  WO
                                </span>
                              )}
                              {status === 'weekend' && (
                                <span className="inline-block w-6 h-6 text-slate-300 dark:text-slate-600 font-mono text-[9px] leading-6">
                                  ·
                                </span>
                              )}
                              {status === 'none' && (
                                <span className="inline-block w-6 h-6 text-slate-300 dark:text-slate-700 font-mono text-[10px] leading-6">
                                  -
                                </span>
                              )}
                              {ot > 0 && (
                                <span className="block text-[8px] font-black font-mono leading-tight text-amber-600 dark:text-amber-400 mt-0.5">
                                  +{ot}h
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Summary Columns */}
                      <td className="p-2 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                        {stats.office}
                      </td>
                      <td className="p-2 text-center font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/10">
                        {stats.wfh}
                      </td>
                      <td className="p-2 text-center font-bold text-sky-600 dark:text-sky-400 bg-sky-50/30 dark:bg-sky-950/10" title="Week Offs">
                        {stats.weekOff}
                      </td>
                      <td className="p-2 text-center font-bold text-purple-600 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-950/10">
                        {stats.leave}
                      </td>
                      <td className="p-2 text-center font-bold text-rose-500 bg-rose-50/30 dark:bg-rose-950/10">
                        {stats.absent}
                      </td>
                      <td className="p-2 text-center font-bold text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/10" title="Total Overtime Hours">
                        {stats.totalOt > 0 ? `${stats.totalOt}h` : '-'}
                      </td>
                      <td className="p-2.5 text-center font-black text-slate-900 dark:text-white bg-slate-100/50 dark:bg-slate-800/40">
                        {stats.payable}d
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Signatures for Printed PDF Register */}
      <div className="print-only hidden pt-12 grid grid-cols-3 gap-8 text-center text-xs text-slate-900 bg-white">
        <div className="border-t-2 border-slate-900 pt-2 font-bold">
          <p>Prepared by</p>
          <p className="text-[10px] text-slate-500 font-normal">Attendance & Operations Executive</p>
        </div>
        <div className="border-t-2 border-slate-900 pt-2 font-bold">
          <p>Verified by</p>
          <p className="text-[10px] text-slate-500 font-normal">HR & Payroll Manager</p>
        </div>
        <div className="border-t-2 border-slate-900 pt-2 font-bold">
          <p>Authorized Signatory</p>
          <p className="text-[10px] text-slate-500 font-normal">Chief Human Resources Officer (CHRO)</p>
        </div>
      </div>

      {/* Quick Cell Edit Modal / Popover */}
      {editingCell && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Mark Attendance
                </h3>
                <p className="text-[11px] text-slate-400">
                  {editingCell.empName} • <strong className="text-blue-500">{editingCell.dateStr}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Overtime (OT) Selector */}
            <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase text-amber-900 dark:text-amber-300">
                  Overtime (OT) Hours:
                </label>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  {editingCell.otHours || 0} Hours
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={editingCell.otHours ?? 0}
                  onChange={(e) => setEditingCell({
                    ...editingCell,
                    otHours: Math.max(0, parseFloat(e.target.value) || 0)
                  })}
                  className="w-20 px-2.5 py-1.5 text-xs font-black font-mono bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-slate-900 dark:text-white"
                />
                <div className="flex items-center gap-1 flex-1">
                  {[0, 1, 2, 3, 4].map(hrs => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setEditingCell({ ...editingCell, otHours: hrs })}
                      className={`flex-1 py-1.5 text-[10.5px] font-bold rounded-lg transition-all ${
                        Number(editingCell.otHours) === hrs
                          ? 'bg-amber-500 text-white shadow-xs font-black scale-105'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-amber-100'
                      }`}
                    >
                      {hrs === 0 ? '0h' : `+${hrs}h`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => handleSetStatus('present')}
                className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 transition-all"
              >
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span>Present (Office)</span>
              </button>

              <button
                onClick={() => handleSetStatus('wfh')}
                className="p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 transition-all"
              >
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                <span>Work From Home</span>
              </button>

              <button
                onClick={() => handleSetStatus('week_off')}
                className="p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-2 transition-all"
              >
                <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                <span>Week Off (WO)</span>
              </button>

              <button
                onClick={() => handleSetStatus('late')}
                className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-2 transition-all"
              >
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span>Late Arrival</span>
              </button>

              <button
                onClick={() => handleSetStatus('leave')}
                className="p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-2 transition-all"
              >
                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                <span>Paid Leave</span>
              </button>

              <button
                onClick={() => handleSetStatus('half_day')}
                className="p-3 rounded-2xl bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/50 dark:hover:bg-yellow-900/60 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 flex items-center gap-2 transition-all"
              >
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span>Half Day (0.5)</span>
              </button>

              <button
                onClick={() => handleSetStatus('absent')}
                className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-2 transition-all"
              >
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span>Absent (LWP)</span>
              </button>

              <button
                onClick={() => handleSetStatus('update_only')}
                className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-2 transition-all"
              >
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span>Save OT Only</span>
              </button>
            </div>

            <div className="pt-1 flex justify-between items-center text-xs">
              <button
                onClick={() => handleSetStatus('clear')}
                className="text-slate-400 hover:text-rose-500 font-semibold"
              >
                Clear Entry
              </button>
              <button
                onClick={() => setEditingCell(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
