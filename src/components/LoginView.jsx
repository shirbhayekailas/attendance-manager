import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  UserCheck, 
  Briefcase,
  Clock,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  Sun,
  Moon,
  Sparkles,
  Phone
} from 'lucide-react';
import { sounds } from '../utils/sound';
import { loginOnServer } from '../utils/apiClient';

export default function LoginView({ 
  employees = [], 
  adminCreds = { id: 'admin', email: 'admin@company.com', password: '1234' },
  onLoginSuccess,
  config = {},
  logoutNotice = null,
  onClearLogoutNotice,
  theme = 'dark',
  setTheme,
  currentOrgId = 'sk_enterprises',
  onSelectOrgId
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoleTab, setSelectedRoleTab] = useState('all'); // 'all' | 'admin' | 'manager' | 'employee'
  const [orgCode, setOrgCode] = useState(() => {
    return localStorage.getItem('staffpulse_org_id_v4') || 'sk_enterprises';
  });
  const [isOrgCustomOpen, setIsOrgCustomOpen] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    if (onClearLogoutNotice) onClearLogoutNotice();

    const idClean = identifier.trim();
    const passClean = password.trim();

    if (!idClean) {
      setErrorMessage('Kripya apna Work Email, Employee ID, ya Phone Number darj karein.');
      sounds.playWarning();
      return;
    }

    if (!passClean) {
      setErrorMessage('Kripya apna Password ya 4-digit PIN darj karein.');
      sounds.playWarning();
      return;
    }

    setIsSubmitting(true);

    // Save active orgId
    const activeOrg = orgCode.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'sk_enterprises';
    try {
      localStorage.setItem('staffpulse_org_id_v4', activeOrg);
      if (onSelectOrgId) onSelectOrgId(activeOrg);
    } catch (err) {}

    // 1. Try Cloud Server Auth First (Instant Live Sync)
    try {
      const serverRes = await loginOnServer({
        identifier: idClean,
        password: passClean,
        orgId: activeOrg
      });

      if (serverRes && serverRes.success) {
        sounds.playSuccess();
        onLoginSuccess({
          role: serverRes.role,
          user: serverRes.user,
          employee: serverRes.role !== 'admin' ? serverRes.user : null,
          orgId: serverRes.orgId || activeOrg,
          companyName: serverRes.companyName || config?.companyName || "SK ENTERPRISES"
        });
        return;
      } else if (serverRes && serverRes.message) {
        // If server explicitly returned 401/404, check local fallback
      }
    } catch (netErr) {
      console.warn("Server auth check skipped to local fallback:", netErr);
    }

    // 2. Local Fallback Authentication
    const idLower = idClean.toLowerCase();

    // A. HR Administrator
    const validAdminPass = adminCreds.password || '1234';
    const isAdminId = (
      idLower === 'admin' ||
      idLower === (adminCreds.id || '').toLowerCase() ||
      idLower === (adminCreds.email || '').toLowerCase() ||
      idLower === 'hr' ||
      idLower === 'owner'
    );

    if (isAdminId) {
      if (passClean === validAdminPass) {
        sounds.playSuccess();
        onLoginSuccess({
          role: 'admin',
          user: {
            id: 'admin',
            name: `${config?.companyName || "SK ENTERPRISES"} Owner / Admin`,
            role: 'Company Administrator',
            accessLevel: 'admin',
            email: adminCreds.email || 'admin@company.com'
          },
          orgId: activeOrg
        });
        setIsSubmitting(false);
        return;
      } else {
        sounds.playWarning();
        setErrorMessage('Galat Admin Password darj kiya gaya hai.');
        setIsSubmitting(false);
        return;
      }
    }

    // B. Employee / Supervisor Check
    const cleanPhone = idLower.replace(/[^0-9]/g, '');
    const matchedUser = employees.find(e => 
      e.id?.toLowerCase() === idLower ||
      e.email?.toLowerCase() === idLower ||
      e.loginId?.toLowerCase() === idLower ||
      e.name?.toLowerCase() === idLower ||
      (cleanPhone && String(e.phone || '').replace(/[^0-9]/g, '') === cleanPhone)
    );

    if (matchedUser) {
      const validUserPass = String(matchedUser.password || matchedUser.pin || '1234');
      if (passClean === validUserPass) {
        sounds.playSuccess();
        const userAccess = matchedUser.accessLevel || 'employee'; // 'employee' | 'manager'
        onLoginSuccess({ 
          role: userAccess, 
          user: matchedUser,
          employee: matchedUser,
          orgId: activeOrg
        });
        setIsSubmitting(false);
        return;
      } else {
        sounds.playWarning();
        setErrorMessage(`Galat password/PIN darj kiya gaya hai.`);
        setIsSubmitting(false);
        return;
      }
    }

    // 3. User Not Found
    sounds.playWarning();
    setIsSubmitting(false);
    setErrorMessage('User ID nahi mila. Kripya apna ID/Phone check karein ya HR Admin se sampark karein.');
  };

  // Quick Demo Shortcut Fillers
  const fillDemo = (idVal, passVal, roleTab) => {
    setIdentifier(idVal);
    setPassword(passVal);
    setSelectedRoleTab(roleTab);
    setErrorMessage('');
    if (onClearLogoutNotice) onClearLogoutNotice();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Controls: Dark/Light Mode */}
      {setTheme && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white shadow-lg transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      )}

      <div className="w-full max-w-md relative z-10 space-y-5">
        
        {/* Company Identity Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-800 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/25 ring-4 ring-white/10">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {config?.companyName || 'SK ENTERPRISES'}
            </h1>
            <p className="text-[11px] text-blue-300/80 font-medium">
              Enterprise Attendance & Payroll Control Portal
            </p>
            <p className="text-[10px] text-slate-500 truncate max-w-xs mx-auto mt-0.5">
              {config?.companyAddress || '303, Panchsheel chs ltd, taloja phase -01, navi mumbai -410208'}
            </p>
          </div>
        </div>

        {/* SECURITY & LOGOUT ALERT BANNERS */}
        {logoutNotice === 'inactivity' && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs sm:text-sm flex items-start gap-3 shadow-lg animate-in fade-in duration-200">
            <Clock className="w-5 h-5 shrink-0 text-amber-400 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <strong className="block text-amber-200 font-extrabold text-xs sm:text-sm">
                Screen Inactivity Auto-Logout
              </strong>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                Aapki screen 10 minute se idle thi. Security aur privacy ke liye aapka session automatically logout kar diya gaya hai. Kripya dobara login karein.
              </p>
            </div>
          </div>
        )}

        {logoutNotice === 'manual' && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 shadow-lg animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-semibold">Aap successfully logout ho chuke hain. Session safely terminated.</span>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
          
          {/* Card Title & Role Pills */}
          <div className="space-y-3">
            <div className="text-center">
              <h2 className="text-base font-bold text-white">Sign In to Your Workspace</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Role-based access ke liye apna login ID aur PIN darj karein.
              </p>
            </div>

            {/* Role Filter Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setSelectedRoleTab('all')}
                className={`py-1.5 rounded-xl transition ${
                  selectedRoleTab === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Universal
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin', '1234', 'admin')}
                className={`py-1.5 rounded-xl transition flex items-center justify-center gap-1 ${
                  selectedRoleTab === 'admin'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👑 Owner
              </button>
              <button
                type="button"
                onClick={() => fillDemo('EMP-102', '1234', 'manager')}
                className={`py-1.5 rounded-xl transition flex items-center justify-center gap-1 ${
                  selectedRoleTab === 'manager'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👔 Supervisor
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Input 1: User Identifier */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Login ID / Employee ID / Phone</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="e.g. admin or EMP-101 or 9876543210"
                className="w-full p-3.5 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
            </div>

            {/* Input 2: Password / PIN with Eye Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Password / 4-Digit PIN</span>
                </div>
                <span className="text-[10px] text-slate-500 font-normal">Default PIN: 1234</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Enter your assigned password or PIN"
                  className="w-full p-3.5 pr-11 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Company / Workspace Code Selector (Multi-Tenant Isolation) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsOrgCustomOpen(!isOrgCustomOpen)}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
              >
                <span>Company Workspace Code:</span>
                <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono font-bold uppercase">
                  {orgCode}
                </span>
                <span className="text-[10px] text-slate-500">(Change)</span>
              </button>

              {isOrgCustomOpen && (
                <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    Independent Organization Workspace Code (Zero data cross-visibility):
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={orgCode}
                      onChange={(e) => setOrgCode(e.target.value)}
                      placeholder="e.g. sk_enterprises"
                      className="flex-1 p-2 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setOrgCode('sk_enterprises')}
                      className="px-2.5 py-2 text-[10px] font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      SK-ENT
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Verifying Credentials...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Testing Credentials */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block text-center">
              Quick 1-Click Access for Testing:
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => fillDemo('admin', '1234', 'admin')}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-amber-300 font-bold transition text-center"
              >
                👑 Admin <br />
                <span className="text-slate-400 font-mono font-normal">admin / 1234</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('EMP-102', '1234', 'manager')}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-indigo-300 font-bold transition text-center"
              >
                👔 Supervisor <br />
                <span className="text-slate-400 font-mono font-normal">EMP-102 / 1234</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('EMP-101', '1234', 'employee')}
                className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-emerald-300 font-bold transition text-center"
              >
                👤 Employee <br />
                <span className="text-slate-400 font-mono font-normal">EMP-101 / 1234</span>
              </button>
            </div>
          </div>

        </div>

        {/* Security badge footer */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Multi-Tenant Isolation • 10-Min Inactivity Auto-Logout Protected</span>
        </div>

      </div>

    </div>
  );
}
