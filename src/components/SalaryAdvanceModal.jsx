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
  ArrowDownCircle,
  CheckCheck,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles
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
  const [entryType, setEntryType] = useState('advance'); // 'advance' (given) | 'repayment' (deduct/paid back)
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('UPI / Online');
  const [reason, setReason] = useState('Festival / Personal Advance');

  if (!isOpen) return null;

  const currentEmp = employees.find(e => e.id === selectedEmpId) || initialEmployee || employees[0];
  const currentMonthStr = paymentDate ? paymentDate.slice(0, 7) : new Date().toISOString().slice(0, 7);

  // Filter advances for selected employee (excluding completely voided/cancelled ones)
  const empAdvances = (advances || []).filter(a => a.empId === selectedEmpId && a.status !== 'cancelled');

  // Total Advance Given
  const totalGiven = empAdvances
    .filter(a => a.type !== 'repayment' && a.type !== 'received')
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  // Total Settled or Repaid
  const totalSettledOrRepaid = empAdvances
    .reduce((sum, a) => {
      const amt = Number(a.amount) || 0;
      if (a.status === 'settled' || a.status === 'paid' || a.status === 'cleared') {
        return sum + amt;
      }
      if (a.type === 'repayment' || a.type === 'received') {
        return sum + amt;
      }
      return sum;
    }, 0);

  // Net active outstanding balance: active advances minus active repayments
  const netOutstanding = Math.max(0, empAdvances.reduce((sum, a) => {
    const amt = Number(a.amount) || 0;
    if (a.status === 'settled' || a.status === 'paid' || a.status === 'cleared') return sum;
    if (a.type === 'repayment' || a.type === 'received') return sum - amt;
    return sum + amt;
  }, 0));

  const basicSalary = currentEmp?.salaryMonthly || 15000;

  const handleRecordEntry = (e) => {
    e.preventDefault();
    const numAmount = parseInt(String(amount).replace(/[^0-9]/g, ''), 10);
    if (!numAmount || numAmount <= 0) {
      alert("Please enter a valid amount (minimum ₹100).");
      return;
    }

    if (entryType === 'advance' && numAmount > basicSalary) {
      const confirmExceed = window.confirm(
        `Advance amount (₹${numAmount.toLocaleString('en-IN')}) is higher than the monthly basic salary (₹${basicSalary.toLocaleString('en-IN')}). Do you want to proceed?`
      );
      if (!confirmExceed) return;
    }

    const isRepayment = entryType === 'repayment';
    const newRecord = {
      id: `${isRepayment ? 'PAY' : 'ADV'}-${Date.now()}`,
      empId: currentEmp.id,
      empName: currentEmp.name,
      amount: numAmount,
      type: entryType,
      date: paymentDate,
      month: paymentDate.slice(0, 7),
      paymentMode,
      reason: reason.trim() || (isRepayment ? 'Repayment / Settlement of Advance' : 'General Salary Advance'),
      status: isRepayment ? 'settled' : 'active',
      createdAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...(advances || [])];
    setAdvances(updated);
    sounds.playSuccess();
    onSaveToast?.(isRepayment 
      ? `✓ Deducted ₹${numAmount.toLocaleString('en-IN')} payment received from ${currentEmp.name}'s outstanding balance!` 
      : `Recorded ₹${numAmount.toLocaleString('en-IN')} advance for ${currentEmp.name}!`);
    setAmount('');
  };

  const handleToggleSettle = (advId) => {
    const target = (advances || []).find(a => a.id === advId);
    if (!target) return;
    const isCurrentlySettled = target.status === 'settled' || target.status === 'paid' || target.status === 'cleared';
    const nextStatus = isCurrentlySettled ? 'active' : 'settled';

    const updated = (advances || []).map(a => {
      if (a.id === advId) {
        return {
          ...a,
          status: nextStatus,
          settledAt: nextStatus === 'settled' ? new Date().toISOString() : null,
        };
      }
      return a;
    });

    setAdvances(updated);
    sounds.playSuccess();
    if (nextStatus === 'settled') {
      onSaveToast?.(`✓ ₹${Number(target.amount).toLocaleString('en-IN')} marked as Settled/Paid! Deducted from active outstanding.`);
    } else {
      onSaveToast?.(`Advance marked as Active again.`);
    }
  };

  const handleSettleAll = () => {
    const unsettled = empAdvances.filter(a => a.status !== 'settled' && a.status !== 'paid' && a.type !== 'repayment');
    if (unsettled.length === 0) {
      alert("No active unsettled advances found for this employee.");
      return;
    }

    if (!window.confirm(`Are you sure you want to mark all active advances (₹${netOutstanding.toLocaleString('en-IN')}) as fully PAID & SETTLED for ${currentEmp.name}? Outstanding balance will become ₹0.`)) {
      return;
    }

    const updated = (advances || []).map(a => {
      if (a.empId === selectedEmpId && a.status !== 'cancelled') {
        return {
          ...a,
          status: 'settled',
          settledAt: new Date().toISOString()
        };
      }
      return a;
    });

    setAdvances(updated);
    sounds.playSuccess();
    onSaveToast?.(`✓ All advances settled for ${currentEmp.name}! Outstanding balance is now ₹0.`);
  };

  const handleDeleteAdvance = (advId, advAmt) => {
    if (window.confirm(`Are you sure you want to cancel and remove this entry of ₹${advAmt.toLocaleString('en-IN')}?`)) {
      const updated = (advances || []).filter(a => a.id !== advId);
      setAdvances(updated);
      onSaveToast?.("Entry removed from ledger.");
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
                <span>Employee Salary Advance &amp; Repayment Ledger</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold uppercase">
                  Auto-Deduction Sync
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Advance issue karein ya payment receive karke outstanding amount turant deduct/settle karein.
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
          
          {/* Employee Selector Bar & 3-Part Financial Summary */}
          <div className="space-y-3">
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

              {netOutstanding > 0 && (
                <button
                  type="button"
                  onClick={handleSettleAll}
                  className="self-end sm:self-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Mark all pending advances as paid and settled"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Settle All (₹{netOutstanding.toLocaleString('en-IN')})</span>
                </button>
              )}
            </div>

            {/* 3-Box Ledger KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Given</span>
                  <span className="text-base font-black font-mono text-slate-800 dark:text-slate-100">
                    ₹{totalGiven.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Total Repaid / Settled</span>
                  <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-300">
                    ₹{totalSettledOrRepaid.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                netOutstanding > 0 
                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60' 
                  : 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
              }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  netOutstanding > 0 
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' 
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                }`}>
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <span className={`text-[10px] uppercase font-bold block ${
                    netOutstanding > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                  }`}>
                    Net Outstanding Balance
                  </span>
                  <span className={`text-base font-black font-mono ${
                    netOutstanding > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {netOutstanding > 0 ? `₹${netOutstanding.toLocaleString('en-IN')}` : '₹0 (All Cleared)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* New Transaction Form (Advance vs Repayment) */}
          <form onSubmit={handleRecordEntry} className="p-4 sm:p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-4">
            
            {/* Entry Mode Toggle */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                  New Ledger Transaction
                </h4>
              </div>

              {/* Type Selector Tabs */}
              <div className="flex p-0.5 bg-slate-200/80 dark:bg-slate-800 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setEntryType('advance');
                    setReason('Festival / Personal Advance');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    entryType === 'advance' 
                      ? 'bg-amber-500 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>💸 Advance Given</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEntryType('repayment');
                    setReason('Repayment / Cash Refund');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    entryType === 'repayment' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>📥 Payment Received (Deduct)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {entryType === 'advance' ? 'Advance Amount (INR) *' : 'Payment Received (INR) *'}
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
                  Transaction Date *
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
                  <option value="Salary Slip Deduction">📋 Monthly Payslip Adjustment</option>
                  <option value="Cheque">📜 Bank Cheque</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason / Remarks
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={entryType === 'advance' ? 'e.g. Festival advance, Medical emergency, Home expense' : 'e.g. Returned via GPay, Cash received'}
                  className="w-full p-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className={`w-full py-2 px-3 text-xs font-bold rounded-xl text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                    entryType === 'advance'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{entryType === 'advance' ? 'Record Advance' : 'Deduct & Settle'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Advance History Ledger for this Employee */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Ledger History for {currentEmp?.name} ({empAdvances.length} Records)</span>
              </h4>
              <span className="text-[10.5px] text-slate-400">
                Sorted by most recent
              </span>
            </div>

            {empAdvances.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500">No advance or repayment records for {currentEmp?.name}.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Use the form above to add a new transaction.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Payment Mode</th>
                      <th className="py-2.5 px-3">Reason / Remarks</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {empAdvances.map(adv => {
                      const isRepayment = adv.type === 'repayment' || adv.type === 'received';
                      const isSettled = adv.status === 'settled' || adv.status === 'paid' || adv.status === 'cleared';

                      return (
                        <tr key={adv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                            {adv.date}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              isRepayment 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {isRepayment ? '📥 Repayment' : '💸 Advance'}
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 font-mono font-bold ${
                            isRepayment 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : isSettled 
                                ? 'text-slate-400 line-through' 
                                : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {isRepayment ? '-' : ''}₹{adv.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {adv.paymentMode}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-[160px] truncate" title={adv.reason}>
                            {adv.reason}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isSettled ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                ✓ Settled / Paid
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                Active Unpaid
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {!isRepayment && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleSettle(adv.id)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                    isSettled
                                      ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                                      : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  }`}
                                  title={isSettled ? 'Mark advance as Active unpaid' : 'Mark as fully Paid / Settled (Deduct from outstanding)'}
                                >
                                  {isSettled ? '↺ Reactivate' : '✓ Mark Paid'}
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteAdvance(adv.id, adv.amount)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                                title="Delete entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Compliance & Auto-Sync Notice */}
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Enterprise Outstanding Balance Sync:</p>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-snug">
                Jab bhi aap kisi advance ko <strong>"✓ Mark Paid"</strong> karte hain ya <strong>"📥 Payment Received"</strong> add karte hain, wo employee ke <strong>Net Outstanding Balance</strong> aur <strong>Monthly Salary Slip</strong> se turant deduct ho jata hai.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Current employee outstanding: <strong className={netOutstanding > 0 ? "text-rose-600 font-mono font-bold" : "text-emerald-600 font-mono font-bold"}>₹{netOutstanding.toLocaleString('en-IN')}</strong>
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
