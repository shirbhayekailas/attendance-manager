import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Fingerprint, 
  Clock, 
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileText
} from 'lucide-react';
import { sounds } from '../utils/sound';
import { calculateWorkDuration } from '../utils/attendanceCalculations';

export default function BiometricImportModal({
  isOpen,
  onClose,
  employees = [],
  attendance = {},
  setAttendance,
  onSaveToast
}) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste' | 'preview'
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [summaryStats, setSummaryStats] = useState({ total: 0, matched: 0, unmatched: 0, dates: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Helper to parse date formats into standard YYYY-MM-DD
  const normalizeDate = (dStr) => {
    if (!dStr) return null;
    const clean = String(dStr).trim().replace(/[/.]/g, '-');
    
    // Check YYYY-MM-DD
    const ymdMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymdMatch) {
      const y = ymdMatch[1];
      const m = String(ymdMatch[2]).padStart(2, '0');
      const d = String(ymdMatch[3]).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Check DD-MM-YYYY
    const dmyMatch = clean.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (dmyMatch) {
      const d = String(dmyMatch[1]).padStart(2, '0');
      const m = String(dmyMatch[2]).padStart(2, '0');
      const y = dmyMatch[3];
      return `${y}-${m}-${d}`;
    }

    return null;
  };

  // Helper to format time into HH:MM (24-hour or 12-hour AM/PM)
  const normalizeTime = (tStr) => {
    if (!tStr) return '--';
    const clean = String(tStr).trim();
    
    // Check 12h AM/PM e.g. "9:15 AM" or "06:30 PM"
    const ampmMatch = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const mins = ampmMatch[2];
      const ampm = (ampmMatch[4] || '').toLowerCase();
      
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      
      return `${String(hours).padStart(2, '0')}:${mins}`;
    }
    
    return clean.slice(0, 5);
  };

  // Process raw tabular text (CSV or Tab-separated copied from Excel)
  const processRawData = (rawText) => {
    setIsProcessing(true);
    try {
      const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length === 0) {
        onSaveToast('No data found in file or pasted text!');
        setIsProcessing(false);
        return;
      }

      // Map employees for quick ID/Code lookup
      const empMap = new Map();
      employees.forEach(emp => {
        empMap.set(String(emp.id).toLowerCase(), emp);
        empMap.set(String(emp.name).toLowerCase(), emp);
        const digits = emp.id.replace(/\D/g, '');
        if (digits) empMap.set(digits, emp);
      });

      const extracted = [];
      const datesSet = new Set();
      let matchedCount = 0;
      let unmatchedCount = 0;

      // Identify if there is a header row
      let startIdx = 0;
      const firstLineLower = lines[0].toLowerCase();
      if (firstLineLower.includes('emp') || firstLineLower.includes('date') || firstLineLower.includes('id') || firstLineLower.includes('time')) {
        startIdx = 1;
      }

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        // Split by tab, comma, or semicolon
        const cols = line.split(/[,\t;]+/).map(c => c.replace(/["']/g, '').trim());
        if (cols.length < 2) continue;

        let empIdentifier = cols[0];
        let dateVal = cols[1];
        let clockIn = cols[2] || '09:00';
        let clockOut = cols[3] || '18:00';

        // Check if date and emp are swapped
        if (normalizeDate(empIdentifier) && !normalizeDate(dateVal)) {
          const temp = empIdentifier;
          empIdentifier = dateVal;
          dateVal = temp;
        }

        const validDate = normalizeDate(dateVal);
        if (!validDate) continue;

        const matchedEmp = empMap.get(String(empIdentifier).toLowerCase()) ||
                           empMap.get(String(empIdentifier).replace(/\D/g, ''));

        const cleanIn = normalizeTime(clockIn);
        const cleanOut = normalizeTime(clockOut);
        
        let status = 'present';
        let durationHours = 8.5;
        let overtimeHours = 0;

        if (cleanIn !== '--' && cleanOut !== '--') {
          const dur = calculateWorkDuration(cleanIn, cleanOut);
          durationHours = dur.workHours;
          overtimeHours = dur.overtimeHours;
          if (dur.isLate) status = 'late';
          if (dur.isHalfDay) status = 'half_day';
        }

        if (matchedEmp) {
          matchedCount++;
        } else {
          unmatchedCount++;
        }

        datesSet.add(validDate);

        extracted.push({
          rowId: `${validDate}-${empIdentifier}-${i}`,
          empId: matchedEmp ? matchedEmp.id : empIdentifier,
          empName: matchedEmp ? matchedEmp.name : `Unknown (${empIdentifier})`,
          isMatched: !!matchedEmp,
          date: validDate,
          clockIn: cleanIn,
          clockOut: cleanOut,
          status,
          overtimeHours,
          durationHours
        });
      }

      setParsedRows(extracted);
      setSummaryStats({
        total: extracted.length,
        matched: matchedCount,
        unmatched: unmatchedCount,
        dates: datesSet.size
      });
      setActiveTab('preview');
      sounds.playSuccess();
    } catch (err) {
      console.error('Error processing biometric data', err);
      onSaveToast('Error parsing biometric data: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle File Upload (.csv, .txt, .tsv)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        processRawData(content);
      }
    };
    reader.readAsText(file);
  };

  // Apply parsed punches to attendance database
  const handleApplyImport = () => {
    if (parsedRows.length === 0) return;

    sounds.playSuccess();
    const updated = { ...(attendance || {}) };

    let successCount = 0;
    parsedRows.forEach(row => {
      if (!row.isMatched) return; // Skip unknown employee IDs
      if (!updated[row.date]) {
        updated[row.date] = {};
      }

      updated[row.date][row.empId] = {
        ...(updated[row.date][row.empId] || {}),
        status: row.status,
        clockIn: row.clockIn,
        clockOut: row.clockOut,
        overtimeHours: row.overtimeHours,
        punchSource: 'biometric_sync',
        lastUpdated: new Date().toISOString()
      };
      successCount++;
    });

    setAttendance(updated);
    onSaveToast(`Successfully imported ${successCount} biometric attendance records!`);
    onClose();
  };

  // Sample CSV template generator
  const downloadSampleTemplate = () => {
    sounds.playSuccess();
    const headers = 'Employee_ID,Date,Punch_In,Punch_Out';
    const sampleRows = employees.slice(0, 3).map((e, idx) => 
      `${e.id},2026-09-${String(idx + 1).padStart(2, '0')},09:05,18:30`
    );
    const content = 'data:text/csv;charset=utf-8,' + [headers, ...sampleRows].join('\n');
    const encoded = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', 'biometric_import_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Biometric Thumb / Face Scanner &amp; Excel Import
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                  Universal Sync
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compatible with eSSL, Realtime, ZKTeco, Matrix or custom Excel / CSV punch logs.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 gap-3 bg-white dark:bg-slate-900 text-xs font-bold">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'upload' 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-black' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload File (CSV / TXT)</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'paste' 
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-black' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Paste from Excel</span>
          </button>

          {parsedRows.length > 0 && (
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-3 border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'preview' 
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-black' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Preview Punches ({parsedRows.length})</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/30 hover:bg-blue-50/20"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Drop Biometric CSV / Excel log file here
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                  Supports CSV, TXT, TSV file exported from thumb scanner machines.
                </p>
                <button
                  type="button"
                  className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all"
                >
                  Browse Device File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Sample Format Advisory */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-blue-950 dark:text-blue-200">
                    Required File Columns:
                  </p>
                  <p className="text-blue-800/80 dark:text-blue-300 font-mono text-[11px]">
                    Employee_ID, Date (YYYY-MM-DD), Punch_In (HH:MM), Punch_Out (HH:MM)
                  </p>
                </div>
                <button
                  onClick={downloadSampleTemplate}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-50 transition shadow-2xs"
                >
                  Download Sample CSV
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Direct Paste from Excel */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Paste rows directly from Excel / Google Sheets:
                </label>
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`EMP-001\t2026-09-01\t09:05\t18:15\nEMP-002\t2026-09-01\t09:20\t18:45\nEMP-003\t2026-09-01\t08:55\t19:30`}
                  className="w-full p-3 font-mono text-xs rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Tip: Copy columns from Excel and paste directly above.
                </span>
                <button
                  onClick={() => processRawData(pastedText)}
                  disabled={!pastedText.trim() || isProcessing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Parse &amp; Preview Punches</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Preview Punches */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              
              {/* Summary Metric Chips */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                  <div className="text-[10px] text-slate-500 font-medium">Total Punches</div>
                  <div className="text-base font-black text-slate-900 dark:text-white">{summaryStats.total}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                  <div className="text-[10px] font-medium">Matched Staff</div>
                  <div className="text-base font-black">{summaryStats.matched}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                  <div className="text-[10px] font-medium">Unique Dates</div>
                  <div className="text-base font-black">{summaryStats.dates}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400">
                  <div className="text-[10px] font-medium">Unrecognized ID</div>
                  <div className="text-base font-black">{summaryStats.unmatched}</div>
                </div>
              </div>

              {/* Parsed List Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[320px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-black text-slate-600 dark:text-slate-400 sticky top-0">
                    <tr>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Staff Member</th>
                      <th className="p-2.5">In / Out Time</th>
                      <th className="p-2.5">Hours</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-mono">
                    {parsedRows.map((row) => (
                      <tr key={row.rowId} className={row.isMatched ? 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40' : 'bg-rose-50/40 dark:bg-rose-950/20'}>
                        <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">
                          {row.date}
                        </td>
                        <td className="p-2.5">
                          <div className="font-sans font-bold text-slate-900 dark:text-white">
                            {row.empName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ID: {row.empId}
                          </div>
                        </td>
                        <td className="p-2.5">
                          <span className="text-emerald-600 font-bold">{row.clockIn}</span>
                          <span className="text-slate-400 mx-1">→</span>
                          <span className="text-blue-600 font-bold">{row.clockOut}</span>
                        </td>
                        <td className="p-2.5 text-[11px]">
                          {row.durationHours}h
                          {row.overtimeHours > 0 && (
                            <span className="text-amber-600 font-bold ml-1">
                              (+{row.overtimeHours}h OT)
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {row.isMatched ? (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              row.status === 'late' 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300' 
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                            }`}>
                              {row.status}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                              Unknown ID
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
          >
            Cancel
          </button>

          {parsedRows.length > 0 && (
            <button
              onClick={handleApplyImport}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply {summaryStats.matched} Punches to Register</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
