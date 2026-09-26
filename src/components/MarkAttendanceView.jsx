import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Clock, 
  FileText, 
  Search, 
  Sparkles, 
  RotateCcw, 
  Building, 
  Home, 
  CheckCheck, 
  CheckSquare, 
  Square, 
  Layers, 
  ArrowUpDown,
  CalendarDays,
  Printer,
  Plus,
  Minus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { calculateEmployeeStats, calculateWorkDuration } from '../utils/attendanceCalculations';
import { sounds } from '../utils/sound';

export default function MarkAttendanceView({ 
  employees, 
  attendance, 
  setAttendance, 
  config, 
  onSaveToast, 
  onSelectEmployee,
  onNavigate
}) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedShift, setSelectedShift] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]); // Array of emp IDs for bulk actions
  const [activeNoteModal, setActiveNoteModal] = useState(null);

  const departments = ['All', ...new Set([
    ...(config?.departments || []),
    ...employees.map(e => e.department).filter(Boolean)
  ])];
  const shifts = ['All', 'General', 'Morning', 'Night', 'Flexible'];
  const dayRecords = attendance[selectedDate] || {};

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'All' || emp.department === selectedDept;
    const matchesShift = selectedShift === 'All' || (emp.shiftType || 'General') === selectedShift;
    return matchesSearch && matchesDept && matchesShift;
  });

  // Toggle selection
  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredEmployees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map(e => e.id));
    }
  };

  // Bulk Apply to selected
  const handleBulkStatusSelected = (status) => {
    const targetIds = selectedIds.length > 0 ? selectedIds : filteredEmployees.map(e => e.id);
    const updatedDay = { ...dayRecords };

    targetIds.forEach((id) => {
      let clockIn = "09:25 AM";
      let clockOut = "06:30 PM";
      let workingHours = "9h 05m";
      let note = "";

      if (status === 'wfh') {
        note = "Approved Work From Home";
      } else if (status === 'week_off') {
        clockIn = "--";
        clockOut = "--";
        workingHours = "0h 00m";
        note = "Scheduled Week Off (WO)";
      } else if (status === 'leave') {
        clockIn = "--";
        clockOut = "--";
        workingHours = "0h 00m";
        note = "Approved Casual/Sick Leave";
      } else if (status === 'absent') {
        clockIn = "--";
        clockOut = "--";
        workingHours = "0h 00m";
        note = "Unapproved Absence (LWP)";
      }

      updatedDay[id] = {
        ...(updatedDay[id] || {}),
        status,
        clockIn,
        clockOut,
        workingHours,
        note,
      };
    });

    setAttendance({ ...attendance, [selectedDate]: updatedDay });
    sounds.playSuccess();
    onSaveToast(`Updated ${targetIds.length} staff members to ${status === 'week_off' ? 'WEEK OFF' : status.toUpperCase()}!`);
    setSelectedIds([]);
  };

  // Single employee status update
  const handleSetStatus = (empId, status) => {
    sounds.playSuccess();
    const currentRec = dayRecords[empId] || {};
    let clockIn = currentRec.clockIn || "09:25 AM";
    let clockOut = currentRec.clockOut || "06:30 PM";
    let workingHours = "9h 05m";
    let note = currentRec.note || "";

    if (status === 'week_off') {
      clockIn = "--";
      clockOut = "--";
      workingHours = "0h 00m";
      note = note || "Scheduled Week Off (WO)";
    } else if (status === 'leave') {
      clockIn = "--";
      clockOut = "--";
      workingHours = "0h 00m";
      note = note || "Approved Casual/Sick Leave";
    } else if (status === 'absent') {
      clockIn = "--";
      clockOut = "--";
      workingHours = "0h 00m";
      note = note || "Unapproved Absence (LWP)";
    } else if (status === 'half_day') {
      clockIn = "09:30 AM";
      clockOut = "01:45 PM";
      workingHours = "4h 15m";
    } else if (status === 'wfh') {
      note = note || "Work From Home";
    }

    const updated = {
      ...attendance,
      [selectedDate]: {
        ...dayRecords,
        [empId]: {
          ...currentRec,
          status,
          clockIn,
          clockOut,
          workingHours,
          note,
        }
      }
    };

    setAttendance(updated);
  };

  // Explicit Overtime Setter (Direct Input / Quick Presets)
  const handleSetOvertime = (empId, otHours) => {
    sounds.playSuccess();
    const currentRec = dayRecords[empId] || {};
    const numOt = Math.max(0, Number(otHours) || 0);

    const updated = {
      ...attendance,
      [selectedDate]: {
        ...dayRecords,
        [empId]: {
          ...(currentRec.status ? currentRec : {
            status: 'present',
            clockIn: '09:25 AM',
            clockOut: '06:30 PM',
            workingHours: '9h 05m',
          }),
          overtimeHours: numOt,
        }
      }
    };

    setAttendance(updated);
    const empName = employees.find(e => e.id === empId)?.name || empId;
    onSaveToast(`Set Overtime to ${numOt}h for ${empName}`);
  };

  const handleAdjustOvertime = (empId, delta) => {
    const currentRec = dayRecords[empId] || {};
    const currentOt = Number(currentRec.overtimeHours) || 0;
    const newOt = Math.max(0, Number((currentOt + delta).toFixed(1)));
    handleSetOvertime(empId, newOt);
  };

  const handleSaveTimingsModal = (e) => {
    e?.preventDefault?.();
    if (!activeNoteModal) return;
    sounds.playSuccess();

    const { empId, status, clockIn, clockOut, overtimeHours, note } = activeNoteModal;
    const currentRec = dayRecords[empId] || {};

    const hasPunches = clockIn && clockOut && clockIn !== '--' && clockOut !== '--';
    const dur = hasPunches ? calculateWorkDuration(clockIn, clockOut) : null;
    const workingHours = dur ? dur.workingHours : (currentRec.workingHours || '--');

    const updated = {
      ...attendance,
      [selectedDate]: {
        ...dayRecords,
        [empId]: {
          ...currentRec,
          status: status || currentRec.status || 'present',
          clockIn: clockIn || currentRec.clockIn || '09:25 AM',
          clockOut: clockOut || currentRec.clockOut || '06:30 PM',
          workingHours,
          overtimeHours: Math.max(0, Number(overtimeHours) || 0),
          note: note || '',
        }
      }
    };

    setAttendance(updated);
    setActiveNoteModal(null);
    onSaveToast(`Updated timings & ${overtimeHours || 0}h Overtime for ${activeNoteModal.name}!`);
  };

  const handleSaveSheet = () => {
    sounds.playSuccess();
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}
    onSaveToast(`Timesheet attendance confirmed for ${selectedDate}!`);
  };

  // Date Navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Counts
  let inOffice = 0;
  let wfh = 0;
  let halfDay = 0;
  let onLeave = 0;
  let absent = 0;
  let weekOff = 0;
  let markedCount = 0;

  filteredEmployees.forEach((emp) => {
    const rec = dayRecords[emp.id];
    if (rec && rec.status) {
      markedCount++;
      if (rec.status === 'present' || rec.status === 'late') inOffice++;
      else if (rec.status === 'wfh') wfh++;
      else if (rec.status === 'half_day') halfDay++;
      else if (rec.status === 'leave') onLeave++;
      else if (rec.status === 'absent') absent++;
      else if (rec.status === 'week_off' || rec.status === 'wo') weekOff++;
    }
  });

  const dayPercentage = markedCount > 0
    ? Number(((inOffice + wfh + weekOff + (halfDay * 0.5)) / markedCount * 100).toFixed(1))
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Portrait print setup for Daily Attendance Sheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 8mm 10mm !important;
          }
        }
      `}</style>

      {/* Top Header & Date Navigation Bar */}
      <div className="no-print bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Date Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <CalendarIcon className="w-4 h-4 text-blue-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer font-mono"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className="px-3.5 py-2 text-xs font-bold rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 transition-colors"
          >
            Today
          </button>

          {/* Daily vs Monthly Switcher */}
          {onNavigate && (
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold ml-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs"
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playSuccess();
                  onNavigate('monthly');
                }}
                className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all flex items-center gap-1.5"
                title="Switch to 30-Day Monthly Attendance Grid"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Monthly Muster</span>
              </button>
            </div>
          )}
        </div>

        {/* Bulk Action Buttons & Print */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => {
              sounds.playSuccess();
              window.print();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-sm transition-all"
            title="Print Daily Sheet"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Daily Sheet</span>
          </button>

          <button
            onClick={() => handleBulkStatusSelected('present')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 transition-all active:scale-95"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Mark {selectedIds.length > 0 ? `(${selectedIds.length})` : 'All'} Office</span>
          </button>

          <button
            onClick={() => handleBulkStatusSelected('wfh')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 transition-all active:scale-95"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Mark {selectedIds.length > 0 ? `(${selectedIds.length})` : 'All'} WFH</span>
          </button>

          <button
            onClick={() => handleBulkStatusSelected('week_off')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/60 transition-all active:scale-95"
            title="Mark Selected or All Staff as Week Off"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Mark {selectedIds.length > 0 ? `(${selectedIds.length})` : 'All'} Week Off</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm(`Clear attendance for ${selectedDate}?`)) {
                const updated = { ...attendance };
                delete updated[selectedDate];
                setAttendance(updated);
                onSaveToast("Cleared date records");
              }
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            title="Reset this day"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee by name, ID, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Department Filter */}
        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>Department: {d}</option>
            ))}
          </select>
        </div>

        {/* Shift Filter */}
        <div>
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {shifts.map((s) => (
              <option key={s} value={s}>Shift: {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Official Print Header - SK ENTERPRISES LETTERHEAD */}
      <div className="print-only hidden p-5 mb-4 border-b-2 border-slate-900 bg-white text-slate-900">
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
              DAILY EMPLOYEE ATTENDANCE ROSTER &amp; SHIFT LOG
            </p>
            <p className="text-[10px] text-slate-500">
              Roster Date: <span className="font-bold text-slate-900">{selectedDate}</span> • Cycle: Fiscal 2026-27
            </p>
          </div>
          <div className="text-right text-xs space-y-0.5">
            <p className="font-bold text-slate-900">Staff Count: {filteredEmployees.length}</p>
            <p className="text-[11px] text-slate-600">Department: {selectedDept}</p>
            <p className="text-[10px] text-slate-500">Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Corporate Attendance Table with Multi-Select Checkboxes */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden printable-document">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="no-print py-3.5 px-4 w-10 text-center">
                  <button onClick={handleSelectAll} className="text-slate-400 hover:text-blue-600">
                    {selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Department & Shift</th>
                <th className="py-3.5 px-4 text-center">Punch Timings & Overtime</th>
                <th className="py-3.5 px-4 text-center">Status for {selectedDate}</th>
                <th className="py-3.5 px-4 text-right">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No employees registered yet. Go to <strong className="text-blue-500">Employee Directory</strong> to onboard staff.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                const rec = dayRecords[emp.id];
                const status = rec?.status || null;
                const isSelected = selectedIds.includes(emp.id);

                return (
                  <tr 
                    key={emp.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="no-print py-3.5 px-4 text-center">
                      <button onClick={() => handleToggleSelect(emp.id)} className="text-slate-400 hover:text-blue-600">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Employee */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={emp.avatar} 
                          alt={emp.name} 
                          className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer"
                          onClick={() => onSelectEmployee(emp)}
                        />
                        <div>
                          <div 
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer flex items-center gap-1.5"
                            onClick={() => onSelectEmployee(emp)}
                          >
                            <span>{emp.name}</span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{emp.id}</span>
                            <span>•</span>
                            <span>{emp.role}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department & Shift */}
                    <td className="py-3.5 px-4 hidden md:table-cell text-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{emp.department}</div>
                      <div className="text-[11px] text-slate-400 font-medium">{emp.shift}</div>
                    </td>

                    {/* Punch Timings & Overtime */}
                    <td className="py-3.5 px-4 text-center">
                      <div 
                        onClick={() => setActiveNoteModal({
                          empId: emp.id,
                          name: emp.name,
                          status: status || 'present',
                          note: rec?.note || '',
                          clockIn: rec?.clockIn || '09:25 AM',
                          clockOut: rec?.clockOut || '06:30 PM',
                          overtimeHours: (rec?.overtimeHours !== undefined && rec?.overtimeHours !== null && rec?.overtimeHours !== '')
                            ? Number(rec.overtimeHours)
                            : 0,
                        })}
                        className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Click to edit Punch-In and Punch-Out timings"
                      >
                        {rec?.clockIn ? `${rec.clockIn} - ${rec.clockOut}` : '--'}
                      </div>
                      
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        {(() => {
                          const hasPunches = rec?.clockIn && rec?.clockOut && rec.clockIn !== '--' && rec.clockOut !== '--';
                          const dur = hasPunches ? calculateWorkDuration(rec.clockIn, rec.clockOut) : null;
                          const displayHours = dur ? dur.workingHours : (rec?.workingHours || '0h');
                          const ot = (rec?.overtimeHours !== undefined && rec?.overtimeHours !== null && rec?.overtimeHours !== '')
                            ? Number(rec.overtimeHours)
                            : (dur ? dur.overtimeHours : 0);
                          return (
                            <>
                              <span className="font-medium">{displayHours}</span>
                              {ot > 0 && (
                                <span className="px-1.5 py-0.5 rounded-md font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60">
                                  +{ot}h OT
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {/* Interactive Overtime (OT) Controls */}
                      {(() => {
                        const hasPunches = rec?.clockIn && rec?.clockOut && rec.clockIn !== '--' && rec.clockOut !== '--';
                        const dur = hasPunches ? calculateWorkDuration(rec.clockIn, rec.clockOut) : null;
                        const ot = (rec?.overtimeHours !== undefined && rec?.overtimeHours !== null && rec?.overtimeHours !== '')
                          ? Number(rec.overtimeHours)
                          : (dur ? dur.overtimeHours : 0);

                        return (
                          <div className="no-print mt-2 flex flex-col items-center gap-1">
                            <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleAdjustOvertime(emp.id, -0.5)}
                                className="w-5 h-5 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-xs transition-colors"
                                title="Minus 30 mins OT (-0.5h)"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => setActiveNoteModal({
                                  empId: emp.id,
                                  name: emp.name,
                                  status: status || 'present',
                                  note: rec?.note || '',
                                  clockIn: rec?.clockIn || '09:25 AM',
                                  clockOut: rec?.clockOut || '06:30 PM',
                                  overtimeHours: ot,
                                })}
                                className="px-2 py-0.5 text-center font-mono font-bold text-xs text-amber-700 dark:text-amber-400 hover:underline"
                                title="Click to open modal & type exact OT hours"
                              >
                                {ot > 0 ? `${ot}h OT` : '0h OT'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleAdjustOvertime(emp.id, 0.5)}
                                className="w-5 h-5 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-xs transition-colors"
                                title="Plus 30 mins OT (+0.5h)"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Quick Presets: +1h, +2h, +3h */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleSetOvertime(emp.id, 1)}
                                className={`px-1.5 py-0.5 text-[9.5px] font-bold rounded transition-all ${
                                  ot === 1 
                                    ? 'bg-amber-500 text-white shadow-xs' 
                                    : 'bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-950/60 text-slate-600 dark:text-slate-300'
                                }`}
                                title="Set 1 Hour OT"
                              >
                                +1h
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetOvertime(emp.id, 2)}
                                className={`px-1.5 py-0.5 text-[9.5px] font-bold rounded transition-all ${
                                  ot === 2 
                                    ? 'bg-amber-500 text-white shadow-xs' 
                                    : 'bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-950/60 text-slate-600 dark:text-slate-300'
                                }`}
                                title="Set 2 Hours OT"
                              >
                                +2h
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetOvertime(emp.id, 3)}
                                className={`px-1.5 py-0.5 text-[9.5px] font-bold rounded transition-all ${
                                  ot === 3 
                                    ? 'bg-amber-500 text-white shadow-xs' 
                                    : 'bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-950/60 text-slate-600 dark:text-slate-300'
                                }`}
                                title="Set 3 Hours OT"
                              >
                                +3h
                              </button>
                              {ot > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleSetOvertime(emp.id, 0)}
                                  className="px-1 py-0.5 text-[9.5px] font-bold rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  title="Clear OT to 0"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Quick Status Buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="no-print flex items-center justify-center gap-1 sm:gap-1.5">
                        {/* Office */}
                        <button
                          onClick={() => handleSetStatus(emp.id, 'present')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            status === 'present'
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                          }`}
                          title="Office Present"
                        >
                          <Building className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Office</span>
                        </button>

                        {/* WFH */}
                        <button
                          onClick={() => handleSetStatus(emp.id, 'wfh')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            status === 'wfh'
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600'
                          }`}
                          title="Work From Home"
                        >
                          <Home className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WFH</span>
                        </button>

                        {/* Week Off (WO) */}
                        <button
                          onClick={() => handleSetStatus(emp.id, 'week_off')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            status === 'week_off' || status === 'wo'
                              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 scale-105'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-600'
                          }`}
                          title="Weekly Off (WO)"
                        >
                          <CalendarDays className="w-3.5 h-3.5" />
                          <span>WO</span>
                        </button>

                        {/* Half Day */}
                        <button
                          onClick={() => handleSetStatus(emp.id, 'half_day')}
                          className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            status === 'half_day'
                              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600'
                          }`}
                          title="Half Day"
                        >
                          <span>Half</span>
                        </button>

                        {/* Leave */}
                        <button
                          onClick={() => handleSetStatus(emp.id, 'leave')}
                          className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            status === 'leave'
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600'
                          }`}
                          title="Approved Leave"
                        >
                          <span>Leave</span>
                        </button>

                        {/* LWP */}
                        <button
                          onClick={() => handleSetStatus(emp.id, 'absent')}
                          className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            status === 'absent'
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-105'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600'
                          }`}
                          title="Loss of Pay"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">LWP</span>
                        </button>
                      </div>

                      {/* Clean Print Badge */}
                      <div className="print-only hidden font-bold text-xs uppercase text-center">
                        {status ? (
                          <span className={`px-2.5 py-1 rounded font-bold text-xs ${
                            status === 'present' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                            status === 'wfh' ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' :
                            (status === 'week_off' || status === 'wo') ? 'bg-sky-100 text-sky-900 border border-sky-300' :
                            status === 'late' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                            status === 'half_day' ? 'bg-yellow-100 text-yellow-900 border border-yellow-300' :
                            status === 'leave' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                            'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}>
                            {(status === 'week_off' || status === 'wo') ? 'WEEK OFF' : status.replace('_', ' ').toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-slate-400">NOT MARKED</span>
                        )}
                      </div>
                    </td>

                    {/* Remarks */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="no-print">
                        <button
                          onClick={() => setActiveNoteModal({
                            empId: emp.id,
                            name: emp.name,
                            status: status || 'present',
                            note: rec?.note || '',
                            clockIn: rec?.clockIn || '09:25 AM',
                            clockOut: rec?.clockOut || '06:30 PM',
                            overtimeHours: (rec?.overtimeHours !== undefined && rec?.overtimeHours !== null && rec?.overtimeHours !== '')
                              ? Number(rec.overtimeHours)
                              : 0,
                          })}
                          className={`p-2 rounded-xl transition-colors ${
                            rec?.note 
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold' 
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={rec?.note ? `Note: ${rec.note}` : 'Edit timings, OT & remarks'}
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="print-only hidden text-xs text-slate-700 italic">
                        {rec?.note || '--'}
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Signatures for Printed Daily Sheet */}
      <div className="print-only hidden pt-12 grid grid-cols-3 gap-6 text-center text-xs text-slate-900 bg-white">
        <div className="border-t-2 border-slate-900 pt-2 font-bold">
          <p>Duty Officer / Gate Security</p>
          <p className="text-[10px] text-slate-500 font-normal">Physical Attendance Log Verified</p>
        </div>
        <div className="border-t-2 border-slate-900 pt-2 font-bold">
          <p>Shift Supervisor / Line Manager</p>
          <p className="text-[10px] text-slate-500 font-normal">Shift Hours &amp; Overtime Checked</p>
        </div>
        <div className="border-t-2 border-slate-900 pt-2 font-bold">
          <p>HR Attendance Officer</p>
          <p className="text-[10px] text-slate-500 font-normal">HRMS System Reconciled</p>
        </div>
      </div>

      {/* Sticky Bottom Summary Toolbar */}
      <div className="no-print sticky bottom-4 z-30 bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-xl px-6 py-4 rounded-3xl shadow-2xl border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Total Filtered:</span>
            <span className="font-bold text-white text-sm">{filteredEmployees.length}</span>
          </div>
          <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>

          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Office: {inOffice}</span>
          </div>

          <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
            <span>WFH: {wfh}</span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Half Day: {halfDay}</span>
          </div>

          <div className="flex items-center gap-1.5 text-purple-300 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
            <span>Leave: {onLeave}</span>
          </div>

          <div className="flex items-center gap-1.5 text-rose-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>LWP: {absent}</span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Attendance:</span>
            <span className="font-black text-sm text-blue-400">
              {dayPercentage}%
            </span>
          </div>
        </div>

        <button
          onClick={handleSaveSheet}
          className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Confirm & Lock Timesheet</span>
        </button>
      </div>

      {/* Punch Timings & Overtime / Note Modal */}
      {activeNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>Punch Timings & Overtime Log</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeNoteModal.name} ({activeNoteModal.empId}) • <span className="font-semibold text-blue-600 dark:text-blue-400">{selectedDate}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNoteModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTimingsModal} className="space-y-4">
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Attendance Status
                </label>
                <select
                  value={activeNoteModal.status || 'present'}
                  onChange={(e) => setActiveNoteModal({ ...activeNoteModal, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="present">Present (In-Office)</option>
                  <option value="wfh">Work From Home (WFH)</option>
                  <option value="week_off">Week Off (WO)</option>
                  <option value="half_day">Half Day (0.5)</option>
                  <option value="late">Late Arrival</option>
                  <option value="leave">Approved Paid Leave</option>
                  <option value="absent">Loss of Pay (LWP / Absent)</option>
                </select>
              </div>

              {/* Timings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Clock In Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 09:25 AM"
                    value={activeNoteModal.clockIn || ''}
                    onChange={(e) => setActiveNoteModal({ ...activeNoteModal, clockIn: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Clock Out Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 06:30 PM"
                    value={activeNoteModal.clockOut || ''}
                    onChange={(e) => setActiveNoteModal({ ...activeNoteModal, clockOut: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* OVERTIME (HOURS) SECTION */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <span>Overtime (OT) Hours:</span>
                  </label>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    1.5x Hourly Rate Applicable
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={activeNoteModal.overtimeHours ?? 0}
                      onChange={(e) => setActiveNoteModal({ ...activeNoteModal, overtimeHours: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className="w-full px-3.5 py-2 text-sm font-black font-mono bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600 dark:text-amber-400">
                      Hours
                    </span>
                  </div>

                  {/* Quick buttons */}
                  <div className="flex items-center gap-1">
                    {[0, 1, 2, 3, 4, 6].map((hrs) => (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() => setActiveNoteModal({ ...activeNoteModal, overtimeHours: hrs })}
                        className={`px-2 py-2 text-xs font-bold rounded-xl transition-all ${
                          Number(activeNoteModal.overtimeHours) === hrs
                            ? 'bg-amber-500 text-white shadow-xs scale-105'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-amber-100 dark:hover:bg-amber-950/40'
                        }`}
                      >
                        {hrs === 0 ? '0h' : `+${hrs}h`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Remarks / Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Shift Notes / Reason for Overtime
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Urgent client delivery / Machine breakdown maintenance / Approved extra hours"
                  value={activeNoteModal.note || ''}
                  onChange={(e) => setActiveNoteModal({ ...activeNoteModal, note: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveNoteModal(null)}
                  className="px-4 py-2.5 text-xs font-bold rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Timings &amp; OT</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
