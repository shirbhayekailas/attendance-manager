import React, { useState } from 'react';
import { 
  X, 
  IndianRupee, 
  Plus, 
  Trash2, 
  Calendar, 
  Receipt, 
  Check, 
  AlertCircle,
  Truck,
  Coffee,
  Wrench,
  Smartphone
} from 'lucide-react';
import { sounds } from '../utils/sound';

export default function SiteExpenseModal({
  isOpen,
  onClose,
  employees = [],
  initialEmployee = null,
  expenses = [],
  setExpenses,
  onSaveToast
}) {
  const [selectedEmpId, setSelectedEmpId] = useState(() => initialEmployee?.id || employees[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Site Travel / Batta');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const categories = [
    { label: 'Site Travel / Batta', icon: Truck },
    { label: 'Food / Meals Allowance', icon: Coffee },
    { label: 'Emergency Spare Parts / Tools', icon: Wrench },
    { label: 'Mobile / Data Recharge', icon: Smartphone },
    { label: 'Client Delivery / Transport', icon: Truck },
    { label: 'Miscellaneous Site Kharcha', icon: Receipt },
  ];

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    sounds.playSuccess();
    const emp = employees.find(e => e.id === selectedEmpId);
    const newExpense = {
      id: `EXP-${Date.now()}`,
      empId: selectedEmpId,
      empName: emp?.name || selectedEmpId,
      amount: parseFloat(amount),
      category,
      date: expenseDate,
      note: note.trim() || category,
      status: 'approved',
      createdAt: new Date().toISOString(),
    };

    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    setAmount('');
    setNote('');
    onSaveToast(`Added ₹${parseFloat(amount).toLocaleString('en-IN')} site allowance for ${emp?.name || selectedEmpId}!`);
  };

  const handleDeleteExpense = (id) => {
    sounds.playSuccess();
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    onSaveToast("Deleted expense entry");
  };

  const filteredExpenses = selectedEmpId === 'ALL'
    ? expenses
    : expenses.filter(e => e.empId === selectedEmpId);

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scale-up my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Site Kharcha &amp; Daily Allowances (Batta / Travel)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log site travel, meals, fuel, and emergency allowances (auto-added to net salary)
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

        {/* Add Expense Form */}
        <form onSubmit={handleAddExpense} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Employee Selector */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase text-slate-500 mb-1">
                Staff Member
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase text-slate-500 mb-1">
                Allowance Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                {categories.map(c => (
                  <option key={c.label} value={c.label}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[10.5px] font-bold uppercase text-slate-500 mb-1">
                Amount (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs font-black font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[10.5px] font-bold uppercase text-slate-500 mb-1">
                Expense Date
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Reason / Site location (e.g. Travel to Taloja MIDC Site B)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Kharcha</span>
              </button>
            </div>
          </div>
        </form>

        {/* List of Logged Allowances */}
        <div className="flex-1 overflow-hidden flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Recorded Site Allowances ({filteredExpenses.length}):
            </span>
            <span className="font-black text-amber-700 dark:text-amber-400 font-mono">
              Total: ₹{totalFilteredAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-y-auto max-h-56 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {filteredExpenses.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No site allowances recorded yet for this employee.
              </div>
            ) : (
              filteredExpenses.map((exp) => (
                <div key={exp.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{exp.category}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {exp.empName}
                      </span>
                      <span className="text-[10px] text-slate-400">{exp.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      {exp.note}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                      +₹{Number(exp.amount).toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove allowance entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
