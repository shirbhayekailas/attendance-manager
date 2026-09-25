import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  Clock, 
  UserCheck 
} from 'lucide-react';
import { INITIAL_AUDIT_LOGS } from '../data/initialData';
import { sounds } from '../utils/sound';

export default function AuditTrailView({ onSaveToast }) {
  const [logs, setLogs] = useState(INITIAL_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.detail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    sounds.playSuccess();
    const headers = ['Log ID', 'Action', 'Actor', 'Target', 'Details', 'Timestamp'];
    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${l.action}"`,
      `"${l.actor}"`,
      `"${l.target}"`,
      `"${l.detail}"`,
      `"${l.timestamp}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hr_compliance_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSaveToast("Compliance Audit Log exported to CSV!");
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <span>Compliance & Security Audit Trail</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              SOC2 & ISO 27001
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable log of all administrative actions, shift overrides, and leave approvals.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log CSV</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter audit trail events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Event ID</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">Details</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-500 dark:text-slate-400">
                    {log.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 uppercase tracking-wider">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {log.actor}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-semibold">
                    {log.target}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                    {log.detail}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                    {log.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
