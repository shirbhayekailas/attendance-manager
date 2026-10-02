import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  Clock, 
  FileSpreadsheet, 
  Settings,
  CalendarDays,
  ShieldCheck,
  Building2,
  FileCheck2,
  SlidersHorizontal,
  Calendar,
  Award,
  Contact,
  X
} from 'lucide-react';
import { sounds } from '../utils/sound';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  config = {}, 
  pendingLeavesCount = 0,
  todayLateCount = 0,
  role = 'admin',
  isMobileMenuOpen = false,
  setIsMobileMenuOpen = () => {}
}) {
  const isManager = role === 'manager';

  const navSections = [
    {
      title: "TIME & ATTENDANCE",
      items: [
        {
          id: 'dashboard',
          label: isManager ? 'Team Attendance Overview' : 'Executive HR Dashboard',
          icon: LayoutDashboard,
          badge: null,
        },
        {
          id: 'mark',
          label: 'Daily Attendance Roster',
          icon: CheckSquare,
          badge: 'Today',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        },
        {
          id: 'monthly',
          label: 'Monthly Muster Roll',
          icon: CalendarDays,
          badge: '30-Day',
          badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
        },
        {
          id: 'kiosk',
          label: 'Biometric Punch Terminal',
          icon: Clock,
          badge: 'Kiosk',
          badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
        },
        {
          id: 'holidays',
          label: 'Holidays & Shift Master',
          icon: Calendar,
          badge: '2026-27',
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
        },
      ]
    },
    {
      title: "WORKFORCE & PAYROLL",
      items: [
        {
          id: 'employees',
          label: isManager ? 'Team Directory & Staff' : 'Staff & Employees Directory',
          icon: Users,
          badge: null,
        },
        {
          id: 'idcards',
          label: 'Employee ID Cards & QR',
          icon: Contact,
          badge: 'NEW 🪪',
          badgeColor: 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40 font-black',
        },
        {
          id: 'leaves',
          label: 'Leaves & Regularization',
          icon: CalendarDays,
          badge: pendingLeavesCount > 0 ? `${pendingLeavesCount} Pending` : null,
          badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold',
        },
        {
          id: 'reports',
          label: 'Payroll & Timesheet Ledger',
          icon: FileSpreadsheet,
          badge: null,
        },
        {
          id: 'performance',
          label: 'Performance & Appraisals',
          icon: Award,
          badge: 'KRA',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        },
      ]
    },
    {
      title: "HR OPERATIONS & SERVICES",
      items: [
        {
          id: 'letters',
          label: 'HR Letters & Doc Studio',
          icon: FileCheck2,
          badge: '1-Click',
          badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
        },
        {
          id: 'assets',
          label: 'Company Assets & IT Custody',
          icon: Building2,
          badge: null,
        },
        {
          id: 'helpdesk',
          label: 'HR Helpdesk & Grievances',
          icon: SlidersHorizontal,
          badge: null,
        },
        {
          id: 'orgchart',
          label: 'Organization Hierarchy',
          icon: Users,
          badge: null,
        },
      ]
    },
    ...(!isManager ? [{
      title: "GOVERNANCE & SYSTEM",
      items: [
        {
          id: 'audit',
          label: 'Compliance Audit Trail',
          icon: ShieldCheck,
          badge: 'SOC2',
          badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[9px]',
        },
        {
          id: 'settings',
          label: 'Security & System Policies',
          icon: Settings,
          badge: null,
        },
      ]
    }] : [])
  ];

  const handleTabClick = (id) => {
    sounds.playSuccess();
    setCurrentTab(id);
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const renderNavList = () => (
    <div className="space-y-6">
      {navSections.map((section, idx) => (
        <div key={idx} className="space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {section.title}
          </div>

          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-semibold text-xs sm:text-sm transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  const renderPolicyWidget = () => (
    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800/60 dark:to-blue-950/30 rounded-2xl p-3.5 border border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 shrink-0">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Punctuality Standard
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Shift: {config.shiftStart || '09:30 AM'} • {config.graceMinutes || 15}m Grace.
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400">
              <span>Payable Base: 22 Days</span>
              <span>ISO 27001</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Navigation Rail */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex-col justify-between py-5 px-3 shrink-0">
        {renderNavList()}
        {renderPolicyWidget()}
      </aside>

      {/* Mobile Slide-Over Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
          {/* Backdrop Blur Overlay */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Menu Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 sm:w-80 max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between py-4 px-3 overflow-y-auto z-10 border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200">
            <div>
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 px-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                    SP
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                      Navigation Menu
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[150px]">
                      {config.companyName || 'SK ENTERPRISES'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              {renderNavList()}
            </div>

            {/* Drawer Footer Widget */}
            {renderPolicyWidget()}
          </aside>
        </div>
      )}
    </>
  );
}
