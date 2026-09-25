import React, { useEffect } from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  FileText,
  CheckCircle2
} from 'lucide-react';
import { calculateEmployeeStats } from '../utils/attendanceCalculations';
import { numberToIndianCurrencyWords } from '../utils/numberToWords';
import { sounds } from '../utils/sound';
import { getEmployeeTotalAdvance } from '../utils/storage';

export default function SalarySlipModal({ 
  employee, 
  attendance, 
  advances = [],
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

  if (!employee) return null;

  const baseMonthly = employee.salaryMonthly || parseInt(String(employee.salaryBase || '100000').replace(/[^0-9]/g, ''), 10) || 100000;
  const stats = calculateEmployeeStats(employee.id, attendance, baseMonthly, 22);

  const isPfEsic = employee.statutoryType !== 'non_pf_esic';

  // Corporate Salary Structure - Base Salary and Basic Salary are ONE AND THE SAME (100%)
  const basic = baseMonthly;
  const overtimePay = stats.overtimePay || 0;
  const performanceBonus = 0;

  const grossEarnings = basic + overtimePay + performanceBonus;

  // Deductions as per Statutory Option (PF & ESIC vs Non-PF / Non-ESIC)
  let epf = 0;
  let esic = 0;

  if (isPfEsic) {
    // 12% of Basic, standard statutory cap of ₹1,800/mo
    epf = Math.min(Math.round(basic * 0.12), 1800);
    // ESIC 0.75% of Gross if gross <= ₹21,000 statutory limit
    if (grossEarnings <= 21000) {
      esic = Math.round(grossEarnings * 0.0075);
    } else {
      esic = 0;
    }
  }

  const pt = 200;
  const lop = stats.lossOfPayDeduction || 0;
  const advanceDeduction = getEmployeeTotalAdvance(employee.id, advances) || employee.salaryAdvance || 0;
  const taxableSalary = Math.max(0, grossEarnings - (isPfEsic ? basic * 0.12 : 0) - 40000);
  const tds = taxableSalary > 30000 ? Math.round(taxableSalary * 0.05) : 0;

  const totalDeductions = epf + esic + pt + lop + tds + advanceDeduction;
  const netPayable = Math.max(0, grossEarnings - totalDeductions);
  const netInWords = numberToIndianCurrencyWords(netPayable);

  const payslipRef = `PAY-202609-${employee.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const paymentDate = '30 Sep 2026';

  const handlePrint = () => {
    sounds.playSuccess();
    window.print();
  };

  return (
    <div className="print-modal-overlay fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      
      {/* Print Specific CSS Override to Guarantee Single-Page A4 Setup & 100% Clean Render */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 6mm 10mm !important;
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
            overflow-y: visible !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          body > *:not(#root) {
            display: none !important;
            visibility: hidden !important;
            position: absolute !important;
            left: -99999px !important;
          }
          .print-modal-overlay {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
            overflow-x: visible !important;
            overflow-y: visible !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
            inset: auto !important;
            z-index: auto !important;
          }
          .print-modal-body {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            overflow-x: visible !important;
            overflow-y: visible !important;
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          .salary-slip-page {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
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
        <div className="no-print flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white">
                Official Salary Payslip Statement (A4 Single-Page Format)
              </h3>
              <p className="text-[10px] text-slate-500">
                {employee.name} ({employee.id}) • {monthYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF (A4)</span>
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
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                    {config.companyName ? config.companyName.charAt(0) : 'A'}
                  </div>
                  <h1 className="text-lg font-black tracking-tight text-slate-950 uppercase leading-none">
                    {config.companyName || 'AttendFlow Enterprise Solutions Ltd.'}
                  </h1>
                </div>
                <p className="text-[9.5px] text-slate-500 font-medium">
                  CIN: U72200MH2021PTC368412 • GSTIN: 27AABCT3920K1ZM • PF Reg: MH/BAN/0048291
                </p>
                <p className="text-[9.5px] text-slate-500">
                  Global Technology Park, Financial District, Cyber City, Mumbai - 400051
                </p>
              </div>

              <div className="text-right space-y-0.5 shrink-0">
                <div className="inline-block px-2 py-0.5 rounded bg-slate-950 text-white text-[9px] font-black tracking-wider uppercase">
                  SALARY PAYSLIP
                </div>
                <div className="text-[11px] font-bold text-slate-900">
                  Pay Period: <span className="font-black text-blue-700 uppercase">{monthYear}</span>
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
                <span className="font-bold text-slate-800 block">HDFC Bank Limited</span>
              </div>
              <div className="p-1.5 px-2.5">
                <span className="text-[8.5px] text-slate-400 font-semibold block uppercase">Bank Account No</span>
                <span className="font-mono font-bold text-slate-800 block">•••• •••• •••• 4892</span>
              </div>
              <div className="p-1.5 px-2.5">
                <span className="text-[8.5px] text-slate-400 font-semibold block uppercase">Income Tax PAN</span>
                <span className="font-mono font-bold text-slate-800 block">AAACS{employee.id.replace(/\D/g, '') || '1029'}F</span>
              </div>
              <div className="p-1.5 px-2.5">
                <span className="text-[8.5px] text-slate-400 font-semibold block uppercase">
                  {isPfEsic ? 'PF / UAN & ESIC No' : 'Statutory Status'}
                </span>
                <span className="font-mono font-bold text-slate-800 block truncate" title={isPfEsic ? (employee.uanNo || `1014892019${employee.id.replace(/\D/g, '') || '28'}`) : 'Non-PF & Non-ESIC'}>
                  {isPfEsic 
                    ? `${employee.uanNo || `1014892019${employee.id.replace(/\D/g, '') || '28'}`}${employee.esicNo ? ` • ESIC: ${employee.esicNo}` : ''}`
                    : 'EXEMPT (Non-PF & Non-ESIC)'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Attendance Summary Metrics Bar */}
          <div className="border border-slate-300 rounded-lg overflow-hidden text-[10px] mb-2.5">
            <div className="bg-slate-100 font-black text-slate-800 px-3 py-0.5 border-b border-slate-300 uppercase tracking-wide text-[8.5px] flex items-center justify-between">
              <span>Attendance &amp; Shift Records for {monthYear}</span>
              <span className="text-slate-500 font-normal">Base Cycle: 22 Working Days</span>
            </div>
            <div className="grid grid-cols-6 divide-x divide-slate-300 text-center bg-white py-1">
              <div className="px-1">
                <div className="text-[8px] text-slate-500 font-medium">Calendar Days</div>
                <div className="text-xs font-black text-slate-900">30</div>
              </div>
              <div className="px-1">
                <div className="text-[8px] text-slate-500 font-medium">Present / WFH</div>
                <div className="text-xs font-black text-emerald-600">{stats.inOffice + stats.wfh}</div>
              </div>
              <div className="px-1">
                <div className="text-[8px] text-slate-500 font-medium">Approved Leaves</div>
                <div className="text-xs font-black text-blue-600">{stats.paidLeave}</div>
              </div>
              <div className="px-1">
                <div className="text-[8px] text-slate-500 font-medium">Half Days</div>
                <div className="text-xs font-black text-amber-600">{stats.halfDay}</div>
              </div>
              <div className="px-1">
                <div className="text-[8px] text-slate-500 font-medium">Absent (LOP)</div>
                <div className="text-xs font-black text-rose-600">{stats.unpaidAbsent}</div>
              </div>
              <div className="px-1">
                <div className="text-[8px] text-slate-500 font-medium">Overtime Logged</div>
                <div className="text-xs font-black text-purple-600">{stats.totalOvertimeHours} hrs</div>
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
                  <div className="px-3 py-1 flex justify-between">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-mono font-bold text-slate-900">₹{basic.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="px-3 py-1 flex justify-between bg-purple-50/40">
                    <span className="text-purple-900 font-medium">Overtime ({stats.totalOvertimeHours}h @ 1.5x)</span>
                    <span className="font-mono font-bold text-purple-700">₹{overtimePay.toLocaleString('en-IN')}</span>
                  </div>
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
                  <span className="font-mono text-xs text-emerald-700">₹{grossEarnings.toLocaleString('en-IN')}</span>
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
                    <span className="text-slate-600">Employee Provident Fund (EPF {isPfEsic ? '12%' : 'Exempt'})</span>
                    <span className="font-mono font-bold text-slate-900">
                      {isPfEsic ? `₹${epf.toLocaleString('en-IN')}` : '₹0 (Exempt)'}
                    </span>
                  </div>
                  <div className="px-3 py-1 flex justify-between">
                    <span className="text-slate-600">Employee State Insurance (ESIC {isPfEsic ? '0.75%' : 'Exempt'})</span>
                    <span className="font-mono font-bold text-slate-900">
                      {isPfEsic 
                        ? (esic > 0 ? `₹${esic.toLocaleString('en-IN')}` : '₹0 (Gross > ₹21k)') 
                        : '₹0 (Exempt)'}
                    </span>
                  </div>
                  <div className="px-3 py-1 flex justify-between">
                    <span className="text-slate-600">Professional Tax (PT)</span>
                    <span className="font-mono font-bold text-slate-900">₹{pt.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="px-3 py-1 flex justify-between">
                    <span className="text-slate-600">Tax Deducted at Source (TDS)</span>
                    <span className="font-mono font-bold text-slate-900">₹{tds.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="px-3 py-1 flex justify-between bg-rose-50/40">
                    <span className="text-rose-900 font-medium">Loss of Pay ({stats.unpaidAbsent}d LOP)</span>
                    <span className="font-mono font-bold text-rose-700">₹{lop.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="px-3 py-1 flex justify-between bg-amber-50/50">
                    <span className="text-amber-950 font-medium">Salary Advance Deduction</span>
                    <span className="font-mono font-bold text-amber-700">₹{advanceDeduction.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="bg-slate-100 border-t border-slate-300 px-3 py-1.5 flex justify-between font-black text-slate-900">
                  <span>TOTAL DEDUCTIONS (B)</span>
                  <span className="font-mono text-xs text-rose-700">₹{totalDeductions.toLocaleString('en-IN')}</span>
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
                ₹{netPayable.toLocaleString('en-IN')}
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
              1. This statement is an official computer-generated payslip issued under the Corporate HR &amp; Payroll regulations of {config.companyName || 'AttendFlow Enterprise Solutions Ltd.'}. No physical signature is required.
            </p>
            <p>
              {isPfEsic 
                ? '2. Statutory contributions (EPF @ 12% capped at ₹1,800/mo & ESIC @ 0.75% for gross ≤ ₹21,000) have been computed and deposited under statutory compliance codes.'
                : '2. Employee is enrolled under the Non-PF & Non-ESIC category as per statutory exemption declaration. Gross pay disbursed without statutory deductions.'}
            </p>
            {advanceDeduction > 0 && (
              <p className="text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                3. Total salary advance of ₹{advanceDeduction.toLocaleString('en-IN')} disbursed in this pay cycle has been recovered and deducted from net salary.
              </p>
            )}
          </div>

          {/* Signatures & Official Corporate Stamp */}
          <div className="pt-2 border-t border-slate-300 grid grid-cols-3 gap-6 items-end text-center">
            
            {/* Employee Signature */}
            <div className="space-y-2">
              <div className="h-6 border-b border-dashed border-slate-400 mx-6"></div>
              <div>
                <p className="text-[10px] font-bold text-slate-900 leading-tight">{employee.name}</p>
                <p className="text-[8px] text-slate-400 uppercase font-semibold">Employee Signature</p>
              </div>
            </div>

            {/* Official Company Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-blue-900/60 flex flex-col items-center justify-center text-blue-950 p-1 rotate-[-6deg] bg-blue-50/50">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
                <span className="text-[6px] font-black uppercase tracking-widest text-center mt-0.5 leading-none">
                  AUDITED
                </span>
                <span className="text-[5px] font-mono text-slate-600 leading-none">PAYROLL</span>
              </div>
              <span className="text-[8px] text-slate-400 mt-0.5 uppercase font-semibold">Corporate Stamp</span>
            </div>

            {/* HR / Finance Authorized Signatory */}
            <div className="space-y-1">
              <div className="h-6 flex items-center justify-center">
                <span className="font-serif italic font-black text-sm text-blue-950 transform rotate-[-4deg] tracking-wide">
                  S. K. Singhania
                </span>
              </div>
              <div className="border-t border-slate-400 pt-0.5 mx-4">
                <p className="text-[10px] font-bold text-slate-900 leading-tight">Authorized Signatory</p>
                <p className="text-[8px] text-slate-400 uppercase font-semibold">VP - Human Resources &amp; Finance</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
