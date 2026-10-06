import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Clock,
  Eye,
  EyeOff,
  CheckCircle2,
  Sun,
  Moon
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
  setTheme
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    if (onClearLogoutNotice) onClearLogoutNotice();

    const idClean = identifier.trim();
    const passClean = password.trim();

    if (!idClean) {
      setErrorMessage('Kripya apna Login ID darj karein.');
      sounds.playWarning();
      return;
    }

    if (!passClean) {
      setErrorMessage('Kripya apna Password darj karein.');
      sounds.playWarning();
      return;
    }

    setIsSubmitting(true);
    const activeOrg = 'sk_enterprises';
    const idLower = idClean.toLowerCase();
    const cleanPhone = idLower.replace(/[^0-9]/g, '');

    // 1. FAST LOCAL VERIFICATION FIRST (Instant 0ms login, zero hanging)
    // A. Check if Login ID is Admin / Owner
    const validAdminPass = adminCreds.password || '1234';
    const isAdminId = (
      idLower === 'admin' ||
      idLower === (adminCreds.id || '').toLowerCase() ||
      idLower === (adminCreds.email || '').toLowerCase() ||
      idLower === 'hr' ||
      idLower === 'owner'
    );

    if (isAdminId && passClean === validAdminPass) {
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
    }

    // B. Check if Login ID matches any Employee / Supervisor locally
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
        const userAccess = matchedUser.accessLevel || 'employee';
        onLoginSuccess({ 
          role: userAccess, 
          user: matchedUser,
          employee: matchedUser,
          orgId: activeOrg
        });
        setIsSubmitting(false);
        return;
      }
    }

    // 2. CLOUD SERVER VERIFICATION FALLBACK (For accounts created on other devices)
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
          orgId: activeOrg,
          companyName: serverRes.companyName || config?.companyName || "SK ENTERPRISES"
        });
        setIsSubmitting(false);
        return;
      } else if (serverRes && serverRes.message) {
        sounds.playWarning();
        setErrorMessage(serverRes.message);
        setIsSubmitting(false);
        return;
      }
    } catch (netErr) {
      console.warn("Server auth check fallback:", netErr);
    }

    // 3. If matched locally but password was wrong
    if (isAdminId || matchedUser) {
      sounds.playWarning();
      setErrorMessage('Galat Password / PIN darj kiya gaya hai.');
      setIsSubmitting(false);
      return;
    }

    // 4. Login ID not recognized
    sounds.playWarning();
    setIsSubmitting(false);
    setErrorMessage('Login ID nahi mila. Kripya apna Login ID ya Employee ID check karein.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Theme Toggle */}
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
              Corporate Attendance & Payroll Portal
            </p>
            <p className="text-[10px] text-slate-500 truncate max-w-xs mx-auto mt-0.5">
              {config?.companyAddress || '303, Panchsheel chs ltd, taloja phase -01, navi mumbai -410208'}
            </p>
          </div>
        </div>

        {/* Security Auto-Logout Alert Banner (If Session Timed Out) */}
        {logoutNotice === 'inactivity' && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-3 shadow-lg animate-in fade-in duration-200">
            <Clock className="w-5 h-5 shrink-0 text-amber-400 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <strong className="block text-amber-200 font-extrabold text-xs">
                Screen Inactivity Auto-Logout
              </strong>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                Aapki screen 10 minute se idle thi. Security aur privacy ke liye session automatically logout ho gaya hai. Dobara login karein.
              </p>
            </div>
          </div>
        )}

        {logoutNotice === 'manual' && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 shadow-lg animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-semibold">Aap successfully logout ho chuke hain.</span>
          </div>
        )}

        {/* Clean Sign In Card - Only Login ID and Password */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
          
          <div className="text-center border-b border-slate-800/80 pb-3">
            <h2 className="text-base font-bold text-white">Sign In to Your Account</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Apna Login ID aur Password darj karein.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Form: ONLY Login ID and Password */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Input 1: Login ID */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Login ID</span>
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
                placeholder="Enter Login ID (e.g. admin or EMP-101)"
                className="w-full p-3.5 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
            </div>

            {/* Input 2: Password with Eye Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Password</span>
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
                  placeholder="Enter Password"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all mt-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Verifying...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Security badge footer */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Role-Based Auto Access • Inactivity Auto-Logout Protected</span>
        </div>

      </div>

    </div>
  );
}
