import React, { useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download,
  Users
} from 'lucide-react';
import { calculateMonthlyPayrollStats } from '../utils/attendanceCalculations';
import { numberToIndianCurrencyWords } from '../utils/numberToWords';
import { getEmployeeTotalAdvance, getEmployeeTotalExpenses } from '../utils/storage';
import { sounds } from '../utils/sound';

export default function BatchSalarySlipsModal({
  isOpen,
  onClose,
  employees = [],
  attendance = {},
  advances = [],
  expenses = [],
  config = {},
  monthYear = 'September 2026'
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-print-active');
    }
    return () => {
      document.body.classList.remove('modal-print-active');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const parseInitMonthYear = (str) => {
    try {
      const parts = String(str || '').trim().split(' ');
      if (parts.length === 2) {
        const monthNames = [
          'january', 'february', 'march', 'april', 'may', 'june',
          'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const mIdx = monthNames.indexOf(parts[0].toLowerCase());
        const yNum = parseInt(parts[1], 10);
        if (mIdx !== -1 && !isNaN(yNum)) {
          return { year: yNum, month: mIdx };
        }
      }
    } catch (e) {}
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  };

  const parsedMY = parseInitMonthYear(monthYear);

  const handlePrint = () => {
    sounds.playSuccess();
    window.print();
  };

  return (
    <div className="print-modal-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Print Specific CSS to enforce 1 A4 Page per employee */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 8mm 10mm !important;
          }
          .batch-payslip-page {
            page-break-after: always !important;
            break-after: page !important;
            margin-bottom: 0 !important;
            height: auto !important;
            min-height: 98vh !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-slate-100 dark:bg-slate-950 w-full max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Floating Top Bar (Hidden on Print) */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Batch Salary Payslips Register ({employees.length} Staff Members)
              </h3>
              <p className="text-xs text-slate-400">
                Official Letterhead: {config.companyName || 'SK ENTERPRISES'} • {monthYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print All ({employees.length}) Payslips</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container of Payslips */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-8 flex-1">
          {employees.map((employee, index) => {
            const baseMonthly = employee.salaryMonthly || 100000;
            const monthPrefix = `${parsedMY.year}-${String(parsedMY.month + 1).padStart(2, '0')}`;
            const siteAllowance = getEmployeeTotalExpenses(employee.id, expenses, monthPrefix);
            const advanceDeduction = getEmployeeTotalAdvance(employee.id, advances) || 0;

            const payroll = calculateMonthlyPayrollStats({
              empId: employee.id,
              attendanceData: attendance,
              baseSalary: baseMonthly,
              year: parsedMY.year,
              month: parsedMY.month,
              statutoryType: employee.statutoryType || 'standard',
              siteAllowance,
              advanceDeduction
            });

            const netInWords = numberToIndianCurrencyWords(payroll.netPayable);

            return (
              <div 
                key={employee.id} 
                className="batch-payslip-page bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-sm space-y-4"
              >
                {/* Official SK ENTERPRISES Corporate Letterhead */}
                <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-xs shrink-0">
                        SK
                      </div>
                      <h1 className="text-xl font-black uppercase text-slate-950 tracking-tight">
                        {config?.companyName || 'SK ENTERPRISES'}
                      </h1>
                    </div>
                    <p className="text-[10px] text-slate-700 font-medium max-w-xl">
                      {config?.companyAddress || '303, Panchsheel chs ltd, plot no 07, sec -02, taloja phase -01, navi mumbai -410208'}
                    </p>
                    <p className="text-xs text-slate-900 font-black mt-1 uppercase tracking-wide">
                      Monthly Salary Disbursement Slip • {payroll.monthYearStr}
                    </p>
                  </div>

                  <div className="text-right text-xs space-y-0.5">
                    <p className="font-bold text-slate-900">Payslip #{`PAY-${parsedMY.year}${String(parsedMY.month + 1).padStart(2, '0')}-${employee.id}`}</p>
                    <p className="text-slate-600 text-[11px]">Staff Code: {employee.id}</p>
                    <p className="text-[10px] text-slate-500">Cycle: {payroll.daysInMonth} Days (₹{payroll.perDaySalary}/d)</p>
                  </div>
                </div>

                {/* Employee Dossier Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-300 rounded-xl p-3 bg-slate-50/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Employee Name</span>
                    <span className="font-black text-slate-900">{employee.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Department</span>
                    <span className="font-bold text-slate-800">{employee.department}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Designation</span>
                    <span className="font-bold text-slate-800">{employee.role}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Statutory Scheme</span>
                    <span className="font-bold text-blue-700 font-mono text-[11px]">
                      {payroll.isPfEsic ? 'PF & ESIC Applicable' : 'Non-PF & Non-ESIC'}
                    </span>
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="grid grid-cols-8 divide-x divide-slate-300 border border-slate-300 rounded-xl text-center bg-white py-1.5 text-xs">
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Month Days</div>
                    <div className="font-black text-slate-900 text-sm">{payroll.daysInMonth}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Payable Days</div>
                    <div className="font-black text-emerald-600 text-sm">
                      {payroll.payableDays}
                      {payroll.weekOffDuty > 0 && (
                        <span className="text-[9px] text-amber-600 font-bold ml-0.5">(+{payroll.weekOffDuty})</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Office / WFH</div>
                    <div className="font-bold text-slate-800">{payroll.inOffice + payroll.wfh}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Week Off (WO)</div>
                    <div className="font-bold text-sky-600">{payroll.weekOff}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">★ WO Duty</div>
                    <div className="font-bold text-amber-600">{payroll.weekOffDuty}d</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Leaves / PH</div>
                    <div className="font-bold text-purple-600">{payroll.paidLeave + payroll.holidays}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Absent (LOP)</div>
                    <div className="font-bold text-rose-600">{payroll.lopDays}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Overtime</div>
                    <div className="font-black text-amber-600">{payroll.totalOvertimeHours}h</div>
                  </div>
                </div>

                {/* Earnings vs Deductions Table */}
                <div className="grid grid-cols-2 divide-x divide-slate-300 border border-slate-300 rounded-xl overflow-hidden text-xs">
                  {/* Earnings */}
                  <div>
                    <div className="bg-emerald-50 text-emerald-950 font-black px-3 py-1.5 border-b border-slate-300 flex justify-between uppercase text-[10px]">
                      <span>Earnings</span>
                      <span>Amount (INR)</span>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Basic CTC Salary</span>
                        <span className="font-mono font-bold">₹{baseMonthly.toLocaleString('en-IN')}</span>
                      </div>
                      {payroll.overtimePay > 0 && (
                        <div className="flex justify-between text-amber-700 font-bold">
                          <span>Overtime ({payroll.totalOvertimeHours}h @ 1.5x)</span>
                          <span className="font-mono">₹{payroll.overtimePay.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {payroll.weekOffDutyPay > 0 && (
                        <div className="flex justify-between text-sky-700 font-bold">
                          <span>Week Off Duty Extra Pay ({payroll.weekOffDuty}d)</span>
                          <span className="font-mono">+₹{payroll.weekOffDutyPay.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {siteAllowance > 0 && (
                        <div className="flex justify-between text-blue-700 font-bold">
                          <span>Site Allowance / Batta</span>
                          <span className="font-mono">+₹{siteAllowance.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-slate-100 border-t border-slate-300 px-3 py-1.5 flex justify-between font-black text-slate-900">
                      <span>GROSS EARNINGS</span>
                      <span className="font-mono text-emerald-700">₹{payroll.grossEarnings.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div>
                    <div className="bg-rose-50 text-rose-950 font-black px-3 py-1.5 border-b border-slate-300 flex justify-between uppercase text-[10px]">
                      <span>Deductions</span>
                      <span>Amount (INR)</span>
                    </div>
                    <div className="p-3 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Provident Fund (EPF {payroll.isPfEsic ? '12%' : 'Exempt'})</span>
                        <span className="font-mono font-bold">₹{payroll.epf.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">ESIC Contribution</span>
                        <span className="font-mono font-bold">₹{payroll.esic.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Professional Tax (PT)</span>
                        <span className="font-mono font-bold">₹{payroll.pt}</span>
                      </div>
                      {payroll.lopDays > 0 && (
                        <div className="flex justify-between text-rose-700 font-bold">
                          <span>Loss of Pay ({payroll.lopDays}d @ ₹{payroll.perDaySalary}/d)</span>
                          <span className="font-mono">-₹{payroll.lossOfPayDeduction.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {payroll.advanceDeduction > 0 && (
                        <div className="flex justify-between text-amber-700 font-bold">
                          <span>Salary Advance Recovered</span>
                          <span className="font-mono">-₹{payroll.advanceDeduction.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-slate-100 border-t border-slate-300 px-3 py-1.5 flex justify-between font-black text-slate-900">
                      <span>TOTAL DEDUCTIONS</span>
                      <span className="font-mono text-rose-700">₹{payroll.totalDeductions.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Net Pay Highlight Banner */}
                <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Net Salary Payable</span>
                    <span className="text-xs text-blue-200 font-medium">{netInWords}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black font-mono text-emerald-400">
                      ₹{payroll.netPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs text-slate-800">
                  <div className="border-t border-slate-900 pt-1 font-bold">
                    Prepared by / HR Executive
                  </div>
                  <div className="border-t border-slate-900 pt-1 font-bold">
                    Checked by / Finance Officer
                  </div>
                  <div className="border-t border-slate-900 pt-1 font-bold">
                    Employee Signature
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
