import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Building, 
  Home, 
  ScanFace, 
  CreditCard, 
  ShieldCheck, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/sound';
import { calculateWorkDuration } from '../utils/attendanceCalculations';

export default function KioskView({ 
  employees, 
  attendance, 
  setAttendance, 
  config, 
  onSaveToast 
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [punchMode, setPunchMode] = useState('office'); // 'office' | 'wfh'
  const [scanMethod, setScanMethod] = useState('face'); // 'face' | 'badge' | 'manual'
  const [isScanning, setIsScanning] = useState(false);
  const [recentPunches, setRecentPunches] = useState([]);
  const [lastPunchAlert, setLastPunchAlert] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const dayRecords = attendance[todayStr] || {};

  const handleSimulateScan = (emp) => {
    if (!emp) return;
    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      executePunch(emp, 'Clock-In');
    }, 900);
  };

  const executePunch = (emp, action = 'Clock-In') => {
    const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const currentRec = dayRecords[emp.id] || {};

    const hour = currentTime.getHours();
    const min = currentTime.getMinutes();
    const isLate = action === 'Clock-In' && (hour > 9 || (hour === 9 && min > 45));
    const status = isLate && punchMode === 'office' ? 'late' : punchMode === 'wfh' ? 'wfh' : 'present';

    const clockInVal = action === 'Clock-In' ? timeStr : (currentRec.clockIn || timeStr);
    const clockOutVal = action === 'Clock-Out' ? timeStr : (currentRec.clockOut || "--");
    const duration = action === 'Clock-Out' ? calculateWorkDuration(clockInVal, clockOutVal) : { workingHours: "Active Shift", overtimeHours: 0 };

    const updated = {
      ...attendance,
      [todayStr]: {
        ...dayRecords,
        [emp.id]: {
          ...currentRec,
          status,
          clockIn: clockInVal,
          clockOut: clockOutVal,
          workingHours: duration.workingHours,
          overtimeHours: duration.overtimeHours,
          note: isLate ? "Punch-in delayed" : punchMode === 'wfh' ? "Remote Clock-In" : "Regular Shift",
        }
      }
    };

    setAttendance(updated);

    const punchData = {
      empId: emp.id,
      name: emp.name,
      avatar: emp.avatar,
      department: emp.department,
      action,
      status: status.toUpperCase(),
      time: timeStr,
      mode: punchMode,
    };

    setRecentPunches([punchData, ...recentPunches.slice(0, 6)]);
    setLastPunchAlert({
      type: action === 'Clock-In' ? 'in' : 'out',
      msg: action === 'Clock-In'
        ? `Access Granted! Welcome to office, ${emp.name}. Recorded at ${timeStr}.`
        : `Shift Completed! Goodbye ${emp.name}. Clock-out logged at ${timeStr}.`,
      emp,
    });
    setSelectedEmpId('');

    sounds.playSuccess();
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (e) {}

    onSaveToast(`${action} Confirmed: ${emp.name} (${timeStr})`);
  };

  const handleManualPunch = (action) => {
    if (!selectedEmpId) return;
    const emp = employees.find(e => e.id.toLowerCase() === selectedEmpId.toLowerCase());
    if (!emp) {
      sounds.playWarning();
      alert("Employee ID not recognized in database!");
      return;
    }
    executePunch(emp, action);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* High-Tech Biometric Terminal */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-7 sm:p-9 rounded-3xl border border-blue-900/40 shadow-2xl relative overflow-hidden text-center">
        
        {/* Subtle decorative grid lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

        {/* Top Header pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 text-blue-300 text-xs font-bold mb-4 border border-blue-500/30">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Biometric & Smart Badge Terminal • Terminal ID #01-A</span>
        </div>

        {/* Big Live Digital Clock */}
        <div className="text-5xl sm:text-7xl font-black tracking-tight font-mono text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-indigo-300">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 font-semibold">
          {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {/* Scan Method Switcher */}
        <div className="mt-8 flex justify-center">
          <div className="flex p-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 max-w-sm w-full">
            <button
              onClick={() => {
                sounds.playSuccess();
                setScanMethod('face');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                scanMethod === 'face' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>Face AI Scan</span>
            </button>

            <button
              onClick={() => {
                sounds.playSuccess();
                setScanMethod('badge');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                scanMethod === 'badge' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>RFID Badge</span>
            </button>

            <button
              onClick={() => {
                sounds.playSuccess();
                setScanMethod('manual');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                scanMethod === 'manual' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Manual ID</span>
            </button>
          </div>
        </div>

        {/* METHOD 1: FACE RECOGNITION SIMULATOR */}
        {scanMethod === 'face' && (
          <div className="mt-6 max-w-md mx-auto space-y-4">
            <div className="relative mx-auto w-48 h-48 rounded-3xl bg-slate-900 border-2 border-dashed border-blue-500/50 flex flex-col items-center justify-center p-4 overflow-hidden shadow-inner">
              <ScanFace className="w-16 h-16 text-blue-400 opacity-60" />
              {isScanning ? (
                <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-xs flex flex-col items-center justify-center space-y-2">
                  <div className="w-full h-1 bg-blue-400 shadow-lg shadow-blue-400 animate-pulse"></div>
                  <span className="text-[11px] font-mono font-bold text-white bg-blue-600 px-2 py-0.5 rounded">
                    Analyzing Face Biometrics...
                  </span>
                </div>
              ) : (
                <div className="mt-2 text-center">
                  <span className="text-[11px] font-bold text-slate-300 block">Camera Lens Active</span>
                  <span className="text-[9px] text-slate-400">Position face inside frame</span>
                </div>
              )}
            </div>

            {/* Quick Demo Face Scanner Trigger */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400">Tap Any Staff Member to Simulate Instant Face Check-In:</label>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {employees.slice(0, 5).map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => handleSimulateScan(emp)}
                    disabled={isScanning}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl border border-white/10 text-xs font-bold text-white transition-all"
                  >
                    <img src={emp.avatar} alt={emp.name} className="w-5 h-5 rounded-full object-cover" />
                    <span>{emp.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* METHOD 2: RFID BADGE SCANNER SIMULATOR */}
        {scanMethod === 'badge' && (
          <div className="mt-6 max-w-md mx-auto space-y-4">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center space-y-2">
              <CreditCard className="w-12 h-12 text-blue-400 mx-auto animate-bounce" />
              <h4 className="text-sm font-bold text-white">Tap NFC / RFID Employee Smart Badge</h4>
              <p className="text-xs text-slate-400">Hold badge near contactless sensor to log punch</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400">Simulate Badge Tap:</label>
              <div className="grid grid-cols-2 gap-2">
                {employees.slice(0, 4).map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => executePunch(emp, 'Clock-In')}
                    className="flex items-center gap-2 p-2.5 bg-white/10 hover:bg-blue-600 rounded-xl border border-white/10 text-xs font-bold text-left transition-all"
                  >
                    <img src={emp.avatar} alt={emp.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    <div className="truncate">
                      <div className="truncate text-white">{emp.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{emp.id}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* METHOD 3: MANUAL EMP ID PUNCH */}
        {scanMethod === 'manual' && (
          <div className="mt-6 max-w-md mx-auto space-y-3.5">
            <div className="flex p-1 bg-white/10 rounded-2xl backdrop-blur-md max-w-xs mx-auto">
              <button
                onClick={() => setPunchMode('office')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  punchMode === 'office' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>In-Office Desk</span>
              </button>
              <button
                onClick={() => setPunchMode('wfh')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  punchMode === 'wfh' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Remote (WFH)</span>
              </button>
            </div>

            <input
              type="text"
              placeholder="Enter Employee ID (e.g. EMP-101)..."
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full px-4 py-3.5 text-sm sm:text-base rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-md font-mono"
            />

            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="">Or Select Name from Employee Roster...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.id}) • {emp.department}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleManualPunch('Clock-In')}
                disabled={!selectedEmpId}
                className="py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>Punch IN</span>
              </button>

              <button
                onClick={() => handleManualPunch('Clock-Out')}
                disabled={!selectedEmpId}
                className="py-3.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Punch OUT</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Audio / Visual Confirmation Alert */}
        {lastPunchAlert && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 flex items-center justify-center gap-3 animate-fade-in max-w-md mx-auto">
            <img 
              src={lastPunchAlert.emp.avatar} 
              alt={lastPunchAlert.emp.name} 
              className="w-11 h-11 rounded-2xl object-cover border-2 border-emerald-400"
            />
            <div className="text-left">
              <p className="text-xs font-bold text-white">
                {lastPunchAlert.msg}
              </p>
              <p className="text-[11px] text-emerald-300 font-semibold mt-0.5">
                {lastPunchAlert.emp.role} • {lastPunchAlert.emp.department}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Terminal Live Activity Log */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Real-Time Biometric Punch Stream</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-bold">Auto-Logged</span>
        </div>

        {recentPunches.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Terminal ready for clock-ins. Tap any employee card or face profile above to log punch!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentPunches.map((punch, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <img src={punch.avatar} alt={punch.name} className="w-9 h-9 rounded-2xl object-cover" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {punch.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {punch.empId} • {punch.department} • {punch.mode === 'wfh' ? 'Remote' : 'In-Office'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    punch.action === 'Clock-In'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {punch.action}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 font-mono font-bold text-xs">
                    {punch.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
