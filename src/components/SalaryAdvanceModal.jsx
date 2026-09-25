import React, { useState } from 'react';
import { 
  X, 
  IndianRupee, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Trash2, 
  AlertCircle, 
  FileText,
  User,
  PlusCircle,
  Building,
  ArrowDownCircle
} from 'lucide-react';
import { sounds } from '../utils/sound';

export default function SalaryAdvanceModal({
  isOpen,
  onClose,
  employees = [],
  initialEmployee = null,
  advances = [],
  setAdvances,
  onSaveToast
}) {
  const [selectedEmpId, setSelectedEmpId] = useState(() => initialEmployee?.id || employees[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('UPI / Online');
  const [reason, setReason] = useState('Festival / Personal Advance');

  if (!isOpen) return null;

  const currentEmp = employees.find(e => e.id === selectedEmpId) || initialEmployee || employees[0];
  const currentMonthStr = paymentDate ? paymentDate.slice(0, 7) : new Date().toISOString().slice(0, 7);

  // Filter advances for selected employee
  const empAdvances = (advances || []).filter(a => a.empId === selectedEmpId && a.status !== 'cancelled');
  const currentMonthTotal = empAdvances
    .filter(a => !a.month || a.month === currentMonthStr)
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  const basicSalary = currentEmp?.salaryMonthly || 15000;

  const handleRecordAdvance = (e) => {
    e.preventDefault();
    const numAmount = parseInt(String(amount).replace(/[^0-9]/g, ''), 10);
    if (!numAmount || numAmount <= 0) {
      alert("Please enter a valid advance amount (minimum ₹100).");
      return;
    }

    if (numAmount > basicSalary) {
      const confirmExceed = window.confirm(
        `Advance amount (₹${numAmount.toLocaleString('en-IN')}) is higher than the monthly basic salary (₹${basicSalary.toLocaleString('en-IN')}). Do you want to proceed?`
      );
      if (!confirmExceed) return;
    }

    const newRecord = {
      id: `ADV-${Date.now()}`,
      empId: currentEmp.id,
      empName: currentEmp.name,
      amount: numAmount,
      date: paymentDate,
      month: paymentDate.slice(0, 7),
      paymentMode,
      reason: reason.trim() || 'General Salary Advance',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...(advances || [])];
    setAdvances(updated);
    sounds.playSuccess();
    onSaveToast?.(`Recorded ₹${numAmount.toLocaleString('en-IN')} advance for ${currentEmp.name}!`);
    setAmount('');
  };

  const handleDeleteAdvance = (advId, advAmt) => {
    if (window.confirm(`Are you sure you want to cancel and remove this advance entry of ₹${advAmt.toLocaleString('en-IN')}?`)) {
      const updated = (advances || []).filter(a => a.id !== advId);
      setAdvances(updated);
      onSaveToast?.("Advance entry removed.");
    }
  };

  const quickAmounts = [1000, 2000, 5000, 10000];

  return (
    <div className="no-print fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-amber-500/10 dark:bg-amber-500/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md shadow-amber-500/25">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                <span>Employee Salary Advance Entry &amp; Ledger</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold uppercase">
                  Payroll Deduction
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Record advance salary given to staff. Advances are automatically deducted from this month's payslip.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Employee Selector Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                Select Employee *
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full p-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer shadow-sm"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id}) • {emp.department} • Basic: ₹{(emp.salaryMonthly || 15000).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Balance Summary Box */}
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Month Advance</span>
                <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
                  ₹{currentMonthTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly Basic</span>
                <span className="text-base font-black font-mono text-slate-800 dark:text-slate-200">
                  ₹{basicSalary.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* New Advance Entry Form */}
          <form onSubmit={handleRecordAdvance} className="p-4 sm:p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-4">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                + New Advance Payment Entry
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Advance Amount (INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    required
                    min="100"
                    step="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Quick Add Chips */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {quickAmounts.map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(String((parseInt(amount || '0', 10) || 0) + val))}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 transition-colors"
                    >
                      +₹{val >= 1000 ? `${val/1000}k` : val}
                    </button>
                  ))}
                  {amount && (
                    <button
                      type="button"
                      onClick={() => setAmount('')}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Disbursement Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full p-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="UPI / Online">📱 UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">🏦 Bank Transfer (NEFT / IMPS)</option>
                  <option value="Cash">💵 Cash in Hand</option>
                  <option value="Cheque">📜 Bank Cheque</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason / Remarks for Advance
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Festival advance, Medical emergency, Home expense"
                  className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Entry</span>
                </button>
              </div>
            </div>
          </form>

          {/* Advance History Ledger for this Employee */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Advance History for {currentEmp?.name} ({empAdvances.length} Records)</span>
              </h4>
              <span className="text-[10.5px] text-slate-400">
                Sorted by most recent
              </span>
            </div>

            {empAdvances.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500">No active advance records for {currentEmp?.name}.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Use the form above to add a new advance disbursement.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Payment Mode</th>
                      <th className="py-2.5 px-3">Reason / Remarks</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {empAdvances.map(adv => (
                      <tr key={adv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                          {adv.date}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                          ₹{adv.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {adv.paymentMode}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-[180px] truncate" title={adv.reason}>
                          {adv.reason}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Deductible in Payslip
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleDeleteAdvance(adv.id, adv.amount)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                            title="Cancel / Void Advance"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Compliance Notice */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2 text-xs text-blue-900 dark:text-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Statutory Payroll Auto-Sync:</p>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-snug">
                Employee ke liye add kiya gaya advance unke **Salary Payslip** ke "Deductions" column aur **Monthly Payroll Register** me automatically minus hoke aayega.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Total active advances across company: <strong className="text-slate-800 dark:text-slate-200 font-mono font-bold">{advances.length} records</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors"
          >
            Done / Close
          </button>
        </div>

      </div>
    </div>
  );
}
