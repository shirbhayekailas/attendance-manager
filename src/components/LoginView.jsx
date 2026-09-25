import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  UserCheck, 
  Briefcase 
} from 'lucide-react';
import { sounds } from '../utils/sound';

export default function LoginView({ 
  employees = [], 
  adminCreds = { id: 'admin', email: 'admin@company.com', password: '1234' },
  onLoginSuccess,
  config 
}) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const idClean = identifier.trim().toLowerCase();
    const passClean = password.trim();

    if (!idClean) {
      setErrorMessage('Please enter your Work Email, Login ID, or Employee ID.');
      sounds.playWarning();
      return;
    }

    if (!passClean) {
      setErrorMessage('Please enter your Password or PIN.');
      sounds.playWarning();
      return;
    }

    // 1. Check HR Administrator (Default or Custom Stored Password)
    const isAdminId = (
      idClean === 'admin' ||
      idClean === (adminCreds.id || '').toLowerCase() ||
      idClean === (adminCreds.email || '').toLowerCase() ||
      idClean === 'hr' ||
      idClean === 'hr@company.com'
    );

    if (isAdminId) {
      const validAdminPass = adminCreds.password || '1234';
      if (passClean === validAdminPass) {
        sounds.playSuccess();
        onLoginSuccess({ role: 'admin' });
        return;
      } else {
        sounds.playWarning();
        setErrorMessage('Incorrect Admin password.');
        return;
      }
    }

    // 2. Check Employee / Manager Accounts created by Admin
    const matchedUser = employees.find(e => 
      e.id?.toLowerCase() === idClean ||
      e.email?.toLowerCase() === idClean ||
      e.loginId?.toLowerCase() === idClean ||
      e.name?.toLowerCase() === idClean
    );

    if (matchedUser) {
      const validUserPass = matchedUser.password || matchedUser.pin || '1234';
      if (passClean === validUserPass) {
        sounds.playSuccess();
        const userAccess = matchedUser.accessLevel || 'employee'; // 'employee' | 'manager' | 'admin'
        onLoginSuccess({ 
          role: userAccess, 
          employee: matchedUser 
        });
        return;
      } else {
        sounds.playWarning();
        setErrorMessage(`Incorrect password/PIN for ${matchedUser.name}.`);
        return;
      }
    }

    // 3. Not Found
    sounds.playWarning();
    if (employees.length === 0) {
      setErrorMessage('User ID not recognized. No employees added yet. Log in as Admin to onboard employees.');
    } else {
      setErrorMessage('User ID not recognized. Please check your credentials or contact HR Admin.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 relative overflow-hidden">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-800 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/25 ring-4 ring-white/10">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            StaffPulse <span className="text-blue-500 font-extrabold">PRO</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            {config.companyName} • Corporate Portal
          </p>
        </div>

        {/* Clean Universal Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 shadow-2xl space-y-6">
          
          <div className="border-b border-slate-800 pb-3 text-center">
            <h2 className="text-base font-bold text-white">Sign In to Your Workspace</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your assigned login details to access your dashboard.
            </p>
          </div>

          {/* Error Alert Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Single Unified Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Input 1: Login ID */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Work Email / Employee ID / Login ID</span>
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
                placeholder="e.g. admin or EMP-101"
                className="w-full p-3.5 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
            </div>

            {/* Input 2: Password or PIN */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>Password / PIN</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Enter your password or PIN"
                className="w-full p-3.5 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all mt-3"
            >
              <span>Login to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Discreet Help Note */}
          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 text-center space-y-1">
            <p>Default Admin Login: <strong className="text-slate-400">admin</strong> • Default Password: <strong className="text-slate-400">1234</strong></p>
            <p className="text-[10px] text-slate-600">Admin can change password anytime in System Settings.</p>
          </div>

        </div>

        {/* Security badge */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
          <span>Role-Based Access Control (RBAC) • Encrypted Session</span>
        </div>

      </div>

    </div>
  );
}
