import React, { useState } from 'react';
import { 
  Users, 
  Building, 
  Home, 
  Clock, 
  CalendarOff, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Layers,
  UserPlus
} from 'lucide-react';
import { 
  calculateEmployeeStats, 
  getCompanyDailyOverview, 
  getCompanyRecentTrend 
} from '../utils/attendanceCalculations';
import { sounds } from '../utils/sound';

export default function DashboardView({ 
  employees, 
  attendance, 
  config, 
  onNavigate, 
  onSelectEmployee 
}) {
  const [chartMetric, setChartMetric] = useState('split'); // 'split' | 'rate'
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOverview = getCompanyDailyOverview(todayStr, employees, attendance);
  const trendData = getCompanyRecentTrend(attendance, employees, 7);

  // Compute overall stats for all employees
  const employeeStatsList = employees.map((emp) => ({
    ...emp,
    stats: calculateEmployeeStats(emp.id, attendance, emp.salaryMonthly || 100000, 22),
  }));

  // Total gross payroll estimated for the workforce
  const totalGrossPayroll = employeeStatsList.reduce((acc, curr) => acc + curr.stats.netEstimatedSalary, 0);

  // Today's records
  const dayRecords = attendance[todayStr] || {};
  const lateToday = employees.filter((emp) => dayRecords[emp.id]?.status === 'late');
  const onLeaveToday = employees.filter((emp) => dayRecords[emp.id]?.status === 'leave');
  const wfhToday = employees.filter((emp) => dayRecords[emp.id]?.status === 'wfh');
  const absentToday = employees.filter((emp) => dayRecords[emp.id]?.status === 'absent');

  // Department Breakdown
  const deptMap = {};
  employees.forEach((emp) => {
    const dept = emp.department || 'General';
    if (!deptMap[dept]) {
      deptMap[dept] = { total: 0, presentToday: 0 };
    }
    deptMap[dept].total += 1;
    const st = dayRecords[emp.id]?.status;
    if (st === 'present' || st === 'wfh' || st === 'late') {
      deptMap[dept].presentToday += 1;
    }
  });

  const departmentList = Object.entries(deptMap).map(([dept, val]) => ({
    name: dept,
    total: val.total,
    present: val.presentToday,
    rate: Number(((val.presentToday / val.total) * 100).toFixed(0)),
  }));

  // Shift Breakdown
  const shiftCounts = {
    General: employees.filter(e => (e.shiftType || 'General') === 'General').length,
    Morning: employees.filter(e => e.shiftType === 'Morning').length,
    Night: employees.filter(e => e.shiftType === 'Night').length,
    Flexible: employees.filter(e => e.shiftType === 'Flexible').length,
  };

  return (
    <div className="space-y-6">
      
      {/* Executive Command Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Executive HR Operations
            </span>
            <span className="text-xs text-slate-400">
              Fiscal Cycle Q3 • September 2026
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {config.companyName || 'SK ENTERPRISES'}
          </h1>
          <p className="text-xs text-blue-200/90 font-medium max-w-xl">
            {config.companyAddress || '303, Panchsheel chs ltd, plot no 07, sec -02, taloja phase -01, navi mumbai -410208'}
          </p>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Enterprise attendance intelligence, real-time desk occupancy analytics, biometric punch logs, and automated payroll payable days ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <button
            onClick={() => {
              sounds.playSuccess();
              onNavigate('employees');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Employee</span>
          </button>

          <button
            onClick={() => {
              sounds.playSuccess();
              onNavigate('mark');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-blue-600/30 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Daily Attendance</span>
          </button>

          <button
            onClick={() => {
              sounds.playSuccess();
              onNavigate('kiosk');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs sm:text-sm border border-slate-700 transition-all active:scale-95"
          >
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Biometric Kiosk</span>
          </button>
        </div>
      </div>

      {/* 5-Column High-Density Executive KPI Cards */}
      {employees.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
            <Users className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              No Employees Registered Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              All demo records have been cleared. Your corporate attendance system is fresh and ready for your real team.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => onNavigate('employees')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-95 flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Onboard First Employee</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* In-Office */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              In-Office Desk
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {todayOverview.inOffice}
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              / {employees.length} staff
            </span>
          </div>
          <div className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>{employees.length > 0 ? Math.round((todayOverview.inOffice / employees.length) * 100) : 0}% Desk Occupancy</span>
          </div>
        </div>

        {/* WFH (Remote) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Remote (WFH)
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {todayOverview.wfh}
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              online
            </span>
          </div>
          <div className="mt-2 text-[10px] font-bold text-indigo-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span>Approved Telework</span>
          </div>
        </div>

        {/* Late Check-ins */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Late Arrivals
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {todayOverview.late}
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              staff
            </span>
          </div>
          <div className="mt-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 truncate">
            {todayOverview.late > 0 ? "Exceeded 15m Grace" : "100% Punctual Today"}
          </div>
        </div>

        {/* On Leave Today */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-blue-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              On Leave / LWP
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <CalendarOff className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {todayOverview.onLeave}
            </span>
            {todayOverview.absent > 0 && (
              <span className="text-[11px] font-black text-rose-500">
                (+{todayOverview.absent} LWP)
              </span>
            )}
          </div>
          <div className="mt-2 text-[10px] font-bold text-purple-500 truncate">
            Approved Time-Off
          </div>
        </div>

        {/* Monthly Payroll Estimate */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm col-span-2 lg:col-span-1 hover:border-blue-400/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Est. Monthly Payroll
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              ₹{(totalGrossPayroll / 100000).toFixed(2)}L
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-bold">
            <span className="text-slate-400">Rate:</span>
            <span className="text-emerald-600 dark:text-emerald-400">{todayOverview.attendancePercentage}% Active</span>
          </div>
        </div>

      </div>
      )}

      {/* Main Grid: Weekly Trend Analytics & Priority Exceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Enterprise Visual Attendance Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Workforce Attendance & Occupancy Trend</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audited daily presence ratio across physical office and remote locations
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setChartMetric('split')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    chartMetric === 'split' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Presence Split
                </button>
                <button
                  onClick={() => setChartMetric('rate')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    chartMetric === 'rate' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Attendance Rate %
                </button>
              </div>
            </div>
          </div>

          {/* SVG & Bar Chart */}
          <div className="mt-4">
            <div className="h-56 flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-slate-100 dark:border-slate-800">
              {trendData.map((d) => {
                const totalWorking = d.inOffice + d.wfh;
                const officePercent = employees.length > 0 ? (d.inOffice / employees.length) * 100 : 0;
                const wfhPercent = employees.length > 0 ? (d.wfh / employees.length) * 100 : 0;

                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    {/* Tooltip on Hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-bold py-1.5 px-3 rounded-xl shadow-xl pointer-events-none whitespace-nowrap">
                      {d.displayDate}: {totalWorking}/{employees.length} ({d.inOffice} Office, {d.wfh} Remote)
                    </div>

                    <div className="w-full max-w-[42px] flex flex-col items-center">
                      <span className="text-[10px] font-black mb-1.5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600">
                        {d.rate}%
                      </span>
                      
                      {chartMetric === 'split' ? (
                        <div className="w-full flex flex-col rounded-t-xl overflow-hidden shadow-sm">
                          <div 
                            className="w-full bg-indigo-500/80 transition-all duration-300"
                            style={{ height: `${wfhPercent * 1.15}px` }}
                          ></div>
                          <div 
                            className="w-full bg-blue-600 transition-all duration-300"
                            style={{ height: `${officePercent * 1.15}px` }}
                          ></div>
                        </div>
                      ) : (
                        <div 
                          className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-indigo-500 transition-all duration-300"
                          style={{ height: `${Math.max(15, d.rate * 1.3)}px` }}
                        ></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Dates */}
            <div className="flex gap-3 sm:gap-6 px-2 mt-2">
              {trendData.map((d) => (
                <div key={d.date} className="flex-1 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate block">
                    {d.displayDate}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Department Presence Metrics */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Department Presence Today
              </h3>
              <span className="text-[11px] text-slate-400 font-semibold">Active Capacity</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {departmentList.map((dept) => (
                <div key={dept.name} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                    {dept.name}
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {dept.present}/{dept.total}
                    </span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {dept.rate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mt-2 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${dept.rate}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Priority Action & Exceptions Radar */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Exceptions & Time-Off
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Staff requiring manager review
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {lateToday.length + onLeaveToday.length} today
              </span>
            </div>

            <div className="space-y-3 mt-4 max-h-[380px] overflow-y-auto pr-1">
              {/* Late Employees */}
              {lateToday.map((emp) => {
                const rec = dayRecords[emp.id];
                return (
                  <div
                    key={emp.id}
                    onClick={() => onSelectEmployee(emp)}
                    className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={emp.avatar} 
                        alt={emp.name} 
                        className="w-10 h-10 rounded-2xl object-cover border border-amber-300"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {emp.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {emp.id} • {emp.department}
                        </p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                          Clocked: {rec?.clockIn} ({rec?.note || 'Delay'})
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-200/70 text-amber-900 dark:bg-amber-900 dark:text-amber-200 uppercase">
                      Late
                    </span>
                  </div>
                );
              })}

              {/* On Leave Employees */}
              {onLeaveToday.map((emp) => {
                const rec = dayRecords[emp.id];
                return (
                  <div
                    key={emp.id}
                    onClick={() => onSelectEmployee(emp)}
                    className="p-3.5 rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={emp.avatar} 
                        alt={emp.name} 
                        className="w-10 h-10 rounded-2xl object-cover border border-purple-300"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {emp.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {emp.id} • {emp.department}
                        </p>
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold mt-0.5">
                          {rec?.note || 'Approved Leave'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-purple-200/70 text-purple-900 dark:bg-purple-900 dark:text-purple-200 uppercase">
                      Leave
                    </span>
                  </div>
                );
              })}

              {lateToday.length === 0 && onLeaveToday.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Optimal Punctuality</p>
                  <p className="mt-1">All employees are operating on-schedule without flagged anomalies.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              onClick={() => {
                sounds.playSuccess();
                onNavigate('leaves');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <span>Manage Pending Leave Applications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
