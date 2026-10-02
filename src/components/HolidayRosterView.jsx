import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  Clock, 
  Plus, 
  Trash2, 
  Printer, 
  MessageCircle, 
  Sun, 
  Moon, 
  ShieldCheck, 
  CheckCircle2, 
  Layers, 
  ArrowRight,
  Filter,
  Users
} from 'lucide-react';
import { defaultHolidays } from '../utils/storage';
import { sounds } from '../utils/sound';

export default function HolidayRosterView({ 
  holidays = defaultHolidays, 
  setHolidays, 
  config, 
  employees = [],
  onSaveToast 
}) {
  const [activeTab, setActiveTab] = useState('holidays'); // 'holidays' | 'shifts'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');

  // Form state for new holiday
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newHolidayType, setNewHolidayType] = useState('festival');
  const [newHolidayPaid, setNewHolidayPaid] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];
  const sortedHolidays = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  const filteredHolidays = sortedHolidays.filter(h => {
    if (filterType === 'all') return true;
    if (filterType === 'upcoming') return h.date >= todayStr;
    return h.type === filterType;
  });

  const upcomingHolidays = sortedHolidays.filter(h => h.date >= todayStr);
  const nextHoliday = upcomingHolidays[0] || null;

  // Handle Add Holiday
  const handleAddHoliday = (e) => {
    e.preventDefault();
    if (!newHolidayName.trim()) return;
    sounds.playSuccess();

    const created = {
      id: `HOL-${Date.now()}`,
      name: newHolidayName.trim(),
      date: newHolidayDate,
      type: newHolidayType,
      isPaid: newHolidayPaid,
    };

    const updated = [...holidays, created];
    setHolidays(updated);
    setIsAddModalOpen(false);
    setNewHolidayName('');
    onSaveToast(`Added ${created.name} to Official Holiday Calendar!`);
  };

  // Handle Delete Holiday
  const handleDeleteHoliday = (id, name) => {
    if (window.confirm(`Remove ${name} from Holiday Calendar?`)) {
      sounds.playWarning();
      const updated = holidays.filter(h => h.id !== id);
      setHolidays(updated);
      onSaveToast(`Removed ${name} from holidays.`);
    }
  };

  // WhatsApp Share Holiday Calendar
  const handleShareWhatsAppCalendar = () => {
    sounds.playSuccess();
    const company = config?.companyName || 'SK ENTERPRISES';
    const year = new Date().getFullYear();
    const list = sortedHolidays
      .slice(0, 10)
      .map(h => `• ${new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}: *${h.name}* (${h.isPaid ? 'Paid PH' : 'Optional'})`)
      .join('\n');

    const msg = `*OFFICIAL COMPANY HOLIDAY CALENDAR ${year}*\n*${company}*\n303, Panchsheel CHS Ltd, Taloja Phase-1, Navi Mumbai\n\n*Upcoming Official Holidays:*\n${list}\n\n_Total Approved Annual Holidays: ${sortedHolidays.length} Days_\n_Wishing all staff safe and joyful celebrations!_`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Standard Shifts in Enterprise HRMS
  const shiftsMaster = [
    {
      id: 'General',
      name: 'General Day Shift (Standard Corporate)',
      timings: '09:30 AM - 06:30 PM',
      duration: '9.0 hrs (8h Work + 1h Lunch)',
      grace: '15 mins Grace (Up to 09:45 AM)',
      halfDayCutoff: 'After 01:45 PM',
      color: 'blue',
      icon: Sun,
      assignedCount: employees.filter(e => (e.shiftType || 'General') === 'General').length
    },
    {
      id: 'Morning',
      name: 'Early Morning Factory / Site Shift',
      timings: '06:30 AM - 03:00 PM',
      duration: '8.5 hrs (7.5h Work + 1h Break)',
      grace: '10 mins Grace (Up to 06:40 AM)',
      halfDayCutoff: 'After 11:00 AM',
      color: 'amber',
      icon: Sun,
      assignedCount: employees.filter(e => e.shiftType === 'Morning').length
    },
    {
      id: 'Night',
      name: 'Night / Overtime Operational Shift',
      timings: '10:00 PM - 06:30 AM',
      duration: '8.5 hrs (Overnight Cross-day)',
      grace: '15 mins Grace (Up to 10:15 PM)',
      halfDayCutoff: 'After 02:30 AM',
      color: 'purple',
      icon: Moon,
      assignedCount: employees.filter(e => e.shiftType === 'Night').length
    },
    {
      id: 'Flexible',
      name: 'Flexible / Executive Shift',
      timings: 'Any 8.0 Hours Working Window',
      duration: '8.0 hrs Pure Work Duration',
      grace: 'No Punch Threshold (Min 8h mandatory)',
      halfDayCutoff: 'Min 4h required',
      color: 'emerald',
      icon: Clock,
      assignedCount: employees.filter(e => e.shiftType === 'Flexible').length
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Print Styling */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 10mm 15mm !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header */}
      <div className="no-print bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Company Holiday Calendar &amp; Multi-Shift Master
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage official paid public holidays (PH), gazetted festival calendar, and multi-shift rosters.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Tab Switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('holidays')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'holidays'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Holiday Calendar ({sortedHolidays.length})
            </button>
            <button
              onClick={() => setActiveTab('shifts')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'shifts'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Shift Master ({shiftsMaster.length})
            </button>
          </div>

          <button
            onClick={handleShareWhatsAppCalendar}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all"
            title="Share holiday schedule on WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Schedule</span>
          </button>

          <button
            onClick={() => {
              sounds.playSuccess();
              window.print();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print A4</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Holiday</span>
          </button>
        </div>
      </div>

      {/* Official Print Header */}
      <div className="print-only hidden p-6 border-b-2 border-slate-900 bg-white text-slate-900 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase text-slate-950">
              {config?.companyName || 'SK ENTERPRISES'}
            </h1>
            <p className="text-xs text-slate-600 max-w-xl">
              {config?.companyAddress || '303, Panchsheel chs ltd, plot no 07, sec -02, taloja phase -01, navi mumbai -410208'}
            </p>
            <p className="text-sm font-black text-slate-900 mt-2 uppercase tracking-wide">
              Official Corporate Holiday List • Fiscal Year 2026-2027
            </p>
          </div>
          <div className="text-right text-xs space-y-1">
            <span className="font-bold block">Total Holidays: {sortedHolidays.length} Days</span>
            <span className="text-slate-500">Certified by HR Management</span>
          </div>
        </div>
      </div>

      {/* TAB 1: HOLIDAYS VIEW */}
      {activeTab === 'holidays' && (
        <div className="space-y-6">
          
          {/* Upcoming Holiday Highlight Card */}
          {nextHoliday && (
            <div className="no-print p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-900 dark:text-amber-200 shadow-sm animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/30 shrink-0">
                  🎉
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white">
                      Next Upcoming Holiday
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                      {new Date(nextHoliday.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {nextHoliday.name}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-black border border-emerald-300/60 dark:border-emerald-800/60">
                  {nextHoliday.isPaid ? '100% Paid Holiday (PH)' : 'Restricted Holiday'}
                </span>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="no-print flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400">Filter By:</span>
              <div className="flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                {[
                  { id: 'all', label: 'All Holidays' },
                  { id: 'upcoming', label: 'Upcoming Only' },
                  { id: 'national', label: 'National' },
                  { id: 'festival', label: 'Festivals' },
                  { id: 'state', label: 'State & Regional' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id)}
                    className={`px-3 py-1 rounded-xl font-bold transition-all ${
                      filterType === f.id
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">
              Showing {filteredHolidays.length} of {sortedHolidays.length} Holidays
            </div>
          </div>

          {/* Holiday Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHolidays.map((holiday) => {
              const isPast = holiday.date < todayStr;
              const dateObj = new Date(holiday.date);
              const weekdayStr = dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
              const monthStr = dateObj.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
              const dayNum = dateObj.getDate();

              return (
                <div
                  key={holiday.id}
                  className={`p-4 rounded-3xl border transition-all ${
                    isPast
                      ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800/60 opacity-75'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Calendar Date Badge */}
                      <div className="w-12 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 leading-none">
                          {monthStr}
                        </span>
                        <span className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                          {dayNum}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 leading-none">
                          {weekdayStr}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                          {holiday.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[9.5px] px-2 py-0.2 rounded-full font-bold uppercase ${
                            holiday.type === 'national' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            holiday.type === 'festival' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                            'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          }`}>
                            {holiday.type}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            {holiday.isPaid ? '• Paid Day' : '• Optional'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="no-print">
                      <button
                        onClick={() => handleDeleteHoliday(holiday.id, holiday.name)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete Holiday"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* TAB 2: MULTI-SHIFT MASTER */}
      {activeTab === 'shifts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shiftsMaster.map((shift) => {
              const Icon = shift.icon;
              return (
                <div
                  key={shift.id}
                  className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {shift.name}
                        </h3>
                        <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                          {shift.timings}
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {shift.assignedCount} Staff Assigned
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Working Hours</span>
                      <span className="font-bold text-slate-900 dark:text-white">{shift.duration}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Late Grace Window</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{shift.grace}</span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Half-Day Rule</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{shift.halfDayCutoff}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Holiday Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                <span>Add Corporate Paid Holiday</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddHoliday} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Holiday / Festival Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali Padwa, Christmas Eve..."
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Holiday Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Category
                  </label>
                  <select
                    value={newHolidayType}
                    onChange={(e) => setNewHolidayType(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="festival">Festival Holiday</option>
                    <option value="national">National Holiday</option>
                    <option value="state">State / Regional</option>
                    <option value="gazetted">Gazetted Holiday</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="paidCheck"
                  checked={newHolidayPaid}
                  onChange={(e) => setNewHolidayPaid(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="paidCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Statutory Paid Public Holiday (PH • Full Day Wage Credit)
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-2.5 text-xs font-bold rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 text-xs font-black rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
