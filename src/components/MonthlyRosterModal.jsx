import React, { useState } from 'react';
import { 
  X, 
  CalendarDays, 
  Check, 
  Sparkles
} from 'lucide-react';
import { sounds } from '../utils/sound';

export default function MonthlyRosterModal({
  isOpen,
  onClose,
  employees = [],
  attendance = {},
  setAttendance,
  config = {},
  onSaveToast,
  initialYear = new Date().getFullYear(),
  initialMonth = new Date().getMonth()
}) {
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth); // 0-indexed
  const [presetPattern, setPresetPattern] = useState('sundays_only'); // 'sundays_only' | 'sat_sun' | 'sundays_2nd_4th_sat' | 'custom_day'
  const [customDayOfWeek, setCustomDayOfWeek] = useState(0); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const [targetScope, setTargetScope] = useState('all'); // 'all' | 'department' | 'employee'
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [preserveExisting, setPreserveExisting] = useState(true); // CRITICAL: Existing entry delete na karo

  if (!isOpen) return null;

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const monthName = new Date(selectedYear, selectedMonth, 1).toLocaleString('default', { month: 'long' });

  const departments = ['All', ...new Set([
    ...(config?.departments || []),
    ...employees.map(e => e.department).filter(Boolean)
  ])];

  // Helper to determine if day is a Week Off under the selected preset
  const isDayOffByPreset = (dayNum) => {
    const dObj = new Date(selectedYear, selectedMonth, dayNum);
    const dayOfWeek = dObj.getDay(); // 0 = Sun, 6 = Sat

    if (presetPattern === 'sundays_only') {
      return dayOfWeek === 0;
    }
    if (presetPattern === 'sat_sun') {
      return dayOfWeek === 0 || dayOfWeek === 6;
    }
    if (presetPattern === 'sundays_2nd_4th_sat') {
      if (dayOfWeek === 0) return true;
      if (dayOfWeek === 6) {
        // Find which Saturday of the month this is
        const satIndex = Math.ceil(dayNum / 7);
        return satIndex === 2 || satIndex === 4;
      }
      return false;
    }
    if (presetPattern === 'custom_day') {
      return dayOfWeek === Number(customDayOfWeek);
    }
    return false;
  };

  // Determine target employees
  const targetEmployees = employees.filter(emp => {
    if (targetScope === 'employee') {
      return emp.id === selectedEmployeeId;
    }
    if (targetScope === 'department' && selectedDepartment !== 'All') {
      return emp.department === selectedDepartment;
    }
    return true;
  });

  // Calculate preview count of week-offs
  let scheduledOffCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    if (isDayOffByPreset(d)) scheduledOffCount++;
  }

  // Handle Apply Roster to Month
  const handleApplyRoster = () => {
    sounds.playSuccess();
    const updated = { ...attendance };
    let markedCount = 0;
    let preservedCount = 0;

    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

    targetEmployees.forEach(emp => {
      for (let d = 1; d <= daysInMonth; d++) {
        const isOff = isDayOffByPreset(d);
        if (!isOff) continue;

        const dateStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
        if (!updated[dateStr]) updated[dateStr] = {};

        const existing = updated[dateStr][emp.id];
        // If employee has a valid existing punch/status, preserve it if preserveExisting is ON
        const hasExistingEntry = existing && existing.status && 
          existing.status !== 'none' && 
          existing.status !== 'weekend' && 
          existing.status !== 'week_off';

        if (preserveExisting && hasExistingEntry) {
          preservedCount++;
          continue; // DO NOT OVERWRITE! KEEP PRESENT / WFH / LEAVE!
        }

        updated[dateStr][emp.id] = {
          ...(existing || {}),
          status: 'week_off',
          clockIn: '--',
          clockOut: '--',
          workingHours: '0h 00m',
          overtimeHours: 0,
          note: `Monthly Roster: Scheduled Week Off (${new Date(selectedYear, selectedMonth, d).toLocaleDateString(undefined, { weekday: 'short' })})`
        };
        markedCount++;
      }
    });

    setAttendance(updated);
    onClose();
    onSaveToast(`Roster Applied! Marked ${markedCount} Week-Offs for ${monthName} ${selectedYear}.${preservedCount > 0 ? ` Preserved ${preservedCount} existing present/punch entries.` : ''}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <CalendarDays className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Monthly Shift &amp; Week-Off Roster
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-100 border border-blue-400/40">
                  Preset Engine
                </span>
              </h2>
              <p className="text-xs text-blue-100/80 font-medium">
                {config.companyName || 'SK ENTERPRISES'} • Safe Roster Planning (Existing punches preserved)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Month & Year Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Target Payroll Month
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {monthName} {selectedYear} ({daysInMonth} Days)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const mName = new Date(selectedYear, i, 1).toLocaleString('default', { month: 'long' });
                  return <option key={i} value={i}>{mName}</option>;
                })}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              >
                {[2025, 2026, 2027].map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Roster Pattern Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              1. Choose Week-Off Preset Pattern
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-semibold">
              
              {/* Sundays Only */}
              <button
                type="button"
                onClick={() => setPresetPattern('sundays_only')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  presetPattern === 'sundays_only'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center shrink-0 border ${
                  presetPattern === 'sundays_only' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {presetPattern === 'sundays_only' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <div>
                  <span className="font-black block text-slate-900 dark:text-white">All Sundays Off</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Standard 6-day industrial week (SK Enterprises default)</span>
                </div>
              </button>

              {/* Saturdays + Sundays */}
              <button
                type="button"
                onClick={() => setPresetPattern('sat_sun')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  presetPattern === 'sat_sun'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center shrink-0 border ${
                  presetPattern === 'sat_sun' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {presetPattern === 'sat_sun' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <div>
                  <span className="font-black block text-slate-900 dark:text-white">All Saturdays &amp; Sundays</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">5-day corporate shift schedule</span>
                </div>
              </button>

              {/* Sundays + 2nd & 4th Saturday */}
              <button
                type="button"
                onClick={() => setPresetPattern('sundays_2nd_4th_sat')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  presetPattern === 'sundays_2nd_4th_sat'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center shrink-0 border ${
                  presetPattern === 'sundays_2nd_4th_sat' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {presetPattern === 'sundays_2nd_4th_sat' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <div>
                  <span className="font-black block text-slate-900 dark:text-white">Sundays + 2nd &amp; 4th Saturday</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Alternate Saturdays off (Govt/Bank standard)</span>
                </div>
              </button>

              {/* Custom Day of Week */}
              <button
                type="button"
                onClick={() => setPresetPattern('custom_day')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  presetPattern === 'custom_day'
                    ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center shrink-0 border ${
                  presetPattern === 'custom_day' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {presetPattern === 'custom_day' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <div>
                  <span className="font-black block text-slate-900 dark:text-white">Custom Weekly Day Off</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">e.g. Every Tuesday, Friday, etc.</span>
                </div>
              </button>

            </div>

            {/* Custom Day selector dropdown if custom_day chosen */}
            {presetPattern === 'custom_day' && (
              <div className="pt-2 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Choose Day Off:</span>
                <select
                  value={customDayOfWeek}
                  onChange={(e) => setCustomDayOfWeek(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/40 text-xs font-bold text-blue-900 dark:text-blue-200"
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
              </div>
            )}
          </div>

          {/* Target Staff Scope */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              2. Apply Roster To
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetScope('all')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  targetScope === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                All Staff ({employees.length})
              </button>

              <button
                type="button"
                onClick={() => setTargetScope('department')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  targetScope === 'department'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                By Department
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetScope('employee');
                  if (!selectedEmployeeId && employees.length > 0) {
                    setSelectedEmployeeId(employees[0].id);
                  }
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  targetScope === 'employee'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Specific Employee
              </button>
            </div>

            {targetScope === 'department' && (
              <div className="pt-2">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {departments.map(d => (
                    <option key={d} value={d}>{d === 'All' ? 'All Departments' : `${d} Department`}</option>
                  ))}
                </select>
              </div>
            )}

            {targetScope === 'employee' && (
              <div className="pt-2">
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.id} • {e.department})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Month Days Visual Mini Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">
                Scheduled Off Days in {monthName} ({scheduledOffCount} Days Off):
              </span>
              <span className="text-sky-600 dark:text-sky-400 font-bold">
                {daysInMonth - scheduledOffCount} Working Days
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center font-mono">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayHeader, idx) => (
                <div key={idx} className="text-[10px] font-bold text-slate-400 py-0.5">
                  {dayHeader}
                </div>
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const isOff = isDayOffByPreset(dayNum);
                return (
                  <div
                    key={dayNum}
                    className={`py-1 rounded-lg text-xs font-bold transition-all ${
                      isOff
                        ? 'bg-sky-500 text-white shadow-2xs font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                    title={`Day ${dayNum}: ${isOff ? 'Scheduled Week Off (WO)' : 'Working Day'}`}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CRITICAL SAFETY TOGGLE (Preserve existing attendance entries) */}
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 flex items-start gap-3">
            <input
              type="checkbox"
              id="preserveExistingCheckbox"
              checked={preserveExisting}
              onChange={(e) => setPreserveExisting(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="preserveExistingCheckbox" className="text-xs cursor-pointer select-none">
              <span className="font-extrabold text-amber-950 dark:text-amber-200 block">
                🛡️ Existing entry delete na karein (Preserve already marked attendance)
              </span>
              <span className="text-amber-800/80 dark:text-amber-300/80 leading-relaxed block mt-0.5">
                Jo employee pehle se Present, WFH, Late, ya Leave mark kiye gaye hain, unka data <strong>safe rahega aur delete nahi hoga</strong>. Sirf unhi dino par Week-Off lagega jahan koi attendance mark nahi hui thi.
              </span>
            </label>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApplyRoster}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2 transition transform active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-blue-200" />
            <span>Apply Roster to {monthName} (Surakshit Save)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
