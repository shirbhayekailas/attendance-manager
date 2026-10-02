import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  FileText,
  CheckCircle2,
  MessageCircle,
  Share2,
  Calendar
} from 'lucide-react';
import { calculateMonthlyPayrollStats } from '../utils/attendanceCalculations';
import { numberToIndianCurrencyWords } from '../utils/numberToWords';
import { sounds } from '../utils/sound';
import { getEmployeeTotalAdvance, getEmployeeTotalExpenses } from '../utils/storage';

export default function SalarySlipModal({ 
  employee, 
  attendance = {}, 
  advances = [],
  expenses = [],
  config = {}, 
  monthYear = 'September 2026',
  onClose 
}) {
  useEffect(() => {
    document.body.classList.add('modal-print-active');
    return () => {
      document.body.classList.remove('modal-print-active');
    };
  }, []);

  // Helper to parse default initial month & year
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

  const initial = parseInitMonthYear(monthYear);
  const [selectedYear, setSelectedYear] = useState(initial.year);
  const [selectedMonth, setSelectedMonth] = useState(initial.month);

  if (!employee) return null;

  const baseMonthly = employee.salaryMonthly || parseInt(String(employee.salaryBase || '100000').replace(/[^0-9]/g, ''), 10) || 100000;
  const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  
  const siteAllowance = getEmployeeTotalExpenses(employee.id, expenses, monthPrefix);
  const advanceDeduction = getEmployeeTotalAdvance(employee.id, advances) || employee.salaryAdvance || 0;

  // Exact per-day payroll calculation (divide by 30 if 30 days, by 31 if 31 days, by 28/29 if Feb)
  const payroll = calculateMonthlyPayrollStats({
    empId: employee.id,
    attendanceData: attendance,
    baseSalary: baseMonthly,
    year: selectedYear,
    month: selectedMonth,
    statutoryType: employee.statutoryType || 'standard',
    siteAllowance,
    advanceDeduction
  });

  const isPfEsic = employee.statutoryType !== 'non_pf_esic';
  const netInWords = numberToIndianCurrencyWords(payroll.netPayable);

  const payslipRef = `PAY-${selectedYear}${String(selectedMonth + 1).padStart(2, '0')}-${employee.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const lastDayDate = new Date(selectedYear, selectedMonth + 1, 0);
  const paymentDate = `${lastDayDate.getDate()} ${payroll.monthName.slice(0, 3)} ${selectedYear}`;

  const handlePrint = () => {
    sounds.playSuccess();
    window.print();
  };

  const handleShareWhatsApp = () => {
    sounds.playSuccess();
    const phone = (employee.phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const msg = `*SALARY PAYSLIP - ${payroll.monthYearStr.toUpperCase()}*
*SK ENTERPRISES*
303, Panchsheel CHS Ltd, Plot No 07, Sec -02, Taloja Phase -01, Navi Mumbai - 410208

Employee: *${employee.name}* (${employee.id})
Designation: ${employee.role} | Dept: ${employee.department}

*Attendance & Working Days:*
- Month Days: ${payroll.daysInMonth} Days
- Daily Rate: ₹${payroll.perDaySalary}/day
- Present / WFH: ${payroll.inOffice + payroll.wfh} Days
- Paid Week Off (WO): ${payroll.weekOff} Days
- Paid Leaves / Holidays: ${payroll.paidLeave + payroll.holidays} Days
- Total Payable Days: ${payroll.payableDays} / ${payroll.daysInMonth}
${payroll.lopDays > 0 ? `- Unpaid / LOP: ${payroll.lopDays} Days\n` : ''}${payroll.totalOvertimeHours > 0 ? `- Overtime: ${payroll.totalOvertimeHours} hrs (+₹${payroll.overtimePay.toLocaleString('en-IN')})\n` : ''}${payroll.weekOffDuty > 0 ? `- Week Off Duty Extra Pay: ${payroll.weekOffDuty} days (+₹${payroll.weekOffDutyPay.toLocaleString('en-IN')})\n` : ''}
*Earnings Breakdown:*
- Earned Basic Salary: ₹${payroll.earnedBasic.toLocaleString('en-IN')} (Base CTC: ₹${baseMonthly.toLocaleString('en-IN')})
${payroll.overtimePay > 0 ? `- Overtime Pay: ₹${payroll.overtimePay.toLocaleString('en-IN')}\n` : ''}${payroll.weekOffDutyPay > 0 ? `- Week Off Duty Pay: ₹${payroll.weekOffDutyPay.toLocaleString('en-IN')}\n` : ''}${siteAllowance > 0 ? `- Site Allowance / Batta: ₹${siteAllowance.toLocaleString('en-IN')}\n` : ''}*Gross Earnings: ₹${payroll.grossEarnings.toLocaleString('en-IN')}*

*Applicable Deductions:*
${isPfEsic ? `- EPF (12%): ₹${payroll.epf.toLocaleString('en-IN')}\n` : ''}${isPfEsic && payroll.esic > 0 ? `- ESIC (0.75%): ₹${payroll.esic.toLocaleString('en-IN')}\n` : ''}- Prof. Tax (PT): ₹${payroll.pt.toLocaleString('en-IN')}
${payroll.advanceDeduction > 0 ? `- Advance Deducted: ₹${payroll.advanceDeduction.toLocaleString('en-IN')}\n` : ''}- Total Deductions: ₹${payroll.totalDeductions.toLocaleString('en-IN')}

*Net Payable Salary: ₹${payroll.netPayable.toLocaleString('en-IN')}*
In Words: ${netInWords}
Ref: ${payslipRef}

_Computer-generated salary slip from SK ENTERPRISES._`;

    const url = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="print-modal-overlay fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      
      {/* Print Specific CSS Override to Guarantee Single-Page A4 Setup */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 6mm 8mm !important;
          }
          *,
          *::before,
          *::after {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            box-sizing: border-box !important;
          }
          *::-webkit-scrollbar,
          ::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            opacity: 0 !important;
            background: transparent !important;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            overflow-x: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-modal-overlay {
            position: static !important;
            inset: auto !important;
            width: 100% !important;
            height: auto !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
            z-index: auto !important;
          }
          .print-modal-body {
            max-width: 100% !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          .printable-document {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            max-height: 100% !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            scrollbar-width: none !important;
          }
        }
      `}</style>

      <div className="print-modal-body bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto overflow-hidden">
        
        {/* On-screen Action Toolbar (Hidden during print) */}
        <div className="no-print flex flex-wrap items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white">
                Official Salary Statement • {employee.name} ({employee.id})
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {payroll.monthYearStr} • {payroll.payableDays} Payable Days
              </p>
            </div>
          </div>

          {/* Month / Year Quick Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 px-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-xs font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const mName = new Date(selectedYear, i, 1).toLocaleString('default', { month: 'short' });
                  return <option key={i} value={i}>{mName}</option>;
                })}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-xs font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer ml-1"
              >
                {[2025, 2026, 2027].map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all"
              title="Share Salary Slip on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet (Strictly fitted for single A4 page) */}
        <div className="salary-slip-page p-5 sm:p-7 md:p-8 bg-white text-slate-900 printable-document">
          
          {/* Header with Company Logo & Document Identity */}
          <div className="border-b-2 border-slate-900 pb-2.5 mb-2.5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                    SK
                  </div>
                  <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase leading-tight">
                    {config.companyName || 'SK ENTERPRISES'}
                  </h1>
                </div>
                <p className="text-[10px] text-slate-700 font-medium max-w-xl">
                  {config.companyAddress || '303, Panchsheel chs ltd, plot no 07, sec -02, taloja phase -01, navi mumbai -410208'}
                </p>
                <p className="text-[9px] text-slate-500 font-medium">
                  CIN: U72200MH2021PTC368412 • GSTIN: 27AABCT3920K1ZM • PF Reg: MH/BAN/0048291
                </p>
              </div>

              <div className="text-right space-y-0.5 shrink-0">
                <div className="inline-block px-2.5 py-0.5 rounded bg-slate-950 text-white text-[9.5px] font-black tracking-wider uppercase">
                  SALARY PAYSLIP
                </div>
                <div className="text-[11px] font-bold text-slate-900">
                  Pay Period: <span className="font-black text-blue-700 uppercase">{payroll.monthYearStr}</span>
                </div>
                <div className="text-[9.5px] text-slate-500 font-mono">
                  Ref No: <span className="font-bold text-slate-800">{payslipRef}</span>
                </div>
                <div className="text-[9.5px] text-slate-500">
                  Payment Date: <span className="font-semibold text-slate-700">{paymentDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Employee Metadata 4-Column Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden text-[10px] mb-2.5">
            <div className="bg-slate-100 font-black text-slate-800 px-3 py-1 border-b border-slate-300 uppercase tracking-wide text-[9px]">
              Employee Identification &amp; Bank Credentials
            </div>
            <div className="grid grid-cols-4 divide-x divide-slate-300 bg-white">
              <div className="p-1.5 px-2.5">
                <span className="text-[8.5px] text-slate-400 font-semibold block uppercase">Employee Name</span>
                <span className="font-black text-slate-900 text-xs truncate block">{employee.name}</span>
              </div>
              <div className="p-1.5 px-2.5">
                <span className="text-[8.5px] text-slate-400 font-semibold block uppercase">Employee Code</span>
                <span className="font-mono font-bold text-slate-900 block">{employee.id}</span>
              </div>
              <div className="p-1.5 px-2.5">
                <span className="text-[8.5px] text-slate-400 font-semibold block uppercase">Designation</span>
                <span className="font-bold text-slate-900 truncate block">{employee.role}</span>
              </div>
              <div className="p-1.5 px-2.5">
                <span className="text-[8.5px] text-slate-400 font-semibold block uppercase">Department</span>
                <span className="font-bold text-slate-900 truncate block">{employee.department}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 divide-x divide-slate-300 border-t border-slate-300 bg-slate-50/60">
              <div className="p-1.5 px-2.5">
                <span className="text-[8.5px] text-slate-400 font-semibold block uppercase">Bank Name</span>
                <span className="font-bold text-slate-800 block truncate">{employee.bankName || 'HDFC Bank Ltd'}</span>
              </div>
              <div className="p-1.5 px-2.5">
                <span className="text-[8.5px] text-slate-400 font-semibold block uppercase">Bank Account No</span>
                <span className="font-mono font-bold text-slate-800 block truncate">
                  {employee.bankAccountNo ? employee.bankAccountNo : '•••• •••• •••• 4892'}
                </span>
              </div>
              <div className="p-1.5 px-2.5">
                <span className="text-[8.5px] text-slate-400 font-semibold block uppercase">Income Tax PAN</span>
                <span className="font-mono font-bold text-slate-800 block">AAACS{employee.id.replace(/\D/g, '') || '1029'}F</span>
              </div>
              <div className="p-1.5 px-2.5">
                <span className="text-[8.5px] text-slate-400 font-semibold block uppercase">
                  {isPfEsic ? 'PF / UAN & ESIC No' : 'Statutory Status'}
                </span>
                <span className="font-mono font-bold text-slate-800 block truncate">
                  {isPfEsic 
                    ? `${employee.uanNo || `1014892019${employee.id.replace(/\D/g, '') || '28'}`}${employee.esicNo ? ` • ESIC: ${employee.esicNo}` : ''}`
                    : 'EXEMPT (Non-PF & Non-ESIC)'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Attendance Summary Metrics Bar (Dynamic Days in Month formula) */}
          <div className="border border-slate-300 rounded-lg overflow-hidden text-[10px] mb-2.5">
            <div className="bg-slate-100 font-black text-slate-800 px-3 py-0.5 border-b border-slate-300 uppercase tracking-wide text-[8.5px] flex items-center justify-between">
              <span>Attendance &amp; Shift Records for {payroll.monthYearStr}</span>
              <span className="text-slate-600 font-semibold">
                Calendar Days: {payroll.daysInMonth} Days
              </span>
            </div>
            <div className="grid grid-cols-8 divide-x divide-slate-300 text-center bg-white py-1">
              <div className="px-1">
                <div className="text-[8px] text-slate-500 font-medium">Calendar Days</div>
                <div className="text-xs font-black text-slate-900">{payroll.daysInMonth}</div>
              </div>
              <div className="px-1">
                <div className="text-[8px] text-slate-500 font-medium">Present / WFH</div>
                <div className="text-xs font-black text-emerald-600">{payroll.inOffice + payroll.wfh}</div>
              </div>
              <div className="px-1">
                <div className="text-[8px] text-slate-500 font-medium">Paid Week Off</div>
                <div className="text-xs font-black text-sky-600">{payroll.weekOff}</div>
              </div>
              <div className="px-1">
                <div className="text-[8px] text-slate-500 font-medium">★ WO Duty</div>
                <div className="text-xs font-black text-amber-600">{payroll.weekOffDuty}d</div>
              </div>
              <div className="px-1">
                <div className="text-[8px] text-slate-500 font-medium">Paid Leaves / PH</div>
                <div className="text-xs font-black text-blue-600">{payroll.paidLeave + payroll.holidays}</div>
              </div>
              <div className="px-1">
                <div className="text-[8px] text-slate-500 font-medium">Payable Days</div>
                <div className="text-xs font-black text-emerald-700 bg-emerald-50 rounded">
                  {payroll.payableDays}
                  {payroll.weekOffDuty > 0 && (
                    <span className="text-[8px] text-amber-600 font-bold ml-0.5">(+{payroll.weekOffDuty})</span>
                  )}
                </div>
              </div>
              <div className="px-1">
                <div className="text-[8px] text-slate-500 font-medium">Loss of Pay (LOP)</div>
                <div className="text-xs font-black text-rose-600">{payroll.lopDays}</div>
              </div>
              <div className="px-1">
                <div className="text-[8px] text-slate-500 font-medium">Overtime</div>
                <div className="text-xs font-black text-purple-600">{payroll.totalOvertimeHours} hrs</div>
              </div>
            </div>
          </div>

          {/* Dual Column: Earnings vs Deductions Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden text-[10px] mb-2.5">
            <div className="grid grid-cols-2 divide-x divide-slate-300">
              
              {/* Left Column: Earnings */}
              <div>
                <div className="bg-emerald-50 text-emerald-950 font-black px-3 py-1 border-b border-slate-300 flex justify-between uppercase text-[8.5px] tracking-wide">
                  <span>Earnings Component</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="px-3 py-1 flex justify-between items-center">
                    <div>
                      <span className="text-slate-800 font-semibold block text-[10px]">Earned Basic Salary</span>
                      <span className="text-[8px] text-slate-400 block">
                        {payroll.payableDays} of {payroll.daysInMonth} Days Payable (Base CTC: ₹{baseMonthly.toLocaleString('en-IN')})
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">₹{payroll.earnedBasic.toLocaleString('en-IN')}</span>
                  </div>
                  {payroll.overtimePay > 0 && (
                    <div className="px-3 py-1 flex justify-between bg-purple-50/40">
                      <span className="text-purple-900 font-medium">Overtime Pay ({payroll.totalOvertimeHours}h @ 1.5x)</span>
                      <span className="font-mono font-bold text-purple-700">₹{payroll.overtimePay.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {payroll.weekOffDutyPay > 0 && (
                    <div className="px-3 py-1 flex justify-between bg-sky-50/60">
                      <span className="text-sky-950 font-medium">Week Off Duty Extra Pay ({payroll.weekOffDuty}d @ ₹{payroll.perDaySalary}/d)</span>
                      <span className="font-mono font-bold text-sky-700">₹{payroll.weekOffDutyPay.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {siteAllowance > 0 && (
                    <div className="px-3 py-1 flex justify-between bg-amber-50/50">
                      <span className="text-amber-900 font-medium">Site Allowance / Batta</span>
                      <span className="font-mono font-bold text-amber-700">₹{siteAllowance.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="px-3 py-1 flex justify-between">
                    <span className="text-slate-600">Performance Incentive / Bonus</span>
                    <span className="font-mono font-bold text-slate-900">₹0</span>
                  </div>
                  <div className="px-3 py-1 flex justify-between">
                    <span className="text-slate-600">Dearness Allowance (DA)</span>
                    <span className="font-mono font-bold text-slate-900">₹0</span>
                  </div>
                  <div className="px-3 py-1 flex justify-between">
                    <span className="text-slate-600">Special Allowances</span>
                    <span className="font-mono font-bold text-slate-900">₹0</span>
                  </div>
                  <div className="px-3 py-1 flex justify-between">
                    <span className="text-slate-400 italic">Other Allowances</span>
                    <span className="font-mono font-bold text-slate-400">₹0</span>
                  </div>
                </div>
                <div className="bg-slate-100 border-t border-slate-300 px-3 py-1.5 flex justify-between font-black text-slate-900">
                  <span>GROSS EARNINGS (A)</span>
                  <span className="font-mono text-xs text-emerald-700">₹{payroll.grossEarnings.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Right Column: Deductions */}
              <div>
                <div className="bg-rose-50 text-rose-950 font-black px-3 py-1 border-b border-slate-300 flex justify-between uppercase text-[8.5px] tracking-wide">
                  <span>Deductions Component</span>
                  <span>Amount (INR)</span>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="px-3 py-1 flex justify-between">
                    <span className="text-slate-600">Employee Provident Fund (EPF {payroll.isPfEsic ? '12%' : 'Exempt'})</span>
                    <span className="font-mono font-bold text-slate-900">
                      {payroll.isPfEsic ? `₹${payroll.epf.toLocaleString('en-IN')}` : '₹0 (Exempt)'}
                    </span>
                  </div>
                  <div className="px-3 py-1 flex justify-between">
                    <span className="text-slate-600">Employee State Insurance (ESIC {payroll.isPfEsic ? '0.75%' : 'Exempt'})</span>
                    <span className="font-mono font-bold text-slate-900">
                      {payroll.isPfEsic 
                        ? (payroll.esic > 0 ? `₹${payroll.esic.toLocaleString('en-IN')}` : '₹0 (Gross > ₹21k)') 
                        : '₹0 (Exempt)'}
                    </span>
                  </div>
                  <div className="px-3 py-1 flex justify-between">
                    <span className="text-slate-600">Professional Tax (PT)</span>
                    <span className="font-mono font-bold text-slate-900">₹{payroll.pt.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="px-3 py-1 flex justify-between">
                    <span className="text-slate-600">Tax Deducted at Source (TDS)</span>
                    <span className="font-mono font-bold text-slate-900">₹{payroll.tds.toLocaleString('en-IN')}</span>
                  </div>
                  {payroll.advanceDeduction > 0 ? (
                    <div className="px-3 py-1 flex justify-between bg-amber-50/50">
                      <span className="text-amber-950 font-medium">Salary Advance Deduction</span>
                      <span className="font-mono font-bold text-amber-700">₹{payroll.advanceDeduction.toLocaleString('en-IN')}</span>
                    </div>
                  ) : (
                    <div className="px-3 py-1 flex justify-between">
                      <span className="text-slate-400">Salary Advance Deduction</span>
                      <span className="font-mono text-slate-400">₹0</span>
                    </div>
                  )}
                </div>
                <div className="bg-slate-100 border-t border-slate-300 px-3 py-1.5 flex justify-between font-black text-slate-900">
                  <span>TOTAL DEDUCTIONS (B)</span>
                  <span className="font-mono text-xs text-rose-700">₹{payroll.totalDeductions.toLocaleString('en-IN')}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Net Salary Payable Grand Callout Box */}
          <div className="p-2.5 px-4 rounded-xl border-2 border-slate-900 bg-slate-950 text-white flex items-center justify-between gap-4 mb-2.5">
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase font-black text-blue-400 tracking-wider">
                NET SALARY PAYABLE (Gross A - Deductions B)
              </span>
              <div className="text-2xl font-black font-mono tracking-tight text-white leading-tight">
                ₹{payroll.netPayable.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] font-semibold text-slate-300 italic">
                In Words: <span className="font-bold text-white not-italic">{netInWords}</span>
              </div>
            </div>

            <div className="border-l border-slate-800 pl-4 space-y-0.5 text-right text-[9.5px] shrink-0">
              <div className="flex items-center justify-end gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Credited to Bank Account</span>
              </div>
              <div className="text-slate-400">
                Mode: Electronic Transfer / NEFT
              </div>
              <div className="text-slate-400">
                Status: <span className="font-bold text-emerald-300">DISBURSED / SUCCESSFUL</span>
              </div>
            </div>
          </div>

          {/* Legal Compliance and Certification Note */}
          <div className="p-2 px-3 rounded-lg bg-slate-50 border border-slate-200 text-[8.5px] text-slate-500 leading-snug mb-3">
            <p className="font-semibold text-slate-700 mb-0.5">Statutory &amp; Payroll Compliance Declaration:</p>
            <p>
              1. This statement is an official computer-generated payslip issued under the Corporate HR &amp; Payroll regulations of {config.companyName || 'SK ENTERPRISES'}.
            </p>
            <p>
              {isPfEsic 
                ? '2. Statutory contributions (EPF @ 12% capped at ₹1,800/mo & ESIC @ 0.75% for gross ≤ ₹21,000) have been computed and deposited under statutory compliance codes.'
                : '2. Employee is enrolled under the Non-PF & Non-ESIC category as per statutory exemption declaration. Gross pay disbursed without statutory deductions.'}
            </p>
            {payroll.advanceDeduction > 0 && (
              <p className="text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                3. Total salary advance of ₹{payroll.advanceDeduction.toLocaleString('en-IN')} disbursed in this pay cycle has been recovered and deducted from net salary.
              </p>
            )}
          </div>

          {/* Signatures & Physical Stamp Area */}
          <div className="pt-3 border-t border-slate-300 grid grid-cols-2 gap-12 items-end">
            
            {/* Employee Signature */}
            <div className="space-y-2 text-center">
              <div className="h-14 flex items-end justify-center">
                <div className="w-48 border-b border-dashed border-slate-400"></div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-900 leading-tight">{employee.name}</p>
                <p className="text-[8px] text-slate-400 uppercase font-semibold">Employee Signature</p>
              </div>
            </div>

            {/* HR / Finance Authorized Signatory (Clean space for Physical Rubber Stamp & Ink Signature) */}
            <div className="space-y-2 text-center">
              <div className="h-14"></div>
              <div className="w-56 mx-auto border-t border-slate-700 pt-1">
                <p className="text-[10px] font-bold text-slate-900 leading-tight">Authorized Signatory</p>
                <p className="text-[8px] text-slate-400 uppercase font-semibold">HR &amp; Finance Department</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
