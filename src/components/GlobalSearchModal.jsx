import React, { useState, useEffect } from 'react';
import { Search, X, Users, CheckSquare, Clock, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { sounds } from '../utils/sound';

export default function GlobalSearchModal({ 
  isOpen, 
  onClose, 
  employees, 
  onSelectEmployee, 
  onNavigate 
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        onClose(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(query.toLowerCase()) ||
    e.id.toLowerCase().includes(query.toLowerCase()) ||
    e.department.toLowerCase().includes(query.toLowerCase()) ||
    e.role.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const quickNav = [
    { label: "Daily Attendance Sheet", tab: "mark", icon: CheckSquare },
    { label: "Biometric Punch Kiosk", tab: "kiosk", icon: Clock },
    { label: "Payroll & Salary Register", tab: "reports", icon: FileSpreadsheet },
    { label: "Leave Requests & Approvals", tab: "leaves", icon: Users },
  ];

  return (
    <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scale-up">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-500" />
          <input
            type="text"
            autoFocus
            placeholder="Type employee name, department, or jump to section..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-semibold text-slate-900 dark:text-white outline-none placeholder-slate-400"
          />
          <button
            onClick={() => onClose(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 text-xs font-mono"
          >
            ESC
          </button>
        </div>

        {/* Results */}
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {/* Quick Actions */}
          {!query && (
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 px-2 block">Quick Navigation</span>
              {quickNav.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.tab}
                    onClick={() => {
                      sounds.playSuccess();
                      onNavigate(item.tab);
                      onClose(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-blue-500" />
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Employees */}
          {filteredEmployees.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 px-2 block">Employees</span>
              {filteredEmployees.map(emp => (
                <div
                  key={emp.id}
                  onClick={() => {
                    sounds.playSuccess();
                    onSelectEmployee(emp);
                    onClose(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full object-cover" />
                    <div className="text-left">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">{emp.name}</span>
                      <span className="text-[11px] text-slate-400">{emp.id} • {emp.department}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">View Dossier →</span>
                </div>
              ))}
            </div>
          )}

          {query && filteredEmployees.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching employee records found for "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
