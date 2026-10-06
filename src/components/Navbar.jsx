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
  Globe,
  KeyRound,
  Smartphone,
  Download,
  X,
  Contact,
  Menu
} from 'lucide-react';
import { sounds } from '../utils/sound';

const EMPTY_NOTIFICATIONS = [];

export default function Navbar({ 
  config, 
  setConfig,
  theme, 
  setTheme, 
  notifications = EMPTY_NOTIFICATIONS,
  onOpenSearch,
  currentUser,
  onLogout,
  onOpenUserAccess,
  onNavigate,
  onToggleMobileMenu,
  syncStatus = 'synced'
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifList, setNotifList] = useState(notifications);
  const notifRef = useRef(null);

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const employee = currentUser?.employee || currentUser?.user || null;

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

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsAppInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    sounds.playSuccess();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsAppInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setIsInstallModalOpen(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b transition-colors duration-200 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="w-full px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          
          {/* Left: Brand Identity & Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Hamburger Drawer Toggle Button */}
            {(isAdmin || isManager) && onToggleMobileMenu && (
              <button
                onClick={() => {
                  sounds.playSuccess();
                  onToggleMobileMenu();
                }}
                className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer shrink-0"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-blue-500/25 ring-2 ring-white/10 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                  StaffPulse <span className="text-blue-600 dark:text-blue-400 font-extrabold">PRO</span>
                </span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold border shrink-0 ${
                  isAdmin 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                    : isManager
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                }`}>
                  {isAdmin ? 'ADMIN' : isManager ? 'MANAGER' : 'PORTAL'}
                </span>
              </div>
              <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[140px] sm:max-w-xs">
                {config.companyName}
              </p>
            </div>
          </div>

          {/* Center: Quick Search Shortcut Bar (Cmd+K) */}
          {(isAdmin || isManager) && (
            <div className="hidden lg:flex flex-1 max-w-xs mx-2">
              <button
                onClick={onOpenSearch}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-xl bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/80 transition-all group shrink-0"
              >
                <div className="flex items-center gap-2 truncate">
                  <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0" />
                  <span className="truncate">Search staff, depts...</span>
                </div>
                <kbd className="px-1.5 py-0.5 text-[9.5px] font-mono font-bold bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 shadow-2xs shrink-0 ml-1">
                  Ctrl K
                </kbd>
              </button>
            </div>
          )}

          {/* Right Action Controls: Grouped into Status, Tools & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
            
            {/* Live Clock & Shift Badge */}
            <div className="hidden md:inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/70 px-2.5 py-1 rounded-full border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-blue-500 animate-pulse shrink-0" />
              <span className="font-mono">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Live</span>
            </div>

            {/* Live Cloud Database Sync Status - Strictly 1-line badge */}
            <div 
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-colors shrink-0 whitespace-nowrap ${
                syncStatus === 'synced'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                  : syncStatus === 'syncing'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
              }`} 
              title={syncStatus === 'synced' ? "Render Server Active • Keep-Alive Auto-Sync Enabled" : syncStatus === 'syncing' ? "Waking Up Render Server..." : "Using Local Offline Storage"}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                syncStatus === 'synced' ? 'bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700' :
                syncStatus === 'syncing' ? 'bg-blue-500 animate-spin' :
                'bg-amber-500'
              }`}></span>
              <span className="whitespace-nowrap font-medium text-[11px]">
                {syncStatus === 'synced' ? 'Cloud Synced' : syncStatus === 'syncing' ? 'Waking Server...' : 'Local Cache'}
              </span>
            </div>

            {/* Quick Tool 1: PWA Mobile / Desktop App Install Button */}
            {!isAppInstalled && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95 shrink-0 cursor-pointer"
                title="Install StaffPulse HRMS App on Phone or PC"
              >
                <Smartphone className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xl:inline">Install App</span>
              </button>
            )}

            {/* Quick Tool 2: ID Cards Studio Quick Access Button */}
            {onNavigate && (isAdmin || isManager) && (
              <button
                onClick={() => {
                  sounds.playSuccess();
                  onNavigate('idcards');
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/60 text-xs font-bold transition active:scale-95 shrink-0 cursor-pointer"
                title="Open Employee ID Card Studio & A4 Bulk Printing"
              >
                <Contact className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden xl:inline">ID Cards</span>
              </button>
            )}

            {/* Quick Tool 3: Admin User Access & PINs Manager Button */}
            {isAdmin && onOpenUserAccess && (
              <button
                onClick={onOpenUserAccess}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/60 text-xs font-bold transition active:scale-95 shrink-0"
                title="Manage Employee Roles, Access & Login PINs"
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden 2xl:inline">User PINs</span>
              </button>
            )}

            {/* Notifications Popover - Admin Only */}
            {isAdmin && (
              <div className="relative shrink-0" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-all shrink-0"
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
              className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 transition-colors shrink-0"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Clean Vertical Divider */}
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0"></div>

            {/* User Profile Info & Switch/Logout */}
            <div className="flex items-center gap-2 shrink-0">
              {isAdmin ? (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-xs border border-amber-400/50 shadow-xs shrink-0">
                    👑
                  </div>
                  <div className="hidden 2xl:block text-left text-xs shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white block leading-tight truncate max-w-[130px]">
                      {config?.companyName || 'Admin'}
                    </span>
                    <span className="text-[10px] text-amber-500 font-extrabold uppercase">HR Admin</span>
                  </div>
                </div>
              ) : employee ? (
                <div className="flex items-center gap-2 shrink-0">
                  <img
                    src={employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=3b82f6&color=fff`}
                    alt={employee.name}
                    className="w-8 h-8 rounded-xl object-cover border-2 border-emerald-500/40 shrink-0"
                  />
                  <div className="hidden 2xl:block text-left text-xs shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white block leading-tight truncate max-w-[130px]">{employee.name}</span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {isManager ? '👔 Supervisor' : '👤 Staff'}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Logout / Switch Role button */}
              {onLogout && (
                <button
                  onClick={() => {
                    sounds.playSuccess();
                    onLogout();
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:text-slate-300 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition-all flex items-center gap-1.5 shrink-0"
                  title="Switch Role or Log Out"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* PWA Installation Instructions Modal */}
      {isInstallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Install HRMS App</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add to your Phone, Tablet or PC Home Screen</p>
                </div>
              </div>
              <button
                onClick={() => setIsInstallModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80">
                <p className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <span>📱</span> Android Phone (Google Chrome)
                </p>
                <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  1. Tap the <strong>three dots (⋮)</strong> at top right corner.<br />
                  2. Select <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80">
                <p className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                  <span>🍎</span> Apple iPhone / iPad (Safari)
                </p>
                <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  1. Tap the <strong>Share button (⬆)</strong> at the bottom of Safari.<br />
                  2. Scroll down and tap <strong>"Add to Home Screen"</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80">
                <p className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <span>💻</span> Windows PC / Mac (Chrome or Edge)
                </p>
                <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Click the <strong>Install App icon (⊕ or ⬇)</strong> on the right side of the browser URL bar.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsInstallModalOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Got It, Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
