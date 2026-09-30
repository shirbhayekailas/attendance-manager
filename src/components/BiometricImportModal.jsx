import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  Download, 
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';
import { calculateWorkDuration } from '../utils/attendanceCalculations';
import { sounds } from '../utils/sound';

export default function BiometricImportModal({
  isOpen,
  onClose,
  employees = [],
  attendance = {},
  setAttendance,
  onSaveToast
}) {
  const [fileData, setFileData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Handle CSV/Text file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setErrorMsg("File is empty or does not have data rows.");
          return;
        }

        // Header parsing
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
        const idIdx = headers.findIndex(h => h.includes('id') || h.includes('emp') || h.includes('badge') || h.includes('code'));
        const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('day'));
        const inIdx = headers.findIndex(h => h.includes('in') || h.includes('punchin') || h.includes('start'));
        const outIdx = headers.findIndex(h => h.includes('out') || h.includes('punchout') || h.includes('end'));
        const otIdx = headers.findIndex(h => h.includes('ot') || h.includes('overtime'));

        if (idIdx === -1 || dateIdx === -1 || inIdx === -1) {
          setErrorMsg("Could not detect standard headers. Please ensure columns include: Employee ID, Date, In Time, Out Time.");
          return;
        }

        const parsedRows = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length <= Math.max(idIdx, dateIdx, inIdx)) continue;

          let empId = cols[idIdx];
          let rawDate = cols[dateIdx];
          let inTime = cols[inIdx] || '--';
          let outTime = (outIdx !== -1 && cols[outIdx]) ? cols[outIdx] : '--';
          let customOt = (otIdx !== -1 && cols[otIdx]) ? parseFloat(cols[otIdx]) : null;

          // Format date if in DD/MM/YYYY or DD-MM-YYYY format
          let formattedDate = rawDate;
          if (rawDate.includes('/')) {
            const parts = rawDate.split('/');
            if (parts.length === 3) {
              if (parts[2].length === 4) {
                // DD/MM/YYYY -> YYYY-MM-DD
                formattedDate = `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
              }
            }
          } else if (rawDate.includes('-') && rawDate.split('-')[0].length !== 4) {
            const parts = rawDate.split('-');
            if (parts.length === 3 && parts[2].length === 4) {
              // DD-MM-YYYY -> YYYY-MM-DD
              formattedDate = `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
            }
          }

          // Match Employee Name
          const emp = employees.find(e => e.id.toLowerCase() === empId.toLowerCase() || e.id.replace(/\D/g, '') === empId.replace(/\D/g, ''));
          const resolvedEmpId = emp ? emp.id : empId;
          const empName = emp ? emp.name : 'Unknown Staff';

          // Compute duration & Overtime
          const hasPunches = inTime !== '--' && outTime !== '--';
          const dur = hasPunches ? calculateWorkDuration(inTime, outTime) : null;
          const workingHours = dur ? dur.workingHours : (hasPunches ? '8h 00m' : '--');
          const autoOt = dur ? dur.overtimeHours : 0;
          const finalOt = customOt !== null && !isNaN(customOt) ? customOt : autoOt;

          parsedRows.push({
            empId: resolvedEmpId,
            empName,
            date: formattedDate,
            clockIn: inTime,
            clockOut: outTime,
            workingHours,
            overtimeHours: finalOt,
            status: hasPunches ? 'present' : 'absent',
            isRecognized: !!emp,
          });
        }

        if (parsedRows.length === 0) {
          setErrorMsg("No valid punch data rows found.");
        } else {
          setFileData(parsedRows);
          sounds.playSuccess();
        }
      } catch (err) {
        setErrorMsg("Failed to parse file: " + err.message);
      }
    };

    reader.readAsText(file);
  };

  // Download Sample Biometric CSV
  const handleDownloadSample = () => {
    sounds.playSuccess();
    const headers = 'Employee ID,Date,In Time,Out Time,Overtime Hours';
    const sampleRows = [
      'EMP-101,2026-09-30,09:25 AM,07:30 PM,1',
      'EMP-102,2026-09-30,09:30 AM,06:30 PM,0',
      'EMP-103,2026-09-30,09:15 AM,08:30 PM,2',
      'EMP-104,2026-09-30,09:30 AM,06:30 PM,0',
      'EMP-105,2026-09-30,09:20 AM,07:00 PM,0.5',
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...sampleRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'biometric_punch_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import into Attendance Database
  const handleConfirmImport = () => {
    if (fileData.length === 0) return;
    setIsProcessing(true);
    sounds.playSuccess();

    const updated = { ...attendance };
    let importedCount = 0;

    fileData.forEach((row) => {
      const { date, empId, clockIn, clockOut, workingHours, overtimeHours, status } = row;
      if (!updated[date]) updated[date] = {};
      updated[date][empId] = {
        ...(updated[date][empId] || {}),
        status,
        clockIn,
        clockOut,
        workingHours,
        overtimeHours,
        note: "Imported via Biometric Punch File",
      };
      importedCount++;
    });

    setAttendance(updated);
    setIsProcessing(false);
    onClose();
    onSaveToast(`Successfully imported ${importedCount} biometric punch logs into attendance records!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scale-up my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Import Biometric &amp; Excel Punch Logs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload CSV or Excel file exported from gate scanner (eSSL, Realtime, ZKTeco, BioMax)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Zone */}
        {fileData.length === 0 ? (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/20 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Click to browse or drag &amp; drop Biometric CSV file
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Standard format: Employee ID, Date, In Time, Out Time, Overtime
              </p>
              <input
                type="file"
                accept=".csv, .txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Template Download */}
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Don't have a template yet?
                </p>
                <p className="text-[11px] text-slate-400">
                  Download sample CSV format compatible with AttendFlow Pro
                </p>
              </div>
              <button
                onClick={handleDownloadSample}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 shadow-sm border border-slate-200 dark:border-slate-600 flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV</span>
              </button>
            </div>
          </div>
        ) : (
          /* Preview Data Table */
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Found <strong className="text-blue-600 dark:text-blue-400">{fileData.length} records</strong> in {fileName}:
              </span>
              <button
                onClick={() => setFileData([])}
                className="text-xs text-rose-500 hover:underline font-semibold"
              >
                Choose another file
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-y-auto max-h-64 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[10.5px] uppercase font-bold text-slate-400 sticky top-0">
                  <tr>
                    <th className="p-2.5">Staff Code</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">In - Out</th>
                    <th className="p-2.5">Work Hrs</th>
                    <th className="p-2.5">Overtime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {fileData.slice(0, 50).map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2 font-bold text-slate-800 dark:text-slate-200">
                        {r.empId} <span className="text-[10px] text-slate-400 font-normal font-sans">({r.empName})</span>
                      </td>
                      <td className="p-2 text-slate-600 dark:text-slate-300">{r.date}</td>
                      <td className="p-2 text-slate-700 dark:text-slate-200">{r.clockIn} - {r.clockOut}</td>
                      <td className="p-2 text-slate-500">{r.workingHours}</td>
                      <td className="p-2">
                        {r.overtimeHours > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-bold">
                            +{r.overtimeHours}h OT
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {fileData.length > 50 && (
              <p className="text-[11px] text-slate-400 text-center italic">
                ...and {fileData.length - 50} more records ready to sync.
              </p>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isProcessing}
                className="px-5 py-2.5 text-xs font-black rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Import All {fileData.length} Punches</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
