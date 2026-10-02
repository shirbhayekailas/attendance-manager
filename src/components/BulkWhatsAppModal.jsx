import React, { useState } from 'react';
import { 
  X, 
  MessageCircle, 
  Send, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Users, 
  Copy, 
  Check, 
  PhoneCall, 
  Sparkles 
} from 'lucide-react';
import { sounds } from '../utils/sound';

export default function BulkWhatsAppModal({
  isOpen,
  onClose,
  employees = [],
  monthYear = 'September 2026',
  config = {},
  onSaveToast
}) {
  const [sentMap, setSentMap] = useState({}); // { empId: boolean }
  const [copiedId, setCopiedId] = useState(null);

  if (!isOpen) return null;

  const totalStaff = employees.length;
  const sentCount = Object.keys(sentMap).length;
  const progressPercent = totalStaff > 0 ? Math.round((sentCount / totalStaff) * 100) : 0;

  // Generate clean WhatsApp payslip message for an employee
  const buildWhatsAppMessage = (emp) => {
    const stats = emp.overallStats || {};
    const payable = emp.payableDays || stats.payableDays || 0;
    const gross = emp.earnedSalary || stats.grossEarnings || 0;
    const net = emp.netDisbursal || stats.netPayable || 0;
    const advance = emp.advanceAmount || 0;
    const siteAllow = emp.siteAllowance || 0;

    return `*OFFICIAL SALARY DISBURSEMENT - ${monthYear.toUpperCase()}*
*${config.companyName || 'SK ENTERPRISES'}*
${config.companyAddress || '303, Panchsheel chs ltd, sec -02, taloja phase -01, navi mumbai -410208'}

Dear *${emp.name}* (ID: ${emp.id}),
Aapki ${monthYear} ki salary ka hisab aur bank credit detail niche anusar hai:

- Role / Department: ${emp.role} • ${emp.department}
- Total Working / Payable Days: *${payable} Days*
- Gross Earnings: *₹${gross.toLocaleString('en-IN')}*
${siteAllow > 0 ? `- Site Allowance / Batta: +₹${siteAllow.toLocaleString('en-IN')}\n` : ''}${advance > 0 ? `- Salary Advance Deducted: -₹${advance.toLocaleString('en-IN')}\n` : ''}- Total Deductions (EPF/ESIC/PT): -₹${(emp.deductionsAmount || stats.totalDeductions || 200).toLocaleString('en-IN')}
-------------------------------------
*NET SALARY CREDITED: ₹${net.toLocaleString('en-IN')}*
Bank Account: ${emp.bankAccountNo ? '••••' + emp.bankAccountNo.slice(-4) : 'NEFT / Bank Transfer'}
Status: *DISBURSED / SUCCESSFUL*

_Official system payslip from ${config.companyName || 'SK ENTERPRISES'}._`;
  };

  const handleSendSingle = (emp) => {
    sounds.playSuccess();
    const phone = (emp.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const msg = buildWhatsAppMessage(emp);

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
    setSentMap(prev => ({ ...prev, [emp.id]: true }));
    onSaveToast(`Dispatched salary slip to ${emp.name} on WhatsApp!`);
  };

  const handleCopyText = (emp) => {
    sounds.playSuccess();
    const msg = buildWhatsAppMessage(emp);
    navigator.clipboard.writeText(msg);
    setCopiedId(emp.id);
    setTimeout(() => setCopiedId(null), 2000);
    onSaveToast(`Copied salary text for ${emp.name}!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/60 dark:bg-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Bulk WhatsApp Payslip Delivery Desk
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                  {monthYear}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Send official net salary statements directly to staff WhatsApp numbers with 1 click.
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

        {/* Progress Tracker Bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Delivery Progress:
            </span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              {sentCount} of {totalStaff} Staff Notified ({progressPercent}%)
            </span>
          </div>

          <div className="w-48 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Employees List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-2.5">
          {employees.map((emp) => {
            const isSent = !!sentMap[emp.id];
            const net = emp.netDisbursal || emp.overallStats?.netPayable || 0;

            return (
              <div 
                key={emp.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  isSent 
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSent 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {isSent ? <Check className="w-4 h-4" /> : emp.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{emp.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({emp.id})</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Phone: <span className="font-bold text-slate-700 dark:text-slate-300">{emp.phone || 'Not Registered'}</span>
                    </p>
                  </div>
                </div>

                {/* Amount & Status */}
                <div className="text-right">
                  <span className="text-xs font-black font-mono text-slate-900 dark:text-white block">
                    ₹{net.toLocaleString('en-IN')}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${
                    isSent ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}>
                    {isSent ? 'Sent on WhatsApp' : 'Pending Send'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopyText(emp)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                    title="Copy Message Text"
                  >
                    {copiedId === emp.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleSendSingle(emp)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
                      isSent 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100' 
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                    }`}
                  >
                    <Send className="w-3 h-3" />
                    <span>{isSent ? 'Resend' : 'Send WhatsApp'}</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Tip: Click "Send WhatsApp" row-by-row to dispatch slips to each member.
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold transition"
          >
            Done &amp; Close
          </button>
        </div>

      </div>
    </div>
  );
}
