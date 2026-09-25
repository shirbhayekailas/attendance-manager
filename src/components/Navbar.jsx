import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Sun, 
  Moon, 
  Clock, 
  RotateCcw,
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ChevronDown,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { sounds } from '../utils/sound';

const EMPTY_NOTIFICATIONS = [];

export default function Navbar({ 
  config, 
  setConfig,
  theme, 
  setTheme, 
  onResetDemo,
  notifications = EMPTY_NOTIFICATIONS,
  onOpenSearch,
  currentUser,
  onLogout,
  syncStatus = 'synced'
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState(notifications);
  const notifRef = useRef(null);

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const employee = currentUser?.employee || null;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (notifications) {
      setNotifList(notifications);
    }
  }, [notifications]);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    sounds.playSuccess();
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const unreadCount = notifList.filter(n => n.unread).length;

  const markAllRead = () => {
    sounds.playSuccess();
    setNotifList(notifList.map(n => ({ ...n, unread: false })));
  };

  return (
    <header className="sticky top-0 z-40 border-b transition-colors duration-200 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Company Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-2 ring-white/10">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
                  StaffPulse <span className="text-blue-600 dark:text-blue-400 font-extrabold">PRO</span>
                </span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-extrabold border ${
                  isAdmin 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                    : isManager
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                }`}>
                  {isAdmin ? 'ADMIN CONSOLE' : isManager ? 'MANAGER PORTAL' : 'EMPLOYEE PORTAL'}
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[180px] sm:max-w-xs">
                {config.companyName}
              </p>
            </div>
          </div>

          {/* Quick Search Shortcut Bar (Cmd+K style) - Admin/Manager */}
          {(isAdmin || isManager) && (
            <div className="hidden lg:flex flex-1 max-w-sm mx-4">
              <button
                onClick={onOpenSearch}
                className="w-full flex items-center justify-between px-3.5 py-2 text-xs rounded-xl bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/80 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                  <span>Search employee, department, shift...</span>
                </div>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 shadow-2xs">
                  Ctrl K
                </kbd>
              </button>
            </div>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            
            {/* Live Cloud Database Sync Status */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              syncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                : syncStatus === 'syncing'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
            }`} title="Multi-device database status on Render server">
              <span className={`w-2 h-2 rounded-full ${
                syncStatus === 'synced' ? 'bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700' :
                syncStatus === 'syncing' ? 'bg-blue-500 animate-spin' :
                'bg-amber-500'
              }`}></span>
              <span>{syncStatus === 'synced' ? 'Cloud Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Local Cache'}</span>
            </div>

            {/* Live Clock & Shift Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/70 px-3 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Live</span>
            </div>

            {/* Notifications Popover - Admin Only */}
            {isAdmin && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:border-slate-700 transition-all"
                  title="Notifications & Alerts"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3 z-50 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                          Operational Alerts
                        </span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                      {notifList.map((n) => (
                        <div key={n.id} className="pt-2 flex items-start gap-2.5 text-xs">
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            n.type === 'leave' ? 'bg-purple-100 text-purple-600 dark:bg-purple-950' :
                            n.type === 'alert' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950' :
                            'bg-blue-100 text-blue-600 dark:bg-blue-950'
                          }`}>
                            {n.type === 'leave' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                             n.type === 'alert' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                             <FileSpreadsheet className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-900 dark:text-white leading-snug">{n.title}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{n.desc}</p>
                            <span className="text-[10px] text-slate-400 block mt-1">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* User Profile Info & Switch/Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              {isAdmin ? (
                <>
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                    alt="Sarah Jenkins HR"
                    className="w-8 h-8 rounded-full object-cover border-2 border-blue-500/40"
                  />
                  <div className="hidden xl:block text-left text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block leading-tight">Sarah Jenkins</span>
                    <span className="text-[10px] text-blue-500 font-semibold">HR Administrator</span>
                  </div>
                </>
              ) : employee ? (
                <>
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500/40"
                  />
                  <div className="hidden xl:block text-left text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block leading-tight">{employee.name}</span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {isManager ? '💼 Manager' : '👤 Employee'} • {employee.department}
                    </span>
                  </div>
                </>
              ) : null}

              {/* Logout / Switch Role button */}
              {onLogout && (
                <button
                  onClick={() => {
                    sounds.playSuccess();
                    onLogout();
                  }}
                  className="ml-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:text-slate-300 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition-all flex items-center gap-1.5"
                  title="Switch Role or Log Out"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
