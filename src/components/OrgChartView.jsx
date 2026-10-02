import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Crown, 
  Briefcase, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  DollarSign, 
  IndianRupee 
} from 'lucide-react';

export default function OrgChartView({ employees = [], config, onSelectEmployee }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  const companyName = config?.companyName || 'SK ENTERPRISES';
  const departments = ['All', ...new Set(employees.map(e => e.department).filter(Boolean))];

  // Group employees by department
  const deptGroups = {};
  employees.forEach(emp => {
    const dept = emp.department || 'General Operations';
    if (!deptGroups[dept]) {
      deptGroups[dept] = [];
    }
    deptGroups[dept].push(emp);
  });

  const totalHeadcount = employees.length;
  const totalMonthlyPayroll = employees.reduce((sum, e) => sum + (Number(e.salaryMonthly) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Organization Structure &amp; Department Hierarchy
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual organizational chart, leadership hierarchy, and department headcount analytics for {companyName}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300">
            Total Workforce: <strong className="font-black text-slate-900 dark:text-white">{totalHeadcount} Staff</strong>
          </div>
        </div>
      </div>

      {/* Top Executive Leadership Level Card */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-blue-900/50 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Apex Leadership
                </span>
                <span className="text-xs text-slate-400">Board &amp; Executive Office</span>
              </div>
              <h2 className="text-xl font-black text-white mt-1">
                Managing Director &amp; Executive Board
              </h2>
              <p className="text-xs text-slate-300">
                {companyName} • Registered Operations Headquarters
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-right">
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Departments</span>
              <span className="text-lg font-black text-white">{Object.keys(deptGroups).length} Active</span>
            </div>
            <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Monthly Budget</span>
              <span className="text-lg font-black text-emerald-400">₹{(totalMonthlyPayroll / 100000).toFixed(2)}L</span>
            </div>
          </div>
        </div>
      </div>

      {/* Department Filter Ribbon */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search department or staff member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500">Filter Department:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Department Columns & Team Hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(deptGroups)
          .filter(([dept]) => selectedDept === 'All' || dept === selectedDept)
          .map(([dept, team]) => {
            const deptBudget = team.reduce((sum, e) => sum + (Number(e.salaryMonthly) || 0), 0);
            const filteredTeam = team.filter(e => 
              e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
              e.role.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (searchQuery && filteredTeam.length === 0) return null;

            return (
              <div
                key={dept}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between"
              >
                {/* Department Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-500" />
                      <span>{dept}</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {team.length} Members
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Monthly Payroll Allocation: <strong className="text-slate-800 dark:text-slate-200 font-mono">₹{deptBudget.toLocaleString('en-IN')}</strong>
                  </p>
                </div>

                {/* Team Members List */}
                <div className="p-4 space-y-2.5 flex-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredTeam.map((emp, index) => (
                    <div
                      key={emp.id}
                      onClick={() => onSelectEmployee && onSelectEmployee(emp)}
                      className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 p-2 rounded-2xl transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                            <span>{emp.name}</span>
                            {index === 0 && (
                              <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold uppercase">
                                Lead
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span className="font-mono">{emp.id}</span>
                            <span>•</span>
                            <span className="truncate max-w-[140px]">{emp.role}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                          ₹{(Number(emp.salaryMonthly) || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9px] text-slate-400 uppercase">
                          {emp.shiftType || 'General'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Strip */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center font-bold">
                  Reports to {companyName} Executive Operations
                </div>
              </div>
            );
          })}
      </div>

    </div>
  );
}
